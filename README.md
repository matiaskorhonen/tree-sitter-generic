# tree-sitter-generic

A minimal [tree-sitter](https://tree-sitter.github.io/) grammar that provides generic syntax highlighting for text when no specific language is detected. Inspired by [Boop's built-in lexer](https://github.com/IvanMathy/Boop/blob/main/Boop/Boop/Editor/BoopLexer.swift).

Rather than parsing a specific language, this grammar tokenizes common patterns found across many languages — comments, strings, numbers, keywords, tags, and more — so that pasted or unknown text gets basic highlighting immediately.

## Token types

| Node | Patterns | Highlight |
|------|----------|-----------|
| `line_comment` | `// ...` | `@comment` |
| `block_comment` | `/* ... */` | `@comment` |
| `html_comment` | `<!-- ... -->` | `@comment` |
| `hash_comment` | `# ...` | `@comment` |
| `quoted_string` | `"..."`, `'...'`, `` `...` `` (with escapes) | `@string` |
| `triple_quoted_string` | `"""..."""` | `@string` |
| `json_label` | `"key":` | `@string.special` |
| `number` | `42`, `0xFF`, `3.14`, `1_000`, `1.5e10` | `@number` |
| `date` | ISO 8601, RFC 2822 timestamps | `@number` |
| `hash` | Hex digest strings — MD5 (32), SHA-1 (40), SHA-256 (64), SHA-512 (128) | `@string.special` |
| `tag` | `<div>`, `</div>`, `<br />` | `@tag` |
| `attribute` | `var`, `let`, `if`, `else`, `return`, `class`, `function`, `import`, `export`, ... | `@keyword` |
| `keyword` | `true`, `false`, `int`, `string`, `bool`, `float`, `double`, `from`, `to` | `@type` |

## Building

```sh
npm install
npx tree-sitter generate
```

## Testing

```sh
npx tree-sitter test
```

## Usage

Parse a file:

```sh
npx tree-sitter parse example.txt
```

Highlight a file (uses `queries/highlights.scm`):

```sh
npx tree-sitter highlight example.txt
```

## Architecture

The grammar is a flat tokenizer — `source_file` is a `repeat(choice(...))` over all token types, with a `_other` catch-all for unrecognized characters. There is no nested structure.

An external scanner (`src/scanner.c`) handles three multi-line token types that tree-sitter's built-in regex engine cannot match across newlines:

- **Block comments** — `/* ... */`
- **HTML comments** — `<!-- ... -->`
- **Triple-quoted strings** — `"""..."""`

The `word` rule ensures keywords match only at word boundaries (e.g., `return` won't match inside `returning`).

## References

- [Boop](https://github.com/IvanMathy/Boop) — the app whose lexer this grammar replicates
- [Tree-sitter: Creating parsers](https://tree-sitter.github.io/tree-sitter/creating-parsers)
