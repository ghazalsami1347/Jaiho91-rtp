import {readFile,access,stat} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {resolve,sep} from 'node:path';
import {spawnSync} from 'node:child_process';
import {normalizeGames} from '../game-data.js';
const root=resolve('.');
const html=await readFile('index.html','utf8');
for(const match of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g))await access(resolve(root,match[1]));
const catalog=normalizeGames(JSON.parse(await readFile('games.json','utf8')));
const imageFiles=new Set();
for(const game of catalog.games){
  for(const image of [game.thumbnailSmall,game.thumbnail,game.thumbnailLarge]){
    if(!image||/^https?:\/\//i.test(image))continue;
    const file=resolve(root,image);
    assert.ok(file.startsWith(root+sep),`${game.name}: image must be inside this project`);
    assert.ok((await stat(file)).isFile(),`${game.name}: missing image ${image}`);
    imageFiles.add(file);
  }
}
assert.ok(html.includes('<script defer src="./site.js"></script>'),'Use the classic bundle for file:// support');
assert.ok(!html.includes('type="module"'),'The entry page must not require browser modules');
assert.ok(html.includes('Live RTP feed not connected.'));
assert.ok(!/\bdemo\b/i.test(html),'Public page copy must use RTP wording');
const seo=JSON.parse(await readFile('seo.config.json','utf8'));
assert.ok(html.includes(`<title>${seo.title}</title>`),'Generated page title must match SEO config');
assert.ok(html.includes('rel="canonical"'),'Canonical URL is required');
assert.ok(html.includes('property="og:image"'),'Open Graph image is required');
assert.ok(html.includes('content="summary_large_image"'),'Large social card is required');
assert.ok(html.includes('type="application/ld+json"'),'Structured data is required');
if(seo.allowIndexing){assert.ok(!html.includes('noindex'),'Public source must allow indexing');assert.ok(!(await readFile('robots.txt','utf8')).includes('Disallow: /'));}
await access(seo.shareImage);
await access('sitemap.xml');
for(const name of ['app.js','core.js','icons.js','seed-ids.js','game-data.js','site.js']){
  const result=spawnSync(process.execPath,['--check',resolve(name)],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
}
const bundle=await readFile('site.js','utf8');
assert.ok(!/^\s*(?:import|export)\s/m.test(bundle),'site.js must be a standalone classic script');
assert.ok(html.includes('href="./assets/jaiho91-favicon.png"'));
console.log(`Passed: ${catalog.games.length} active games, ${imageFiles.size} local images, file-compatible scripts and local references.`);
