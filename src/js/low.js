// Starter tier: menu, message forms, live opening hours, the photo gallery, the loading screen.
import { core, $ } from './core.js';
import { hours, gallery, reveals, stock } from './shop.js';

/** The loading screen: the name plate waits in the middle, then slides up into the menu bar. */
function opening() {
  const html = document.documentElement, logo = $('.hd .logo'), hd = $('.hd');
  if (!html.classList.contains('loading')) return;
  Promise.race([Promise.all([document.fonts.ready, new Promise((r) => setTimeout(r, 600))]), new Promise((r) => setTimeout(r, 1800))]).then(() => {
    const from = logo.getBoundingClientRect();
    const cover = document.body.appendChild(Object.assign(document.createElement('div'), { className: 'cover' }));
    html.classList.remove('loading');
    hd.style.zIndex = 96;
    const to = logo.getBoundingClientRect();
    logo.style.transformOrigin = '0 0';
    logo.animate([{ transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width})` }, { transform: 'none' }], { duration: 620, easing: 'cubic-bezier(.7,0,.2,1)' });
    cover.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 480, delay: 120, fill: 'forwards' }).finished.then(() => { cover.remove(); hd.style.zIndex = ''; });
  });
}

core(); hours(); stock(); gallery(); reveals(); opening();
