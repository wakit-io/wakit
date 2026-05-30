/**
 * FAQ-2 탭 필터: 탭 클릭 시 해당 카테고리 카드만 표시
 * 이벤트 위임 사용 → wakit 다이나믹 뷰에서도 동작
 */
(function () {
  'use strict';

  function getCardCategory(card) {
    var badge = card.querySelector('.faq-card-badge span');
    return badge ? (badge.textContent || '').trim() : '';
  }

  function applyFilter(container, filterValue) {
    var cards = container.querySelectorAll('.faq-card');
    cards.forEach(function (card) {
      var category = getCardCategory(card);
      var show = filterValue === 'all' || category === filterValue;
      card.style.display = show ? '' : 'none';
    });
  }

  function setActiveTab(tabsContainer, activeButton) {
    tabsContainer.querySelectorAll('.faq-tab').forEach(function (btn) {
      btn.classList.toggle('faq-tab--active', btn === activeButton);
    });
  }

  function onDocumentClick(e) {
    var tab = e.target.closest('.faq-tab');
    if (!tab) return;

    var filter = tab.getAttribute('data-faq-filter');
    if (filter == null) return;

    e.preventDefault();

    var page = tab.closest('.faq-page');
    if (!page) return;

    var tabsContainer = tab.closest('.faq-tabs');
    if (tabsContainer) setActiveTab(tabsContainer, tab);

    applyFilter(page, filter);
  }

  document.addEventListener('click', onDocumentClick, true);

  function initPage(container) {
    if (!container || !container.querySelector('.faq-tabs')) return;
    var tabsContainer = container.querySelector('.faq-tabs');
    var active = container.querySelector('.faq-tab--active') || container.querySelector('.faq-tab[data-faq-filter="all"]');
    var filter = (active && active.getAttribute('data-faq-filter')) || 'all';
    setActiveTab(tabsContainer, active);
    applyFilter(container, filter);
  }

  function init() {
    document.querySelectorAll('.faq-page').forEach(initPage);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  var observer = new MutationObserver(function () {
    document.querySelectorAll('.faq-page').forEach(initPage);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
