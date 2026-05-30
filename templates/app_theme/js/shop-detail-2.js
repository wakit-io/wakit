/**
 * Shop Detail 2
 * 썸네일/자동 슬라이드, 상품 설명 탭, 모바일 이미지 리스트 이동, 관련 상품 캐러셀
 * DOMContentLoaded + MutationObserver로 wakit 다이나믹 뷰에서도 동작
 */

(function() {
  'use strict';

  var ATTR_THUMBNAILS = 'data-shop-detail-2-thumbnails-initialized';
  var ATTR_DESC_TABS = 'data-shop-detail-2-desc-tabs-initialized';
  var ATTR_CAROUSEL = 'data-shop-detail-2-carousel-initialized';

  var SLIDE_DURATION = 3000;

  function initThumbnails(root) {
    if (!root || root.getAttribute(ATTR_THUMBNAILS) === '1') return;
    var mainImage = root.querySelector('#mainProductImage') || document.getElementById('mainProductImage');
    var thumbnails = root.querySelectorAll('.product-thumbnail');
    if (!mainImage || thumbnails.length === 0) return;

    var currentIndex = 0;
    var slideInterval = null;

    function changeImage(index) {
      var thumb = thumbnails[index];
      if (!thumb) return;
      var imageUrl = thumb.getAttribute('data-image');
      if (!imageUrl) return;
      mainImage.src = imageUrl;
      for (var i = 0; i < thumbnails.length; i++) thumbnails[i].classList.remove('active');
      thumb.classList.add('active');
      currentIndex = index;
    }

    function nextImage() {
      currentIndex = (currentIndex + 1) % thumbnails.length;
      changeImage(currentIndex);
    }

    function startAutoSlide() {
      if (slideInterval) clearInterval(slideInterval);
      slideInterval = setInterval(nextImage, SLIDE_DURATION);
    }

    function stopAutoSlide() {
      if (slideInterval) {
        clearInterval(slideInterval);
        slideInterval = null;
      }
    }

    for (var i = 0; i < thumbnails.length; i++) {
      (function(idx) {
        thumbnails[idx].addEventListener('click', function() {
          stopAutoSlide();
          changeImage(idx);
          startAutoSlide();
        });
      })(i);
    }

    var productImageEl = root.querySelector('.product-image');
    if (productImageEl) {
      productImageEl.addEventListener('mouseenter', stopAutoSlide);
      productImageEl.addEventListener('mouseleave', startAutoSlide);
    }

    startAutoSlide();
    root._shopDetail2StopAutoSlide = stopAutoSlide;
    root._shopDetail2StartAutoSlide = startAutoSlide;
    root.setAttribute(ATTR_THUMBNAILS, '1');
  }

  function initDescriptionTabs(root) {
    if (!root || root.getAttribute(ATTR_DESC_TABS) === '1') return;
    var tabItems = root.querySelectorAll('.product-description-tabs .tab-item');
    var tabContents = root.querySelectorAll('.product-description-tabs .tab-content');
    if (tabItems.length === 0 || tabContents.length === 0) return;

    for (var i = 0; i < tabItems.length; i++) {
      tabItems[i].addEventListener('click', function() {
        var targetTab = this.getAttribute('data-tab');
        for (var j = 0; j < tabItems.length; j++) tabItems[j].classList.remove('active');
        this.classList.add('active');
        for (var k = 0; k < tabContents.length; k++) tabContents[k].classList.remove('active');
        var targetContent = root.querySelector('.product-description-tabs .tab-content[data-content="' + targetTab + '"]');
        if (targetContent) targetContent.classList.add('active');
      });
    }
    root.setAttribute(ATTR_DESC_TABS, '1');
  }

  function runImagesListMove() {
    var root = document.querySelector('.shop-detail-2');
    if (!root) return;
    var productImagesList = root.querySelector('.product-images-list');
    var productImagesColumn = root.querySelector('.product-images-column');
    var productForm = root.querySelector('.product-form');
    if (!productImagesList || !productImagesColumn || !productForm) return;

    var currentIsMobile = window.innerWidth < 1025;
    var wasMobile = productImagesList._shopDetail2WasMobile;

    if (currentIsMobile && !wasMobile) {
      productForm.insertAdjacentElement('afterend', productImagesList);
      productImagesList._shopDetail2WasMobile = true;
    } else if (!currentIsMobile && wasMobile) {
      productImagesColumn.appendChild(productImagesList);
      productImagesList._shopDetail2WasMobile = false;
    } else if (typeof wasMobile === 'undefined') {
      productImagesList._shopDetail2WasMobile = currentIsMobile;
      if (currentIsMobile) productForm.insertAdjacentElement('afterend', productImagesList);
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
        var scrollAmount = isMobile ? 136 : 306;
        var isPrev = this.classList.contains('carousel-btn--prev');
        var scrollDirection = isPrev ? -scrollAmount : scrollAmount;
        scrollContainer.scrollBy({ left: scrollDirection, behavior: 'smooth' });
      });
    }
    section.setAttribute(ATTR_CAROUSEL, '1');
  }

  function run() {
    var root = document.querySelector('.shop-detail-2');
    if (!root) return;

    var wrapper = root.querySelector('.product-images-wrapper');
    if (wrapper) initThumbnails(wrapper);

    var descTabs = root.querySelector('.product-description-tabs');
    if (descTabs) initDescriptionTabs(descTabs);

    runImagesListMove();

    var carouselSections = root.querySelectorAll('.related-products-section');
    for (var i = 0; i < carouselSections.length; i++) initCarousel(carouselSections[i]);
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
    if (body && !body._shopDetail2ObserverAttached) {
      body._shopDetail2ObserverAttached = true;
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
    if (document.hidden) {
      var w = document.querySelector('.shop-detail-2 .product-images-wrapper');
      if (w && w._shopDetail2StopAutoSlide) w._shopDetail2StopAutoSlide();
    } else {
      scheduleRun();
      var w = document.querySelector('.shop-detail-2 .product-images-wrapper');
      if (w && w._shopDetail2StartAutoSlide) w._shopDetail2StartAutoSlide();
    }
  });

  var resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(runImagesListMove, 100);
  });
})();
