// Every page of the site, as functions that return HTML. What a tier includes is decided in lib/core.mjs (TIERS).
import { esc, money, km, monthly } from './lib/core.mjs';
import { icon, page, card, carImg, facts, carMessage, waLink, hoursRows, dealerLd, bodyShape } from './lib/parts.mjs';

const BODY_ORDER = ['Hatchback', 'Sedan', 'SUV', 'MPV', 'Pickup', 'Van'];
const available = (cars) => cars.filter((c) => c.status !== 'sold');
const count = (ctx) => available(ctx.cars).length;
const featured = (ctx) => ctx.cars.find((c) => c.featured && c.status === 'available' && c.photos.length) || ctx.cars.find((c) => c.photos.length) || ctx.cars[0];
const bodies = (ctx) => BODY_ORDER.map((b) => [b, available(ctx.cars).filter((c) => c.body === b).length]).filter(([, n]) => n);
const budgets = (ctx) => {
  const prices = available(ctx.cars).map((c) => c.price), lo = Math.min(...prices), hi = Math.max(...prices);
  return [300000, 400000, 500000, 600000, 750000, 1000000, 1250000, 1500000, 2000000, 3000000].filter((v) => v > lo && v < hi);
};
const perMonth = (ctx, car) => monthly(car.price, ctx.C.finance.depositPct, ctx.C.finance.months, ctx.C.finance.rate);

function placeImg(ctx, key, { sizes = '100vw', eager = false, cls = '' } = {}) {
  const im = ctx.images.place(key);
  if (!im) return '';
  const widths = Object.keys(im.full).map(Number).sort((a, b) => a - b);
  return `<img class="${cls}" src="${ctx.asset(im.full[widths[0]])}" srcset="${widths.map((x) => `${ctx.asset(im.full[x])} ${x}w`).join(', ')}" sizes="${sizes}" width="${im.w}" height="${im.h}" alt="${esc(im.alt || '')}" style="background:${im.colour}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

/* ---------- shared sections ---------- */

const openStatus = (ctx) => (ctx.T.liveHours ? `<p class="open" data-open hidden></p>` : '');

function visit(ctx, { h = 'h2', form = false } = {}) {
  const { C, T, t } = ctx;
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(C.mapsQuery)}`;
  const map = T.mapEmbed
    ? `<div class="map" data-map="${esc('https://www.google.com/maps?q=' + encodeURIComponent(C.mapsQuery) + '&z=15&output=embed')}"><button type="button" class="map-load" data-map-load>${icon.pin}<span>${esc(t('visit.showMap'))}</span></button></div>`
    : '';
  return `<section class="visit" aria-labelledby="visit-t">
  <div class="wrap visit-in">
    <div class="visit-copy">
      <${h} id="visit-t" class="h2">${esc(t('visit.title', { place: C.locality }))}</${h}>
      ${openStatus(ctx)}
      <address class="visit-addr">${icon.pin}<span>${esc(C.street)}<br>${esc(C.locality)}, ${esc(C.country)}</span></address>
      <p class="visit-actions"><a class="btn btn-ink" href="${maps}" target="_blank" rel="noopener">${esc(t('visit.directions'))}</a>${C.phoneList.map((p) => `<a class="btn btn-line" href="${p.href}" data-tel>${icon.phone}${esc(p.label)}</a>`).join('')}</p>
    </div>
    <table class="hours"><caption>${esc(t('hours.title'))}</caption><tbody>${hoursRows(ctx)}</tbody></table>
    ${map}
    ${form ? enquiry(ctx) : ''}
  </div>
</section>`;
}

/** The message form. It writes the WhatsApp message for the visitor; nothing is stored anywhere. */
function enquiry(ctx, { car = null, kind = 'contact' } = {}) {
  const { C, T, t } = ctx;
  const cars = available(ctx.cars);
  const pick = kind === 'contact' && cars.length
    ? `<label class="fld"><span>${esc(t('form.about'))}</span><select name="car"><option value="">${esc(t('form.general'))}</option>${cars.map((c) => `<option>${esc(c.year + ' ' + c.name)}</option>`).join('')}</select></label>` : '';
  const when = kind === 'viewing'
    ? `<label class="fld"><span>${esc(t('form.when'))}</span><select name="when" data-days required><option value="">${esc(t('form.pickDay'))}</option></select></label>` : '';
  return `<form class="form" data-form="${kind}" novalidate${car ? ` data-car="${esc(car.year + ' ' + car.name)}" data-price="${esc(money(C, car.price))}"` : ''}>
  <h2 class="h3">${esc(t(kind === 'viewing' ? 'form.viewingTitle' : 'form.title'))}</h2>
  <p class="form-note">${esc(t('form.note'))}</p>
  <label class="fld"><span>${esc(t('form.name'))}</span><input name="name" autocomplete="name" required></label>
  <label class="fld"><span>${esc(t('form.phone'))}</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" required pattern="[0-9+ ]{7,}"></label>
  ${pick}${when}
  <label class="fld fld-wide"><span>${esc(t('form.message'))}</span><textarea name="message" rows="3"${kind === 'contact' ? ' required' : ''}></textarea></label>
  <p class="form-err" data-err role="alert" hidden></p>
  <div class="form-actions"><button class="btn btn-wa" type="submit">${icon.wa}${esc(t('form.send'))}</button>${C.email && T.key !== 'low' && kind === 'contact' ? `<button class="btn btn-line" type="submit" data-via="mail">${icon.mail}${esc(t('form.sendMail'))}</button>` : ''}</div>
</form>`;
}

const promises = (ctx, h = 'h2') => `<section class="why" aria-labelledby="why-t">
  <div class="wrap">
    <${h} id="why-t" class="h2">${esc(ctx.t('why.title'))}</${h}>
    <ul class="why-list">${ctx.txt.promises.map((p) => `<li>${icon.check}<div><h3>${esc(p.title)}</h3><p>${esc(p.body)}</p></div></li>`).join('')}</ul>
  </div>
</section>`;

function reviews(ctx) {
  const { C, t } = ctx, g = C.googleRating;
  if (!ctx.txt.reviews?.length) return '';
  const stars = `<span class="stars" aria-hidden="true">${icon.star.repeat(5)}</span>`;
  return `<section class="reviews" aria-labelledby="rev-t">
  <div class="wrap">
    <div class="reviews-head">
      <h2 id="rev-t" class="h2">${esc(t('reviews.title'))}</h2>
      ${g ? `<p class="rating">${stars}<b>${g.score.toFixed(1)}</b><span>${esc(t('reviews.google', { n: g.count }))}</span></p>` : ''}
    </div>
    <ul class="reviews-list">${ctx.txt.reviews.map((r) => `<li><blockquote><p>${esc(r.text)}</p></blockquote><p class="who"><b>${esc(r.name)}</b>${esc(r.place)}</p></li>`).join('')}</ul>
    ${C.demo.enabled ? `<p class="sample">${esc(t('reviews.sample'))}</p>` : ''}
  </div>
</section>`;
}

const rail = (ctx, cars, title, id, after = '') => `<section class="latest" aria-labelledby="${id}">
  <div class="wrap">
    <div class="sec-head"><h2 id="${id}" class="h2">${esc(title)}</h2><a class="more" href="${ctx.rel('cars.html')}">${esc(ctx.t('home.seeAll', { n: count(ctx) }))}${icon.arrow}</a></div>
  </div>
  <div class="rail" data-rail tabindex="0" role="region" aria-labelledby="${id}"><div class="rail-track">${cars.map((c) => card(ctx, c, { sizes: '(min-width: 900px) 340px, 78vw' })).join('')}</div></div>
  ${after}
</section>`;

const bodyChips = (ctx) => `<nav class="wrap chips" aria-label="${esc(ctx.t('home.browse'))}"><span>${esc(ctx.t('home.browse'))}</span>${bodies(ctx).map(([b, n]) => `<a href="${ctx.rel('cars.html')}?body=${b}">${bodyShape(b)}${esc(ctx.t('body.' + b))}<b>${n}</b></a>`).join('')}</nav>`;

function finder(ctx) {
  const { C, t } = ctx;
  return `<form class="finder" action="${ctx.rel('cars.html')}" method="get" role="search" aria-label="${esc(t('finder.label'))}">
  <label class="fld"><span>${esc(t('filter.body'))}</span><select name="body"><option value="">${esc(t('filter.anyBody'))}</option>${bodies(ctx).map(([b, n]) => `<option value="${b}">${esc(t('body.' + b))} (${n})</option>`).join('')}</select></label>
  <label class="fld"><span>${esc(t('filter.budget'))}</span><select name="max"><option value="">${esc(t('filter.anyPrice'))}</option>${budgets(ctx).map((v) => `<option value="${v}">${esc(t('filter.upTo', { amount: money(C, v) }))}</option>`).join('')}</select></label>
  <button class="btn btn-accent" type="submit">${icon.search}${esc(t('finder.go'))}</button>
</form>`;
}

const bodyTiles = (ctx) => `<section class="bodies" aria-labelledby="body-t">
  <div class="wrap">
    <h2 id="body-t" class="h2">${esc(ctx.t('home.byBody'))}</h2>
    <ul class="body-list">${bodies(ctx).map(([b, n]) => `<li><a href="${ctx.rel('cars.html')}?body=${b}">${bodyShape(b)}<b>${esc(ctx.t('body.' + b))}</b><span>${esc(ctx.t('home.nCars', { n }))}</span></a></li>`).join('')}</ul>
  </div>
</section>`;

function calcBlock(ctx, { car = null, id = 'calc', compact = false } = {}) {
  const { C, t } = ctx, f = C.finance;
  const prices = available(ctx.cars).map((c) => c.price);
  const lo = Math.floor(Math.min(...prices) / 50000) * 50000, hi = Math.ceil(Math.max(...prices) / 50000) * 50000;
  const price = car ? car.price : Math.round((lo + hi) / 2 / 50000) * 50000;
  return `<div class="calc" id="${id}" data-calc data-rate="${f.rate}">
  <div class="calc-in">
    ${car ? `<input type="hidden" name="price" value="${price}">` : `<label class="rng"><span>${esc(t('calc.price'))}<output data-out="price"></output></span><input type="range" name="price" min="${lo}" max="${hi}" step="25000" value="${price}"></label>`}
    <label class="rng"><span>${esc(t('calc.deposit'))}<output data-out="deposit"></output></span><input type="range" name="deposit" min="0" max="60" step="5" value="${f.depositPct}"></label>
    <label class="rng"><span>${esc(t('calc.term'))}<output data-out="term"></output></span><input type="range" name="months" min="12" max="84" step="12" value="${f.months}"></label>
  </div>
  <div class="calc-out">
    <p class="calc-per"><span>${esc(t('calc.monthly'))}</span><b data-out="monthly"></b></p>
    ${compact ? '' : `<dl class="calc-split"><div><dt>${esc(t('calc.borrowed'))}</dt><dd data-out="borrowed"></dd></div><div><dt>${esc(t('calc.interest'))}</dt><dd data-out="interest"></dd></div><div><dt>${esc(t('calc.total'))}</dt><dd data-out="total"></dd></div></dl>`}
    <p class="calc-note">${esc(t('calc.note', { rate: f.rate, partner: f.partner || t('calc.partner') }))}</p>
  </div>
</div>`;
}

/* ---------- home, three ways ---------- */

function homeLow(ctx) {
  const { C, t } = ctx, f = featured(ctx), n = count(ctx);
  const im = ctx.images.car(f.id, 0);
  const weekday = C.hoursByDay[1], sat = C.hoursByDay[6];
  return `<section class="hero hero-low">
  <div class="wrap hero-in">
    <div class="hero-copy">
      <h1 class="h1">${esc(ctx.txt.headline)}</h1>
      <p class="lead">${esc(ctx.txt.sub)}</p>
      <p class="hero-cta"><a class="btn btn-accent btn-lg" href="${ctx.rel('cars.html')}">${esc(t('home.seeAll', { n }))}</a><a class="btn btn-wa btn-lg" href="${waLink(C, t('wa.hello', { name: C.name }))}" data-wa>${icon.wa}${esc(t('cta.whatsappUs'))}</a></p>
      <ul class="quick">
        <li>${icon.pin}<span>${esc(C.street)}, ${esc(C.locality)}</span></li>
        ${weekday ? `<li>${icon.clock}<span>${esc(t('home.hoursShort', { open: weekday[0], close: weekday[1] }))}${sat ? esc(t('home.hoursSat', { close: sat[1] })) : ''}</span></li>` : ''}
      </ul>
    </div>
    <a class="hero-photo" href="${ctx.rel(`car/${f.id}.html`)}">
      ${carImg(ctx, f, 0, { kind: 'full', eager: true, sizes: '(min-width: 900px) 52vw, 100vw' })}
      <span class="sticker"><span>${f.year} ${esc(f.name)}</span><b>${esc(money(C, f.price))}</b></span>
    </a>
  </div>
</section>
<section class="latest" aria-labelledby="latest-t">
  <div class="wrap">
    <div class="sec-head"><h2 id="latest-t" class="h2">${esc(t('home.latest'))}</h2><a class="more" href="${ctx.rel('cars.html')}">${esc(t('home.seeAll', { n }))}${icon.arrow}</a></div>
    <div class="grid">${ctx.cars.filter((c) => c.status !== 'sold').slice(0, 6).map((c) => card(ctx, c)).join('')}</div>
  </div>
</section>
${promises(ctx)}
${visit(ctx)}`;
}

function homeMid(ctx) {
  const { C, t } = ctx, f = featured(ctx), n = count(ctx);
  const stats = [
    C.since && [new Date().getFullYear() - C.since, t('stat.years')],
    [n, t('stat.stock')],
    C.googleRating && [C.googleRating.score.toFixed(1), t('stat.rating', { n: C.googleRating.count })],
  ].filter(Boolean);
  return `<section class="hero hero-mid">
  <div class="wrap hero-in">
    <div class="hero-copy">
      <h1 class="h1">${esc(ctx.txt.headline)}</h1>
      <p class="lead">${esc(ctx.txt.sub)}</p>
      ${finder(ctx)}
      <dl class="stats">${stats.map(([v, l]) => `<div><dt>${esc(l)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
    </div>
    <a class="hero-photo" href="${ctx.rel(`car/${f.id}.html`)}">
      ${carImg(ctx, f, 0, { kind: 'full', eager: true, sizes: '(min-width: 900px) 50vw, 100vw' })}
      <span class="sticker"><span>${f.year} ${esc(f.name)}</span><b>${esc(money(C, f.price))}</b></span>
    </a>
  </div>
</section>
${rail(ctx, available(ctx.cars).slice(0, 8), t('home.latest'), 'latest-t')}
${bodyTiles(ctx)}
${promises(ctx)}
<section class="band" aria-labelledby="fin-t">
  <div class="wrap band-in">
    <div><h2 id="fin-t" class="h2">${esc(t('home.finTitle'))}</h2><p class="lead">${esc(t('home.finBody'))}</p><p><a class="btn btn-accent" href="${ctx.rel('finance.html')}">${esc(t('home.finCta'))}</a><a class="btn btn-line-light" href="${ctx.rel('sell.html')}">${esc(t('home.sellCta'))}</a></p></div>
    ${calcBlock(ctx, { id: 'home-calc', compact: true })}
  </div>
</section>
${reviews(ctx)}
${visit(ctx)}`;
}

function homeHigh(ctx) {
  const { C, t } = ctx, n = count(ctx);
  const cars = available(ctx.cars);
  const prices = cars.map((c) => c.price);
  const lo = Math.ceil(Math.min(...prices) / 25000) * 25000, hi = Math.ceil(Math.max(...prices) / 25000) * 25000;
  const start = Math.round((lo + (hi - lo) * 0.45) / 25000) * 25000;
  // the hero: four of the dealer's own cars drift past, each with its price on it
  const wide = (c) => { const im = ctx.images.car(c.id, 0); return im && im.w > im.h; };
  const show = [featured(ctx), ...cars.filter((c) => c.id !== featured(ctx).id && wide(c))].slice(0, 4);
  const slides = show.map((c, i) => `<figure class="hero-slide" style="--i:${i}">${carImg(ctx, c, 0, { kind: 'full', eager: i === 0, sizes: '100vw' })}<figcaption class="sticker"><span>${c.year} ${esc(c.name)}</span><b>${esc(money(C, c.price))}</b></figcaption></figure>`).join('');
  // the budget dial: every car as a small tile, shown or hidden as the slider moves
  const tiles = [...cars].sort((a, b) => b.price - a.price).map((c) => `<a class="pick" href="${ctx.rel(`car/${c.id}.html`)}" data-price="${c.price}" data-per="${Math.round(perMonth(ctx, c))}">${carImg(ctx, c, 0, { sizes: '160px' })}<span><b>${esc(c.name)}</b>${esc(money(C, c.price))}</span></a>`).join('');
  return `<section class="hero hero-high" data-hero>
  <div class="hero-bg" data-slides>${slides}</div>
  <div class="wrap hero-in">
    <div class="hero-copy">
      <h1 class="h1">${esc(ctx.txt.headline)}</h1>
      <p class="lead">${esc(ctx.txt.sub)}</p>
    </div>
    <div class="dial" data-dial data-lo="${lo}" data-hi="${hi}">
      <div class="dial-top">
        <label for="dial-r" class="dial-q">${esc(t('dial.q'))}</label>
        <div class="seg" role="group" aria-label="${esc(t('dial.mode'))}"><button type="button" aria-pressed="true" data-mode="total">${esc(t('dial.total'))}</button><button type="button" aria-pressed="false" data-mode="month">${esc(t('dial.month'))}</button></div>
      </div>
      <output class="dial-v" for="dial-r" data-dial-v>${esc(money(C, start))}</output>
      <input id="dial-r" type="range" min="${lo}" max="${hi}" step="25000" value="${start}" data-dial-r>
      <div class="picks" data-picks aria-live="off">${tiles}</div>
      <a class="btn btn-accent btn-lg dial-go" href="${ctx.rel('cars.html')}?max=${start}" data-dial-go>${esc(t('dial.go', { n }))}</a>
    </div>
  </div>
</section>
${rail(ctx, cars.slice(0, 8), t('home.latest'), 'latest-t', bodyChips(ctx))}
<section class="band band-slim" aria-labelledby="fin-t">
  <div class="wrap band-in">
    <div><h2 id="fin-t" class="h2">${esc(t('home.finStrip', { amount: money(C, Math.min(...cars.map((c) => perMonth(ctx, c)))) }))}</h2><p class="lead">${esc(t('home.finStripBody'))}</p></div>
    <p class="band-cta"><a class="btn btn-accent btn-lg" href="${ctx.rel('finance.html')}">${esc(t('home.finCta'))}</a><a class="btn btn-line-light btn-lg" href="${ctx.rel('sell.html')}">${esc(t('home.sellCta'))}</a></p>
  </div>
</section>
${reviews(ctx)}
${visit(ctx)}`;
}

export function home(ctx) {
  const { C, T, t } = ctx, f = featured(ctx);
  const body = T.key === 'low' ? homeLow(ctx) : homeHigh(ctx);
  return page(ctx, 'home', {
    title: '', description: t('meta.home', { name: C.name, place: C.locality, n: count(ctx) }),
    image: ctx.images.car(f.id, 0)?.og, jsonld: [dealerLd(ctx)],
  }, body);
}

/* ---------- the stock list ---------- */

export function cars(ctx) {
  const { C, T, t } = ctx, list = ctx.cars, n = count(ctx);
  const uniq = (k) => [...new Set(available(list).map((c) => c[k]).filter(Boolean))].sort();
  const sel = (name, label, any, opts) => `<label class="fld"><span>${esc(label)}</span><select name="${name}"><option value="">${esc(any)}</option>${opts.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select></label>`;
  const years = uniq('year');
  const basic = `<label class="fld fld-search"><span class="sr">${esc(t('filter.search'))}</span>${icon.search}<input type="search" name="q" placeholder="${esc(t('filter.search'))}" autocomplete="off"></label>
    ${sel('body', t('filter.body'), t('filter.anyBody'), bodies(ctx).map(([b]) => [b, t('body.' + b)]))}
    ${sel('max', t('filter.budget'), t('filter.anyPrice'), budgets(ctx).map((v) => [v, t('filter.upTo', { amount: money(C, v) })]))}`;
  const full = T.filters === 'full' ? `
    ${sel('make', t('filter.make'), t('filter.anyMake'), uniq('make').map((m) => [m, m]))}
    ${sel('fuel', t('filter.fuel'), t('filter.anyFuel'), uniq('fuel').map((v) => [v, t('val.' + v)]))}
    ${sel('gear', t('filter.gear'), t('filter.anyGear'), uniq('gearbox').map((v) => [v, t('val.' + v)]))}
    ${sel('year', t('filter.year'), t('filter.anyYear'), years.slice(0, -1).reverse().map((y) => [y, t('filter.from', { year: y })]))}` : '';
  const sort = `<label class="fld fld-sort"><span>${esc(t('filter.sort'))}</span><select name="sort"><option value="new">${esc(t('sort.new'))}</option><option value="price-asc">${esc(t('sort.priceAsc'))}</option><option value="price-desc">${esc(t('sort.priceDesc'))}</option><option value="year">${esc(t('sort.year'))}</option><option value="km">${esc(t('sort.km'))}</option></select></label>`;
  const filters = T.filters === 'none' ? '' : `<form class="filters" data-filters role="search" aria-label="${esc(t('filter.label'))}">
    <details class="filters-more" data-filters-more><summary>${icon.filter}<span>${esc(t('filter.title'))}</span><b data-filter-n hidden></b></summary>
    <div class="filters-row">${basic}${full}</div></details>
    <div class="filters-bar">
      <p class="count" aria-live="polite"><b data-count>${n}</b> <span data-count-word>${esc(t('filter.cars'))}</span></p>
      ${T.saved ? `<label class="chk"><input type="checkbox" name="saved"><span>${icon.heart}${esc(t('filter.saved'))}</span></label>` : ''}
      ${sort}
      <button class="btn btn-text" type="reset" data-clear hidden>${esc(t('filter.clear'))}</button>
    </div>
  </form>`;
  const ld = {
    '@context': 'https://schema.org', '@type': 'ItemList', name: t('cars.title'),
    itemListElement: available(list).slice(0, 50).map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: `${c.year} ${c.name}`, ...(C.siteUrl && T.carPages ? { url: `${C.siteUrl}/car/${c.id}.html` } : {}) })),
  };
  return page(ctx, 'cars', {
    title: t('cars.title'), description: t('meta.cars', { name: C.name, place: C.locality, n }),
    image: ctx.images.car(featured(ctx).id, 0)?.og, jsonld: [ld],
  }, `<section class="stock">
  <div class="wrap">
    <header class="page-head"><h1 class="h1">${esc(t('cars.title'))}</h1><p class="lead">${esc(t('cars.lead', { n, place: C.locality }))}</p></header>
    ${filters}
    <div class="grid" data-grid>${list.map((c, i) => card(ctx, c, { eager: i < 2 })).join('')}</div>
    <div class="empty" data-empty hidden><h2 class="h3">${esc(t('empty.title'))}</h2><p>${esc(t('empty.body'))}</p><p><button class="btn btn-ink" type="button" data-clear-all>${esc(t('filter.clear'))}</button><a class="btn btn-wa" href="${waLink(C, t('wa.looking'))}" data-wa>${icon.wa}${esc(t('empty.ask'))}</a></p></div>
  </div>
</section>`);
}

/* ---------- one car ---------- */

export function carPage(ctx, car) {
  const { C, T, t, lang } = ctx;
  const n = Math.min(car.photos.length, T.maxPhotos);
  const title = `${car.year} ${car.name}`;
  const sold = car.status === 'sold';
  const per = C.finance.enabled && T.finance && !sold ? money(C, perMonth(ctx, car)) : null;
  const specs = [
    ['spec.year', car.year], ['spec.mileage', car.mileage != null ? km(car.mileage, lang) : t('spec.ask')],
    ['spec.gearbox', car.gearbox && t('val.' + car.gearbox)], ['spec.fuel', car.fuel && t('val.' + car.fuel)],
    ['spec.engine', car.engine], ['spec.body', car.body && t('body.' + car.body)], ['spec.colour', car.colour && (car.colourFr && lang === 'fr' ? car.colourFr : car.colour)],
    ['spec.seats', car.seats], ['spec.owners', car.owners],
  ].filter(([, v]) => v != null && v !== '');
  const desc = car.description?.[lang] || car.description?.en || '';
  const points = car.highlights?.[lang] || car.highlights?.en || [];
  const slides = Array.from({ length: Math.max(n, 1) }, (_, i) => `<li class="gal-slide${(ctx.images.car(car.id, i)?.h || 0) > (ctx.images.car(car.id, i)?.w || 1) ? " is-tall" : ""}" id="p${i + 1}">${carImg(ctx, car, i, { kind: 'full', eager: i === 0, sizes: '(min-width: 1000px) 58vw, 100vw' })}</li>`).join('');
  const thumbs = n > 1 ? `<div class="gal-thumbs" role="group" aria-label="${esc(t('gal.photos'))}">${Array.from({ length: n }, (_, i) => `<button type="button" data-go="${i}"${i === 0 ? ' aria-current="true"' : ''} aria-label="${esc(t('gal.photoN', { n: i + 1, of: n }))}">${carImg(ctx, car, i, { sizes: '96px' })}</button>`).join('')}</div>` : '';
  const similar = available(ctx.cars).filter((c) => c.id !== car.id).map((c) => [c, (c.body === car.body ? 0 : 2) + Math.abs(c.price - car.price) / car.price]).sort((a, b) => a[1] - b[1]).slice(0, 4).map(([c]) => c);
  const im = ctx.images.car(car.id, 0);
  const url = C.siteUrl ? `${C.siteUrl}/${lang === 'en' ? '' : lang + '/'}car/${car.id}.html` : '';
  const ld = [{
    '@context': 'https://schema.org', '@type': 'Car', name: title, brand: { '@type': 'Brand', name: car.make }, model: car.model,
    vehicleModelDate: String(car.year), ...(car.mileage != null ? { mileageFromOdometer: { '@type': 'QuantitativeValue', value: car.mileage, unitCode: 'KMT' } } : {}),
    ...(car.fuel ? { fuelType: car.fuel } : {}), ...(car.gearbox ? { vehicleTransmission: car.gearbox } : {}), ...(car.colour ? { color: car.colour } : {}), ...(car.body ? { bodyType: car.body } : {}),
    ...(im && C.siteUrl ? { image: `${C.siteUrl}/${im.og}` } : {}), ...(desc ? { description: desc } : {}),
    offers: { '@type': 'Offer', price: car.price, priceCurrency: C.currencyCode || 'MUR', availability: sold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock', itemCondition: 'https://schema.org/UsedCondition', ...(url ? { url } : {}), seller: { '@type': 'AutoDealer', name: C.name } },
  }];
  if (T.key === 'mid') ld.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [[t('nav.home'), ''], [t('nav.cars'), 'cars.html'], [title, `car/${car.id}.html`]].map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, ...(C.siteUrl ? { item: `${C.siteUrl}/${p}` } : {}) })) });
  const tools = T.saved || T.compare || T.share ? `<p class="car-tools">
      ${T.saved ? `<button type="button" class="btn btn-line btn-sm" data-save="${esc(car.id)}" aria-pressed="false">${icon.heart}<span data-on="${esc(t('car.saved'))}" data-off="${esc(t('car.save'))}">${esc(t('car.save'))}</span></button>` : ''}
      ${T.compare ? `<button type="button" class="btn btn-line btn-sm" data-compare="${esc(car.id)}" aria-pressed="false">${icon.scale}<span data-on="${esc(t('car.comparing'))}" data-off="${esc(t('car.compare'))}">${esc(t('car.compare'))}</span></button>` : ''}
      ${T.share ? `<button type="button" class="btn btn-line btn-sm" data-share data-title="${esc(title + ', ' + money(C, car.price))}">${icon.share}<span>${esc(t('car.share'))}</span></button>` : ''}
    </p>` : '';
  return page(ctx, 'car', {
    title: `${title}, ${money(C, car.price)}`,
    description: t('meta.car', { car: title, price: money(C, car.price), facts: facts(ctx, car).join(', '), name: C.name, place: C.locality }),
    image: T.ogPerCar ? ctx.images.share(car.id) || im?.og : im?.og, jsonld: ld, waText: carMessage(ctx, car) + (url ? '\n' + url : ''),
    preloadImage: im ? { src: ctx.asset(im.full[Object.keys(im.full)[0]]), srcset: Object.entries(im.full).map(([w, u]) => `${ctx.asset(u)} ${w}w`).join(', '), sizes: '(min-width: 1000px) 58vw, 100vw' } : null,
  }, `<div class="wrap car-wrap">
  <nav class="crumbs" aria-label="${esc(t('nav.crumbs'))}"><a href="${ctx.rel('cars.html')}">${icon.left}${esc(t('car.back'))}</a></nav>
  <div class="car" data-car="${esc(car.id)}">
    <div class="gal" data-gal>
      <div class="gal-main">
        <ul class="gal-track" data-gal-track tabindex="0" aria-label="${esc(t('gal.photos'))}">${slides}</ul>
        ${n > 1 ? `<button type="button" class="gal-btn gal-prev" data-gal-prev aria-label="${esc(t('gal.prev'))}">${icon.left}</button><button type="button" class="gal-btn gal-next" data-gal-next aria-label="${esc(t('gal.next'))}">${icon.right}</button><span class="gal-n" aria-hidden="true"><b data-gal-i>1</b> / ${n}</span>` : ''}
        ${T.lightbox && n ? `<button type="button" class="gal-zoom" data-gal-zoom aria-label="${esc(t('gal.zoom'))}">${icon.zoom}</button>` : ''}
        ${sold ? `<span class="tag tag-sold">${esc(t('tag.sold'))}</span>` : car.status === 'reserved' ? `<span class="tag tag-hold">${esc(t('tag.reserved'))}</span>` : ''}
      </div>
      ${thumbs}
    </div>
    <div class="car-side">
      <h1 class="car-name">${esc(car.name)}${car.variant ? ` <small>${esc(car.variant)}</small>` : ''}</h1>
      <p class="card-facts"><span class="plate">${car.year}</span><span>${esc(facts(ctx, car).join(', '))}</span></p>
      <p class="sticker sticker-lg"><b>${esc(money(C, car.price))}</b></p>
      ${C.demo.enabled ? `<p class="sample">${esc(t('demo.price'))}</p>` : ''}
      ${per ? `<p class="car-per">${esc(t('car.per', { amount: per }))} <a href="#finance">${esc(t('car.perHow'))}</a></p>` : ''}
      <div class="car-cta">
        <a class="btn btn-wa btn-lg" href="${waLink(C, carMessage(ctx, car) + (url ? '\n' + url : ''))}" data-wa>${icon.wa}${esc(t('car.wa'))}</a>
        ${sold ? '' : `<a class="btn btn-ink btn-lg" href="#viewing">${icon.cal}${esc(t('car.book'))}</a>`}
        <a class="btn btn-line btn-lg" href="${C.phoneList[0].href}" data-tel>${icon.phone}${esc(t('cta.call'))}</a>
      </div>
      ${tools}
    </div>
  </div>
  <div class="car-more">
    <section class="car-desc" aria-labelledby="desc-t">
      <h2 id="desc-t" class="h3">${esc(t('car.about'))}</h2>
      ${desc ? `<p>${esc(desc)}</p>` : ''}
      ${points.length ? `<ul class="ticks">${points.map((p) => `<li>${icon.check}${esc(p)}</li>`).join('')}</ul>` : ''}
    </section>
    <section aria-labelledby="spec-t">
      <h2 id="spec-t" class="h3">${esc(t('car.specs'))}</h2>
      <dl class="specs">${specs.map(([k, v]) => `<div><dt>${esc(t(k))}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
    </section>
  </div>
  ${C.finance.enabled && T.finance && !sold ? `<section class="car-fin" id="finance" aria-labelledby="fin-t"><h2 id="fin-t" class="h3">${esc(t('car.finTitle'))}</h2>${calcBlock(ctx, { car, id: 'car-calc', compact: true })}</section>` : ''}
  ${sold ? '' : `<section class="car-book" id="viewing">${enquiry(ctx, { car, kind: 'viewing' })}</section>`}
</div>
${similar.length ? `<section class="latest similar" aria-labelledby="sim-t"><div class="wrap"><h2 id="sim-t" class="h2">${esc(t('car.similar'))}</h2><div class="grid">${similar.map((c) => card(ctx, c)).join('')}</div></div></section>` : ''}
${T.lightbox ? `<dialog class="lb" data-lb aria-label="${esc(t('gal.photos'))}"><button type="button" class="lb-x" data-lb-x aria-label="${esc(t('gal.close'))}">${icon.close}</button><ul class="lb-track" data-lb-track>${Array.from({ length: n }, (_, i) => { const p = ctx.images.car(car.id, i); const big = p.full[Math.max(...Object.keys(p.full).map(Number))]; return `<li><img data-src="${ctx.asset(big)}" alt="${esc(p.alt || title)}" width="${p.w}" height="${p.h}"></li>`; }).join('')}</ul></dialog>` : ''}`);
}

/* ---------- finance, sell, contact, about, compare, legal ---------- */

export function finance(ctx) {
  const { C, t } = ctx;
  const faq = [1, 2, 3, 4].map((i) => `<details><summary>${esc(t(`fin.q${i}`))}</summary><p>${esc(t(`fin.a${i}`, { partner: C.finance.partner || t('calc.partner') }))}</p></details>`).join('');
  return page(ctx, 'finance', { title: t('fin.title'), description: t('meta.finance', { name: C.name }) }, `<section class="wrap narrow">
  <header class="page-head"><h1 class="h1">${esc(t('fin.title'))}</h1><p class="lead">${esc(t('fin.lead'))}</p></header>
  ${calcBlock(ctx)}
  <p class="calc-after"><a class="btn btn-accent" href="${ctx.rel('cars.html')}" data-calc-cars>${esc(t('fin.seeCars'))}</a><a class="btn btn-wa" href="${waLink(C, t('wa.finance'))}" data-wa>${icon.wa}${esc(t('fin.ask'))}</a></p>
  <section class="faq" aria-labelledby="faq-t"><h2 id="faq-t" class="h2">${esc(t('fin.faq'))}</h2>${faq}</section>
</section>`);
}

export function sell(ctx) {
  const { C, t } = ctx;
  const year = new Date().getFullYear();
  return page(ctx, 'sell', { title: t('sell.title'), description: t('meta.sell', { name: C.name, place: C.locality }) }, `<section class="wrap sell">
  <header class="page-head"><h1 class="h1">${esc(t('sell.title'))}</h1><p class="lead">${esc(t('sell.lead'))}</p></header>
  <div class="sell-in">
    <ol class="steps">${[1, 2, 3].map((i) => `<li><h2 class="h3">${esc(t(`sell.s${i}`))}</h2><p>${esc(t(`sell.s${i}b`))}</p></li>`).join('')}</ol>
    <form class="form" data-form="sell" novalidate>
      <h2 class="h3">${esc(t('sell.formTitle'))}</h2>
      <p class="form-note">${esc(t('form.note'))}</p>
      <label class="fld"><span>${esc(t('sell.makeModel'))}</span><input name="car" required placeholder="${esc(t('sell.makeModelEg'))}"></label>
      <label class="fld"><span>${esc(t('spec.year'))}</span><select name="year" required><option value="">${esc(t('sell.choose'))}</option>${Array.from({ length: 30 }, (_, i) => `<option>${year - i}</option>`).join('')}</select></label>
      <label class="fld"><span>${esc(t('spec.mileage'))} (km)</span><input name="km" inputmode="numeric" pattern="[0-9 ,.]*" required></label>
      <label class="fld"><span>${esc(t('sell.want'))}</span><select name="want"><option>${esc(t('sell.wantSell'))}</option><option>${esc(t('sell.wantSwap'))}</option></select></label>
      <label class="fld"><span>${esc(t('form.name'))}</span><input name="name" autocomplete="name" required></label>
      <label class="fld"><span>${esc(t('form.phone'))}</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" required pattern="[0-9+ ]{7,}"></label>
      <label class="fld fld-wide"><span>${esc(t('sell.notes'))}</span><textarea name="message" rows="3"></textarea></label>
      <p class="form-err" data-err role="alert" hidden></p>
      <div class="form-actions"><button class="btn btn-wa" type="submit">${icon.wa}${esc(t('sell.send'))}</button></div>
      <p class="form-note">${esc(t('sell.photos'))}</p>
    </form>
  </div>
</section>`);
}

export function contact(ctx) {
  const { C, t } = ctx;
  return page(ctx, 'contact', { title: t('contact.title'), description: t('meta.contact', { name: C.name, address: C.address }), jsonld: [dealerLd(ctx)] }, `<div class="wrap"><header class="page-head"><h1 class="h1">${esc(t('contact.title'))}</h1><p class="lead">${esc(t('contact.lead'))}</p></header></div>
${visit(ctx, { h: 'h2', form: true })}`);
}

export function about(ctx) {
  const { C, t } = ctx;
  return page(ctx, 'about', { title: t('nav.about'), description: ctx.txt.about[0].slice(0, 155) }, `<section class="wrap about">
  <header class="page-head"><h1 class="h1">${esc(ctx.txt.aboutTitle)}</h1></header>
  <div class="about-in">
    <div class="about-copy">${ctx.txt.about.map((p) => `<p>${esc(p)}</p>`).join('')}
      <p><a class="btn btn-accent" href="${ctx.rel('cars.html')}">${esc(t('home.seeAll', { n: count(ctx) }))}</a></p></div>
    <figure class="about-photo">${placeImg(ctx, 'keys', { sizes: '(min-width: 900px) 44vw, 100vw' })}</figure>
  </div>
</section>
${promises(ctx)}
<section class="wrap checks-flat" aria-labelledby="ch-t"><h2 id="ch-t" class="h2">${esc(t('checks.title'))}</h2><ol class="steps steps-4">${ctx.txt.checks.map((c) => `<li><h3 class="h3">${esc(c.title)}</h3><p>${esc(c.body)}</p></li>`).join('')}</ol></section>
${reviews(ctx)}
${visit(ctx)}`);
}

export function compare(ctx) {
  const { t } = ctx;
  return page(ctx, 'compare', { title: t('nav.compare'), description: t('meta.compare'), noindex: true }, `<section class="wrap cmp">
  <header class="page-head"><h1 class="h1">${esc(t('cmp.title'))}</h1><p class="lead">${esc(t('cmp.lead'))}</p></header>
  <div class="cmp-table" data-cmp data-src="${ctx.asset(ctx.files.data[ctx.lang])}" data-root="${ctx.rel('')}" data-base="${ctx.asset('')}"></div>
  <div class="empty" data-cmp-empty hidden><h2 class="h3">${esc(t('cmp.emptyTitle'))}</h2><p>${esc(t('cmp.emptyBody'))}</p><p><a class="btn btn-accent" href="${ctx.rel('cars.html')}">${esc(t('cmp.browse'))}</a></p></div>
</section>`);
}

export function legal(ctx, which) {
  const { C, t } = ctx;
  const vars = { name: C.legalName, address: C.address, email: C.email || C.phones[0] };
  const n = which === 'privacy' ? 5 : 5;
  return page(ctx, which, { title: t(`${which}.title`), description: t(`${which}.title`) + ', ' + C.name }, `<section class="wrap narrow prose">
  <header class="page-head"><h1 class="h1">${esc(t(`${which}.title`))}</h1></header>
  ${Array.from({ length: n }, (_, i) => `<h2 class="h3">${esc(t(`${which}.h${i + 1}`))}</h2><p>${esc(t(`${which}.p${i + 1}`, vars))}</p>`).join('')}
  ${C.demo.enabled ? `<p class="sample">${esc(t('legal.sample'))}</p>` : ''}
</section>`);
}

export function notFound(ctx) {
  const { t } = ctx;
  return page(ctx, '404', { title: t('nf.title'), description: t('nf.title'), noindex: true }, `<section class="wrap narrow nf"><h1 class="h1">${esc(t('nf.title'))}</h1><p class="lead">${esc(t('nf.body'))}</p><p><a class="btn btn-accent" href="${ctx.rel('cars.html')}">${esc(t('home.seeAll', { n: count(ctx) }))}</a><a class="btn btn-line" href="${ctx.rel('index.html')}">${esc(t('nav.home'))}</a></p></section>`);
}

/** The cars as data, for the compare page (one file per language). */
export function carsData(ctx) {
  const { C, lang, t } = ctx;
  return ctx.cars.map((c) => ({
    id: c.id, name: c.name, year: c.year, price: c.price, priceText: money(C, c.price), status: c.status,
    per: C.finance.enabled ? money(C, perMonth(ctx, c)) : '', img: ctx.images.car(c.id, 0)?.card[480] || '', colour: ctx.images.car(c.id, 0)?.colour || '#ccc',
    rows: [
      [t('spec.year'), c.year, c.year], [t('spec.mileage'), c.mileage != null ? km(c.mileage, lang) : t('spec.ask'), c.mileage != null ? -c.mileage : null],
      [t('spec.gearbox'), c.gearbox ? t('val.' + c.gearbox) : '', null], [t('spec.fuel'), c.fuel ? t('val.' + c.fuel) : '', null], [t('spec.engine'), c.engine || '', null],
      [t('spec.body'), c.body ? t('body.' + c.body) : '', null], [t('spec.colour'), lang === 'fr' && c.colourFr ? c.colourFr : c.colour || '', null], [t('spec.seats'), c.seats ?? '', null], [t('spec.owners'), c.owners ?? '', c.owners != null ? -c.owners : null],
    ],
  }));
}
