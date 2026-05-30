/**
 * Theme Toggle (App Basic)
 */
(function() {
  'use strict';
  const THEME_STORAGE_KEY = 'app_basic-theme';
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

  // Event delegation: a single listener on the document handles the toggle even
  // when the button is injected later via data-include (async fetch). Attaching
  // per-button on load misses buttons that don't exist yet.
  let delegatedBound = false;
  function attachDelegatedListener() {
    if (delegatedBound) return;
    delegatedBound = true;
    document.addEventListener('click', function(e) {
      const button = e.target.closest && e.target.closest('[data-theme-toggle]');
      if (!button) return;
      e.preventDefault();
      const newOption = getCurrentThemeOption() === 'dark' ? 'light' : 'dark';
      setTheme(newOption);
      updateButton(getCurrentTheme());
    });
  }

  // Sync the icon whenever new nodes (e.g. the included header) appear.
  // Observes childList only, so updateButton's attribute changes don't re-trigger it.
  function observeIncludes() {
    if (!window.MutationObserver || !document.body) return;
    const observer = new MutationObserver(function() {
      updateButton(getCurrentTheme());
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    setTheme(getCurrentThemeOption());
    updateButton(getCurrentTheme());
    attachDelegatedListener();
    observeIncludes();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('load', function() { updateButton(getCurrentTheme()); });
})();
