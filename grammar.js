/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// Boop matches its keyword/attribute lists case-insensitively — the regexes are
// `\b(var|let|...)\b` compiled with `.caseInsensitive`. So "Let", "SELECT",
// "FROM", "String" highlight just like their lowercase forms. Mirror that here.
const COMMON_ATTRIBUTES = [
  "var", "val", "let", "if", "else", "export", "import", "return", "static",
  "fun", "function", "func", "class", "open", "new", "as", "where", "select",
  "delete", "add", "limit", "update", "insert",
];

const MORE_ATTRIBUTES = [
  "true", "false", "to", "string", "int", "float", "double", "bool", "boolean",
  "from",
];

// Turn "let" into "[lL][eE][tT]" — tree-sitter's regex engine has no
// case-insensitive flag, so spell the case-folding out per letter.
function caseInsensitive(word) {
  return word.replace(/[a-zA-Z]/g, (c) => `[${c.toLowerCase()}${c.toUpperCase()}]`);
}

// A case-insensitive alternation over a keyword list. The `word` directive
// (word: $._word) is what enforces Boop's `\b...\b` boundaries: tree-sitter only
// accepts one of these tokens when it spans a whole `_word`, so "insert" never
// matches inside "inserted" and "as" never matches inside "was". prec(1) then
// wins the exact-length tie against `_word` itself so real keywords highlight.
function keywordChoice(words) {
  const alternation = words.map(caseInsensitive).join("|");
  return token(prec(1, new RegExp(`(?:${alternation})`)));
}

module.exports = grammar({
  name: "generic",

  extras: ($) => [/\s/],

  word: ($) => $._word,

  externals: ($) => [
    $.line_comment,
    $.block_comment,
    $.html_comment,
    $.triple_quoted_string,
  ],

  rules: {
    source_file: ($) =>
      repeat(
        choice(
          $.line_comment,
          $.block_comment,
          $.html_comment,
          $.hash_comment,
          $.triple_quoted_string,
          $.json_label,
          $.quoted_string,
          $.date,
          $.hash,
          $.number,
          $.tag,
          $.attribute,
          $.keyword,
          $._word,
          $._other,
        ),
      ),

    // Atomic identifier run. Consuming a whole word here is what gives keywords
    // their word boundaries: "was" is lexed as one `_word`, so "as" can never
    // start a token mid-word, and "inserted" out-matches the "insert" keyword.
    _word: (_) => token(/[a-zA-Z_]\w*/),

    // Comments — line_comment is handled by the external scanner alongside
    // block_comment so that `/` is dispatched without backtracking.

    hash_comment: (_) => token(seq("#", /.*/)),

    // Strings — json_label must come before quoted_string in choice() and
    // tree-sitter will prefer the longer match (string + colon > string alone)
    // Note the `\r\n` exclusions in the body character classes: like Boop's
    // string regex, a quote must be closed on the same line. Without this an
    // apostrophe in prose ("Let's", "can't") would open a string that runs to
    // the next apostrophe many lines away, swallowing everything between.
    json_label: (_) =>
      token(
        seq(
          '"',
          repeat(choice(/[^"\\\r\n]/, seq("\\", /[^\r\n]/))),
          '"',
          /[ \t]*/,
          ":",
        ),
      ),

    quoted_string: (_) =>
      token(
        choice(
          seq('"', repeat(choice(/[^"\\\r\n]/, seq("\\", /[^\r\n]/))), '"'),
          seq("'", repeat(choice(/[^'\\\r\n]/, seq("\\", /[^\r\n]/))), "'"),
          seq("`", repeat(choice(/[^`\\\r\n]/, seq("\\", /[^\r\n]/))), "`"),
        ),
      ),

    // Numbers: hex, decimal with underscores, scientific notation, leading dot
    number: (_) =>
      token(
        choice(
          /0[xX][0-9a-fA-F][0-9a-fA-F_]*/,
          /[0-9][0-9_]*(\.[0-9][0-9_]*)?([eE][+-]?[0-9]+)?/,
          /\.[0-9][0-9_]*([eE][+-]?[0-9]+)?/,
        ),
      ),

    // Dates — ISO 8601 and RFC 2822 style
    date: (_) =>
      token(
        choice(
          // ISO 8601: 2026-03-17T12:00:00Z or 2026-03-17T12:00:00+05:30
          /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?(Z|[+-][0-9]{2}:?[0-9]{2})/,
          // RFC 2822: Mon, 17 Mar 2026 12:00:00 GMT
          /[A-Z][a-z]{2},\s+[0-9]{1,2}\s+[A-Z][a-z]{2}\s+[0-9]{4}\s+[0-9]{2}:[0-9]{2}:[0-9]{2}\s+[A-Z]{2,4}/,
        ),
      ),

    // Hashes — hex strings of known digest lengths
    // MD5 (32), SHA-1 (40), SHA-224 (56), SHA-256 (64), SHA-384 (96), SHA-512 (128)
    // prec(1) so a hex digest that happens to start with a letter (e.g. an MD5
    // beginning "da39…") is tagged as a hash rather than being swallowed by the
    // longest-match `_word` identifier token. Boop's `[a-f0-9]{32}` likewise has
    // no word boundary, so this matches its behaviour.
    hash: (_) =>
      token(
        prec(
          1,
          choice(
            /[a-fA-F0-9]{128}/,
            /[a-fA-F0-9]{96}/,
            /[a-fA-F0-9]{64}/,
            /[a-fA-F0-9]{56}/,
            /[a-fA-F0-9]{40}/,
            /[a-fA-F0-9]{32}/,
          ),
        ),
      ),

    // Tags — XML/HTML-like markup
    tag: (_) =>
      token(
        choice(
          // Self-closing: <tag />
          seq("<", /[a-zA-Z][a-zA-Z0-9-]*/, repeat(/\s+[a-zA-Z_][a-zA-Z0-9_-]*\s*=\s*"[^"]*"/), /\s*/, "/>"),
          // Opening: <tag> or <tag attr="val">
          seq("<", /[a-zA-Z][a-zA-Z0-9-]*/, repeat(/\s+[a-zA-Z_][a-zA-Z0-9_-]*\s*=\s*"[^"]*"/), /\s*/, ">"),
          // Closing: </tag>
          seq("</", /[a-zA-Z][a-zA-Z0-9-]*/, /\s*/, ">"),
        ),
      ),

    // Attributes — common keywords across languages (case-insensitive, like Boop)
    attribute: (_) => keywordChoice(COMMON_ATTRIBUTES),

    // Keywords — types and booleans (case-insensitive, like Boop)
    keyword: (_) => keywordChoice(MORE_ATTRIBUTES),

    // Catch-all for unrecognized characters
    _other: (_) => token(/[^\s]/),
  },
});
