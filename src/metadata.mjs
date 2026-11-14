/** Generic HTML head metadata. No Article admission or JSON-LD contract is implied. */
import { escapeAttr } from "@red-cup-engineering/html-structural-projection-service";

/** One `<meta>` element keyed by `name` or `property`; empty when the content is. */
export function metaTag(kind, key, content) {
  if (content === undefined || content === null || content === "") return "";
  return `<meta ${kind}="${escapeAttr(key)}" content="${escapeAttr(String(content))}">`;
}

const each = (value) => value === undefined || value === null ? [] : Array.isArray(value) ? value : [value];
const imagesOf = (props) => [...each(props.images), ...each(props.image)].map((image) => typeof image === "string" ? { url: image } : image).filter((image) => image?.url);

/**
 * The Open Graph tags of a page. `props`: type ("website" by default), title, description, url, siteName,
 * locale, images (`{ url, alt, width, height, type }` or URLs) or image, and for an article publishedTime,
 * modifiedTime, section, authors and tags.
 */
export function openGraphTags(props = {}) {
  const type = props.type ?? "website";
  return Object.freeze([
    metaTag("property", "og:site_name", props.siteName),
    metaTag("property", "og:type", type),
    metaTag("property", "og:title", props.title),
    metaTag("property", "og:description", props.description),
    metaTag("property", "og:url", props.url),
    metaTag("property", "og:locale", props.locale),
    ...imagesOf(props).flatMap((image) => [
      metaTag("property", "og:image", image.url),
      metaTag("property", "og:image:alt", image.alt),
      metaTag("property", "og:image:width", image.width),
      metaTag("property", "og:image:height", image.height),
      metaTag("property", "og:image:type", image.type),
    ]),
    ...(type === "article" ? [
      metaTag("property", "article:published_time", props.publishedTime),
      metaTag("property", "article:modified_time", props.modifiedTime),
      metaTag("property", "article:section", props.section),
      ...each(props.authors).map((author) => metaTag("property", "article:author", author)),
      ...each(props.tags).map((tag) => metaTag("property", "article:tag", tag)),
    ] : []),
  ].filter(Boolean));
}

/** The Twitter Card tags of a page: a large-image card when it has an image. */
export function twitterCardTags(props = {}) {
  const image = imagesOf(props)[0];
  return Object.freeze([
    metaTag("name", "twitter:card", props.card ?? (image ? "summary_large_image" : "summary")),
    metaTag("name", "twitter:title", props.title),
    metaTag("name", "twitter:description", props.description),
    metaTag("name", "twitter:image", image?.url),
    metaTag("name", "twitter:image:alt", image?.alt),
    metaTag("name", "twitter:site", props.twitterSite),
    metaTag("name", "twitter:creator", props.twitterCreator),
  ].filter(Boolean));
}

/** Open Graph then Twitter Card tags, one per line. */
export function socialMetaTags(props = {}) {
  return [...openGraphTags(props), ...twitterCardTags(props)].join("\n");
}

/** Which social-metadata property a claim's predicate fills (for `foldClaims`). */
export const META_PREDICATE_MAP = Object.freeze({
  title: { field: "title" }, headline: { field: "title" }, name: { field: "title" },
  description: { field: "description" }, summary: { field: "description" }, excerpt: { field: "description" },
  url: { field: "url" }, permalink: { field: "url" },
  image: { field: "images", repeatable: true }, photo: { field: "images", repeatable: true },
  published: { field: "publishedTime" }, datePublished: { field: "publishedTime" }, date: { field: "publishedTime" },
  modified: { field: "modifiedTime" }, dateModified: { field: "modifiedTime" }, updated: { field: "modifiedTime" },
  author: { field: "authors", repeatable: true },
  tag: { field: "tags", repeatable: true }, tags: { field: "tags", repeatable: true }, category: { field: "tags", repeatable: true },
  keyword: { field: "tags", repeatable: true }, keywords: { field: "tags", repeatable: true },
  siteName: { field: "siteName" }, site: { field: "twitterSite" }, creator: { field: "twitterCreator" },
});

const prune = (object) => Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && value.length === 0)));

/** A W3C web app manifest from `{ name, shortName, description, id, startUrl, scope, display, orientation, themeColor,
 *  backgroundColor, lang, dir, categories, icons, screenshots }` (name required). */
export function webAppManifest(manifest) {
  if (!manifest?.name) throw new TypeError("manifest.name is required");
  for (const [index, icon] of (manifest.icons ?? []).entries()) if (!icon.src) throw new TypeError(`manifest.icons[${index}].src is required`);
  for (const [index, shot] of (manifest.screenshots ?? []).entries()) if (!shot.src) throw new TypeError(`manifest.screenshots[${index}].src is required`);
  return prune({
    name: manifest.name, short_name: manifest.shortName, description: manifest.description, id: manifest.id,
    start_url: manifest.startUrl ?? "/", scope: manifest.scope, display: manifest.display ?? "standalone", orientation: manifest.orientation,
    theme_color: manifest.themeColor, background_color: manifest.backgroundColor, lang: manifest.lang, dir: manifest.dir, categories: manifest.categories,
    icons: manifest.icons?.map((icon) => prune({ src: icon.src, sizes: icon.sizes, type: icon.type, purpose: icon.purpose })),
    screenshots: manifest.screenshots?.map((shot) => prune({ src: shot.src, sizes: shot.sizes, type: shot.type, form_factor: shot.formFactor, label: shot.label })),
  });
}

/** The `<link rel="manifest">` element. */
export function webAppManifestLink(path = "/site.webmanifest") {
  return `<link rel="manifest" href="${escapeAttr(path)}">`;
}

