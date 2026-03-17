/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "generic",

  rules: {
    // TODO: implement
    source_file: $ => "hello",
  },
});
