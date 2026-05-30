/**
 * 초기 테마 설정 스크립트 (App Basic)
 * 모든 페이지의 <head>에 포함하여 FOUC 방지
 */
(function() {
  'use strict';
  
  try {
    const THEME_STORAGE_KEY = 'app_basic-theme';
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
    console.warn('테마 초기화 실패:', e);
  }
})();
