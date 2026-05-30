/**
 * Blog List 3 - 카테고리 탭 필터
 * document 이벤트 위임으로 Wakit 다이나믹 뷰에서도 동작
 */
(function() {
  'use strict';

  if (window.__blogList3FilterBound) return;
  window.__blogList3FilterBound = true;

  function applyFilter(articlesEl, filter) {
    if (!articlesEl) return;
    var items = articlesEl.querySelectorAll('.blog-article, .blog-container-section__ad');
    var showAll = filter === 'all';
    items.forEach(function(el) {
      var cat = el.getAttribute('data-category');
      var isAd = el.classList.contains('blog-container-section__ad');
      var show = showAll || isAd || cat === filter;
      el.style.display = show ? '' : 'none';
    });
  }

  document.addEventListener('click', function(e) {
    var target = e.target && e.target.closest ? e.target.closest('.blog-container-section__tab') : null;
    if (!target) return;

    var filter = target.getAttribute('data-filter');
    if (!filter) return;

    var section = target.closest('.blog-container-section');
    if (!section) return;

    var articles = section.querySelector('.blog-container-section__articles');
    var tabs = section.querySelectorAll('.blog-container-section__tab');

    tabs.forEach(function(t) {
      t.classList.toggle('blog-container-section__tab--active', t === target);
      t.setAttribute('aria-selected', t === target ? 'true' : 'false');
    });
    applyFilter(articles, filter);
  });
})();
