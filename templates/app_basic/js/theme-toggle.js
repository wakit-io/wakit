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

  function attachButtonListeners() {
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      if (button.dataset.listenerAttached === 'true') return;
      button.addEventListener('click', function(e) {
        e.preventDefault();
        const newOption = getCurrentThemeOption() === 'dark' ? 'light' : 'dark';
        setTheme(newOption);
        updateButton(getCurrentTheme());
      });
      button.dataset.listenerAttached = 'true';
    });
  }

  function updateButton(theme) {
    updateThemeButton(theme);
  }

  function init() {
    setTheme(getCurrentThemeOption());
    updateButton(getCurrentTheme());
    attachButtonListeners();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('load', function() { updateButton(getCurrentTheme()); attachButtonListeners(); });
})();
