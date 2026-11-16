import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const root = new URL('./', import.meta.url);
const source = readFileSync(new URL('src/clock.js', root), 'utf8');
const art = readFileSync(new URL('src/artwork.png', root)).toString('base64');
const bundle = source.replace('__IMAGE__', art);
mkdirSync(new URL('dist/', root), { recursive: true });
writeFileSync(new URL('dist/antarikfox-chrono-bio-clock.js', root), bundle);
writeFileSync(new URL('docs/preview.html', root), `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CHRONO / 03 BIO — by Antarikfox</title>
<style>body{margin:0;background:radial-gradient(ellipse at top,#3b4449,#11171a);color:#d9e2e5;font:15px system-ui;min-height:100vh;display:grid;place-content:center}main{width:min(1250px,98vw)}header{text-align:center}button{color:#ffc26b;background:#212a2f;border:1px solid #697176;border-radius:8px;padding:9px 16px;margin:8px;cursor:pointer}p{text-align:center;opacity:.7}</style>
<main><header><button data-lang="en">English</button><button data-lang="ru">Русский</button></header><antarikfox-chrono-bio-clock></antarikfox-chrono-bio-clock><p id="help"></p></main>
<script>${bundle}
const card=document.querySelector('antarikfox-chrono-bio-clock');
function setLanguage(language){card.setConfig({timezone:'Europe/Moscow',language});document.documentElement.lang=language;document.querySelector('#help').textContent=language==='ru'?'Ручки — яркость · тумблер — ночной режим · левый красный LED — настройки':'Knobs — brightness · toggle — night mode · left red LED — settings';}
document.querySelectorAll('[data-lang]').forEach(button=>button.addEventListener('click',()=>setLanguage(button.dataset.lang)));setLanguage('en');
</script></html>`);
console.log('Built standalone HA bundle and bilingual preview.');