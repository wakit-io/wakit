/**
 * FAQ Accordion JavaScript
 * 아코디언 기능 구현 (일반 페이지 + wakit 다이나믹 뷰 대응)
 * - 이벤트 위임으로 동적 주입 콘텐츠에서도 동작
 */

(function() {
  'use strict';

  const PADDING_TOP = 16;
  const PADDING_BOTTOM = 16;

  /** 아직 초기화되지 않은 .faq-accordion-item에만 닫힌 상태 적용 */
  function ensureFAQInitialState() {
    document.querySelectorAll('.faq-accordion-item:not([data-faq-inited])').forEach((item) => {
      const header = item.querySelector('.faq-accordion-header');
      const content = item.querySelector('.faq-accordion-content');
      if (!header || !content) return;

      if (!item.classList.contains('is-active')) {
        content.style.maxHeight = '0';
        content.style.paddingTop = '0';
        content.style.paddingBottom = '0';
        header.setAttribute('aria-expanded', 'false');
        content.setAttribute('aria-hidden', 'true');
      }
      item.setAttribute('data-faq-inited', '1');
    });
  }

  /** 아코디언 토글 처리 (헤더 클릭/키보드) */
  function toggleAccordionItem(header) {
    const item = header.closest('.faq-accordion-item');
    const content = item && item.querySelector('.faq-accordion-content');
    if (!item || !content) return;

    const isActive = item.classList.contains('is-active');

    if (isActive) {
      item.classList.remove('is-active');
      header.setAttribute('aria-expanded', 'false');
      content.setAttribute('aria-hidden', 'true');
      content.style.maxHeight = '0';
      content.style.paddingTop = '0';
      content.style.paddingBottom = '0';
    } else {
      item.classList.add('is-active');
      header.setAttribute('aria-expanded', 'true');
      content.setAttribute('aria-hidden', 'false');

      const answer = content.querySelector('.faq-answer');
      if (answer) {
        const answerHeight = answer.scrollHeight;
        content.style.maxHeight = (answerHeight + PADDING_TOP + PADDING_BOTTOM) + 'px';
        content.style.paddingTop = PADDING_TOP + 'px';
        content.style.paddingBottom = PADDING_BOTTOM + 'px';
      } else {
        const contentHeight = content.scrollHeight;
        content.style.maxHeight = contentHeight + 'px';
        content.style.paddingTop = '';
        content.style.paddingBottom = '';
      }
    }
  }

  /** 문서 단일 클릭 리스너 (이벤트 위임) */
  function onDocumentClick(e) {
    const header = e.target.closest('.faq-accordion-header');
    if (!header) return;
    e.preventDefault();
    e.stopPropagation();
    toggleAccordionItem(header);
  }

  /** 문서 단일 키다운 리스너 (접근성) */
  function onDocumentKeydown(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const header = e.target.closest('.faq-accordion-header');
    if (!header) return;
    e.preventDefault();
    toggleAccordionItem(header);
  }

  /** 검색 입력 (이벤트 위임) */
  function onDocumentInput(e) {
    if (!e.target.matches('.faq-search-input')) return;
    const searchTerm = e.target.value.toLowerCase().trim();
    const container = e.target.closest('.faq-page') || document;
    container.querySelectorAll('.faq-accordion-item').forEach((item) => {
      const question = item.querySelector('.faq-question');
      const answer = item.querySelector('.faq-answer');
      const questionText = question ? question.textContent.toLowerCase() : '';
      const answerText = answer ? answer.textContent.toLowerCase() : '';
      const matches = questionText.includes(searchTerm) || answerText.includes(searchTerm);
      item.style.display = (searchTerm === '' || matches) ? '' : 'none';
    });
  }

  function init() {
    ensureFAQInitialState();
  }

  // 전역 리스너 1회만 등록 (이벤트 위임으로 동적 뷰 포함 항상 동작)
  document.addEventListener('click', onDocumentClick, true);
  document.addEventListener('keydown', onDocumentKeydown, true);
  document.addEventListener('input', onDocumentInput, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 다이나믹 뷰 등으로 FAQ가 나중에 주입될 때 초기 상태만 적용 (리스너는 이미 document에 있음)
  const observer = new MutationObserver(function() {
    ensureFAQInitialState();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
