import test from 'node:test';
import assert from 'node:assert/strict';
import {metaTag, openGraphTags, twitterCardTags, socialMetaTags, webAppManifest, webAppManifestLink, META_PREDICATE_MAP} from '@red-cup-engineering/html-engineering-services-section/metadata';

test('generic metadata public entry escapes attributes and omits absent values without Article admission',()=>{
 assert.equal(metaTag('name','a"b','<x>&'),'<meta name="a&quot;b" content="&lt;x&gt;&amp;">');
 assert.equal(metaTag('name','empty',null),'');
 assert.equal(metaTag('name','count',0),'<meta name="count" content="0">');
 assert.equal(webAppManifestLink('/x?a="b"'),'<link rel="manifest" href="/x?a=&quot;b&quot;">');
});
test('social tags retain repeated image and article values in order and card selection',()=>{
 const props={type:'article',title:'One',images:[{url:'/a',alt:'A',width:20},'/b'],authors:['Alice','Bob'],tags:['x','y']};
 const og=openGraphTags(props),tw=twitterCardTags(props);
 assert.ok(Object.isFrozen(og));assert.ok(Object.isFrozen(tw));
 assert.deepEqual(og.filter(x=>x.includes('article:author')),['<meta property="article:author" content="Alice">','<meta property="article:author" content="Bob">']);
 assert.deepEqual(og.filter(x=>x.includes('og:image"')),['<meta property="og:image" content="/a">','<meta property="og:image" content="/b">']);
 assert.equal(tw[0],'<meta name="twitter:card" content="summary_large_image">');
 assert.equal(socialMetaTags(props),[...og,...tw].join('\n'));
 assert.equal(twitterCardTags({})[0],'<meta name="twitter:card" content="summary">');
 assert.equal(openGraphTags({authors:['ignored']}).some(x=>x.includes('article:author')),false);
});
test('web manifest preserves standard field mapping, pruning and required inputs',()=>{
 assert.deepEqual(webAppManifest({name:'App',shortName:'A',icons:[{src:'/icon',sizes:'32x32'}],screenshots:[{src:'/shot',formFactor:'wide'}],categories:[]}),{name:'App',short_name:'A',start_url:'/',display:'standalone',icons:[{src:'/icon',sizes:'32x32'}],screenshots:[{src:'/shot',form_factor:'wide'}]});
 for(const input of [{},{name:'App',icons:[{}]},{name:'App',screenshots:[{}]}])assert.throws(()=>webAppManifest(input),TypeError);
 assert.deepEqual(META_PREDICATE_MAP.author,{field:'authors',repeatable:true});
});
