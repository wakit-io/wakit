/**
 * Shop Detail 1
 * 제품 이미지 썸네일, 상세정보 펼쳐보기, 캐러셀, 탭 스크롤 연동
 * DOMContentLoaded + MutationObserver로 wakit 다이나믹 뷰에서도 동작
 */

(function() {
  'use strict';

  const ATTR_THUMBNAILS = 'data-shop-detail-1-thumbnails-initialized';
  const ATTR_EXPAND = 'data-shop-detail-1-expand-initialized';
  const ATTR_CAROUSEL = 'data-shop-detail-1-carousel-initialized';
  const ATTR_INSTAGRAM = 'data-shop-detail-1-instagram-initialized';
  const ATTR_TABS = 'data-shop-detail-1-tabs-initialized';
  const ATTR_BUY = 'data-shop-detail-1-buy-initialized';
  const PAYMENT_HASH = 'views/shop-payment-1.html';

  var AUTO_SLIDE_INTERVAL = 4000;

  function initThumbnails(container) {
    if (!container || container.getAttribute(ATTR_THUMBNAILS) === '1') return;
    var mainImage = container.querySelector('#mainProductImage') || document.getElementById('mainProductImage');
    var thumbnails = container.querySelectorAll('.product-images__thumbnail');
    if (!mainImage || thumbnails.length === 0) return;

    var autoSlideTimer = null;

    function showImage(index) {
      var thumb = thumbnails[index];
      if (!thumb) return;
      var imageUrl = thumb.getAttribute('data-image');
      if (!imageUrl) return;
      mainImage.style.opacity = '0';
      mainImage.style.transition = 'opacity 0.3s ease';
      setTimeout(function() {
        mainImage.src = imageUrl;
        mainImage.style.opacity = '1';
      }, 150);
      thumbnails.forEach(function(t) { t.classList.remove('active'); });
      thumb.classList.add('active');
    }

    function advanceToNext() {
      var currentIndex = 0;
      thumbnails.forEach(function(t, i) {
        if (t.classList.contains('active')) currentIndex = i;
      });
      var nextIndex = (currentIndex + 1) % thumbnails.length;
      showImage(nextIndex);
    }

    function startAutoSlide() {
      stopAutoSlide();
      autoSlideTimer = setInterval(advanceToNext, AUTO_SLIDE_INTERVAL);
    }

    function stopAutoSlide() {
      if (autoSlideTimer) {
        clearInterval(autoSlideTimer);
        autoSlideTimer = null;
      }
    }

    thumbnails.forEach(function(thumbnail) {
      thumbnail.addEventListener('click', function(e) {
        e.preventDefault();
        var imageUrl = this.getAttribute('data-image');
        if (!imageUrl) return;
        stopAutoSlide();
        mainImage.style.opacity = '0';
        mainImage.style.transition = 'opacity 0.3s ease';
        setTimeout(function() {
          mainImage.src = imageUrl;
          mainImage.style.opacity = '1';
        }, 150);
        thumbnails.forEach(function(thumb) { thumb.classList.remove('active'); });
        this.classList.add('active');
        startAutoSlide();
      });
    });

    container.addEventListener('mouseenter', stopAutoSlide);
    container.addEventListener('mouseleave', startAutoSlide);

    startAutoSlide();
    container.setAttribute(ATTR_THUMBNAILS, '1');
  }

  function initExpand(container) {
    if (!container || container.getAttribute(ATTR_EXPAND) === '1') return;
    var expandButton = container.querySelector('#expandButton') || document.getElementById('expandButton');
    var expandableContent = container.querySelector('#expandableContent') || document.getElementById('expandableContent');
    if (!expandButton || !expandableContent) return;

    expandButton.addEventListener('click', function(e) {
      e.preventDefault();
      var isExpanded = expandableContent.classList.contains('active');
      if (isExpanded) {
        expandableContent.classList.remove('active');
        expandButton.classList.remove('expanded');
        var textEl = expandButton.querySelector('.expand-text');
        if (textEl) textEl.textContent = '상세정보 펼쳐보기';
        setTimeout(function() {
          expandButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      } else {
        expandableContent.classList.add('active');
        expandButton.classList.add('expanded');
        var textEl = expandButton.querySelector('.expand-text');
        if (textEl) textEl.textContent = '상세정보 접기';
        setTimeout(function() {
          expandableContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    });
    container.setAttribute(ATTR_EXPAND, '1');
  }

  function initCarousel(section) {
    if (!section || section.getAttribute(ATTR_CAROUSEL) === '1') return;
    var buttons = section.querySelectorAll('.carousel-btn[data-carousel]');
    if (!buttons.length) return;

    buttons.forEach(function(button) {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        var carouselId = this.getAttribute('data-carousel');
        var scrollContainer = document.getElementById(carouselId);
        if (!scrollContainer) return;
        var scrollAmount = 140;
        var dataAmount = scrollContainer.getAttribute('data-scroll-amount');
        if (dataAmount) { var n = parseInt(dataAmount, 10); if (!isNaN(n)) scrollAmount = n; }
        var isPrev = this.classList.contains('carousel-btn--prev');
        var scrollDirection = isPrev ? -scrollAmount : scrollAmount;
        scrollContainer.scrollBy({ left: scrollDirection, behavior: 'smooth' });
      });
    });
    section.setAttribute(ATTR_CAROUSEL, '1');
  }

  function initInstagram(root) {
    if (!root || root.getAttribute(ATTR_INSTAGRAM) === '1') return;
    var instagramCarousel = root.querySelector('#instagram-gallery') || document.getElementById('instagram-gallery');
    var prevButton = root.querySelector('.instagram-carousel-btn--prev');
    var nextButton = root.querySelector('.instagram-carousel-btn--next');
    if (!instagramCarousel || !prevButton || !nextButton) return;

    var scrollAmount = 318;
    prevButton.addEventListener('click', function(e) {
      e.preventDefault();
      instagramCarousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });
    nextButton.addEventListener('click', function(e) {
      e.preventDefault();
      instagramCarousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
    root.setAttribute(ATTR_INSTAGRAM, '1');
  }

  function initTabs(mainEl) {
    if (!mainEl) return;
    var tabLinks = mainEl.querySelectorAll('.product-tab');
    if (tabLinks.length === 0) return;
    if (tabLinks[0].getAttribute(ATTR_TABS) === '1') return;

    var prevObserver = mainEl._shopDetail1TabsObserver;
    if (prevObserver) {
      prevObserver.disconnect();
      mainEl._shopDetail1TabsObserver = null;
    }

    var stickyOffset = mainEl.closest && mainEl.closest('.dynamic-view') ? 50 : 119;
    var observerOptions = { root: null, rootMargin: '-' + stickyOffset + 'px 0px -50% 0px', threshold: 0 };
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        var sectionId = entry.target.id;
        var links = mainEl.querySelectorAll('.product-tab');
        links.forEach(function(link) { link.classList.remove('active'); });
        links.forEach(function(link) {
          if (link.getAttribute('data-section') === sectionId) link.classList.add('active');
        });
      });
    }, observerOptions);
    mainEl._shopDetail1TabsObserver = observer;

    var sectionIds = ['detail-content', 'review-content', 'qa-content', 'return-content'];
    sectionIds.forEach(function(id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    tabLinks.forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        var targetId = this.getAttribute('data-section');
        if (!targetId) return;
        var targetSection = document.getElementById(targetId);
        if (!targetSection) return;
        var links = mainEl.querySelectorAll('.product-tab');
        links.forEach(function(tab) { tab.classList.remove('active'); });
        this.classList.add('active');
        /* 해시 없이 이동만 (wakit 모바일에서 URL 꼬임 방지), scroll-margin-top으로 여백 적용 */
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    tabLinks[0].setAttribute(ATTR_TABS, '1');
  }

  function formDataToObject(form) {
    if (!form) return {};
    var fd = new FormData(form);
    var obj = {};
    fd.forEach(function(value, key) {
      if (obj[key] !== undefined) {
        if (!Array.isArray(obj[key])) obj[key] = [obj[key]];
        obj[key].push(value);
      } else {
        obj[key] = value;
      }
    });
    return obj;
  }

  /**
   * 바로 구매: 서버 비동기 호출 후 해시로 이동 (wakit 흐름 유지)
   */
  function initBuyButton(root) {
    if (!root || root.getAttribute(ATTR_BUY) === '1') return;
    var btn = root.querySelector('.btn-buy');
    if (!btn) return;
    var form = btn.closest('form');
    if (!form) return;

    btn.addEventListener('click', function(e) {
      e.preventDefault();
      var formData = formDataToObject(form);
      var apiUrl = form.getAttribute('data-buy-api');
      var query = Object.keys(formData).filter(function(k) { return formData[k]; }).map(function(k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(formData[k]);
      }).join('&');
      var hashTarget = PAYMENT_HASH + (query ? '?' + query : '');

      function goPayment() {
        location.hash = '#' + hashTarget;
      }

      if (apiUrl && apiUrl.trim() && typeof fetch === 'function') {
        btn.disabled = true;
        fetch(apiUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        }).then(function(res) {
          return res.ok ? Promise.resolve() : Promise.reject(new Error('request failed'));
        }).then(goPayment).catch(goPayment).finally(function() {
          btn.disabled = false;
        });
      } else {
        goPayment();
      }
    });

    root.setAttribute(ATTR_BUY, '1');
  }

  function run() {
    var productImages = document.querySelector('.shop-detail-1 .product-images');
    if (productImages) initThumbnails(productImages);

    var expandRoot = document.querySelector('.shop-detail-1 .detail-gallery');
    if (expandRoot) initExpand(expandRoot);

    var carouselSections = document.querySelectorAll('.shop-detail-1 .related-products-section');
    carouselSections.forEach(function(section) { initCarousel(section); });
    var photoReviewsSection = document.querySelector('.shop-detail-1 .photo-reviews');
    if (photoReviewsSection) initCarousel(photoReviewsSection);

    var instagramSection = document.querySelector('.shop-detail-1 .instagram-section');
    if (instagramSection) initInstagram(instagramSection);

    var mainEl = document.querySelector('.shop-detail-1');
    if (mainEl) {
      initTabs(mainEl);
      initBuyButton(mainEl);
    }
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
    if (body && !body._shopDetail1ObserverAttached) {
      body._shopDetail1ObserverAttached = true;
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
})();
