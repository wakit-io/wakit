/**
 * Popup library (standalone)
 * - Triggers on anchor elements with class "popup"
 * - Loads HTML from href and renders in a modal or sheet style
 * - Executes inline and external <script> tags contained in the loaded HTML
 * - Works without Core; no external dependencies
 *
 * Usage in HTML:
 *   <a href="popups/terms.html" class="popup" data-popup-style="modal" data-popup-size="md">Terms</a>
 *
 * Public API:
 *   Popup.init();             // set up global click handler for a.popup
 *   Popup.open(url, opts);    // open programmatically
 *   Popup.close();            // close the topmost popup
 */
/* eslint-disable no-console */

(() => {
  const doc = document;

  // Small helpers kept local to avoid imports
  const qs = (sel, parent = doc) => parent.querySelector(sel);
  const qsa = (sel, parent = doc) => Array.from(parent.querySelectorAll(sel));
  const uid = () => `pop-${Math.random().toString(36).slice(2, 10)}`;

  const DEFAULTS = {
    style: 'auto', // 'modal' | 'sheet' | 'auto'
    size: 'md',    // 'sm' | 'md' | 'lg' | 'full'
    title: '',
    escClose: true,
    backdropClose: true,
    className: '',
  };

  // Dedupe keys for executing scripts once if data-once or src provided
  const EXECUTED_SCRIPT_KEYS = new Set();

  function isSmallScreen() {
    try { return window.matchMedia('(max-width: 767px)').matches; } catch (_) { return true; }
  }

  function resolveStyle(requested) {
    if (requested === 'modal' || requested === 'sheet') return requested;
    // auto
    return isSmallScreen() ? 'sheet' : 'modal';
  }

  let LOCKED_SCROLL_Y = 0;
  function lockScroll() {
    try {
      LOCKED_SCROLL_Y = window.scrollY || window.pageYOffset || 0;
    } catch (_) {
      LOCKED_SCROLL_Y = 0;
    }
    // Avoid layout shift and preserve position
    doc.documentElement.classList.add('hy-popup-open');
    doc.body.classList.add('hy-scroll-lock');
    doc.body.style.position = 'fixed';
    doc.body.style.top = `-${LOCKED_SCROLL_Y}px`;
    doc.body.style.left = '0';
    doc.body.style.right = '0';
    doc.body.style.width = '100%';
  }
  function unlockScroll() {
    doc.documentElement.classList.remove('hy-popup-open');
    doc.body.classList.remove('hy-scroll-lock');
    const y = (() => {
      try { return Math.abs(parseInt(doc.body.style.top || '0', 10)) || LOCKED_SCROLL_Y || 0; } catch (_) { return LOCKED_SCROLL_Y || 0; }
    })();
    doc.body.style.position = '';
    doc.body.style.top = '';
    doc.body.style.left = '';
    doc.body.style.right = '';
    doc.body.style.width = '';
    try { window.scrollTo(0, y); } catch (_) { /* noop */ }
  }

  function ensureBackdrop() {
    let backdrop = qs('#hy-popup-backdrop');
    if (!backdrop) {
      backdrop = doc.createElement('div');
      backdrop.id = 'hy-popup-backdrop';
      backdrop.className = 'hy-popup-backdrop';
      doc.body.appendChild(backdrop);
    }
    return backdrop;
  }

  function buildPopupShell(options) {
    const opts = { ...DEFAULTS, ...options };
    const style = resolveStyle(opts.style);

    const root = doc.createElement('div');
    root.className = `hy-popup hy-popup--${style} hy-size-${opts.size}` + (opts.className ? ` ${opts.className}` : '');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.innerHTML = `
      <div class="hy-popup__surface">
        <header class="hy-popup__header">
          <div class="hy-popup__title" id="hy-popup-title">${opts.title ? String(opts.title) : ''}</div>
          <button type="button" class="hy-popup__close" aria-label="Close">×</button>
        </header>
        <div class="hy-popup__body" id="hy-popup-body"></div>
      </div>
    `;
    return root;
  }

  async function fetchHTML(url) {
    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) throw new Error(`Failed to fetch popup content: ${res.status}`);
    return res.text();
  }

  function extractBodyInnerHTML(html) {
    try {
      if (/<body[\s\S]*?>[\s\S]*<\/body>/i.test(html)) {
        const parser = new DOMParser();
        const docObj = parser.parseFromString(html, 'text/html');
        return docObj?.body?.innerHTML || html;
      }
      return html;
    } catch (_) {
      return html;
    }
  }

  function copyNodeAttributes(src, dest) {
    Array.from(src.attributes || []).forEach(attr => {
      try { dest.setAttribute(attr.name, attr.value); } catch (_) { /* noop */ }
    });
  }

  async function executeScripts(container) {
    // Find and execute scripts in DOM order. We create fresh nodes so they run.
    const scripts = qsa('script', container);
    for (const old of scripts) {
      const type = (old.getAttribute('type') || '').trim();
      // Allow default or module or anything that browser can execute
      const isBlocklistedType = type && type !== 'text/javascript' && type !== 'module' && !type.endsWith('/javascript');
      if (isBlocklistedType) continue;

      const onceKey = old.getAttribute('data-once') || old.getAttribute('src');
      if (onceKey && EXECUTED_SCRIPT_KEYS.has(onceKey)) {
        // Remove original script element so it does not clutter DOM
        old.remove();
        continue;
      }

      await new Promise((resolve) => {
        const s = doc.createElement('script');
        copyNodeAttributes(old, s);
        if (old.src) {
          s.addEventListener('load', () => resolve());
          s.addEventListener('error', () => resolve());
          // Force synchronous order by disabling async
          s.async = false;
          // Append to body so relative paths resolve against document
          doc.body.appendChild(s);
        } else {
          s.textContent = old.textContent || '';
          // Inline scripts execute immediately on insertion
          container.appendChild(s);
          resolve();
        }
      });

      if (onceKey) EXECUTED_SCRIPT_KEYS.add(onceKey);
      try { old.remove(); } catch (_) { /* noop */ }
    }
  }

  function closeElement(popup) {
    const backdrop = qs('#hy-popup-backdrop');
    if (!popup) return;

    popup.classList.remove('active');
    popup.classList.add('closing');
    backdrop?.classList.remove('show');

    const onEnd = () => {
      popup.removeEventListener('transitionend', onEnd);
      try { popup.remove(); } catch (_) { /* noop */ }
      // Remove backdrop only if there are no other popups
      if (!qs('.hy-popup')) {
        try { backdrop?.remove(); } catch (_) { /* noop */ }
        unlockScroll();
      }
    };
    popup.addEventListener('transitionend', onEnd);
    // Fallback in case transitionend doesn't fire
    setTimeout(onEnd, 350);
  }

  function closeTop() {
    const popup = qs('.hy-popup.active');
    if (!popup) return;
    closeElement(popup);
  }

  function closeById(popupId) {
    if (!popupId) return;
    const popup = qs(`.hy-popup[data-popup-id="${CSS.escape(popupId)}"]`);
    if (!popup) return;
    closeElement(popup);
  }

  function closeFrom(targetOrEvent) {
    const el = targetOrEvent && targetOrEvent.target ? targetOrEvent.target : targetOrEvent;
    const popup = el && el.closest ? el.closest('.hy-popup') : null;
    if (popup) closeElement(popup); else closeTop();
  }

  async function open(url, options = {}) {
    const opts = { ...DEFAULTS, ...options };
    const backdrop = ensureBackdrop();
    const popup = buildPopupShell(opts);
    // Assign instance id
    const popupId = opts.id || uid();
    popup.dataset.popupId = popupId;

    lockScroll();
    doc.body.appendChild(popup);
    // Attach auto-open metadata for optional snooze handling
    try {
      if (opts._autoKey) {
        popup.dataset.autoKey = String(opts._autoKey);
        popup.dataset.autoStorage = String(opts._autoStorage || 'local');
      }
    } catch (_) { /* noop */ }
    // Initial state: ensure surface starts from bottom for modal too
    const surface = popup.querySelector('.hy-popup__surface');
    try { surface && surface.getBoundingClientRect(); } catch (_) { /* noop */ }
    // Next frame: activate to trigger transitions
    requestAnimationFrame(() => {
      popup.classList.add('active');
      backdrop.classList.add('show');
    });

    // Close handlers
    if (opts.escClose) {
      const onKey = (e) => { if (e.key === 'Escape') { doc.removeEventListener('keydown', onKey); closeTop(); } };
      doc.addEventListener('keydown', onKey);
    }
    if (opts.backdropClose) {
      // Backdrop tap to close (for SSR/static pages where backdrop is clickable)
      backdrop.addEventListener('click', (ev) => { if (ev.target === backdrop) closeTop(); }, { once: true });
      // Overlay (popup root) tap to close when clicking outside the surface (covers cases where root is above backdrop)
      const onOverlayClick = (ev) => { if (ev.target === popup) closeTop(); };
      popup.addEventListener('click', onOverlayClick, { once: true });
    }
    qs('.hy-popup__close', popup)?.addEventListener('click', () => closeTop());

    const bodyEl = qs('#hy-popup-body', popup) || popup;
    try {
      const html = await fetchHTML(url);
      const inner = extractBodyInnerHTML(html);
      // Insert as inert first so we can move scripts
      bodyEl.innerHTML = inner;
      await executeScripts(bodyEl);
    } catch (err) {
      console.error(err);
      bodyEl.innerHTML = `<div class="hy-popup__error">Failed to load content</div>`;
    }
  }

  function init() {
    if (doc.__hyPopupInited) return; // idempotent guard
    doc.__hyPopupInited = true;
    // Delegate click on a.popup
    doc.addEventListener('click', (e) => {
      const a = e.target && (e.target.closest ? e.target.closest('a.popup') : null);
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href === '#' || href.startsWith('javascript:')) return; // let it pass
      e.preventDefault();
      const opts = {
        style: a.getAttribute('data-popup-style') || 'auto',
        size: a.getAttribute('data-popup-size') || 'md',
        title: a.getAttribute('data-popup-title') || '',
        escClose: a.getAttribute('data-esc-close') !== 'false',
        backdropClose: a.getAttribute('data-backdrop-close') !== 'false',
        className: a.getAttribute('data-popup-class') || '',
      };
      open(href, opts);
    });

    // Delegate: "Do not show for N days" trigger inside popup
    doc.addEventListener('click', (e) => {
      const trigger = e.target && (e.target.closest ? e.target.closest('[data-popup-snooze],[data-popup-suppress],[data-popup-dismiss-days]') : null);
      if (!trigger) return;
      const active = qs('.hy-popup.active');
      if (!active) return;
      const key = active.dataset?.autoKey || '';
      if (!key) { closeTop(); return; }
      const storageMode = (active.dataset?.autoStorage || 'local').toLowerCase();
      const store = storageMode === 'session' ? window.sessionStorage : window.localStorage;
      const daysAttr = trigger.getAttribute('data-popup-snooze')
        || trigger.getAttribute('data-popup-suppress')
        || trigger.getAttribute('data-popup-dismiss-days')
        || trigger.getAttribute('data-days');
      const days = Math.max(1, parseInt(daysAttr || '7', 10) || 7);
      const until = Date.now() + days * 24 * 60 * 60 * 1000;
      try { store.setItem(`hy-popup:auto:suppress:${key}`, String(until)); } catch (_) { /* noop */ }
      closeTop();
    });

    // Auto-open on load if declared (waits for late DOM insertions, e.g., SPA)
    scheduleAutoOpenOnLoad();
  }

  // Delegate popup action buttons inside content → emit event for host page
  doc.addEventListener('click', (e) => {
    const el = e.target && (e.target.closest ? e.target.closest('[data-popup-event]') : null);
    if (!el) return;
    const popup = el.closest ? el.closest('.hy-popup') : null;
    const popupId = popup?.dataset?.popupId || null;
    const name = el.getAttribute('data-popup-event') || 'action';
    let payload = null;
    const raw = el.getAttribute('data-popup-payload');
    if (raw) { try { payload = JSON.parse(raw); } catch (_) { payload = raw; } }
    const detail = { id: popupId, key: popup?.dataset?.autoKey || '', name, payload, trigger: el };
    try { window.dispatchEvent(new CustomEvent('hy:popup', { detail })); } catch (_) { /* noop */ }
    if (el.hasAttribute('data-popup-close') || el.getAttribute('data-popup-close-if') === 'true') {
      if (popupId) closeById(popupId); else closeTop();
    }
  });

  function scheduleAutoOpenOnLoad() {
    if (doc.__hyPopupAutoScheduled) return;
    doc.__hyPopupAutoScheduled = true;

    const findCandidate = () => {
      // Priority: explicit meta, then data attr, then anchor
      const meta = qs('meta[name="popup:auto-url"]');
      if (meta && meta.content) return { el: meta, url: meta.content, fromMeta: true };
      const el = qs('[data-popup-auto-url], a.popup[data-popup-auto]');
      if (!el) return null;
      const url = el.getAttribute('data-popup-auto-url') || el.getAttribute('href');
      if (!url) return null;
      return { el, url, fromMeta: false };
    };

    const DEADLINE_MS = 4000; // only auto-open within first 4s after init
    const startTs = Date.now();
    const hasActiveDynamicLayer = () => !!(qs('.dynamic-view.active, .dynamic-view.closing, .dynamic-view[data-closing="1"]') || qs('#dynamic-view-backdrop.show'));
    const aborted = () => !!doc.__hyPopupAutoAborted;

    const tryOpen = () => {
      if (aborted()) return true; // stop attempts
      if (Date.now() - startTs > DEADLINE_MS) return true; // stop attempts after window
      if (hasActiveDynamicLayer()) return false; // defer while dynamic layer is present
      const found = findCandidate();
      if (!found) return false;
      const { el, url, fromMeta } = found;
      const opts = {
        style: el.getAttribute?.('data-popup-style') || 'auto',
        size: el.getAttribute?.('data-popup-size') || 'md',
        title: el.getAttribute?.('data-popup-title') || '',
        escClose: el.getAttribute?.('data-esc-close') !== 'false',
        backdropClose: el.getAttribute?.('data-backdrop-close') !== 'false',
        className: el.getAttribute?.('data-popup-class') || '',
      };
      const auto = (el.getAttribute?.('data-popup-auto') || '').toLowerCase(); // '', 'once'
      const storage = (el.getAttribute?.('data-popup-auto-storage') || (fromMeta ? 'local' : 'local')).toLowerCase();
      const key = el.getAttribute?.('data-popup-auto-key') || url;
      const store = storage === 'session' ? window.sessionStorage : window.localStorage;
      try {
        if (auto === 'once' && store.getItem(`hy-popup:auto:${key}`)) return true;
        const suppressUntil = parseInt(store.getItem(`hy-popup:auto:suppress:${key}`) || '0', 10) || 0;
        if (suppressUntil > Date.now()) return true;
      } catch (_) {}
      const delay = parseInt(el.getAttribute?.('data-popup-delay') || '0', 10) || 0;
      const openNow = () => {
        open(url, { ...opts, _autoKey: key, _autoStorage: storage });
        try { if (auto === 'once') store.setItem(`hy-popup:auto:${key}`, '1'); } catch (_) {}
      };
      delay > 0 ? setTimeout(openNow, delay) : openNow();
      return true;
    };

    const startWatching = () => {
      // Abort auto-open on first user interaction/navigation
      const markAbort = () => { doc.__hyPopupAutoAborted = true; };
      doc.addEventListener('pointerdown', markAbort, { once: true, capture: true });
      doc.addEventListener('click', markAbort, { once: true, capture: true });
      window.addEventListener('hashchange', markAbort, { once: true });

      // Quick attempt first
      if (tryOpen()) return;
      // Poll + MutationObserver fallback for late DOM insertions
      let ticks = 0;
      const maxTicks = Math.ceil(DEADLINE_MS / 100);
      const iv = setInterval(() => {
        if (aborted() || tryOpen() || ++ticks >= maxTicks) clearInterval(iv);
      }, 100);
      try {
        const mo = new MutationObserver(() => { if (aborted() || tryOpen()) { mo.disconnect(); clearInterval(iv); } });
        mo.observe(doc.body, { childList: true, subtree: true });
        // Stop observing after max window
        setTimeout(() => { try { mo.disconnect(); } catch (_) {} }, DEADLINE_MS + 500);
      } catch (_) { /* noop */ }
      window.addEventListener('hashchange', () => { if (!aborted()) tryOpen(); }, { once: true });
    };

    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', startWatching, { once: true });
    else startWatching();
  }

  // Expose global
  const Popup = { init, open, close: closeTop, closeTop, closeById, closeFrom, getTopId: () => qs('.hy-popup.active')?.dataset?.popupId || null };
  try { window.Popup = Popup; } catch (_) { /* noop */ }
})();


