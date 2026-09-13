/**
 * Preview de video en hover sobre las tarjetas del carrusel de servicios.
 *
 * Solo corre con mouse fino y sin prefers-reduced-motion. En touch el bloque
 * entero no se monta: el <a> sigue siendo un link real y el tap abre el panel
 * igual que antes.
 *
 * Reusa los mismos assets de video que el hero del panel (mismo par AV1/H264)
 * y el mismo patron de montaje/desmontaje que mountPanelVideo() en
 * service-panel.js -- si uno de los dos cambia, cambiar el otro.
 */
(function () {
  'use strict';

  // Tiempo sin hover antes de soltar el decoder. Sin esto quedan hasta siete
  // videos decodificados en memoria despues de pasar el mouse por el carrusel.
  var RELEASE_DELAY = 10000;

  function canPreview() {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches
        && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function createVideo(base) {
    var v = document.createElement('video');
    v.className = 'card__preview-video';
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = 'none';
    v.tabIndex = -1;
    // Los atributos ademas de las propiedades: iOS mira el atributo para el
    // autoplay. Acá no aplica (es desktop), pero se mantiene el mismo patron
    // que el hero del panel para que el codigo no diverja.
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.setAttribute('aria-hidden', 'true');

    var av1 = document.createElement('source');
    av1.src = base + '-16x9.av1.mp4';
    av1.type = 'video/mp4; codecs=av01.0.05M.08';
    var h264 = document.createElement('source');
    h264.src = base + '-16x9.h264.mp4';
    h264.type = 'video/mp4';
    v.appendChild(av1);
    v.appendChild(h264);
    return v;
  }

  function release(v) {
    v.pause();
    while (v.firstChild) v.removeChild(v.firstChild);
    v.removeAttribute('src');
    // load() sobre el elemento vaciado es lo que libera el decoder y el buffer.
    v.load();
    if (v.parentNode) v.parentNode.removeChild(v);
  }

  function wire(card) {
    var base = card.getAttribute('data-preview-video');
    if (!base) return;
    var video = null;
    var releaseTimer = null;
    var hovering = false;

    card.addEventListener('mouseenter', function () {
      hovering = true;
      if (releaseTimer) { clearTimeout(releaseTimer); releaseTimer = null; }
      // El chequeo va acá y no solo al init: el usuario puede activar reducir
      // movimiento en el sistema con la pagina ya abierta.
      if (!canPreview()) return;
      if (!video) {
        video = createVideo(base);
        // Se agrega al final: el ::after con el degrade se pinta despues de
        // todos los hijos reales, asi que el titulo sigue legible encima.
        card.appendChild(video);
      }
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    });

    card.addEventListener('mouseleave', function () {
      hovering = false;
      if (!video) return;
      video.pause();
      video.currentTime = 0;
      if (releaseTimer) clearTimeout(releaseTimer);
      releaseTimer = setTimeout(function () {
        releaseTimer = null;
        if (hovering || !video) return;
        release(video);
        video = null;
      }, RELEASE_DELAY);
    });
  }

  function init() {
    if (!canPreview()) return;
    var cards = document.querySelectorAll('.card__link[data-preview-video]');
    for (var i = 0; i < cards.length; i++) wire(cards[i]);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
