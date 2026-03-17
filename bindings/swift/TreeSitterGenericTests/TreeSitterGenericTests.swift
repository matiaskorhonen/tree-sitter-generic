import XCTest
import SwiftTreeSitter
import TreeSitterGeneric

final class TreeSitterGenericTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_generic())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Generic grammar")
    }
}
