/**
 * Shop List Items - 공통 컴포넌트
 * 상품 리스트 이미지 로딩 체크
 * DOMContentLoaded + MutationObserver로 wakit 다이나믹 뷰에서도 동작
 */

(function() {
  'use strict';

  const INIT_ATTR = 'data-shop-list-items-initialized';

  function init(itemsSection) {
    if (!itemsSection || itemsSection.getAttribute(INIT_ATTR) === '1') return;

    itemsSection.querySelectorAll('.shop-list-items__image-img').forEach((img) => {
      const placeholder = img.nextElementSibling;
      if (!placeholder || !placeholder.classList.contains('shop-list-items__image-placeholder')) return;
      if (img.complete && img.naturalHeight !== 0) {
        placeholder.style.display = 'none';
      } else {
        img.addEventListener('load', () => { placeholder.style.display = 'none'; });
        img.addEventListener('error', () => { placeholder.style.display = 'block'; });
      }
    });

    itemsSection.setAttribute(INIT_ATTR, '1');
  }

  function run() {
    document.querySelectorAll('.shop-list-items__section').forEach(init);
  }

  function scheduleRun() {
    if (run._timer) clearTimeout(run._timer);
    run._timer = setTimeout(function() {
      run._timer = null;
      run();
    }, 50);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  const observer = new MutationObserver(scheduleRun);
  observer.observe(document.body, { childList: true, subtree: true });
})();
