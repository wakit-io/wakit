/**
 * Shop Main 4 Carousel
 * 카루셀 기능 구현
 * DOMContentLoaded + MutationObserver로 wakit 다이나믹 뷰에서도 동작
 */

(function() {
  'use strict';

  const INIT_ATTR = 'data-shop-main-4-carousel-initialized';
  let currentAutoSlideRef = { start: null, stop: null };

  function init(carousel) {
    if (!carousel || carousel.getAttribute(INIT_ATTR) === '1') return;

    const slides = carousel.querySelectorAll('.shop-main-4__carousel-slide');
    const prevBtn = carousel.querySelector('.shop-main-4__carousel-arrow--prev');
    const nextBtn = carousel.querySelector('.shop-main-4__carousel-arrow--next');
    const indicators = carousel.querySelectorAll('.shop-main-4__carousel-indicator');

    if (!slides.length || !indicators.length) return;

    let currentSlide = 0;
    const totalSlides = slides.length;
    let autoSlideInterval;
    let isTransitioning = false;

    const statusText = carousel.querySelector('.shop-main-4__carousel-status-text');

    /**
     * 슬라이드 전환 함수
     */
    function goToSlide(index) {
      if (isTransitioning) return;

      if (index < 0) {
        index = totalSlides - 1;
      } else if (index >= totalSlides) {
        index = 0;
      }

      isTransitioning = true;

      slides[currentSlide].classList.remove('shop-main-4__carousel-slide--active');
      indicators[currentSlide].classList.remove('shop-main-4__carousel-indicator--active');

      currentSlide = index;

      slides[currentSlide].classList.add('shop-main-4__carousel-slide--active');
      indicators[currentSlide].classList.add('shop-main-4__carousel-indicator--active');

      if (statusText) {
        statusText.textContent = `슬라이드 ${currentSlide + 1} / ${totalSlides}`;
      }

      setTimeout(() => {
        isTransitioning = false;
      }, 500);
    }

    function prevSlide() {
      goToSlide(currentSlide - 1);
      resetAutoSlide();
    }

    function nextSlide() {
      goToSlide(currentSlide + 1);
      resetAutoSlide();
    }

    function startAutoSlide() {
      autoSlideInterval = setInterval(() => {
        nextSlide();
      }, 5000);
    }

    function stopAutoSlide() {
      if (autoSlideInterval) {
        clearInterval(autoSlideInterval);
        autoSlideInterval = null;
      }
    }

    function resetAutoSlide() {
      stopAutoSlide();
      startAutoSlide();
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        prevSlide();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        nextSlide();
      });
    }

    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', (e) => {
        e.preventDefault();
        goToSlide(index);
        resetAutoSlide();
      });
    });

    carousel.addEventListener('mouseenter', stopAutoSlide);
    carousel.addEventListener('mouseleave', startAutoSlide);

    let touchStartX = 0;
    let touchEndX = 0;

    carousel.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      stopAutoSlide();
    }, { passive: true });

    carousel.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      if (touchEndX < touchStartX - 50) nextSlide();
      if (touchEndX > touchStartX + 50) prevSlide();
      startAutoSlide();
    }, { passive: true });

    startAutoSlide();
    currentAutoSlideRef.start = startAutoSlide;
    currentAutoSlideRef.stop = stopAutoSlide;

    carousel.setAttribute(INIT_ATTR, '1');
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && currentAutoSlideRef.stop) currentAutoSlideRef.stop();
    else if (!document.hidden && currentAutoSlideRef.start) currentAutoSlideRef.start();
  });

  function run() {
    const carousel = document.querySelector('.shop-main-4__carousel');
    if (carousel) init(carousel);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  const observer = new MutationObserver(run);
  observer.observe(document.body, { childList: true, subtree: true });
})();
