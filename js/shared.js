/**
 * GENZ store — shared behaviour used on every page:
 * mobile nav, category icon illustrations, toasts, cart badge, WhatsApp button.
 */
(function (global) {

  const ICONS = {
    tee: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M23 7 L11 17 L17 25 L23 21 V56 H41 V21 L47 25 L53 17 L41 7 L34 11 H30 Z"/></svg>',
    hoodie: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M23 11 L11 20 L17 28 L23 24 V56 H41 V24 L47 28 L53 20 L41 11 L34 15 H30 Z"/><path d="M25 11 Q32 2 39 11"/><path d="M23 40 H41"/><circle cx="30" cy="44" r="1.3" fill="currentColor"/><circle cx="34" cy="44" r="1.3" fill="currentColor"/></svg>',
    jacket: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M23 8 L11 18 L17 26 L23 22 V56 H41 V22 L47 26 L53 18 L41 8 L34 12 H30 Z"/><path d="M32 12 V56"/><path d="M23 8 L28 16 M41 8 L36 16"/></svg>',
    pants: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M18 8 H46 V18 L41 56 H33 L32 24 L31 56 H23 L18 18 Z"/><path d="M18 20 H12 V28 H18"/></svg>',
    cap: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M14 32 A18 18 0 0 1 50 32"/><ellipse cx="32" cy="32" rx="26" ry="6"/></svg>',
    shoe: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M8 44 Q12 24 28 24 Q42 24 46 36 L52 40 Q58 42 56 48 Q54 52 48 52 H10 Q7 52 7 48 Z"/><path d="M20 32 L28 40 M28 30 L36 40"/></svg>',
    bag: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M14 22 H50 L48 56 H16 Z"/><path d="M22 22 Q22 8 32 8 Q42 8 42 22"/></svg>'
  };

  function iconMarkup(key) {
    return ICONS[key] || ICONS.tee;
  }

  function swatchInner(p) {
    if (p.image) return `<img src="${p.image}" alt="${p.name}" style="width:100%; height:100%; object-fit:cover;">`;
    return iconMarkup(p.icon);
  }

  function accentVar(name) {
    const map = { pink: 'var(--pink)', violet: 'var(--violet)', cyan: 'var(--cyan)', lime: 'var(--lime)' };
    return map[name] || 'var(--violet)';
  }

  function initNav() {
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    if (!toggle || !links) return;
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function refreshCartBadge() {
    const badge = document.querySelector('.cart-count');
    if (!badge) return;
    const count = global.Store.getCartCount();
    badge.textContent = count;
    badge.hidden = count === 0;
  }

  function initWhatsApp() {
    const fab = document.querySelector('.whatsapp-fab');
    if (!fab) return;
    const settings = global.Store.getSettings();
    const message = encodeURIComponent(`Hi ${settings.storeName}! I have a question about your products.`);
    fab.href = `https://wa.me/${settings.whatsappNumber}?text=${message}`;
  }

  let toastTimer = null;
  function showToast(message) {
    let stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    stack.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  }

  function applyStoreName() {
    const settings = global.Store.getSettings();
    document.querySelectorAll('[data-store-name]').forEach(el => { el.textContent = settings.storeName; });
    document.querySelectorAll('.logo').forEach(el => { el.textContent = settings.storeName; });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    refreshCartBadge();
    initWhatsApp();
    applyStoreName();
  });

  global.Shared = { iconMarkup, swatchInner, accentVar, refreshCartBadge, showToast, escapeHtml };
})(window);
