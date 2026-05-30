/**
 * Hidden Slide Banner Carousel
 * 히든 슬라이드 배너 캐러셀 기능 구현
 * Wakit 다이나믹 뷰에서도 동작하도록 수정
 */

(function() {
  'use strict';

  const banner = document.querySelector('.hidden-slide-banner');
  if (!banner) return;

  // 이미 초기화된 배너는 건너뛰기 (Wakit에서 여러 번 로드될 수 있음)
  if (banner.dataset.carouselInitialized === 'true') return;
  banner.dataset.carouselInitialized = 'true';

  const slides = banner.querySelectorAll('.hidden-slide-banner__slide');
  const prevBtn = banner.querySelector('.hidden-slide-banner__nav-button--prev');
  const nextBtn = banner.querySelector('.hidden-slide-banner__nav-button--next');
  const indicators = banner.querySelectorAll('.hidden-slide-banner__indicator');

  if (!slides.length || !prevBtn || !nextBtn || !indicators.length) return;

  let currentSlide = 0;
  const totalSlides = slides.length;
  let autoSlideInterval;
  let isTransitioning = false;
  
  // 배너에 interval 참조 저장 (visibilitychange에서 접근 가능하도록)
  banner._autoSlideInterval = null;
  banner._startAutoSlide = startAutoSlide;
  banner._stopAutoSlide = stopAutoSlide;

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
    slides[currentSlide].classList.remove('hidden-slide-banner__slide--active');
    indicators[currentSlide].classList.remove('hidden-slide-banner__indicator--active');
    indicators[currentSlide].setAttribute('aria-selected', 'false');

    // 새 슬라이드로 이동
    currentSlide = index;

    // 새 슬라이드에 active 클래스 추가
    slides[currentSlide].classList.add('hidden-slide-banner__slide--active');
    indicators[currentSlide].classList.add('hidden-slide-banner__indicator--active');
    indicators[currentSlide].setAttribute('aria-selected', 'true');

    // 전환 완료 후 플래그 해제
    setTimeout(() => {
      isTransitioning = false;
    }, 500);
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
    if (autoSlideInterval) return; // 이미 실행 중이면 중복 실행 방지
    autoSlideInterval = setInterval(() => {
      nextSlide();
    }, 5000); // 5초마다 자동 전환
    banner._autoSlideInterval = autoSlideInterval;
  }

  /**
   * 자동 슬라이드 중지
   */
  function stopAutoSlide() {
    if (autoSlideInterval) {
      clearInterval(autoSlideInterval);
      autoSlideInterval = null;
      banner._autoSlideInterval = null;
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
  // 이전/다음 버튼
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

  // 인디케이터 클릭
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

  // 페이지 가시성 변경 시 자동 슬라이드 제어 (전역 이벤트는 한 번만 등록)
  if (!window.__blogList4VisibilityHandler) {
    window.__blogList4VisibilityHandler = true;
    document.addEventListener('visibilitychange', () => {
      // 모든 초기화된 배너를 찾아서 각각의 자동 슬라이드를 제어
      const banners = document.querySelectorAll('.hidden-slide-banner[data-carousel-initialized="true"]');
      banners.forEach(b => {
        if (document.hidden) {
          if (b._stopAutoSlide) b._stopAutoSlide();
        } else {
          if (b._startAutoSlide && !b._autoSlideInterval) b._startAutoSlide();
        }
      });
    });
  }
})();
