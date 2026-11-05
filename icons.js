// A small, consistent outline icon set. No font glyphs or external dependencies.
const paths = {
  search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',
  bookmark: '<path d="M6 4h12v17l-6-4-6 4z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  up: '<path d="M12 20V4m-6 6 6-6 6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  trophy: '<path d="M8 3h8v6a4 4 0 0 1-8 0zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 1v6m-4 2h8"/>',
  Mythology: '<path d="m14 2-9 12h6l-1 8 9-12h-6z"/>',
  Animals: '<circle cx="6" cy="7" r="2"/><circle cx="11" cy="5" r="2"/><circle cx="17" cy="7" r="2"/><circle cx="20" cy="12" r="1.5"/><path d="M7 15c2-5 6-6 9-2 2 3 3 6 0 7-2 1-3-1-5-1-4 2-8-1-4-4z"/>',
  Cards: '<rect x="4" y="3" width="16" height="19" rx="3"/><path d="m12 7-4 5 4 5 4-5z"/>',
  Classics: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7 7h10l-6 10"/>',
  Adventure: '<path d="m3 19 6-13 4 8 3-5 5 10zm4-9 2 2 2-2"/><circle cx="18" cy="5" r="2"/>'
};
export function icon(name, extra = '') {
  return `<svg class="icon ${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.Cards}</svg>`;
}
