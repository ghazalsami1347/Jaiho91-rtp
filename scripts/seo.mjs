import {readFile,writeFile} from 'node:fs/promises';
import {normalizeGames} from '../game-data.js';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createSeo(config,games){
  const site=new URL(config.siteUrl);
  if(site.protocol!=='https:'||site.search||site.hash||site.username||site.password)throw Error('Set siteUrl to the public HTTPS site root, without query strings or fragments.');
  if(!site.pathname.endsWith('/'))site.pathname+='/';
  const canonical=site.href;
  for(const field of ['siteName','title','description','language','locale','shareImage','shareImageAlt'])if(typeof config[field]!=='string'||!config[field].trim())throw Error(`seo.config.json needs ${field}`);
  const image=new URL(config.shareImage,canonical).href;
  const meta=(name,value,property=false)=>`  <meta ${property?'property':'name'}="${name}" content="${escape(value)}">`;
  const graph={
    '@context':'https://schema.org',
    '@graph':[
      {'@type':'WebSite','@id':canonical+'#website',url:canonical,name:config.siteName,inLanguage:config.language,description:config.description},
      {'@type':'ImageObject','@id':canonical+'#share-image',url:image,width:1200,height:630,caption:config.shareImageAlt},
      {'@type':'CollectionPage','@id':canonical+'#page',url:canonical,name:config.title,description:config.description,inLanguage:config.language,isPartOf:{'@id':canonical+'#website'},primaryImageOfPage:{'@id':canonical+'#share-image'},mainEntity:{'@id':canonical+'#games'}},
      {'@type':'ItemList','@id':canonical+'#games',name:'Jaiho91 game list',numberOfItems:games.length,itemListOrder:'https://schema.org/ItemListUnordered',itemListElement:games.map((g,index)=>({'@type':'ListItem',position:index+1,name:g.name,url:canonical+'#game-'+g.id,...(g.thumbnail?{image:new URL(g.thumbnail,canonical).href}:{})}))}
    ]
  };
  const head=[
    `  <title>${escape(config.title)}</title>`,
    meta('description',config.description),
    meta('robots',config.allowIndexing?'index, follow, max-image-preview:large':'noindex, follow'),
    `  <link rel="canonical" href="${escape(canonical)}">`,
    meta('og:type','website',true),meta('og:site_name',config.siteName,true),meta('og:title',config.title,true),
    meta('og:description',config.description,true),meta('og:url',canonical,true),meta('og:locale',config.locale,true),
    meta('og:image',image,true),meta('og:image:secure_url',image,true),meta('og:image:type','image/jpeg',true),
    meta('og:image:width','1200',true),meta('og:image:height','630',true),meta('og:image:alt',config.shareImageAlt,true),
    meta('twitter:card','summary_large_image'),meta('twitter:title',config.title),meta('twitter:description',config.description),
    meta('twitter:image',image),meta('twitter:image:alt',config.shareImageAlt),
    `  <script type="application/ld+json">${JSON.stringify(graph).replaceAll('<','\\u003c')}</script>`
  ].join('\n');
  const fallback=games.map(g=>`<article class="game-card" id="game-${g.id}" data-art-theme="${escape(g.theme)}"><div class="cover-wrap"><a class="cover-link" href="#about" aria-label="${escape(g.name)}: about RTP">${g.thumbnail?`<img class="game-art" src="${escape(g.thumbnail)}" alt="${escape(g.name)} game cover" width="320" height="320" loading="lazy" decoding="async">`:'<span class="static-no-image">Game cover</span>'}</a></div><div class="card-body"><span class="game-theme">${escape(g.theme)}</span><h3>${escape(g.name)}</h3><span class="static-update-label">Daily list · update at 12 PM IST</span></div></article>`).join('\n');
  const sitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(canonical)}</loc></url></urlset>\n`;
  const robots=`User-agent: *\nAllow: /\n${config.allowIndexing?'\nSitemap: '+new URL('sitemap.xml',canonical).href+'\n':''}`;
  return{canonical,image,head,fallback,sitemap,robots,graph};
}
export async function writeSeo(raw){
  const config=JSON.parse(await readFile('seo.config.json','utf8'));
  const catalog=normalizeGames(raw);
  const seo=createSeo(config,catalog.games);
  let html=await readFile('index.html','utf8');
  if(!html.includes('<!-- SEO:START -->')||!html.includes('<!-- GAME_LIST:START -->'))throw Error('index.html is missing SEO generation markers.');
  html=html.replace(/<!-- SEO:START -->[\s\S]*?<!-- SEO:END -->/,`<!-- SEO:START -->\n${seo.head}\n  <!-- SEO:END -->`);
  html=html.replace(/<!-- GAME_LIST:START -->[\s\S]*?<!-- GAME_LIST:END -->/,`<!-- GAME_LIST:START -->\n${seo.fallback}\n      <!-- GAME_LIST:END -->`);
  html=html.replace(/<html\s[^>]*>/,`<html lang="${escape(config.language)}" prefix="og: https://ogp.me/ns#">`);
  for(const id of ['intro-count','total-games'])html=html.replace(new RegExp(`(id="${id}">)[^<]*`),(_match,prefix)=>prefix+catalog.games.length);
  html=html.replace(/(class="collection-count">)[^<]*/,(_match,prefix)=>prefix+catalog.games.length);
  await writeFile('index.html',html);
  await writeFile('robots.txt',seo.robots);
  await writeFile('sitemap.xml',seo.sitemap);
  return seo;
}
