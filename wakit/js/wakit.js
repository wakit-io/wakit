/**
 * Lightweight SPA core for hybrid templates — Optimized Edition
 *
 * Goals (no UX change):
 *  - Adaptive memory use (LRU for dynamic-views, warm/cold dormancy for tabs)
 *  - Faster first paint (partial preload)
 *  - Cheaper transitions (transform/opacity only, short-lived will-change)
 *  - Accessibility/Prefs (prefers-reduced-motion)
 */
// Inline minimal DOM/util helpers (merged from util.js)
function qs(sel, parent = document) { return parent.querySelector(sel); }
function qsa(sel, parent = document) { return [...parent.querySelectorAll(sel)]; }
async function loadHTML(url) { const res = await fetch(url); return await res.text(); }
function setVar(name, val) { document.documentElement.style.setProperty(name, val); }

const Core = (() => {
  // ---- state ----
  let appConfig = null;
  let MOBILE_MODE = false;   // isMobile=true || actual mobile device (iOS/Android)
  let TAB_PAGES = new Set(); // tab page list (slash path safe)
  let lastActiveView = null; // last activated view element
  let lastTabIndex = -1;     // last active tab index (for direction animation)
  let lastActiveTab = null;  // last activated tab page (restored when dynamic-view closes)
  let IOS_EDGE_SWIPE_AT = 0; // iOS Safari left edge swipe start time (ms)
  const IOS_EDGE_SWIPE_WINDOW_MS = 800; // swipe recognition valid time
  const IOS_EDGE_SWIPE_EDGE_X = 16; // left edge swipe start allowed area (px)
  
  let THEME_BASE = '';       // current template (theme) root path (folder containing appConfig.json)
  const tabScrollPositions = new Map(); // store scroll position per tab (based on views container)
  const PTR_STATE = { active: false, startY: 0, startX: 0, pullY: 0, threshold: 64 };
  // pull-to-refresh tuning (configurable via appConfig.pullToRefresh)
  let PTR_DAMPING = 0.5;      // screen movement/indicator display ratio (0~1)
  let PTR_MAX_PULL = 160;     // maximum gesture recognition distance (px)
  let PTR_START_SLOP = 10;    // ignore fine movement distance (px)
  let PTR_DIRECTION_LOCK_RATIO = 1.2; // only works when vertical is dominant (dy >= dx * ratio)
  let PTR_IGNORE_EDGE_X = 16; // iOS left edge swipe margin area (px)
  let PTR_DISABLE_PAGES = []; // page ids where pull-to-refresh is disabled (from pullToRefresh.disablePages)
  const EXECUTED_SCRIPT_KEYS = new Set(); // prevent duplicate execution of data-once scripts
  const EXECUTED_STYLE_KEYS = new Set();  // prevent duplicate application of data-once styles
  const INCLUDE_CACHE = new Map(); // data-include-cache="once" cache
  let SPLASH_SHOWN_AT = 0;   // splash display start time (ms)
  const SPLASH_MIN_MS = 1200; // forced minimum display time (ms)
  let ONBOARDING_SHOWN = false;
  let INTRO_SHOWN = false;
  // flag to suppress backdrop display during iOS swipe back
  let BACKDROP_SUPPRESS = false;
  // tabbar autohide config/state
  let TABBAR_AUTOHIDE = false;
  let TABBAR_HIDE_THRESHOLD = 14; // px delta to trigger hide/show
  let lastScrollTopForTabbar = 0;
  // tabbar display mode setting
  // 'always' | 'pwa' | 'web' (web: 비모바일만 MOBILE_MODE 강제 + 셸 페르소나 / 실제 모바일이면 always와 동일 UA)
  let TABBAR_DISPLAY_MODE = 'always';
  
  // animation type setting (moved to global scope)
  let ANDROID_ANIMATION_TYPE = 'scale'; // default
  let IOS_ANIMATION_TYPE = 'slide';     // default

  let SWIPE_SUPPRESS_TIMER = null;

  // Performance flags
  const PREFERS_REDUCED_MOTION =
    typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Adaptive caps
  const DEVICE_MEMORY_GB = Number(navigator.deviceMemory || 4);
  const MAX_DYNAMIC_VIEWS_BASE = DEVICE_MEMORY_GB >= 8 ? 10 : DEVICE_MEMORY_GB >= 4 ? 6 : 4;
  let MAX_DYNAMIC_VIEWS = MAX_DYNAMIC_VIEWS_BASE;

  // Dynamic view LRU metadata
  const dynMeta = new WeakMap(); // {ts:number}

  // Tab dormancy (warm/cold)
  // warm: DOM kept but inert + content-visibility; cold: HTML snapshot cached, DOM cleared
  const TAB_WARM_LIMIT = Math.max(2, Math.min(5, (appConfig?.tabs?.length || 4) - 1));
  const tabWarmQueue = []; // LRU of page ids kept warm
  const tabColdHTML = new Map(); // pageId -> html snapshot string

  // ---- helpers ----
  const slug = (s='') => s.replace(/[^a-zA-Z0-9_-]/g, '-'); // slug for safe id
  const viewIdOf = (path) => `view-${slug(path)}`;           // for tab view
  const appIdOf  = (path) => `app-${slug(path)}`;            // for tab view
  const getViewByPage = (page) => qs(`#${CSS.escape(viewIdOf(page))}`);
  const getTabIndex = (page) => (appConfig.tabs || []).findIndex(t => t.page === page);
  const isExternalUrl = (u = '') => /^https?:\/\//i.test(String(u || ''));
  const isDirectHtmlPath = (p = '') => /^(?:#)?(?:\.\/|\/)?[^?#]+\.html(?:\?.*)?$/i.test(String(p || ''));
  const isDirectLoadablePath = (p = '') => isExternalUrl(p) || isDirectHtmlPath(p);

  // ---- security: restrict cross-origin HTML fetches by default ----
  function getSecurityConfig() {
    const sec = appConfig && appConfig.security && typeof appConfig.security === 'object' ? appConfig.security : {};
    const allowedOrigins = Array.isArray(sec.allowedOrigins) ? sec.allowedOrigins.filter(Boolean).map(String) : [];
    return {
      allowExternalRoutes: sec.allowExternalRoutes === true,
      allowedOrigins,
    };
  }
  function isAllowedHtmlFetch(url) {
    try {
      // Relative URLs always resolve to same origin.
      const u = new URL(String(url), location.href);
      if (u.origin === location.origin) return true;
      const sec = getSecurityConfig();
      if (sec.allowExternalRoutes) return true;
      return sec.allowedOrigins.includes(u.origin);
    } catch (_) {
      // If URL parsing fails, treat as unsafe and block.
      return false;
    }
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  // determine default (main) tab page: config priority (defaultTab / defaultTabPage / mainTab / mainTabPage), otherwise first
  function getDefaultTabPage() {
    try {
      const candidates = [
        appConfig?.defaultTab,
        appConfig?.defaultTabPage,
        appConfig?.mainTab,
        appConfig?.mainTabPage,
      ].filter(v => typeof v === 'string' && v.trim());
      const desired = candidates.length ? String(candidates[0]).trim() : '';
      if (desired) {
        const byPage = (appConfig.tabs || []).find(t => t.page === desired);
        if (byPage) return byPage.page;
        const byId = (appConfig.tabs || []).find(t => t.id === desired);
        if (byId) return byId.page;
      }
    } catch (_) { /* noop */ }
    return appConfig?.tabs?.[0]?.page || 'home';
  }
  // appbar brand logo show/hide toggle
  function setAppbarBrandVisible(visible) {
    try {
      const brand = qs('#appbar-brand');
      const title = qs('#appbar-title');
      if (brand) {
        brand.style.display = visible ? '' : 'none';
        brand.setAttribute('aria-hidden', visible ? 'false' : 'true');
      }
      if (title) {
        title.style.display = visible ? 'none' : '';
      }
    } catch (_) { /* noop */ }
  }
  function toggleAppbarBrandForPage(page) {
    const def = getDefaultTabPage();
    setAppbarBrandVisible(!!page && page === def);
  }
  const getTopActiveView = () => {
    const acts = qsa('.dynamic-view.active');
    if (acts.length) return acts[acts.length - 1];
    return qs('.view.active');
  };
  const findDynamicViewByPath = (path) => {
    return qsa('.dynamic-view').find(v => v.dataset.path === path && v.dataset.used === '1') || null;
  };

  // ---- dynamic view pool settings ----
  const DYNAMIC_BASE_Z = 151;  // first dynamic view base z-index (above backdrop 150)
  const BACKDROP_Z_OPEN = 150; // backdrop z-index when dynamic view exists
  const BACKDROP_Z_CLOSED = 149; // backdrop z-index when no dynamic view

  // z-index utility: calculate maximum value of dynamic views
  function readNumericZIndex(el) {
    if (!el) return 0;
    let z = 0;
    const inlineZ = el.style?.zIndex;
    if (inlineZ) {
      const val = parseInt(inlineZ, 10);
      if (!Number.isNaN(val)) z = val;
    }
    if (!z && typeof window !== 'undefined' && window.getComputedStyle) {
      const cs = window.getComputedStyle(el);
      const val = parseInt(cs.zIndex || '0', 10);
      if (!Number.isNaN(val)) z = val;
    }
    return Number.isNaN(z) ? 0 : z;
  }
  function getMaxDynamicViewZIndex() {
    let maxZ = 0;
    qsa('.dynamic-view').forEach(v => {
      const z = readNumericZIndex(v);
      if (!Number.isNaN(z)) maxZ = Math.max(maxZ, z);
    });
    return maxZ;
  }

  function ensureDynamicBackdrop() {
    if (!qs('#dynamic-view-backdrop')) {
      const dv = document.createElement('div');
      dv.id = 'dynamic-view-backdrop';
      dv.className = 'dynamic-view-backdrop';
      document.body.appendChild(dv);
    }
  }
  function ensureDynamicLoadingOverlay() {
    if (!qs('#dynamic-loading')) {
      const ld = document.createElement('div');
      ld.id = 'dynamic-loading';
      ld.className = 'dynamic-loading';
      ld.innerHTML = '<div class="spinner" aria-label="Loading" role="status"></div>';
      document.body.appendChild(ld);
    }
  }

  // ---- tabbar auto hide ----
  function setTabbarHidden(hidden) {
    const tabbar = qs('#tabbar');
    if (!tabbar) return;
    tabbar.classList.toggle('hide', !!hidden);
  }
  function initTabbarAutoHide() {
    if (!MOBILE_MODE || !TABBAR_AUTOHIDE) return;
    const views = qs('#views');
    const tabbar = qs('#tabbar');
    if (!views || !tabbar) return;
    lastScrollTopForTabbar = views.scrollTop || 0;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = views.scrollTop || 0;
        const dy = y - lastScrollTopForTabbar;
        // always show at top
        if (y <= 0) {
          setTabbarHidden(false);
        } else if (Math.abs(dy) >= TABBAR_HIDE_THRESHOLD) {
          if (dy > 0) setTabbarHidden(true);     // scroll down → hide
          else setTabbarHidden(false);           // scroll up → show
          lastScrollTopForTabbar = y;
        }
        ticking = false;
      });
    };
    views.addEventListener('scroll', onScroll, { passive: true });
  }
  function updateDynamicBackdropVisibility() {
    const backdrop = qs('#dynamic-view-backdrop');
    if (!backdrop) return;
    // always hide during swipe back
    if (BACKDROP_SUPPRESS) {
      backdrop.classList.remove('show');
      backdrop.style.zIndex = String(BACKDROP_Z_CLOSED);
      return;
    }
    const anyActiveDynamic = !!qs('.dynamic-view.active');
    const anyClosingDynamic = !!qs('.dynamic-view[data-closing="1"], .dynamic-view.closing');
    const shouldShow = anyActiveDynamic || anyClosingDynamic;
    backdrop.classList.toggle('show', shouldShow);
    if (shouldShow) {
      // set backdrop z-index just below top dynamic view (1 lower value)
      const maxDynZ = getMaxDynamicViewZIndex();
      const topZ = Math.max(DYNAMIC_BASE_Z, maxDynZ);
      const backdropZ = Math.max(BACKDROP_Z_CLOSED, topZ - 1);
      backdrop.style.zIndex = String(backdropZ);
    } else {
      backdrop.style.zIndex = String(BACKDROP_Z_CLOSED);
    }
    
    // update pull-to-refresh show/hide based on dynamic-view state
    updatePullToRefreshVisibility();
  }

  function showDynamicBackdrop() {
    const backdrop = qs('#dynamic-view-backdrop');
    // do not show while swipe back is suppressed
    if (BACKDROP_SUPPRESS) {
      backdrop?.classList.remove('show');
      if (backdrop) backdrop.style.zIndex = String(BACKDROP_Z_CLOSED);
      return;
    }
    backdrop?.classList.add('show');
  }

  function showDynamicLoading() {
    qs('#dynamic-loading')?.classList.add('show');
  }
  function hideDynamicLoading() {
    qs('#dynamic-loading')?.classList.remove('show');
  }

  // backdrop forced hide toggle (immediate effect)
  function setBackdropSuppressed(suppress) {
    BACKDROP_SUPPRESS = !!suppress;
    updateDynamicBackdropVisibility();
  }

  // suppress body/appbar/tabbar transitions during gesture (swipe back)
  function setGestureAnimSuppressed(suppress) {
    try {
      const rootEl = document.documentElement;
      rootEl.classList.toggle('no-gesture-anim', !!suppress);
    } catch (_) { /* noop */ }
  }

  // ---- HTML helpers ----
  function extractBodyInnerHTML(html) {
    try {
      if (/<body[\s\S]*?>[\s\S]*<\/body>/i.test(html)) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const body = doc?.body;
        if (body) {
          // data-spa-ignore: 해당 요소(및 자손)를 SPA 주입 시 DOM에 넣지 않음
          const ignoreList = body.querySelectorAll('[data-spa-ignore]');
          const arr = Array.from(ignoreList);
          arr.sort((a, b) => {
            if (a.contains(b)) return 1;   // a가 조상이면 a를 뒤로
            if (b.contains(a)) return -1;
            return 0;
          });
          arr.forEach(el => el.remove());
          return body.innerHTML;
        }
        return html;
      }
      return html;
    } catch (_) {
      return html;
    }
  }

  /**
   * fetched HTML에서 다이나믹 뷰 헤더용 타이틀·옵션 추출
   * @returns {{ title: string, usePageTitle: boolean }}
   *   - title: <head><title> 텍스트
   *   - usePageTitle: false면 이 페이지에서 타이틀 표시 안 함 (<meta name="wakit:no-dv-title" content="1"> 시)
   */
  function extractTitleAndOptionsFromHTML(html) {
    const out = { title: '', usePageTitle: true };
    try {
      if (!html || typeof html !== 'string') return out;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const titleEl = doc.querySelector('head title');
      if (titleEl && titleEl.textContent) out.title = titleEl.textContent.trim();
      const noTitleMeta = doc.querySelector('head meta[name="wakit:no-dv-title"]');
      if (noTitleMeta) {
        const v = (noTitleMeta.getAttribute('content') || '').trim().toLowerCase();
        if (v === '1' || v === 'true' || v === 'yes') out.usePageTitle = false;
      }
      return out;
    } catch (_) {
      return out;
    }
  }

  function hashString(text) {
    try {
      let hash = 5381;
      for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) + hash) ^ text.charCodeAt(i);
      }
      return String(hash >>> 0);
    } catch (_) {
      return String(Date.now());
    }
  }

  // ---- CSS processor ----
  // Remove styles injected for a dynamic view (call when view is closed so EXECUTED_STYLE_KEYS is cleared and no cascade bleed)
  function removeDynamicViewStyles(path) {
    if (!path || !document.head) return;
    const head = document.head;
    qsa(`link[data-wakit-dynamic-view][data-wakit-view-path="${CSS.escape(path)}"]`, head).forEach(link => {
      const href = link.getAttribute('href');
      if (href) EXECUTED_STYLE_KEYS.delete(href);
      try { link.remove(); } catch (_) {}
    });
    qsa(`style[data-wakit-dynamic-view][data-wakit-view-path="${CSS.escape(path)}"]`, head).forEach(style => {
      const key = style.getAttribute('data-wakit-style-key');
      if (key) EXECUTED_STYLE_KEYS.delete(key);
      try { style.remove(); } catch (_) {}
    });
  }

  function processInlineStyles(container, prependToHead = false) {
    const head = document.head || document.documentElement;
    // Check if container is inside a dynamic view
    const viewEl = container.closest && container.closest('.dynamic-view');
    const isDynamicView = !!viewEl;
    const dynamicViewPath = viewEl ? (viewEl.dataset && viewEl.dataset.path) || '' : '';
    // For dynamic views: append so current view's styles win; and mark for removal when view closes
    const shouldPrepend = prependToHead || (isDynamicView && !dynamicViewPath);
    const appendForDynamicView = isDynamicView && dynamicViewPath;

    // Find insertion point: for dynamic views (non-append mode), insert after data-spa-ignore stylesheets
    let insertBefore = null;
    if (shouldPrepend && !appendForDynamicView) {
      const existingStyles = qsa('link[rel="stylesheet"]:not([data-spa-ignore]), style:not([data-spa-ignore])', head);
      if (existingStyles.length > 0) {
        insertBefore = existingStyles[0];
      }
    }

    // link rel=stylesheet → hoist to global, dedupe by href or data-once
    qsa('link[rel="stylesheet"]', container).forEach(old => {
      if (old.hasAttribute('data-spa-ignore')) { old.remove(); return; }
      const onceKey = old.getAttribute('data-once') || old.getAttribute('href');
      if (onceKey && EXECUTED_STYLE_KEYS.has(onceKey)) { old.remove(); return; }
      const link = document.createElement('link');
      Array.from(old.attributes).forEach(attr => link.setAttribute(attr.name, attr.value));
      if (appendForDynamicView) {
        link.setAttribute('data-wakit-dynamic-view', dynamicViewPath);
        link.setAttribute('data-wakit-view-path', dynamicViewPath);
      }

      if (appendForDynamicView) {
        head.appendChild(link);
      } else if (shouldPrepend && insertBefore) {
        head.insertBefore(link, insertBefore);
      } else if (shouldPrepend) {
        const firstChild = head.firstChild;
        if (firstChild) {
          head.insertBefore(link, firstChild);
        } else {
          head.appendChild(link);
        }
      } else {
        head.appendChild(link);
      }

      if (onceKey) EXECUTED_STYLE_KEYS.add(onceKey);
      old.remove();
    });
    // style tag: if data-once exists, hoist to global + dedupe, otherwise keep in view (auto-removed when view is removed)
    qsa('style', container).forEach(old => {
      if (old.hasAttribute('data-spa-ignore')) { old.remove(); return; }
      const providedKey = old.getAttribute('data-once');
      const contentKey = providedKey || (old.textContent ? `inline:${hashString(old.textContent)}` : 'inline:empty');
      if (providedKey) {
        if (EXECUTED_STYLE_KEYS.has(contentKey)) { old.remove(); return; }
        const style = document.createElement('style');
        Array.from(old.attributes).forEach(attr => {
          if (attr.name !== 'data-once') style.setAttribute(attr.name, attr.value);
        });
        style.textContent = old.textContent;
        if (appendForDynamicView) {
          style.setAttribute('data-wakit-dynamic-view', dynamicViewPath);
          style.setAttribute('data-wakit-view-path', dynamicViewPath);
          style.setAttribute('data-wakit-style-key', contentKey);
        }

        if (appendForDynamicView) {
          head.appendChild(style);
        } else if (shouldPrepend && insertBefore) {
          head.insertBefore(style, insertBefore);
        } else if (shouldPrepend) {
          const firstChild = head.firstChild;
          if (firstChild) {
            head.insertBefore(style, firstChild);
          } else {
            head.appendChild(style);
          }
        } else {
          head.appendChild(style);
        }

        EXECUTED_STYLE_KEYS.add(contentKey);
        old.remove();
      } else {
        // keep per-view styles to disappear according to view lifecycle
      }
    });
  }

  // ---- simple include/partials (mobile mode) ----
  function substituteTemplate(html, props) {
    if (!props || typeof props !== 'object') return html;
    try {
      return html.replace(/\$\{(\w+)\}/g, (_, k) => (k in props ? String(props[k]) : ''));
    } catch (_) { return html; }
  }
  async function hydrateIncludes(container, includeMode = 'mobile') {
    const nodes = qsa('[data-include]:not([data-include-processed="1"])', container);
    if (!nodes.length) return;
    await Promise.all(nodes.map(async (el) => {
      try {
        const when = (el.getAttribute('data-include-when') || 'both').toLowerCase();
        const should = includeMode === 'mobile' ? (when === 'mobile' || when === 'both') : (when === 'web' || when === 'both');
        if (!should) { el.setAttribute('data-include-processed', '1'); return; }
        let url = el.getAttribute('data-include') || '';
        if (!url) { el.setAttribute('data-include-processed', '1'); return; }
        // Prefer THEME_BASE; fallback to current location
        try {
          if (!/^https?:|^\//i.test(url)) {
            const baseHref = THEME_BASE || location.href;
            url = new URL(url, baseHref).href;
          }
        } catch (_) {}
        const cacheOnce = (el.getAttribute('data-include-cache') || '').toLowerCase() === 'once';
        let html = cacheOnce && INCLUDE_CACHE.has(url) ? INCLUDE_CACHE.get(url) : '';
         if (!html) {
           if (!isAllowedHtmlFetch(url)) {
             // Block cross-origin partials by default
             el.setAttribute('data-include-processed', '1');
             return;
           }

           const res = await fetch(url, { credentials: 'same-origin' });
           if (!res.ok) { el.setAttribute('data-include-processed', '1'); return; }
           html = await res.text();
           if (cacheOnce) INCLUDE_CACHE.set(url, html);
         }
        // props substitution
        let props = null;
        const propsAttr = el.getAttribute('data-props');
        if (propsAttr) { try { props = JSON.parse(propsAttr); } catch (_) { props = null; } }
        const finalHtml = substituteTemplate(html, props);
        el.innerHTML = finalHtml;
        // execute nested includes first (depth 1-2 suffice)
        await hydrateIncludes(el, includeMode);
        // then apply styles and scripts
        processInlineStyles(el);
        await executeInlineScripts(el);
        // CommentsModule auto initialization (after script execution)
        await autoInitCommentsModule(el);
      } catch (_) { /* ignore include errors */ }
      finally { el.setAttribute('data-include-processed', '1'); }
    }));
  }

  // ---- pull-to-refresh ----
  function ensurePullToRefreshUI() {
    const views = qs('#views');
    if (!views) return;
    if (!qs('#pull-to-refresh', views)) {
      const el = document.createElement('div');
      el.id = 'pull-to-refresh';
      el.className = 'pull-to-refresh';
      el.innerHTML = '<div class="ptr-indicator"><div class="spinner"></div></div>';
      views.appendChild(el);
    }
    
    // hide pull-to-refresh when dynamic-view is active
    const pullToRefresh = qs('#pull-to-refresh', views);
    if (pullToRefresh) {
      const hasActiveDynamic = !!qs('.dynamic-view.active');
      pullToRefresh.style.display = hasActiveDynamic ? 'none' : 'block';
    }
  }

  // update pull-to-refresh show/hide based on dynamic-view state
  function updatePullToRefreshVisibility() {
    const views = qs('#views');
    if (!views) return;
    
    const pullToRefresh = qs('#pull-to-refresh', views);
    if (pullToRefresh) {
      const hasActiveDynamic = !!qs('.dynamic-view.active');
      pullToRefresh.style.display = hasActiveDynamic ? 'none' : 'block';
    }
  }

  function initPullToRefresh() {
    const views = qs('#views');
    if (!views) return;

    const getY = (e) => (e.touches ? e.touches[0].clientY : e.clientY);
    const getX = (e) => (e.touches ? e.touches[0].clientX : e.clientX);
    const activeViewEl = () => getTopActiveView();
    const ptrEl = qs('#pull-to-refresh', views);

    // current page id for PTR: tab view id is view-{slug(page)}, dynamic view has dataset.path
    const getCurrentPageForPTR = () => {
      const top = getTopActiveView();
      if (!top) return '';
      if (top.classList && top.classList.contains('dynamic-view')) return (top.dataset.path || '').split('/')[0].split('?')[0].trim() || '';
      if (top.id && String(top.id).startsWith('view-')) return String(top.id).replace(/^view-/, '') || '';
      return '';
    };
    const isPTRDisabledForCurrentPage = () => {
      if (!PTR_DISABLE_PAGES.length) return false;
      const page = getCurrentPageForPTR();
      return PTR_DISABLE_PAGES.some(p => p === page);
    };

    const onStart = (e) => {
      if (views.scrollTop > 0) return;
      
      // block pull-to-refresh when current page is in disablePages
      if (isPTRDisabledForCurrentPage()) return;
      
      // block pull-to-refresh when dynamic-view is active
      const hasActiveDynamic = !!qs('.dynamic-view.active');
      if (hasActiveDynamic) return;
      
      // iOS left edge swipe back: ignore PTR if starts near edge
      try {
        const isIOS = getDeviceType() === 'ios';
        const x = getX(e) || 0;
        if (isIOS && (x <= PTR_IGNORE_EDGE_X || x <= IOS_EDGE_SWIPE_EDGE_X)) return;
      } catch (_) { /* noop */ }
      PTR_STATE.active = true;
      PTR_STATE.startY = getY(e);
      PTR_STATE.startX = getX(e) || 0;
      PTR_STATE.pullY = 0;
    };
    const onMove = (e) => {
      if (!PTR_STATE.active) return;
      
      // block pull-to-refresh when current page is in disablePages
      if (isPTRDisabledForCurrentPage()) {
        PTR_STATE.active = false;
        resetPull();
        return;
      }
      
      // block pull-to-refresh when dynamic-view is active
      const hasActiveDynamic = !!qs('.dynamic-view.active');
      if (hasActiveDynamic) {
        PTR_STATE.active = false;
        return;
      }
      
      const dyRaw = getY(e) - PTR_STATE.startY;
      const dxRaw = Math.abs((getX(e) || 0) - (PTR_STATE.startX || 0));
      // ignore PTR when horizontal gesture is dominant (protect swipe back/horizontal scroll)
      if (dxRaw * PTR_DIRECTION_LOCK_RATIO > Math.max(dyRaw, 0)) return;
      if (dyRaw <= 0) return; // ignore if pushed up
      // ignore fine movement range to reduce oversensitivity
      const dy = Math.max(0, dyRaw - PTR_START_SLOP);
      if (dy <= 0) return;
      PTR_STATE.pullY = Math.min(dy, PTR_MAX_PULL);
      // apply damping to actual screen movement/display ratio
      const visual = PTR_STATE.pullY * PTR_DAMPING;
      // since gesture operates instead of scroll, cancel default behavior only after threshold
      e.preventDefault();
      const v = activeViewEl();
      if (v) v.style.transform = `translateY(${visual}px)`;
      if (ptrEl) ptrEl.style.height = `${Math.min(visual, 48)}px`;
    };
    const resetPull = () => {
      const v = activeViewEl();
      if (v) v.style.transform = '';
      if (ptrEl) ptrEl.style.height = '';
      PTR_STATE.active = false;
      PTR_STATE.pullY = 0;
    };
    const onEnd = async () => {
      if (!PTR_STATE.active) return;
      
      // block pull-to-refresh when current page is in disablePages
      if (isPTRDisabledForCurrentPage()) {
        resetPull();
        return;
      }
      
      // block pull-to-refresh when dynamic-view is active
      const hasActiveDynamic = !!qs('.dynamic-view.active');
      if (hasActiveDynamic) {
        resetPull();
        return;
      }
      
      const reached = PTR_STATE.pullY >= PTR_STATE.threshold;
      resetPull();
      if (reached) {
        await refreshCurrentView();
      }
    };

    views.addEventListener('touchstart', onStart, { passive: true });
    views.addEventListener('touchmove', onMove, { passive: false });
    views.addEventListener('touchend', onEnd, { passive: true });
    views.addEventListener('pointerdown', onStart, { passive: true });
    views.addEventListener('pointermove', onMove, { passive: false });
    views.addEventListener('pointerup', onEnd, { passive: true });
  }

  async function refreshCurrentView() {
    const top = getTopActiveView();
    const views = qs('#views');
    if (!top || !views) return;
    showDynamicLoading();
    try {
      if (top.classList.contains('dynamic-view')) {
        const path = top.dataset.path || '';
        const route = (appConfig.routes || []).find(r => r.path === path);
        const isDirectPagePath = /^(?:#)?(?:\.\/)?views\/.+\.html(?:\?.*)?$/i.test(path) || /^\/?views\/.+\.html(?:\?.*)?$/i.test(path);
        const useFallbackFile = !route && isDirectPagePath;
        const fileUrl = useFallbackFile
          ? (() => {
              // direct path refresh from dynamic view: allow both external URLs and local html paths
              if (isExternalUrl(path)) return `${path}${location.search || ''}`;
              let p = path.replace(/^#/, '');
              if (!/^\.|\//.test(p)) p = `./${p}`;
              return p;
            })()
          : (() => {
              const f = route?.file || '';
              if (isExternalUrl(f)) return `${f}${location.search || ''}`;
              return `./views/${f}${location.search || ''}`;
            })();
        if (!isAllowedHtmlFetch(fileUrl)) {
          const pageDiv = qs('.page', top);
          if (pageDiv) pageDiv.innerHTML = `<p style="color:#c00">Blocked cross-origin route: ${escapeHtml(fileUrl)}</p>`;
          return;
        }

        const html = await loadHTML(fileUrl);
        const pageDiv = qs('.page', top);
        if (pageDiv) {
          pageDiv.innerHTML = extractBodyInnerHTML(html);
          processInlineStyles(pageDiv);
          await executeInlineScripts(pageDiv);
          // CommentsModule auto initialization (after script execution)
          await autoInitCommentsModule(pageDiv);
        }
      } else {
        const page = (appConfig.tabs || []).find(t => viewIdOf(t.page) === top.id)?.page;
        const route = (appConfig.routes || []).find(r => r.path === page);
        const mount = page ? qs(`#${CSS.escape(appIdOf(page))}`) : null;
        if (route && mount) {
          const url = (() => {
            const f = route.file || '';
            if (isExternalUrl(f)) return `${f}${location.search || ''}`;
            return `./views/${f}${location.search || ''}`;
          })();

          if (!isAllowedHtmlFetch(url)) {
            mount.innerHTML = `<p style="color:#c00">Blocked cross-origin route: ${escapeHtml(url)}</p>`;
            mount.dataset.loaded = '1';
            return;
          }

          const html = await loadHTML(url);
          mount.innerHTML = extractBodyInnerHTML(html);
          processInlineStyles(mount);
          await executeInlineScripts(mount);
          // CommentsModule auto initialization (after script execution)
          await autoInitCommentsModule(mount);
          mount.dataset.loaded = '1';
        }
      }
    } catch (_) {
      // noop
    } finally {
      hideDynamicLoading();
    }
  }

  function closeAllDynamicViews() {
    const closing = qsa('.dynamic-view.active');
    const views = qs('#views');
    const appbar = qs('.appbar');
    const tabbar = qs('.tabbar');
    const body = document.body;
    let closingCount = closing.length;
    
    // restore previous views to original position before closing all dynamic views
    closing.forEach((v, index) => {
      if (index > 0) {
        setDynamicInnerShift(v, false);
      }
    });
    
    closing.forEach(v => {
      const viewPath = v.dataset.path || '';
      v.dataset.closing = '1';
      v.classList.add('closing');
      const onEnd = (e) => {
        if (e.target !== v) return;
        v.removeEventListener('transitionend', onEnd);
        delete v.dataset.closing;
        v.classList.remove('closing');
        removeDynamicViewStyles(viewPath);
        try { v.remove(); } catch (_) {}
        closingCount--;
        
        // restore body to original position when all dynamic-views are closed
        if (closingCount === 0 && body && MOBILE_MODE) {
          if (usesChromeScaleForDynamicView()) {
            body.classList.remove('dynamic-active-scale');
            body.classList.add('dynamic-inactive-scale');
          } else if (usesChromeSlideForDynamicView()) {
            body.classList.remove('dynamic-active');
            body.classList.add('dynamic-inactive');
            const appbarEl = qs('.appbar');
            const tabbarEl = qs('.tabbar');
            if (appbarEl) {
              appbarEl.classList.remove('dynamic-active');
              appbarEl.classList.add('dynamic-inactive');
            }
            if (tabbarEl) {
              tabbarEl.classList.remove('dynamic-active');
              tabbarEl.classList.add('dynamic-inactive');
            }
          }
        }
        
        updateDynamicBackdropVisibility();
        ensureDynamicSlot(1);
        
        // restore to previous tab when all dynamic views are closed
        if (closingCount === 0) {
          // restore tabbar with upward animation (both Android/iOS)
          const tabbar = qs('#tabbar');
          if (tabbar && MOBILE_MODE) {
            requestAnimationFrame(() => {
              tabbar.classList.remove('tabbar-hide');
              tabbar.classList.add('tabbar-show');
            });
          }
          
          if (lastActiveTab && TAB_PAGES.has(lastActiveTab)) {
            showTab(lastActiveTab);
          }
        }
      };
      v.addEventListener('transitionend', onEnd);
      // eslint-disable-next-line no-unused-expressions
      v.getBoundingClientRect();
    });
    showDynamicBackdrop();
    updateDynamicBackdropVisibility();
  }

  // helper to close immediately without animation when gesture swipe back on iOS
  function closeTopDynamicInstant() {
    const actsNow = qsa('.dynamic-view.active');
    const top = actsNow.length ? actsNow[actsNow.length - 1] : null;
    if (!top) return false;

    const body = document.body;
    const appbarEl = qs('.appbar');
    const tabbarEl = qs('.tabbar');

    // 1) restore second-top dynamic view internal shift to 0 without transition just before clearing (for stack residue)
    const nextTop = actsNow.length >= 2 ? actsNow[actsNow.length - 2] : null;
    const skipInnerReset = getShellDeviceType() === 'ios' && IOS_ANIMATION_TYPE === 'scale';
    if (nextTop && !skipInnerReset) {
      const parts = [
        nextTop.querySelector('.appbar.appheader'),
        nextTop.querySelector('.page'),
      ].filter(Boolean);
      const backups = parts.map(el => el.style.transition);
      parts.forEach(el => { el.style.transition = 'none'; });
      setDynamicInnerShift(nextTop, false);
      // force reflow to finalize styles
      // eslint-disable-next-line no-unused-expressions
      nextTop.offsetWidth;
      // restore transition on next frame
      requestAnimationFrame(() => {
        parts.forEach((el, i) => { el.style.transition = backups[i] || ''; });
      });
    }

    // 2) immediately remove top dynamic view (to avoid overlap with native gesture)
    removeDynamicViewStyles(top.dataset.path || '');
    try { top.remove(); } catch (_) {}

    // 3) restore global UI if stack is empty
    if (!qsa('.dynamic-view.active').length && body && MOBILE_MODE) {
      if (usesChromeScaleForDynamicView()) {
        body.classList.remove('dynamic-active-scale');
        body.classList.add('dynamic-inactive-scale');
      } else if (usesChromeSlideForDynamicView()) {
        let usedInline = false;
        if (typeof setGestureAnimSuppressed === 'function') {
          setGestureAnimSuppressed(true);
        } else {
          usedInline = true;
          [document.documentElement, body, appbarEl, tabbarEl].filter(Boolean)
            .forEach(el => { el.style.transition = 'none'; el.style.animation = 'none'; });
        }
        body.classList.remove('dynamic-active');
        body.classList.add('dynamic-inactive');
        if (appbarEl) {
          appbarEl.classList.remove('dynamic-active');
          appbarEl.classList.add('dynamic-inactive');
        }
        if (tabbarEl) {
          tabbarEl.classList.remove('dynamic-active');
          tabbarEl.classList.add('dynamic-inactive');
        }
        // eslint-disable-next-line no-unused-expressions
        body.offsetWidth;
        requestAnimationFrame(() => {
          if (typeof setGestureAnimSuppressed === 'function') {
            setGestureAnimSuppressed(false);
          }
          if (usedInline) {
            [document.documentElement, body, appbarEl, tabbarEl].filter(Boolean)
              .forEach(el => { el.style.transition = ''; el.style.animation = ''; });
          }
        });
      }
    }

    updateDynamicBackdropVisibility();
    ensureDynamicSlot(1);
    
    // restore to previous tab when all dynamic views are closed
    const remainingViews = qsa('.dynamic-view.active');
    if (remainingViews.length === 0) {
      // restore tabbar with upward animation (both Android/iOS)
      const tabbar = qs('#tabbar');
      if (tabbar && MOBILE_MODE) {
        requestAnimationFrame(() => {
          tabbar.classList.remove('tabbar-hide');
          tabbar.classList.add('tabbar-show');
        });
      }
      
      if (lastActiveTab && TAB_PAGES.has(lastActiveTab)) {
        showTab(lastActiveTab);
      }
    }
    
    return true;
  }

  // close single dynamic view (with animation)
  function closeSingleDynamicView(viewEl) {
    if (!viewEl || !viewEl.classList.contains('dynamic-view')) return;
    
    const body = document.body;
    const viewPath = viewEl.dataset.path || '';

    // restore previous dynamic view to original position if exists
    const remainingDynamicViews = qsa('.dynamic-view.active');
    const currentIndex = remainingDynamicViews.indexOf(viewEl);
    if (currentIndex > 0) {
      const prevView = remainingDynamicViews[currentIndex - 1];
      setDynamicInnerShift(prevView, false);
    }

    viewEl.dataset.closing = '1';
    viewEl.classList.add('closing');

    const onEnd = (e) => {
      if (e.target !== viewEl) return;
      viewEl.removeEventListener('transitionend', onEnd);
      delete viewEl.dataset.closing;
      viewEl.classList.remove('closing');
      removeDynamicViewStyles(viewPath);
      try { viewEl.remove(); } catch (_) {}

      // restore body to original position when all dynamic views are closed
      const remainingDynamicViewsAfter = qsa('.dynamic-view.active');
      if (remainingDynamicViewsAfter.length === 0 && body && MOBILE_MODE) {
        if (usesChromeScaleForDynamicView()) {
          body.classList.remove('dynamic-active-scale');
          body.classList.add('dynamic-inactive-scale');
        } else if (usesChromeSlideForDynamicView()) {
          body.classList.remove('dynamic-active');
          body.classList.add('dynamic-inactive');
          const appbarEl = qs('.appbar');
          const tabbarEl = qs('.tabbar');
          if (appbarEl) {
            appbarEl.classList.remove('dynamic-active');
            appbarEl.classList.add('dynamic-inactive');
          }
          if (tabbarEl) {
            tabbarEl.classList.remove('dynamic-active');
            tabbarEl.classList.add('dynamic-inactive');
          }
        }
      }
      
      updateDynamicBackdropVisibility();
      ensureDynamicSlot(1);
      
      // restore to previous tab when all dynamic views are closed
      const remainingViews = qsa('.dynamic-view.active');
      if (remainingViews.length === 0) {
        // restore tabbar with upward animation (both Android/iOS)
        const tabbar = qs('#tabbar');
        if (tabbar && MOBILE_MODE) {
          requestAnimationFrame(() => {
            tabbar.classList.remove('tabbar-hide');
            tabbar.classList.add('tabbar-show');
          });
        }
        
        if (lastActiveTab && TAB_PAGES.has(lastActiveTab)) {
          showTab(lastActiveTab);
        }
      }
    };
    
    viewEl.addEventListener('transitionend', onEnd);
    // eslint-disable-next-line no-unused-expressions
    viewEl.getBoundingClientRect();
    showDynamicBackdrop();
    updateDynamicBackdropVisibility();
  }

  // immediately remove all dynamic views (no animation)
  function closeAllDynamicViewsInstant() {
    const all = qsa('.dynamic-view');
    const views = qs('#views');
    const appbar = qs('.appbar');
    const body = document.body;

    all.forEach(v => {
      removeDynamicViewStyles(v.dataset.path || '');
      try { v.remove(); } catch (_) {}
    });
    
    // restore body to original position
    if (body && MOBILE_MODE) {
      if (usesChromeScaleForDynamicView()) {
        body.classList.remove('dynamic-active-scale');
        body.classList.add('dynamic-inactive-scale');
      } else if (usesChromeSlideForDynamicView()) {
        body.classList.remove('dynamic-active');
        body.classList.add('dynamic-inactive');
        const appbarEl = qs('.appbar');
        const tabbarEl = qs('.tabbar');
        if (appbarEl) {
          appbarEl.classList.remove('dynamic-active');
          appbarEl.classList.add('dynamic-inactive');
        }
        if (tabbarEl) {
          tabbarEl.classList.remove('dynamic-active');
          tabbarEl.classList.add('dynamic-inactive');
        }
      }
    }
    
    updateDynamicBackdropVisibility();
    ensureDynamicSlot(1);
    
    // restore to previous tab when all dynamic views are closed
    // restore tabbar with upward animation (both Android/iOS)
    const tabbar = qs('#tabbar');
    if (tabbar && MOBILE_MODE) {
      requestAnimationFrame(() => {
        tabbar.classList.remove('tabbar-hide');
        tabbar.classList.add('tabbar-show');
      });
    }
    
    if (lastActiveTab && TAB_PAGES.has(lastActiveTab)) {
      showTab(lastActiveTab);
    }
  }
  // create missing empty slots at the end (data-used="0")
  function ensureDynamicSlot(n = 1) {
    const views = qs('#views');
    if (!views) return;
    const empties = qsa('.dynamic-view:not([data-used="1"])', views);
    let need = Math.max(0, n - empties.length);
    while (need-- > 0) {
      const mv = document.createElement('main');
      mv.className = 'view dynamic-view';
      
      // add device-specific animation class
      if (getShellDeviceType() === 'android') {
        mv.classList.add(`android-animation-${ANDROID_ANIMATION_TYPE}`);
      } else if (getShellDeviceType() === 'ios') {
        mv.classList.add(`ios-animation-${IOS_ANIMATION_TYPE}`);
      }
      
      mv.dataset.used = '0';           // no content yet
      mv.dataset.filledBefore = '0';   // first fill flag (title exception)

      // app header for dynamic view (overlay internal only)
      if (appConfig.appbarView !== false) {
        const header = document.createElement('header');
        header.className = 'appbar appheader';
        header.innerHTML = `
          <button class="btn-dv-back" aria-label="back" onclick="(window.goBackWithAnimation ? window.goBackWithAnimation() : history.back())">←</button>
          <div class="title dv-title"></div>
        `;
        const backBtn = header.querySelector('.btn-dv-back');
        backBtn?.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          // check if there is currently active dynamic view
          const currentActive = qs('.dynamic-view.active');
          if (!currentActive) return;

          // use history.back() if history exists
          if (history.length > 1) {
            window.__programmaticBack = true;
            history.back();
          } else {
            // close only current dynamic view if no history
            closeSingleDynamicView(mv);
          }
        });

        // replace if theme component has dynamic view header
        (async () => {
          if (!THEME_BASE) return;
          try {
            const url = new URL('wakit-components/appheader.html', THEME_BASE).href;
            const res = await fetch(url, { credentials: 'same-origin' });
            if (res.ok) {
              const html = await res.text();
              if (html && html.trim()) header.innerHTML = html;
            }
          } catch (_) { /* noop */ }
        })();

        mv.appendChild(header);
      }

      const page = document.createElement('div');
      page.className = 'page';
      mv.appendChild(page);
      views.appendChild(mv);
    }
  }

  // return value +2 larger than top dynamic view z-index to stack new dynamic view on top
  function getNextDynamicZ() {
    const maxDynZ = getMaxDynamicViewZIndex();
    const base = DYNAMIC_BASE_Z - 1;
    return Math.max(base, maxDynZ) + 1;
  }
  // return first empty slot (create and return one if none exists)
  function getEmptyDynamicView() {
    ensureDynamicSlot(1);
    const views = qs('#views');
    return qs('.dynamic-view:not([data-used="1"])', views);
  }
  // remove based on LRU if dynamic views become too many
  function pruneDynamicViews() {
    const list = [...qsa('.dynamic-view')];
    if (list.length <= MAX_DYNAMIC_VIEWS) return;
    // LRU by ts in dynMeta, ignore .active
    const inactive = list.filter(v => !v.classList.contains('active'));
    inactive.sort((a, b) => (dynMeta.get(a)?.ts || 0) - (dynMeta.get(b)?.ts || 0));
    const removeCount = Math.max(0, list.length - MAX_DYNAMIC_VIEWS);
    inactive.slice(0, removeCount).forEach(v => {
      removeDynamicViewStyles(v.dataset.path || '');
      try { v.remove(); } catch (_) {}
    });
  }

  // ---- init ----
  async function initApp(configPath = './wakitConfig.json') {
    appConfig = await fetch(configPath).then(r => r.json());
    
    // load tabbar display mode setting
    TABBAR_DISPLAY_MODE = appConfig?.tabbar?.displayMode || appConfig?.tabbarDisplayMode || 'always';
    
    // apply adaptive memory settings
    try {
      const memCfg = appConfig?.memory || {};
      if (memCfg && typeof memCfg === 'object') {
        const maxViews = Number(memCfg.maxDynamicViews);
        if (!Number.isNaN(maxViews) && maxViews >= 2) {
          MAX_DYNAMIC_VIEWS = maxViews;
        }
      }
    } catch (_) { /* noop */ }
    
    // apply pull-to-refresh settings (optional)
    try {
      const ptrCfg = appConfig?.pullToRefresh || appConfig?.ptr || {};
      if (ptrCfg && typeof ptrCfg === 'object') {
        const t = Number(ptrCfg.threshold);
        const d = Number(ptrCfg.damping);
        const m = Number(ptrCfg.maxPull);
        const s = Number(ptrCfg.startSlop ?? ptrCfg.activationSlop);
        const r = Number(ptrCfg.directionLockRatio ?? ptrCfg.lockRatio);
        const ie = Number(ptrCfg.ignoreEdgeX ?? ptrCfg.edgeIgnoreX);
        if (!Number.isNaN(t) && t >= 0) PTR_STATE.threshold = t;
        if (!Number.isNaN(d) && d > 0 && d <= 1) PTR_DAMPING = d;
        if (!Number.isNaN(m) && m >= 40) PTR_MAX_PULL = m;
        if (!Number.isNaN(s) && s >= 0) PTR_START_SLOP = s;
        if (!Number.isNaN(r) && r >= 1) PTR_DIRECTION_LOCK_RATIO = r;
        if (!Number.isNaN(ie) && ie >= 0) PTR_IGNORE_EDGE_X = ie;
        if (Array.isArray(ptrCfg.disablePages)) PTR_DISABLE_PAGES = ptrCfg.disablePages.filter(p => typeof p === 'string' && p.trim());
      }
    } catch (_) { /* noop */ }
      // tabbar autohide setting (only applied when tabbar is displayed)
  try {
    const tcfg = appConfig?.tabbar || {};
    TABBAR_AUTOHIDE = shouldShowTabbar() && (appConfig?.tabbarAutoHide === true || tcfg.autoHide === true);
    const thr = Number(appConfig?.tabbarAutoHideThreshold ?? tcfg.hideThreshold);
    if (!Number.isNaN(thr) && thr >= 4) TABBAR_HIDE_THRESHOLD = thr;
  } catch (_) { /* noop */ }
  
  // load animation type settings
  try {
    const animCfg = appConfig?.animations || {};
    if (animCfg.android && typeof animCfg.android === 'string') {
      const a = String(animCfg.android).trim().toLowerCase();
      if (a === 'scale' || a === 'slide' || a === 'slide2') ANDROID_ANIMATION_TYPE = a;
    }
    if (animCfg.ios && typeof animCfg.ios === 'string') {
      IOS_ANIMATION_TYPE = animCfg.ios;
    }
  } catch (_) { /* noop */ }
    // calculate current theme root path (based on configPath)
    try {
      const abs = new URL(configPath, location.href);
      THEME_BASE = abs.href.replace(/[^/]*$/, ''); // remove filename → directory
    } catch (_) {
      THEME_BASE = location.href.replace(/[^/]*$/, '');
    }

    const forceMobile = appConfig?.theme?.isMobile === true;
    MOBILE_MODE = forceMobile || isMobileDevice();
    // appbarView: false → no-appbar class for CSS padding override
    document.documentElement.classList.toggle('no-appbar', appConfig.appbarView === false);
    // web + 비모바일(데스크톱 등)만 모바일 분기 강제; 실제 모바일이면 기존과 동일(always와 같은 MOBILE_MODE)
    if (TABBAR_DISPLAY_MODE === 'web' && !isMobileDevice()) MOBILE_MODE = true;

    // splash (mobile only by default, force display if appConfig.splashForce=true)
    const splashForce = appConfig?.splashForce === true;
    await showSplashIfAvailable(splashForce);

    applyTheme(appConfig.theme || {});
    applyBlogThemeSync();
    document.addEventListener('themechange', applyBlogThemeSync);
    renderAppShell();
    // complete async injection of theme components first to enable button/control binding
    await Promise.all([
      appConfig.appbarView !== false ? hydrateAppbarFromTheme() : Promise.resolve(),
      hydrateOffcanvasFromTheme(),
      // apply theme only when tabbar is displayed
      shouldShowTabbar() ? hydrateTabbarFromTheme() : Promise.resolve(),
    ]);

    initTabs(appConfig.tabs || []);
    initOffcanvas();
    // apply autohide only when tabbar is displayed
    if (shouldShowTabbar()) initTabbarAutoHide();

    await preloadTabPages();
    initRouter();

    if (MOBILE_MODE) initLinkInterceptor();
    if (MOBILE_MODE) initPullToRefresh();
    if (MOBILE_MODE) initOverlayCloseHandlers();
    if (MOBILE_MODE) initIosBackSwipeDetector();

    // Initialize popup library (auto-open via meta[data-popup] etc.) if available
    try {
      if (window.Popup && typeof window.Popup.init === 'function') {
        window.Popup.init();
      }
    } catch (_) { /* noop */ }

    // global: programmatic back navigation (maintain animation)
    window.goBackWithAnimation = function goBackWithAnimation() {
      try { 
        window.__programmaticBack = true; 
        
        // check if there is currently active dynamic view
        const currentActive = qs('.dynamic-view.active');
        if (currentActive) {
          // back navigation when dynamic view is active
          if (history.length > 1) {
            history.back();
          } else {
            // close only current dynamic view if no history
            closeSingleDynamicView(currentActive);
          }
        } else {
          // normal back navigation
          history.back();
        }
      } catch (_) {
        history.back();
      }
    };

    // schedule splash removal immediately after initial route display (consider both splashDelay and minimum display time)
    if (MOBILE_MODE) {
      const splashDelayMs = Math.max(0, Number(appConfig?.splashDelay ?? 200));
      scheduleHideSplash(splashDelayMs);
    }
  }

  // ---- animated switching ----
  function animateSwitch(prevView, nextView, direction = 'forward') {
    if (PREFERS_REDUCED_MOTION) { // no slide; just swap classes
      if (prevView && !prevView.classList.contains('dynamic-view')) prevView.classList.remove('active');
      nextView.classList.add('active');
      updateDynamicBackdropVisibility();
      updatePullToRefreshVisibility();
      return;
    }
    if (!nextView || prevView === nextView) return;

    // grant short-lived will-change to both views
    const wcOn = (el) => {
      if (!el) return;
      el.style.willChange = 'transform, opacity';
      setTimeout(() => {
        try { el.style.willChange = ''; } catch (_) {}
      }, 400);
    };
    wcOn(prevView);
    wcOn(nextView);

    const views = qs('#views');
    const appbar = qs('.appbar');
    const tabbar = qs('.tabbar');
    const body = document.body;

    // process previous view
    if (prevView) {
      const nextIsDynamic = nextView.classList.contains('dynamic-view');
      const prevIsDynamic = prevView.classList.contains('dynamic-view');

      if (!prevIsDynamic && nextIsDynamic) {
        // static/tab → dynamic: keep existing view (overlay), show backdrop immediately
        showDynamicBackdrop();
        if (body && MOBILE_MODE) {
          if (usesChromeScaleForDynamicView()) {
            body.classList.remove('dynamic-inactive');
            body.classList.add('dynamic-active-scale');
          } else if (usesChromeSlideForDynamicView()) {
            body.classList.remove('dynamic-inactive');
            body.classList.add('dynamic-active');
            const appbarEl = qs('.appbar');
            const tabbarEl = qs('.tabbar');
            if (appbarEl) {
              appbarEl.classList.remove('dynamic-inactive');
              appbarEl.classList.add('dynamic-active');
            }
            if (tabbarEl) {
              tabbarEl.classList.remove('dynamic-inactive');
              tabbarEl.classList.add('dynamic-active');
            }
          }
        }
      } else if (prevIsDynamic && nextIsDynamic) {
        // dynamic → dynamic: stack new dynamic view on top. previous dynamic remains active
        showDynamicBackdrop();
        if (!usesChromeScaleForDynamicView()) {
          setDynamicInnerShift(prevView, true);
        }
      } else if (prevIsDynamic && !nextIsDynamic) {
        // dynamic → static/tab: close top dynamic view (backdrop maintained during transition)
        prevView.dataset.closing = '1';
        prevView.classList.add('closing');
        const onPrevDynEnd = (e) => {
          if (e.target !== prevView) return;
          prevView.removeEventListener('transitionend', onPrevDynEnd);
          delete prevView.dataset.closing;
          prevView.classList.remove('closing');
          prevView.classList.remove('active');
          updateDynamicBackdropVisibility();
          if (body && MOBILE_MODE) {
            if (usesChromeScaleForDynamicView()) {
              body.classList.remove('dynamic-active-scale');
              body.classList.add('dynamic-inactive-scale');
            } else if (usesChromeSlideForDynamicView()) {
              body.classList.remove('dynamic-active');
              body.classList.add('dynamic-inactive');
              const appbarEl = qs('.appbar');
              const tabbarEl = qs('.tabbar');
              if (appbarEl) {
                appbarEl.classList.remove('dynamic-active');
                appbarEl.classList.add('dynamic-inactive');
              }
              if (tabbarEl) {
                tabbarEl.classList.remove('dynamic-active');
                tabbarEl.classList.add('dynamic-inactive');
                if (MOBILE_MODE) {
                  requestAnimationFrame(() => {
                    tabbarEl.classList.remove('tabbar-hide');
                    tabbarEl.classList.add('tabbar-show');
                  });
                }
              }
            }
          }
        };
        prevView.addEventListener('transitionend', onPrevDynEnd);
        // eslint-disable-next-line no-unused-expressions
        prevView.getBoundingClientRect();
        // maintain active + out transition with closing class
        showDynamicBackdrop();
        updateDynamicBackdropVisibility();
      } else {
        // static/tab ↔ static/tab transition: deactivate previous view
        prevView.classList.remove('active');
        updatePullToRefreshVisibility();
        const onPrevEnd = (e) => {
          if (e.target !== prevView) return;
          prevView.removeEventListener('transitionend', onPrevEnd);
        };
        prevView.addEventListener('transitionend', onPrevEnd);
      }
    }

    // process next view
    if (nextView.classList.contains('dynamic-view')) {
      // dynamic view is 100%→0 slide (no class needed)
      nextView.classList.add('active');
      updatePullToRefreshVisibility();
      showDynamicBackdrop();
      // newly activated dynamic view: restore internal elements to original position
      setDynamicInnerShift(nextView, false);
      if (body && MOBILE_MODE) {
        if (usesChromeScaleForDynamicView()) {
          body.classList.remove('dynamic-inactive');
          body.classList.add('dynamic-active-scale');
        } else if (usesChromeSlideForDynamicView()) {
          body.classList.remove('dynamic-inactive');
          body.classList.add('dynamic-active');
          const appbarEl = qs('.appbar');
          const tabbarEl = qs('.tabbar');
          if (appbarEl) {
            appbarEl.classList.remove('dynamic-inactive');
            appbarEl.classList.add('dynamic-active');
          }
          if (tabbarEl) {
            tabbarEl.classList.remove('dynamic-inactive');
            tabbarEl.classList.add('dynamic-active');
          }
        }
      }
    } else {
      // tab/static view direction animation
      //const inClass = direction === 'forward' ? 'anim-in-left' : 'anim-in-right';
      nextView.classList.add('active');
      updatePullToRefreshVisibility();
      //nextView.classList.add(inClass);
      // remove inClass after forced reflow → transition offset → 0
      // eslint-disable-next-line no-unused-expressions
      nextView.getBoundingClientRect();
      // nextView.classList.remove('anim-in-left', 'anim-in-right');
    }

    lastActiveView = nextView;
    updateDynamicBackdropVisibility();
  }

  // ---- theme ----
  const BLOG_THEME_STORAGE_KEY = 'blog-theme';
  const THEME_ATTRIBUTE = 'data-theme';

  function getActualBlogTheme() {
    try {
      const stored = localStorage.getItem(BLOG_THEME_STORAGE_KEY);
      if (stored === 'dark') return 'dark';
      if (stored === 'light') return 'light';
      if (stored === 'system') {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
        return 'light';
      }
    } catch (_) { /* noop */ }
    return 'light';
  }

  /** 웹 템플릿과 동일한 다크/라이트 모드 동기화 (Wakit 셸 + 뷰 콘텐츠) */
  function applyBlogThemeSync() {
    const actual = getActualBlogTheme();
    if (actual === 'dark') {
      document.documentElement.setAttribute(THEME_ATTRIBUTE, 'dark');
    } else {
      document.documentElement.removeAttribute(THEME_ATTRIBUTE);
    }
  }

  function applyTheme(theme) {
    if (theme.primaryColor) setVar('--primary-color', theme.primaryColor);
    if (theme.bg) setVar('--bg', theme.bg);
    if (theme.text) setVar('--text', theme.text);
    if (theme.font) document.documentElement.style.fontFamily = theme.font;
  }

  // ---- device detection ----
  function getDeviceType() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    // Android
    if (/android/i.test(ua)) return 'android';
    // iOS (iPhone/iPod) or iPadOS (including UA spoofing cases)
    const isiOS = /iPad|iPhone|iPod|iOS/i.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isiOS) return 'ios';
    return 'desktop';
  }

  /**
   * 앱 셸 UI용 기기 구분 (다이나믹 뷰 애니 클래스, html ios/android, 슬라이드/스케일 크롬, 탭바 인터랙션).
   * `web` + 실제 모바일: getDeviceType()과 동일(always와 동일).
   * `web` + 비모바일: UA 무시하고 애니 설정으로 셸 페르소나만 정함.
   */
  function getShellDeviceType() {
    if (TABBAR_DISPLAY_MODE !== 'web') return getDeviceType();
    if (isMobileDevice()) return getDeviceType();
    if (ANDROID_ANIMATION_TYPE === 'slide2') return 'android';
    if (IOS_ANIMATION_TYPE === 'scale') return 'ios';
    return 'ios';
  }

  function triggerHapticFeedback(duration = 10) {
    const ms = Math.max(1, Number(duration) || 10);

    try {
      if (navigator.vibrate && navigator.vibrate(ms)) {
        return true;
      }
    } catch (_) {
      // noop
    }

    try {
      const androidBridge = window.AndroidBridge;
      if (androidBridge && typeof androidBridge.vibrate === 'function') {
        androidBridge.vibrate(ms);
        return true;
      }
    } catch (_) {
      // noop
    }

    try {
      const nativeBridge = window.NativeBridge || window.webkit?.messageHandlers;
      const candidates = ['vibrate', 'hapticFeedback', 'triggerHapticFeedback'];
      for (const name of candidates) {
        const target = nativeBridge && nativeBridge[name];
        if (!target) continue;

        if (typeof target === 'function') {
          target(ms);
          return true;
        }

        if (typeof target.postMessage === 'function') {
          try {
            target.postMessage(ms);
          } catch (_) {
            target.postMessage({ duration: ms, type: 'vibrate' });
          }
          return true;
        }
      }
    } catch (_) {
      // noop
    }

    return false;
  }

  /** iOS(slide) / Android(slide2): 바디·앱바·탭바 좌측 이동 + 다이나믹 뷰 가로 슬라이드 */
  function usesChromeSlideForDynamicView() {
    if (!MOBILE_MODE) return false;
    const d = getShellDeviceType();
    if (d === 'ios' && IOS_ANIMATION_TYPE === 'slide') return true;
    if (d === 'android' && ANDROID_ANIMATION_TYPE === 'slide2') return true;
    return false;
  }
  function usesChromeScaleForDynamicView() {
    return MOBILE_MODE && getShellDeviceType() === 'ios' && IOS_ANIMATION_TYPE === 'scale';
  }
  
  // add PWA mode detection function
  function isPwaMode() {
    // 1. check iOS Safari standalone mode
    if (window.navigator && 'standalone' in window.navigator) {
      return window.navigator.standalone === true;
    }
    
    // 2. check display-mode: standalone (set in web manifest)
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }
    
    // 3. check display-mode: fullscreen (set in web manifest)
    if (window.matchMedia && window.matchMedia('(display-mode: fullscreen)').matches) {
      return true;
    }
    
    // 4. check display-mode: minimal-ui (Android Chrome PWA)
    if (window.matchMedia && window.matchMedia('(display-mode: minimal-ui)').matches) {
      return true;
    }
    
    return false;
  }

  /** 'pwa'일 때만 — 모바일 일반 브라우저(비 PWA)면 스플래시·온보딩 등 앱 셸 생략 */
  function shouldSkipAppChromeUnlessPwa() {
    return TABBAR_DISPLAY_MODE === 'pwa' && !isPwaMode();
  }
  
  // function to determine whether to show tabbar
  function shouldShowTabbar() {
    if (!MOBILE_MODE) return true; // desktop (web 아닐 때만): 항상 탭바로 간주
    if (TABBAR_DISPLAY_MODE === 'pwa') return isPwaMode();
    return true; // 'always' | 'web' | default: 모바일 분기에서 탭바 표시
  }
  
  function isIosWebView() {
    const ua = navigator.userAgent || '';
    const isiOS = /iPhone|iPad|iPod|iOS/i.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
    const isStandalone = (window.navigator && 'standalone' in window.navigator) ? window.navigator.standalone === true : false;
    return isiOS && !isSafari && !isStandalone;
  }
  function isMobileDevice() {
    const t = getDeviceType();
    return t === 'android' || t === 'ios';
  }

  // detect iOS Safari left edge swipe gesture (simple heuristic)
  function initIosBackSwipeDetector() {
    if (getDeviceType() !== 'ios') return;
  
    const start = (e) => {
      const x = (e.touches ? e.touches[0].clientX : e.clientX) || 0;
      // if starts within 30px of left edge, assume 'native swipe back'
      if (x <= 30) {
        IOS_EDGE_SWIPE_AT = Date.now();
        setBackdropSuppressed(true);
        setGestureAnimSuppressed(true); // add html.no-gesture-anim → CSS turns off transition
        
        // immediately hide tabbar when swipe back starts (both Android/iOS)
        const tabbar = qs('#tabbar');
        if (tabbar && MOBILE_MODE) {
          tabbar.classList.add('tabbar-hide');
          tabbar.classList.remove('tabbar-show');
        }
  
        // auto-release in case popstate doesn't come soon (gesture cancellation, etc.)
        clearTimeout(SWIPE_SUPPRESS_TIMER);
        SWIPE_SUPPRESS_TIMER = setTimeout(() => {
          setBackdropSuppressed(false);
          setGestureAnimSuppressed(false);
        // restore tabbar when swipe back is cancelled (both Android/iOS)
        if (tabbar && MOBILE_MODE) {
          tabbar.classList.remove('tabbar-hide');
          tabbar.classList.add('tabbar-show');
        }
        }, 900);
      }
    };
  
    const end = () => {
      // release suppression if touch ended but no history change
      clearTimeout(SWIPE_SUPPRESS_TIMER);
      SWIPE_SUPPRESS_TIMER = setTimeout(() => {
        setBackdropSuppressed(false);
        setGestureAnimSuppressed(false);
        // restore tabbar when swipe back is cancelled (both Android/iOS)
        const tabbar = qs('#tabbar');
        if (tabbar && MOBILE_MODE) {
          tabbar.classList.remove('tabbar-hide');
          tabbar.classList.add('tabbar-show');
        }
      }, 50);
    };
  
    // catch first in capture phase (passive:true ensures touch performance)
    document.addEventListener('touchstart', start, { passive: true, capture: true });
    document.addEventListener('pointerdown', start, { passive: true, capture: true });
    document.addEventListener('touchend', end, { passive: true, capture: true });
    document.addEventListener('pointerup', end, { passive: true, capture: true });
  
    // immediately release if actual back navigation occurs (popstate)
    window.addEventListener('popstate', () => {
      clearTimeout(SWIPE_SUPPRESS_TIMER);
      setBackdropSuppressed(false);
      setGestureAnimSuppressed(false);
      // tabbar restoration on actual back navigation is handled in onHashChange
    }, { capture: true });
  }

  // ---- shell ----
  function renderAppShell() {
    const root = qs('#root') || document.body;

    // appbar only in mobile mode (web이면 MOBILE_MODE 강제됨)
    if (MOBILE_MODE && !qs('.appbar', root) && appConfig.appbarView !== false) {
      root.insertAdjacentHTML(
        'afterbegin',
        `
        <header class="appbar">
          <button id="btn-menu-left" aria-label="open left menu">☰</button>
          <div class="title" id="appbar-title">App</div>
          <button id="btn-menu-right" aria-label="open right menu">☰</button>
        </header>
      `
      );
    }

    // tab container
    if (!qs('#views', root)) {
      root.insertAdjacentHTML('beforeend', `<section class="views" id="views"></section>`);
    }
    const views = qs('#views');

    // create views for each tab (pre-render slots)
    (appConfig.tabs || []).forEach(t => {
      if (!qs(`#${CSS.escape(viewIdOf(t.page))}`, views)) {
        views.insertAdjacentHTML(
          'beforeend',
          `
          <main class="view" id="${viewIdOf(t.page)}" aria-labelledby="tab-${t.id}">
            <div class="page" id="${appIdOf(t.page)}"></div>
          </main>
        `
        );
      }
    });

    // always create tabbar in mobile mode (show/hide controlled by CSS); web이면 MOBILE_MODE 강제
    if (MOBILE_MODE && shouldShowTabbar() && !qs('.tabbar', root)) {
      root.insertAdjacentHTML('beforeend', `<nav class="tabbar" id="tabbar"></nav>`);
    }

    // offcanvas is common (left/right support)
    if (!qs('#offcanvas-right', root)) {
      root.insertAdjacentHTML(
        'beforeend',
        `
        <div class="offcanvas right" id="offcanvas-right">
          <div style="padding:16px">
            <h3>Right Menu</h3>
            <p>Put extra menu items here.</p>
          </div>
        </div>
        <div class="offcanvas-backdrop" id="offcanvas-backdrop"></div>
      `
      );
    }
    if (!qs('#offcanvas-left', root)) {
      root.insertAdjacentHTML(
        'beforeend',
        `
        <div class="offcanvas left" id="offcanvas-left">
          <div style="padding:16px">
            <h3>Left Menu</h3>
            <p>Additional items here.</p>
          </div>
        </div>
      `
      );
    }

    // mode/device classes (for CSS branching)
    const rootEl = document.documentElement;
    rootEl.classList.toggle('mobile-mode', MOBILE_MODE);
    rootEl.classList.toggle('desktop-mode', !MOBILE_MODE);
    // add PWA mode class
    rootEl.classList.toggle('pwa-mode', isPwaMode());
    // add tabbar display mode class
    rootEl.classList.toggle('tabbar-always', TABBAR_DISPLAY_MODE === 'always');
    rootEl.classList.toggle('tabbar-pwa-only', TABBAR_DISPLAY_MODE === 'pwa');
    rootEl.classList.toggle('tabbar-web-only', TABBAR_DISPLAY_MODE === 'web');
    // add android/ios class if mobile
    rootEl.classList.remove('android', 'ios');
    const deviceType = getShellDeviceType();
    if (MOBILE_MODE && (deviceType === 'android' || deviceType === 'ios')) {
      rootEl.classList.add(deviceType);
    }
    
    // set initial classes on body for iOS mobile
    if (MOBILE_MODE && deviceType === 'ios') {
      document.body.classList.add('dynamic-inactive');
      const appbarEl = qs('.appbar');
      const tabbarEl = qs('.tabbar');
      if (appbarEl) appbarEl.classList.add('dynamic-inactive');
      if (tabbarEl) tabbarEl.classList.add('dynamic-inactive');
    }
    if (MOBILE_MODE && deviceType === 'android' && ANDROID_ANIMATION_TYPE === 'slide2') {
      document.body.classList.add('dynamic-inactive');
      const appbarEl = qs('.appbar');
      const tabbarEl = qs('.tabbar');
      if (appbarEl) appbarEl.classList.add('dynamic-inactive');
      if (tabbarEl) tabbarEl.classList.add('dynamic-inactive');
    }

    // ✅ for dynamic-view: always prepare 1 empty slot and backdrop
    ensureDynamicBackdrop();
    ensureDynamicSlot(1);
    updateDynamicBackdropVisibility();
    // ✅ prepare loading overlay for dynamic-view
    ensureDynamicLoadingOverlay();
    ensurePullToRefreshUI();

    // ✅ immediately activate default tab view in desktop mode
    if (!MOBILE_MODE) {
      const defaultTabPage = getDefaultTabPage();
      if (defaultTabPage) {
        qsa('.view', views).forEach(v => v.classList.toggle('active', v.id === viewIdOf(defaultTabPage)));
        lastTabIndex = Math.max(0, getTabIndex(defaultTabPage));
        lastActiveTab = defaultTabPage; // initial tab setting
        // toggle appbar brand on initial entry
        toggleAppbarBrandForPage(defaultTabPage);
      }
    }
  }

  // ---- offcanvas content hydrator (theme wakit-components) ----
  async function showSplashIfAvailable(force = false) {
    if (shouldSkipAppChromeUnlessPwa()) return;
    if (!MOBILE_MODE && !force) return;
    let html = '';
    if (THEME_BASE) {
      try {
        const url = new URL('wakit-components/splash.html', THEME_BASE).href;
        const res = await fetch(url, { credentials: 'same-origin' });
        if (res.ok) html = await res.text();
      } catch (_) { /* noop */ }
    }
    if (!html && !force) return;
    if (!html) {
      html = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#fff;z-index:10000"><div class="spinner" style="width:36px;height:36px;border-radius:50%;border:3px solid rgba(0,0,0,.15);border-top-color:rgba(0,0,0,.6);animation:spin .8s linear infinite"></div></div>';
    }
    let el = qs('#splash-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'splash-overlay';
      el.className = 'splash-overlay';
      document.body.appendChild(el);
    }
    el.innerHTML = html;
    // 애니메이션 없이 즉시 표시
    el.classList.add('show');
    SPLASH_SHOWN_AT = Date.now();
  }

  function hideSplash() {
    const el = qs('#splash-overlay');
    if (!el) return;
    el.classList.remove('show');
    el.classList.add('hide');
    // 애니메이션 없이 즉시 제거
    const removeLater = () => {
      try { el.remove(); } catch (_) {}
      // sequentially show onboarding/intro after splash (mobile only)
      if (MOBILE_MODE) {
        showOnboardingIfAvailable().then(shown => {
          if (!shown) {
            // try intro immediately if no onboarding
            showIntroIfAvailable();
          }
        }).catch(() => {
          showIntroIfAvailable();
        });
      }
    };
    // transitionend 대신 즉시 실행
    removeLater();
  }

  function scheduleHideSplash(desiredDelayMs) {
    const shownAt = SPLASH_SHOWN_AT || Date.now();
    const targetVisibleMs = Math.max(Number(desiredDelayMs || 0), SPLASH_MIN_MS);
    const elapsed = Date.now() - shownAt;
    const wait = Math.max(targetVisibleMs - elapsed, 0);
    setTimeout(hideSplash, wait);
  }

  async function hydrateAppbarFromTheme() {
    if (!MOBILE_MODE) return; // appbar is mobile only
    const appbar = qs('.appbar');
    if (!appbar || !THEME_BASE) return;
    try {
      const url = new URL('wakit-components/appbar.html', THEME_BASE).href;
      const res = await fetch(url, { credentials: 'same-origin' });
      if (!res.ok) return; // silently ignore
      const html = await res.text();
      if (html && html.trim()) {
        // completely replace existing appbar
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const newAppbar = tempDiv.firstElementChild;
        
        if (newAppbar) {
          // maintain existing appbar's classes and attributes
          newAppbar.className = appbar.className;
          newAppbar.id = appbar.id;
          
          // replace existing appbar with new one
          appbar.parentNode.replaceChild(newAppbar, appbar);
        }
      }
    } catch (_) { /* ignore missing appheader */ }
  }

  // ---- onboarding / intro overlays (mobile only) ----
  async function showOnboardingIfAvailable() {
    if (shouldSkipAppChromeUnlessPwa()) return false;
    
    if (!MOBILE_MODE || ONBOARDING_SHOWN) return false;
    // allow disabling via meta
    try { if (document.querySelector('meta[name="hybrid:disable-onboarding"]')) return false; } catch (_) { /* noop */ }
    let html = '';
    if (THEME_BASE) {
      try {
        const url = new URL('wakit-components/onboarding.html', THEME_BASE).href;
        const res = await fetch(url, { credentials: 'same-origin' });
        if (res.ok) html = await res.text();
      } catch (_) { /* ignore missing onboarding */ }
    }
    if (!html || !html.trim()) return false;
    let el = qs('#onboarding-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'onboarding-overlay';
      el.className = 'onboarding-overlay';
      document.body.appendChild(el);
    }
    el.innerHTML = html;
    requestAnimationFrame(() => el?.classList.add('show'));
    ONBOARDING_SHOWN = true;
    return true;
  }

  function hideOnboarding() {
    const el = qs('#onboarding-overlay');
    if (!el) return;
    el.classList.remove('show');
    el.classList.add('hide');
    const after = () => {
      try { el.remove(); } catch (_) {}
      // show intro if available after onboarding closes
      showIntroIfAvailable();
    };
    el.addEventListener('transitionend', after, { once: true });
    setTimeout(after, 800);
  }

  async function showIntroIfAvailable() {
    if (shouldSkipAppChromeUnlessPwa()) return false;
    
    if (!MOBILE_MODE || INTRO_SHOWN) return false;
    // allow disabling via meta
    try { if (document.querySelector('meta[name="hybrid:disable-intro"]')) return false; } catch (_) { /* noop */ }
    let html = '';
    if (THEME_BASE) {
      try {
        const url = new URL('wakit-components/intro.html', THEME_BASE).href;
        const res = await fetch(url, { credentials: 'same-origin' });
        if (res.ok) html = await res.text();
      } catch (_) { /* ignore missing intro */ }
    }
    if (!html || !html.trim()) return false;
    let el = qs('#intro-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'intro-overlay';
      el.className = 'intro-overlay';
      document.body.appendChild(el);
    }
    el.innerHTML = html;
    requestAnimationFrame(() => el?.classList.add('show'));
    INTRO_SHOWN = true;
    return true;
  }

  function hideIntro() {
    const el = qs('#intro-overlay');
    if (!el) return;
    el.classList.remove('show');
    el.classList.add('hide');
    const after = () => { try { el.remove(); } catch (_) {} };
    el.addEventListener('transitionend', after, { once: true });
    setTimeout(after, 800);
  }

  function initOverlayCloseHandlers() {
    document.addEventListener('click', e => {
      const t = e.target;
      if (!t) return;
      const closeOnb = t.closest('[data-close-onboarding], .onboarding-close');
      if (closeOnb) { e.preventDefault(); hideOnboarding(); return; }
      const closeIntro = t.closest('[data-close-intro], .intro-close');
      if (closeIntro) { e.preventDefault(); hideIntro(); return; }
    });
    // global API
    window.hideOnboarding = hideOnb
    ;
    function hideOnb(){ hideOnboarding(); }
    window.hideIntro = hideIntro;
  }

  async function hydrateOffcanvasFromTheme() {
    const left = qs('#offcanvas-left');
    const right = qs('#offcanvas-right');
    if (!THEME_BASE) return;

    const tryLoad = async (url) => {
      try {
        const res = await fetch(url, { credentials: 'same-origin' });
        if (!res.ok) return null;
        return await res.text();
      } catch (_) {
        return null;
      }
    };

    if (left) {
      const leftUrl = new URL('wakit-components/offcanvas-left.html', THEME_BASE).href;
      const html = await tryLoad(leftUrl);
      if (typeof html === 'string' && html.trim()) {
        left.innerHTML = html;
      }
    }
    if (right) {
      const rightUrl = new URL('wakit-components/offcanvas-right.html', THEME_BASE).href;
      const html = await tryLoad(rightUrl);
      if (typeof html === 'string' && html.trim()) {
        right.innerHTML = html;
      }
    }
  }

  async function hydrateTabbarFromTheme() {
    // apply theme only when tabbar is displayed
    if (!shouldShowTabbar()) return;
    const tabbar = qs('#tabbar');
    if (!tabbar || !THEME_BASE) return;
    try {
      const url = new URL('wakit-components/tabbar.html', THEME_BASE).href;
      // catch fetch errors (network errors, 404, etc.) and return null
      const res = await fetch(url, { credentials: 'same-origin' }).catch(() => null);
      
      if (!res || !res.ok) return; // silently ignore if fetch failed or response not ok
      const html = await res.text();
      if (html && html.trim()) {
        // completely replace existing appbar
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const newTabbar = tempDiv.firstElementChild;
        
        if (newTabbar) {
          // maintain existing appbar's classes and attributes
          newTabbar.className = tabbar.className;
          newTabbar.id = tabbar.id;
          
          // replace existing appbar with new one
          tabbar.parentNode.replaceChild(newTabbar, tabbar);
          
          // restore current active tab's icon state after theme load
          const currentActiveTab = qs('.view.active:not(.dynamic-view)');
          if (currentActiveTab) {
            const currentTab = (appConfig.tabs || []).find(t => viewIdOf(t.page) === currentActiveTab.id)?.page;
            if (currentTab) {
              activateTab(currentTab);
            }
          }
        }
      }

    } catch (_) { /* noop - silently ignore all errors including network errors */ }
  }

  // ---- tabs + dormancy ----
  function isDormancyExcluded(page) {
    const list = appConfig?.tabDormancy?.excludePages;
    return Array.isArray(list) && list.includes(page);
  }

  function markViewWarm(page) {
    const view = getViewByPage(page);
    if (!view) return;
    const mount = qs(`#${CSS.escape(appIdOf(page))}`);
    if (!mount) return;
    view.classList.add('dormant-warm');
    view.inert = true;
    mount.style.contentVisibility = 'hidden';
    mount.style.contain = 'content';
    mount.style.containIntrinsicSize = '1px 800px';
    
    // LRU: move page to end
    const idx = tabWarmQueue.indexOf(page);
    if (idx !== -1) tabWarmQueue.splice(idx, 1);
    tabWarmQueue.push(page);
    
    // Enforce warm limit → evict oldest to cold (skip excludePages)
    while (tabWarmQueue.length > TAB_WARM_LIMIT) {
      let evict = null;
      for (let i = 0; i < tabWarmQueue.length; i++) {
        if (!isDormancyExcluded(tabWarmQueue[i])) {
          evict = tabWarmQueue[i];
          tabWarmQueue.splice(i, 1);
          break;
        }
      }
      if (!evict) break;
      makeCold(evict);
    }
  }
  
  function makeCold(page) {
    if (isDormancyExcluded(page)) return;
    const view = getViewByPage(page);
    const mount = qs(`#${CSS.escape(appIdOf(page))}`);
    if (!view || !mount) return;
    // snapshot HTML, clear DOM
    if (!tabColdHTML.has(page)) tabColdHTML.set(page, mount.innerHTML || '');
    mount.innerHTML = '';
    // maintain loaded state to indicate tab is already loaded
    // mount.dataset.loaded = '0';
    view.classList.remove('dormant-warm');
    view.inert = false; // keep the outer shell only
  }
  
  async function reviveTab(page) {
    const view = getViewByPage(page);
    const mount = qs(`#${CSS.escape(appIdOf(page))}`);
    if (!view || !mount) return;
    // remove dormancy styles
    view.inert = false;
    view.classList.remove('dormant-warm');
    mount.style.contentVisibility = '';
    mount.style.contain = '';
    mount.style.containIntrinsicSize = '';
    
    if (mount.childElementCount === 0 && tabColdHTML.has(page)) {
      mount.innerHTML = tabColdHTML.get(page) || '';
      tabColdHTML.delete(page);
      // reapply scripts and styles so tab works properly
      processInlineStyles(mount);
      await executeInlineScripts(mount);
      // CommentsModule auto initialization (after script execution)
      await autoInitCommentsModule(mount);
    }
  }

  function initTabs(tabList) {
    const tabbar = qs('#tabbar');
    if (!tabbar) {
      document.documentElement.classList.add('no-tabbar');
      TAB_PAGES = new Set();
      return;
    }

    document.documentElement.classList.remove('no-tabbar');
    tabbar.style.display = '';
    if (!tabbar.hasChildNodes()) {
      tabbar.innerHTML = tabList
        .map(
          t => `
        <a id="tab-${t.id}" href="#${t.page}" data-id="${t.id}" aria-label="${t.label}">
          <div>${t.icon ? `<span class="icon">${t.icon}</span>` : ''}</div>
          <span>${t.label}</span>
        </a>
      `
        )
        .join('');
    }

    TAB_PAGES = new Set(tabList.map(t => t.page));

    // tab click → switch view only without hash update
    tabbar.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"], [data-tab]');
      if (!a) return;
      e.preventDefault();
      const href = a.getAttribute('href') || '';
      const page = (href.startsWith('#') ? href.slice(1) : '') || a.getAttribute('data-tab');

      // 탭 클릭 시 진동 피드백 (브라우저/PWA/네이티브 브릿지 공통)
      triggerHapticFeedback(10);

      // iOS 탭 클릭 시 아이콘 확대 애니메이션
      if (getShellDeviceType() === 'ios') {
        const iconEl = a.querySelector('.icon');
        if (iconEl) {
          // 기존 애니메이션 클래스 제거
          iconEl.classList.remove('tab-click-animate');
          // 리플로우 강제 (애니메이션 재시작)
          void iconEl.offsetWidth;
          // 애니메이션 클래스 추가
          iconEl.classList.add('tab-click-animate');
          // 애니메이션 종료 후 클래스 제거
          iconEl.addEventListener('animationend', function handler() {
            iconEl.classList.remove('tab-click-animate');
            iconEl.removeEventListener('animationend', handler);
          }, { once: true });
        }
      }

      // if same tab clicked again: smoothly scroll to top
      const currentActive = qs('.view.active');
      const currentPage = (currentActive && !currentActive.classList.contains('dynamic-view'))
        ? (appConfig.tabs || []).find(t => viewIdOf(t.page) === currentActive.id)?.page
        : null;
      if (currentPage && currentPage === page) {
        const viewsEl = qs('#views');
        if (viewsEl) viewsEl.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // iOS: 탭바 살짝 확대 후 원래 크기로 돌아가는 애니메이션
      if (getShellDeviceType() === 'ios') {
        tabbar.classList.remove('tabbar-active-pop');
        void tabbar.offsetWidth;
        tabbar.classList.add('tabbar-active-pop');
        tabbar.addEventListener('animationend', function handler() {
          tabbar.classList.remove('tabbar-active-pop');
          tabbar.removeEventListener('animationend', handler);
        }, { once: true });
      }

      showTab(page, { updateHash: false });
    });

    // iOS: drag the glass slider (active tab) to move/activate another tab
    initTabbarDrag(tabbar);

    // Chromium only: enable real liquid-glass refraction (SVG displacement on the backdrop)
    ensureLiquidGlassRefraction();

    // set current active tab's icon state after tabbar creation
    const currentActiveTab = qs('.view.active:not(.dynamic-view)');
    if (currentActiveTab) {
      const currentTab = tabList.find(t => viewIdOf(t.page) === currentActiveTab.id)?.page;
      if (currentTab) {
        activateTab(currentTab);
      }
    }
  }

  // Real liquid-glass refraction works only on Chromium (Blink): backdrop-filter with an
  // SVG feDisplacementMap. WebKit/iOS Safari can't do it, so we inject the filter and flip
  // on the .wakit-glass-refract gate ONLY when the engine is Chromium. iOS then keeps the
  // blur + specular glass as its fallback.
  function ensureLiquidGlassRefraction() {
    try {
      const uaData = navigator.userAgentData;
      const ua = navigator.userAgent || '';
      const isApple = /iPhone|iPad|iPod/i.test(ua) || /FxiOS|CriOS|EdgiOS/i.test(ua); // iOS는 모든 브라우저가 WebKit → 제외
      const isChromium = !isApple && (
        (uaData && Array.isArray(uaData.brands) && uaData.brands.some(b => /Chromium|Google Chrome/i.test(b.brand)))
        || (!!window.chrome && /\bChrome\//.test(ua))
      );
      if (!isChromium) return;
      document.documentElement.classList.add('wakit-glass-refract');
      if (document.getElementById('wakit-liquid-glass')) return;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('aria-hidden', 'true');
      svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
      svg.innerHTML =
        '<filter id="wakit-liquid-glass" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">'
        + '<feTurbulence type="fractalNoise" baseFrequency="0.010 0.014" numOctaves="2" seed="11" result="noise"/>'
        + '<feGaussianBlur in="noise" stdDeviation="1.2" result="smooth"/>'
        + '<feDisplacementMap in="SourceGraphic" in2="smooth" scale="16" xChannelSelector="R" yChannelSelector="G"/>'
        + '</filter>';
      (document.body || document.documentElement).appendChild(svg);
    } catch (_) { /* noop */ }
  }

  // iOS: grab the glass slider to drag it along with the finger; on release, snap to and activate the nearest tab
  function initTabbarDrag(tabbar) {
    if (!tabbar || getShellDeviceType() !== 'ios') return;
    if (tabbar.dataset.dragBound === '1') return;
    tabbar.dataset.dragBound = '1';

    const THRESHOLD = 6; // must move at least this far to count as a drag (vs a tap)
    let armed = false, dragging = false, suppressClick = false, lastHoverIdx = -1;
    let startX = 0, tabWidth = 0, maxX = 0, tabs = [];

    function measure() {
      tabs = qsa('a', tabbar);
      const n = tabs.length || 1;
      tabWidth = (tabbar.offsetWidth - 10) / n; // minus padding 5px*2
      maxX = (n - 1) * tabWidth;
    }
    const clamp = (v) => Math.max(0, Math.min(maxX, v));

    // While dragging, mark the tab the slider passes over as active in real time (incl. filled icon). The view switches only on release.
    function setActiveHighlight(idx) {
      tabs.forEach((a, i) => {
        const on = i === idx;
        a.classList.toggle('active', on);
        const iconSpan = a.querySelector('.icon span');
        if (!iconSpan) return;
        if (on) {
          const c = iconSpan.className;
          if (c.includes('fi-rr-')) {
            iconSpan.className = c.replace('fi-rr-', 'fi-sr-');
            iconSpan.setAttribute('data-original-class', c);
          }
        } else if (iconSpan.hasAttribute('data-original-class')) {
          iconSpan.className = iconSpan.getAttribute('data-original-class');
          iconSpan.removeAttribute('data-original-class');
        }
      });
    }

    tabbar.addEventListener('pointerdown', (e) => {
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return; // start from any tab (active or not)
      armed = true; dragging = false;
      startX = e.clientX;
      lastHoverIdx = -1;
      measure();
      // Pressing the active tab scales in place (press feedback); a non-active tab
      // scales once dragging starts, at the finger position.
      if (a.classList.contains('active')) tabbar.classList.add('tabbar-grab');
      try { tabbar.setPointerCapture(e.pointerId); } catch (_) { /* noop */ }
    });

    tabbar.addEventListener('pointermove', (e) => {
      if (!armed) return;
      if (!dragging && Math.abs(e.clientX - startX) < THRESHOLD) return;
      if (!dragging) {
        dragging = true;
        // start dragging: follow instantly + scale up (even when grabbed from a non-active tab)
        tabbar.classList.add('tabbar-dragging', 'tabbar-grab');
      }
      e.preventDefault();
      const rect = tabbar.getBoundingClientRect();
      const x = clamp((e.clientX - rect.left - 5) - tabWidth / 2);
      tabbar.style.setProperty('--glass-slider-x', `${x}px`);

      // highlight the tab the slider passes over in real time + a light haptic when crossing a tab
      const hoverIdx = Math.max(0, Math.min(tabs.length - 1, Math.round(x / tabWidth)));
      if (hoverIdx !== lastHoverIdx) {
        lastHoverIdx = hoverIdx;
        setActiveHighlight(hoverIdx);
        triggerHapticFeedback(5);
      }
    });

    function finish(e) {
      if (!armed) return;
      armed = false;
      try { tabbar.releasePointerCapture(e.pointerId); } catch (_) { /* noop */ }
      tabbar.classList.remove('tabbar-grab', 'tabbar-dragging'); // release → back to original size
      if (!dragging) return; // plain tap → leave it to the existing click handler
      dragging = false;

      const curX = parseFloat(getComputedStyle(tabbar).getPropertyValue('--glass-slider-x')) || 0;
      const idx = Math.max(0, Math.min(tabs.length - 1, Math.round(curX / tabWidth)));
      const target = tabs[idx];
      const page = target ? (target.getAttribute('href') || '').replace('#', '') : '';

      // suppress the click that fires right after a drag (already handled via showTab)
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 400);

      const currentActive = qs('.view.active:not(.dynamic-view)');
      const currentPage = currentActive
        ? (appConfig.tabs || []).find(t => viewIdOf(t.page) === currentActive.id)?.page
        : null;

      if (page && page !== currentPage) {
        triggerHapticFeedback(10);
        showTab(page, { updateHash: false }); // activate + switch view + snap slider
      } else {
        activateTab(currentPage || page); // released on the same tab → snap slider back into place
      }
    }
    tabbar.addEventListener('pointerup', finish);
    tabbar.addEventListener('pointercancel', finish);

    // ignore the click right after a drag ends (blocked in the capture phase)
    tabbar.addEventListener('click', (e) => {
      if (suppressClick) { suppressClick = false; e.stopPropagation(); e.preventDefault(); }
    }, true);
  }

  function activateTab(page) {
    const tabbar = qs('#tabbar');
    if (!tabbar) return;
    
    const tabs = qsa('a', tabbar);
    const tabCount = tabs.length;
    let activeIndex = -1;
    
    tabs.forEach((a, index) => {
      const target = a.getAttribute('href').replace('#', '');
      const isActive = target === page;
      a.classList.toggle('active', isActive);
      
      if (isActive) {
        activeIndex = index;
      }
      
      // handle icon change (fi-rr- → fi-sr-)
      if (isActive) {
        const iconSpan = a.querySelector('.icon span');
        if (iconSpan) {
          const currentClass = iconSpan.className;
          // change fi-rr- to fi-sr-
          if (currentClass.includes('fi-rr-')) {
            iconSpan.className = currentClass.replace('fi-rr-', 'fi-sr-');
            iconSpan.setAttribute('data-original-class', currentClass);
          }
        }
      } else {
        // restore inactive tab's icon to original
        const iconSpan = a.querySelector('.icon span');
        if (iconSpan && iconSpan.hasAttribute('data-original-class')) {
          iconSpan.className = iconSpan.getAttribute('data-original-class');
          iconSpan.removeAttribute('data-original-class');
        }
      }
    });
    
    // iOS 26 스타일: 글래스 배경 슬라이더 위치 업데이트
    if (getShellDeviceType() === 'ios' && activeIndex >= 0 && tabCount > 0) {
      // CSS 변수로 탭 개수 설정
      tabbar.style.setProperty('--tab-count', tabCount);
      
      // 탭바 내부 너비 계산 (padding 제외)
      const tabbarInnerWidth = tabbar.offsetWidth - 10; // padding: 5px * 2
      const tabWidth = tabbarInnerWidth / tabCount;
      const translateX = activeIndex * tabWidth;
      
      // ::before 요소의 위치 업데이트 (다음 프레임에서 실행하여 레이아웃 완료 후)
      requestAnimationFrame(() => {
        tabbar.style.setProperty('--glass-slider-x', `${translateX}px`);
      });
    }
  }

  function updateTitle(text) {
    const el = qs('#appbar-title');
    if (el) el.textContent = text;
    document.title = text;
  }

  // clearly update only the title of appheader inside dynamic view (저장해 두어 뒤로가기 시 복원에 사용)
  function setDynamicHeaderTitle(viewEl, text) {
    if (!viewEl || text == null) return;
    const s = String(text);
    if (viewEl.dataset) viewEl.dataset.dvTitle = s;
    const titleEl = viewEl.querySelector('.appbar.appheader .dv-title') || viewEl.querySelector('.dv-title') || viewEl.querySelector('.appheader .title');
    if (titleEl) titleEl.textContent = s;
  }

  // toggle left-right movement animation of header/page inside dynamic view
  function setDynamicInnerShift(viewEl, shifted) {
    try {
      if (!viewEl) return;
      const headerEl = viewEl.querySelector('.appbar.appheader');
      const pageEl = viewEl.querySelector('.page');
      if (headerEl) headerEl.classList.toggle('dv-shift-left', !!shifted);
      if (pageEl) pageEl.classList.toggle('dv-shift-left', !!shifted);
    } catch (_) { /* noop */ }
  }

  function showTab(page, { updateHash = false } = {}) {
    // save scroll position of current active tab (if not dynamic view)
    const viewsContainer = qs('#views');
    const currentActive = qs('.view.active');
    if (currentActive && !currentActive.classList.contains('dynamic-view')) {
      const currentTab = (appConfig.tabs || []).find(t => viewIdOf(t.page) === currentActive.id)?.page;
      if (currentTab && viewsContainer) {
        tabScrollPositions.set(currentTab, viewsContainer.scrollTop || 0);
        markViewWarm(currentTab);
      }
    }

    // revive target if cold/warm
    reviveTab(page);

    // 프로필 등 테마 토글이 있는 탭으로 돌아왔을 때 항상 테마 컨트롤 재바인딩
    try {
      if (window.ThemeToggle && typeof window.ThemeToggle.refresh === 'function') {
        window.ThemeToggle.refresh();
      }
    } catch (_) { /* noop */ }

    const nextView = getViewByPage(page);
    if (!nextView) return;
    
    // force load if tab is not loaded
    const mount = qs(`#${CSS.escape(appIdOf(page))}`);
    if (mount && mount.dataset.loaded !== '1' && mount.childElementCount === 0) {
      // immediately load if tab content is empty
      (async () => {
        await loadTabContent(page, mount);
      })();
    }

    const prevView = getTopActiveView();

    // determine direction: compare indices for tab-to-tab movement, default backward otherwise
    const nextIdx = getTabIndex(page);
    let direction = 'backward';
    if (prevView && prevView.id) {
      const prevTabPage = (appConfig.tabs || []).find(t => viewIdOf(t.page) === prevView.id)?.page;
      const prevIdx = typeof prevTabPage === 'string' ? getTabIndex(prevTabPage) : -1;
      if (prevIdx !== -1 && nextIdx !== -1) {
        direction = nextIdx > prevIdx ? 'forward' : 'backward';
      } else if (prevView.classList.contains('dynamic-view')) {
        direction = 'backward';
      }
    } else if (lastTabIndex !== -1 && nextIdx !== -1) {
      direction = nextIdx > lastTabIndex ? 'forward' : 'backward';
    }

    const body = document.body;
    if (body && MOBILE_MODE) {
      if (usesChromeScaleForDynamicView()) {
        body.classList.remove('dynamic-active-scale');
        body.classList.add('dynamic-inactive-scale');
      } else if (usesChromeSlideForDynamicView()) {
        body.classList.remove('dynamic-active');
        body.classList.add('dynamic-inactive');
        const appbarEl = qs('.appbar');
        const tabbarEl = qs('.tabbar');
        if (appbarEl) {
          appbarEl.classList.remove('dynamic-active');
          appbarEl.classList.add('dynamic-inactive');
        }
        if (tabbarEl) {
          tabbarEl.classList.remove('dynamic-active');
          tabbarEl.classList.add('dynamic-inactive');
        }
      }
    }

    // add tabbar animation when returning from dynamic view to tab (both Android/iOS)
    if (prevView && prevView.classList.contains('dynamic-view') && MOBILE_MODE) {
      const tabbar = qs('#tabbar');
      if (tabbar) {
        requestAnimationFrame(() => {
          tabbar.classList.remove('tabbar-hide');
          tabbar.classList.add('tabbar-show');
        });
      }
    }

    animateSwitch(prevView, nextView, direction === 'forward' ? 'forward' : 'backward');

    // maintain only one active in base views excluding dynamic views (switch behavior)
    qsa('.view:not(.dynamic-view)').forEach(v => {
      v.classList.toggle('active', v === nextView);
    });

    // handle tab active
    activateTab(page);
    // show brand only for main tab
    toggleAppbarBrandForPage(page);

    // synchronize title
    const route = (appConfig.routes || []).find(r => r.path === page);
    if (route?.title) {
      updateTitle(route.title);
    } else if (isDirectLoadablePath(page)) {
      // infer title when page is direct URL/HTML path
      const base = (String(page).split('/').pop() || '').replace(/\.html?$/i, '');
      const title = base.replace(/[-_]/g, ' ').trim() || 'App';
      updateTitle(title);
    }

    // (optional) hash update — currently not used in tab switching
    if (updateHash && location.hash.replace('#', '') !== page) {
      history.pushState(null, '', `#${page}`);
    }

    // restore saved scroll (top if none)
    if (viewsContainer) {
      const y = tabScrollPositions.get(page) || 0;
      viewsContainer.scrollTop = y;
    }

    lastTabIndex = nextIdx;
    lastActiveTab = page; // track last active tab
  }

  // ---- tab content loader ----
  async function loadTabContent(page, mount) {
    if (!mount || mount.dataset.loaded === '1') return;
    
    try {
      const route = (appConfig.routes || []).find(r => r.path === page);
      let url = '';
      
      if (route) {
        const f = route.file || '';
        url = isExternalUrl(f) ? `${f}${location.search || ''}` : `./views/${f}${location.search || ''}`;
      } else if (isDirectLoadablePath(page) || /\.html(?:\?.*)?$/i.test(String(page))) {
        const raw = String(page).replace(/^#/, '');
        if (isExternalUrl(raw)) {
          url = `${raw}${location.search || ''}`;
        } else {
          let pv = raw;
          if (!/^\.|\//.test(pv) && !/^views\//i.test(pv)) pv = `views/${pv}`;
          if (!pv.startsWith('./') && !pv.startsWith('/')) pv = `./${pv}`;
          url = `${pv}${location.search || ''}`;
        }
      } else {
        return;
      }
      
      if (!isAllowedHtmlFetch(url)) {
        mount.innerHTML = `<p style="color:#c00">Blocked cross-origin route: ${escapeHtml(url)}</p>`;
        mount.dataset.loaded = '1';
        return;
      }

      const html = await loadHTML(url);
      mount.innerHTML = extractBodyInnerHTML(html);
      processInlineStyles(mount);
      await hydrateIncludes(mount, MOBILE_MODE ? 'mobile' : 'web');
      await executeInlineScripts(mount);
      // CommentsModule auto initialization (after script execution)
      await autoInitCommentsModule(mount);
      mount.dataset.loaded = '1';
    } catch (err) {
      const fallback = page;
      mount.innerHTML = `<p style="color:#c00">Failed to load ${fallback}</p>`;
    }
  }

  // ---- preload tab pages ----
  async function preloadTabPages() {
    const routeMap = new Map((appConfig.routes || []).map(r => [r.path, r]));
    const defaultPage = getDefaultTabPage();
    
    for (const t of appConfig.tabs || []) {
      const mount = qs(`#${CSS.escape(appIdOf(t.page))}`);
      if (!mount || mount.dataset.loaded === '1') continue;
      const r = routeMap.get(t.page);
      // Only preload: default page, or tabs explicitly marked preload:true in config
      const shouldPreload = (t.preload === true) || (t.page === defaultPage);
      if (!shouldPreload) continue;
      try {
        let url = '';
        if (r) {
          // standard route file
          const f = r.file || '';
          url = isExternalUrl(f) ? `${f}${location.search || ''}` : `./views/${f}${location.search || ''}`;
        } else if (isDirectLoadablePath(t.page) || /\.html(?:\?.*)?$/i.test(String(t.page))) {
          // when tab's page value is direct URL/HTML path (extension-based also allowed)
          const raw = String(t.page).replace(/^#/, '');
          if (isExternalUrl(raw)) {
            url = `${raw}${location.search || ''}`;
          } else {
            let pv = raw;
            // try views/ correction if relative html, keep if path already exists
            if (!/^\.|\//.test(pv) && !/^views\//i.test(pv)) pv = `views/${pv}`;
            if (!pv.startsWith('./') && !pv.startsWith('/')) pv = `./${pv}`;
            url = `${pv}${location.search || ''}`;
          }
        } else {
          continue;
        }

        if (!isAllowedHtmlFetch(url)) {
          mount.innerHTML = `<p style="color:#c00">Blocked cross-origin route: ${escapeHtml(url)}</p>`;
          mount.dataset.loaded = '1';
          continue;
        }

        const html = await loadHTML(url);
        mount.innerHTML = extractBodyInnerHTML(html);
        processInlineStyles(mount);
        await hydrateIncludes(mount, MOBILE_MODE ? 'mobile' : 'web');
        await executeInlineScripts(mount);
        // CommentsModule auto initialization (after script execution)
        await autoInitCommentsModule(mount);
        mount.dataset.loaded = '1';
      } catch (err) {
        const fallback = r ? r.file : t.page;
        mount.innerHTML = `<p style="color:#c00">Failed to load ${fallback}</p>`;
      }
    }
  }

  // ---- non-tab route renderer (reuse empty slots, title exception on first fill, has backdrop) ----
  function renderNonTabRoute(path) {
    // Ensure main page is in history before navigating to dynamic view
    // This prevents blank screen on back navigation when app opens directly to a dynamic view
    const firstTab = getDefaultTabPage();
    const isInitialState = window.history.length === 1 || !window.history.state;
    const hasActiveBaseView = !!qs('.view.active:not(.dynamic-view)');
    
    if (isInitialState && !hasActiveBaseView && firstTab) {
      // Push main page to history first to ensure proper back navigation
      try {
        // Use replaceState for the first entry, then pushState for main page
        if (window.history.length === 1) {
          // Replace current empty state with main page
          history.replaceState({ page: firstTab, timestamp: Date.now() }, '', window.location.pathname + `#${firstTab}`);
        } else {
          // Push main page to history
          history.pushState({ page: firstTab, timestamp: Date.now() }, '', window.location.pathname + `#${firstTab}`);
        }
        
        // Show main tab first (without animation to avoid flicker)
        const mainTabView = qs(`#${CSS.escape(appIdOf(firstTab))}`);
        if (mainTabView) {
          // Activate main tab view silently
          qsa('.view:not(.dynamic-view)').forEach(v => {
            v.classList.toggle('active', v === mainTabView);
          });
          activateTab(firstTab);
          lastActiveTab = firstTab;
          
          // Ensure main tab content is loaded
          if (!mainTabView.dataset.loaded) {
            loadTabContent(firstTab, mainTabView).catch(() => {});
          }
        }
      } catch (e) {
        console.warn('Failed to initialize history with main page:', e);
      }
    }
    
    const route = (appConfig.routes || []).find(r => r.path === path);
    // fallback: also allow regular HTML paths, external URLs, or absolute paths (starting with /)
    const useFallbackFile = !route && (
      isDirectLoadablePath(path) || 
      path.startsWith('/') || 
      /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_/-]*$/.test(path)
    );
    if (!route && !useFallbackFile) return;

    // 0) if dynamic view with same path exists in existing stack, return to that view without reloading (back nav)
    const existing = findDynamicViewByPath(path);
    if (existing) {
      const prevTop = getTopActiveView();
      if (prevTop && prevTop !== existing) {
        // close top dynamic view and activate existing dynamic view
        if (prevTop.classList.contains('dynamic-view')) {
          const isIOS = getDeviceType() === 'ios';
          const isWV = isIosWebView();
          const swipingBack = isIOS && !isWV && (Date.now() - IOS_EDGE_SWIPE_AT) <= IOS_EDGE_SWIPE_WINDOW_MS;
          const programmatic = !!window.__programmaticBack;
          if (swipingBack && !programmatic) {
            try { prevTop.remove(); } catch (_) {}
            updateDynamicBackdropVisibility();
            ensureDynamicSlot(1);
            // return existing dynamic view to original position
            setDynamicInnerShift(existing, false);
          } else {
            prevTop.dataset.closing = '1';
            prevTop.classList.add('closing');
            const onEnd = (e) => {
              if (e.target !== prevTop) return;
              prevTop.removeEventListener('transitionend', onEnd);
              delete prevTop.dataset.closing;
              prevTop.classList.remove('closing');
              try { prevTop.remove(); } catch (_) {}
              updateDynamicBackdropVisibility();
              ensureDynamicSlot(1);
            };
            prevTop.addEventListener('transitionend', onEnd);
            // eslint-disable-next-line no-unused-expressions
            prevTop.getBoundingClientRect();
            showDynamicBackdrop();
            updateDynamicBackdropVisibility();
          }
        } else {
          // if prevTop is tab/static view: must maintain existing active state
          // only dynamic views are subject to deactivation
        }
        existing.classList.add('active');
        updatePullToRefreshVisibility();
        // return existing dynamic view to original position
        setDynamicInnerShift(existing, false);
        updateDynamicBackdropVisibility();
        // restore title: 이전에 페이지에서 설정한 타이틀(dvTitle) 우선, 없으면 route/경로 기반 fallback
        const storedTitle = existing.dataset.dvTitle;
        const title = (storedTitle && storedTitle.trim()) || route?.title || (() => {
          const p = existing.dataset.path || '';
          const base = (p.split('/').pop() || '').replace(/\.html?$/i, '');
          return base.replace(/[-_]/g, ' ').trim() || 'App';
        })();
        setDynamicHeaderTitle(existing, title);
        window.scrollTo(0, 0);
      }
      return;
    }

    // 1) secure empty slot
    const viewEl = getEmptyDynamicView();
    const pageDiv = qs('.page', viewEl);

    // 2) load content
    // separate: path (hash) and search (query)
    const [rawPath, rawQuery] = String(path).split('?');
    const fileUrl = useFallbackFile
      ? (() => {
          const qs = rawQuery ? `?${rawQuery}` : '';
          // use external URL as is
          if (isExternalUrl(rawPath)) return rawPath + qs;
          // combine absolute path (starting with /) with current origin
          let p = rawPath.replace(/^#/, '');
          if (p.startsWith('/')) {
            return `${location.origin}${p}${qs}`;
          }
          // convert internal path patterns (like board/free) to absolute paths
          if (/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_/-]*$/.test(p)) {
            return `${location.origin}/${p}${qs}`;
          }
          // local HTML path: keep ./, / if present, otherwise prefix ./
          if (!/^\.|\//.test(p)) p = `./${p}`;
          return p + qs;
        })()
      : (() => {
          const f = route?.file || '';
          if (isExternalUrl(f)) return `${f}${rawQuery ? `?${rawQuery}` : ''}`;
          return `./views/${f}${rawQuery ? `?${rawQuery}` : ''}`;
        })();

    // 3) set title first, then immediately open dynamic view to animate with backdrop
    const fallbackTitle = (() => {
      const base = fileUrl.split('/').pop() || '';
      return base.replace(/\.html?$/i, '').replace(/[-_]/g, ' ').trim() || 'App';
    })();
    viewEl.dataset.used = '1';
    viewEl.dataset.path = path;
    setDynamicHeaderTitle(viewEl, (route && route.title) || fallbackTitle);
    const prevView = getTopActiveView();
    viewEl.style.zIndex = String(getNextDynamicZ());
    
    // animate tabbar to bottom when creating dynamic-view (both Android/iOS)
    if (MOBILE_MODE) {
      const tabbar = qs('#tabbar');
      if (tabbar) {
        // add slight delay to make animation look natural
        requestAnimationFrame(() => {
          tabbar.classList.add('tabbar-hide');
          tabbar.classList.remove('tabbar-show');
        });
      }
    }
    
    // save current active tab (before moving to dynamic view)
    if (!prevView || !prevView.classList.contains('dynamic-view')) {
      const currentActive = qs('.view.active:not(.dynamic-view)');
      if (currentActive) {
        const currentTab = (appConfig.tabs || []).find(t => viewIdOf(t.page) === currentActive.id)?.page;
        if (currentTab) {
          lastActiveTab = currentTab;
        }
      }
    }
    
    // move internal elements to left if previous view is dynamic view
    if (prevView && prevView.classList.contains('dynamic-view')) {
      setDynamicInnerShift(prevView, true);
    }
    
    const body = document.body;
    if (body && MOBILE_MODE && usesChromeSlideForDynamicView()) {
      body.classList.remove('dynamic-inactive');
      body.classList.add('dynamic-active');
      const appbarEl = qs('.appbar');
      const tabbarEl = qs('.tabbar');
      if (appbarEl) {
        appbarEl.classList.remove('dynamic-inactive');
        appbarEl.classList.add('dynamic-active');
      }
      if (tabbarEl) {
        tabbarEl.classList.remove('dynamic-inactive');
        tabbarEl.classList.add('dynamic-active');
      }
    }
    
    animateSwitch(prevView, viewEl, 'forward');

    // 4) load content asynchronously
    if (!isAllowedHtmlFetch(fileUrl)) {
      pageDiv.innerHTML = `<p style="color:#c00">Blocked cross-origin route: ${escapeHtml(fileUrl)}</p>`;
      viewEl.dataset.filledBefore = '1';
      window.scrollTo(0, 0);
      ensureDynamicSlot(1);
      updateDynamicBackdropVisibility();
      return;
    }

    showDynamicLoading();
    loadHTML(fileUrl).then(async (html) => {
      // if hash changed and current path differs, close and remove opened dynamic view
      if (location.hash.replace(/^#/, '') !== path) {
        viewEl.dataset.closing = '1';
        viewEl.classList.add('closing');
        const onEnd = (e) => {
          if (e.target !== viewEl) return;
          viewEl.removeEventListener('transitionend', onEnd);
          delete viewEl.dataset.closing;
          viewEl.classList.remove('closing');
          removeDynamicViewStyles(path);
          try { viewEl.remove(); } catch (_) {}
          updateDynamicBackdropVisibility();
          ensureDynamicSlot(1);
        };
        viewEl.addEventListener('transitionend', onEnd);
        // eslint-disable-next-line no-unused-expressions
        viewEl.getBoundingClientRect();
        showDynamicBackdrop();
        updateDynamicBackdropVisibility();
        return;
      }

      pageDiv.innerHTML = extractBodyInnerHTML(html);
      processInlineStyles(pageDiv);
      await hydrateIncludes(pageDiv, MOBILE_MODE ? 'mobile' : 'web');
      await executeInlineScripts(pageDiv);
      // CommentsModule auto initialization (after script execution)
      await autoInitCommentsModule(pageDiv);
      viewEl.dataset.filledBefore = '1';
      // 다이나믹 뷰 appheader 타이틀: (1) 페이지 meta wakit:no-dv-title 시 아예 빈 문자열로 표시 안 함 (2) 테마 usePageTitle:false 시 fallback 유지 (3) 그 외 페이지 head title 표시
      const titleOpt = extractTitleAndOptionsFromHTML(html);
      const themeAllowsPageTitle = appConfig.theme?.dynamicView?.usePageTitle !== false;
      if (!titleOpt.usePageTitle) {
        setDynamicHeaderTitle(viewEl, '');
      } else if (themeAllowsPageTitle && titleOpt.title) {
        setDynamicHeaderTitle(viewEl, titleOpt.title);
      }
      window.scrollTo(0, 0);
      ensureDynamicSlot(1);
      dynMeta.set(viewEl, { ts: Date.now() });
      pruneDynamicViews();
    }).catch(() => {
      // ignore network errors here; could add UI later
    }).finally(() => {
      hideDynamicLoading();
    });
  }

  // ---- router (toggle if tab, otherwise fetch as dynamic view) ----
  function onHashChange() {
    const firstTab = getDefaultTabPage();
    const raw = location.hash.replace(/^#/, '');
    const hasActiveBaseView = !!qs('.view.active:not(.dynamic-view)');
    
    // priority when hash is empty: lastActiveTab > default tab
    let page = raw;
    if (!page) {
      if (lastActiveTab && TAB_PAGES.has(lastActiveTab)) {
        page = lastActiveTab;
      } else if (!hasActiveBaseView) {
        page = firstTab;
      }
    }

    const isTab = page ? TAB_PAGES.has(page) : false;

    if (!isTab) {
      // save current tab scroll just before non-tab movement
      const viewsContainer = qs('#views');
      const currentActive = qs('.view.active');
      if (currentActive && !currentActive.classList.contains('dynamic-view')) {
        const currentTab = (appConfig.tabs || []).find(t => viewIdOf(t.page) === currentActive.id)?.page;
        if (currentTab && viewsContainer) {
          tabScrollPositions.set(currentTab, viewsContainer.scrollTop || 0);
        }
      }
    }

    const isIOS = getDeviceType() === 'ios';
    const isWV = isIosWebView();
    const swipingBack = isIOS && !isWV && (Date.now() - IOS_EDGE_SWIPE_AT) <= IOS_EDGE_SWIPE_WINDOW_MS;
    const programmatic = !!window.__programmaticBack;

    // maintain backdrop hidden during swipe back
    if (swipingBack && !programmatic) {
      setBackdropSuppressed(true);
      setGestureAnimSuppressed(true);
    }

    if (page) {
      if (isTab) {
        // close dynamic view when returning to tab
        if (swipingBack && !programmatic) {
          closeAllDynamicViewsInstant();
        } else {
          closeAllDynamicViews();
        }
        
        // also restore appbar and tabbar to original position
        const appbar = qs('.appbar');
        const tabbar = qs('.tabbar');
        if (appbar) {
          appbar.classList.remove('dynamic-active');
          appbar.classList.add('dynamic-inactive');
        }
        if (tabbar) {
          tabbar.classList.remove('dynamic-active');
          tabbar.classList.add('dynamic-inactive');
          // restore tabbar with upward animation (both Android/iOS)
          if (MOBILE_MODE) {
            requestAnimationFrame(() => {
              tabbar.classList.remove('tabbar-hide');
              tabbar.classList.add('tabbar-show');
            });
          }
        }
        
        const body = document.body;
        if (body && MOBILE_MODE) {
          if (usesChromeScaleForDynamicView()) {
            body.classList.remove('dynamic-active-scale');
            body.classList.add('dynamic-inactive-scale');
          } else if (usesChromeSlideForDynamicView()) {
            body.classList.remove('dynamic-active');
            body.classList.add('dynamic-inactive');
          }
        }
        
        showTab(page);
      } else {
        // fill non-tab content in dynamic view slot
        // maintain brand in current active default tab state
        renderNonTabRoute(page);
      }
    } else {
      // if page is empty and default view already exists: close immediately if iOS gesture back (no animation)
      if (swipingBack && !programmatic) {
        closeTopDynamicInstant();
      } else {
        closeAllDynamicViews();
      }
      
      // restore views container to original position
      const viewsContainer = qs('#views');
      if (viewsContainer) {
        viewsContainer.classList.remove('dynamic-active');
        viewsContainer.classList.add('dynamic-inactive');
      }
      
      // also restore appbar and tabbar to original position
      const appbar = qs('.appbar');
      const tabbar = qs('.tabbar');
      if (appbar) {
        appbar.classList.remove('dynamic-active');
        appbar.classList.add('dynamic-inactive');
      }
      if (tabbar) {
        tabbar.classList.remove('dynamic-active');
        tabbar.classList.add('dynamic-inactive');
        // restore tabbar with upward animation (both Android/iOS)
        if (MOBILE_MODE) {
          requestAnimationFrame(() => {
            tabbar.classList.remove('tabbar-hide');
            tabbar.classList.add('tabbar-show');
          });
        }
      }
      
      const body = document.body;
      if (body && MOBILE_MODE) {
        if (usesChromeScaleForDynamicView()) {
          body.classList.remove('dynamic-active-scale');
          body.classList.add('dynamic-inactive-scale');
        } else if (usesChromeSlideForDynamicView()) {
          body.classList.remove('dynamic-active');
          body.classList.add('dynamic-inactive');
        }
      }
      
      // restore to previous tab after closing dynamic-view
      if (lastActiveTab && TAB_PAGES.has(lastActiveTab)) {
        showTab(lastActiveTab);
      } else if (firstTab) {
        // go to default tab if lastActiveTab is missing
        showTab(firstTab);
      }
    }
    // release swipe mark and suppression after processing
    IOS_EDGE_SWIPE_AT = 0;
    setBackdropSuppressed(false);
    setGestureAnimSuppressed(false);
    // reinforce flag reset after processing any branch
    window.__programmaticBack = false;
  }
  function initRouter() {
    window.addEventListener('hashchange', onHashChange);
    onHashChange(); // first entry
  }

  // ---- script runner for fetched HTML ----
  async function executeInlineScripts(container) {
    const scripts = qsa('script', container);
    
    // separate external scripts (with src) and inline scripts
    const externalScripts = [];
    const inlineScripts = [];
    
    scripts.forEach(old => {
      // data-spa-ignore: do not execute on SPA insertion
      if (old.hasAttribute('data-spa-ignore')) return;

      // data-once: prevent duplicate execution based on key (src or data-once key)
      const onceKey = old.getAttribute('data-once') || old.getAttribute('src');
      if (onceKey && EXECUTED_SCRIPT_KEYS.has(onceKey)) return;

      const src = old.getAttribute('src');
      if (src) {
        externalScripts.push({ old, onceKey });
      } else {
        inlineScripts.push({ old, onceKey });
      }
    });

    // step 1: load external scripts first (parallel)
    const externalPromises = externalScripts.map(({ old, onceKey }) => {
      return new Promise((resolve, reject) => {
        const src = old.getAttribute('src');
        
        // convert relative path to absolute path (테마 뷰 스크립트는 테마 루트 기준으로 로드)
        let absoluteSrc = src;
        if (src && !/^(https?:|\/)/i.test(src)) {
          try {
            if (THEME_BASE) {
              absoluteSrc = new URL(src, THEME_BASE).href;
            } else {
              absoluteSrc = new URL(src, location.href).href;
            }
          } catch (_) {
            absoluteSrc = src;
          }
        }
        
        // do not load if CommentsModule already exists for comments.js
        if (src && src.includes('comments.js')) {
          if (typeof window.CommentsModule !== 'undefined') {
            resolve();
            return;
          }
        }
        
        // also use absolute path as onceKey (prevent duplicate load)
        const absoluteOnceKey = absoluteSrc || onceKey;
        if (absoluteOnceKey && EXECUTED_SCRIPT_KEYS.has(absoluteOnceKey)) {
          // skip already loaded scripts
          resolve();
          return;
        }
        
        const s = document.createElement('script');
      const type = old.getAttribute('type');
      if (type) s.type = type;
        s.src = absoluteSrc;
        // disable defer/async for comments.js as it must execute synchronously
        if (src && src.includes('comments.js')) {
          s.defer = false;
          s.async = false;
        } else {
          if (old.defer) s.defer = true;
          if (old.async) s.async = true;
        }

        // mark as executed once (using absolute path)
        if (absoluteOnceKey) EXECUTED_SCRIPT_KEYS.add(absoluteOnceKey);

        s.onload = () => {
          // wait until CommentsModule is registered for comments.js
          if (src && src.includes('comments.js')) {
            const checkCommentsModule = () => {
              if (typeof window.CommentsModule !== 'undefined') {
                try { s.remove(); } catch (_) {}
                resolve();
              } else {
                setTimeout(checkCommentsModule, 10);
              }
            };
            // check once immediately
            if (typeof window.CommentsModule !== 'undefined') {
              try { s.remove(); } catch (_) {}
              resolve();
            } else {
              checkCommentsModule();
            }
          } else {
            // remove after load completes
            try { s.remove(); } catch (_) {}
            resolve();
          }
        };
        s.onerror = () => {
          // also remove on error
          try { s.remove(); } catch (_) {}
          reject(new Error(`Failed to load script: ${src}`));
        };
        
        // append to body to execute
        document.body.appendChild(s);
      });
    });

    // wait for all external scripts to load
    if (externalPromises.length > 0) {
      await Promise.all(externalPromises).catch(() => {
        // continue even if some scripts fail to load
      });
      // slight delay until external scripts are fully executed
      // additional wait if comments.js is included
      const hasCommentsJs = externalScripts.some(({ old }) => {
        const src = old.getAttribute('src') || '';
        return src.includes('comments.js');
      });
      if (hasCommentsJs) {
        await new Promise(resolve => setTimeout(resolve, 50));
        // final check if CommentsModule is registered
        if (typeof window.CommentsModule === 'undefined') {
          await new Promise(resolve => {
            const check = () => {
              if (typeof window.CommentsModule !== 'undefined') {
                resolve();
              } else {
                setTimeout(check, 10);
              }
            };
            check();
          });
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    // CommentsModule script execution helper function
    const executeCommentsModuleScript = (scriptContent) => {
      
      // slight delay until DOM is ready
      setTimeout(() => {
        try {
          // add script element to body to execute (safest method)
          const s = document.createElement('script');
          s.textContent = scriptContent;
          document.body.appendChild(s);
          
          // remove after execution
          setTimeout(() => {
            try { s.remove(); } catch (_) {}
          }, 100);
        } catch (error) {
        }
      }, 50);
    };

    // step 2: execute inline scripts after external scripts load
    // reference wakit-popup.js method for simpler and more reliable execution
    
    // use for loop instead of forEach (wakit-popup.js method)
    for (let index = 0; index < inlineScripts.length; index++) {
      const { old, onceKey } = inlineScripts[index];
      
      // get script content
      let scriptContent = old.textContent || old.innerHTML || '';
      
      if (!scriptContent || scriptContent.trim() === '') {
        continue;
      }
      
      // handle jQuery ready function (convert only when actual jQuery ready pattern exists)
      if (scriptContent && typeof scriptContent === 'string') {
        // check if jQuery ready pattern actually exists
        const hasJQueryReady = /\$\(function\s*\(\s*\)\s*\{|\$\(document\)\.ready\s*\(\s*function\s*\(\s*\)\s*\{|jQuery\s*\(\s*function\s*\(\s*\)\s*\{/g.test(scriptContent);
        
        if (hasJQueryReady) {
          // convert only when jQuery ready function exists
          scriptContent = scriptContent
            .replace(/\$\(function\s*\(\s*\)\s*\{/g, '(function($) {')
            .replace(/\$\(document\)\.ready\s*\(\s*function\s*\(\s*\)\s*\{/g, '(function($) {')
            .replace(/jQuery\s*\(\s*function\s*\(\s*\)\s*\{/g, '(function($) {')
            .replace(/\}\s*\)\s*;\s*$/gm, '})(jQuery);');
        }
      }
      
      // mark as executed once
      if (onceKey) EXECUTED_SCRIPT_KEYS.add(onceKey);
      
      // jQuery check
      // check only actual jQuery usage patterns (more accurate check)
      // do not judge as jQuery simply because "jQuery" string is included
      const hasJQuery = scriptContent && typeof scriptContent === 'string' && (
        // check actual jQuery usage patterns
        /\$\(/g.test(scriptContent) ||           // $(...) pattern
        /jQuery\(/g.test(scriptContent) ||        // jQuery(...) pattern
        /window\.jQuery/g.test(scriptContent) ||   // window.jQuery access
        /window\.\$/g.test(scriptContent) ||      // window.$ access
        /\$\.(ajax|get|post|ready|fn)/g.test(scriptContent) || // $.ajax, $.get, etc.
        /jQuery\.(ajax|get|post|ready|fn)/g.test(scriptContent) // jQuery.ajax, etc.
      );
      
      if (hasJQuery) {
        const s = document.createElement('script');
        const type = old.getAttribute('type');
        if (type) s.type = type;
        s.textContent = scriptContent;
        
        const checkJQuery = () => {
          if (typeof window.jQuery !== 'undefined' || typeof window.$ !== 'undefined') {
            document.body.appendChild(s);
            setTimeout(() => { try { s.remove(); } catch (_) {} }, 100);
          } else {
            setTimeout(checkJQuery, 50);
          }
        };
        checkJQuery();
        continue;
      }
      
      // general inline script - execute simply using wakit-popup.js method
      
      // wakit-popup.js method: add directly to container (most reliable method)
      try {
        const s = document.createElement('script');
        const type = old.getAttribute('type');
        if (type) s.type = type;
        
        // copy all attributes (wakit-popup.js method)
        Array.prototype.forEach.call(old.attributes, function(attr) {
          if (attr.name !== 'src' && attr.name !== 'textContent') {
            s.setAttribute(attr.name, attr.value);
          }
        });
        
        s.textContent = scriptContent;
        
        // wakit-popup.js method: execute in most reliable way
        // add directly to body (most reliable method)
        let scriptExecuted = false;
        
        // method 1: add directly to body (most reliable - wakit-popup.js also uses this)
        if (document.body) {
          try {
            document.body.appendChild(s);
            scriptExecuted = true;
          } catch (e) {
            // body addition failed
          }
        }
        
        // method 2: add to container (if body fails)
        if (!scriptExecuted && container) {
          try {
            container.appendChild(s);
            scriptExecuted = true;
          } catch (e) {
            // container addition failed
          }
        }
        
        // method 3: add to head (if both body and container fail)
        if (!scriptExecuted) {
          const head = document.head || document.getElementsByTagName('head')[0];
          if (head) {
            try {
              head.appendChild(s);
              scriptExecuted = true;
            } catch (e) {
              // head addition failed
            }
          }
        }
        
        // execution check
        if (scriptExecuted) {
          // remove after execution (only on success)
          setTimeout(() => {
            try { 
              if (s.parentNode) {
                s.remove(); 
              }
            } catch (e) {
              // removal failed (ignore)
            }
          }, 200); // increased to 200ms considering execution time
        } else {
          throw new Error('All DOM insertion methods failed');
        }
      } catch (error) {
        // Security: do NOT fall back to new Function / eval.
        // If DOM insertion fails, skip execution.
        try {
          console.warn('[wakit.js] Inline script execution skipped (DOM insertion failed)', error);
        } catch (_) { /* noop */ }
      }
    }

    // 테마 컨트롤 동기화 (웹·Wakit 공통, 프로필 등 동적 뷰에서 토글 반영)
    try {
      if (window.ThemeToggle && typeof window.ThemeToggle.refresh === 'function') {
        window.ThemeToggle.refresh();
      }
    } catch (_) { /* noop */ }
  }

  // ---- CommentsModule auto initialization ----
  async function autoInitCommentsModule(container) {
    // find elements with data-comments-init attribute
    const commentContainers = qsa('[data-comments-init]', container);
    if (commentContainers.length === 0) return;
    
    // Load i18n translations if not already loaded
    const loadCommentsI18n = async () => {
      // Check if i18n is already loaded
      if (window.i18n && window.i18n.wk_comments) {
        console.log('[wakit.js] Comments i18n already loaded');
        return; // Already loaded
      }
      
      try {
        const response = await fetch('/api/v1/comments/i18n', { 
          credentials: 'same-origin',
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            window.i18n = window.i18n || {};
            window.i18n.wk_comments = data.data;
            console.log('[wakit.js] Comments i18n loaded:', Object.keys(data.data).length, 'translations');
            
            // If CommentsModule is already loaded, update its translations
            if (typeof window.CommentsModule !== 'undefined' && window.CommentsModule.updateTranslations) {
              window.CommentsModule.updateTranslations(data.data);
            }
          } else {
            console.warn('[wakit.js] Comments i18n data is empty');
          }
        } else {
          console.warn('[wakit.js] Failed to load comments i18n:', response.status, response.statusText);
        }
      } catch (e) {
        console.warn('[wakit.js] Failed to load comments i18n:', e);
      }
    };
    
    // Load i18n first (important for language detection)
    await loadCommentsI18n();
    
    // wait until CommentsModule is loaded
    const waitForCommentsModule = () => {
      return new Promise((resolve) => {
        let retryCount = 0;
        const maxRetries = 40; // wait 2 seconds
        
        const check = () => {
          if (typeof window.CommentsModule !== 'undefined') {
            resolve();
          } else if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(check, 50);
          } else {
            console.warn('[wakit.js] CommentsModule not found, skipping auto initialization');
            resolve(); // continue even on failure
          }
        };
        check();
      });
    };
    
    // Wait for CommentsModule after i18n is loaded
    await waitForCommentsModule();
    
    if (typeof window.CommentsModule === 'undefined') return;
    
    // initialize each container
    for (const containerEl of commentContainers) {
      try {
        // skip already initialized containers (prevent re-initialization on pull-to-refresh)
        // but check if innerHTML was replaced, then re-initialize
        const wasInitialized = containerEl.dataset.commentsInitialized === '1';
        const hasCommentContent = containerEl.querySelector('.comments-form, .comment-item');
        
        // skip if already initialized and has comment content
        if (wasInitialized && hasCommentContent) {
          continue;
        }
        
        const selector = '#' + containerEl.id;
        const initData = containerEl.getAttribute('data-comments-init');
        let options = {};
        
        if (initData) {
          try {
            options = JSON.parse(initData);
          } catch (e) {
            console.error('[wakit.js] data-comments-init parsing failed:', e);
            continue;
          }
        }
        
        // set default options (data-comments-init values take priority)
        const defaultOptions = {
          apiBase: options.apiBase || '/api/v1',
          context: options.context || 'guestbook',
          contextId: options.contextId || 1,
          authToken: options.authToken || (() => {
            const meta = document.querySelector('meta[name="csrf-token"]');
            return meta ? meta.getAttribute('content') || '' : '';
          })(),
          currentUserId: options.currentUserId !== undefined ? options.currentUserId : null,
          sort: options.sort || 'new',
          pageSize: options.pageSize || 20,
          onNotify: options.onNotify || function(message, type) {
            alert(message);
          }
        };
        
        // fetch from API if currentUserId is null and not in data-comments-init
        if (defaultOptions.currentUserId === null && options.currentUserId === undefined) {
          try {
            const response = await fetch('/api/v1/me', { credentials: 'same-origin' });
            if (response.ok) {
              const data = await response.json();
              defaultOptions.currentUserId = data.data?.id || null;
            }
          } catch (e) {
            // if not logged in
          }
        }
        
        window.CommentsModule.init(selector, defaultOptions);
        // mark initialization complete
        containerEl.dataset.commentsInitialized = '1';
      } catch (error) {
        console.error('[wakit.js] CommentsModule auto initialization error:', error);
      }
    }
  }

  // ---- link interceptor (mobile only) ----
  function initLinkInterceptor() {
    document.addEventListener('click', e => {
      const a = e.target.closest('a');
      if (!a) return;

      // block link action if data-link-block exists
      if (a.hasAttribute('data-link-block')) {
        e.preventDefault();
        return;
      }

      // open in new window: target="_blank" or when Ctrl/Cmd key is pressed
      const targetBlank = a.getAttribute('target') === '_blank' || 
                         a.getAttribute('target') === '_new' ||
                         a.hasAttribute('data-new-window');
      const modifierKey = e.ctrlKey || e.metaKey || e.shiftKey;
      
      if (targetBlank || modifierKey) {
        // open in new window - allow default behavior
        const href = a.getAttribute('href');
        if (href && href !== '#' && !href.startsWith('javascript:')) {
          // allow default behavior (browser opens in new window)
          return;
        }
      }

      // exclude popup-only links from SPA routing, delegate to popup handler
      if (a.classList && a.classList.contains('popup')) return;
      if (a.matches && a.matches('a.popup,[data-popup]')) return;

      // do not route with hash for clicks inside tabbar (tab switching only)
      if (a.closest('#tabbar')) return;

      // mobile only: route with data-link first, use href if not available
      let route = (a.getAttribute('data-link') || '').trim();
      if (!route) {
        // use href attribute if data-link is not available
        route = (a.getAttribute('href') || '').trim();
      }

      // 탭으로만 이동 (다이나믹 뷰 열지 않음, 해시/히스토리 변경 없음): data-open-as-tab="탭페이지id"
      const openAsTab = (a.getAttribute('data-open-as-tab') || '').trim();
      if (openAsTab && TAB_PAGES.has(openAsTab)) {
        e.preventDefault();
        lastActiveTab = openAsTab;
        showTab(openAsTab, { updateHash: false });
        return;
      }
      
      if (route) {
        e.preventDefault();
        
        // save current active tab (before moving to dynamic-view)
        const currentActive = qs('.view.active:not(.dynamic-view)');
        if (currentActive) {
          const currentTab = (appConfig.tabs || []).find(t => viewIdOf(t.page) === currentActive.id)?.page;
          if (currentTab) {
            lastActiveTab = currentTab;
          }
        }
        
        // animate tabbar to bottom if moving to dynamic-view (both Android/iOS)
        const isTab = TAB_PAGES.has(route.replace(/^#/, ''));
        if (!isTab && MOBILE_MODE) {
          const tabbar = qs('#tabbar');
          if (tabbar) {
            // add slight delay to make animation look natural
            requestAnimationFrame(() => {
              tabbar.classList.add('tabbar-hide');
              tabbar.classList.remove('tabbar-show');
            });
          }
        }
        
        // -1) if only query is passed ('?param=...'): get base path from href or current hash/default tab and combine
        if (route.startsWith('?')) {
          const hrefAttrForBase = (a.getAttribute('href') || '').trim();
          const currentHash = (location.hash || '').replace(/^#/, '');
          let base = '';
          // use that path if a.href is hash
          if (hrefAttrForBase.startsWith('#')) {
            base = hrefAttrForBase.slice(1).split('?')[0];
          } else if (hrefAttrForBase) {
            // normalize and use if internal path/page file
            let hp = hrefAttrForBase;
            if (/^(?:https?:|mailto:|tel:|javascript:)/i.test(hp)) {
              // do not use if external/special scheme
            } else {
              if (hp.startsWith('/')) hp = hp.slice(1);
              if (hp.startsWith('./')) hp = hp.slice(2);
              hp = hp.split('?')[0];
              if (hp) base = hp;
            }
          }
          if (!base) {
            base = (currentHash.split('?')[0]) || (getDefaultTabPage() || '');
          }
          if (base) {
            location.hash = `#${base}${route}`; // route includes '?...'
          } else {
            // safety net: maintain current hash if default tab is also missing, query alone is meaningless
          }
          return;
        }
        
        // 0) promote to hash if external URL to fetch render within dynamic view
        if (isExternalUrl(route)) {
          location.hash = `#${route}`;
          return;
        }
        
        // 1) keep as is if already hash
        if (route.startsWith('#')) {
          location.hash = route;
          return;
        }
        
        // 2) directly loadable HTML paths (#views/.., ./views/.., /views/.. or any html file)
        if (isDirectHtmlPath(route)) {
          // remove ./, / prefix then promote to hash
          let p = route.replace(/^#/, '');
          p = p.replace(/^\//, '');
          if (p.startsWith('./')) p = p.slice(2);
          location.hash = `#${p}`;
          return;
        }
        
        // 3) promote to hash if looks like internal route
        const looksInternal = (!/[.]/.test(route)) || /^(?:[a-zA-Z0-9_-]+\/.+)$/.test(route);
        if (looksInternal) {
          location.hash = `#${route}`;
          return;
        }
        
        // 4) safely force to hash for others
        location.hash = `#${route}`;
        return;
      }

      // removed existing href processing logic (integrated above)
    });
  }

  // ---- offcanvas ----
  function initOffcanvas() {
    const btnLeft = qs('#btn-menu-left') || qs('[data-open-offcanvas="left"]');
    const btnRight = qs('#btn-menu-right') || qs('[data-open-offcanvas="right"]');
    const right = qs('#offcanvas-right');
    const left = qs('#offcanvas-left');
    const backdrop = qs('#offcanvas-backdrop');

    function open(which = 'right') {
      if (which === 'left') {
        left?.classList.add('open');
      } else {
        right?.classList.add('open');
      }
      backdrop?.classList.add('show');
    }
    function close() {
      right?.classList.remove('open');
      left?.classList.remove('open');
      backdrop?.classList.remove('show');
    }
    btnLeft?.addEventListener('click', () => open('left'));
    btnRight?.addEventListener('click', () => open('right'));
    backdrop?.addEventListener('click', close);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
    });

    // auto close on panel internal link click (common for left/right)
    const onPanelClick = (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      // only close for both internal/external links, leave navigation to default behavior
      close();
    };
    left?.addEventListener('click', onPanelClick);
    right?.addEventListener('click', onPanelClick);

    // global delegation: can trigger from anywhere in external pages
    document.addEventListener('click', e => {
      const trigger = e.target.closest('[data-open-offcanvas], .open-offcanvas-left, .open-offcanvas-right, [data-close-offcanvas], .offcanvas-close');
      if (!trigger) return;
      // open trigger
      if (trigger.matches('[data-open-offcanvas], .open-offcanvas-left, .open-offcanvas-right')) {
        e.preventDefault();
        const which = trigger.getAttribute('data-open-offcanvas')
          || (trigger.classList.contains('open-offcanvas-left') ? 'left'
              : trigger.classList.contains('open-offcanvas-right') ? 'right'
              : 'right');
        open(which);
        return;
      }
      // close trigger
      if (trigger.matches('[data-close-offcanvas], .offcanvas-close')) {
        e.preventDefault();
        close();
      }
    });

    // expose global control (optional)
    window.openOffcanvas = open;
    window.closeOffcanvas = close;
  }

  return { initApp };
})();

// expose globally
window.Core = Core;
export default Core;
