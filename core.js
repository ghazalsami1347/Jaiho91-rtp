// Asia/Kolkata has a fixed UTC+05:30 offset. Noon IST = 06:30 UTC.
export const DAY_MS = 86_400_000;
export const RESET_UTC_MS = (6 * 60 + 30) * 60_000;
import { BASELINE_IDS } from './seed-ids.js';
export const SEED_VERSION = 'jaiho91-demo-v3';
export function cycleAt(now = Date.now()) {
  const time = Number(now);
  if (!Number.isFinite(time)) throw new TypeError('Invalid time');
  const index = Math.floor((time - RESET_UTC_MS) / DAY_MS);
  const start = index * DAY_MS + RESET_UTC_MS;
  return { index, start, end: start + DAY_MS, key: new Date(start).toISOString().slice(0, 10) };
}
export function hash32(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  // Avalanche avoids sequential IDs creating visibly related values.
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  return (hash ^ (hash >>> 16)) >>> 0;
}
const ranges = new Map();
function dailyRange(cycleKey) {
  if (ranges.has(cycleKey)) return ranges.get(cycleKey);
  const raw = BASELINE_IDS.map(id => hash32(`${SEED_VERSION}|${cycleKey}|${id}`));
  const range = {
    rawLow: Math.min(...raw), rawHigh: Math.max(...raw),
    low: 4700 + hash32(`${SEED_VERSION}|${cycleKey}|floor`) % 201,
    high: 9700 + hash32(`${SEED_VERSION}|${cycleKey}|ceiling`) % 101
  };
  if(ranges.size >= 8) ranges.delete(ranges.keys().next().value);
  ranges.set(cycleKey,range);
  return range;
}
export function demoBasisPoints(id, cycleKey) {
  // A frozen baseline guarantees daily endpoints without catalog-order dependence.
  const {rawLow,rawHigh,low,high} = dailyRange(cycleKey);
  const raw = hash32(`${SEED_VERSION}|${cycleKey}|${id}`);
  const normalized = Math.max(0,Math.min(1,(raw-rawLow)/(rawHigh-rawLow)));
  return low + Math.round(normalized * (high-low));
}
export function rankGames(games, cycleKey) {
  return games.map(game => ({ ...game, basisPoints: demoBasisPoints(game.id, cycleKey) }))
    .sort((a, b) => b.basisPoints - a.basisPoints || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((game, i) => ({ ...game, rank: i + 1 }));
}
export const percent = bp => (bp / 100).toFixed(2) + '%';
export function filterGames(games, query = '', theme = 'all', savedOnly = false, saved = new Set()) {
  const normalized = query.trim().toLowerCase();
  return games.filter(game => (theme === 'all' || game.theme === theme)
    && (!savedOnly || saved.has(game.id))
    && [game.name, ...(game.aliases || [])].some(value => value.toLowerCase().includes(normalized)));
}
export function countdown(end, now) {
  const total = Math.max(0, Math.ceil((end - now) / 1000));
  return [Math.floor(total / 3600), Math.floor(total / 60) % 60, total % 60]
    .map(value => String(value).padStart(2, '0')).join(':');
}
// Injectable scheduler makes the actual boundary/visibility mechanism testable.
export function createCycleClock({ now = Date.now, onCycle, onTick, schedule = setTimeout, cancel = clearTimeout }) {
  let cycleKey, timer, running = false;
  function update() {
    if (!running) return;
    cancel(timer);
    const time = now();
    const cycle = cycleAt(time);
    if (cycle.key !== cycleKey) { cycleKey = cycle.key; onCycle(cycle); }
    onTick(cycle, time);
    timer = schedule(update, Math.max(1, Math.min(1000 - (time % 1000), cycle.end - time)));
  }
  return {
    start() { running = true; update(); },
    sync: update,
    stop() { running = false; cancel(timer); }
  };
}
