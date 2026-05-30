/**
 * Shop List 1 Page Scripts
 * 인기 할인 상품 섹션 캐러셀 및 이미지 로딩 체크
 * DOMContentLoaded + MutationObserver로 wakit 다이나믹 뷰에서도 동작
 */

(function() {
  'use strict';

  const INIT_ATTR = 'data-shop-list-1-products-initialized';

  function init(productsSection) {
    if (!productsSection || productsSection.getAttribute(INIT_ATTR) === '1') return;

    const productsList = productsSection.querySelector('.shop-list-1__products-list');
    const productsItems = productsSection.querySelectorAll('.shop-list-1__product-item');
    const prevButton = productsSection.querySelector('.shop-list-1__products-arrow--prev');
    const nextButton = productsSection.querySelector('.shop-list-1__products-arrow--next');

    if (!productsList || !productsItems.length) return;

    let currentIndex = 0;
    let itemsPerView = 4;
    let isMobile = window.innerWidth <= 768;
    let autoSlideTimer = null;
    const AUTO_SLIDE_INTERVAL = 5000; /* 5초 */

    function updateItemsPerView() {
      isMobile = window.innerWidth <= 768;
      itemsPerView = isMobile ? 1 : 4;
      updateCarousel();
    }

    function updateCarousel() {
      if (!productsList || !productsItems.length) return;
      const firstItem = productsItems[0];
      if (!firstItem) return;

      const computedStyle = window.getComputedStyle(productsList);
      const itemWidth = firstItem.offsetWidth;
      const gap = parseFloat(computedStyle.gap) || parseFloat(computedStyle.columnGap) || 0;
      const maxIndex = Math.max(0, productsItems.length - itemsPerView);
      currentIndex = Math.max(0, Math.min(currentIndex, maxIndex));
      const translateX = -(currentIndex * (itemWidth + gap));

      productsList.style.transform = `translateX(${translateX}px)`;
      productsList.style.transition = 'transform 0.3s ease';

      if (prevButton) prevButton.disabled = currentIndex === 0;
      if (nextButton) nextButton.disabled = currentIndex >= maxIndex;
    }

    function nextSlide() {
      const maxIndex = Math.max(0, productsItems.length - itemsPerView);
      if (currentIndex < maxIndex) {
        currentIndex++;
        updateCarousel();
      }
    }

    function prevSlide() {
      if (currentIndex > 0) {
        currentIndex--;
        updateCarousel();
      }
    }

    function advanceAutoSlide() {
      const maxIndex = Math.max(0, productsItems.length - itemsPerView);
      if (maxIndex <= 0) return;
      if (currentIndex >= maxIndex) {
        currentIndex = 0;
      } else {
        currentIndex++;
      }
      updateCarousel();
    }

    function startAutoSlide() {
      stopAutoSlide();
      autoSlideTimer = setInterval(advanceAutoSlide, AUTO_SLIDE_INTERVAL);
    }

    function stopAutoSlide() {
      if (autoSlideTimer) {
        clearInterval(autoSlideTimer);
        autoSlideTimer = null;
      }
    }

    if (prevButton) prevButton.addEventListener('click', () => { stopAutoSlide(); prevSlide(); startAutoSlide(); });
    if (nextButton) nextButton.addEventListener('click', () => { stopAutoSlide(); nextSlide(); startAutoSlide(); });

    /* 호버 시 오토 슬라이드 일시 정지 */
    productsSection.addEventListener('mouseenter', stopAutoSlide);
    productsSection.addEventListener('mouseleave', startAutoSlide);

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        updateItemsPerView();
        startAutoSlide();
      }, 100);
    });

    updateItemsPerView();
    startAutoSlide();

    productsSection.querySelectorAll('.shop-list-1__product-image-img').forEach((img) => {
      const placeholder = img.nextElementSibling;
      if (!placeholder || !placeholder.classList.contains('shop-list-1__product-image-placeholder')) return;
      if (img.complete && img.naturalHeight !== 0) placeholder.style.display = 'none';
      else {
        img.addEventListener('load', () => { placeholder.style.display = 'none'; });
        img.addEventListener('error', () => { placeholder.style.display = 'block'; });
      }
    });

    productsSection.setAttribute(INIT_ATTR, '1');
  }

  function run() {
    const el = document.querySelector('.shop-list-1__products-section');
    if (el) init(el);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  const observer = new MutationObserver(run);
  observer.observe(document.body, { childList: true, subtree: true });
})();
