// One editable games.json drives cards, filters, counts, search and rankings.
export const DEFAULT_THEMES=['Mythology','Animals','Cards','Classics','Adventure'];
export function normalizeGames(input){
  const entries=Array.isArray(input)?input:input?.games;
  if(!Array.isArray(entries))throw new TypeError('games.json must contain an array of game objects.');
  const ids=new Set();
  const games=entries.map((entry,index)=>{
    if(!entry||typeof entry!=='object'||Array.isArray(entry))throw new TypeError(`Game ${index+1} must be an object.`);
    const name=typeof entry.name==='string'?entry.name.trim():'';
    if(!name)throw new TypeError(`Game ${index+1} needs a name.`);
    const id=typeof entry.id==='string'?entry.id.trim():'';
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))throw new TypeError(`${name}: use an id such as "new-game" (lowercase letters, numbers and hyphens).`);
    if(ids.has(id))throw new TypeError(`Duplicate game id: ${id}. Give every game a unique id.`);
    ids.add(id);
    const category=entry.category??entry.theme??'Adventure';
    if(typeof category!=='string'||!category.trim())throw new TypeError(`${name}: category must be text.`);
    const image=entry.image??entry.thumbnail??null;
    const imageSmall=entry.imageSmall??entry.thumbnailSmall??image;
    const imageLarge=entry.imageLarge??entry.thumbnailLarge??image;
    for(const value of [image,imageSmall,imageLarge]){
      if(value!==null&&(typeof value!=='string'||!value.trim()||/^\s*(?:javascript|data|vbscript):/i.test(value)))throw new TypeError(`${name}: image must be a filename or an HTTP(S) image URL.`);
    }
    return {...entry,id,name,theme:category.trim(),thumbnail:image,thumbnailSmall:imageSmall,thumbnailLarge:imageLarge,
      aliases:Array.isArray(entry.aliases)?entry.aliases.filter(x=>typeof x==='string'):[],
      description:typeof entry.description==='string'?entry.description:'',
      artworkCredit:typeof entry.artworkCredit==='string'?entry.artworkCredit:'Artwork supplied for this collection.'};
  }).filter(entry=>entry.enabled!==false);
  const used=new Set(games.map(game=>game.theme));
  const themes=[...DEFAULT_THEMES.filter(theme=>used.has(theme)),...used].filter((theme,index,all)=>all.indexOf(theme)===index);
  return {games,themes};
}
export async function loadGameList({protocol,fetcher,localGames}){
  // file:// cannot fetch adjacent JSON in normal browser security settings.
  // The shipped classic script includes a snapshot for double-click previewing.
  if(protocol==='file:')return localGames;
  const response=await fetcher('./games.json',{cache:'no-store'});
  if(!response.ok)throw new Error(`Could not load games.json (HTTP ${response.status}).`);
  return response.json();
}
