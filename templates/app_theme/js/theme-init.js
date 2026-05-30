/**
 * 초기 테마 설정 스크립트
 * 모든 페이지의 <head>에 포함하여 FOUC 방지
 */
(function() {
  'use strict';
  
  try {
    const THEME_STORAGE_KEY = 'blog-theme';
    const THEME_ATTRIBUTE = 'data-theme';
    
    // 로컬스토리지에서 테마 옵션 가져오기
    let themeOption = null;
    try {
      themeOption = localStorage.getItem(THEME_STORAGE_KEY);
    } catch(e) {
      // localStorage 접근 실패 시 무시
    }
    
    // 기본값을 시스템 모드로 설정 (저장된 값이 없을 경우)
    if (!themeOption) {
      themeOption = 'system';
      try {
        localStorage.setItem(THEME_STORAGE_KEY, 'system');
      } catch(e) {
        // localStorage 저장 실패 시 무시
      }
    }
    
    // 실제 적용할 테마 결정
    let actualTheme = 'light';
    
    if (themeOption === 'dark') {
      actualTheme = 'dark';
    } else if (themeOption === 'system') {
      // 시스템 설정 확인
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        actualTheme = 'dark';
      } else {
        actualTheme = 'light';
      }
    } else if (themeOption === 'light') {
      actualTheme = 'light';
    }
    
    // 테마 적용
    if (actualTheme === 'dark') {
      document.documentElement.setAttribute(THEME_ATTRIBUTE, 'dark');
    } else {
      document.documentElement.removeAttribute(THEME_ATTRIBUTE);
    }
  } catch(e) {
    console.warn('테마 초기화 실패:', e);
  }
})();
