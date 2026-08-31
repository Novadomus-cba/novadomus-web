# Componente: Carrusel de tarjetas + Panel de detalle

**Origen:** `servicios.html` (Nova Domus web), construido sobre `KICKOFF_D_carrusel_servicios.md`.
**Uso previsto:** portar este mismo patrón a los paneles de presupuestos/proyectos ejecutivos
(portal interno) — cualquier lugar donde haga falta una galería de tarjetas que abre un detalle
ampliado con foto completa + texto.
**Dependencias:** ninguna. Es 100% HTML + CSS + JS vanilla. Si la página usa Lenis (smooth scroll),
hay un solo punto de integración obligatorio (ver §5). Si no usa Lenis, se ignora esa parte y
funciona igual.

---

## 1. Qué es cada pieza

- **Carrusel** (`.carousel`): fila de tarjetas (`.card`) con scroll horizontal nativo
  (`scroll-snap`), flechas sólidas de navegación y una barra de progreso.
- **Tarjeta** (`.card__link`): foto de fondo + degradé + título abajo-izquierda + botón "+"
  abajo-derecha. Zoom sutil de la imagen en hover/focus. Es un `<a href="#panel-id">` real, no un
  botón — funciona como link incluso sin JS.
- **Panel** (`dialog.panel`): `<dialog>` nativo. Al hacer click en la tarjeta, se abre con
  `showModal()` — foco atrapado, `::backdrop`, todo gratis del navegador. Adentro: foto completa
  (sin recortar), título, texto, y opcionalmente un bloque destacado (`.panel__highlight`) o
  bloques alternados imagen/texto (`.panel__block`).

---

## 2. HTML — plantilla de una tarjeta + su panel

```html
<!-- Dentro de <ul class="carousel__track" id="services-track" role="list"> -->
<li class="card">
  <a class="card__link" href="#panel-mi-servicio" id="mi-servicio"
     aria-controls="panel-mi-servicio" aria-expanded="false" data-panel="panel-mi-servicio">
    <img src="ruta/foto-640.webp" srcset="ruta/foto-640.webp 640w, ruta/foto-960.webp 960w"
         sizes="320px" width="720" height="1280" loading="lazy" decoding="async" alt="">
    <span class="card__body">
      <span class="card__title">Mi Servicio</span>
      <span class="card__plus" aria-hidden="true">
        <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M7 0V14" stroke="currentColor" stroke-linecap="round"/>
          <path d="M0 7H14" stroke="currentColor" stroke-linecap="round"/>
        </svg>
      </span>
    </span>
    <span class="u-sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);">Ver más sobre Mi Servicio</span>
  </a>
</li>
```

```html
<!-- Al final del <body>, uno por tarjeta -->
<dialog class="panel" id="panel-mi-servicio" aria-labelledby="panel-mi-servicio-title">
  <div class="panel__progress" aria-hidden="true"><span></span></div>
  <button type="button" class="panel__close" data-panel-close aria-label="Cerrar detalle">✕</button>
  <div class="panel__scroll" data-lenis-prevent>
    <figure class="panel__hero reveal">
      <img src="ruta/foto-1440.webp" srcset="ruta/foto-960.webp 960w, ruta/foto-1440.webp 1440w"
           sizes="880px" width="720" height="1280" loading="lazy" decoding="async"
           alt="Descripción real y específica de lo que se ve en la foto">
    </figure>
    <header class="panel__head reveal">
      <p class="eyebrow">Servicio</p>
      <h2 class="panel__title" id="panel-mi-servicio-title">Mi Servicio</h2>
      <p class="panel__lede">Descripción completa del servicio, 2-4 oraciones.</p>
    </header>

    <!-- Opcional: destacado (ej. "También hacemos Proyecto Ejecutivo completo") -->
    <div class="panel__highlight reveal">
      <span class="panel__highlight-tag">También hacemos</span>
      <h3>Título del destacado</h3>
      <p>Texto del destacado.</p>
    </div>

    <!-- Opcional: bloques alternados imagen/texto (repetir, alternar data-flip) -->
    <div class="panel__block reveal" data-format="portrait">
      <figure class="panel__block-media"><img src="..." alt="..." loading="lazy"></figure>
      <div class="panel__block-text">
        <h3>Subtítulo</h3>
        <p>Texto del bloque.</p>
      </div>
    </div>
    <div class="panel__block reveal" data-format="landscape" data-flip>
      <figure class="panel__block-media"><img src="..." alt="..." loading="lazy"></figure>
      <div class="panel__block-text">
        <h3>Otro subtítulo</h3>
        <p>Texto.</p>
      </div>
    </div>

    <div class="panel__cta reveal">
      <a class="btn btn-outline" href="contacto.html">Pedir una visita técnica</a>
    </div>
  </div>
</dialog>
```

`data-format` en `.panel__block` acepta `portrait` (4:5), `landscape` (16:10) o `square` (1:1).
Sin `data-format`, la imagen ocupa el ancho disponible sin relación de aspecto forzada — **no
inventar un `wide`/panorámico si la foto real es vertical**: forzar un recorte panorámico sobre
una foto de celular vertical es exactamente el bug de recorte que se corrigió en `servicios.html`
la sesión anterior. Si no hay foto panorámica real, usar `portrait` o dejar sin `data-format`.

`data-flip` en un bloque invierte el orden (imagen a la derecha en vez de izquierda) solo en
pantallas ≥720px — sirve para que los bloques no queden todos iguales en una fila larga.

---

## 3. CSS — completo, tal como está probado en producción

Los tokens de color (`var(--dorado)`, `var(--surface)`, etc.) son los que ya existen en cada
página de Nova Domus. Si se porta a otra página/repo con otros nombres de variable, hay que
reemplazarlos (o agregar un `:root` con esos mismos nombres).

```css
.services{padding:56px 0 60px;}
.services__lede{margin-top:-8px;}

.carousel{position:relative;}
.carousel__track{display:flex;gap:16px;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x mandatory;scroll-behavior:smooth;padding:4px 22px 16px;margin:0;list-style:none;scrollbar-width:none;-ms-overflow-style:none;}
.carousel__track::-webkit-scrollbar{display:none;}
.carousel__track:focus-visible{outline:2px solid var(--dorado);outline-offset:4px;}

.card{flex:0 0 clamp(260px,78vw,320px);scroll-snap-align:start;}
@media (min-width:900px){.card{flex-basis:320px;}}

.card__link{position:relative;display:block;overflow:hidden;aspect-ratio:3/4;border-radius:16px;background:var(--azul-nova);cursor:pointer;}
.card__link img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .6s cubic-bezier(.16,1,.3,1);}
.card__link:hover img,.card__link:focus-visible img{transform:scale(1.1);}
.card__link::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(to top,rgba(11,19,43,.9) 0%,rgba(11,19,43,.35) 40%,transparent 62%);}
.card__body{position:absolute;inset:auto 0 0 0;z-index:1;display:flex;align-items:flex-end;justify-content:space-between;gap:12px;padding:20px;}
.card__title{font-family:'Michroma';font-size:.82rem;line-height:1.35;color:var(--crema);max-width:14ch;}
.card__plus{flex:none;display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:12px;border:1px solid rgba(253,251,240,.4);background:rgba(253,251,240,.1);transition:background .3s,border-color .3s,color .3s,transform .4s;}
.card__plus svg{width:16px;height:16px;stroke:currentColor;stroke-width:1.6;}
.card__link:hover .card__plus,.card__link:focus-visible .card__plus{background:var(--dorado);border-color:var(--dorado);color:var(--azul-profundo);transform:rotate(90deg);}

.carousel__nav{position:absolute;top:calc(50% - 14px);transform:translateY(-50%);z-index:3;display:flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:14px;border:none;background:var(--crema);color:var(--azul-profundo);box-shadow:0 8px 24px rgba(0,0,0,.4);transition:transform .3s,background .3s,opacity .2s;cursor:pointer;}
.carousel__nav svg{width:22px;height:22px;}
.carousel__nav:hover{background:var(--dorado);}
.carousel__nav.prev{left:-4px;}
.carousel__nav.next{right:-4px;}
.carousel__nav[hidden]{display:none;}
@media (max-width:820px){.carousel__nav{display:none;}}

.carousel__progress{position:relative;height:3px;border-radius:2px;background:var(--line);overflow:hidden;max-width:220px;margin:20px auto 0;}
.carousel__progress-thumb{position:absolute;inset:0 auto 0 0;width:100%;display:block;background:var(--dorado);border-radius:2px;transform-origin:left center;will-change:transform;}

.services-note{margin-top:24px;font-size:.85rem;color:var(--text-secondary);}
.services-note strong{color:var(--crema);font-weight:600;}
.services-note a{color:var(--dorado);text-decoration:underline;}

/* IMPORTANTE: margin:auto es lo que centra el <dialog> nativo. Si la pagina tiene un reset
   global tipo *{margin:0}, hay que reafirmarlo aca explicitamente o el dialog queda pegado
   en la esquina superior izquierda -- ver Gotcha #1 en la seccion 6. */
.panel{width:min(880px,92vw);max-height:88vh;margin:auto;padding:0;border:none;border-radius:20px;overflow:hidden;background:var(--surface);color:var(--crema);box-shadow:0 40px 120px rgba(0,0,0,.6);}
.panel::backdrop{background:rgba(11,19,43,.75);}
.panel[open]{animation:panel-in .5s cubic-bezier(.16,1,.3,1) both;transform-origin:var(--ox,50%) var(--oy,50%);}
.panel.is-closing{animation:panel-out .25s ease both;}
@keyframes panel-in{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
@keyframes panel-out{to{opacity:0;transform:scale(.96)}}

.panel__progress{position:sticky;top:0;z-index:5;height:2px;background:var(--line);}
.panel__progress span{display:block;height:100%;width:100%;background:var(--dorado);transform:scaleX(0);transform-origin:left center;}

.panel__close{position:absolute;top:14px;right:14px;z-index:6;width:40px;height:40px;border-radius:50%;background:var(--azul-nova);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--crema);}
.panel__close:hover{border-color:var(--dorado);}

.panel__scroll{max-height:88vh;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;}
.panel__hero{background:#000;}
.panel__hero img{width:100%;height:auto;max-height:60vh;object-fit:contain;display:block;margin:0 auto;}
.panel__head{padding:28px 32px 8px;}
.panel__head .eyebrow{margin-bottom:10px;}
.panel__title{font-size:1.35rem;margin-bottom:12px;text-transform:none;}
.panel__lede{color:var(--text-secondary);font-size:.95rem;margin:0 0 24px;max-width:none;}

.panel__block{display:grid;gap:20px;padding:24px 32px;grid-template-columns:1fr;align-items:center;}
@media (min-width:720px){.panel__block{grid-template-columns:1fr 1fr;}.panel__block[data-flip] .panel__block-media{order:2;}}
.panel__block-media{border-radius:14px;overflow:hidden;background:var(--azul-nova);margin:0;}
.panel__block-media img{width:100%;height:100%;object-fit:cover;display:block;max-height:60vh;}
.panel__block[data-format="portrait"] .panel__block-media{aspect-ratio:4/5;}
.panel__block[data-format="landscape"] .panel__block-media{aspect-ratio:16/10;}
.panel__block[data-format="square"] .panel__block-media{aspect-ratio:1/1;}
.panel__block-text h3{font-size:1.05rem;margin-bottom:8px;}
.panel__block-text p{color:var(--text-secondary);font-size:.9rem;margin:0;max-width:none;}

.panel__cta{padding:8px 32px 32px;}

.panel__highlight{margin:0 32px 24px;padding:20px 22px;border:1px solid var(--border);border-left:3px solid var(--dorado);border-radius:12px;background:var(--azul-nova);}
.panel__highlight-tag{display:block;font-family:'Michroma';font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;color:var(--dorado);margin-bottom:8px;}
.panel__highlight h3{font-size:1rem;margin-bottom:8px;}
.panel__highlight p{color:var(--text-secondary);font-size:.88rem;margin:0;max-width:none;}

.reveal{opacity:1;}
.js .reveal{opacity:0;transform:translateY(24px);}
.js .reveal.is-in{opacity:1;transform:none;transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1);}
.js .panel__block.is-in .panel__block-text{transition-delay:.1s;}

@media (prefers-reduced-motion:reduce){
  .card__link img,.card__plus,.carousel__nav{transition:none!important;}
  .card__link:hover img{transform:none;}
  .panel[open],.panel.is-closing{animation:none!important;}
  .js .reveal{opacity:1;transform:none;}
  .carousel__track{scroll-behavior:auto;}
}
```

### Fallback sin JavaScript

```html
<!-- En algun <noscript> del <head> o del body -->
<style>
  .panel{display:block;position:static;max-height:none;width:auto;margin:2rem auto;}
  .panel__close,.panel__progress{display:none;}
  .panel__scroll{max-height:none;overflow:visible;}
  .carousel__nav,.carousel__progress{display:none;}
</style>
```

Y en el `<head>`, lo antes posible (antes de que pinte el carrusel), un script sincrónico chico:

```html
<script>document.documentElement.classList.add('js');</script>
```

Sin esto, `.reveal` nunca se oculta (fallback: contenido siempre visible, correcto para SEO/no-JS).

---

## 4. JavaScript — dos archivos, copiar tal cual

### `services-carousel.js` (flechas + barra de progreso del carrusel)

```js
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
```

### `service-panel.js` (apertura/cierre del `<dialog>`, Lenis, reveals, progreso de lectura)

```js
(function () {
  'use strict';

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  var openDialog = null;
  var openTrigger = null;
  var closedByPopstate = false;

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

  function init() {
    document.querySelectorAll('.card__link[data-panel]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var dialog = document.getElementById(link.getAttribute('data-panel'));
        if (!dialog) return;
        e.preventDefault();
        openPanel(dialog, link);
      });
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
    });

    window.addEventListener('popstate', function () {
      if (openDialog) closePanel(openDialog, true);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
```

---

## 5. Integración con Lenis (smooth scroll)

Si la página usa Lenis, hay que exponerlo en `window` para que `service-panel.js` pueda
pausarlo al abrir el panel y reanudarlo al cerrar — **sin esto, la página de atrás se sigue
scrolleando con el panel abierto**, porque Lenis intercepta el scroll independientemente de que
el `<dialog>` nativo bloquee el scroll del body.

```js
// Donde se instancia Lenis (una sola vez):
var lenis = new Lenis();
window.lenis = lenis; // otros scripts (services-carousel/service-panel) necesitan poder pausarlo
```

Si la página NO usa Lenis, `service-panel.js` ya lo maneja solo (`if (window.lenis)` — no rompe
nada si `window.lenis` no existe).

También hace falta `data-lenis-prevent` en `.panel__scroll` (ya está en la plantilla del §2) para
que Lenis no se coma la rueda del mouse dentro del panel en desktop.

---

## 6. Gotchas encontrados armando esto (no repetir el error)

1. **`margin:auto` roto por un reset global.** Si la página tiene `*{margin:0;padding:0;}` (muy
   común), eso pisa el `margin:auto` que el navegador usa por default para centrar un
   `<dialog>` abierto con `showModal()`. Sin overridearlo explícitamente en `.panel{margin:auto;}`,
   el panel aparece pegado en la esquina superior izquierda de la pantalla en vez de centrado.
   Ya está en el CSS de §3, pero si se copia parcialmente y se pierde esa línea, vuelve el bug.

2. **Umbral de scroll en los extremos del carrusel.** Si el track tiene padding lateral (para
   alinear la primera/última tarjeta con el `.wrap` de la página), el scroll de reposo en cada
   punta NO es exactamente `0` / `scrollWidth-clientWidth` — cae en un valor cercano al padding.
   Comparar contra `0` directamente hace que la flecha "anterior" nunca se oculte al principio.
   Se resuelve con un umbral (`EDGE_THRESHOLD`, ya en el JS de §4) en vez de comparar contra 0 a
   secas.

3. **No forzar formatos panorámicos sobre fotos verticales.** El sistema de `data-format`
   soporta `wide` (21:9) en el kickoff original, pero si la foto real es un vertical de celular,
   forzar ese recorte reproduce el mismo bug de crop agresivo que ya se corrigió una vez en este
   proyecto (ver historial de `servicios.html`). Solo usar `wide`/`landscape` cuando la foto
   original tiene esa proporción; si no, dejar sin `data-format` (ancho completo, alto natural) o
   usar `portrait`.

4. **Testear el cierre por "atrás del navegador" en aislamiento.** Si se prueba backdrop-click
   y  DESPUÉS un `goBack()` de test en la misma sesión, son dos "atrás" en cadena (uno lo hace la
   propia librería al cerrar por backdrop, otro lo hace el test) — el segundo termina saliendo de
   la página entera. Cada mecanismo de cierre (X, ESC, backdrop, atrás del navegador) se prueba
   por separado, desde un estado recién abierto.

---

## 7. Checklist de contenido por tarjeta/panel

- [ ] Foto de tarjeta (recorte 3:4, `object-fit:cover` — puede ser cualquier foto real, se recorta)
- [ ] Foto de panel (se muestra completa con `object-fit:contain`, sin recortar — usar la de
      mejor calidad/resolución disponible)
- [ ] Título corto (tarjeta) y título completo (panel, puede ser el mismo)
- [ ] Descripción completa (2-4 oraciones) para `.panel__lede`
- [ ] `alt` real y específico en la foto del panel — no "foto de servicio"
- [ ] Opcional: destacado (`.panel__highlight`) si hay algo puntual para resaltar
- [ ] Opcional: 1 o más bloques (`.panel__block`) con foto + texto adicional, si hay material

**Regla de publicación (igual que el resto del sitio):** solo se publica con foto real propia. Si
no hay foto para una tarjeta, esa tarjeta no se agrega — mejor un hueco que una foto de catálogo o
recortada de mala manera.

---

*Este documento describe el componente tal como quedó funcionando en `servicios.html` de
novadomus-web. Si se porta al portal de presupuestos y se le hacen cambios ahí, conviene traer
esas mejoras de vuelta acá (o viceversa) para que no diverjan las dos implementaciones.*
