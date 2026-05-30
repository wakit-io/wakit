/**
 * Event List 2 배너 슬라이더
 * DOMContentLoaded + MutationObserver로 wakit 다이나믹 뷰에서도 동작
 */
(function () {
  'use strict';

  var DATA_INIT = 'data-event-list-2-initialized';

  function initSlider(slider) {
    if (!slider || slider.getAttribute(DATA_INIT) === '1') return;

    var banners = slider.querySelectorAll('.event-list-2__banner');
    var wrapper = slider.closest('.event-list-2__banner-wrapper');
    var indicators = wrapper ? wrapper.querySelectorAll('.event-list-2__indicator-dot') : [];

    if (banners.length === 0) return;

    var currentSlide = 0;
    var autoSlideInterval = null;

    function goToSlide(index) {
      if (index < 0 || index >= banners.length) return;

      banners.forEach(function (banner) {
        banner.classList.remove('event-list-2__banner--active');
      });
      indicators.forEach(function (indicator, i) {
        indicator.classList.remove('event-list-2__indicator-dot--active');
        indicator.removeAttribute('aria-current');
        if (i === index) indicator.setAttribute('aria-current', 'true');
      });

      banners[index].classList.add('event-list-2__banner--active');
      if (indicators[index]) indicators[index].classList.add('event-list-2__indicator-dot--active');
      currentSlide = index;
    }

    function startAutoSlide() {
      if (autoSlideInterval) clearInterval(autoSlideInterval);
      autoSlideInterval = setInterval(function () {
        goToSlide((currentSlide + 1) % banners.length);
      }, 5000);
    }

    function resetAutoSlide() {
      startAutoSlide();
    }

    indicators.forEach(function (indicator, index) {
      indicator.addEventListener('click', function () {
        goToSlide(index);
        resetAutoSlide();
      });
    });

    if (wrapper) {
      wrapper.addEventListener('mouseenter', function () {
        if (autoSlideInterval) {
          clearInterval(autoSlideInterval);
          autoSlideInterval = null;
        }
      });
      wrapper.addEventListener('mouseleave', startAutoSlide);
    }

    startAutoSlide();
    slider.setAttribute(DATA_INIT, '1');
  }

  function init(root) {
    root = root || document;
    var sliders = root.querySelectorAll('.event-list-2__banner-slider');
    sliders.forEach(initSlider);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); });
  } else {
    init();
  }

  var observer = new MutationObserver(function () {
    init();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
