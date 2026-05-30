/**
 * Shop Detail 3
 * 프로덕트 이미지 반응형 위치 이동, 제품/과정 캐러셀 스크롤
 * DOMContentLoaded + MutationObserver로 wakit 다이나믹 뷰에서도 동작
 */

(function() {
  'use strict';

  var ATTR_CAROUSEL = 'data-shop-detail-3-carousel-initialized';
  var SCROLL_AMOUNT_MOBILE = 382;
  var SCROLL_AMOUNT_DESKTOP = 408;

  function runReorganizeImages() {
    var root = document.querySelector('.shop-detail-3');
    if (!root) return;
    var wrapper = root.querySelector('.product-detail__wrapper');
    var productImagesList = root.querySelector('.product-images-list');
    var productInfoContainer = root.querySelector('.product-info-container');
    if (!wrapper || !productImagesList || !productInfoContainer) return;

    var state = wrapper._shopDetail3ImagesState;
    if (!state) state = { isMobile: null, firstImageItem: null, remainingImagesList: null };
    wrapper._shopDetail3ImagesState = state;

    var currentIsMobile = window.innerWidth < 1025;

    if (currentIsMobile && !state.isMobile) {
      var imageItems = productImagesList.querySelectorAll('.product-image-item');
      if (imageItems.length > 0) {
        state.firstImageItem = imageItems[0];
        state.firstImageItem.classList.add('product-image-first');
        wrapper.insertBefore(state.firstImageItem, productImagesList);
        state.remainingImagesList = document.createElement('div');
        state.remainingImagesList.className = 'product-images-remaining';
        for (var i = 1; i < imageItems.length; i++) {
          state.remainingImagesList.appendChild(imageItems[i]);
        }
        productInfoContainer.insertAdjacentElement('afterend', state.remainingImagesList);
        productImagesList.style.display = 'none';
      }
      state.isMobile = true;
    } else if (!currentIsMobile && state.isMobile) {
      if (state.firstImageItem) {
        state.firstImageItem.classList.remove('product-image-first');
        productImagesList.insertBefore(state.firstImageItem, productImagesList.firstChild);
        state.firstImageItem = null;
      }
      if (state.remainingImagesList) {
        while (state.remainingImagesList.firstChild) {
          productImagesList.appendChild(state.remainingImagesList.firstChild);
        }
        state.remainingImagesList.remove();
        state.remainingImagesList = null;
      }
      productImagesList.style.display = 'flex';
      state.isMobile = false;
    } else if (state.isMobile === null) {
      state.isMobile = currentIsMobile;
      if (currentIsMobile) {
        var imageItems = productImagesList.querySelectorAll('.product-image-item');
        if (imageItems.length > 0) {
          state.firstImageItem = imageItems[0];
          state.firstImageItem.classList.add('product-image-first');
          wrapper.insertBefore(state.firstImageItem, productImagesList);
          state.remainingImagesList = document.createElement('div');
          state.remainingImagesList.className = 'product-images-remaining';
          for (var j = 1; j < imageItems.length; j++) {
            state.remainingImagesList.appendChild(imageItems[j]);
          }
          productInfoContainer.insertAdjacentElement('afterend', state.remainingImagesList);
          productImagesList.style.display = 'none';
        }
      }
    }
  }

  function initCarousel(section) {
    if (!section || section.getAttribute(ATTR_CAROUSEL) === '1') return;
    var buttons = section.querySelectorAll('.carousel-btn[data-carousel]');
    if (!buttons.length) return;

    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function(e) {
        e.preventDefault();
        var carouselId = this.getAttribute('data-carousel');
        var scrollContainer = document.getElementById(carouselId);
        if (!scrollContainer) return;
        var isMobile = window.innerWidth < 1025;
        var amount = isMobile ? SCROLL_AMOUNT_MOBILE : SCROLL_AMOUNT_DESKTOP;
        var isPrev = this.classList.contains('carousel-btn--prev');
        var scrollDirection = isPrev ? -amount : amount;
        scrollContainer.scrollBy({ left: scrollDirection, behavior: 'smooth' });
      });
    }
    section.setAttribute(ATTR_CAROUSEL, '1');
  }

  function run() {
    var root = document.querySelector('.shop-detail-3');
    if (!root) return;

    runReorganizeImages();

    var productCarouselSection = root.querySelector('.product-carousel-section');
    if (productCarouselSection) initCarousel(productCarouselSection);

    var processCarouselSection = root.querySelector('.process-carousel-section');
    if (processCarouselSection) initCarousel(processCarouselSection);
  }

  function scheduleRun() {
    if (scheduleRun._timer) clearTimeout(scheduleRun._timer);
    scheduleRun._timer = setTimeout(function() {
      scheduleRun._timer = null;
      run();
    }, 50);
  }

  function start() {
    run();
    var body = document.body;
    if (body && !body._shopDetail3ObserverAttached) {
      body._shopDetail3ObserverAttached = true;
      var mo = new MutationObserver(scheduleRun);
      mo.observe(body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') scheduleRun();
  });

  var resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(runReorganizeImages, 100);
  });
})();
