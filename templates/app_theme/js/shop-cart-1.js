/**
 * Shop Cart 1
 * 추천 상품 캐러셀 슬라이드 (이전/다음 버튼), 첫 번째 아이템 왼쪽 여백 유지
 * DOMContentLoaded + MutationObserver로 wakit 다이나믹 뷰에서도 동작
 */

(function() {
  'use strict';

  var ATTR_CAROUSEL = 'data-shop-cart-1-recommended-carousel-initialized';

  function getScrollAmount(list) {
    var firstCard = list.querySelector('.recommended-product');
    if (!firstCard) return 212;
    var cardWidth = firstCard.offsetWidth;
    var gap = 12;
    try {
      var g = getComputedStyle(list).gap;
      if (g && g !== 'normal') {
        var num = parseFloat(g, 10);
        if (!isNaN(num)) gap = num;
      }
    } catch (_) {}
    return cardWidth + gap;
  }

  function updateButtons(list, prevBtn, nextBtn) {
    if (!list || !prevBtn || !nextBtn) return;
    var scrollLeft = list.scrollLeft;
    var maxScroll = list.scrollWidth - list.clientWidth;
    prevBtn.disabled = scrollLeft <= 0;
    nextBtn.disabled = maxScroll <= 0 || scrollLeft >= maxScroll - 1;
  }

  function initRecommendedCarousel(section) {
    if (!section || section.getAttribute(ATTR_CAROUSEL) === '1') return;

    var list = section.querySelector('.recommended-products-list');
    var prevBtn = section.querySelector('.carousel-control--prev');
    var nextBtn = section.querySelector('.carousel-control--next');

    if (!list || !prevBtn || !nextBtn) return;

    prevBtn.addEventListener('click', function() {
      var amount = getScrollAmount(list);
      list.scrollBy({ left: -amount, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', function() {
      var amount = getScrollAmount(list);
      list.scrollBy({ left: amount, behavior: 'smooth' });
    });

    function onScroll() {
      updateButtons(list, prevBtn, nextBtn);
    }

    list.addEventListener('scroll', onScroll);
    updateButtons(list, prevBtn, nextBtn);

    section.setAttribute(ATTR_CAROUSEL, '1');
  }

  function run() {
    var section = document.querySelector('.recommended-products-section');
    if (section) initRecommendedCarousel(section);
  }

  function scheduleRun() {
    if (scheduleRun._timer) clearTimeout(scheduleRun._timer);
    scheduleRun._timer = setTimeout(function() {
      scheduleRun._timer = null;
      run();
    }, 50);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  var body = document.body;
  if (body && !body._shopCart1ObserverAttached) {
    body._shopCart1ObserverAttached = true;
    var mo = new MutationObserver(scheduleRun);
    mo.observe(body, { childList: true, subtree: true });
  }
})();
