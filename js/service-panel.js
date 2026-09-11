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

  function mountPanelVideo(dialog) {
    if (reducedMotion()) return;
    var fig = dialog.querySelector('[data-panel-video]');
    if (!fig || dialog._video) return;

    var vertical = window.matchMedia('(max-aspect-ratio: 1/1)').matches;
    var base = fig.getAttribute('data-panel-video');
    // Ruta explicita por orientacion si el panel la declara; si no, se arma por
    // concatenacion. Todos los paneles declaran landscape y portrait apuntando
    // al mismo archivo 16:9 -- el contenedor retrato lo cubre via object-fit.
    var path = fig.getAttribute(vertical ? 'data-panel-video-portrait'
                                         : 'data-panel-video-landscape')
            || (base + (vertical ? '-9x16' : '-16x9'));

    var v = document.createElement('video');
    v.className = 'panel__hero-video';
    v.muted = true;
    // Por defecto loopea. Los paneles con narrativa direccional se marcan con
    // data-panel-video-once y se congelan en el ultimo frame.
    v.loop = !fig.hasAttribute('data-panel-video-once');
    v.playsInline = true;
    v.preload = 'auto';
    v.tabIndex = -1;
    // Los atributos, ademas de las propiedades: iOS mira el atributo para el autoplay.
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.setAttribute('aria-hidden', 'true');
    var poster = fig.getAttribute(vertical ? 'data-panel-poster-portrait'
                                           : 'data-panel-poster-landscape')
              || fig.getAttribute(vertical ? 'data-panel-poster-9x16'
                                           : 'data-panel-poster-16x9');
    if (poster) v.poster = poster;

    var av1 = document.createElement('source');
    av1.src = path + '.av1.mp4';
    av1.type = 'video/mp4; codecs=av01.0.05M.08';
    var h264 = document.createElement('source');
    h264.src = path + '.h264.mp4';
    h264.type = 'video/mp4';
    v.appendChild(av1);
    v.appendChild(h264);

    fig.insertBefore(v, fig.querySelector('.panel__hero-caption'));
    dialog._video = v;

    // Si el autoplay se bloquea, queda el poster y debajo la foto real. No se avisa nada.
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }

  function unmountPanelVideo(dialog) {
    var v = dialog._video;
    if (!v) return;
    v.pause();
    while (v.firstChild) v.removeChild(v.firstChild);
    v.removeAttribute('src');
    // load() sobre el elemento vaciado es lo que libera el decoder y el buffer.
    // Sin esto el video sigue en memoria despues de cerrar el panel.
    v.load();
    if (v.parentNode) v.parentNode.removeChild(v);
    dialog._video = null;
  }

  // CSS.supports existe en todo navegador con IntersectionObserver real, pero el sticky
  // puede fallar en combinacion con dialog::backdrop en algun WebKit viejo -- si se
  // detecta eso, cae al bar de siempre en vez de un hero roto.
  var stickyHeroSupported = CSS.supports('position', 'sticky');

  function ensureStickyFallback(dialog) {
    if (!stickyHeroSupported) dialog.classList.add('no-sticky-hero');
  }

  // Observa el centinela justo despues del hero: cuando scrollea por encima del
  // scroller, agrega is-scrolled al dialog. Eso encoge el hero (sticky) en todo
  // navegador capaz; .panel__bar es solo el fallback para reduced-motion/
  // no-sticky-hero, asi que no hace falta que exista para que este observer
  // arranque -- por eso no se lo pide en el guard.
  // No se puede observar el caption: como el hero es sticky, el caption que
  // vive adentro nunca sale del viewport del scroller (un sticky se mantiene
  // visible por definicion), asi que ese disparador nunca dispararia. El
  // centinela sigue en flujo normal y sale de vista en el momento correcto.
  // Observer propio y persistente -- observeReveals() hace unobserve al disparar,
  // asi que no sirve para esto.
  function mountPanelBar(dialog) {
    var sentinel = dialog.querySelector('.panel__hero-sentinel');
    var scroller = dialog.querySelector('.panel__scroll');
    if (!sentinel || !scroller) return;

    if (!('IntersectionObserver' in window)) {
      dialog.classList.add('is-scrolled');   // sin IO, la barra queda siempre visible
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) dialog.classList.remove('is-scrolled');
        else dialog.classList.add('is-scrolled');
      }
    }, { root: scroller, threshold: 0 });

    io.observe(sentinel);
    dialog._barIo = io;
  }

  function unmountPanelBar(dialog) {
    if (dialog._barIo) { dialog._barIo.disconnect(); dialog._barIo = null; }
    dialog.classList.remove('is-scrolled');
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
    mountPanelVideo(dialog);
    ensureStickyFallback(dialog);
    mountPanelBar(dialog);
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
      unmountPanelVideo(dialog);
      unmountPanelBar(dialog);
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
    unmountPanelVideo(prev);
    unmountPanelBar(prev);
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
    mountPanelVideo(next);
    ensureStickyFallback(next);
    mountPanelBar(next);

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
