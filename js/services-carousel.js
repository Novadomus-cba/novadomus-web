(function () {
  'use strict';

  function init() {
    var wrap = document.querySelector('.carousel');
    var track = document.getElementById('services-track');
    if (!wrap || !track) return;

    var prevBtn = wrap.querySelector('[data-carousel-prev]');
    var nextBtn = wrap.querySelector('[data-carousel-next]');
    var progressThumb = document.querySelector('.carousel__progress-thumb');
    var ticking = false;

    // El track tiene padding lateral (alineado a .wrap), asi que el scroll de
    // reposo en cada extremo no cae exactamente en 0 / max -- usamos un
    // umbral generoso en vez de comparar contra 0.
    var EDGE_THRESHOLD = 30;
    function updateArrows() {
      var max = track.scrollWidth - track.clientWidth;
      if (prevBtn) prevBtn.hidden = track.scrollLeft <= EDGE_THRESHOLD;
      if (nextBtn) nextBtn.hidden = max <= EDGE_THRESHOLD || track.scrollLeft >= max - EDGE_THRESHOLD;
    }

    function updateProgress() {
      if (!progressThumb) return;
      var max = track.scrollWidth - track.clientWidth;
      var ratio = track.clientWidth / track.scrollWidth;
      var traveled = max > 0 ? track.scrollLeft / max : 0;
      var freeSpace = 1 - ratio;
      progressThumb.style.transform = 'scaleX(' + ratio + ') translateX(' + (traveled * (freeSpace / ratio) * 100) + '%)';
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        updateArrows();
        updateProgress();
        ticking = false;
      });
    }

    if (prevBtn) prevBtn.addEventListener('click', function () {
      track.scrollBy({ left: -track.clientWidth * 0.9, behavior: 'smooth' });
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
      track.scrollBy({ left: track.clientWidth * 0.9, behavior: 'smooth' });
    });

    track.addEventListener('scroll', onScroll, { passive: true });
    if (window.ResizeObserver) {
      new ResizeObserver(onScroll).observe(track);
    } else {
      window.addEventListener('resize', onScroll);
    }
    onScroll();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
