/**
 * Event Detail 2 - 썸네일 이미지 전환, FAQ 아코디언
 * DOMContentLoaded + MutationObserver로 wakit 다이나믹 뷰에서도 동작
 */
(function () {
  'use strict';

  var DATA_THUMB_INIT = 'data-event-detail-2-thumbnails-initialized';
  var DATA_FAQ_INIT = 'data-event-detail-2-faq-initialized';

  function initThumbnails(root) {
    root = root || document;
    var sections = root.querySelectorAll('.event-detail-2__image-section');
    sections.forEach(function (section) {
      if (section.getAttribute(DATA_THUMB_INIT) === '1') return;

      var mainImage = section.querySelector('#event-detail-2-main-image');
      var thumbnails = section.querySelectorAll('.event-detail-2__thumbnail');

      if (!mainImage || thumbnails.length === 0) return;

      if (thumbnails[0]) thumbnails[0].classList.add('event-detail-2__thumbnail--active');

      thumbnails.forEach(function (thumbnail) {
        thumbnail.addEventListener('click', function () {
          var mainImageUrl = thumbnail.getAttribute('data-main-image');
          if (!mainImageUrl) return;
          mainImage.src = mainImageUrl;
          thumbnails.forEach(function (t) { t.classList.remove('event-detail-2__thumbnail--active'); });
          thumbnail.classList.add('event-detail-2__thumbnail--active');
        });
      });

      section.setAttribute(DATA_THUMB_INIT, '1');
    });
  }

  function initFaq(root) {
    root = root || document;
    var faqSections = root.querySelectorAll('.event-detail-2__faq-section');
    faqSections.forEach(function (section) {
      if (section.getAttribute(DATA_FAQ_INIT) === '1') return;

      var faqItems = section.querySelectorAll('.event-detail-2__faq-item');

      faqItems.forEach(function (item) {
        var header = item.querySelector('.event-detail-2__faq-header');
        var icon = item.querySelector('.event-detail-2__faq-icon');
        if (!header || !icon) return;

        header.addEventListener('click', function () {
          var isExpanded = item.classList.contains('event-detail-2__faq-item--expanded');

          faqItems.forEach(function (other) {
            if (other !== item) {
              other.classList.remove('event-detail-2__faq-item--expanded');
              var otherIcon = other.querySelector('.event-detail-2__faq-icon');
              if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
            }
          });

          if (isExpanded) {
            item.classList.remove('event-detail-2__faq-item--expanded');
            icon.style.transform = 'rotate(0deg)';
          } else {
            item.classList.add('event-detail-2__faq-item--expanded');
            icon.style.transform = 'rotate(180deg)';
          }
        });
      });

      section.setAttribute(DATA_FAQ_INIT, '1');
    });
  }

  function init() {
    initThumbnails();
    initFaq();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  var observer = new MutationObserver(function () {
    init();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
