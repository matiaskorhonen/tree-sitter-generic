/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "generic",

  extras: ($) => [/\s/],

  word: ($) => $._word,

  externals: ($) => [$.block_comment, $.html_comment, $.triple_quoted_string],

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
          $._other,
        ),
      ),

    // Word rule for keyword boundary matching
    _word: (_) => /[a-zA-Z_]\w*/,

    // Comments
    line_comment: (_) => token(seq("//", /.*/)),

    hash_comment: (_) => token(seq("#", /.*/)),

    // Strings — json_label must come before quoted_string in choice() and
    // tree-sitter will prefer the longer match (string + colon > string alone)
    json_label: (_) =>
      token(
        seq(
          '"',
          repeat(choice(/[^"\\]/, seq("\\", /[^\n]/))),
          '"',
          /\s*/,
          ":",
        ),
      ),

    quoted_string: (_) =>
      token(
        choice(
          seq('"', repeat(choice(/[^"\\]/, seq("\\", /[^\n]/))), '"'),
          seq("'", repeat(choice(/[^'\\]/, seq("\\", /[^\n]/))), "'"),
          seq("`", repeat(choice(/[^`\\]/, seq("\\", /[^\n]/))), "`"),
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

    // Hashes — 32-character hex strings (MD5-like)
    hash: (_) => token(/[a-f0-9]{32}/),

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

    // Attributes — common keywords across languages
    attribute: (_) =>
      choice(
        "var",
        "val",
        "let",
        "if",
        "else",
        "export",
        "import",
        "return",
        "static",
        "fun",
        "function",
        "func",
        "class",
        "open",
        "new",
        "as",
        "where",
        "select",
        "delete",
        "add",
        "limit",
        "update",
        "insert",
      ),

    // Keywords — types and booleans
    keyword: (_) =>
      choice(
        "true",
        "false",
        "to",
        "string",
        "int",
        "float",
        "double",
        "bool",
        "boolean",
        "from",
      ),

    // Catch-all for unrecognized characters
    _other: (_) => token(/[^\s]/),
  },
});
