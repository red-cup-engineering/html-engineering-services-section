# HTML engineering

<!-- 561-group-standards:badges:start -->
[![Red Cup Engineering](https://img.shields.io/badge/561%20Group-Red%20Cup%20Engineering-c0392b)](https://github.com/red-cup-engineering)
[![License: MIT](https://img.shields.io/badge/license-MIT-c0392b)](LICENSE)
[![Indigenous data: CARE](https://img.shields.io/badge/Indigenous%20data-CARE-4b6f44)](https://github.com/red-cup-engineering/.github/blob/main/GOVERNANCE.md)
[![Tips welcome](https://img.shields.io/badge/tips-welcome-d4a017)](https://github.com/561-group/.github/blob/main/TIPS.md)
<!-- 561-group-standards:badges:end -->

HTML has its own native parsing and document carrier beside XML and JSON. HTML error recovery, implied elements, foreign namespaces, template fragments and character-reference contexts cannot be implemented by treating HTML as XML. SVG remains XML. Shared lexical escaping retains text and quoted-attribute values through receiving.

The section exports document/carrier rendering, article/page composition, metadata, templates and static pages through the actual package subpaths. Semantic Hypertext Packet projection and receiving live in `services/html-structural-projection-service`: typed coordinates, both evidence sides, ordered frontiers and packet commitments remain distinct from HTML syntax. Markdown rendering composes the actual Markdown supplier; the section does not claim nonexistent service directories. Filesystem custody remains with file services.

Native HTML document reading, character references and six bounded transformations are exported by the structural-projection package's `./scan`, `./lexical` and `./transformations` subpaths. Existing SHP and Webmention consumers use the same reader. Parsed start-tag rows preserve original UTF-16 positions and authored order while excluding inert bodies and inferred nodes; native tree correction may discard source tags. See that package's README for callable contracts, resource bounds and qualified fixture evidence.

## HTML file codec

`services/html-file-codec-service` is the HTML file codec: it reads and writes HTML files, with the Semantic Hypertext Packet (SHP) codec, lint and escaping surface. It was formerly mounted from `red-cup-engineering/html-services-section` (the serialization-services-section seat for HTML, package `@red-cup-engineering/html-services-section@0.1.0`, private, no dependents). That repository was merged into this one on 2026-10-24 and archived; this section is now the one owner of HTML, so the package name `@red-cup-engineering/html-services-section` is retired and `@red-cup-engineering/html-engineering-services-section` is the live name. The codec's pin is carried over unchanged.
