/**
 * Blog Header Navigation
 * 모바일 햄버거 메뉴 토글 기능
 */

(function() {
  'use strict';

  let header, toggle, hamburger, panel, menuItems;
  let isInitialized = false;

  /**
   * 헤더 요소 초기화
   */
  function initElements() {
    header = document.querySelector('.blog-header');
    if (!header) return false;

    toggle = header.querySelector('#blog-nav-toggle');
    hamburger = header.querySelector('.blog-header__hamburger');
    panel = header.querySelector('.blog-header__panel');
    menuItems = header.querySelectorAll('.blog-header__menu-item');

    return !!(toggle && hamburger && panel);
  }

  /**
   * 헤더가 로드될 때까지 대기
   */
  function waitForHeader(callback, maxAttempts = 50) {
    let attempts = 0;
    
    function check() {
      attempts++;
      if (initElements()) {
        callback();
      } else if (attempts < maxAttempts) {
        setTimeout(check, 100);
      } else {
        console.warn('Blog header not found after', maxAttempts, 'attempts');
      }
    }
    
    check();
  }

  /**
   * 메뉴 열기
   */
  function openMenu() {
    if (!toggle || !hamburger || !panel) return;
    
    toggle.checked = true;
    hamburger.setAttribute('aria-expanded', 'true');
    panel.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    requestAnimationFrame(() => {
      panel.style.maxHeight = panel.scrollHeight + 'px';
    });
  }

  /**
   * 메뉴 닫기
   */
  function closeMenu() {
    if (!toggle || !hamburger || !panel) return;
    
    toggle.checked = false;
    hamburger.setAttribute('aria-expanded', 'false');
    panel.style.maxHeight = '0';
    document.body.style.overflow = '';
    
    setTimeout(() => {
      if (toggle && !toggle.checked) {
        panel.style.display = 'none';
      }
    }, 300);
  }

  /**
   * 메뉴 토글
   */
  function toggleMenu() {
    if (!toggle) return;
    
    if (toggle.checked) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  /**
   * 이벤트 리스너 등록
   */
  function attachEventListeners() {
    if (isInitialized || !toggle || !hamburger || !panel) return;
    isInitialized = true;

    // 햄버거 버튼 클릭 이벤트
    hamburger.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    });

    // 체크박스 변경 이벤트
    toggle.addEventListener('change', function() {
      if (this.checked) {
        openMenu();
      } else {
        closeMenu();
      }
    });

    // 메뉴 외부 클릭 시 닫기
    document.addEventListener('click', function(e) {
      if (toggle && toggle.checked && header && !header.contains(e.target)) {
        closeMenu();
      }
    });

    // ESC 키로 메뉴 닫기
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && toggle && toggle.checked) {
        closeMenu();
        if (hamburger) hamburger.focus();
      }
    });

    // 메뉴 아이템 클릭 시 메뉴 닫기 (모바일)
    menuItems.forEach(item => {
      item.addEventListener('click', function(e) {
        if (window.innerWidth <= 992) {
          setTimeout(() => {
            closeMenu();
          }, 100);
        }
      });
    });

    // 윈도우 리사이즈 시 처리
    let resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        if (window.innerWidth > 992 && toggle && toggle.checked) {
          closeMenu();
        }
        if (toggle && toggle.checked && panel) {
          panel.style.maxHeight = panel.scrollHeight + 'px';
        }
      }, 250);
    });
  }

  /**
   * 초기화
   */
  function init() {
    if (!panel) return;
    
    if (window.innerWidth <= 992) {
      panel.style.display = 'none';
    }
    
    attachEventListeners();
  }

  /**
   * 메인 초기화 함수
   */
  function mainInit() {
    waitForHeader(function() {
      init();
    });
  }

  // MutationObserver로 헤더 추가 감지
  const observer = new MutationObserver(function(mutations) {
    if (!isInitialized && initElements()) {
      init();
    }
  });

  // DOM 로드 완료 시 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      mainInit();
      // body 감시 시작
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  } else {
    mainInit();
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // 추가로 window load 이벤트도 대기 (동적 로드 대비)
  window.addEventListener('load', function() {
    if (!isInitialized) {
      mainInit();
    }
  });

})();
