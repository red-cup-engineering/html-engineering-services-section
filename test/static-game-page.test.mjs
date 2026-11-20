import assert from 'node:assert/strict';
import test from 'node:test';
import {renderStaticWebsiteHtmlPresentation} from '@red-cup-engineering/html-engineering-services-section/static-page';

test('a stored page token renders an ordered, escaped static game view', () => {
  const page = {token: 'game:ferry', title: 'Ferry moves', lang: 'en',
    roots: ['turns'], nodes: [
      {nodeId: 'turns', element: 'ol', children: ['first', 'second']},
      {nodeId: 'first', element: 'li', text: 'Board <ferry>'},
      {nodeId: 'second', element: 'li', text: 'Go west'},
    ]};
  const html = renderStaticWebsiteHtmlPresentation(page);
  assert.match(html, /<title>Ferry moves<\/title>/);
  assert.match(html, /<ol[^>]*>[^]*Board &lt;ferry&gt;[^]*Go west[^]*<\/ol>/);
  assert.equal(renderStaticWebsiteHtmlPresentation(structuredClone(page)), html);
  assert.throws(() => renderStaticWebsiteHtmlPresentation({...page, token: ''}), /token/);
});
