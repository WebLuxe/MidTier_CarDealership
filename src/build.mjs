// node src/build.mjs [low|mid|high|all] [--client=client] [--out=dist]
// Builds a finished static website for each tier from one client folder. The output works at any address or sub-folder.
import { build as esbuild } from 'esbuild';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { rmSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TIERS, loadClient, loadStock, translator, esc } from './lib/core.mjs';
import { buildImages } from './lib/images.mjs';
import { STR } from './i18n.mjs';
import * as P from './pages.mjs';
import { hub } from './hub.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), opt = (k, d) => (args.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1] || d;
const which = args.find((a) => !a.startsWith('--')) || 'all';
const clientDir = resolve(ROOT, opt('client', 'client')), outRoot = resolve(ROOT, opt('out', 'dist'));
const tiers = which === 'all' ? Object.keys(TIERS) : [which];
if (!tiers.every((t) => TIERS[t])) { console.error(`Unknown tier "${which}". Use low, mid, high or all.`); process.exit(1); }

const hash = (buf) => createHash('sha1').update(buf).digest('hex').slice(0, 8);
const write = (file, data) => { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, data); };
const dirSize = (d) => readdirSync(d, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? dirSize(join(d, e.name)) : statSync(join(d, e.name)).size), 0);
const kb = (n) => (n / 1024).toFixed(n < 102400 ? 1 : 0) + ' KB';

const C = loadClient(clientDir);
const stock = loadStock(clientDir, C);

for (const tier of tiers) {
  const T = { ...TIERS[tier] }, out = join(outRoot, C.demo.tiers?.[tier]?.dir || tier), t0 = Date.now();
  rmSync(out, { recursive: true, force: true });
  mkdirSync(join(out, 'assets'), { recursive: true });
  const cars = stock.cars.slice(0, T.maxCars);
  C.colours = C.coloursFor(tier);
  if (tier === 'mid' && Array.isArray(C.languages)) T.langs = C.languages; // French is a per-client switch

  // code and styles: one small file each, named by its contents so browsers can keep it for a year
  const js = (await esbuild({ entryPoints: [join(ROOT, 'src/js', `${tier}.js`)], bundle: true, minify: true, format: 'esm', target: 'es2020', write: false, legalComments: 'none' })).outputFiles[0].contents;
  const css = (await esbuild({ entryPoints: [join(ROOT, 'src/css', `${tier}.css`)], bundle: true, minify: true, write: false, loader: { '.css': 'css' }, target: ['chrome100', 'safari15', 'firefox100'], legalComments: 'none' })).outputFiles[0].contents;
  const font = readFileSync(join(ROOT, 'src/fonts/archivo-latin.woff2'));
  const files = { js: `assets/app.${hash(js)}.js`, css: `assets/app.${hash(css)}.css`, font: `assets/archivo.${hash(font)}.woff2`, data: {} };
  write(join(out, files.js), js); write(join(out, files.css), css); write(join(out, files.font), font);

  const featuredId = (cars.find((c) => c.featured && c.status === 'available' && c.photos.length) || cars.find((c) => c.photos.length) || cars[0])?.id;
  const images = await buildImages({ clientDir, outDir: out, cacheDir: join(ROOT, '.cache', 'img'), cars, T, C, featuredId });
  if (C.logoFile) copyFileSync(join(clientDir, C.logoFile), join(out, 'img', C.logoFile));

  const urls = [];
  for (const lang of T.langs) {
    const t = translator(lang), strings = Object.fromEntries(Object.entries(STR[lang]).filter(([k]) => k.startsWith('js.')).map(([k, v]) => [k.slice(3), v]));
    const days = [0, 1, 2, 3, 4, 5, 6].map((d) => t('day.' + d));
    const make = (path) => {
      const depth = path.split('/').length - 1, up = '../'.repeat(depth), base = up + (lang === 'en' ? '' : '../');
      return {
        C, T, tier, lang, t, cars, images, files, path, txt: C.text?.[lang] || C.text.en,
        rel: (p) => up + p, asset: (p) => base + p,
        other: (l) => base + (l === 'en' ? '' : l + '/') + path,
        clientData: () => ({
          name: C.name, legal: C.legalName, logo: C.logoText, wa: C.whatsapp, mail: C.email || '', tz: C.timeZone || 'UTC', hours: C.hoursByDay, cur: C.currency,
          tier, lang, demo: C.demo.enabled, fin: C.finance.enabled ? { rate: C.finance.rate, dep: C.finance.depositPct, months: C.finance.months } : null, days, s: strings,
        }),
        headScript: T.loader ? `<script>try{var d=document.documentElement,s=sessionStorage;if(!s.getItem("sk:seen")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){d.classList.add("loading");setTimeout(function(){d.classList.remove("loading")},4500)}s.setItem("sk:seen","1")}catch(e){}</script>` : '',
      };
    };
    const emit = (path, html) => { write(join(out, lang === 'en' ? '' : lang, path), html); if (!/^(404|compare)/.test(path)) urls.push([lang, path]); };
    const pages = { index: P.home, cars: P.cars, finance: P.finance, sell: P.sell, about: P.about, contact: P.contact, compare: P.compare, privacy: (c) => P.legal(c, 'privacy'), terms: (c) => P.legal(c, 'terms'), 404: P.notFound };
    if (T.compare) { files.data[lang] = `assets/cars-${lang}.json`; }
    for (const p of T.pages) emit(`${p}.html`, pages[p](make(`${p}.html`)));
    if (T.carPages) for (const car of cars) emit(`car/${car.id}.html`, P.carPage(make(`car/${car.id}.html`), car));
    if (T.compare) write(join(out, files.data[lang]), JSON.stringify(P.carsData(make('compare.html'))));
  }

  // the small files around the pages
  const on = C.colours.on, letter = esc(C.name.trim()[0].toUpperCase());
  write(join(out, 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="${C.colours.accent}"/><text x="32" y="46" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="40" fill="${on}">${letter}</text></svg>`);
  const abs = (lang, p) => `${C.siteUrl}/${lang === 'en' ? '' : lang + '/'}${p === 'index.html' ? '' : p}`;
  write(join(out, 'robots.txt'), C.demo.enabled ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\n${C.siteUrl ? `Sitemap: ${C.siteUrl}/sitemap.xml\n` : ''}`);
  if (C.siteUrl && !C.demo.enabled) write(join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([l, p]) => `<url><loc>${esc(abs(l, p))}</loc><lastmod>${stock.updated}</lastmod></url>`).join('\n')}\n</urlset>\n`);
  if (tier === 'mid') {
    write(join(out, 'site.webmanifest'), JSON.stringify({ name: C.name, short_name: C.name, start_url: './', display: 'browser', background_color: '#ffffff', theme_color: C.colours.ink, icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }] }));
    write(join(out, 'llms.txt'), `# ${C.name}\n\nUsed car dealer at ${C.address}. Phone ${C.phones.join(', ')}.\n\n## Cars in stock (${stock.updated})\n\n${cars.filter((c) => c.status !== 'sold').map((c) => `- ${c.year} ${c.name}: ${C.currency} ${c.price.toLocaleString('en-US')}${c.mileage != null ? `, ${c.mileage.toLocaleString('en-US')} km` : ''}${c.gearbox ? ', ' + c.gearbox : ''}${c.fuel ? ', ' + c.fuel : ''}${C.siteUrl ? ` (${C.siteUrl}/car/${c.id}.html)` : ''}`).join('\n')}\n`);
  }
  write(join(out, '.nojekyll'), '');

  const html = urls.length + (T.pages.includes('404') ? T.langs.length : 0) + (T.compare ? T.langs.length : 0);
  console.log(`${tier.padEnd(4)} ${String(html).padStart(3)} pages, ${cars.length} cars, ${images.files} images (${images.made} new) | js ${kb(gzipSync(js).length)} gz, css ${kb(gzipSync(css).length)} gz | site ${(dirSize(out) / 1048576).toFixed(1)} MB | ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
if (C.demo.enabled) write(join(outRoot, 'index.html'), hub(C, ['low', 'mid', 'high'].filter((t) => existsSync(join(outRoot, C.demo.tiers?.[t]?.dir || t, 'index.html')))));
console.log(`Built for "${C.name}" into ${outRoot}`);
