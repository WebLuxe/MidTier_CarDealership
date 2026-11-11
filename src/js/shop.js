// Business tier and up: live opening hours, the stock filters, the photo gallery, the calculator, the map.
import { S, $, $$, tr, money, still } from './core.js';

/* ---- opening hours, worked out in the dealer's own time zone ---- */
function clock() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: S.tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), mins: (+p.hour % 24) * 60 + +p.minute, y: +p.year, m: +p.month, d: +p.day };
}
const toMins = (s) => +s.slice(0, 2) * 60 + +s.slice(3);

export function hours() {
  const now = clock(), today = S.hours[now.day];
  $$(`tr[data-day="${now.day}"]`).forEach((r) => r.classList.add('is-today'));
  let text, open = false;
  if (today && now.mins >= toMins(today[0]) && now.mins < toMins(today[1])) { open = true; text = tr('openUntil', { time: today[1] }); }
  else if (today && now.mins < toMins(today[0])) text = tr('opensToday', { time: today[0] });
  else for (let i = 1; i <= 7; i++) {
    const d = (now.day + i) % 7;
    if (S.hours[d]) { text = tr('opensDay', { day: i === 1 ? tr('tomorrow').toLowerCase() : S.days[d].toLowerCase(), time: S.hours[d][0] }); break; }
  }
  $$('[data-open]').forEach((el) => { if (!text) return; el.textContent = text; el.classList.toggle('is-open', open); el.hidden = false; });

  // the days offered for a viewing: the next eight days the dealer is open
  const fmt = new Intl.DateTimeFormat(S.lang, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  for (const sel of $$('[data-days]')) {
    for (let i = 0, n = 0; n < 8 && i < 21; i++) {
      const d = (now.day + i) % 7, h = S.hours[d];
      if (!h || (i === 0 && now.mins > toMins(h[1]) - 60)) continue;
      const label = fmt.format(new Date(Date.UTC(now.y, now.m - 1, now.d + i)));
      sel.add(new Option(i === 0 ? `${tr('today')}, ${label}` : i === 1 ? `${tr('tomorrow')}, ${label}` : label[0].toUpperCase() + label.slice(1), label));
      n++;
    }
  }
}

/* ---- the stock list: filter, sort, count ---- */
export function stock({ saved = null, animate = false } = {}) {
  const form = $('[data-filters]'), grid = $('[data-grid]');
  if (!form || !grid) return;
  const cards = $$('.card', grid).map((el, i) => ({ el, i, ...el.dataset, price: +el.dataset.price, year: +el.dataset.year, km: el.dataset.km === '' ? Infinity : +el.dataset.km, sold: +el.classList.contains('is-sold') }));
  const empty = $('[data-empty]'), countEl = $('[data-count]'), word = $('[data-count-word]'), clears = $$('[data-clear]'), badge = $('[data-filter-n]'), more = $('[data-filters-more]');
  const fields = ['q', 'body', 'max', 'make', 'fuel', 'gear', 'year', 'sort'].filter((n) => form.elements[n]);
  const wide = matchMedia('(min-width: 900px)');
  const fit = () => { if (more) more.open = wide.matches || more.dataset.touched === '1'; };
  more?.addEventListener('toggle', () => { if (!wide.matches) more.dataset.touched = more.open ? '1' : ''; });
  wide.addEventListener('change', fit);

  // a link such as cars.html?body=SUV&max=600000 opens with those filters set
  const q = new URLSearchParams(location.search);
  for (const n of fields) if (q.has(n) && form.elements[n]) {
    const f = form.elements[n];
    if (f.tagName !== 'SELECT') f.value = q.get(n);
    else if (n === 'max' || n === 'year') { // the nearest listed step that still covers what was asked for
      const want = +q.get(n), opts = [...f.options].map((o) => +o.value).filter(Boolean);
      const best = n === 'max' ? opts.filter((v) => v >= want).sort((a, b) => a - b)[0] : opts.filter((v) => v <= want).sort((a, b) => b - a)[0];
      f.value = best ? String(best) : '';
    } else f.value = q.get(n);
  }
  if (q.has('saved') && form.elements.saved) form.elements.saved.checked = true;
  fit();

  const sorters = { new: (a, b) => a.i - b.i, 'price-asc': (a, b) => a.price - b.price, 'price-desc': (a, b) => b.price - a.price, year: (a, b) => b.year - a.year || a.i - b.i, km: (a, b) => a.km - b.km };
  function apply() {
    const v = Object.fromEntries(fields.map((n) => [n, form.elements[n].value.trim()]));
    const words = (v.q || '').toLowerCase().split(/\s+/).filter(Boolean), onlySaved = form.elements.saved?.checked && saved;
    const keep = cards.filter((c) => (!words.length || words.every((w) => c.name.includes(w))) && (!v.body || c.body === v.body) && (!v.max || c.price <= +v.max)
      && (!v.make || c.make === v.make) && (!v.fuel || c.fuel === v.fuel) && (!v.gear || c.gear === v.gear) && (!v.year || c.year >= +v.year) && (!onlySaved || saved().includes(c.id)));
    const by = sorters[v.sort] || sorters.new;
    keep.sort((a, b) => a.sold - b.sold || by(a, b)); // sold cars stay at the end
    for (const c of cards) c.el.hidden = !keep.includes(c);
    keep.forEach((c) => grid.appendChild(c.el));
    const live = keep.filter((c) => !c.sold).length;
    countEl.textContent = live; if (word) word.textContent = tr(live === 1 ? 'car' : 'cars');
    empty.hidden = keep.length > 0;
    const active = fields.filter((n) => n !== 'sort' && v[n]).length + (onlySaved ? 1 : 0);
    clears.forEach((b) => (b.hidden = !active));
    if (badge) { badge.textContent = active; badge.hidden = !active; }
    const p = new URLSearchParams();
    for (const n of fields) if (v[n] && !(n === 'sort' && v[n] === 'new')) p.set(n, v[n]);
    if (onlySaved) p.set('saved', '1');
    history.replaceState(null, '', p.toString() ? '?' + p : location.pathname);
  }
  const run = () => (animate && !still && document.startViewTransition && cards.length <= 60 ? document.startViewTransition(apply) : apply());
  let t;
  form.addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(run, e.target.name === 'q' ? 140 : 0); });
  form.addEventListener('reset', () => setTimeout(run));
  form.addEventListener('submit', (e) => e.preventDefault());
  $('[data-clear-all]')?.addEventListener('click', () => { form.reset(); });
  addEventListener('sk:saved', () => form.elements.saved?.checked && run());
  apply();
}

/* ---- photos: swipe on a phone, arrows and thumbnails everywhere ---- */
export function gallery() {
  const gal = $('[data-gal]');
  if (!gal) return null;
  const track = $('[data-gal-track]', gal), n = track.children.length, num = $('[data-gal-i]', gal), thumbs = $$('[data-go]', gal);
  let i = 0;
  const go = (k, smooth = true) => track.scrollTo({ left: Math.max(0, Math.min(n - 1, k)) * track.clientWidth, behavior: smooth && !still ? 'smooth' : 'auto' });
  const sync = () => {
    const k = Math.round(track.scrollLeft / track.clientWidth);
    if (k === i) return;
    i = k; if (num) num.textContent = i + 1;
    thumbs.forEach((b, j) => { b.toggleAttribute('aria-current', j === i); if (j === i) b.setAttribute('aria-current', 'true'); });
    thumbs[i]?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  };
  track.addEventListener('scroll', sync, { passive: true });
  $('[data-gal-prev]', gal)?.addEventListener('click', () => go(i - 1));
  $('[data-gal-next]', gal)?.addEventListener('click', () => go(i + 1));
  thumbs.forEach((b, j) => b.addEventListener('click', () => go(j)));
  track.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') go(i + 1); if (e.key === 'ArrowLeft') go(i - 1); });
  return { go, at: () => i, track };
}

/* ---- the monthly payment ---- */
export function calc() {
  for (const box of $$('[data-calc]')) {
    const rate = +box.dataset.rate, f = (n) => $(`[name=${n}]`, box), out = (k, v) => { const o = $(`[data-out=${k}]`, box); if (o) o.textContent = v; };
    const link = $('[data-calc-cars]');
    const run = () => {
      const price = +f('price').value, dep = +f('deposit').value, months = +f('months').value;
      const borrowed = price * (1 - dep / 100), r = rate / 1200, per = r ? (borrowed * r) / (1 - Math.pow(1 + r, -months)) : borrowed / months;
      out('price', money(price)); out('deposit', `${dep}%, ${money(price * dep / 100)}`);
      out('term', months === 12 ? tr('year') : tr('years', { n: months / 12 }));
      out('monthly', money(per)); out('borrowed', money(borrowed)); out('interest', money(per * months - borrowed)); out('total', money(per * months + price * dep / 100));
      for (const el of $$('input[type=range]', box)) el.style.setProperty('--fill', ((el.value - el.min) / (el.max - el.min)) * 100 + '%');
      if (link) link.href = link.href.split('?')[0] + '?max=' + price;
    };
    box.addEventListener('input', run);
    run();
  }
}

export function map() {
  for (const m of $$('[data-map]')) $('[data-map-load]', m)?.addEventListener('click', () => {
    m.innerHTML = `<iframe src="${m.dataset.map}" title="${tr('map')}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`;
  });
}

/** Arrows for the row of cars, for people with a mouse. A finger just swipes it. */
export function rails() {
  for (const rail of $$('[data-rail]')) {
    const head = $('.sec-head', rail.parentElement);
    if (!head || rail.scrollWidth <= rail.clientWidth + 8) continue;
    const box = document.createElement('div'); box.className = 'rail-btns';
    const mk = (dir, d) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'rail-btn'; b.setAttribute('aria-label', dir > 0 ? '›' : '‹'); b.innerHTML = `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`; b.addEventListener('click', () => rail.scrollBy({ left: dir * Math.max(300, rail.clientWidth * 0.8), behavior: still ? 'auto' : 'smooth' })); return b; };
    const prev = mk(-1, 'm14 6-6 6 6 6'), next = mk(1, 'm10 6 6 6-6 6');
    box.append(prev, next); head.append(box);
    const upd = () => { prev.disabled = rail.scrollLeft < 8; next.disabled = rail.scrollLeft > rail.scrollWidth - rail.clientWidth - 8; };
    rail.addEventListener('scroll', upd, { passive: true }); upd();
  }
}

/** Sections lower down the page come in as they are reached. What is already on screen is left alone. */
export function reveals() {
  if (still || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  for (const el of $$('.sec-head, .why-list li, .body-list li, .reviews-list li, .band-in > *, .visit-in > *, .steps li')) {
    if (el.getBoundingClientRect().top < innerHeight * 0.9) continue;
    el.classList.add('rv'); io.observe(el);
  }
}
