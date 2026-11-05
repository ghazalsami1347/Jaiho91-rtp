import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeGames,loadGameList} from '../game-data.js';
import {rankGames} from '../core.js';

test('one extra four-field entry joins ranking and supplies a new category automatically',()=>{
 const existing=[{id:'super-ace-1',name:'Super Ace 1',category:'Cards',image:'assets/ace.webp'}];
 const next=normalizeGames([...existing,{id:'new-game',name:'New Game',category:'New category',image:'assets/new.webp'}]);
 assert.equal(next.games.length,2);assert.ok(next.themes.includes('New category'));
 assert.equal(next.games[1].thumbnailSmall,'assets/new.webp');
 assert.equal(next.games[1].thumbnailLarge,'assets/new.webp');
 const first=rankGames(normalizeGames(existing).games,'2026-11-05')[0];
 const after=rankGames(next.games,'2026-11-05');
 assert.equal(after.find(g=>g.id===first.id).basisPoints,first.basisPoints);
 assert.ok(after.some(g=>g.id==='new-game'));
});
test('minimal game needs only id and name; disabled games do not render',()=>{
 const catalog=normalizeGames([{id:'minimal',name:'Minimal'},{id:'hidden',name:'Hidden',enabled:false}]);
 assert.equal(catalog.games.length,1);assert.equal(catalog.games[0].theme,'Adventure');assert.equal(catalog.games[0].thumbnail,null);
});
test('bad JSON structure and duplicate or invalid IDs produce useful errors',()=>{
 assert.throws(()=>normalizeGames({}),/array/);
 assert.throws(()=>normalizeGames([{id:'a',name:'One'},{id:'a',name:'Two'}]),/Duplicate game id: a/);
 assert.throws(()=>normalizeGames([{id:'Bad ID',name:'One'}]),/lowercase/);
 assert.throws(()=>normalizeGames([{id:'empty',name:''}]),/needs a name/);
});
test('unsafe image schemes are rejected while ordinary image paths and https URLs work',()=>{
 assert.throws(()=>normalizeGames([{id:'bad',name:'Bad',image:'javascript:alert(1)'}]),/image/);
 assert.equal(normalizeGames([{id:'ok',name:'OK',image:'https://example.com/cover.png'}]).games[0].thumbnail,'https://example.com/cover.png');
});
test('double-click file mode uses its embedded list without attempting fetch',async()=>{
 const local=[{id:'local',name:'Local'}];let fetched=false;
 const data=await loadGameList({protocol:'file:',localGames:local,fetcher:()=>{fetched=true;throw Error('File fetch blocked')}});
 assert.equal(data,local);assert.equal(fetched,false);
});
test('hosted mode reads current games.json rather than the embedded snapshot',async()=>{
 let request;const live=[{id:'new',name:'New'}];
 const data=await loadGameList({protocol:'https:',localGames:[{id:'old',name:'Old'}],fetcher:async(url,options)=>{request={url,options};return{ok:true,json:async()=>live}}});
 assert.equal(request.url,'./games.json');assert.equal(request.options.cache,'no-store');assert.equal(data,live);
});
test('hosted loading errors remain visible instead of silently showing stale data',async()=>{
 await assert.rejects(loadGameList({protocol:'http:',localGames:[],fetcher:async()=>({ok:false,status:404})}),/games.json.*404/);
});
