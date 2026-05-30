/**
 * Shop Main 5 Ad Banner Carousel
 * 광고 배너 캐러셀 기능 구현
 * DOMContentLoaded + MutationObserver로 wakit 다이나믹 뷰에서도 동작
 */

(function() {
  'use strict';

  const AD_BANNER_INIT_ATTR = 'data-shop-main-5-ad-banner-initialized';
  let currentAdAutoSlideRef = { start: null, stop: null };

  function initAdBanner(adBanner) {
    if (!adBanner || adBanner.getAttribute(AD_BANNER_INIT_ATTR) === '1') return;

    const slides = adBanner.querySelectorAll('.shop-main-5__ad-banner-slide');
    const indicators = adBanner.querySelectorAll('.shop-main-5__ad-banner-indicator');
    if (!slides.length || !indicators.length) return;

    let currentSlide = 0;
    const totalSlides = slides.length;
    let autoSlideInterval;
    let isTransitioning = false;
    const statusText = adBanner.querySelector('.shop-main-5__ad-banner-status-text');

    function goToSlide(index) {
      if (isTransitioning) return;
      if (index < 0) index = totalSlides - 1;
      else if (index >= totalSlides) index = 0;
      isTransitioning = true;

      slides[currentSlide].classList.remove('shop-main-5__ad-banner-slide--active');
      indicators[currentSlide].classList.remove('shop-main-5__ad-banner-indicator--active');
      indicators[currentSlide].setAttribute('aria-selected', 'false');
      indicators[currentSlide].setAttribute('tabindex', '-1');

      currentSlide = index;

      slides[currentSlide].classList.add('shop-main-5__ad-banner-slide--active');
      indicators[currentSlide].classList.add('shop-main-5__ad-banner-indicator--active');
      indicators[currentSlide].setAttribute('aria-selected', 'true');
      indicators[currentSlide].setAttribute('tabindex', '0');

      if (statusText) statusText.textContent = `슬라이드 ${currentSlide + 1} / ${totalSlides}`;
      setTimeout(() => { isTransitioning = false; }, 500);
    }

    function nextSlide() {
      goToSlide(currentSlide + 1);
      resetAutoSlide();
    }

    function startAutoSlide() {
      autoSlideInterval = setInterval(nextSlide, 5000);
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

    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', (e) => {
        e.preventDefault();
        goToSlide(index);
        resetAutoSlide();
      });
    });

    adBanner.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        goToSlide(currentSlide - 1);
        resetAutoSlide();
      } else if (e.key === 'ArrowRight') nextSlide();
    });

    adBanner.addEventListener('mouseenter', stopAutoSlide);
    adBanner.addEventListener('mouseleave', startAutoSlide);

    let touchStartX = 0, touchEndX = 0;
    adBanner.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      stopAutoSlide();
    }, { passive: true });
    adBanner.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) nextSlide();
        else { goToSlide(currentSlide - 1); resetAutoSlide(); }
      }
      startAutoSlide();
    }, { passive: true });

    adBanner.querySelectorAll('.shop-main-5__ad-banner-image-img').forEach((img) => {
      const placeholder = img.nextElementSibling;
      if (!placeholder || !placeholder.classList.contains('shop-main-5__ad-banner-image-placeholder')) return;
      if (img.complete && img.naturalHeight !== 0) placeholder.style.display = 'none';
      else {
        img.addEventListener('load', () => { placeholder.style.display = 'none'; });
        img.addEventListener('error', () => { placeholder.style.display = 'block'; });
      }
    });

    startAutoSlide();
    currentAdAutoSlideRef.start = startAutoSlide;
    currentAdAutoSlideRef.stop = stopAutoSlide;
    adBanner.setAttribute(AD_BANNER_INIT_ATTR, '1');
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && currentAdAutoSlideRef.stop) currentAdAutoSlideRef.stop();
    else if (!document.hidden && currentAdAutoSlideRef.start) currentAdAutoSlideRef.start();
  });

  function runAdBanner() {
    const el = document.querySelector('.shop-main-5__ad-banner');
    if (el) initAdBanner(el);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAdBanner);
  } else {
    runAdBanner();
  }

  const observer = new MutationObserver(runAdBanner);
  observer.observe(document.body, { childList: true, subtree: true });
})();

/**
 * Shop Main 5 Products Carousel
 * 상품 캐러셀 기능 구현
 * DOMContentLoaded + MutationObserver로 wakit 다이나믹 뷰에서도 동작
 */

(function() {
  'use strict';

  const PRODUCTS_INIT_ATTR = 'data-shop-main-5-products-initialized';

  function initProducts(productsSection) {
    if (!productsSection || productsSection.getAttribute(PRODUCTS_INIT_ATTR) === '1') return;

    const productsList = productsSection.querySelector('.shop-main-5__products-list');
    const prevBtn = productsSection.querySelector('.shop-main-5__products-arrow--prev');
    const nextBtn = productsSection.querySelector('.shop-main-5__products-arrow--next');
    const productsItems = productsSection.querySelectorAll('.shop-main-5__products-item');

    if (!productsList || !productsItems.length) return;

    let currentIndex = 0;
    const totalItems = productsItems.length;
    let itemsPerView = 3;
    let autoSlideInterval;

    function updateItemsPerView() {
      const isMobile = window.innerWidth <= 768;
      itemsPerView = isMobile ? 2 : 3;
      updateCarousel();
    }

    function updateCarousel() {
      if (!productsItems.length) return;
      const firstItem = productsItems[0];
      if (!firstItem) return;
      const itemWidth = firstItem.offsetWidth;
      const computedStyle = window.getComputedStyle(productsList);
      const gap = parseFloat(computedStyle.gap) || parseFloat(computedStyle.columnGap) || 0;
      const maxIndex = Math.max(0, totalItems - itemsPerView);
      currentIndex = Math.min(currentIndex, maxIndex);
      const translateX = -(currentIndex * (itemWidth + gap));
      productsList.style.transform = `translateX(${translateX}px)`;
      if (prevBtn) {
        prevBtn.disabled = currentIndex === 0;
        prevBtn.style.opacity = currentIndex === 0 ? '0.3' : '0.5';
      }
      if (nextBtn) {
        nextBtn.disabled = currentIndex >= maxIndex;
        nextBtn.style.opacity = currentIndex >= maxIndex ? '0.3' : '0.5';
      }
    }

    function nextSlide() {
      const maxIndex = Math.max(0, totalItems - itemsPerView);
      if (currentIndex < maxIndex) {
        currentIndex++;
      } else {
        currentIndex = 0; // 맨 끝에서 다시 처음으로
      }
      updateCarousel();
    }

    function prevSlide() {
      if (currentIndex > 0) {
        currentIndex--;
        updateCarousel();
      }
    }

    function startAutoSlide() {
      autoSlideInterval = setInterval(nextSlide, 5000); // 5초마다 자동 전환
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

    const carouselEl = productsSection.querySelector('.shop-main-5__products-carousel');
    if (carouselEl) {
      carouselEl.addEventListener('mouseenter', stopAutoSlide);
      carouselEl.addEventListener('mouseleave', startAutoSlide);
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!prevBtn.disabled) {
          prevSlide();
          resetAutoSlide();
        }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!nextBtn.disabled) {
          nextSlide();
          resetAutoSlide();
        }
      });
    }

    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateItemsPerView, 250);
    });

    let touchStartX = 0, touchEndX = 0;
    productsSection.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    productsSection.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) nextSlide();
        else prevSlide();
        resetAutoSlide();
      }
    }, { passive: true });

    productsSection.querySelectorAll('.shop-main-5__products-image-img').forEach((img) => {
      const placeholder = img.nextElementSibling;
      if (!placeholder || !placeholder.classList.contains('shop-main-5__products-image-placeholder')) return;
      if (img.complete && img.naturalHeight !== 0) placeholder.style.display = 'none';
      else {
        img.addEventListener('load', () => { placeholder.style.display = 'none'; });
        img.addEventListener('error', () => { placeholder.style.display = 'block'; });
      }
    });

    updateItemsPerView();
    startAutoSlide();
    productsSection.setAttribute(PRODUCTS_INIT_ATTR, '1');
  }

  function runProducts() {
    const el = document.querySelector('.shop-main-5__products-section');
    if (el) initProducts(el);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(runProducts, 100));
  } else {
    setTimeout(runProducts, 100);
  }

  const observer = new MutationObserver(runProducts);
  observer.observe(document.body, { childList: true, subtree: true });
})();

/**
 * Shop Main 5 Popular Products
 * 인기 상품 이미지 로딩 체크
 */

(function() {
  'use strict';

  const popularSection = document.querySelector('.shop-main-5__popular-section');
  if (!popularSection) return;

  // 이미지 로딩 체크
  const images = popularSection.querySelectorAll('.shop-main-5__popular-image-img');
  images.forEach((img) => {
    const placeholder = img.nextElementSibling;
    if (!placeholder || !placeholder.classList.contains('shop-main-5__popular-image-placeholder')) return;

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
})();

/**
 * Shop Main 5 Category Chips
 * 카테고리 칩 이미지 로딩 체크
 */

(function() {
  'use strict';

  const categorySection = document.querySelector('.shop-main-5__category-section');
  if (!categorySection) return;

  // 이미지 로딩 체크
  const images = categorySection.querySelectorAll('.shop-main-5__category-image-img');
  images.forEach((img) => {
    const placeholder = img.nextElementSibling;
    if (!placeholder || !placeholder.classList.contains('shop-main-5__category-image-placeholder')) return;

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
})();

/**
 * Shop Main 5 Category Text
 * 카테고리 텍스트 섹션 이미지 로딩 체크
 */

(function() {
  'use strict';

  const categoryTextSection = document.querySelector('.shop-main-5__category-text-section');
  if (!categoryTextSection) return;

  // 이미지 로딩 체크
  const images = categoryTextSection.querySelectorAll('.shop-main-5__category-text-image-img');
  images.forEach((img) => {
    const placeholder = img.nextElementSibling;
    if (!placeholder || !placeholder.classList.contains('shop-main-5__category-text-image-placeholder')) return;

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
})();

/**
 * Shop Main 5 New Updates
 * 신상 업데이트 섹션 이미지 로딩 체크
 */

(function() {
  'use strict';

  const newUpdatesSection = document.querySelector('.shop-main-5__new-updates-section');
  if (!newUpdatesSection) return;

  // 이미지 로딩 체크
  const images = newUpdatesSection.querySelectorAll('.shop-main-5__new-updates-image-img');
  images.forEach((img) => {
    const placeholder = img.nextElementSibling;
    if (!placeholder || !placeholder.classList.contains('shop-main-5__new-updates-image-placeholder')) return;

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
})();

/**
 * Shop Main 5 Brand Section
 * 봄옷 신규 브랜드 섹션 이미지 로딩 체크
 */

(function() {
  'use strict';

  const brandSection = document.querySelector('.shop-main-5__brand-section');
  if (!brandSection) return;

  // 큰 이미지 로딩 체크
  const mainImage = brandSection.querySelector('.shop-main-5__brand-image-img');
  if (mainImage) {
    const placeholder = mainImage.nextElementSibling;
    if (placeholder && placeholder.classList.contains('shop-main-5__brand-image-placeholder')) {
      function checkImageLoad() {
        if (mainImage.complete && mainImage.naturalHeight !== 0) {
          placeholder.style.display = 'none';
        } else {
          mainImage.addEventListener('load', () => {
            placeholder.style.display = 'none';
          });
          mainImage.addEventListener('error', () => {
            placeholder.style.display = 'block';
          });
        }
      }
      checkImageLoad();
    }
  }

  // 제품 이미지 로딩 체크
  const productImages = brandSection.querySelectorAll('.shop-main-5__brand-product-image-img');
  productImages.forEach((img) => {
    const placeholder = img.nextElementSibling;
    if (!placeholder || !placeholder.classList.contains('shop-main-5__brand-product-image-placeholder')) return;

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
})();
