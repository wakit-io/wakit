/**
 * Blog Banner Carousel
 * 배너 캐러셀 기능 구현
 */

(function() {
  'use strict';

  const banner = document.querySelector('.blog-banner');
  if (!banner) return;

  const slides = banner.querySelectorAll('.blog-banner__slide');
  const prevBtn = banner.querySelector('.blog-banner__nav-button--prev');
  const nextBtn = banner.querySelector('.blog-banner__nav-button--next');
  const indicators = banner.querySelectorAll('.blog-banner__indicator');

  if (!slides.length || !prevBtn || !nextBtn || !indicators.length) return;

  let currentSlide = 0;
  const totalSlides = slides.length;
  let autoSlideInterval;
  let isTransitioning = false;

  /**
   * 슬라이드 전환 함수
   */
  function goToSlide(index) {
    if (isTransitioning) return;
    
    // 인덱스 범위 체크
    if (index < 0) {
      index = totalSlides - 1; // 마지막 슬라이드로
    } else if (index >= totalSlides) {
      index = 0; // 첫 슬라이드로
    }

    isTransitioning = true;

    // 현재 슬라이드에서 active 클래스 제거
    slides[currentSlide].classList.remove('blog-banner__slide--active');
    indicators[currentSlide].classList.remove('blog-banner__indicator--active');

    // 새 슬라이드로 이동
    currentSlide = index;

    // 새 슬라이드에 active 클래스 추가
    slides[currentSlide].classList.add('blog-banner__slide--active');
    indicators[currentSlide].classList.add('blog-banner__indicator--active');

    // 전환 완료 후 플래그 해제
    setTimeout(() => {
      isTransitioning = false;
    }, 300);
  }

  /**
   * 다음 슬라이드로 이동
   */
  function nextSlide() {
    goToSlide(currentSlide + 1);
    resetAutoSlide();
  }

  /**
   * 이전 슬라이드로 이동
   */
  function prevSlide() {
    goToSlide(currentSlide - 1);
    resetAutoSlide();
  }

  /**
   * 자동 슬라이드 시작
   */
  function startAutoSlide() {
    autoSlideInterval = setInterval(() => {
      nextSlide();
    }, 5000); // 5초마다 자동 전환
  }

  /**
   * 자동 슬라이드 중지
   */
  function stopAutoSlide() {
    if (autoSlideInterval) {
      clearInterval(autoSlideInterval);
      autoSlideInterval = null;
    }
  }

  /**
   * 자동 슬라이드 재시작
   */
  function resetAutoSlide() {
    stopAutoSlide();
    startAutoSlide();
  }

  /**
   * 이벤트 리스너 등록
   */
  // 이전/다음 버튼 (이벤트 전파 방지)
  prevBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    prevSlide();
  });
  
  nextBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    nextSlide();
  });

  // 인디케이터 클릭 (이벤트 전파 방지)
  indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      goToSlide(index);
      resetAutoSlide();
    });
  });

  // 키보드 네비게이션
  banner.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
    }
  });

  // 마우스 호버 시 자동 슬라이드 중지
  banner.addEventListener('mouseenter', stopAutoSlide);
  banner.addEventListener('mouseleave', startAutoSlide);

  // 터치 이벤트 지원 (모바일)
  let touchStartX = 0;
  let touchEndX = 0;

  banner.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    stopAutoSlide();
  });

  banner.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
    startAutoSlide();
  });

  function handleSwipe() {
    const swipeThreshold = 50; // 최소 스와이프 거리
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // 왼쪽으로 스와이프 (다음 슬라이드)
        nextSlide();
      } else {
        // 오른쪽으로 스와이프 (이전 슬라이드)
        prevSlide();
      }
    }
  }

  // 접근성: 포커스 가능하도록 설정
  banner.setAttribute('tabindex', '0');

  // 초기화
  goToSlide(0);
  startAutoSlide();

  // 페이지 가시성 변경 시 자동 슬라이드 제어
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoSlide();
    } else {
      startAutoSlide();
    }
  });
})();

/**
 * Blog List 1 - 카테고리 탭 필터 + 더 불러오기
 * document 이벤트 위임으로 Wakit 다이나믹 뷰에서도 동작
 */
(function() {
  var ITEMS_PER_CLICK = 3;
  var currentFilter = 'all';
  var MORE_ITEMS = [
    { src: 'img/samples/photo-1522202176988-66273c2fd55f.png', alt: '이미지', badge: '여행', badgeOutline: true, title: '추가 블로그 포스트 제목', description: '창의적인 아이디어와 실행력으로 차별화된 가치를 제공합니다.', author: '김철수', dark: false, category: '인테리어' },
    { src: 'img/samples/photo-1469854523086-cc02fe5d8800.png', alt: '이미지', badge: '건강', badgeOutline: false, title: '추가 블로그 포스트 제목', description: '지속적인 개선과 혁신으로 발전하는 파트너가 되겠습니다.', author: '김철수', dark: true, category: '생활 꿀팁' },
    { src: 'img/samples/photo-1552664730-d307ca884978.png', alt: '이미지', badge: '라이프스타일', badgeOutline: true, title: '추가 블로그 포스트 제목', description: '협업과 소통을 통해 최상의 결과물을 만들어갑니다.', author: '김철수', dark: false, category: '라이프스타일' },
    { src: 'img/samples/photo-1506905925346-21bda4d32df4.png', alt: '이미지', badge: '인테리어', badgeOutline: true, title: '추가 블로그 포스트 제목', description: '체계적인 접근 방식으로 복잡한 문제를 해결합니다.', author: '김철수', dark: false, category: '인테리어' },
    { src: 'img/samples/photo-1501785888041-af3ef285b470.png', alt: '이미지', badge: '취미', badgeOutline: false, title: '추가 블로그 포스트 제목', description: '데이터 기반의 통찰력으로 현명한 결정을 돕습니다.', author: '김철수', dark: true, category: '가구' },
    { src: 'img/samples/photo-1517486808906-6ca8b3f04846.png', alt: '이미지', badge: '책/문학', badgeOutline: true, title: '추가 블로그 포스트 제목', description: '전문적인 노하우와 경험을 바탕으로 최적의 솔루션을 제공합니다.', author: '김철수', dark: false, category: '생활 꿀팁' },
  ];
  var moreIndex = 0;
  var defaultAvatar = 'img/samples/photo-1472099645785-5658abf4ff4e.png';

  function applyFilter(postsEl, filter) {
    if (!postsEl) return;
    var cards = postsEl.querySelectorAll('.blog-card');
    var showAll = filter === 'all';
    cards.forEach(function(card) {
      var cat = card.getAttribute('data-category');
      var show = showAll || cat === filter;
      card.style.display = show ? '' : 'none';
    });
  }

  function createCard(data) {
    var dark = data.dark;
    var category = data.category || '인테리어';
    var badgeClass = data.badgeOutline !== false && !dark ? 'badge badge--outline' : 'badge badge--primary';
    var card = document.createElement('a');
    card.href = 'views/blog-detail-1.html';
    card.className = 'blog-card' + (dark ? ' blog-card--dark' : '');
    card.setAttribute('data-category', category);
    card.innerHTML =
      '<div class="blog-card__image-wrapper">' +
        '<img src="' + (data.src || '') + '" alt="' + (data.alt || '이미지') + '" class="blog-card__image" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'block\';">' +
        '<div class="blog-card__image-placeholder" style="display: none;"></div>' +
        (dark ? '<div class="blog-card__image-overlay"></div>' : '') +
        '<span class="' + badgeClass + '">' + (data.badge || '') + '</span>' +
      '</div>' +
      '<div class="blog-card__content' + (dark ? ' blog-card__content--dark' : '') + '">' +
        '<h3 class="blog-card__title">' + (data.title || '') + '</h3>' +
        '<p class="blog-card__description">' + (data.description || '') + '</p>' +
        '<div class="blog-card__footer">' +
          '<div class="blog-card__author">' +
            '<div class="blog-card__avatar">' +
              '<div class="blog-card__avatar-placeholder">' +
                '<img src="' + defaultAvatar + '" alt="' + (data.author || '') + '" class="blog-card__avatar-img">' +
              '</div>' +
              '<div class="blog-card__avatar-badge"></div>' +
            '</div>' +
            '<span class="blog-card__author-name' + (dark ? ' blog-card__author-name--dark' : '') + '">' + (data.author || '') + '</span>' +
          '</div>' +
          '<button type="button" class="btn btn--outline btn--s" onclick="event.preventDefault(); event.stopPropagation();">' +
            '<span>더 읽기</span>' +
          '</button>' +
        '</div>' +
      '</div>';
    return card;
  }

  function addMore(grid) {
    if (!grid) return;
    for (var i = 0; i < ITEMS_PER_CLICK; i++) {
      var data = MORE_ITEMS[moreIndex % MORE_ITEMS.length];
      moreIndex++;
      grid.appendChild(createCard(data));
    }
    applyFilter(grid, currentFilter);
  }

  document.addEventListener('click', function(e) {
    var target = e.target && e.target.closest ? e.target.closest('.blog-container__tab') : null;
    if (target) {
      var filter = target.getAttribute('data-filter');
      if (!filter) return;
      var wrap = target.closest('.blog-container__tabs-and-posts');
      var posts = wrap ? wrap.querySelector('.blog-container__posts') : null;
      var tabs = wrap ? wrap.querySelectorAll('.blog-container__tab') : [];
      tabs.forEach(function(t) {
        t.classList.toggle('blog-container__tab--active', t === target);
      });
      currentFilter = filter;
      applyFilter(posts, currentFilter);
      return;
    }

    var btn = e.target && e.target.closest && e.target.closest('.blog-container__load-more-button');
    if (!btn) return;
    var wrap = btn.closest('.blog-container__tabs-and-posts');
    var grid = wrap ? wrap.querySelector('.blog-container__posts') : null;
    addMore(grid);
  });
})();
