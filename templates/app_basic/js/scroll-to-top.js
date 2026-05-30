/**
 * Scroll to Top Button
 * 페이지 상단으로 스크롤하는 버튼 기능
 */

(function() {
  'use strict';

  const SCROLL_THRESHOLD = 300; // 버튼이 나타날 스크롤 위치 (px)
  let scrollButton = null;
  let isInitialized = false;

  /**
   * 스크롤 버튼 요소 찾기
   */
  function findScrollButton() {
    scrollButton = document.getElementById('scroll-to-top');
    return !!scrollButton;
  }

  /**
   * 스크롤 버튼이 로드될 때까지 대기
   */
  function waitForButton(callback, maxAttempts = 50) {
    let attempts = 0;
    
    function check() {
      attempts++;
      if (findScrollButton()) {
        callback();
      } else if (attempts < maxAttempts) {
        setTimeout(check, 100);
      }
    }
    
    check();
  }

  /**
   * 버튼 표시/숨김 토글
   */
  function toggleButtonVisibility() {
    if (!scrollButton) return;
    
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollY > SCROLL_THRESHOLD) {
      scrollButton.classList.add('is-visible');
    } else {
      scrollButton.classList.remove('is-visible');
    }
  }

  /**
   * 페이지 상단으로 스크롤
   */
  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  /**
   * 이벤트 리스너 등록
   */
  function attachEventListeners() {
    if (isInitialized || !scrollButton) return;
    isInitialized = true;

    // 버튼 클릭 이벤트
    scrollButton.addEventListener('click', function(e) {
      e.preventDefault();
      scrollToTop();
    });

    // 스크롤 이벤트 (throttle 적용)
    let ticking = false;
    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(function() {
          toggleButtonVisibility();
          ticking = false;
        });
        ticking = true;
      }
    });

    // 초기 상태 확인
    toggleButtonVisibility();
  }

  /**
   * 초기화
   */
  function init() {
    if (!scrollButton) return;
    attachEventListeners();
  }

  /**
   * 메인 초기화 함수
   */
  function mainInit() {
    waitForButton(function() {
      init();
    });
  }

  // MutationObserver로 버튼 추가 감지
  const observer = new MutationObserver(function(mutations) {
    if (!isInitialized && findScrollButton()) {
      init();
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
    if (!isInitialized) {
      mainInit();
    }
  });

})();
