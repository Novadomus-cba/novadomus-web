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
  // progress value is the standard, reliable way to do this — same visual result (card i
  // recedes — scale floor 0.88, opacity floor 0.4 — while card i+1 is revealed on top of it,
  // reading order first-to-last, last card never recedes), no measurement conflicts.
  window.initStack = function (stageSelector, cardSelector) {
    if (reduced) return;
    var cards = gsap.utils.toArray(cardSelector);
    var n = cards.length;
    if (!n) return;
    cards.forEach(function (card, i) {
      // Reading order first: card 0 stacks on top initially and recedes to reveal
      // card 1, and so on — not the reverse (zIndex: i would keep the LAST card
      // permanently on top, hiding every earlier one for the whole scroll).
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
          var local = Math.max(0, Math.min(1, totalProgress - i));
          gsap.set(card, { scale: 1 - local * 0.12, opacity: 1 - local * 0.6 });
        });
      }
    });
  };
})();
