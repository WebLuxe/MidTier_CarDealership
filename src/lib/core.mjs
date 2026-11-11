// Shared helpers for the build: the client's details, what each tier includes, money and text helpers.
import { readFileSync } from 'node:fs';
import { STR } from '../i18n.mjs';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* What each tier includes. This is the price list turned into switches: the same client folder builds all three. */
export const TIERS = {
  low: {
    key: 'low', langs: ['en'], maxPhotos: 4, maxCars: 60,
    pages: ['index', 'cars', 'contact'],
    carPages: true, filters: 'basic', finance: false, sell: false, about: false, legal: false,
    compare: false, saved: false, lightbox: false, share: false, liveHours: true, mapEmbed: false,
    reviews: false, monthlyOnCards: false, reveals: true, loader: true, transitions: true, ogPerCar: false,
  },
  mid: {
    key: 'mid', langs: ['en'], maxPhotos: 10, maxCars: 2000,
    pages: ['index', 'cars', 'finance', 'sell', 'about', 'contact', '404'],
    carPages: true, filters: 'full', finance: true, sell: true, about: true, legal: false,
    compare: false, saved: false, lightbox: true, share: true, liveHours: true, mapEmbed: true,
    reviews: true, monthlyOnCards: true, reveals: true, loader: true, transitions: true, ogPerCar: true,
  },
};

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** Relative luminance and contrast, to choose the text colour that sits on the client's accent colour. */
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const mix = (hex, to, k) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - k) + parseInt(to.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');
const hex6 = (h) => { const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(h).trim()); if (!m) return null; const v = m[1]; return '#' + (v.length === 3 ? [...v].map((c) => c + c).join('') : v).toLowerCase(); };

/** The colours derived from the accent: text on it, and a version dark enough to be read as text on white. */
export function accentSet(accentIn, inkIn = '#151a21') {
  const accent = hex6(accentIn) || '#ffb703', ink = hex6(inkIn) || '#151a21';
  const on = contrast(accent, ink) >= contrast(accent, '#ffffff') ? ink : '#ffffff';
  let text = accent;
  for (let k = 0; contrast(text, '#ffffff') < 4.6 && k <= 1; k += 0.05) text = mix(accent, ink, k);
  return { accent, ink, on, text };
}

export function loadClient(dir) {
  const C = JSON.parse(readFileSync(`${dir}/client.json`, 'utf8'));
  const need = ['name', 'street', 'locality', 'country', 'phones', 'whatsapp', 'hours'];
  for (const k of need) if (C[k] == null || C[k] === '') throw new Error(`client.json: "${k}" is missing`);
  C.legalName ||= C.name;
  C.logoText ||= [C.name.split(' ')[0], C.name.split(' ').slice(1).join(' ')];
  C.address = `${C.street}, ${C.locality}, ${C.country}`;
  C.mapsQuery ||= `${C.name} ${C.address}`;
  C.dialCode = String(C.dialCode || '').replace(/\D/g, '');
  C.phoneList = C.phones.map((p) => ({ label: p, href: 'tel:+' + C.dialCode + String(p).replace(/\D/g, '') }));
  C.whatsapp = String(C.whatsapp).replace(/\D/g, '');
  C.hoursByDay = DAYS.map((d) => C.hours[d] || null); // index 0 = Sunday
  C.colours = accentSet(C.brand?.accent, C.brand?.ink);
  C.coloursFor = (tier) => accentSet(C.brand?.tiers?.[tier]?.accent || C.brand?.accent, C.brand?.tiers?.[tier]?.ink || C.brand?.ink);
  C.currency ||= 'Rs';
  C.finance = { enabled: true, partner: '', rate: 7.5, depositPct: 20, months: 60, ...(C.finance || {}) };
  C.siteUrl = (C.siteUrl || '').replace(/\/+$/, '');
  C.demo = { enabled: false, tiers: {}, ...(C.demo || {}) };
  C.social ||= {};
  return C;
}

export function loadStock(dir, C) {
  const S = JSON.parse(readFileSync(`${dir}/stock.json`, 'utf8'));
  const seen = new Set();
  const cars = S.cars.filter((c) => c.status !== 'hidden').map((c) => {
    for (const k of ['make', 'model', 'year', 'price']) if (c[k] == null) throw new Error(`stock.json: a car is missing "${k}": ${JSON.stringify(c).slice(0, 80)}`);
    const id = c.id || slug(`${c.year}-${c.make}-${c.model}`);
    if (seen.has(id)) throw new Error(`stock.json: two cars share the id "${id}". Give one of them its own "id".`);
    seen.add(id);
    return { status: 'available', photos: [], fuel: '', gearbox: '', body: '', colour: '', ...c, id, name: `${c.make} ${c.model}` };
  });
  // newest first: by the date added, then by year
  cars.sort((a, b) => String(b.added || '').localeCompare(String(a.added || '')) || b.year - a.year);
  const updated = S.updated || new Date().toISOString().slice(0, 10);
  const fresh = Date.parse(updated) - 21 * 864e5;
  // 'Just arrived' only means something when few cars carry it: the two newest, if they came in the last three weeks
  let tagged = 0;
  for (const c of cars) c.isNew = c.status === 'available' && c.added && Date.parse(c.added) >= fresh && tagged++ < 2;
  return { cars, updated };
}

export const money = (C, n) => `${C.currency} ${Math.round(n).toLocaleString('en-US')}`;
export const km = (n, lang = 'en') => `${Math.round(n).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US').replace(/ | /g, ' ')} km`;

export function monthly(price, depositPct, months, rate) {
  const principal = price * (1 - depositPct / 100), r = rate / 100 / 12;
  return r === 0 ? principal / months : (principal * r) / (1 - Math.pow(1 + r, -months));
}

/** t('key', {n: 3}) for one language. A missing key stops the build, so no page ships with a hole in it. */
export function translator(lang) {
  return (key, vars = {}) => {
    const s = STR[lang]?.[key] ?? (lang !== 'en' ? undefined : undefined);
    if (s == null) throw new Error(`i18n: no "${key}" in ${lang}`);
    return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
  };
}

export { DAYS };
