// The pieces every page shares: icons, <head>, the header, the footer, the car card.
import { esc, money, km, monthly } from './core.mjs';

const I = (d, vb = '0 0 24 24') => `<svg class="i" viewBox="${vb}" aria-hidden="true" focusable="false">${d}</svg>`;
export const icon = {
  wa: I('<path fill="currentColor" stroke="none" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 1.8a8.200 8.200 0 1 1-4.300 15.200l-.3-.2-2.900.8.800-2.900-.2-.3A8.200 8.200 0 0 1 12 3.800Zm-3.500 3.900c-.2 0-.5 0-.7.300-.3.300-1 1-1 2.300s1 2.700 1.200 2.900c.1.200 2 3.100 4.900 4.200 2.400.9 2.900.8 3.400.7.500-.1 1.700-.7 1.900-1.300.2-.700.2-1.200.2-1.300-.1-.2-.3-.200-.6-.400l-1.900-.9c-.3-.1-.5-.1-.7.200l-.9 1.100c-.2.200-.3.200-.6.100-.3-.200-1.200-.5-2.300-1.400-.9-.800-1.400-1.700-1.600-2-.2-.300 0-.500.1-.600l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.100c-.2-.5-.4-.5-.6-.5h-.5Z"/>'),
  phone: I('<path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>'),
  pin: I('<path d="M12 21s-7-6.200-7-11.500a7 7 0 0 1 14 0C19 14.800 12 21 12 21Z"/><circle cx="12" cy="9.500" r="2.500"/>'),
  clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  search: I('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.500-3.500"/>'),
  heart: I('<path d="M12 20s-7-4.400-7-9.800A4.200 4.200 0 0 1 12 7.600a4.200 4.200 0 0 1 7 2.600C19 15.600 12 20 12 20Z"/>'),
  scale: I('<path d="M12 4v16M7 20h10M5 7h14M5 7l-3 7a3 3 0 0 0 6 0L5 7Zm14 0-3 7a3 3 0 0 0 6 0l-3-7Z"/>'),
  share: I('<path d="M12 15V4m0 0L8 8m4-4 4 4M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>'),
  arrow: I('<path d="M5 12h14m-5-5 5 5-5 5"/>'),
  left: I('<path d="m14 6-6 6 6 6"/>'),
  right: I('<path d="m10 6 6 6-6 6"/>'),
  check: I('<path d="m5 12.500 4.500 4.500L19 7.500"/>'),
  menu: I('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  close: I('<path d="m6 6 12 12M18 6 6 18"/>'),
  gauge: I('<path d="M4 16a8 8 0 1 1 16 0"/><path d="m12 16 4-5"/>'),
  gear: I('<path d="M6 5v14M12 5v14M18 5v7M6 12h12"/>'),
  fuel: I('<path d="M5 20V6a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v14M4 20h11M7 8h5v3H7zM14 11h2a2 2 0 0 1 2 2v3a1.500 1.500 0 0 0 3 0V9l-3-3"/>'),
  cal: I('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4m8-4v4"/>'),
  filter: I('<path d="M4 6h16M7 12h10M10 18h4"/>'),
  grid: I('<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>'),
  list: I('<path d="M4 6h16M4 12h16M4 18h16"/>'),
  zoom: I('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  star: I('<path fill="currentColor" stroke="none" d="m12 3 2.700 5.700 6.300.800-4.600 4.300 1.200 6.200L12 17l-5.600 3 1.200-6.200L3 9.500l6.300-.8L12 3Z"/>'),
  mail: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>'),
  doc: I('<path d="M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5"/>'),
};

/* Side views for the body-type tiles: one path each, drawn on a 64 x 28 box. */
export const BODY_SHAPES = {
  Hatchback: 'M3 20v-4l6-2 6-7h17l9 7 9 2 3 3v3h-6a5 5 0 0 0-10 0H22a5 5 0 0 0-10 0H3Z',
  Sedan: 'M2 20v-4l8-2 7-6h16l9 6 12 2 4 3v3h-7a5 5 0 0 0-10 0H22a5 5 0 0 0-10 0H2Z',
  SUV: 'M3 21V10l4-5h28l8 7 13 2 3 3v4h-6a5 5 0 0 0-10 0H22a5 5 0 0 0-10 0H3Z',
  Pickup: 'M2 21v-7h24V6h12l8 7 12 2 3 2v4h-6a5 5 0 0 0-10 0H22a5 5 0 0 0-10 0H2Z',
  MPV: 'M3 21V11l7-6h22l11 8 13 2 3 3v3h-6a5 5 0 0 0-10 0H22a5 5 0 0 0-10 0H3Z',
  Van: 'M3 21V5h34l11 9 10 2 2 2v3h-5a5 5 0 0 0-10 0H22a5 5 0 0 0-10 0H3Z',
};
export const bodyShape = (b) => `<svg class="shape" viewBox="0 0 64 28" aria-hidden="true"><path d="${BODY_SHAPES[b] || BODY_SHAPES.Hatchback}"/><circle cx="17" cy="22" r="3.500"/><circle cx="46" cy="22" r="3.500"/></svg>`;

export const waLink = (C, text) => `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(text)}`;

/** The logo: the client's own file if they gave one, otherwise their name set as a number plate. */
export function logo(ctx, cls = '') {
  const { C } = ctx;
  const inner = C.logoFile
    ? `<img src="${ctx.asset('img/' + C.logoFile)}" alt="${esc(C.name)}" class="logo-img" height="40">`
    : `<span class="logo-plate" data-brand-a>${esc(C.logoText[0])}</span>${C.logoText[1] ? `<span class="logo-rest" data-brand-b>${esc(C.logoText[1])}</span>` : ''}`;
  return `<a class="logo ${cls}" href="${ctx.rel('index.html')}" aria-label="${esc(C.name)}, ${esc(ctx.t('nav.home'))}">${inner}</a>`;
}

export function navItems(ctx) {
  const { T, t } = ctx;
  return [
    ['cars', 'cars.html', t('nav.cars')],
    T.finance && ['finance', 'finance.html', t('nav.finance')],
    T.sell && ['sell', 'sell.html', t('nav.sell')],
    T.about && ['about', 'about.html', t('nav.about')],
    ['contact', 'contact.html', t('nav.contact')],
  ].filter(Boolean);
}

export function head(ctx, { title, description, image, jsonld = [], noindex = false, preloadImage = null }) {
  const { C, T, lang, t } = ctx;
  const full = title ? `${title} | ${C.name}` : `${C.name}: ${t('meta.homeTitle', { place: C.locality })}`;
  const canonical = C.siteUrl ? `${C.siteUrl}/${lang === 'en' ? '' : lang + '/'}${ctx.path === 'index.html' ? '' : ctx.path}` : '';
  const og = image ? (C.siteUrl ? `${C.siteUrl}/${image}` : ctx.asset(image)) : '';
  const alts = T.langs.length > 1 && C.siteUrl
    ? T.langs.map((l) => `<link rel="alternate" hreflang="${l}" href="${C.siteUrl}/${l === 'en' ? '' : l + '/'}${ctx.path === 'index.html' ? '' : ctx.path}">`).join('')
    : '';
  return `<!doctype html>
<html lang="${lang}" data-tier="${T.key}"${C.demo.enabled ? ' data-demo' : ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description)}">
${noindex || C.demo.enabled ? '<meta name="robots" content="noindex">' : ''}
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}${alts}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(C.name)}">
<meta property="og:title" content="${esc(title || C.name)}">
<meta property="og:description" content="${esc(description)}">
${og ? `<meta property="og:image" content="${esc(og)}"><meta name="twitter:card" content="summary_large_image">` : ''}
<meta name="theme-color" content="${T.key === 'low' ? '#ffffff' : C.colours.ink}">
<meta name="format-detection" content="telephone=no">
<link rel="icon" href="${ctx.asset('favicon.svg')}" type="image/svg+xml">
${T.key === 'mid' ? `<link rel="manifest" href="${ctx.asset('site.webmanifest')}">` : ''}
<link rel="preload" href="${ctx.asset(ctx.files.font)}" as="font" type="font/woff2" crossorigin>
${preloadImage ? `<link rel="preload" as="image" href="${esc(preloadImage.src)}" imagesrcset="${esc(preloadImage.srcset)}" imagesizes="${esc(preloadImage.sizes)}" fetchpriority="high">` : ''}
<style>@font-face{font-family:Archivo;src:url(${ctx.asset(ctx.files.font)}) format("woff2");font-weight:100 900;font-stretch:62% 125%;font-display:swap}:root{--accent:${C.colours.accent};--on-accent:${C.colours.on};--accent-text:${C.colours.text};--ink:${C.colours.ink}}</style>
${ctx.headScript || ''}
<link rel="stylesheet" href="${ctx.asset(ctx.files.css)}">
<script type="module" src="${ctx.asset(ctx.files.js)}"></script>
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('\n')}
</head>`;
}

/** Schema.org description of the dealership, for Google. */
export function dealerLd(ctx) {
  const { C } = ctx;
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return {
    '@context': 'https://schema.org', '@type': 'AutoDealer', name: C.name, legalName: C.legalName,
    ...(C.siteUrl ? { url: C.siteUrl, '@id': C.siteUrl + '/#dealer' } : {}),
    telephone: '+' + C.dialCode + C.phones[0].replace(/\D/g, ''), email: C.email || undefined,
    address: { '@type': 'PostalAddress', streetAddress: C.street, addressLocality: C.locality, addressCountry: C.country },
    ...(C.geo ? { geo: { '@type': 'GeoCoordinates', latitude: C.geo.lat, longitude: C.geo.lon } } : {}),
    openingHoursSpecification: C.hoursByDay.map((h, i) => h && { '@type': 'OpeningHoursSpecification', dayOfWeek: days[i], opens: h[0], closes: h[1] }).filter(Boolean),
    ...(Object.values(C.social).filter(Boolean).length ? { sameAs: Object.values(C.social).filter(Boolean) } : {}),
  };
}

function demoBar(ctx) {
  const { C, T, t } = ctx;
  if (!C.demo.enabled) return '';
  const tiers = Object.entries(C.demo.tiers || {});
  const here = C.demo.tiers?.[T.key];
  // the three demos sit side by side (low/, mid/, high/), so the switch is a relative link
  const up = ctx.asset('../');
  return `<aside class="demo" aria-label="${esc(t('demo.label'))}">
  <p class="demo-what"><b>${esc(t('demo.badge'))}</b><span>${esc(t('demo.what', { studio: C.demo.studio || '' }))}</span></p>
  <nav class="demo-tiers" aria-label="${esc(t('demo.switch'))}">${tiers.map(([k, v]) => `<a href="${up}${v.dir || k}/"${k === T.key ? ' aria-current="true"' : ''}><b>${esc(v.label)}</b><span>${esc(v.price)}</span></a>`).join('')}</nav>
</aside>`;
}

export function header(ctx, current) {
  const { C, T, t, lang } = ctx;
  const items = navItems(ctx);
  const links = items.map(([k, href, label]) => `<a href="${ctx.rel(href)}"${k === current ? ' aria-current="page"' : ''}>${esc(label)}</a>`).join('');
  const langSwitch = T.langs.length > 1
    ? `<a class="lang" href="${ctx.other(lang === 'en' ? 'fr' : 'en')}" hreflang="${lang === 'en' ? 'fr' : 'en'}" lang="${lang === 'en' ? 'fr' : 'en'}" aria-label="${lang === 'en' ? 'Voir le site en français' : 'View the site in English'}">${lang === 'en' ? 'FR' : 'EN'}</a>`
    : '';
  const compare = T.compare ? `<a class="hd-icon" href="${ctx.rel('compare.html')}" aria-label="${esc(t('nav.compare'))}" data-compare-link>${icon.scale}<b data-compare-count hidden>0</b></a>` : '';
  const p = C.phoneList[0];
  return `<a class="skip" href="#main">${esc(t('nav.skip'))}</a>
${demoBar(ctx)}
<header class="hd" data-hd>
  <div class="hd-in">
    ${logo(ctx)}
    <nav class="hd-nav" aria-label="${esc(t('nav.main'))}" data-nav>${links}</nav>
    <div class="hd-side">
      ${compare}${langSwitch}
      ${T.key === 'low' ? `<a class="hd-call hd-wa" href="${waLink(C, t('wa.hello', { name: C.name }))}" data-wa aria-label="${esc(t('cta.whatsappUs'))}">${icon.wa}<span>${esc(t('cta.whatsapp'))}</span></a>` : `<a class="hd-call" href="${p.href}" data-tel>${icon.phone}<span>${esc(p.label)}</span></a>`}
      ${items.length > 2 ? `<button class="hd-menu" type="button" aria-expanded="false" aria-controls="menu" data-menu-btn>${icon.menu}<span class="sr">${esc(t('nav.menu'))}</span></button>` : ''}
    </div>
  </div>
  ${items.length > 2 ? `<div class="menu" id="menu" data-menu hidden><nav aria-label="${esc(t('nav.main'))}">${links}${T.compare ? `<a href="${ctx.rel('compare.html')}">${esc(t('nav.compare'))}</a>` : ''}</nav><a class="btn btn-wa" href="${waLink(C, t('wa.hello', { name: C.name }))}" data-wa>${icon.wa}${esc(t('cta.whatsapp'))}</a></div>` : ''}
</header>`;
}

export function hoursRows(ctx) {
  const { C, t } = ctx;
  // Monday first
  return [1, 2, 3, 4, 5, 6, 0].map((d) => {
    const h = C.hoursByDay[d];
    return `<tr data-day="${d}"><th scope="row">${esc(t('day.' + d))}</th><td>${h ? `${h[0]} – ${h[1]}` : esc(t('hours.closed'))}</td></tr>`;
  }).join('');
}

export function footer(ctx, waText) {
  const { C, T, t } = ctx;
  const items = navItems(ctx);
  const social = Object.entries(C.social).filter(([, v]) => v).map(([k, v]) => `<a href="${esc(v)}" rel="noopener" target="_blank">${k[0].toUpperCase() + k.slice(1)}</a>`).join('');
  const legal = T.legal ? `<a href="${ctx.rel('privacy.html')}">${esc(t('nav.privacy'))}</a><a href="${ctx.rel('terms.html')}">${esc(t('nav.terms'))}</a>` : '';
  const bar = T.key === 'low'
    ? ''
    : `<div class="dock" data-dock><a class="btn btn-wa" href="${waLink(C, waText || t('wa.hello', { name: C.name }))}" data-wa>${icon.wa}${esc(t('cta.whatsapp'))}</a><a class="btn btn-line" href="${C.phoneList[0].href}" data-tel>${icon.phone}${esc(t('cta.call'))}</a></div>`;
  return `<footer class="ft">
  <div class="ft-in">
    <div class="ft-brand">
      ${logo(ctx, 'logo-ft')}
      <p>${esc(C.street)}<br>${esc(C.locality)}, ${esc(C.country)}</p>
    </div>
    <nav class="ft-nav" aria-label="${esc(t('nav.footer'))}"><a href="${ctx.rel('index.html')}">${esc(t('nav.home'))}</a>${items.map(([, href, label]) => `<a href="${ctx.rel(href)}">${esc(label)}</a>`).join('')}</nav>
    <div class="ft-contact">
      ${C.phoneList.map((p) => `<a href="${p.href}" data-tel>${esc(p.label)}</a>`).join('')}
      ${C.email ? `<a href="mailto:${esc(C.email)}" data-mail>${esc(C.email)}</a>` : ''}
      ${social ? `<p class="ft-social">${social}</p>` : ''}
    </div>
  </div>
  <div class="ft-base">
    <p>© ${new Date().getFullYear()} ${esc(C.legalName)}${C.finance.enabled && T.finance ? '. ' + esc(t('ft.finance')) : ''}</p>
    <p class="ft-links">${legal}${C.demo.enabled ? `<span>${esc(t('ft.sample'))}</span>` : ''}</p>
  </div>
  ${C.demo.studio ? `<p class="ft-by"><a href="${esc(C.demo.studioUrl || '#')}" rel="noopener">${esc(t('ft.by', { studio: C.demo.studio }))}<span>${esc((C.demo.studioUrl || '').split('//').pop().split('/').filter(Boolean).join('/'))}</span></a></p>` : ''}
</footer>
${bar}
${C.demo.enabled ? `<dialog class="sheet" data-demo-sheet aria-labelledby="demo-t"><h2 id="demo-t">${esc(t('demo.sheetTitle'))}</h2><p data-demo-why></p><pre data-demo-msg></pre><div class="sheet-actions"><button class="btn btn-ink" type="button" data-demo-close>${esc(t('demo.ok'))}</button>${C.demo.studioWhatsapp ? `<a class="btn btn-wa" href="https://wa.me/${esc(C.demo.studioWhatsapp)}" rel="noopener">${icon.wa}${esc(t('demo.talk', { studio: C.demo.studio }))}</a>` : ''}</div></dialog>` : ''}
<script type="application/json" id="site">${JSON.stringify(ctx.clientData()).replace(/</g, '\\u003c')}</script>`;
}

/** An <img> for photo `i` of a car, sized for a card (cropped 4:3) or for the gallery (whole photo). */
export function carImg(ctx, car, i, { kind = 'card', sizes, eager = false, cls = '' } = {}) {
  const im = ctx.images.car(car.id, i);
  if (!im) return `<span class="noimg ${cls}" role="img" aria-label="${esc(ctx.t('card.noPhoto'))}"></span>`;
  const set = im[kind], widths = Object.keys(set).map(Number).sort((a, b) => a - b);
  const [w, h] = kind === 'card' ? [800, 600] : [im.w, im.h];
  return `<img class="${cls}" src="${ctx.asset(set[widths[0]])}" srcset="${widths.map((x) => `${ctx.asset(set[x])} ${x}w`).join(', ')}" sizes="${sizes || '(min-width: 1100px) 360px, (min-width: 640px) 46vw, 92vw'}" width="${w}" height="${h}" alt="${esc(im.alt || `${car.year} ${car.name}`)}" style="background:${im.colour}" ${eager ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"'}>`;
}

export const facts = (ctx, car) => [
  car.mileage != null && km(car.mileage, ctx.lang),
  car.gearbox && ctx.t('val.' + car.gearbox),
  car.fuel && ctx.t('val.' + car.fuel),
].filter(Boolean);

export function carMessage(ctx, car) {
  const { C, t } = ctx;
  return t('wa.car', { car: `${car.year} ${car.name}`, price: money(C, car.price) });
}

export function card(ctx, car, { eager = false, sizes } = {}) {
  const { C, T, t } = ctx;
  const href = T.carPages ? ctx.rel(`car/${car.id}.html`) : null;
  const sold = car.status === 'sold', reserved = car.status === 'reserved';
  const tag = sold ? `<span class="tag tag-sold">${esc(t('tag.sold'))}</span>` : reserved ? `<span class="tag tag-hold">${esc(t('tag.reserved'))}</span>` : car.isNew ? `<span class="tag tag-new">${esc(t('tag.new'))}</span>` : '';
  const photo = `${carImg(ctx, car, 0, { eager, sizes })}${tag}`;
  const per = T.monthlyOnCards && C.finance.enabled && !sold
    ? `<span class="card-per">${esc(t('card.from', { amount: money(C, monthly(car.price, C.finance.depositPct, C.finance.months, C.finance.rate)) }))}</span>` : '';
  const data = `data-id="${esc(car.id)}" data-make="${esc(car.make)}" data-body="${esc(car.body)}" data-price="${car.price}" data-year="${car.year}" data-km="${car.mileage ?? ''}" data-fuel="${esc(car.fuel)}" data-gear="${esc(car.gearbox)}" data-added="${esc(car.added || '')}" data-name="${esc((car.year + ' ' + car.name + ' ' + (car.variant || '') + ' ' + car.colour + ' ' + car.body).toLowerCase())}"`;
  const actions = !T.carPages
    ? `<div class="card-actions"><a class="btn btn-wa" href="${waLink(C, carMessage(ctx, car))}" data-wa>${icon.wa}${esc(t('cta.whatsapp'))}</a><a class="btn btn-line" href="${C.phoneList[0].href}" data-tel aria-label="${esc(t('cta.callAbout', { car: car.name }))}">${icon.phone}${esc(t('cta.call'))}</a></div>`
    : '';
  const tools = T.saved || T.compare
    ? `<div class="card-tools">${T.saved ? `<button type="button" class="tool" data-save="${esc(car.id)}" aria-pressed="false" aria-label="${esc(t('card.save', { car: car.name }))}">${icon.heart}</button>` : ''}${T.compare ? `<button type="button" class="tool" data-compare="${esc(car.id)}" aria-pressed="false" aria-label="${esc(t('card.compare', { car: car.name }))}">${icon.scale}</button>` : ''}</div>`
    : '';
  return `<article class="card${sold ? ' is-sold' : ''}" ${data}>
  ${href ? `<a class="card-photo" href="${href}" tabindex="-1" aria-hidden="true">${photo}</a>` : `<div class="card-photo">${photo}</div>`}${tools}
  <div class="card-body">
    <h3 class="card-name">${href ? `<a href="${href}">${esc(car.name)}</a>` : esc(car.name)}</h3>
    <p class="card-facts"><span class="plate">${car.year}</span>${facts(ctx, car).map((f, i) => `<span class="f${i ? ' f-x' : ''}">${esc(f)}</span>`).join('')}</p>
    <p class="card-price"><b>${esc(money(C, car.price))}</b>${per}</p>
    ${actions}
  </div>
</article>`;
}

export const page = (ctx, current, headOpts, body) => `${head(ctx, headOpts)}
<body class="p-${current}">
${header(ctx, current)}
<main id="main">
${body}
</main>
${footer(ctx, headOpts.waText)}
</body>
</html>`;
