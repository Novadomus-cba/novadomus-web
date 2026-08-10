(function () {
  'use strict';
  if (!window.gsap || !window.ScrollTrigger || !window.Lenis) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  gsap.registerPlugin(ScrollTrigger);

  if (!reduced) {
    var lenis = new Lenis();
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  // Técnica 1: split-text con pin + scrub (usar en index.html hero o nosotros.html#manifiesto)
  window.initSplitPin = function (selector, sectionSelector) {
    var el = document.querySelector(selector);
    if (!el || reduced) return;
    var text = el.textContent;
    el.textContent = '';
    text.split('').forEach(function (ch) {
      if (ch === ' ') {
        el.appendChild(document.createTextNode(' '));
        return;
      }
      var span = document.createElement('span');
      span.style.display = 'inline-block';
      span.textContent = ch;
      el.appendChild(span);
    });
    var chars = el.querySelectorAll('span');
    gsap.set(chars, { opacity: 0.12, y: 24 });
    gsap.to(chars, {
      opacity: 1, y: 0, stagger: 0.04, ease: 'none',
      scrollTrigger: { trigger: sectionSelector, start: 'top top', end: '+=160%', scrub: true, pin: true }
    });
  };

  // Técnica 2: cards apiladas (usar en nosotros.html#habitaciones, reemplaza el grid .rooms estático)
  window.initStack = function (stageSelector, cardSelector) {
    if (reduced) return;
    var cards = gsap.utils.toArray(cardSelector);
    cards.forEach(function (card, i) {
      gsap.set(card, { zIndex: i });
      if (i === cards.length - 1) return;
      ScrollTrigger.create({
        trigger: stageSelector,
        start: function () { return 'top+=' + (i * window.innerHeight * 1.1) + ' top'; },
        end: function () { return 'top+=' + ((i + 1) * window.innerHeight * 1.1) + ' top'; },
        scrub: true,
        onUpdate: function (self) {
          gsap.set(card, { scale: 1 - self.progress * 0.12, opacity: 1 - self.progress * 0.6 });
        }
      });
    });
    ScrollTrigger.create({ trigger: stageSelector, start: 'top top', end: 'bottom bottom', pin: true });
  };
})();
