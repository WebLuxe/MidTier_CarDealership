// Signature tier: everything in Business, plus saved cars, compare, the budget dial, the inspection scene,
// full-screen photos, sharing and the opening moment.
import { core, S, $, $$, tr, money, store, toast, still } from './core.js';
import { hours, stock, gallery, calc, map, rails, reveals } from './shop.js';

const saved = () => store.get('sk:saved', []), compared = () => store.get('sk:compare', []);

function marks() {
  const s = saved(), c = compared();
  for (const b of $$('[data-save]')) press(b, s.includes(b.dataset.save));
  for (const b of $$('[data-compare]')) press(b, c.includes(b.dataset.compare));
  for (const n of $$('[data-compare-count]')) { n.textContent = c.length; n.hidden = !c.length; }
}
function press(b, on) {
  b.setAttribute('aria-pressed', on);
  const label = $('[data-on]', b);
  if (label) label.textContent = on ? label.dataset.on : label.dataset.off;
}
function lists() {
  document.addEventListener('click', (e) => {
    const s = e.target.closest('[data-save]'), c = e.target.closest('[data-compare]');
    if (s) {
      const id = s.dataset.save, list = saved();
      store.set('sk:saved', list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
      dispatchEvent(new Event('sk:saved'));
    } else if (c) {
      const id = c.dataset.compare, list = compared();
      if (!list.includes(id) && list.length >= 3) return toast(tr('cmpFull'));
      store.set('sk:compare', list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
    } else return;
    e.preventDefault();
    marks();
  });
  addEventListener('pageshow', marks);
  addEventListener('storage', marks);
  marks();
}

async function comparePage() {
  const box = $('[data-cmp]');
  if (!box) return;
  const empty = $('[data-cmp-empty]'), all = await (await fetch(box.dataset.src)).json(), root = box.dataset.root, base = box.dataset.base;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  function draw() {
    const cars = compared().map((id) => all.find((c) => c.id === id)).filter(Boolean);
    empty.hidden = cars.length > 0; box.hidden = !cars.length;
    if (!cars.length) return;
    const best = (vals, pick) => { const nums = vals.filter((v) => v != null); if (nums.length < 2 || new Set(nums).size < 2) return null; return pick(...nums); };
    const cheapest = best(cars.map((c) => c.price), Math.min);
    const rows = cars[0].rows.map((r, i) => {
      const top = best(cars.map((c) => c.rows[i][2]), Math.max);
      return `<tr><th scope="row">${esc(r[0])}</th>${cars.map((c) => `<td${top != null && c.rows[i][2] === top ? ' class="best"' : ''}>${esc(c.rows[i][1]) || '–'}</td>`).join('')}</tr>`;
    }).join('');
    box.innerHTML = `<table style="--n:${cars.length}"><thead><tr><td></td>${cars.map((c) => `<th scope="col"><a href="${root}car/${c.id}.html"><img src="${base}${c.img}" alt="" width="480" height="360" style="background:${c.colour}"><b>${esc(c.name)}</b></a><button type="button" class="btn btn-text" data-drop="${c.id}">${tr('cmpRemove')}</button></th>`).join('')}</tr></thead>
      <tbody><tr><th scope="row">${tr('cmpPrice')}</th>${cars.map((c) => `<td class="cmp-price${c.price === cheapest ? ' best' : ''}">${esc(c.priceText)}</td>`).join('')}</tr>
      ${cars[0].per ? `<tr><th scope="row">${tr('cmpPer')}</th>${cars.map((c) => `<td>${esc(c.per)}</td>`).join('')}</tr>` : ''}${rows}
      <tr><td></td>${cars.map((c) => `<td><a class="btn btn-accent btn-sm" href="${root}car/${c.id}.html">${tr('cmpView')}</a></td>`).join('')}</tr></tbody></table>
      ${cars.length < 3 ? `<p class="cmp-add"><a class="btn btn-line" href="${root}cars.html">${tr('cmpAdd')}</a></p>` : ''}`;
  }
  box.addEventListener('click', (e) => { const b = e.target.closest('[data-drop]'); if (!b) return; store.set('sk:compare', compared().filter((x) => x !== b.dataset.drop)); marks(); draw(); });
  draw();
}

/** The budget dial on the home page: move it, and the cars you can afford line up under it. */
function dial() {
  const box = $('[data-dial]');
  if (!box) return;
  const range = $('[data-dial-r]', box), out = $('[data-dial-v]', box), go = $('[data-dial-go]', box), picks = $$('.pick', box), wrap = $('[data-picks]', box);
  const tiles = picks.map((el) => ({ el, price: +el.dataset.price, per: +el.dataset.per }));
  const lo = +box.dataset.lo, hi = +box.dataset.hi, href = go.getAttribute('href').split('?')[0];
  const perLo = Math.ceil(Math.min(...tiles.map((t) => t.per)) / 500) * 500, perHi = Math.ceil(Math.max(...tiles.map((t) => t.per)) / 500) * 500;
  let mode = 'total';
  const none = wrap.appendChild(Object.assign(document.createElement('p'), { className: 'picks-none', hidden: true, textContent: tr('dialNone') }));
  function run() {
    const v = +range.value, key = mode === 'total' ? 'price' : 'per';
    const fit = tiles.filter((t) => t[key] <= v);
    tiles.forEach((t) => (t.el.hidden = true));
    fit.slice(0, innerWidth <= 420 ? 3 : 4).forEach((t) => (t.el.hidden = false));
    none.hidden = fit.length > 0;
    const amount = mode === 'total' ? money(v) : tr('perMonth', { amount: money(v) });
    out.textContent = amount;
    go.textContent = fit.length === 1 ? tr('dialGo1', { amount }) : tr('dialGo', { n: fit.length, amount });
    go.toggleAttribute('aria-disabled', !fit.length);
    go.href = fit.length ? `${href}?max=${Math.max(...fit.map((t) => t.price))}` : href;
    range.style.setProperty('--fill', ((v - range.min) / (range.max - range.min)) * 100 + '%');
  }
  for (const b of $$('[data-mode]', box)) b.addEventListener('click', () => {
    if (b.dataset.mode === mode) return;
    const share = (range.value - range.min) / (range.max - range.min);
    mode = b.dataset.mode;
    $$('[data-mode]', box).forEach((x) => x.setAttribute('aria-pressed', x === b));
    const [a, z, step] = mode === 'total' ? [lo, hi, 25000] : [perLo, perHi, 500];
    range.min = a; range.max = z; range.step = step; range.value = Math.round((a + share * (z - a)) / step) * step;
    run();
  });
  range.addEventListener('input', run);
  run();
}

/** The inspection scene: the photo stays put while the four checks pass beside it. */
function checks() {
  const sec = $('[data-checks]');
  if (!sec || !('IntersectionObserver' in window)) return;
  const items = $$('.checks-list li', sec), num = $('[data-check-n]', sec);
  sec.classList.add('is-live');
  const set = (k) => { items.forEach((li, i) => li.classList.toggle('is-on', i === k)); num.textContent = k + 1; sec.style.setProperty('--step', k); };
  const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) set(items.indexOf(e.target)); }, { rootMargin: '-45% 0px -45% 0px' });
  items.forEach((li) => io.observe(li));
  set(0);
}

function lightbox(gal) {
  const lb = $('[data-lb]'), open = $('[data-gal-zoom]');
  if (!lb || !gal || !open) return;
  const track = $('[data-lb-track]', lb);
  const show = () => {
    for (const img of $$('img[data-src]', track)) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
    lb.showModal();
    track.scrollTo({ left: gal.at() * track.clientWidth, behavior: 'auto' });
  };
  open.addEventListener('click', show);
  gal.track.addEventListener('dblclick', show);
  lb.addEventListener('click', (e) => { if (e.target.closest('[data-lb-x]') || e.target === lb || e.target.tagName === 'LI') lb.close(); });
  lb.addEventListener('close', () => gal.go(Math.round(track.scrollLeft / track.clientWidth), false));
  lb.addEventListener('keydown', (e) => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d) track.scrollBy({ left: d * track.clientWidth, behavior: still ? 'auto' : 'smooth' }); });
}

function share() {
  for (const b of $$('[data-share]')) b.addEventListener('click', async () => {
    const data = { title: b.dataset.title, text: b.dataset.title, url: location.href.split('#')[0] };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(data.url); toast(tr('copied')); }
    } catch { /* closed the share sheet */ }
  });
}

/** The opening: the name plate waits in the middle of the screen, then drives up into the menu bar. */
function opening() {
  const html = document.documentElement, logo = $('.hd .logo');
  if (!html.classList.contains('loading')) return;
  const hero = $('.hero-bg img');
  const ready = Promise.all([document.fonts.ready, hero ? hero.decode().catch(() => {}) : 0, new Promise((r) => setTimeout(r, 650))]);
  Promise.race([ready, new Promise((r) => setTimeout(r, 2200))]).then(() => {
    const from = logo.getBoundingClientRect();
    const cover = document.body.appendChild(Object.assign(document.createElement('div'), { className: 'cover' }));
    html.classList.remove('loading');
    const hd = $('.hd'); hd.style.zIndex = 96;
    const to = logo.getBoundingClientRect();
    const k = from.width / to.width;
    logo.animate([{ transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${k})` }, { transform: 'none' }], { duration: 760, easing: 'cubic-bezier(.7,0,.2,1)' }).finished.then(() => (logo.style.zIndex = ''));
    logo.style.transformOrigin = '0 0'; logo.style.zIndex = 95; logo.style.position = 'relative';
    cover.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 620, delay: 140, easing: 'ease', fill: 'forwards' }).finished.then(() => { cover.remove(); hd.style.zIndex = ''; });
    html.classList.add('opened');
  });
}

/* a tapped car photo grows into the car's page (browsers with page transitions; the rest change page as usual) */
function morph() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="car/"]'), cardEl = a?.closest('.card, .pick');
    const img = cardEl && $('img', cardEl);
    if (img) { $$('[style*="view-transition-name"]').forEach((x) => (x.style.viewTransitionName = '')); img.style.viewTransitionName = 'car-photo'; }
  }, true);
}

core(); lists(); hours(); stock({ saved, animate: true });
const gal = gallery(); lightbox(gal);
calc(); map(); rails(); reveals(); dial(); checks(); share(); comparePage(); opening(); morph();
