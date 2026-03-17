## Overview

A minimal tree-sitter grammar that provides generic syntax highlighting when no specific language is detected. Inspired by [Boop's built-in lexer](https://github.com/IvanMathy/Boop/blob/main/Boop/Boop/Editor/BoopLexer.swift), used as a fallback in Doop.

## Architecture

The grammar is a flat tokenizer — `source_file` is `repeat(choice(...all tokens..., _other))`. There is no nested structure or AST hierarchy.

- `extras: [/\s/]` — whitespace handled automatically
- `word: _word` with `_word: /[a-zA-Z_]\w*/` — enables word-boundary keyword matching
- `_other: /[^\s]/` — catch-all for unrecognized characters

### External scanner (`src/scanner.c`)

Handles tokens that span multiple lines (tree-sitter regexes can't match across newlines):

- `line_comment` and `block_comment` — both dispatched from `/` in a single pass to avoid backtracking
- `html_comment` — `<!-- ... -->`
- `triple_quoted_string` — `""" ... """`

When `<` is seen, the scanner tries `<!--` first; if it fails, it returns false so the grammar's `tag` rule can match instead.

### Token types

| Node | Patterns | Highlight |
|------|----------|-----------|
| `line_comment` | `// ...` (external scanner) | `@comment` |
| `block_comment` | `/* ... */` (external scanner) | `@comment` |
| `html_comment` | `<!-- ... -->` (external scanner) | `@comment` |
| `hash_comment` | `# ...` | `@comment` |
| `quoted_string` | `"..."`, `'...'`, `` `...` `` with escapes | `@string` |
| `triple_quoted_string` | `"""..."""` (external scanner) | `@string` |
| `json_label` | `"key":` — wins over `quoted_string` via longest match | `@string.special` |
| `number` | `42`, `0xFF`, `3.14`, `1_000`, `1.5e10`, `.5` | `@number` |
| `date` | ISO 8601 (`2026-03-17T12:00:00Z`), RFC 2822 | `@number` |
| `hash` | Hex digests: MD5 (32), SHA-1 (40), SHA-224 (56), SHA-256 (64), SHA-384 (96), SHA-512 (128) | `@string.special` |
| `tag` | `<div>`, `</div>`, `<br />`, `<a href="...">` | `@tag` |
| `attribute` | `var`, `val`, `let`, `if`, `else`, `export`, `import`, `return`, `static`, `fun`, `function`, `func`, `class`, `open`, `new`, `as`, `where`, `select`, `delete`, `add`, `limit`, `update`, `insert` | `@keyword` |
| `keyword` | `true`, `false`, `to`, `string`, `int`, `float`, `double`, `bool`, `boolean`, `from` | `@type` |

## Development

```sh
npm install                  # install tree-sitter-cli
npx tree-sitter generate     # regenerate src/parser.c from grammar.js
npx tree-sitter test         # run test corpus
npx tree-sitter parse FILE   # parse a file and print the tree
```

Generated `src/` files are checked in for downstream Swift package consumers.

## References

- [BoopLexer.swift](https://github.com/IvanMathy/Boop/blob/main/Boop/Boop/Editor/BoopLexer.swift) — Boop's regex-based lexer
- [BoopToken.swift](https://github.com/IvanMathy/Boop/blob/main/Boop/Boop/Editor/BoopToken.swift) — Boop's token types
- [Tree-sitter docs: Creating parsers](https://tree-sitter.github.io/tree-sitter/creating-parsers)
