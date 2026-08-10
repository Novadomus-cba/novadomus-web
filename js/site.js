(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initMobileMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var menu = document.querySelector('[data-menu]');
    if (!toggle || !menu) return;

    function close() {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    }
    function open() {
      menu.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
    }
    toggle.addEventListener('click', function () {
      menu.classList.contains('open') ? close() : open();
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', close);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  function initStickySubnav() {
    var subnav = document.querySelector('[data-subnav]');
    if (!subnav) return;
    var threshold = 120;
    function onScroll() {
      if (window.scrollY > threshold) subnav.classList.add('is-stuck');
      else subnav.classList.remove('is-stuck');
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initReveal() {
    var items = document.querySelectorAll('.rv');
    if (!items.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    items.forEach(function (el) { obs.observe(el); });
  }

  function initFooterYear() {
    var el = document.querySelector('[data-year]');
    if (el) el.textContent = '2026';
  }

  function initGalleryTabs() {
    var tabGroups = document.querySelectorAll('[data-gallery-tabs]');
    tabGroups.forEach(function (group) {
      var buttons = group.querySelectorAll('[data-tab]');
      var panels = group.querySelectorAll('[data-tab-panel]');
      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          buttons.forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          var target = btn.getAttribute('data-tab');
          panels.forEach(function (p) {
            p.hidden = p.getAttribute('data-tab-panel') !== target;
          });
        });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initStickySubnav();
    initReveal();
    initFooterYear();
    initGalleryTabs();
  });
})();
