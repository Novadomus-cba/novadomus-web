(function () {
  'use strict';

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  var openDialog = null;
  var openTrigger = null;
  var closedByPopstate = false;
  var panelOrder = [];   // ids de panel, en el orden en que estan las tarjetas del carrusel
  var triggerFor = {};   // id de panel -> tarjeta que lo abre

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

  function siblingId(id, dir) {
    var i = panelOrder.indexOf(id);
    if (i < 0) return null;
    return panelOrder[i + dir] || null;
  }

  // Desmonta el panel actual y monta el siguiente sin soltar el lock de scroll.
  // No pasa por closePanel() a proposito: no queremos animacion de cierre, ni
  // history.back(), ni devolver el foco a la tarjeta.
  function goToPanel(dir) {
    if (!openDialog) return;
    var nextId = siblingId(openDialog.id, dir);
    if (!nextId) return;
    var next = document.getElementById(nextId);
    if (!next) return;

    var prev = openDialog;
    if (prev._io) prev._io.disconnect();
    if (prev._unbindProgress) prev._unbindProgress();
    var prevScroller = prev.querySelector('.panel__scroll');
    if (prevScroller) prevScroller.scrollTop = 0;
    resetReveals(prev);
    prev.classList.remove('is-closing');
    prev.close();
    if (openTrigger) openTrigger.setAttribute('aria-expanded', 'false');

    openDialog = next;
    openTrigger = triggerFor[nextId] || null;
    next.showModal();
    if (openTrigger) {
      openTrigger.setAttribute('aria-expanded', 'true');
      // Deja la tarjeta correcta a la vista para cuando se cierre el panel.
      if (openTrigger.scrollIntoView) {
        openTrigger.scrollIntoView({ block: 'nearest', inline: 'center',
          behavior: reducedMotion() ? 'auto' : 'smooth' });
      }
    }

    // replaceState, NO pushState -- si cada salto pushea, recorrer varios
    // paneles deja una entrada de historial por salto y el "atras" los
    // camina al reves en vez de salir.
    history.replaceState({ panel: nextId }, '', '#' + nextId);

    var scroller = next.querySelector('.panel__scroll');
    if (scroller) scroller.scrollTop = 0;
    next._io = observeReveals(next, scroller);
    next._unbindProgress = bindReadingProgress(scroller, next.querySelector('.panel__progress span'));

    // Anuncia el cambio: mueve el foco al titulo del panel nuevo.
    var title = next.querySelector('.panel__title');
    if (title) {
      title.setAttribute('tabindex', '-1');
      title.focus({ preventScroll: true });
    }
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

    // Orden de paneles = orden de las tarjetas en el carrusel.
    document.querySelectorAll('.card__link[data-panel]').forEach(function (link) {
      var id = link.getAttribute('data-panel');
      panelOrder.push(id);
      triggerFor[id] = link;
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

      var i = panelOrder.indexOf(dialog.id);
      var hasPrev = i > 0;
      var hasNext = i > -1 && i < panelOrder.length - 1;

      dialog.querySelectorAll('[data-panel-prev]').forEach(function (btn) {
        if (!hasPrev) { btn.hidden = true; return; }
        btn.addEventListener('click', function (e) { e.preventDefault(); goToPanel(-1); });
      });
      dialog.querySelectorAll('[data-panel-next]').forEach(function (btn) {
        if (!hasNext) { btn.hidden = true; return; }
        btn.addEventListener('click', function (e) { e.preventDefault(); goToPanel(1); });
      });

      var count = dialog.querySelector('[data-panel-count]');
      if (count && i > -1) count.textContent = (i + 1) + ' / ' + panelOrder.length;

      // Si el panel es el unico, la pildora entera no tiene sentido.
      var pager = dialog.querySelector('.panel__pager');
      if (pager && !hasPrev && !hasNext) pager.hidden = true;
    });

    // Teclado: flechas solo con un takeover abierto y fuera de un campo de texto.
    document.addEventListener('keydown', function (e) {
      if (!openDialog || !openDialog.classList.contains('panel--takeover')) return;
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); goToPanel(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goToPanel(-1); }
    });

    window.addEventListener('popstate', function () {
      if (openDialog) closePanel(openDialog, true);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
