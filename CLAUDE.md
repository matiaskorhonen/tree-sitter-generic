## Problem

When no specific language is detected, Doop falls back to plain text with no syntax highlighting. Boop (the app Doop is inspired by) has a built-in generic lexer ([BoopLexer.swift](https://github.com/IvanMathy/Boop/blob/main/Boop/Boop/Editor/BoopLexer.swift)) that highlights common patterns across languages, making pasted text immediately readable without language detection.

## Proposal

Create a minimal `tree-sitter-generic` grammar that recognizes the same token types as Boop's lexer:

### Token types to support

| Token | Patterns |
|---|---|
| **Comments** | `//`, `/* */`, `<!-- -->`, `#` line comments |
| **Strings** | Single, double, and backtick quotes with escape sequences; triple-quoted strings |
| **Numbers** | Hex (`0x`), decimals with underscores, scientific notation |
| **Attributes** | Common keywords: `var`, `val`, `let`, `if`, `else`, `export`, `import`, `return`, `static`, `fun`, `function`, `func`, `class`, `open`, `new`, `as`, `where`, `select`, `delete`, `add`, `limit`, `update`, `insert` |
| **Keywords** | Types and booleans: `true`, `false`, `to`, `string`, `int`, `float`, `double`, `bool`, `boolean`, `from` |
| **Dates** | UTC/RFC-formatted timestamps |
| **Hashes** | MD5-like 32-character hex strings |
| **Tags** | XML/HTML-like markup (`<tag>`, `</tag>`) |
| **JSON labels** | Quoted identifiers followed by colons |

### Highlights query mapping

```scheme
(comment)   @comment
(string)    @string
(number)    @number
(date)      @number
(hash)      @string.special
(tag)       @tag
(attribute) @keyword
(keyword)   @type
```

### Why tree-sitter instead of a regex lexer

- Tree-sitter handles multi-line strings, nested comments, and edge cases correctly
- Consistent with the existing CodeEditLanguages architecture
- The compiled grammar would be very small (well under 100 KB) since it's just tokenizing
- Incremental parsing means re-highlighting on edits is fast

## References

Follow the `tree-sitter/creating-parsers` documentation on how to create a new Tree Sitter parser.

- [BoopLexer.swift](https://github.com/IvanMathy/Boop/blob/main/Boop/Boop/Editor/BoopLexer.swift) — Boop's regex-based lexer
- [BoopToken.swift](https://github.com/IvanMathy/Boop/blob/main/Boop/Boop/Editor/BoopToken.swift) — Boop's token types
- [Tree-sitter docs: Creating parsers](https://tree-sitter.github.io/tree-sitter/creating-parsers) (https://github.com/tree-sitter/tree-sitter/tree/master/docs/src/creating-parsers)
