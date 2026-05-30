/**
 * My Review Write - Mobile Layout Adjustment
 * 모바일에서 Event 배지를 피그마 디자인에 맞게 재배치
 */

(function() {
  'use strict';

  function adjustEventBadgeLayout() {
    // 모바일에서만 실행 (768px 이하)
    if (window.innerWidth > 768) {
      return;
    }

    const items = document.querySelectorAll('.my-review-write__item');
    
    items.forEach(item => {
      const itemContent = item.querySelector('.my-review-write__item-content');
      const itemInfo = item.querySelector('.my-review-write__item-info');
      const eventBadge = item.querySelector('.my-review-write__event-badge');
      const itemActions = item.querySelector('.my-review-write__item-actions');
      
      // Event 배지가 있고, 아직 이동되지 않은 경우
      if (eventBadge && itemInfo && itemContent && itemActions) {
        // 이미 이동되었는지 확인 (data 속성으로 체크)
        if (!eventBadge.hasAttribute('data-moved')) {
          // item-info에서 제거
          itemInfo.removeChild(eventBadge);
          
          // item-content 다음에 삽입 (item-actions 앞)
          item.insertBefore(eventBadge, itemActions);
          
          // 이동 완료 표시
          eventBadge.setAttribute('data-moved', 'true');
        }
      }
    });
  }

  function restoreEventBadgeLayout() {
    // PC에서 원래 위치로 복원
    if (window.innerWidth <= 768) {
      return;
    }

    const items = document.querySelectorAll('.my-review-write__item');
    
    items.forEach(item => {
      const itemInfo = item.querySelector('.my-review-write__item-info');
      const eventBadge = item.querySelector('.my-review-write__event-badge');
      
      // Event 배지가 있고, 이동된 경우
      if (eventBadge && itemInfo && eventBadge.hasAttribute('data-moved')) {
        // 현재 위치에서 제거
        if (eventBadge.parentNode) {
          eventBadge.parentNode.removeChild(eventBadge);
        }
        
        // item-info 끝에 다시 추가
        itemInfo.appendChild(eventBadge);
        
        // 이동 표시 제거
        eventBadge.removeAttribute('data-moved');
      }
    });
  }

  // 초기 실행
  function init() {
    adjustEventBadgeLayout();
  }

  // 리사이즈 이벤트 핸들러 (디바운스 적용)
  let resizeTimer;
  function handleResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth > 768) {
        restoreEventBadgeLayout();
      } else {
        adjustEventBadgeLayout();
      }
    }, 100);
  }

  // DOMContentLoaded 시 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 리사이즈 이벤트 리스너
  window.addEventListener('resize', handleResize);

  // Wakit-safe: MutationObserver로 동적 콘텐츠 감지
  if (typeof Wakit !== 'undefined' && Wakit.onContentUpdate) {
    Wakit.onContentUpdate(function() {
      adjustEventBadgeLayout();
    });
  }
})();
