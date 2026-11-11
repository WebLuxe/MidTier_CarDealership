// The front door for the three demos: one page that links to each tier and lets you put any dealer's name and colour on them.
import { esc } from './lib/core.mjs';

const INCLUDES = {
  low: ['Home, cars, a page for every car, contact', 'Photo gallery on every car', 'WhatsApp, Call and viewing request on every car', 'Loading screen and soft page changes', 'Live "open now" status, hours and directions', 'Google basics: titles, descriptions, dealer details'],
  mid: ['Everything in Starter', 'Budget slider on the home page', 'Search and filters: make, body, fuel, gearbox, year, budget', 'Leasing calculator and monthly price on each car', 'Sell or exchange page and About page', 'Full-screen photos, share button, price on the share picture', 'Opening animation and photos that grow into their page', 'Map and reviews. French ready as an add-on'],
  high: ['Everything in Business', '3D showroom on the home page with a live car', 'Start-the-engine intro with sound', 'Spin, dance and light-show tricks', 'Liquid glass design drawn by the graphics card', 'Filmed version for phones that cannot run 3D', 'Saved cars and compare three side by side'],
};

export function hub(C, built) {
  const tiers = Object.entries(C.demo.tiers || {}).filter(([k]) => built.includes(k));
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>Car dealership websites: three packages</title>
<style>
:root{--ink:#151a21;--accent:${C.colours.accent};--on:${C.colours.on};--line:#d7dce2;--mute:#5b6572}
*{box-sizing:border-box}body{margin:0;font:400 16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--ink);background:#f2f4f6}
main{width:min(100% - 32px,1120px);margin:0 auto;padding:clamp(28px,6vw,72px) 0}
h1{font-size:clamp(1.8rem,4.6vw,3rem);line-height:1.05;letter-spacing:-.02em;margin:0 0 12px;max-width:18ch}
.lead{font-size:1.1rem;color:#39424e;max-width:60ch;margin:0}
form{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:end;background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px;margin:28px 0}
label{display:grid;gap:4px;font-size:.86rem;font-weight:650;color:#39424e}
input[type=text]{min-height:46px;padding:10px 12px;border:1.5px solid var(--line);border-radius:10px;font:inherit;width:100%}
input[type=color]{width:64px;height:46px;border:1.5px solid var(--line);border-radius:10px;padding:3px;background:#fff}
button{min-height:46px;padding:0 18px;border:0;border-radius:10px;background:var(--ink);color:#fff;font:inherit;font-weight:650;cursor:pointer}
.note{grid-column:1/-1;font-size:.86rem;color:var(--mute);margin:0}
.tiers{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:16px;list-style:none;padding:0;margin:0}
.tiers li{background:#fff;border:1px solid var(--line);border-radius:16px;padding:22px;display:grid;gap:14px;align-content:start}
.tiers h2{margin:0;font-size:1.4rem;line-height:1.1}
.price{font-size:1.7rem;font-weight:800;letter-spacing:-.01em;margin:0}
.tiers ul{margin:0;padding:0;list-style:none;display:grid;gap:7px;font-size:.95rem}
.tiers ul li{all:unset;display:block;padding-left:22px;position:relative}
.tiers ul li::before{content:"";position:absolute;left:2px;top:.45em;width:10px;height:6px;border-left:2.5px solid var(--ink);border-bottom:2.5px solid var(--ink);rotate:-45deg}
.go{display:flex;align-items:center;justify-content:center;min-height:50px;border-radius:10px;background:var(--accent);color:var(--on);font-weight:700;text-decoration:none;margin-top:auto}
.go:focus-visible,button:focus-visible,input:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
@media(max-width:560px){form{grid-template-columns:1fr auto}form button{grid-column:1/-1}}
</style>
</head>
<body>
<main>
  <h1>One dealership, three websites</h1>
  <p class="lead">The same dealer and the same cars, built at three levels. Open each one to see exactly what each package adds.</p>
  <form id="f">
    <label>Put a dealer's name on the demos<input type="text" name="name" placeholder="${esc(C.name)}" maxlength="40" autocomplete="off"></label>
    <label>Their colour<input type="color" name="accent" value="${C.colours.accent}"></label>
    <button type="submit">Apply</button>
    <p class="note">The links below then open with that name and colour. It is also a link you can send: add <b>?name=Their+Name&amp;accent=e0262f</b> to any demo address.</p>
  </form>
  <ul class="tiers">
${tiers.map(([k, v]) => `    <li><h2>${esc(v.label)}</h2><p class="price">${esc(v.price)}</p>${v.admin ? `<p style="margin:-10px 0 0;color:#5b6572;font-weight:600">${esc(v.admin)}</p>` : ''}<ul>${INCLUDES[k].map((x) => `<li>${esc(x)}</li>`).join('')}</ul><a class="go" data-tier href="${v.dir || k}/">Open the ${esc(v.label)} site</a></li>`).join('\n')}
  </ul>
</main>
<script>
const f = document.getElementById('f'), links = [...document.querySelectorAll('[data-tier]')], base = links.map((a) => a.getAttribute('href'));
const DEF = '${C.colours.accent}';
function apply() {
  const p = new URLSearchParams(), name = f.elements.name.value.trim(), accent = f.elements.accent.value;
  if (name) p.set('name', name);
  if (accent.toLowerCase() !== DEF) p.set('accent', accent.slice(1));
  p.set('name', name || ${JSON.stringify(C.name)});
  if (!p.has('accent')) p.set('accent', DEF.slice(1));
  links.forEach((a, i) => (a.href = base[i] + '?' + p));
}
f.addEventListener('submit', (e) => { e.preventDefault(); apply(); links[0].closest('ul').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
f.addEventListener('input', apply);
</script>
</body>
</html>
`;
}
