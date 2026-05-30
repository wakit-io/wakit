/**
 * Blog List 7 - 더 불러오기
 * document 이벤트 위임으로 Wakit 다이나믹 뷰에서도 동작
 */
(function() {
  'use strict';

  var ITEMS_PER_CLICK = 3;
  var MORE_ITEMS = [
    { 
      src: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=384&h=256&fit=crop', 
      alt: '추가 포스트', 
      badge: '영화/드라마',
      title: '추가 블로그 포스트 제목',
      date: '25년 11월 08일'
    },
    { 
      src: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=384&h=256&fit=crop', 
      alt: '추가 포스트', 
      badge: '철학',
      title: '추가 블로그 포스트 제목',
      date: '24년 09월 03일'
    },
    { 
      src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=384&h=256&fit=crop', 
      alt: '추가 포스트', 
      badge: '사진',
      title: '추가 블로그 포스트 제목',
      date: '24년 12월 28일'
    },
    { 
      src: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=384&h=256&fit=crop', 
      alt: '추가 포스트', 
      badge: '교육',
      title: '추가 블로그 포스트 제목',
      date: '24년 07월 26일'
    },
    { 
      src: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=384&h=256&fit=crop', 
      alt: '추가 포스트', 
      badge: '음악',
      title: '추가 블로그 포스트 제목',
      date: '25년 08월 17일'
    },
    { 
      src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=384&h=256&fit=crop', 
      alt: '추가 포스트', 
      badge: '운동/피트니스',
      title: '추가 블로그 포스트 제목',
      date: '25년 07월 14일'
    },
  ];
  var moreIndex = 0;

  function createCard(data) {
    var card = document.createElement('a');
    card.href = 'views/blog-detail-1.html';
    card.className = 'blog-article-card';
    card.innerHTML =
      '<div class="blog-article-card__image-wrapper">' +
        '<img src="' + data.src + '" alt="' + (data.alt || '') + '" class="blog-article-card__image" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'block\';">' +
        '<div class="blog-article-card__image-placeholder" style="display: none;"></div>' +
      '</div>' +
      '<div class="blog-article-card__content">' +
        '<div class="blog-article-card__badge">' + (data.badge || '') + '</div>' +
        '<h3 class="blog-article-card__title">' + (data.title || '') + '</h3>' +
        '<div class="blog-article-card__date">' + (data.date || '') + '</div>' +
      '</div>';
    return card;
  }

  function addMore(gridEl) {
    if (!gridEl) return;
    for (var i = 0; i < ITEMS_PER_CLICK; i++) {
      var data = MORE_ITEMS[moreIndex % MORE_ITEMS.length];
      moreIndex++;
      gridEl.appendChild(createCard(data));
    }
  }

  // 이벤트 위임: Wakit에서 뷰 전환 후 주입된 버튼도 동작
  document.addEventListener('click', function(e) {
    var btn = e.target && e.target.closest ? e.target.closest('.blog-articles-section__load-more-button') : null;
    if (!btn) return;
    
    var section = btn.closest('.blog-articles-section');
    var grid = section ? section.querySelector('.blog-articles-section__grid') : null;
    addMore(grid);
  });
})();
