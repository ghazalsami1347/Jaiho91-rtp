import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { cycleAt, DAY_MS, demoBasisPoints, rankGames, filterGames, countdown, createCycleClock, hash32 } from '../core.js';
import {normalizeGames} from '../game-data.js';
import {BASELINE_IDS} from '../seed-ids.js';
const activeCatalog = normalizeGames(JSON.parse(await readFile(new URL('../games.json',import.meta.url),'utf8')));
// Algorithm fixtures stay independent of the user's editable game roster.
const catalog={games:BASELINE_IDS.map(id=>({id,name:id.replaceAll('-',' '),theme:id.includes('kraken')?'Mythology':'Adventure',aliases:[]}))};
test('cycle turns over at exactly noon IST, never local midnight', () => {
  const before = Date.parse('2026-11-03T11:59:59.999+05:30');
  const noon = before + 1;
  assert.equal(cycleAt(before).key,'2026-11-02');
  assert.equal(cycleAt(noon).key,'2026-11-03');
  assert.equal(cycleAt(noon).start,noon);
  assert.equal(cycleAt(noon).end,noon+DAY_MS);
  assert.equal(cycleAt(Date.parse('2026-11-04T00:00:00+05:30')).key,'2026-11-03');
});
test('month, year and leap-day boundaries', () => {
  assert.equal(cycleAt(Date.parse('2027-01-01T06:29:59Z')).key,'2026-12-31');
  assert.equal(cycleAt(Date.parse('2028-03-01T06:29:59Z')).key,'2028-02-29');
  assert.equal(cycleAt(Date.parse('2028-03-01T06:30:00Z')).key,'2028-03-01');
});
test('all representations of an instant yield the same cycle and ranking', () => {
  const variants = ['2026-11-03T12:00:00+05:30','2026-11-03T06:30:00Z','2026-11-02T22:30:00-08:00'];
  const results=variants.map(value => rankGames(catalog.games,cycleAt(Date.parse(value)).key));
  assert.deepEqual(results[0],results[1]); assert.deepEqual(results[0],results[2]);
});
test('values stay fixed throughout a cycle and ignore catalog order', () => {
  const start=Date.parse('2026-11-03T06:30:00Z');
  const a=rankGames(catalog.games,cycleAt(start).key);
  const b=rankGames([...catalog.games].reverse(),cycleAt(start+DAY_MS-1).key);
  assert.deepEqual(a,b);
});
test('adding an unrelated game cannot change existing values', () => {
  const a=rankGames(catalog.games,'2026-11-03');
  const b=rankGames([...catalog.games,{id:'new-game',name:'New game'}],'2026-11-03');
  for(const game of a) assert.equal(b.find(x=>x.id===game.id).basisPoints,game.basisPoints);
});
test('deterministic hash and daily fixed fixture', () => {
  assert.equal(hash32('jaiho91-demo-v1|2026-11-03|sugar-bang-bang'), 3400864178);
  assert.equal(demoBasisPoints('sugar-bang-bang','2026-11-03'),9249);
});
test('range, descending order and stable ASCII tie breaking across a full year', () => {
  for(let day=0;day<366;day++) {
    const key=cycleAt(Date.parse('2026-01-01T12:00:00Z')+day*DAY_MS).key;
    const ranked=rankGames(BASELINE_IDS.map(id=>({id})),key);
    assert.ok(ranked[0].basisPoints>=9700&&ranked[0].basisPoints<=9800,'Highest daily value must fall within 97–98%');
    assert.ok(ranked.at(-1).basisPoints>=4700&&ranked.at(-1).basisPoints<=4900,'Lowest daily value must fall within 47–49%');
    for(let i=0;i<ranked.length;i++) {
      assert.ok(ranked[i].basisPoints>=4700&&ranked[i].basisPoints<=9800);
      assert.equal(ranked[i].rank,i+1);
      if(i) { assert.ok(ranked[i-1].basisPoints>=ranked[i].basisPoints);
        if(ranked[i-1].basisPoints===ranked[i].basisPoints) assert.ok(ranked[i-1].id<ranked[i].id); }
    }
  }
});
test('new cycles regenerate the catalog', () => {
  const a=rankGames(catalog.games,'2026-11-03'),b=rankGames(catalog.games,'2026-11-04');
  assert.ok(a.filter(g=>g.basisPoints!==b.find(x=>x.id===g.id).basisPoints).length>catalog.games.length*.95);
});
test('actual scheduler updates at boundary without reload; catches sleep and backward clock changes', () => {
  let time=Date.parse('2026-11-03T06:29:59.999Z'),task,delay;
  const cycles=[],ticks=[];
  const clock=createCycleClock({now:()=>time,onCycle:c=>cycles.push(c.key),onTick:(c,t)=>ticks.push(countdown(c.end,t)),schedule:(fn,ms)=>{task=fn;delay=ms;return 1;},cancel:()=>{}});
  clock.start(); assert.deepEqual(cycles,['2026-11-02']); assert.equal(delay,1);assert.equal(ticks[0],'00:00:01');
  time+=1;task(); assert.deepEqual(cycles,['2026-11-02','2026-11-03']); assert.equal(ticks.at(-1),'24:00:00');
  time+=DAY_MS*3;clock.sync();assert.equal(cycles.at(-1),'2026-11-06');
  time-=DAY_MS;clock.sync();assert.equal(cycles.at(-1),'2026-11-05');
  const length=cycles.length;clock.stop();task();assert.equal(cycles.length,length);
});
test('search, aliases, themes and saved selection compose without re-ranking', () => {
  const ranked=rankGames(catalog.games,'2026-11-03');
  assert.equal(filterGames(ranked,' KRAKEN ').length,3);
  assert.equal(filterGames([{name:'Pinata Test',aliases:['Piñata Test']}],'piñata').length,1);
  const result=filterGames(ranked,'kraken','Mythology',true,new Set(['power-of-the-kraken-1']));
  assert.equal(result.length,1);assert.equal(result[0].id,'power-of-the-kraken-1');
  assert.equal(result[0].rank,ranked.find(g=>g.id==='power-of-the-kraken-1').rank);
  assert.equal(filterGames(ranked,'totally absent').length,0);
});
test('countdown clamps at zero and pads components', () => {
  assert.equal(countdown(1000,1001),'00:00:00');
  assert.equal(countdown(3661000,0),'01:01:01');
  assert.equal(countdown(DAY_MS,0),'24:00:00');
});
test('editable catalog accepts any count and keeps valid unique stable IDs', () => {
  assert.equal(new Set(activeCatalog.games.map(g=>g.id)).size,activeCatalog.games.length);
  for(const game of activeCatalog.games) {
    assert.ok(/^[a-z0-9-]+$/.test(game.id));assert.ok(activeCatalog.themes.includes(game.theme));assert.ok(game.name);
  }
  assert.equal(BASELINE_IDS.length,36,'Original launch baseline stays frozen while the editable list grows');
});
