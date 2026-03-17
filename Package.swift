// swift-tools-version:5.3

import PackageDescription

let package = Package(
    name: "TreeSitterGeneric",
    products: [
        .library(name: "TreeSitterGeneric", targets: ["TreeSitterGeneric"])
    ],
    dependencies: [
        .package(
            name: "SwiftTreeSitter", url: "https://github.com/tree-sitter/swift-tree-sitter",
            from: "0.9.0")
    ],
    targets: [
        .target(
            name: "TreeSitterGeneric",
            dependencies: [],
            path: ".",
            sources: [
                "src/parser.c",
                "src/scanner.c",
            ],
            resources: [
                .copy("queries")
            ],
            publicHeadersPath: "bindings/swift",
            cSettings: [.headerSearchPath("src")]
        ),
        .testTarget(
            name: "TreeSitterGenericTests",
            dependencies: [
                "SwiftTreeSitter",
                "TreeSitterGeneric",
            ],
            path: "bindings/swift/TreeSitterGenericTests"
        ),
    ],
    cLanguageStandard: .c11
)
