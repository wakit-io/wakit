/**
 * Theme Toggle 기능
 * 다크모드/라이트모드 전환을 담당하는 JavaScript
 */

(function() {
  'use strict';

  const THEME_STORAGE_KEY = 'blog-theme';
  const THEME_ATTRIBUTE = 'data-theme';
  const DEFAULT_THEME = 'system';

  /**
   * 시스템 테마 가져오기
   */
  function getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  /**
   * 현재 테마 가져오기 (저장된 설정 또는 시스템 설정)
   */
  function getCurrentTheme() {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        return stored;
      }
      if (stored === 'system') {
        return getSystemTheme();
      }
    } catch (e) {
      console.warn('localStorage 접근 실패:', e);
    }
    
    return DEFAULT_THEME;
  }

  /**
   * 현재 활성 테마 옵션 가져오기 (light, system, dark)
   */
  function getCurrentThemeOption() {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light' || stored === 'system') {
        return stored;
      }
    } catch (e) {
      console.warn('localStorage 접근 실패:', e);
    }
    
    // 기본값을 시스템 모드로 설정
    return DEFAULT_THEME;
  }

  /**
   * 테마 설정하기
   */
  function setTheme(themeOption) {
    let actualTheme;
    
    if (themeOption === 'system') {
      actualTheme = getSystemTheme();
    } else if (themeOption === 'dark') {
      actualTheme = 'dark';
    } else {
      actualTheme = 'light';
    }
    
    // 실제 테마 적용
    if (actualTheme === 'dark') {
      document.documentElement.setAttribute(THEME_ATTRIBUTE, 'dark');
    } else {
      document.documentElement.removeAttribute(THEME_ATTRIBUTE);
    }
    
    // 옵션 저장
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeOption);
    } catch (e) {
      console.warn('localStorage 저장 실패:', e);
    }
    
    // 이벤트 발생
    const event = new CustomEvent('themechange', { detail: { theme: actualTheme, option: themeOption } });
    document.dispatchEvent(event);
    
    return actualTheme;
  }

  /**
   * 테마 옵션 설정 (light, system, dark)
   */
  function setThemeOption(option) {
    if (!option || (option !== 'dark' && option !== 'light' && option !== 'system')) {
      option = DEFAULT_THEME;
    }
    
    const actualTheme = setTheme(option);
    updateThemeSelector(option);
    updateThemeButton(actualTheme);
  }

  /**
   * 테마 선택기 업데이트 (footer 세그먼트 컨트롤)
   */
  function updateThemeSelector(option) {
    const selectorButtons = document.querySelectorAll('[data-theme-option]');

    selectorButtons.forEach(button => {
      const buttonOption = button.getAttribute('data-theme-option');
      if (buttonOption === option) {
        button.classList.add('is-active');
      } else {
        button.classList.remove('is-active');
      }
    });
  }

  /**
   * 테마 버튼 업데이트 (헤더의 기존 버튼)
   */
  function updateThemeButton(theme) {
    const buttons = document.querySelectorAll('[data-theme-toggle]');
    if (buttons.length === 0) return;

    buttons.forEach(button => {
      const icon = button.querySelector('i');
      if (icon) {
        if (theme === 'dark') {
          icon.className = 'bi bi-sun-fill';
          button.setAttribute('aria-label', '라이트 모드로 전환');
          button.setAttribute('title', '라이트 모드로 전환');
        } else {
          icon.className = 'bi bi-moon-fill';
          button.setAttribute('aria-label', '다크 모드로 전환');
          button.setAttribute('title', '다크 모드로 전환');
        }
      }
    });
  }

  /**
   * 테마 선택기 버튼에 이벤트 리스너 바인딩 (footer)
   */
  function attachSelectorListeners() {
    const selectorButtons = document.querySelectorAll('[data-theme-option]');

    selectorButtons.forEach((button) => {
      if (button.dataset.listenerAttached === 'true') {
        return;
      }

      button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const option = button.getAttribute('data-theme-option');
        setThemeOption(option);
      });

      button.dataset.listenerAttached = 'true';
    });
  }

  /**
   * 헤더 버튼에 직접 이벤트 리스너 바인딩 (기존 토글 버튼)
   */
  function attachButtonListeners() {
    const buttons = document.querySelectorAll('[data-theme-toggle]');
    if (buttons.length === 0) return;

    buttons.forEach((button) => {
      if (button.dataset.listenerAttached === 'true') {
        return;
      }

      button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const currentOption = getCurrentThemeOption();
        const newOption = currentOption === 'dark' ? 'light' : 'dark';
        setThemeOption(newOption);
      });

      button.dataset.listenerAttached = 'true';
    });
  }

  /**
   * 초기화
   */
  function init() {
    // 현재 테마 옵션 가져오기
    const themeOption = getCurrentThemeOption();
    const actualTheme = getCurrentTheme();

    // 테마 적용
    setTheme(themeOption);

    // 버튼 및 선택기 업데이트
    updateThemeSelector(themeOption);
    updateThemeButton(actualTheme);
    
    // 이벤트 리스너 등록
    attachSelectorListeners();
    attachButtonListeners();

    // 시스템 테마 변경 감지
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', function(e) {
        const currentOption = getCurrentThemeOption();
        // 시스템 옵션이 선택되어 있으면 시스템 변경에 따라 업데이트
        if (currentOption === 'system') {
          const newTheme = e.matches ? 'dark' : 'light';
          setTheme('system');
          updateThemeSelector('system');
          updateThemeButton(newTheme);
        }
      });
    }
  }

  /**
   * 테마 선택기와 버튼이 로드될 때까지 대기
   */
  function waitForThemeControls(callback, maxAttempts = 200) {
    let attempts = 0;
    
    function check() {
      attempts++;
      const selectorButtons = document.querySelectorAll('[data-theme-option]');
      const headerButtons = document.querySelectorAll('[data-theme-toggle]');
      
      if (selectorButtons.length > 0 || headerButtons.length > 0) {
        callback();
      } else if (attempts < maxAttempts) {
        setTimeout(check, 50);
      } else {
        console.warn('⚠️ 테마 컨트롤을 찾을 수 없습니다. (', maxAttempts, '회 시도)');
      }
    }
    
    check();
  }

  /**
   * 메인 초기화 함수
   */
  function mainInit() {
    // 즉시 초기화 시도
    init();
    
    // 컨트롤이 없으면 대기
    const selectorButtons = document.querySelectorAll('[data-theme-option]');
    const headerButtons = document.querySelectorAll('[data-theme-toggle]');
    
    if (selectorButtons.length === 0 && headerButtons.length === 0) {
      waitForThemeControls(function() {
        const themeOption = getCurrentThemeOption();
        const actualTheme = getCurrentTheme();
        updateThemeSelector(themeOption);
        updateThemeButton(actualTheme);
        attachSelectorListeners();
        attachButtonListeners();
      });
    }
  }

  // MutationObserver로 동적 추가된 컨트롤 감지
  const observer = new MutationObserver(function(mutations) {
    let shouldUpdate = false;
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) { // Element node
            if (node.matches && (node.matches('[data-theme-toggle]') || node.matches('[data-theme-option]'))) {
              shouldUpdate = true;
            }
            if (node.querySelectorAll) {
              if (node.querySelectorAll('[data-theme-toggle]').length > 0 || 
                  node.querySelectorAll('[data-theme-option]').length > 0) {
                shouldUpdate = true;
              }
            }
          }
        });
      }
    });
    
    if (shouldUpdate) {
      const selectorButtons = document.querySelectorAll('[data-theme-option]');
      const headerButtons = document.querySelectorAll('[data-theme-toggle]');
      
      if (selectorButtons.length > 0 || headerButtons.length > 0) {
        const themeOption = getCurrentThemeOption();
        const actualTheme = getCurrentTheme();
        updateThemeSelector(themeOption);
        updateThemeButton(actualTheme);
        attachSelectorListeners();
        attachButtonListeners();
      }
    }
  });

  // DOM 로드 완료 시 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      mainInit();
      // body 감시 시작
      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    });
  } else {
    mainInit();
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  // 추가로 window load 이벤트도 대기 (동적 로드 대비)
  window.addEventListener('load', function() {
    const themeOption = getCurrentThemeOption();
    const actualTheme = getCurrentTheme();
    updateThemeSelector(themeOption);
    updateThemeButton(actualTheme);
    attachSelectorListeners();
    attachButtonListeners();
  });

  /** 동적 추가된 테마 컨트롤에 리스너/상태 반영 (Wakit 탭 전환 등) */
  function refresh() {
    const themeOption = getCurrentThemeOption();
    const actualTheme = getCurrentTheme();
    updateThemeSelector(themeOption);
    updateThemeButton(actualTheme);
    attachSelectorListeners();
    attachButtonListeners();
  }

  // 전역으로 export
  window.ThemeToggle = {
    setTheme: setTheme,
    setThemeOption: setThemeOption,
    getCurrentTheme: getCurrentTheme,
    getCurrentThemeOption: getCurrentThemeOption,
    refresh: refresh,
    toggleTheme: function() {
      const currentOption = getCurrentThemeOption();
      const newOption = currentOption === 'dark' ? 'light' : 'dark';
      setThemeOption(newOption);
    }
  };
})();
