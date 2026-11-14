/**
 * Article head metadata: canonical URL, description, social tags and
 * schema.org JSON-LD over the original admitted Article contract.
 * Generic HTML metadata is owned independently by ./metadata.mjs.
 */
import { ArticleSchema } from "@red-cup-engineering/computer-article-engineering-services-section/article";
import { escapeAttr } from "@red-cup-engineering/html-structural-projection-service";
import {
  articleToArticleJsonLd,
  articleToNewsArticleJsonLd,
  breadcrumbJsonLd,
  entityGraphJsonLd,
  renderJsonLdScript,
  websiteContextToWebSiteJsonLd,

} from "@red-cup-engineering/computer-triplet-serialized-content-engineering-services-section/schema-org";

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value !== undefined && value.trim() !== "") return value;
  }
  return undefined;
}

export { metaTag, openGraphTags, twitterCardTags, socialMetaTags, META_PREDICATE_MAP, webAppManifest, webAppManifestLink } from "./metadata.mjs";
import { openGraphTags, twitterCardTags } from "./metadata.mjs";

function asJsonLdNode(value) {
  return value;
}

/** The one canonical-URL derivation for an Article: explicit option, then Article properties, then baseUrl+slug. */
export function articleUrl(article, options = {}) {
  return firstNonEmpty(
    options.url,
    article.url,
    article.canonicalUrl,
    article.koios?.original_permalink,
    options.baseUrl === undefined ? undefined : `${options.baseUrl.replace(/\/+$/, "")}/${article.slug.replace(/^\/+/, "")}`,
  );
}

/** The one canonical description derivation for an Article. */
export function articleDescription(article) {
  return firstNonEmpty(article.metaDescription, article.description, article.excerpt, article.summary, article.koios?.tweet);
}

const ARTICLE_SCHEMA_KEYS = new Set(Object.keys(ArticleSchema.properties));

/**
 * Callers (e.g. digital-garden/professional-blog) hold article content records that
 * extend Article with extra website-build properties (`permalink`, `outputPath`, ...)
 * the strict `ArticleSchema` (`additionalProperties: false`) rejects. Narrow
 * to exactly the schema's own keys before handing the value to the
 * schema-org codec, rather than requiring every caller to know and strip
 * its own extra properties.
 */
function narrowToArticleSchema(article) {
  const narrowed = {};
  for (const [key, value] of Object.entries(article)) {
    if (ARTICLE_SCHEMA_KEYS.has(key)) narrowed[key] = value;
  }
  return narrowed;
}

/** Derive the full head-block metadata algebra for one admitted Article. */
export function articleHeadMetadata(article, options = {}) {
  const description = articleDescription(article);
  const url = articleUrl(article, options);

  const social = { type: "article", title: article.title, description, url, siteName: options.websiteName, image: options.image,
    publishedTime: article.date, modifiedTime: article.updated, authors: article.author, tags: article.tags,
    twitterSite: options.twitterAccount, twitterCreator: options.twitterCreator };

  const schemaArticle = narrowToArticleSchema(article);
  const articleNode = asJsonLdNode(
    options.newsArticle ? articleToNewsArticleJsonLd(schemaArticle) : articleToArticleJsonLd(schemaArticle, url === undefined ? {} : { url }),
  );
  const websiteUrl = options.websiteUrl ?? url;
  const websiteNode = options.websiteName === undefined || websiteUrl === undefined ? undefined : asJsonLdNode(websiteContextToWebSiteJsonLd({
    websiteUrl,
    title: options.websiteName,
    websiteName: options.websiteName,
  }));
  const crumbsNode = options.routePath === undefined ? undefined : asJsonLdNode(
    breadcrumbJsonLd(options.routePath, { websiteUrl: websiteUrl ?? "/", rootName: options.websiteName ?? "Home" }),
  );

  const nodes = [articleNode, websiteNode, crumbsNode].filter((node) => node !== undefined);
  const jsonLd = nodes.length === 0 ? undefined : nodes.length === 1 ? nodes[0] : asJsonLdNode(entityGraphJsonLd(nodes));

  return Object.freeze({
    description,
    url,
    canonicalTag: url === undefined ? undefined : `<link rel="canonical" href="${escapeAttr(url)}">`,
    openGraphTags: openGraphTags(social),
    twitterTags: twitterCardTags(social),
    jsonLd,
    jsonLdScript: jsonLd === undefined ? "" : renderJsonLdScript(jsonLd),
  });
}

/** Join the head-block metadata algebra's faces into head-ready markup, one tag per line. */
export function renderArticleHeadMetadata(metadata) {
  return [
    metadata.canonicalTag,
    ...metadata.openGraphTags,
    ...metadata.twitterTags,
    metadata.jsonLdScript === "" ? undefined : metadata.jsonLdScript,
  ].filter((tag) => tag !== undefined).join("\n");
}
