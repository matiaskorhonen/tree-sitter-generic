#include "tree_sitter/parser.h"

enum TokenType {
  LINE_COMMENT,
  BLOCK_COMMENT,
  HTML_COMMENT,
  TRIPLE_QUOTED_STRING,
};

void *tree_sitter_generic_external_scanner_create(void) { return NULL; }

void tree_sitter_generic_external_scanner_destroy(void *payload) {}

unsigned tree_sitter_generic_external_scanner_serialize(void *payload,
                                                        char *buffer) {
  return 0;
}

void tree_sitter_generic_external_scanner_deserialize(void *payload,
                                                      const char *buffer,
                                                      unsigned length) {}

static bool scan_slash_comment(TSLexer *lexer, const bool *valid_symbols) {
  // Positioned at '/'
  lexer->advance(lexer, false);

  if (lexer->lookahead == '/' && valid_symbols[LINE_COMMENT]) {
    // Line comment: consume until end of line
    lexer->advance(lexer, false);
    while (!lexer->eof(lexer) && lexer->lookahead != '\n') {
      lexer->advance(lexer, false);
    }
    lexer->result_symbol = LINE_COMMENT;
    lexer->mark_end(lexer);
    return true;
  }

  if (lexer->lookahead == '*' && valid_symbols[BLOCK_COMMENT]) {
    // Block comment: consume until */
    lexer->advance(lexer, false);
    while (!lexer->eof(lexer)) {
      if (lexer->lookahead == '*') {
        lexer->advance(lexer, false);
        if (lexer->lookahead == '/') {
          lexer->advance(lexer, false);
          lexer->result_symbol = BLOCK_COMMENT;
          lexer->mark_end(lexer);
          return true;
        }
      } else {
        lexer->advance(lexer, false);
      }
    }
    // Unclosed block comment
    lexer->result_symbol = BLOCK_COMMENT;
    lexer->mark_end(lexer);
    return true;
  }

  return false;
}

static bool scan_html_comment(TSLexer *lexer) {
  // Match <!--
  if (lexer->lookahead != '<') return false;
  lexer->advance(lexer, false);
  if (lexer->lookahead != '!') return false;
  lexer->advance(lexer, false);
  if (lexer->lookahead != '-') return false;
  lexer->advance(lexer, false);
  if (lexer->lookahead != '-') return false;
  lexer->advance(lexer, false);

  // Scan until -->
  int dashes = 0;
  while (!lexer->eof(lexer)) {
    if (lexer->lookahead == '-') {
      dashes++;
      lexer->advance(lexer, false);
    } else if (lexer->lookahead == '>' && dashes >= 2) {
      lexer->advance(lexer, false);
      return true;
    } else {
      dashes = 0;
      lexer->advance(lexer, false);
    }
  }
  return true;
}

static bool scan_triple_quoted_string(TSLexer *lexer) {
  // Match """
  if (lexer->lookahead != '"') return false;
  lexer->advance(lexer, false);
  if (lexer->lookahead != '"') return false;
  lexer->advance(lexer, false);
  if (lexer->lookahead != '"') return false;
  lexer->advance(lexer, false);

  // Scan until closing """
  int quotes = 0;
  while (!lexer->eof(lexer)) {
    if (lexer->lookahead == '"') {
      quotes++;
      lexer->advance(lexer, false);
      if (quotes == 3) return true;
    } else {
      quotes = 0;
      lexer->advance(lexer, false);
    }
  }
  return true;
}

bool tree_sitter_generic_external_scanner_scan(void *payload, TSLexer *lexer,
                                               const bool *valid_symbols) {
  // Skip whitespace
  while (lexer->lookahead == ' ' || lexer->lookahead == '\t' ||
         lexer->lookahead == '\n' || lexer->lookahead == '\r') {
    lexer->advance(lexer, true);
  }

  // Dispatch '/' to handle both // and /* without backtracking
  if (lexer->lookahead == '/' &&
      (valid_symbols[LINE_COMMENT] || valid_symbols[BLOCK_COMMENT])) {
    lexer->mark_end(lexer);
    return scan_slash_comment(lexer, valid_symbols);
  }

  if (valid_symbols[HTML_COMMENT] && lexer->lookahead == '<') {
    lexer->mark_end(lexer);
    lexer->result_symbol = HTML_COMMENT;
    if (scan_html_comment(lexer)) {
      lexer->mark_end(lexer);
      return true;
    }
    return false;
  }

  if (valid_symbols[TRIPLE_QUOTED_STRING] && lexer->lookahead == '"') {
    lexer->mark_end(lexer);
    lexer->result_symbol = TRIPLE_QUOTED_STRING;
    if (scan_triple_quoted_string(lexer)) {
      lexer->mark_end(lexer);
      return true;
    }
    return false;
  }

  return false;
}
