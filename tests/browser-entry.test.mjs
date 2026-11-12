// Exercise the shipped classic script, including its file:// branch, without
// requiring browser modules or relaxing browser file-origin protections.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {cycleAt, rankGames, TOP_GAME_COUNT} from '../core.js';
import {normalizeGames} from '../game-data.js';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../site.js',import.meta.url),'utf8');
const games=JSON.parse(await readFile(new URL('../games.json',import.meta.url),'utf8')).filter(g=>g.enabled!==false);
function createPage(protocol,liveGames=games){
 const elements=new Map(),windowListeners={};let fetchCalls=0;
 let now=Date.parse('2026-11-12T06:29:59Z');
 class PageDate extends Date { static now(){ return now; } }
 function element(selector){
  if(!elements.has(selector))elements.set(selector,{value:'',hidden:false,open:false,innerHTML:'',textContent:'',attributes:{},listeners:{},get children(){return Array.from({length:(this.innerHTML.match(/<article class="game-card/g)||[]).length},()=>({querySelector:()=>({focus(){}})}))},setAttribute(name,value){this.attributes[name]=value},addEventListener(name,callback){this.listeners[name]=callback},focus(){},click(){},showModal(){this.open=true},close(){this.open=false}});
  return elements.get(selector);
 }
 const document={querySelector:element,querySelectorAll:()=>[],addEventListener(){},activeElement:{tagName:'BODY'},hidden:false};
 const context={document,Date:PageDate,window:{addEventListener(name,listener){windowListeners[name]=listener}},location:{protocol},localStorage:{getItem(){throw Error('Storage blocked')},setItem(){throw Error('Storage blocked')}},setTimeout:()=>1,clearTimeout(){},console,fetch:async()=>{fetchCalls++;if(protocol==='file:')throw Error('File fetch blocked');return{ok:true,json:async()=>liveGames}}};
 vm.runInNewContext(source,context,{timeout:1000});
 return {
  element,
  advanceTo(time){now=Date.parse(time);windowListeners.focus();},
  get fetchCalls(){return fetchCalls;},
  get rates(){return [...element('#games').innerHTML.matchAll(/<strong>([\d.]+)%<\/strong>/g)].map(match=>Number(match[1]));},
  get cardIds(){return [...element('#games').innerHTML.matchAll(/id="game-([^"]+)"/g)].map(match=>match[1]);}
 };
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function assertFeaturedRates(page){
 assert.equal(page.rates.length,page.cardIds.length);
 assert.ok(page.rates.every(rate=>rate>97&&rate<=98));
 assert.ok(page.rates.every((rate,index)=>index===0||rate<page.rates[index-1]));
}
const beforeReset='2026-11-12T06:29:59Z';
const afterReset='2026-11-12T06:30:00Z';
function expectedIds(raw,time){
 const ranked=rankGames(normalizeGames(raw).games,cycleAt(Date.parse(time)).key);
 return ranked.slice(0,TOP_GAME_COUNT).map(game=>game.id);
}
test('the shipped file-compatible script rotates exactly ten ranked games at noon IST',async()=>{
 const page=createPage('file:');await flush();
 assert.deepEqual(page.cardIds,expectedIds(games,beforeReset));
 assert.equal(page.cardIds.length,10);
 assertFeaturedRates(page);
 assert.equal(page.fetchCalls,0);
 assert.equal(page.element('#games').attributes['aria-busy'],'false');
 assert.equal(page.element('#local-preview').hidden,false);
 assert.equal(page.element('#intro-count').textContent,10);

 const before=page.cardIds;
 const departed=games.find(game=>before.includes(game.id)&&!expectedIds(games,afterReset).includes(game.id));
 assert.ok(departed);
 page.element('#search').value=departed.name;
 page.element('#search').listeners.input();
 assert.ok(page.cardIds.includes(departed.id));
 page.advanceTo(afterReset);
 assert.ok(!page.cardIds.includes(departed.id));
 page.element('#search').value='';
 page.element('#search').listeners.input();
 assert.deepEqual(page.cardIds,expectedIds(games,afterReset));
 assertFeaturedRates(page);
 assert.notDeepEqual([...page.cardIds].sort(),[...before].sort());
});
test('local JSON picker keeps a smaller lineup searchable and handles invalid imports',async()=>{
 const page=createPage('file:');await flush();
 const small=[games[0],{id:'qa-extra-game',name:'QA Extra Game',category:'Sports',image:'assets/games/champions-320.webp'}];
 const input=page.element('#local-games-file');
 await input.listeners.change({target:{files:[{name:'games.json',text:async()=>JSON.stringify(small)}],value:'games.json'}});
 assert.equal(page.element('#total-games').textContent,small.length);
 assert.ok(page.element('#filters').innerHTML.includes('Sports'));
 assert.deepEqual(page.cardIds,expectedIds(small,beforeReset));
 assertFeaturedRates(page);
 page.element('#search').value='QA Extra Game';page.element('#search').listeners.input();
 assert.deepEqual(page.cardIds,['qa-extra-game']);
 await input.listeners.change({target:{files:[{name:'bad.json',text:async()=>'{ broken'}],value:'bad.json'}});
 assert.equal(page.element('#local-preview-error').hidden,false);
 assert.deepEqual(page.cardIds,['qa-extra-game'],'Invalid imported JSON keeps the working list');
});
test('the shipped script ranks the newly fetched hosted catalog and caps the lineup',async()=>{
 const extended=games.slice(1);
 const page=createPage('https:',extended);await flush();
 assert.equal(page.fetchCalls,1);
 assert.equal(page.element('.collection-count').textContent,10);
 assert.deepEqual(page.cardIds,expectedIds(extended,beforeReset));
});
