(function () {
  'use strict';
  if (!window.gsap || !window.ScrollTrigger || !window.Lenis) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);

  if (!reduced) {
    var lenis = new Lenis();
    window.lenis = lenis; // otros scripts (ej. service-panel.js) necesitan poder pausarlo
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  // Técnica 1: split-text con pin + scrub (usar en index.html hero o nosotros.html#manifiesto)
  window.initSplitPin = function (selector, sectionSelector) {
    var el = document.querySelector(selector);
    if (!el || reduced || !window.SplitText) return;
    var split = new SplitText(el, { type: 'chars', mask: 'chars' });
    gsap.from(split.chars, {
      opacity: 0.12, y: 24, stagger: 0.04, ease: 'none',
      scrollTrigger: { trigger: sectionSelector, start: 'top top', end: '+=160%', scrub: true, pin: true }
    });
  };

  // Técnica 2: cards apiladas (usar en nosotros.html#habitaciones, reemplaza el grid .rooms estático)
  //
  // Rewritten from the original spec (N separate ScrollTrigger.create calls, each with its
  // own pixel-offset start/end, PLUS a final pin ScrollTrigger — all sharing the same trigger
  // element): under real testing that composition released the pin far earlier than its own
  // 'bottom bottom' end condition implied, leaving a multi-viewport dead scroll gap with
  // nothing rendered. A single pinned+scrubbed ScrollTrigger driving every card off one shared
  // progress value is the standard, reliable way to do this.
  //
  // Bug encontrado y corregido: la version anterior dejaba la opacidad de la tarjeta que
  // recede en un piso de 0.4 (nunca llegaba a 0). Como esa tarjeta tiene mayor z-index que la
  // siguiente (recede desde arriba para revelar la de abajo), un piso de opacidad > 0 la deja
  // como un fantasma semi-transparente permanentemente superpuesto sobre la tarjeta revelada
  // -- se ve como dos tarjetas mezcladas en simultaneo. La opacidad tiene que llegar a 0 real.
  window.initStack = function (stageSelector, cardSelector) {
    if (reduced) return;
    var cards = gsap.utils.toArray(cardSelector);
    var n = cards.length;
    if (!n) return;
    cards.forEach(function (card, i) {
      // Reading order first: card 0 stacks on top initially y recede (fade a opacity:0) para
      // revelar la card 1 que esta debajo, y asi sucesivamente -- no al reves (zIndex: i
      // dejaria la ULTIMA card permanentemente arriba, tapando todas las anteriores).
      gsap.set(card, { zIndex: n - 1 - i });
    });

    ScrollTrigger.create({
      trigger: stageSelector,
      start: 'top top',
      // Explicit scroll distance (not tied to the trigger element's own CSS height): GSAP
      // inserts its own pin-spacer sized to exactly this much, so there's no leftover
      // unoccupied space to scroll through once the pin releases. Using the element's own
      // height (e.g. 'bottom bottom' on a 400vh-tall container whose visible content only
      // fills the first 100vh) left a multi-viewport dead gap after unpinning — this is the
      // standard fix.
      end: '+=' + (n - 1) * 100 + '%',
      pin: true,
      scrub: true,
      onUpdate: function (self) {
        var totalProgress = self.progress * (n - 1);
        cards.forEach(function (card, i) {
          if (i === n - 1) return;
          // La tarjeta de abajo ya esta en opacity:1 apenas empieza la transicion de la de
          // arriba (su propio fade no arranca hasta llegar a su turno) -- si el fade de la de
          // arriba ocupa el slot de scroll completo, se ven las dos superpuestas durante gran
          // parte del scroll. Se comprime el fade a FADE_FRACTION del slot: transicion rapida,
          // el resto del scroll de ese slot se lee una sola tarjeta nitida.
          var FADE_FRACTION = 0.35;
          var local = Math.max(0, Math.min(1, (totalProgress - i) / FADE_FRACTION));
          // Blur progresivo ademas del fade: durante la ventana de transicion (breve, pero
          // sigue existiendo con scrub continuo) el texto que recede se "disuelve" en vez de
          // competir nitido con el texto de la tarjeta de abajo.
          gsap.set(card, { scale: 1 - local * 0.12, opacity: 1 - local, filter: 'blur(' + (local * 6) + 'px)' });
        });
      }
    });
  };
})();
