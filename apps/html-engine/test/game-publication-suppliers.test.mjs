import assert from "node:assert/strict";
import test from "node:test";
import { htmlProjector, verifyPacket } from "@red-cup-engineering/html-engine";
import { settleCells } from "@red-cup-engineering/signcraft/settle";
import { cell } from "@red-cup-engineering/signcell";
import { documentSpine } from "@red-cup-engineering/signchain/document-spine";
import { htmlCarrierOf } from "@red-cup-engineering/html-engine/document-render";
import { packetOfSettlement, renderSectionFrame } from "@red-cup-engineering/html-engine/signcraft-page";
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

test("a settled score keeps its packet address and evidence through the default HTML projector", () => {
  const score = cell("Pantry", "score", 42, { for: ["earned"] });
  const packet = packetOfSettlement(settleCells([score]));
  assert.equal(packet.identity, "sha256:16645ff8573b514963d0f1bdc8953e911d92950e6a2f36a1c9d5c0af4bae08bf");
  assert.equal(verifyPacket(packet), true);
  assert.equal(verifyPacket({ ...packet, source: "changed" }), false);
  const resource = { content: packet.html };
  assert.equal(htmlProjector.recognize(resource), true);
  const cells = htmlProjector.read(resource);
  assert.deepEqual(cells, [{
    cell: { subject: "Pantry", predicate: "score", object: 42 },
    evidence: { for: ["earned"], against: [] },
  }]);
  assert.deepEqual(htmlProjector.read({ content: htmlProjector.write(cells) }), cells);
});
