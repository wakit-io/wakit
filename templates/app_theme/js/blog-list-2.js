/**
 * Blog List 2 - 카테고리 탭 필터
 * document 이벤트 위임으로 Wakit 다이나믹 뷰에서도 동작
 * data-spa-ignore 제거 시 SPA 삽입 시에도 스크립트가 실행되므로, 리스너는 1회만 등록
 */
(function() {
  'use strict';

  if (window.__blogList2FilterBound) return;
  window.__blogList2FilterBound = true;

  function applyFilter(postsEl, filter) {
    if (!postsEl) return;
    var cards = postsEl.querySelectorAll('.blog-card');
    var showAll = filter === 'all';
    cards.forEach(function(card) {
      var cat = card.getAttribute('data-category');
      var isAd = card.classList.contains('blog-card--ad');
      var show = showAll || isAd || cat === filter;
      card.style.display = show ? '' : 'none';
    });
  }

  document.addEventListener('click', function(e) {
    var target = e.target && e.target.closest ? e.target.closest('.blog-container__tab') : null;
    if (!target) return;

    var filter = target.getAttribute('data-filter');
    if (!filter) return;

    var container = target.closest('.blog-container');
    if (!container) return;

    var posts = container.querySelector('.blog-container__posts');
    var tabs = container.querySelectorAll('.blog-container__tab');

    tabs.forEach(function(t) {
      t.classList.toggle('blog-container__tab--active', t === target);
    });
    applyFilter(posts, filter);
  });
})();
