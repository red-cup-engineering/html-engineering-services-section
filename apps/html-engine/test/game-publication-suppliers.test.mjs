import assert from "node:assert/strict";
import test from "node:test";
import { cell } from "@red-cup-engineering/signcell";
import { documentSpine } from "@red-cup-engineering/signchain/document-spine";
import { htmlCarrierOf } from "@red-cup-engineering/html-engine/document-render";
import { renderSectionFrame } from "@red-cup-engineering/html-engine/signcraft-page";
import { htmlDocumentSourceCodec } from "@red-cup-engineering/html-engine/source-codec";

test("HTML source, document spine and game score keep their published-package identities", () => {
  const bytes = new TextEncoder().encode("<!doctype html><title>海</title>");
  const reading = htmlDocumentSourceCodec.read(bytes);
  assert.equal(reading.source.ni, "ni:///sha-256;qLo9X0IQT6DTunrkZqcWV7TAFUTRYqCTH3JINQQDTL4");
  assert.equal(reading.value.sourceByteLength, bytes.length);
  const spine = documentSpine({ cells: [] });
  assert.equal(spine.identity, "ni:///sha-256;JlHs-ScovU8DOag5vh1rwDaWvqjgygG2ImZpekkyJuw");
  assert.equal(htmlCarrierOf(spine, []).documentProjection.spineIdentity, spine.identity);
  assert.equal(htmlCarrierOf({ ...spine, identity: reading.source.ni }, []).reason, "invalid-document-spine");
  const { html } = renderSectionFrame([cell("score", "equals", "42", { for: ["move"] })]);
  assert.match(html, /data-e="score" data-a="equals" data-v="42">equals 42</);
});
