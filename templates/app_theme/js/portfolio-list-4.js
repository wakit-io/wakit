/**
 * Portfolio List 4 - 더 불러오기
 * document에 이벤트 위임으로 Wakit 다이나믹 뷰에서도 동작
 */
(function() {
  var ITEMS_PER_CLICK = 3;

  var MORE_ITEMS = [
    { src: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=588&h=505&fit=crop', title: 'Project title', year: '2024' },
    { src: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=588&h=505&fit=crop', title: 'Project title', year: '2024' },
    { src: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=588&h=505&fit=crop', title: 'Project title', year: '2023' },
    { src: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=588&h=505&fit=crop', title: 'Project title', year: '2023' },
    { src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=588&h=505&fit=crop', title: 'Project title', year: '2022' },
    { src: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=588&h=505&fit=crop', title: 'Project title', year: '2022' },
  ];

  var moreItemsIndex = 0;

  function createItemElement(data) {
    var article = document.createElement('article');
    article.className = 'portfolio-list-4__item';
    article.innerHTML =
      '<a href="views/portfolio-detail-1.html" class="portfolio-list-4__item-link">' +
        '<figure class="portfolio-list-4__item-image">' +
          '<img src="' + data.src + '" alt="' + (data.title || 'Project title') + '" class="portfolio-list-4__item-image-img" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'block\';">' +
          '<div class="portfolio-list-4__item-image-placeholder" style="display: none;"></div>' +
          '<div class="portfolio-list-4__item-overlay"></div>' +
        '</figure>' +
        '<div class="portfolio-list-4__item-info">' +
          '<h3 class="portfolio-list-4__item-title">' + (data.title || 'Project title') + '</h3>' +
          '<p class="portfolio-list-4__item-year">' + (data.year || '2025') + '</p>' +
        '</div>' +
      '</a>';
    return article;
  }

  function addMoreItems(grid) {
    if (!grid) return;
    for (var i = 0; i < ITEMS_PER_CLICK; i++) {
      var data = MORE_ITEMS[moreItemsIndex % MORE_ITEMS.length];
      moreItemsIndex += 1;
      grid.appendChild(createItemElement(data));
    }
  }

  // 이벤트 위임: Wakit에서 뷰 전환 후 주입된 버튼도 동작
  document.addEventListener('click', function(e) {
    var btn = e.target && e.target.closest && e.target.closest('.portfolio-list-4__load-more-button');
    if (!btn) return;
    var section = btn.closest('.portfolio-list-4__grid-section');
    var grid = section ? section.querySelector('.portfolio-list-4__grid') : null;
    addMoreItems(grid);
  });
})();
