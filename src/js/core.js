// Runs on every page of every tier: the menu, the message forms, and the demo's safety net.
export const S = JSON.parse(document.getElementById('site').textContent);
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const tr = (k, v = {}) => (S.s[k] || k).replace(/\{(\w+)\}/g, (_, x) => v[x] ?? '');
export const money = (n) => S.cur + ' ' + Math.round(n).toLocaleString('en-US');
export const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
};

let toastEl, toastT;
export function toast(msg) {
  toastEl ||= document.body.appendChild(Object.assign(document.createElement('p'), { className: 'toast', role: 'status' }));
  toastEl.textContent = msg; toastEl.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 2600);
}

/* ---- the demo: show any dealer's name and colour from the link, and never message or call a real number ---- */
const lum = (h) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
function preview() {
  const q = new URLSearchParams(location.search), pick = (k) => {
    let v = q.get(k);
    try { if (v != null) sessionStorage.setItem('sk:' + k, v); else v = sessionStorage.getItem('sk:' + k); } catch { /* fine */ }
    return v;
  };
  let accent = pick('accent'), name = pick('name');
  if (accent && /^#?[0-9a-f]{6}$/i.test(accent)) {
    accent = '#' + accent.replace('#', '').toLowerCase();
    const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#151a21';
    const L = lum(accent), onInk = (L + 0.05) / (lum(ink) + 0.05), onWhite = 1.05 / (L + 0.05), st = document.documentElement.style;
    st.setProperty('--accent', accent); st.setProperty('--on-accent', onInk >= onWhite ? ink : '#fff');
    st.setProperty('--accent-text', onWhite >= 4.5 ? accent : `color-mix(in srgb, ${accent} 45%, ${ink})`);
  }
  name = (name || '').replace(/[<>&"]/g, '').trim().slice(0, 40);
  if (!name || name === S.name) return;
  const swap = (s) => s.split(S.legal).join(name).split(S.name).join(name);
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) if (n.nodeValue.includes(S.name) && !n.parentElement.closest('script,style')) n.nodeValue = swap(n.nodeValue);
  document.title = swap(document.title);
  const [a, ...rest] = name.split(/\s+/);
  $$('[data-brand-a]').forEach((e) => (e.textContent = a));
  $$('[data-brand-b]').forEach((e) => (e.textContent = rest.join(' ')));
  S.name = S.legal = name;
}

export function demoSheet(kind, msg = '') {
  const d = $('[data-demo-sheet]');
  if (!d) return;
  $('[data-demo-why]', d).textContent = tr(kind === 'tel' ? 'demoTel' : kind === 'mail' ? 'demoMail' : 'demoWa');
  const pre = $('[data-demo-msg]', d); pre.textContent = msg; pre.hidden = !msg;
  d.showModal();
}

/** Opens WhatsApp (or the mail app) with the message written. In the demo it shows the message instead. */
export function send(kind, msg) {
  if (S.demo) return demoSheet(kind, msg);
  location.href = kind === 'mail' ? `mailto:${S.mail}?subject=${encodeURIComponent(S.name)}&body=${encodeURIComponent(msg)}` : `https://wa.me/${S.wa}?text=${encodeURIComponent(msg)}`;
}

function demo() {
  const ORIG = S.name;
  preview();
  const d = $('[data-demo-sheet]');
  d?.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-demo-close]')) d.close(); });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-wa], a[data-tel], a[data-mail]');
    if (!a) return;
    e.preventDefault();
    const text = a.hasAttribute('data-wa') ? decodeURIComponent((a.href.split('text=')[1] || '').replace(/\+/g, ' ')) : '';
    demoSheet(a.hasAttribute('data-tel') ? 'tel' : a.hasAttribute('data-mail') ? 'mail' : 'wa', text.split(ORIG).join(S.name));
  });
}

function menu() {
  const btn = $('[data-menu-btn]'), panel = $('[data-menu]');
  if (!btn || !panel) return;
  const set = (open) => { panel.hidden = !open; btn.setAttribute('aria-expanded', open); document.documentElement.classList.toggle('menu-open', open); };
  btn.addEventListener('click', () => set(panel.hidden));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { set(false); btn.focus(); } });
  panel.addEventListener('click', (e) => e.target.closest('a') && set(false));
  matchMedia('(min-width: 900px)').addEventListener('change', () => set(false));
}

const ERR = { name: 'errName', phone: 'errPhone', message: 'errMessage', when: 'errWhen', car: 'errCar', year: 'errYear', km: 'errKm' };
function forms() {
  for (const form of $$('[data-form]')) {
    const err = $('[data-err]', form);
    let via = 'wa';
    form.addEventListener('click', (e) => { const b = e.target.closest('button[type=submit]'); if (b) via = b.dataset.via || 'wa'; });
    form.addEventListener('input', (e) => { e.target.removeAttribute('aria-invalid'); err.hidden = true; });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const bad = [...form.elements].find((f) => f.name && !f.checkValidity());
      if (bad) {
        err.textContent = tr(ERR[bad.name] || 'errMessage'); err.hidden = false;
        bad.setAttribute('aria-invalid', 'true'); bad.focus();
        return;
      }
      const v = Object.fromEntries(new FormData(form)), kind = form.dataset.form, lines = [tr('mHello', { dealer: S.name })];
      if (kind === 'viewing') lines.push(tr('mViewing', { car: form.dataset.car, price: form.dataset.price, when: v.when }));
      else if (kind === 'sell') lines.push(tr('mSell', { want: v.want, car: v.car, year: v.year, km: v.km }));
      else if (v.car) lines.push(tr('mAbout', { car: v.car }));
      if (v.message?.trim()) lines.push(v.message.trim());
      lines.push(tr('mFrom', { name: v.name.trim(), phone: v.phone.trim() }));
      send(via, lines.join('\n'));
    });
  }
}

export function core() {
  if (S.demo) demo();
  menu();
  forms();
}
