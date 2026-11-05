// Exercise the shipped classic script, including its file:// branch, without
// requiring browser modules or relaxing browser file-origin protections.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../site.js',import.meta.url),'utf8');
const games=JSON.parse(await readFile(new URL('../games.json',import.meta.url),'utf8')).filter(g=>g.enabled!==false);
function createPage(protocol,liveGames=games){
 const elements=new Map();let fetchCalls=0;
 function element(selector){
  if(!elements.has(selector))elements.set(selector,{value:'',hidden:false,open:false,innerHTML:'',textContent:'',attributes:{},listeners:{},get children(){return Array.from({length:(this.innerHTML.match(/<article class="game-card/g)||[]).length},()=>({querySelector:()=>({focus(){}})}))},setAttribute(name,value){this.attributes[name]=value},addEventListener(name,callback){this.listeners[name]=callback},focus(){},click(){},showModal(){this.open=true},close(){this.open=false}});
  return elements.get(selector);
 }
 const document={querySelector:element,querySelectorAll:()=>[],addEventListener(){},activeElement:{tagName:'BODY'},hidden:false};
 const context={document,window:{addEventListener(){}},location:{protocol},localStorage:{getItem(){throw Error('Storage blocked')},setItem(){throw Error('Storage blocked')}},setTimeout:()=>1,clearTimeout(){},console,fetch:async()=>{fetchCalls++;if(protocol==='file:')throw Error('File fetch blocked');return{ok:true,json:async()=>liveGames}}};
 vm.runInNewContext(source,context,{timeout:1000});
 return{element,get fetchCalls(){return fetchCalls},get cardCount(){return(element('#games').innerHTML.match(/<article class="game-card/g)||[]).length}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function expand(page){while(!page.element('#load-more').hidden)page.element('#load-more').listeners.click();}
test('shipped file-compatible script renders all covers even when fetch and storage are blocked',async()=>{
 const page=createPage('file:');await flush();
 assert.equal(page.cardCount,Math.min(36,games.length));
 expand(page);assert.equal(page.cardCount,games.length);
 assert.equal(page.fetchCalls,0);
 assert.equal(page.element('#games').attributes['aria-busy'],'false');
 assert.equal(page.element('#local-preview').hidden,false);
 assert.equal(page.element('#intro-count').textContent,games.length);
});
test('local JSON picker can add one game and update counts, category filters and search',async()=>{
 const page=createPage('file:');await flush();
 const extended=[...games,{id:'qa-extra-game',name:'QA Extra Game',category:'Sports',image:'assets/games/champions-320.webp'}];
 const input=page.element('#local-games-file');
 await input.listeners.change({target:{files:[{name:'games.json',text:async()=>JSON.stringify(extended)}],value:'games.json'}});
 assert.equal(page.element('#total-games').textContent,extended.length);
 assert.ok(page.element('#filters').innerHTML.includes('Sports'));
 expand(page);assert.equal(page.cardCount,extended.length);
 page.element('#search').value='QA Extra Game';page.element('#search').listeners.input();
 assert.equal(page.cardCount,1);assert.ok(page.element('#games').innerHTML.includes('qa-extra-game'));
 await input.listeners.change({target:{files:[{name:'bad.json',text:async()=>'{ broken'}],value:'bad.json'}});
 assert.equal(page.element('#local-preview-error').hidden,false);
 assert.equal(page.cardCount,1,'Invalid imported JSON keeps the working list');
});
test('same shipped script uses newly fetched hosted JSON instead of its older embedded snapshot',async()=>{
 const extended=[...games,{id:'qa-hosted-game',name:'Hosted Addition',category:'New category'}];
 const page=createPage('https:',extended);await flush();
 assert.equal(page.fetchCalls,1);
 assert.equal(page.element('.collection-count').textContent,extended.length);
 assert.ok(page.element('#filters').innerHTML.includes('New category'));
 expand(page);assert.equal(page.cardCount,extended.length);
});
