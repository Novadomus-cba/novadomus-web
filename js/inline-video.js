(function () {
  'use strict';

  // Video en linea dentro del cuerpo de un panel (no el hero: ese lo monta
  // service-panel.js). Monta el <video> recien cuando el tile entra en cuadro,
  // lo pausa al salir, y lo desmonta del todo cuando se cierra el dialog que lo
  // contiene -- sin eso el decoder queda vivo despues de cerrar el panel.
  //
  // Contrato del markup: el contenedor lleva data-inline-video con la ruta base
  // SIN extension (se le agregan .av1.mp4 y .h264.mp4, igual que el hero) y
  // adentro trae la still de respaldo como <img>. Si no hay JS, si el navegador
  // bloquea el autoplay o si el sistema pide menos movimiento, queda la still.

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function mount(host) {
    if (host._video) return host._video;

    var base = host.getAttribute('data-inline-video');
    if (!base) return null;

    var v = document.createElement('video');
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.tabIndex = -1;
    // Los atributos ademas de las propiedades: iOS mira el atributo para autoplay.
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.setAttribute('aria-hidden', 'true');

    var poster = host.getAttribute('data-inline-video-poster');
    if (poster) v.poster = poster;

    var av1 = document.createElement('source');
    av1.src = base + '.av1.mp4';
    av1.type = 'video/mp4; codecs=av01.0.05M.08';
    var h264 = document.createElement('source');
    h264.src = base + '.h264.mp4';
    h264.type = 'video/mp4';
    v.appendChild(av1);
    v.appendChild(h264);

    // El fade a is-playing recien cuando hay frames reales: si se pone antes,
    // se ve un parpadeo negro entre la still y el primer frame decodificado.
    v.addEventListener('playing', function () { host.classList.add('is-playing'); });

    host.appendChild(v);
    host._video = v;
    return v;
  }

  function unmount(host) {
    var v = host._video;
    if (!v) return;
    host.classList.remove('is-playing');
    v.pause();
    while (v.firstChild) v.removeChild(v.firstChild);
    v.removeAttribute('src');
    // load() sobre el elemento vaciado es lo que libera decoder y buffer.
    v.load();
    if (v.parentNode) v.parentNode.removeChild(v);
    host._video = null;
  }

  function init() {
    var hosts = document.querySelectorAll('[data-inline-video]');
    if (!hosts.length) return;
    if (reducedMotion() || !('IntersectionObserver' in window)) return;  // queda la still

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var host = entry.target;
        if (entry.isIntersecting) {
          var v = mount(host);
          if (!v) return;
          var p = v.play();
          if (p && p.catch) p.catch(function () {});   // autoplay bloqueado: queda la still
        } else if (host._video) {
          host._video.pause();
        }
      });
    }, { threshold: 0.25 });

    hosts.forEach(function (host) {
      // El tile puede vivir dentro del scroller de un panel takeover; ahi el
      // viewport real es ese scroller, no la ventana. Un IO por root.
      var scroller = host.closest('.panel__scroll');
      if (scroller) {
        if (!scroller._inlineIo) {
          scroller._inlineIo = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
              var h = entry.target;
              if (entry.isIntersecting) {
                var v = mount(h);
                if (!v) return;
                var p = v.play();
                if (p && p.catch) p.catch(function () {});
              } else if (h._video) {
                h._video.pause();
              }
            });
          }, { root: scroller, threshold: 0.25 });
        }
        scroller._inlineIo.observe(host);
      } else {
        io.observe(host);
      }

      var dialog = host.closest('dialog');
      if (dialog) dialog.addEventListener('close', function () { unmount(host); });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
