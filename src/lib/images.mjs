// Turns the client's photos into small WebP files in the sizes the pages ask for. Results are kept in .cache,
// so only new or changed photos are processed on the next build.
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, statSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { esc, money } from './core.mjs';

const hex = ({ r, g, b }) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

export async function buildImages({ clientDir, outDir, cacheDir, cars, T, C, featuredId }) {
  mkdirSync(cacheDir, { recursive: true });
  const metaFile = join(cacheDir, 'meta.json');
  const meta = existsSync(metaFile) ? JSON.parse(readFileSync(metaFile, 'utf8')) : {};
  const jobs = [];
  let made = 0;

  /** One output file: made once into the cache, then copied into the site. */
  const emit = (src, key, variant, ext, make) => {
    const cached = join(cacheDir, `${key}-${variant}.${ext}`);
    return (rel) => {
      jobs.push(async () => {
        if (!existsSync(cached)) { await make(sharp(src, { failOn: 'none' }).rotate()).toFile(cached); made++; }
        const to = join(outDir, rel);
        mkdirSync(dirname(to), { recursive: true });
        copyFileSync(cached, to);
      });
      return rel;
    };
  };
  const keyOf = (src) => { const s = statSync(src); return createHash('sha1').update(`${src}|${s.size}|${s.mtimeMs}`).digest('hex').slice(0, 16); };
  const info = async (src, key) => {
    if (!meta[key]) {
      const img = sharp(src, { failOn: 'none' }).rotate();
      const m = await img.metadata(), st = await img.clone().resize(64).stats();
      const swap = (m.orientation || 1) >= 5;
      meta[key] = { w: swap ? m.height : m.width, h: swap ? m.width : m.height, colour: hex(st.dominant) };
    }
    return meta[key];
  };
  const webp = (w, h) => (s) => (h ? s.resize(w, h, { fit: 'cover', position: sharp.strategy.attention }) : s.resize({ width: w, withoutEnlargement: true })).webp({ quality: 74, effort: 5 });

  const fullWidths = T.lightbox ? [800, 1400, 2000] : [800, 1400];
  const carMap = new Map(), shareMap = new Map();
  for (const car of cars) {
    const list = [];
    for (let i = 0; i < Math.min(car.photos.length, T.maxPhotos); i++) {
      const src = join(clientDir, 'photos', car.photos[i]);
      if (!existsSync(src)) { console.warn(`  ! photo not found, skipped: photos/${car.photos[i]}`); continue; }
      const key = keyOf(src), m = await info(src, key), dir = `img/cars/${car.id}`;
      const entry = { w: m.w, h: m.h, colour: m.colour, alt: car.alts?.[i] || '', card: {}, full: {} };
      entry.card[480] = emit(src, key, 'c480', 'webp', webp(480, 360))(`${dir}/${i + 1}-c480.webp`);
      entry.card[800] = emit(src, key, 'c800', 'webp', webp(800, 600))(`${dir}/${i + 1}-c800.webp`);
      if (T.carPages || (i === 0 && car.id === featuredId)) {
        for (const w of fullWidths) if (w <= m.w || w === fullWidths[0]) entry.full[w] = emit(src, key, `f${w}`, 'webp', webp(w))(`${dir}/${i + 1}-f${w}.webp`);
      }
      if (i === 0 && (T.carPages || car.id === featuredId)) {
        entry.og = emit(src, key, 'og', 'jpg', (s) => s.resize(1200, 630, { fit: 'cover', position: sharp.strategy.attention }).jpeg({ quality: 78, mozjpeg: true }))(`${dir}/og.jpg`);
        if (T.ogPerCar) {
          // the picture WhatsApp and Facebook show when the car's link is shared: the photo with its price on it
          const price = money(C, car.price), name = `${car.year} ${car.name}`;
          const pw = Math.max(330, price.length * 37 + 56);
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.82"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/><rect x="48" y="440" width="${pw}" height="84" rx="10" fill="${C.colours.accent}"/><text x="76" y="500" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="56" fill="${C.colours.on}">${esc(price)}</text><text x="48" y="582" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="40" fill="#fff">${esc(name)}</text><text x="1152" y="582" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="30" fill="#fff" opacity="0.9">${esc(C.name)}</text></svg>`;
          const skey = createHash('sha1').update(key + svg).digest('hex').slice(0, 16);
          shareMap.set(car.id, emit(src, skey, 'share', 'jpg', (s) => s.resize(1200, 630, { fit: 'cover', position: sharp.strategy.attention }).composite([{ input: Buffer.from(svg) }]).jpeg({ quality: 80, mozjpeg: true }))(`${dir}/share.jpg`));
        }
      }
      list.push(entry);
    }
    carMap.set(car.id, list);
  }

  const placeMap = new Map(), manifestFile = join(clientDir, 'photos', 'manifest.json');
  const placeAlts = {};
  if (existsSync(manifestFile)) try {
    for (const p of JSON.parse(readFileSync(manifestFile, 'utf8')).find((e) => e.folder === '_place')?.photos || []) placeAlts[p.file.replace(/\.\w+$/, '')] = p.alt;
  } catch { /* the manifest is optional */ }
  for (const name of ['forecourt', 'inspection', 'keys']) {
    const src = join(clientDir, 'photos', '_place', `${name}.jpg`);
    if (!existsSync(src)) continue;
    const key = keyOf(src), m = await info(src, key), entry = { w: m.w, h: m.h, colour: m.colour, alt: placeAlts[name] || '', full: {} };
    for (const w of [800, 1600]) entry.full[w] = emit(src, key, `f${w}`, 'webp', webp(w))(`img/place/${name}-${w}.webp`);
    placeMap.set(name, entry);
  }

  // run the work a few files at a time
  let next = 0;
  await Promise.all(Array.from({ length: 6 }, async () => { while (next < jobs.length) await jobs[next++](); }));
  writeFileSync(metaFile, JSON.stringify(meta));
  return { car: (id, i) => carMap.get(id)?.[i] || null, place: (k) => placeMap.get(k) || null, share: (id) => shareMap.get(id) || null, made, files: jobs.length };
}
