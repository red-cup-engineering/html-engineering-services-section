# HTML engine

Parse HTML, render structured documents, and create or verify Semiotic Hypertext Packets (SHP).

<!-- 561-group-standards:badges:start -->
[![Red Cup Engineering](https://img.shields.io/badge/561%20Group-Red%20Cup%20Engineering-c0392b)](https://github.com/red-cup-engineering)
[![License: MIT](https://img.shields.io/badge/license-MIT-c0392b)](LICENSE)
[![Indigenous data: CARE](https://img.shields.io/badge/Indigenous%20data-CARE-4b6f44)](https://github.com/red-cup-engineering/.github/blob/main/GOVERNANCE.md)
[![Tips welcome](https://img.shields.io/badge/tips-welcome-d4a017)](https://github.com/561-group/.github/blob/main/TIPS.md)
<!-- 561-group-standards:badges:end -->

## Documents and packets

The root module exports `project`, `pack` and `verifyPacket`. The renderer
uses the BCP 47 language declared in `dataform.language`, rejects conflicting
options and omits the HTML `lang` attribute when the language is unknown.
The packet identity depends on its original bytes. The RFC 7992 English
language restriction applies to RFC documents. See the [SHP language
specification](https://github.com/red-cup-engineering/semiotic-hypertext-packet/pull/4).

`./document-nodes` and `./string-rendering` build document nodes and strings.
The lexical helpers preserve carriage returns during an HTML round trip.
A NUL character displays as U+FFFD while canonical SHP fields keep the
original value. `./document-render` validates a node graph against the
SignChain document spine, resolves its CSS rules and checks the rendered
DOM against the planned nodes.

## Reading HTML

`./scan` uses [parse5](src/upstream/parse5/UPSTREAM.md) with source positions.
`readHtmlDocument` returns the parsed tree. Scripts are never executed and
links are never fetched. `scanHtmlStartTags` returns explicit elements in source
order as `{name,attrs,index}`, excluding script, style and template bodies.
The index is a zero-based UTF-16 offset into the source. Parser-implied
elements have no source row. The parser decodes attribute entities once and
uses the first occurrence of duplicate attributes. The source codec records
the content address of the original UTF-8 bytes. Use both node kind and name
to distinguish the HTML doctype from the root HTML element.

| Export from `./transformations` | Result |
| --- | --- |
| `decodeHtmlEntityText({text,context?})` | Decodes character references in text or attribute context using [entities](src/upstream/entities/UPSTREAM.md). |
| `encodeHtmlEntityText({text})` | Encodes text as ASCII character references, preserving carriage returns and rejecting NUL and ill-formed Unicode. |
| `htmlToJsonTree({html})` | Returns the parsed document tree with source spans, namespaces and separate template fragments. Implied nodes have null spans. |
| `htmlParsingDiagnostics({html})` | Reports up to 64 parser errors with source positions, document mode and the total error count. |
| `htmlDocumentLinks({html,documentUrl?})` | Lists explicit anchor, area and link hrefs in source order. Uses the first base href and optional absolute HTTP(S) document URL. Unresolved URLs are null. |
| `htmlBodyText({html})` | Collects body text nodes and their original spans in DOM order, excluding head, script, style, template and noscript content. |

Transformation input is limited to 65,536 UTF-8 bytes. Document operations
allow up to 8,192 nodes and attributes and a tree depth of 64, including
template fragments and implied nodes. JSON results are capped at 1,048,576
UTF-8 bytes.

## Verification

Run `npm test` with the package dependencies installed. The test data includes
2,231 WHATWG named references and 50 selected HTML5lib document trees.
The [game publication tests](test/game-publication-suppliers.test.mjs) check
source addresses, document identifiers, rendered scores and score packets.
