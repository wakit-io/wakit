/**
 * Shop List 4 Ad Banner Carousel
 * 광고 배너 캐러셀 기능 구현
 * DOMContentLoaded + MutationObserver로 wakit 다이나믹 뷰에서도 동작
 */

(function() {
  'use strict';

  const INIT_ATTR = 'data-shop-list-4-ad-banner-initialized';

  function init(adBanner) {
    if (!adBanner || adBanner.getAttribute(INIT_ATTR) === '1') return;

    const slides = adBanner.querySelectorAll('.shop-list-4__ad-banner-slide');
    const indicators = adBanner.querySelectorAll('.shop-list-4__ad-banner-indicator');

    if (!slides.length || !indicators.length) return;

    let currentSlide = 0;
    const totalSlides = slides.length;
    let autoSlideInterval;
    let isTransitioning = false;

    const statusText = adBanner.querySelector('.shop-list-4__ad-banner-status-text');

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
      slides[currentSlide].classList.remove('shop-list-4__ad-banner-slide--active');
      indicators[currentSlide].classList.remove('shop-list-4__ad-banner-indicator--active');
      indicators[currentSlide].setAttribute('aria-selected', 'false');
      indicators[currentSlide].setAttribute('tabindex', '-1');

      // 새 슬라이드로 이동
      currentSlide = index;

      // 새 슬라이드에 active 클래스 추가
      slides[currentSlide].classList.add('shop-list-4__ad-banner-slide--active');
      indicators[currentSlide].classList.add('shop-list-4__ad-banner-indicator--active');
      indicators[currentSlide].setAttribute('aria-selected', 'true');
      indicators[currentSlide].setAttribute('tabindex', '0');

      // 상태 텍스트 업데이트 (스크린 리더용)
      if (statusText) {
        statusText.textContent = `슬라이드 ${currentSlide + 1} / ${totalSlides}`;
      }

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
     * 자동 슬라이드 리셋
     */
    function resetAutoSlide() {
      stopAutoSlide();
      startAutoSlide();
    }

    // 인디케이터 클릭 이벤트
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => {
        goToSlide(index);
        resetAutoSlide();
      });

      // 키보드 네비게이션
      indicator.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goToSlide(index);
          resetAutoSlide();
        }
      });
    });

    // 마우스 호버 시 자동 슬라이드 일시 정지
    adBanner.addEventListener('mouseenter', stopAutoSlide);
    adBanner.addEventListener('mouseleave', startAutoSlide);

    // 터치 스와이프 지원
    let touchStartX = 0;
    let touchEndX = 0;

    adBanner.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    adBanner.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      const swipeThreshold = 50; // 최소 스와이프 거리
      const diff = touchStartX - touchEndX;

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          // 왼쪽으로 스와이프 (다음 슬라이드)
          nextSlide();
        } else {
          // 오른쪽으로 스와이프 (이전 슬라이드)
          goToSlide(currentSlide - 1);
          resetAutoSlide();
        }
      }
    }

    // 키보드 네비게이션 (화살표 키)
    document.addEventListener('keydown', (e) => {
      if (adBanner.contains(document.activeElement) || document.activeElement === document.body) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          goToSlide(currentSlide - 1);
          resetAutoSlide();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          nextSlide();
        }
      }
    });

    // 이미지 로딩 체크
    const bannerImages = adBanner.querySelectorAll('.shop-list-4__ad-banner-image-img');
    bannerImages.forEach((img) => {
      const placeholder = img.nextElementSibling;
      if (!placeholder || !placeholder.classList.contains('shop-list-4__ad-banner-image-placeholder')) return;

      function checkImageLoad() {
        if (img.complete && img.naturalHeight !== 0) {
          placeholder.style.display = 'none';
        } else {
          img.addEventListener('load', () => {
            placeholder.style.display = 'none';
          });
          img.addEventListener('error', () => {
            placeholder.style.display = 'block';
          });
        }
      }

      checkImageLoad();
    });

    // 초기화
    startAutoSlide();

    adBanner.setAttribute(INIT_ATTR, '1');
  }

  function run() {
    const el = document.querySelector('.shop-list-4__ad-banner');
    if (el) init(el);
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
