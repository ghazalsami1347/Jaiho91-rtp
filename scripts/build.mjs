import {cp,mkdir,access,rm} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {prepare} from './prepare.mjs';
const prepared=await prepare();
const destination=resolve('build');
if(relative(resolve('.'),destination)!=='build')throw Error('Build output must stay in this project');
await rm(destination,{recursive:true,force:true});
await mkdir(destination,{recursive:true});
const files=['index.html','arcade.css','site.js','games.json','robots.txt','sitemap.xml','.nojekyll','assets'];
for(const file of files)await cp(resolve(file),resolve(destination,file),{recursive:true});
try{await access('CNAME');await cp('CNAME',resolve(destination,'CNAME'));}catch(error){if(error.code!=='ENOENT')throw error;}
console.log(`Built file-compatible static website with ${prepared.games} games in build/`);
