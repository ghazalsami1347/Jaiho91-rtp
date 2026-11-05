import { cycleAt, rankGames, percent, filterGames, countdown, createCycleClock } from './core.js';
import { icon } from './icons.js';
import { normalizeGames, loadGameList } from './game-data.js';
const $ = selector => document.querySelector(selector);
document.querySelectorAll('[data-icon]').forEach(element => element.innerHTML = icon(element.dataset.icon));
let catalog, ranked = [], cycle, clock, limit = 36, theme = 'all', savedOnly = false, dialogGameId;
let saved;
try { const parsed = JSON.parse(localStorage.getItem('jaiho91-saved-v1') || '[]'); saved = new Set(Array.isArray(parsed) ? parsed.filter(x => typeof x === 'string') : []); }
catch { saved = new Set(); }
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function artwork(game, className = '', size = 'card', eager = false) {
  if (game.thumbnail) {
    const path=escape(game.thumbnail), small=escape(game.thumbnailSmall||game.thumbnail), large=escape(game.thumbnailLarge||game.thumbnail);
    const src=size==='leader'?small:size==='dialog'?large:path;
    const srcset=size==='card'&&(small!==path||large!==path)?' srcset="'+small+' 128w, '+path+' 320w, '+large+' 640w" sizes="(min-width:1200px) 280px, (min-width:760px) 24vw, (min-width:480px) 30vw, 46vw"':'';
    return '<img class="game-art '+className+'" src="'+src+'"'+srcset+' alt="" width="640" height="640" loading="'+(eager?'eager':'lazy')+'" decoding="async" data-fallback-theme="'+game.theme+'">';
  }
  return '<div class="game-art placeholder '+className+'" aria-hidden="true">'+icon(game.theme)+'</div>';
}
function saveButton(game) {
  return `<button class="save-button ${saved.has(game.id) ? 'is-saved' : ''}" type="button" data-save="${game.id}" aria-label="Save ${escape(game.name)}" aria-pressed="${saved.has(game.id)}">${icon('bookmark')}</button>`;
}
function card(game) {
  return `<article class="game-card ${game.rank<=3?'top-game':''}" id="game-${game.id}" data-art-theme="${escape(game.theme)}"><div class="cover-wrap"><button class="cover-link" data-details="${game.id}" type="button" aria-label="View ${escape(game.name)} details">${artwork(game)}</button><span class="cover-rank ${game.rank<=3?'is-top':''}">#${game.rank}</span>${saveButton(game)}</div><div class="card-body"><span class="game-theme">${escape(game.theme)}</span><h3><button class="game-title" data-details="${game.id}" type="button">${escape(game.name)}</button></h3><div class="card-rtp"><span>RTP</span><strong>${percent(game.basisPoints)}</strong></div><div class="meter" aria-hidden="true"><span style="width:${game.basisPoints/100}%"></span></div></div></article>`;
}
function renderLeaders() {
  $('#leaders').innerHTML = ranked.slice(0,3).map((game,index) => `<article class="spotlight spotlight-${index+1}"><div class="spotlight-cap"><span class="podium-number">${String(index+1).padStart(2,'0')}</span><span class="podium-label">${['HIGHEST RTP','SECOND','THIRD'][index]}<small>${escape(game.theme)} · RTP</small></span><span class="podium-emblem">${icon('trophy')}</span></div><div class="spotlight-visual"><button class="spotlight-cover" type="button" data-details="${game.id}" aria-label="View ${escape(game.name)} details">${artwork(game,'spotlight-image','card',true)}</button><span class="spotlight-view">GAME DETAILS ${icon('arrow')}</span></div><div class="spotlight-body"><h3><button class="game-title" type="button" data-details="${game.id}">${escape(game.name)}</button></h3><div class="spotlight-value"><div><small>RTP</small><strong>${percent(game.basisPoints)}</strong></div><button class="spotlight-open" type="button" data-details="${game.id}" aria-label="View ${escape(game.name)} details">${icon('arrow')}</button></div></div></article>`).join('');
  $('#hero-deck').innerHTML = ranked.slice(0,3).map((game,index)=>`<div class="deck-card deck-card-${index}">${artwork(game,'','card',false)}<span>#${index+1}</span></div>`).join('');
}
function render() {
  const filtered = filterGames(ranked, $('#search').value, theme, savedOnly, saved);
  $('#games').innerHTML = filtered.slice(0,limit).map(card).join('');
  $('#games').setAttribute('aria-busy','false');
  $('#empty').hidden = filtered.length > 0;
  $('#results-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'game' : 'games'}`;
  $('#shown-count').textContent = filtered.length ? `Showing ${Math.min(limit,filtered.length)} of ${filtered.length} games` : '';
  $('#load-more').hidden = filtered.length <= limit;
  $('#saved-count').textContent = [...saved].filter(id => catalog.games.some(g => g.id === id)).length;
  $('#saved-filter').setAttribute('aria-pressed', savedOnly);
}
function renderDialog(id) {
  const game = ranked.find(game => game.id === id);
  if (!game) return;
  dialogGameId = id;
  $('#dialog-content').innerHTML = `${artwork(game,'dialog-art','dialog',true)}<span class="eyebrow">${escape(game.theme)} / RANK #${game.rank}</span><h2 id="dialog-title">${escape(game.name)}</h2><div class="dialog-value"><span>RTP</span><strong>${percent(game.basisPoints)}</strong></div><p>Last updated at 12 PM IST on ${escape(new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Kolkata'}).format(cycle.start))}.</p>${game.description?'<p>'+escape(game.description)+'</p>':''}<button type="button" class="secondary" data-save="${game.id}" aria-pressed="${saved.has(game.id)}">${icon('bookmark')} ${saved.has(game.id) ? 'Saved' : 'Save game'}</button>`;
}
function onCycle(nextCycle) {
  const changed = Boolean(cycle);
  cycle = nextCycle;
  ranked = rankGames(catalog.games, cycle.key);
  const date = new Intl.DateTimeFormat('en-IN', {timeZone:'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric'}).format(cycle.start);
  $('#cycle-date').textContent = date + ' · 12 PM IST';
  $('#edition').textContent = 'IST / ' + new Intl.DateTimeFormat('en-IN', { timeZone:'Asia/Kolkata', day:'2-digit', month:'short' }).format(cycle.start).toUpperCase();
  renderLeaders(); render();
  if ($('#game-dialog').open) renderDialog(dialogGameId);
  if (changed) $('#announcer').textContent = 'The 12 PM IST update is ready. The game list and rankings have changed.';
}
function applyCatalog(raw) {
    const nextCatalog=normalizeGames(raw);
    catalog=nextCatalog;
    $('#error').hidden=true;
    if(!catalog.themes.includes(theme))theme='all';
    limit=36;
    $('.collection-count').textContent = catalog.games.length;
    $('#total-games').textContent = catalog.games.length;
    $('#intro-count').textContent = catalog.games.length;
    $('#filters').innerHTML = ['all',...catalog.themes].map(item => `<button class="filter" data-theme="${escape(item)}" type="button" aria-pressed="${item === theme}">${item === 'all' ? 'All games' : escape(item)}</button>`).join('');
    clock?.stop();
    clock = createCycleClock({ onCycle, onTick: (c,time) => {
      $('#countdown').textContent = countdown(c.end,time);
      $('#countdown').dateTime = 'PT' + Math.max(0,Math.ceil((c.end-time)/1000)) + 'S';
    }});
    clock.start();
}
async function init() {
  $('#error').hidden = true;
  try {
    const raw=await loadGameList({protocol:location.protocol,fetcher:(url,options)=>fetch(url,options),localGames:typeof LOCAL_GAMES!=='undefined'?LOCAL_GAMES:[]});
    applyCatalog(raw);
  } catch (error) {
    $('#error').hidden = false;
    $('#games').innerHTML = '';
    $('#games').setAttribute('aria-busy','false');
    $('#results-count').textContent = 'Collection unavailable';
    $('#leaders').textContent = 'Daily ranking unavailable. Retry below.';
    $('#cycle-date').textContent = 'Collection unavailable';
    $('#catalog-error-message').textContent='The game list could not be loaded. Please try again.';
    console.error('Unable to load game list:',error);
  }
}
$('#retry').addEventListener('click',init);
$('#search').addEventListener('input',() => {limit = 36;if(catalog)render();});
$('#filters').addEventListener('click',event => {
  const target = event.target.closest('[data-theme]'); if (!target) return;
  theme = target.dataset.theme; limit = 36;
  document.querySelectorAll('[data-theme]').forEach(button => button.setAttribute('aria-pressed',button === target)); render();
});
$('#saved-filter').addEventListener('click',() => { savedOnly = !savedOnly; limit = 36; if(catalog) render(); });
$('#clear-filters').addEventListener('click',() => {
  theme = 'all'; savedOnly = false; limit = 36; $('#search').value = '';
  document.querySelectorAll('[data-theme]').forEach(button => button.setAttribute('aria-pressed',button.dataset.theme === 'all')); render(); $('#search').focus();
});
$('#load-more').addEventListener('click',() => {
  const currentCount = $('#games').children.length;
  limit += 36; render();
  $('#games').children[currentCount]?.querySelector('.game-title')?.focus();
});
document.addEventListener('click',event => {
  const save = event.target.closest('[data-save]');
  if(save) {
    const id = save.dataset.save;
    saved.has(id) ? saved.delete(id) : saved.add(id);
    try { localStorage.setItem('jaiho91-saved-v1',JSON.stringify([...saved])); } catch { /* Saving remains functional in memory. */ }
    // Preserve focus when replacing the card collection.
    const inDialog = Boolean(save.closest('dialog'));
    render();
    if(inDialog) { renderDialog(id); $('#dialog-content [data-save]').focus(); }
    else (document.querySelector(`[data-save="${id}"]`) || $('#saved-filter')).focus();
    $('#announcer').textContent = saved.has(id) ? 'Game saved.' : 'Game removed from saved collection.';
  }
  const details = event.target.closest('[data-details]');
  if(details) { renderDialog(details.dataset.details); $('#game-dialog').showModal(); }
});
$('#dialog-close').addEventListener('click',() => $('#game-dialog').close());
$('#game-dialog').addEventListener('click',event => { if(event.target === $('#game-dialog')) { const r=event.target.getBoundingClientRect(); if(event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) event.target.close(); } });
document.addEventListener('keydown',event => {
  if(event.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !$('#game-dialog').open && !event.metaKey && !event.ctrlKey && !event.altKey) { event.preventDefault(); $('#search').focus(); }
});
document.addEventListener('visibilitychange',() => { if (document.hidden) clock?.stop(); else clock?.start(); });
window.addEventListener('focus',() => clock?.sync());
window.addEventListener('pageshow',() => clock?.sync());
window.addEventListener('storage',event => { if(event.key === 'jaiho91-saved-v1') { try {const value=JSON.parse(event.newValue || '[]'); saved=new Set(Array.isArray(value)?value.filter(x=>typeof x==='string'):[]);if(catalog)render();if($('#game-dialog').open)renderDialog(dialogGameId);}catch {} } });
// Broken replacement images degrade to the existing theme placeholder.
document.addEventListener('error',event => {
  const img = event.target;
  if(img.matches?.('img[data-fallback-theme]')) {
    const game = { theme:img.dataset.fallbackTheme,thumbnail:null };
    img.outerHTML = artwork(game);
  }
},true);
if(location.protocol==='file:'){
  $('#local-preview').hidden=false;
  $('#load-local-games').addEventListener('click',()=>$('#local-games-file').click());
  $('#local-games-file').addEventListener('change',async event=>{
    const file=event.target.files?.[0];if(!file)return;
    try{
      const raw=JSON.parse(await file.text());
      applyCatalog(raw);
      $('#local-preview-message').textContent=`${catalog.games.length} games loaded from ${file.name} for this preview.`;
      $('#local-preview-error').hidden=true;
    }catch(error){$('#local-preview-error').textContent=error.message;$('#local-preview-error').hidden=false;}
    event.target.value='';
  });
}
init();
