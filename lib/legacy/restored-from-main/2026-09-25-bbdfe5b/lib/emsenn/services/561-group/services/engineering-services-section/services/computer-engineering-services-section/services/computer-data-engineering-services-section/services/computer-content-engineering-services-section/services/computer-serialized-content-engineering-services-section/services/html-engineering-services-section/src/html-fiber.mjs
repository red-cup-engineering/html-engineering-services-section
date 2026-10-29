/** HTML carrier validation; SHP serialization is owned by the shared HTML codec. */
export * from "@red-cup-engineering/html-structural-projection-service";
import { escapeText, escapeAttr, } from "@red-cup-engineering/html-structural-projection-service";

import { html_is_carrier_not_document,

} from "@red-cup-engineering/computer-systems-engineering-services-section/signcraft/graph/document";
import { checkClassMapsValid as css_classes_are_factor_maps, resolveNodeStyles as cssVisualValuation
} from "@red-cup-engineering/css-services-section/css-style-resolution";
export { css_classes_are_factor_maps, cssVisualValuation };

/* ── carrier / CSS valuation / profile fiber ───────────────────────────── */

const addressSet = (nodes) => new Set(nodes.map((node) => node.semanticAddress));

const firstDuplicate = (values) => {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) return value;
    seen.add(value);
  }
  return undefined;
};

const carrierObstruction = (reason, key) =>
  Object.freeze({ kind: "rendering.htmlCarrier-obstruction", reason, key });

/** Admit HTML only as a semantic carrier of the settled document spine. */
export function htmlCarrierOf(
  document,
  nodes,
) {
  const duplicate = firstDuplicate(nodes.map((node) => node.nodeId));
  if (duplicate !== undefined) return carrierObstruction("duplicate-node", duplicate);
  const addresses = addressSet(nodes);
  for (const address of document.addresses) {
    if (!addresses.has(address.key)) return carrierObstruction("missing-address", address.key);
  }
  for (const edge of document.order) {
    if (!addresses.has(edge.before) || !addresses.has(edge.after)) {
      return carrierObstruction("missing-order", `${edge.before}->${edge.after}`);
    }
  }
  for (const reference of document.references) {
    if (!addresses.has(reference.from) || !addresses.has(reference.to)) {
      return carrierObstruction("missing-reference", `${reference.from}->${reference.to}`);
    }
  }
  const valuationSites = new Set(nodes.map((node) => node.valuationSite ?? node.semanticAddress));
  for (const site of document.valuationSites) {
    if (!valuationSites.has(site.address)) return carrierObstruction("missing-valuation-site", site.address);
  }
  return Object.freeze({
    kind: "rendering.htmlCarrier",
    document,
    nodes: Object.freeze([...nodes]),
    carriedAddresses: document.addresses,
    carriedOrder: document.order,
    carriedReferences: document.references,
    carriedValuationSites: document.valuationSites,
    carrierNotDocument: html_is_carrier_not_document(document, "rendering.htmlCarrier"),
  });
}

const declarationRank = (decl) =>
  Object.freeze([decl.priority ?? 0, decl.sourceOrder ?? 0]);

const declarationKey = (decl) => `${decl.nodeId}\u0000${decl.property}`;

const chooseDeclaration = (left, right) => {
  const [leftPriority, leftOrder] = declarationRank(left);
  const [rightPriority, rightOrder] = declarationRank(right);
  if (rightPriority > leftPriority) return right;
  if (rightPriority < leftPriority) return left;
  return rightOrder >= leftOrder ? right : left;
};

const sameVisualValuation = (left, right) =>
  JSON.stringify(left.sites.map(({ nodeId, property, value }) => [nodeId, property, value]))
  === JSON.stringify(right.sites.map(({ nodeId, property, value }) => [nodeId, property, value]));

/** The cascade settles to an idempotent visual valuation over carrier nodes. */
export function css_settles_to_valuation(system) {
  const valuation = cssVisualValuation(system);
  const declarations = Object.freeze(valuation.sites.map((site, sourceOrder) => Object.freeze({
    kind: "rendering.css.declaration",
    nodeId: site.nodeId,
    property: site.property,
    value: site.value,
    priority: 0,
    sourceOrder,
  })));
  const closedSystem = system.classFactorMap === undefined
    ? Object.freeze({
      kind: "rendering.css.system",
      carrier: system.carrier,
      completionRegime: system.completionRegime,
      declarations,
    })
    : Object.freeze({
      kind: "rendering.css.system",
      carrier: system.carrier,
      completionRegime: system.completionRegime,
      declarations,
      classFactorMap: system.classFactorMap,
    });
  if (!sameVisualValuation(valuation, cssVisualValuation(closedSystem))) {
    throw new TypeError("css_settles_to_valuation: cascade closure is not idempotent");
  }
  return Object.freeze({
    kind: "rendering.css_settles_to_valuation:witness",
    system,
    valuation,
    cascadeClosed: true,
    idempotent: true,
  });
}

const cssClassFactorMapObstruction = (
  classes,
  reason,
  key,
  factorMap,
) => factorMap === undefined
  ? Object.freeze({ kind: "rendering.css_classes_are_factor_maps-obstruction", classes, reason, key })
  : Object.freeze({ kind: "rendering.css_classes_are_factor_maps-obstruction", classes, reason, key, factorMap });

/* ── projector ──────────────────────────────────────────────────────────── */

function classByNodeId(classes) {
  if (classes === undefined) return new Map();
  return new Map(classes.nodeIds.map((nodeId, index) => [
    nodeId,
    classes.alphabet[classes.classes[index] ?? 0] ?? "render-node",
  ]));
}

export function cssTextFromVisualValuation(
  valuation,
  classes,
) {
  const classNames = classByNodeId(classes);
  return valuation.sites
    .map((site) => {
      const className = classNames.get(site.nodeId);
      const selector = className === undefined ? `[data-render-node="${escapeAttr(site.nodeId)}"]` : `.${className}`;
      return `${selector}{${site.property}:${site.value}}`;
    })
    .join("\n");
}

const renderHtmlAttr = ([key, value]) =>
  value === "" ? ` ${key}` : ` ${key}="${escapeAttr(value)}"`;

function renderCarrierNode(
  node,
  byId,
  classNames,
  seen,
) {
  if (seen.has(node.nodeId)) throw new TypeError(`renderHtmlFiber: cyclic carrier node ${node.nodeId}`);
  const nextSeen = new Set(seen);
  nextSeen.add(node.nodeId);
  const className = classNames.get(node.nodeId);
  const ownClass = node.attributes?.class;
  const attributes = {
    ...(node.attributes ?? {}),
    "data-render-node": node.nodeId,
    ...(className === undefined
      ? {}
      : { class: ownClass === undefined || ownClass === "" ? className : `${ownClass} ${className}` }),
  };
  const body = `${node.text === undefined ? "" : escapeText(node.text)}${(node.children ?? []).map((childId) => {
    const child = byId.get(childId);
    if (child === undefined) throw new TypeError(`renderHtmlFiber: missing child carrier node ${childId}`);
    return renderCarrierNode(child, byId, classNames, nextSeen);
  }).join("")}`;
  return `<${node.element}${Object.entries(attributes).map(renderHtmlAttr).join("")}>${body}</${node.element}>`;
}

function rootNodeIds(nodes, requested) {
  if (requested !== undefined) return requested;
  const childIds = new Set(nodes.flatMap((node) => node.children ?? []));
  return Object.freeze(nodes.filter((node) => !childIds.has(node.nodeId)).map((node) => node.nodeId));
}

/** Serialize the single admitted render codomain: a profile fiber over an HTML carrier and settled CSS valuation. */
export function renderHtmlFiber(
  fiber,
  options = {},
) {
  const byId = new Map(fiber.fiber.carrier.nodes.map((node) => [node.nodeId, node]));
  const roots = rootNodeIds(fiber.fiber.carrier.nodes, options.roots);
  const classes = fiber.fiber.system.classFactorMap;
  const classNames = classByNodeId(classes);
  const body = roots.map((rootId) => {
    const root = byId.get(rootId);
    if (root === undefined) throw new TypeError(`renderHtmlFiber: missing root carrier node ${rootId}`);
    return renderCarrierNode(root, byId, classNames, new Set());
  }).join("\n");
  const metadata = Object.entries(options.metadata ?? {})
    .map(([key, value]) => `    <meta name="${escapeAttr(key)}" content="${escapeAttr(value)}">`)
    .join("\n");
  const css = cssTextFromVisualValuation(fiber.fiber.valuation, classes);
  const title = options.title ?? fiber.fiber.profile.name;
  const html = `<!DOCTYPE html>
<html lang="${escapeAttr(options.lang ?? "en")}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="render-profile" content="${escapeAttr(fiber.fiber.profile.name)}">${metadata ? "\n" + metadata : ""}
    <title>${escapeText(title)}</title>
    <style>${css}</style>
</head>
<body>
${body}
</body>
</html>
`;
  return Object.freeze({
    kind: "rendering.htmlFiber.document",
    fiber,
    html,
  });
}
