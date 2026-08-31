(function () {
  'use strict';

  function trapFocus(container) {
    var selector = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    function handler(e) {
      if (e.key !== 'Tab') return;
      var focusables = Array.prototype.filter.call(container.querySelectorAll(selector), function (el) {
        return !el.disabled && el.offsetParent !== null;
      });
      if (!focusables.length) return;
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    container.addEventListener('keydown', handler);
    return function () { container.removeEventListener('keydown', handler); };
  }

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function init() {
    var carousel = document.getElementById('svc-carousel');
    var overlay = document.getElementById('svc-modal-overlay');
    if (!carousel || !overlay) return;

    var dialog = document.getElementById('svc-modal-dialog');
    var closeBtn = document.getElementById('svc-modal-close');
    var photoEl = document.getElementById('svc-modal-photo');
    var eyebrowEl = document.getElementById('svc-modal-eyebrow');
    var titleEl = document.getElementById('svc-modal-title');
    var descEl = document.getElementById('svc-modal-desc');
    var removeTrap, trigger;

    document.querySelectorAll('[data-carousel-prev]').forEach(function (btn) {
      btn.addEventListener('click', function () { carousel.scrollBy({ left: -320, behavior: reducedMotion() ? 'auto' : 'smooth' }); });
    });
    document.querySelectorAll('[data-carousel-next]').forEach(function (btn) {
      btn.addEventListener('click', function () { carousel.scrollBy({ left: 320, behavior: reducedMotion() ? 'auto' : 'smooth' }); });
    });

    function openModal(card) {
      trigger = card;
      eyebrowEl.textContent = 'Servicio';
      titleEl.textContent = card.getAttribute('data-title') || '';
      descEl.textContent = card.getAttribute('data-desc') || '';
      var src = card.getAttribute('data-img-1440');
      var alt = card.getAttribute('data-alt') || '';
      var w = card.getAttribute('data-img-w');
      var h = card.getAttribute('data-img-h');
      photoEl.innerHTML = src
        ? '<img src="' + src + '" width="' + w + '" height="' + h + '" alt="' + alt.replace(/"/g, '&quot;') + '">'
        : '';

      overlay.hidden = false;
      void overlay.offsetWidth;
      overlay.classList.add('open');
      document.body.classList.add('scroll-lock');
      removeTrap = trapFocus(dialog);
      closeBtn.focus();
      document.addEventListener('keydown', onKeydown, true);
    }

    function closeModal() {
      overlay.classList.remove('open');
      document.body.classList.remove('scroll-lock');
      document.removeEventListener('keydown', onKeydown, true);
      if (removeTrap) { removeTrap(); removeTrap = null; }
      setTimeout(function () { overlay.hidden = true; }, reducedMotion() ? 0 : 260);
      if (trigger && typeof trigger.focus === 'function') trigger.focus();
    }

    function onKeydown(e) {
      if (e.key === 'Escape') closeModal();
    }

    carousel.querySelectorAll('.svc-card').forEach(function (card) {
      card.addEventListener('click', function () { openModal(card); });
    });
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
