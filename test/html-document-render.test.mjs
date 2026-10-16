import assert from "node:assert/strict";
import test from "node:test";
import { address, cell } from "@red-cup-engineering/signcell/cell";
import { documentSpine } from "@red-cup-engineering/signcell/document-spine";
import {
  htmlCarrierOf,
  buildHtmlDocumentPlan,
  renderHtmlDocument,
} from "../src/html-document-render.mjs";
import {
  intZero,
  intOne,
} from "@red-cup-engineering/exact-number-data-service/exact-number";

// A settled document fixture: the signcell document spine of one cell per label, (label, names,
// fixture-part), with the given order and reference edges between those cells' addresses.
// Carrier nodes keep the labels as node ids; their semantic addresses are the cells' addresses.
const partCell = (label) => cell(label, "names", "fixture-part", { for: ["fixture"] });
const at = (label) => address(partCell(label));
function fixtureDocument(labels, { order = [], references = [] } = {}) {
  return documentSpine({
    cells: labels.map(partCell),
    order: order.map(([before, after]) => ({ before: at(before), after: at(after) })),
    references: references.map(([from, to]) => ({ from: at(from), to: at(to), predicate: "refers-to" })),
  });
}

const PROFILE = Object.freeze({
  kind: "rendering.profile",
  name: "fixture-profile",
  allowedElements: ["div", "p", "span", "a"],
  allowedStyleBehavior: ["static"],
  allowedCompletionRegimes: ["strict"],
  obligations: [],
  preservationLaws: [
    "preserve-addresses", "preserve-order", "preserve-references",
    "preserve-valuation-sites", "carrier-not-document", "css-settles",
  ],
});

function buildTree() {
  const document = fixtureDocument(["root", "child1", "child2"], {
    order: [["root", "child1"], ["child1", "child2"]],
  });
  const nodes = [
    {
      kind: "rendering.htmlCarrier.node",
      nodeId: "root",
      element: "div",
      semanticAddress: at("root"),
      children: ["child1", "child2"],
    },
    {
      kind: "rendering.htmlCarrier.node",
      nodeId: "child1",
      element: "p",
      semanticAddress: at("child1"),
      text: "Hello, world!",
    },
    {
      kind: "rendering.htmlCarrier.node",
      nodeId: "child2",
      element: "span",
      semanticAddress: at("child2"),
      html: "<strong>trusted</strong>",
    },
  ];
  const carrier = htmlCarrierOf(document, nodes);
  assert.equal(carrier.kind, "rendering.htmlCarrier", "fixture carrier must be admitted");
  return carrier;
}

test("renders a complete HTML document string containing the carrier tree's own text/html content", () => {
  const carrier = buildTree();
  const system = Object.freeze({
    kind: "rendering.css.system",
    carrier,
    declarations: [
      { kind: "rendering.css.declaration", nodeId: "root", property: "display", value: "block" },
      { kind: "rendering.css.declaration", nodeId: "child1", property: "color", value: "crimson" },
    ],
  });
  const fiber = buildHtmlDocumentPlan(PROFILE, carrier, system, "static");
  assert.equal(fiber.kind, "rendering.profile_forms_render_fiber:witness");

  const doc = renderHtmlDocument(fiber, { title: "Fixture Title" });
  const html = doc.html;

  assert.match(html, /^<!DOCTYPE html>/);
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<title>Fixture Title<\/title>/);
  // resolved CSS text lands in the document's <style> (sites sort by nodeId, so "child1" precedes "root")
  assert.match(html, /<style>\[data-render-node="child1"\]\{color:crimson\}\n\[data-render-node="root"\]\{display:block\}<\/style>/);
  // the carrier tree's content is present: escaped text and trusted html, nested inside their parent
  assert.ok(html.includes(`<div data-render-node="root" data-semantic-address="${at("root")}"><p data-render-node="child1" data-semantic-address="${at("child1")}">Hello, world!</p><span data-render-node="child2" data-semantic-address="${at("child2")}"><strong>trusted</strong></span></div>`));
});

test("escapes text content but passes through the trusted html field raw", () => {
  const document = fixtureDocument(["root"]);
  const nodes = [{
    kind: "rendering.htmlCarrier.node",
    nodeId: "root",
    element: "div",
    semanticAddress: at("root"),
    text: "<script>evil()</script> & friends",
  }];
  const carrier = htmlCarrierOf(document, nodes);
  const system = Object.freeze({
    kind: "rendering.css.system", carrier,
    declarations: [],
  });
  const fiber = buildHtmlDocumentPlan(PROFILE, carrier, system, "static");
  const html = renderHtmlDocument(fiber).html;
  assert.match(html, /&lt;script&gt;evil\(\)&lt;\/script&gt; &amp; friends/);
  assert.doesNotMatch(html, /<script>evil\(\)<\/script>/);
});

test("class-factor-map assignment shows up both on the rendered node's class attribute and in the emitted CSS", () => {
  const document = fixtureDocument(["root", "child1"], { order: [["root", "child1"]] });
  const nodes = [
    { kind: "rendering.htmlCarrier.node", nodeId: "root", element: "div", semanticAddress: at("root"), children: ["child1"] },
    { kind: "rendering.htmlCarrier.node", nodeId: "child1", element: "p", semanticAddress: at("child1"), text: "styled" },
  ];
  const carrier = htmlCarrierOf(document, nodes);
  const system = Object.freeze({
    kind: "rendering.css.system", carrier,
    declarations: [{ kind: "rendering.css.declaration", nodeId: "child1", property: "font-weight", value: "bold" }],
    classFactorMap: {
      kind: "rendering.css.classFactorMap",
      constraintGraph: Object.freeze([Object.freeze([intZero, intOne]), Object.freeze([intOne, intZero])]),
      nodeIds: ["root", "child1"],
      classes: [0, 1],
      alphabet: ["cls-root", "cls-child"],
    },
  });
  const fiber = buildHtmlDocumentPlan(PROFILE, carrier, system, "static");
  assert.equal(fiber.kind, "rendering.profile_forms_render_fiber:witness");
  const html = renderHtmlDocument(fiber).html;
  assert.match(html, /<p data-render-node="child1"[^>]*\bclass="cls-child"[^>]*>styled<\/p>/);
  assert.match(html, /<style>\.cls-child\{font-weight:bold\}<\/style>/);
});

test("root inference renders only nodes that are nobody's child when options.roots is omitted", () => {
  const document = fixtureDocument(["root", "child1"], { order: [["root", "child1"]] });
  const nodes = [
    { kind: "rendering.htmlCarrier.node", nodeId: "root", element: "div", semanticAddress: at("root"), children: ["child1"] },
    { kind: "rendering.htmlCarrier.node", nodeId: "child1", element: "p", semanticAddress: at("child1"), text: "leaf" },
  ];
  const carrier = htmlCarrierOf(document, nodes);
  const system = Object.freeze({
    kind: "rendering.css.system", carrier,
    declarations: [],
  });
  const fiber = buildHtmlDocumentPlan(PROFILE, carrier, system, "static");
  const html = renderHtmlDocument(fiber).html;
  // child1 must appear exactly once, nested under root -- not rendered a second time as a top-level root
  const occurrences = html.split('data-render-node="child1"').length - 1;
  assert.equal(occurrences, 1);
});

test("explicit options.roots must still carry every document address", () => {
  const document = fixtureDocument(["root", "child1"], { order: [["root", "child1"]] });
  const nodes = [
    { kind: "rendering.htmlCarrier.node", nodeId: "root", element: "div", semanticAddress: at("root"), children: ["child1"] },
    { kind: "rendering.htmlCarrier.node", nodeId: "child1", element: "p", semanticAddress: at("child1"), text: "leaf" },
  ];
  const carrier = htmlCarrierOf(document, nodes);
  const system = Object.freeze({
    kind: "rendering.css.system", carrier,
    declarations: [],
  });
  const fiber = buildHtmlDocumentPlan(PROFILE, carrier, system, "static");
  assert.throws(() => renderHtmlDocument(fiber, { roots: ["child1"] }), /roots omit document address/);
  const html = renderHtmlDocument(fiber, { roots: ["root"] }).html;
  assert.match(html, /data-render-node="root"/);
  assert.match(html, /data-render-node="child1"/);
});

test("htmlCarrierOf obstructs a duplicate nodeId and a document address missing from the node list", () => {
  const document = fixtureDocument(["root"]);
  const dup = htmlCarrierOf(document, [
    { kind: "rendering.htmlCarrier.node", nodeId: "root", element: "div", semanticAddress: at("root") },
    { kind: "rendering.htmlCarrier.node", nodeId: "root", element: "div", semanticAddress: at("root") },
  ]);
  assert.equal(dup.kind, "rendering.htmlCarrier-obstruction");
  assert.equal(dup.reason, "unprojectable-content");
  assert.equal(dup.key, "duplicate carrier node root");

  const missing = htmlCarrierOf(document, []);
  assert.equal(missing.kind, "rendering.htmlCarrier-obstruction");
  assert.equal(missing.reason, "missing-address");
  assert.equal(missing.key, at("root"));
});

test("carrier carries an admitted document spine without requiring settlement internals", () => {
  const document = fixtureDocument(["root"]);
  const carrier = htmlCarrierOf(document, [{
    kind: "rendering.htmlCarrier.node", nodeId: "root", element: "p", semanticAddress: at("root"),
  }]);
  assert.equal(carrier.kind, "rendering.htmlCarrier");
  assert.deepEqual(carrier.document, document);
  for (const [output, input] of [["carriedAddresses", "addresses"], ["carriedOrder", "order"], ["carriedReferences", "references"], ["carriedValuationSites", "valuationSites"]]) assert.deepEqual(carrier[output], document[input]);
  assert.deepEqual(carrier.documentProjection, { kind: "rendering.document-spine-coverage", spineIdentity: document.identity });
});

test("carrier refuses a spine whose geometry leaves its cells, and a node that moves its valuation site", () => {
  const nodes = [{ kind: "rendering.htmlCarrier.node", nodeId: "root", element: "p", semanticAddress: at("root") }];
  for (const [field, value] of [
    ["order", [{ before: at("root"), after: "absent" }]],
    ["references", [{ from: at("root"), to: "absent", predicate: "refers-to" }]],
    ["valuationSites", [{ address: "absent", value: "potential", evidence: { for: [], against: [] } }]],
  ]) {
    assert.equal(htmlCarrierOf({ ...fixtureDocument(["root"]), [field]: value }, nodes).reason, "invalid-document-spine", field);
  }
  assert.deepEqual(htmlCarrierOf(fixtureDocument(["root"]), [{ ...nodes[0], valuationSite: "elsewhere" }]), {
    kind: "rendering.htmlCarrier-obstruction", reason: "unprojectable-content", key: "carrier node root names an absent valuation site",
  });
});

test("buildHtmlDocumentPlan obstructs an element the profile does not allow", () => {
  const document = fixtureDocument(["root"]);
  const carrier = htmlCarrierOf(document, [
    { kind: "rendering.htmlCarrier.node", nodeId: "root", element: "iframe", semanticAddress: at("root") },
  ]);
  const system = Object.freeze({
    kind: "rendering.css.system", carrier,
    declarations: [],
  });
  const judgment = buildHtmlDocumentPlan(PROFILE, carrier, system, "static");
  assert.equal(judgment.kind, "rendering.profile_forms_render_fiber-obstruction");
  assert.equal(judgment.reason, "element-not-allowed");
  assert.equal(judgment.key, "iframe");
});

test("htmlCarrierOf refuses a cyclic carrier (a descendant referencing back up its own chain)", () => {
  // root -> child1 -> child2 -> child1: root is the sole inferred root (it is
  // nobody's child), so rendering begins and only hits the cycle two levels
  // down, inside child2 -> child1.
  const document = fixtureDocument(["root", "child1", "child2"], {
    order: [["root", "child1"], ["child1", "child2"], ["child2", "child1"]],
  });
  const nodes = [
    { kind: "rendering.htmlCarrier.node", nodeId: "root", element: "div", semanticAddress: at("root"), children: ["child1"] },
    { kind: "rendering.htmlCarrier.node", nodeId: "child1", element: "p", semanticAddress: at("child1"), children: ["child2"] },
    { kind: "rendering.htmlCarrier.node", nodeId: "child2", element: "span", semanticAddress: at("child2"), children: ["child1"] },
  ];
  const carrier = htmlCarrierOf(document, nodes);
  const system = Object.freeze({
    kind: "rendering.css.system", carrier,
    declarations: [],
  });
  assert.equal(carrier.kind, "rendering.htmlCarrier-obstruction");
  assert.equal(carrier.key, "carrier child geometry is cyclic");
  assert.equal(buildHtmlDocumentPlan(PROFILE, carrier, system, "static").kind, "rendering.profile_forms_render_fiber-obstruction");
});
