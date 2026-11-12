import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createSeo} from '../scripts/seo.mjs';
import {normalizeGames} from '../game-data.js';
const config=JSON.parse(await readFile(new URL('../seo.config.json',import.meta.url),'utf8'));
const catalog=normalizeGames(JSON.parse(await readFile(new URL('../games.json',import.meta.url),'utf8')));

test('canonical and sharing metadata use the intended Indian site and locale',()=>{
 const seo=createSeo(config,catalog.games);
 assert.equal(seo.canonical,'https://jaiho91rtp.com/');
 assert.ok(seo.head.includes('content="en_IN"'));
 assert.ok(seo.head.includes('name="twitter:card" content="summary_large_image"'));
 assert.ok(seo.head.includes('property="og:image" content="https://jaiho91rtp.com/assets/jaiho91-rtp-share.jpg"'));
 assert.ok(seo.head.includes('index, follow, max-image-preview:large'));
 assert.ok(!seo.head.includes('noindex'));
});
test('crawlable preview and structured data stay capped at ten, with safe text escaping',()=>{
 const games=[{id:'extra-game',name:'Extra <Game> & Friends',theme:'Adventure',thumbnail:null},...catalog.games];
 const seo=createSeo(config,games);
 assert.equal(seo.graph['@graph'].find(x=>x['@type']==='ItemList').numberOfItems,10);
 assert.equal((seo.fallback.match(/<article/g)||[]).length,10);
 assert.ok(!seo.fallback.includes('id="game-'+games[10].id+'"'));
 assert.ok(seo.fallback.includes('id="game-extra-game"'));
 assert.ok(seo.fallback.includes('Extra &lt;Game&gt; &amp; Friends'));
 assert.ok(!seo.fallback.includes('Extra <Game>'));
 const collection=seo.graph['@graph'].find(x=>x['@type']==='CollectionPage');
 assert.equal(collection.inLanguage,'en-IN');
 assert.ok(!JSON.stringify(seo.graph).includes('aggregateRating'));
});
test('sitemap lists the real root page and robots allow crawling',()=>{
 const seo=createSeo(config,catalog.games);
 assert.ok(seo.sitemap.includes('<loc>https://jaiho91rtp.com/</loc>'));
 assert.equal((seo.sitemap.match(/<url>/g)||[]).length,1);
 assert.ok(!seo.sitemap.includes('#game-'));
 assert.ok(!seo.sitemap.includes('<lastmod>'),'Do not fabricate modification dates');
 assert.ok(seo.robots.includes('Allow: /'));
 assert.ok(seo.robots.includes('Sitemap: https://jaiho91rtp.com/sitemap.xml'));
 assert.throws(()=>createSeo({...config,siteUrl:'http://example.com/'},[]),/HTTPS/);
 assert.throws(()=>createSeo({...config,siteUrl:'https://example.com/#wrong'},[]),/fragments/);
});
test('delivered HTML contains game content and metadata without needing JavaScript',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.ok(html.includes('lang="en-IN"'));
 assert.equal((html.match(/<title>/g)||[]).length,1);
 assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
 assert.ok(html.includes('<h1 id="hero-title">Jaiho91<br><span>RTP today.</span></h1>'));
 assert.equal((html.match(/<article class="game-card" id="game-/g)||[]).length,10);
 assert.ok(!html.includes('One fresh ranking'));
 assert.ok(!html.includes('A fresh perspective'));
 assert.ok(!/\bdemo\b/i.test(html));
 assert.ok(html.includes('The percentages currently shown are generated placeholders.'));
 const data=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 assert.equal(data['@graph'].find(x=>x['@type']==='ItemList').numberOfItems,10);
});
