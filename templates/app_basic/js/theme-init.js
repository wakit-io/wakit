/**
 * Initial theme setup script (App Basic)
 * Include in the <head> of every page to prevent FOUC
 */
(function() {
  'use strict';
  
  try {
    const THEME_STORAGE_KEY = 'blog-theme'; // must match wakit.js engine key (applyBlogThemeSync)
    const THEME_ATTRIBUTE = 'data-theme';
    
    let themeOption = null;
    try {
      themeOption = localStorage.getItem(THEME_STORAGE_KEY);
    } catch(e) {}
    
    if (!themeOption) {
      themeOption = 'system';
      try {
        localStorage.setItem(THEME_STORAGE_KEY, 'system');
      } catch(e) {}
    }
    
    let actualTheme = 'light';
    
    if (themeOption === 'dark') {
      actualTheme = 'dark';
    } else if (themeOption === 'system') {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        actualTheme = 'dark';
      }
    } else if (themeOption === 'light') {
      actualTheme = 'light';
    }
    
    if (actualTheme === 'dark') {
      document.documentElement.setAttribute(THEME_ATTRIBUTE, 'dark');
    } else {
      document.documentElement.removeAttribute(THEME_ATTRIBUTE);
    }
  } catch(e) {
    console.warn('Theme initialization failed:', e);
  }
})();
