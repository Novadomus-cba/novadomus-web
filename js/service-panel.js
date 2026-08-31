(function () {
  'use strict';

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  var openDialog = null;
  var openTrigger = null;
  var closedByPopstate = false;

  function lockScroll() {
    if (window.lenis) window.lenis.stop();
    document.documentElement.style.overflow = 'hidden';
  }

  function unlockScroll() {
    if (window.lenis) window.lenis.start();
    document.documentElement.style.overflow = '';
  }

  function resetReveals(dialog) {
    dialog.querySelectorAll('.reveal').forEach(function (el) { el.classList.remove('is-in'); });
  }

  function observeReveals(dialog, scroller) {
    if (!('IntersectionObserver' in window) || reducedMotion()) {
      dialog.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });
      return null;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { root: scroller, rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
    dialog.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
    return io;
  }

  function bindReadingProgress(scroller, bar) {
    if (!bar) return function () {};
    var ticking = false;
    function update() {
      var max = scroller.scrollHeight - scroller.clientHeight;
      var ratio = max > 0 ? scroller.scrollTop / max : 0;
      bar.style.transform = 'scaleX(' + Math.max(0, Math.min(1, ratio)) + ')';
      ticking = false;
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }
    scroller.addEventListener('scroll', onScroll, { passive: true });
    update();
    return function () { scroller.removeEventListener('scroll', onScroll); };
  }

  function openPanel(dialog, trigger) {
    if (openDialog) return;
    openTrigger = trigger;

    var rect = trigger.getBoundingClientRect();
    var ox = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
    var oy = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
    dialog.style.setProperty('--ox', ox + '%');
    dialog.style.setProperty('--oy', oy + '%');

    lockScroll();
    dialog.showModal();
    trigger.setAttribute('aria-expanded', 'true');
    openDialog = dialog;

    if (!closedByPopstate) {
      history.pushState({ panel: dialog.id }, '', '#' + dialog.id);
    }
    closedByPopstate = false;

    var scroller = dialog.querySelector('.panel__scroll');
    dialog._io = observeReveals(dialog, scroller);
    dialog._unbindProgress = bindReadingProgress(scroller, dialog.querySelector('.panel__progress span'));
  }

  function closePanel(dialog, viaPopstate) {
    if (!dialog || dialog !== openDialog) return;
    var trigger = openTrigger;

    function finish() {
      dialog.classList.remove('is-closing');
      dialog.close();
      unlockScroll();
      if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
        trigger.focus();
      }
      var scroller = dialog.querySelector('.panel__scroll');
      if (scroller) scroller.scrollTop = 0;
      resetReveals(dialog);
      if (dialog._io) dialog._io.disconnect();
      if (dialog._unbindProgress) dialog._unbindProgress();
      openDialog = null;
      openTrigger = null;
    }

    if (!viaPopstate && location.hash === '#' + dialog.id) {
      closedByPopstate = true;
      history.back();
    }

    if (reducedMotion()) {
      finish();
      return;
    }
    dialog.classList.add('is-closing');
    var done = false;
    function onEnd() { if (done) return; done = true; finish(); }
    dialog.addEventListener('animationend', onEnd, { once: true });
    setTimeout(onEnd, 320);
  }

  function init() {
    document.querySelectorAll('.card__link[data-panel]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var dialog = document.getElementById(link.getAttribute('data-panel'));
        if (!dialog) return;
        e.preventDefault();
        openPanel(dialog, link);
      });
    });

    document.querySelectorAll('dialog.panel').forEach(function (dialog) {
      var closeBtn = dialog.querySelector('[data-panel-close]');
      if (closeBtn) closeBtn.addEventListener('click', function () { closePanel(dialog); });

      dialog.addEventListener('click', function (e) {
        if (e.target === dialog) closePanel(dialog);
      });

      dialog.addEventListener('cancel', function (e) {
        e.preventDefault();
        closePanel(dialog);
      });
    });

    window.addEventListener('popstate', function () {
      if (openDialog) closePanel(openDialog, true);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
