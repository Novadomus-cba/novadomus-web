(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initMobileMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var menu = document.querySelector('[data-menu]');
    if (!toggle || !menu) return;
    // Navegador sin <dialog>: el fallback es la nav visible (ver noscript/CSS), no un menu roto.
    if (typeof menu.showModal !== 'function') { toggle.hidden = true; return; }

    var closeBtn = menu.querySelector('[data-menu-close]');
    var isOpen = false;
    var pendingHref = null;   // link tocado dentro del menu, se navega despues de cerrar

    function lockScroll() {
      if (window.lenis) window.lenis.stop();
      document.documentElement.style.overflow = 'hidden';
    }
    function unlockScroll() {
      if (window.lenis) window.lenis.start();
      document.documentElement.style.overflow = '';
    }

    function open() {
      if (isOpen) return;
      isOpen = true;
      lockScroll();
      menu.showModal();
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Cerrar menú');
      // Entrada de historial propia: el gesto/boton "atras" cierra el menu en vez de salir del sitio.
      history.pushState({ ndMenu: true }, '');
    }

    function finishClose() {
      menu.classList.remove('is-closing');
      menu.close();
      unlockScroll();
      isOpen = false;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menú');
      if (pendingHref) {
        var href = pendingHref;
        pendingHref = null;
        location.assign(href);   // la entrada del menu ya se consumio con history.back()
        return;
      }
      toggle.focus();
    }

    // viaPopstate: el cierre lo disparo el historial, no hay que tocar history de nuevo.
    // immediate: sin animacion de salida (cuando se esta navegando a otra pagina).
    function close(viaPopstate, immediate) {
      if (!isOpen) return;
      if (!viaPopstate && history.state && history.state.ndMenu) {
        history.back();          // dispara popstate -> vuelve por close(true)
        return;
      }
      if (reduceMotion || immediate) { finishClose(); return; }
      menu.classList.add('is-closing');
      var done = false;
      function onEnd() { if (done) return; done = true; finishClose(); }
      menu.addEventListener('animationend', onEnd, { once: true });
      setTimeout(onEnd, 320);    // respaldo: si la animacion no dispara, el panel igual se cierra
    }

    toggle.addEventListener('click', function () {
      isOpen ? close() : open();
    });

    if (closeBtn) closeBtn.addEventListener('click', function () { close(); });

    // Tocar el backdrop: con el dialog a pantalla completa, el toque afuera del panel
    // cae sobre el <dialog> mismo.
    menu.addEventListener('click', function (e) {
      if (e.target === menu) close();
    });

    // ESC: se intercepta para que pase por nuestra logica de historial.
    menu.addEventListener('cancel', function (e) {
      e.preventDefault();
      close();
    });

    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var href = a.getAttribute('href');
        var newTab = a.target === '_blank';
        if (!href || newTab || /^(https?:|mailto:|tel:)/i.test(href)) { close(); return; }
        if (!(history.state && history.state.ndMenu)) { close(); return; }
        // Consumimos la entrada de historial del menu antes de navegar, para no dejar
        // una entrada fantasma que obligue a tocar "atras" dos veces.
        e.preventDefault();
        pendingHref = href;
        close();
      });
    });

    window.addEventListener('popstate', function () {
      if (isOpen) close(true, !!pendingHref);
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
    if (el) el.textContent = new Date().getFullYear();
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
