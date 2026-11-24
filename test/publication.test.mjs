import assert from 'node:assert/strict';
import test from 'node:test';
import {articleToHtmlPage, articlesToHFeed} from '@red-cup-engineering/html-engineering-services-section/article-html';
import {pageToHtmlPage} from '@red-cup-engineering/html-engineering-services-section/page-html';

const body = '## Route\n\nBarnard Gate → Vega Prime → Okaga Reach.';
const title = 'Four turns <in flight>';
const slug = 'okaga-flight';
const jsonLd = html => JSON.parse(html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]+?)<\/script>/)[1]);

test('dated flight articles retain their byline, Markdown, canonical URL and structured data', () => {
  const article = {title, slug, author: 'Pilot', date: '2026-11-20', body, draft: false};
  const url = 'https://example.test/flights/okaga';
  const page = articleToHtmlPage(article, {url});
  assert.match(page, /class="h-entry"/);
  assert.match(page, /<h2[^>]*>Route<\/h2>/);
  assert.match(page, /Barnard Gate → Vega Prime → Okaga Reach/);
  assert.match(page, /Four turns &lt;in flight&gt;/);
  assert.equal(jsonLd(page).headline, title);
  assert.ok(page.includes('rel="canonical" href="' + url + '"'));
  assert.match(articlesToHFeed([article]), /class="p-author h-card">Pilot/);
});

test('undated flight pages retain the WebPage type and omit a publication date', () => {
  const page = pageToHtmlPage({title, slug, path: 'flight.md', body, frontMatter: {}});
  assert.equal(jsonLd(page)['@type'], 'WebPage');
  assert.match(page, /class="web-page"/);
  assert.doesNotMatch(page, /<time\b/);
  assert.match(page, /Barnard Gate → Vega Prime → Okaga Reach/);
});
