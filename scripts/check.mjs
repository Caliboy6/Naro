import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root=path.join(project,'public');
const read=file=>fs.readFileSync(file,'utf8');
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(item=>item.isDirectory()?files(path.join(dir,item.name)):[path.join(dir,item.name)]);}
const all=files(root),errors=[];
function checkRef(file,reference){
 if(path.extname(file)==='.js'&&!/^(?:\.{1,2}\/|\/)/.test(reference))return;
 if(!reference||/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(reference))return;
 const clean=reference.split(/[?#]/)[0];if(!clean)return;
 let target=path.resolve(clean.startsWith('/')?root:path.dirname(file),'.'+(clean.startsWith('/')?clean:'/'+clean));
 if(!target.startsWith(root+path.sep)&&target!==root){errors.push(`Resource escapes public: ${reference}`);return;}
 if(!fs.existsSync(target)||fs.statSync(target).isDirectory()){
  if(['','/','/vaults','/vaults/','/btcvc','/btcvc/','/btcvp','/btcvp/','/ethvp','/ethvp/'].includes(clean))return;
  errors.push(`${path.relative(root,file)} → ${reference}`);
 }
}
for(const file of all){
 const ext=path.extname(file);if(!['.html','.css','.js'].includes(ext))continue;
 const s=read(file);
 const patterns=ext==='.html'?[/\b(?:src|href)=["']([^"']+)["']/g]:ext==='.css'?[/url\(\s*["']?([^"')\s]+)["']?\s*\)/g]:[/\b(?:from\s*|import\s*)["']([^"']+)["']/g,/\bimport\(\s*["']([^"']+)["']\s*\)/g];
 for(const pattern of patterns)for(const match of s.matchAll(pattern))checkRef(file,match[1]);
 if(ext==='.js'&&file.includes(path.sep+'enhancements'+path.sep)){
  const checked=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(checked.status!==0)errors.push(checked.stderr);
 }
}
for(const route of ['index.html','vaults.html','btcvp/index.html','btcvc/index.html','ethvp/index.html'])if(!fs.existsSync(path.join(root,route)))errors.push('Missing route '+route);
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
else console.log(`Checked ${all.length} public files: required routes, resource references and authored module syntax passed.`);
if(process.argv.includes('--verify-export')){
 const manifest=JSON.parse(read(path.join(project,'docs/PUBLIC_VERSION.json')));
 for(const entry of manifest.files){const file=path.join(root,entry.path);if(!fs.existsSync(file)||crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==entry.sha256){console.error('Public v10 mismatch: '+entry.path);process.exitCode=1;}}
 if(!process.exitCode)console.log('Public version 10: all exported file hashes match.');
}
