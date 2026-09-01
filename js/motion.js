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
})();
