/**
 * Contact Page JavaScript
 * 문의하기 페이지 기능 (contact, contact-2, contact-3, contact-4 공통)
 * 이벤트 위임 사용 → wakit 다이나믹 뷰에서도 동작
 */
(function () {
  'use strict';

  function updateTextareaCounter(textarea, counterEl) {
    if (!textarea || !counterEl) return;
    var currentLength = textarea.value.length;
    var maxLength = parseInt(textarea.getAttribute('maxlength'), 10) || 1000;
    counterEl.textContent = currentLength;
    counterEl.style.color = currentLength >= maxLength * 0.9 ? 'var(--color-error, #ff4444)' : '';
  }

  function onDocumentInput(e) {
    var textarea = e.target;
    if (textarea.tagName !== 'TEXTAREA') return;
    var form = textarea.closest('.contact-form, .contact-2-form, .contact-3-form, .contact-4-form');
    if (!form) return;
    var counterCurrent = form.querySelector('.textarea-count-current, .contact-2-textarea-count-current, .contact-3-textarea-count-current, .contact-4-textarea-count-current');
    if (counterCurrent) updateTextareaCounter(textarea, counterCurrent);
  }

  function onDocumentSubmit(e) {
    var form = e.target;
    if (!form.matches || !form.matches('.contact-form, .contact-2-form, .contact-3-form, .contact-4-form')) return;

    e.preventDefault();

    var nameEl = form.querySelector('[name="name"]');
    var emailEl = form.querySelector('[name="email"]');
    var phoneEl = form.querySelector('[name="phone"]');
    var messageEl = form.querySelector('[name="message"]');
    var formData = {
      name: nameEl ? nameEl.value : '',
      email: emailEl ? emailEl.value : '',
      phone: phoneEl ? phoneEl.value : '',
      message: messageEl ? messageEl.value : ''
    };

    console.log('Form submitted:', formData);
    alert('문의가 성공적으로 전송되었습니다. 빠른 시일 내에 답변드리겠습니다.');

    form.reset();

    var counterCurrent = form.querySelector('.textarea-count-current, .contact-2-textarea-count-current, .contact-3-textarea-count-current, .contact-4-textarea-count-current');
    if (counterCurrent) counterCurrent.textContent = '0';
  }

  document.addEventListener('input', onDocumentInput, true);
  document.addEventListener('submit', onDocumentSubmit, true);

  function ensureCounterInitialState(container) {
    container = container || document;
    var textareas = container.querySelectorAll('.contact-form textarea[name="message"], .contact-2-form textarea[name="message"], .contact-3-form textarea[name="message"], .contact-4-form textarea[name="message"]');
    textareas.forEach(function (textarea) {
      var form = textarea.closest('.contact-form, .contact-2-form, .contact-3-form, .contact-4-form');
      var counterCurrent = form && form.querySelector('.textarea-count-current, .contact-2-textarea-count-current, .contact-3-textarea-count-current, .contact-4-textarea-count-current');
      if (counterCurrent) updateTextareaCounter(textarea, counterCurrent);
    });
  }

  function init() {
    ensureCounterInitialState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
