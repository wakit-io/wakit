/**
 * Blog List 6 - 더 불러오기
 * document 이벤트 위임으로 Wakit 다이나믹 뷰에서도 동작
 */
(function() {
  'use strict';

  var ITEMS_PER_CLICK = 3;
  var MORE_ITEMS = [
    { 
      src: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=383&h=240&fit=crop', 
      alt: '추가 포스트', 
      badge: '기술 블로그', 
      badgeClass: 'blog-article-card__badge--red',
      category: '요리의 즐거움',
      title: '추가 블로그 포스트 제목',
      author: 'tteokbokkiyum',
      time: '12시간 전',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop',
      description: '귀하의 전문성, 개인 경험, 그리고 독자에게 독특하게 제공할 수 있는 것을 고려하십시오.',
      likes: 35,
      comments: 4,
      shares: 3
    },
    { 
      src: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=383&h=240&fit=crop', 
      alt: '추가 포스트', 
      badge: '일상', 
      badgeClass: 'blog-article-card__badge--yellow',
      category: '요리의 즐거움',
      title: '추가 블로그 포스트 제목',
      author: 'tteokbokkiyum',
      time: '12시간 전',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop',
      description: '귀하의 전문성, 개인 경험, 그리고 독자에게 독특하게 제공할 수 있는 것을 고려하십시오.',
      likes: 28,
      comments: 5,
      shares: 2
    },
    { 
      src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=383&h=240&fit=crop', 
      alt: '추가 포스트', 
      badge: '책/문학', 
      badgeClass: 'blog-article-card__badge--red',
      category: '요리의 즐거움',
      title: '추가 블로그 포스트 제목',
      author: 'tteokbokkiyum',
      time: '12시간 전',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop',
      description: '귀하의 전문성, 개인 경험, 그리고 독자에게 독특하게 제공할 수 있는 것을 고려하십시오.',
      likes: 42,
      comments: 7,
      shares: 5
    },
    { 
      src: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=383&h=240&fit=crop', 
      alt: '추가 포스트', 
      badge: '건축', 
      badgeClass: 'blog-article-card__badge--purple',
      category: '요리의 즐거움',
      title: '추가 블로그 포스트 제목',
      author: 'tteokbokkiyum',
      time: '12시간 전',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop',
      description: '귀하의 전문성, 개인 경험, 그리고 독자에게 독특하게 제공할 수 있는 것을 고려하십시오.',
      likes: 31,
      comments: 3,
      shares: 4
    },
    { 
      src: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=383&h=240&fit=crop', 
      alt: '추가 포스트', 
      badge: '비즈니스', 
      badgeClass: 'blog-article-card__badge--green',
      category: '요리의 즐거움',
      title: '추가 블로그 포스트 제목',
      author: 'tteokbokkiyum',
      time: '12시간 전',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop',
      description: '귀하의 전문성, 개인 경험, 그리고 독자에게 독특하게 제공할 수 있는 것을 고려하십시오.',
      likes: 39,
      comments: 6,
      shares: 3
    },
    { 
      src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=383&h=240&fit=crop', 
      alt: '추가 포스트', 
      badge: '기술 블로그', 
      badgeClass: 'blog-article-card__badge--red',
      category: '요리의 즐거움',
      title: '추가 블로그 포스트 제목',
      author: 'tteokbokkiyum',
      time: '12시간 전',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop',
      description: '귀하의 전문성, 개인 경험, 그리고 독자에게 독특하게 제공할 수 있는 것을 고려하십시오.',
      likes: 33,
      comments: 4,
      shares: 2
    },
  ];
  var moreIndex = 0;

  function createCard(data) {
    var article = document.createElement('article');
    article.className = 'blog-article-card';
    article.innerHTML =
      '<a href="views/blog-detail-1.html" class="blog-article-card__link">' +
        '<div class="blog-article-card__image-wrapper">' +
          '<img src="' + data.src + '" alt="' + (data.alt || '') + '" class="blog-article-card__image" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'block\';">' +
          '<div class="blog-article-card__image-placeholder" style="display: none;"></div>' +
          '<button type="button" class="blog-article-card__bookmark" aria-label="북마크" onclick="event.preventDefault(); event.stopPropagation();">' +
            '<i class="bi bi-bookmark" aria-hidden="true"></i>' +
          '</button>' +
        '</div>' +
        '<div class="blog-article-card__content">' +
          '<div class="blog-article-card__category">' +
            '<span class="blog-article-card__badge ' + (data.badgeClass || 'blog-article-card__badge--red') + '">' + (data.badge || '') + '</span>' +
            '<span class="blog-article-card__category-text">' + (data.category || '') + '</span>' +
          '</div>' +
          '<h3 class="blog-article-card__title">' + (data.title || '') + '</h3>' +
          '<p class="blog-article-card__description">' + (data.description || '') + '</p>' +
          '<div class="blog-article-card__footer">' +
            '<div class="blog-article-card__author">' +
              '<div class="blog-article-card__avatar">' +
                '<div class="blog-article-card__avatar-placeholder">' +
                  '<img src="' + (data.avatar || '') + '" alt="' + (data.title || '') + '" class="blog-article-card__avatar-img">' +
                '</div>' +
                '<div class="blog-article-card__avatar-badge"></div>' +
              '</div>' +
              '<div class="blog-article-card__author-info">' +
                '<span class="blog-article-card__author-name">' + (data.author || '') + '</span>' +
                '<span class="blog-article-card__time">' + (data.time || '') + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="blog-article-card__actions">' +
              '<div class="blog-article-card__action-item">' +
                '<i class="bi bi-heart" aria-hidden="true"></i>' +
                '<span>' + (data.likes || 0) + '</span>' +
              '</div>' +
              '<div class="blog-article-card__action-item">' +
                '<i class="bi bi-chat" aria-hidden="true"></i>' +
                '<span>' + (data.comments || 0) + '</span>' +
              '</div>' +
              '<div class="blog-article-card__action-item">' +
                '<i class="bi bi-share" aria-hidden="true"></i>' +
                '<span>' + (data.shares || 0) + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</a>';
    return article;
  }

  function addMore(articlesEl) {
    if (!articlesEl) return;
    for (var i = 0; i < ITEMS_PER_CLICK; i++) {
      var data = MORE_ITEMS[moreIndex % MORE_ITEMS.length];
      moreIndex++;
      articlesEl.appendChild(createCard(data));
    }
  }

  // 이벤트 위임: Wakit에서 뷰 전환 후 주입된 버튼도 동작
  document.addEventListener('click', function(e) {
    var btn = e.target && e.target.closest ? e.target.closest('.blog-container-section__load-more-button') : null;
    if (!btn) return;
    
    var section = btn.closest('.blog-container-section');
    var articles = section ? section.querySelector('.blog-container-section__articles') : null;
    addMore(articles);
  });
})();
