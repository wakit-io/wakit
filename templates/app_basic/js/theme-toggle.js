/**
 * Theme Toggle (App Basic)
 */
(function() {
  'use strict';
  const THEME_STORAGE_KEY = 'blog-theme'; // must match wakit.js engine key (applyBlogThemeSync)
  const THEME_ATTRIBUTE = 'data-theme';
  const DEFAULT_THEME = 'system';

  function getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  }

  function getCurrentTheme() {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') return stored;
      if (stored === 'system') return getSystemTheme();
    } catch (e) {}
    return getSystemTheme();
  }

  function getCurrentThemeOption() {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light' || stored === 'system') return stored;
    } catch (e) {}
    return DEFAULT_THEME;
  }

  function setTheme(themeOption) {
    let actualTheme = themeOption === 'system' ? getSystemTheme() : (themeOption === 'dark' ? 'dark' : 'light');
    if (actualTheme === 'dark') document.documentElement.setAttribute(THEME_ATTRIBUTE, 'dark');
    else document.documentElement.removeAttribute(THEME_ATTRIBUTE);
    try { localStorage.setItem(THEME_STORAGE_KEY, themeOption); } catch (e) {}
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: actualTheme, option: themeOption } }));
    return actualTheme;
  }

  function updateThemeButton(theme) {
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      const icon = button.querySelector('i');
      if (icon) {
        icon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
        button.setAttribute('aria-label', theme === 'dark' ? '라이트 모드' : '다크 모드');
      }
    });
  }

  function updateButton(theme) {
    updateThemeButton(theme);
  }

  // Highlight the active option in any [data-theme-option] segmented control
  // (values: system | light | dark).
  function updateThemeOptions(option) {
    document.querySelectorAll('[data-theme-option]').forEach(el => {
      const active = el.getAttribute('data-theme-option') === option;
      el.classList.toggle('is-active', active);
      el.setAttribute('aria-checked', active ? 'true' : 'false');
    });
  }

  // Sync every theme UI (toggle icon + option segments) to the current state.
  function syncUI() {
    updateButton(getCurrentTheme());
    updateThemeOptions(getCurrentThemeOption());
  }

  // Event delegation: a single listener on the document handles the toggle even
  // when the button is injected later via data-include (async fetch). Attaching
  // per-button on load misses buttons that don't exist yet.
  let delegatedBound = false;
  function attachDelegatedListener() {
    if (delegatedBound) return;
    delegatedBound = true;
    document.addEventListener('click', function(e) {
      if (!e.target.closest) return;
      // Segmented control: pick a specific option (system | light | dark)
      const opt = e.target.closest('[data-theme-option]');
      if (opt) {
        e.preventDefault();
        setTheme(opt.getAttribute('data-theme-option'));
        syncUI();
        return;
      }
      // Icon toggle: flip dark <-> light
      const button = e.target.closest('[data-theme-toggle]');
      if (!button) return;
      e.preventDefault();
      const newOption = getCurrentThemeOption() === 'dark' ? 'light' : 'dark';
      setTheme(newOption);
      syncUI();
    });
  }

  // Sync the icon whenever new nodes (e.g. the included header) appear.
  // Observes childList only, so updateButton's attribute changes don't re-trigger it.
  function observeIncludes() {
    if (!window.MutationObserver || !document.body) return;
    const observer = new MutationObserver(function() {
      syncUI();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    setTheme(getCurrentThemeOption());
    syncUI();
    attachDelegatedListener();
    observeIncludes();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('load', function() { syncUI(); });
})();
