# KICKOFF D — Carrusel de Servicios + Panel de detalle expandible

**Proyecto:** `Novadomus-cba/novadomus-web` · rama `main`
**Página objetivo:** `servicios.html`
**Dependencias nuevas:** NINGUNA. Se hace 100% con lo que ya está en el repo (GSAP + ScrollTrigger + Lenis) + APIs nativas.
**Referencia de comportamiento:** grabación del carrusel de baipromotor.com.ar (B10). Se replica el *mecanismo*, no la estética: la paleta, tipografía y tono son los de Nova Domus.

---

## 0. Resumen de qué hay que construir

Dos componentes acoplados:

1. **`services-carousel`** — carrusel horizontal con scroll-snap nativo. Tarjetas verticales con foto (zoom en hover), título abajo a la izquierda, botón `+` abajo a la derecha. Flechas de navegación **sólidas y visibles** (no fantasmas) + barra de progreso segmentada.
2. **`service-panel`** — al tocar `+`, se despliega un panel modal que crece desde la tarjeta. Adentro: hero full-bleed, y luego bloques alternados imagen/texto en formatos mixtos (vertical, horizontal, panorámico) que aparecen con fundido + subida a medida que se scrollea. Barra de progreso de lectura arriba. Cierre con X, ESC, click en backdrop y botón "atrás" del celular.

---

## 1. Decisiones técnicas ya tomadas (no re-evaluar)

| Necesidad | Decisión | Por qué |
|---|---|---|
| Carrusel | **CSS `scroll-snap` nativo + `overflow-x: auto`** | Swipe nativo en mobile, accesible por teclado, funciona sin JS. Swiper (~47 KB) está fuera de presupuesto según la investigación de performance del proyecto. |
| Modal | **`<dialog>` nativo + `showModal()`** | Focus trap, ESC y `::backdrop` gratis y correctos. Nada de divs con `role="dialog"` hechos a mano. |
| Expansión desde la tarjeta | **`transform: scale` + `transform-origin` calculado** (Fase 1). GSAP Flip queda para Fase 2. | Flip dentro del top layer del `<dialog>` es frágil. La escala con origen en la tarjeta da el 90% del efecto con 10% del riesgo. |
| Reveals dentro del panel | **IntersectionObserver con `root: panel`**, NO ScrollTrigger | ScrollTrigger con `scroller` custom + contenedor con `data-lenis-prevent` se rompe seguido. IntersectionObserver es 15 líneas y no falla. |
| Lightbox de las fotos del panel | **No en Fase 1** | El panel ya es el zoom. GLightbox se evalúa después si Agustín lo pide. |
| Fuente de contenido | **HTML real en la página**, no un objeto JS | Requisito del proyecto: el contenido esencial tiene que existir sin JavaScript. |

---

## 2. Estructura de markup

Cada servicio es **una tarjeta + un `<dialog>` con el contenido completo**. El contenido vive en el HTML, no en JS.

```html
<section class="services" aria-labelledby="services-title">
  <h2 id="services-title" class="services__title">Servicios</h2>
  <p class="services__lede">Del cable a la app, con equipo propio.</p>

  <div class="carousel">
    <!-- track: el que scrollea -->
    <ul class="carousel__track" role="list" tabindex="0"
        aria-label="Servicios de Nova Domus">

      <li class="card">
        <a class="card__link" href="#panel-domotica"
           aria-controls="panel-domotica" aria-expanded="false">
          <figure class="card__media">
            <picture>
              <source type="image/avif" srcset="img/servicios/domotica-600.avif 600w, img/servicios/domotica-1200.avif 1200w" sizes="(max-width:768px) 78vw, 340px">
              <source type="image/webp" srcset="img/servicios/domotica-600.webp 600w, img/servicios/domotica-1200.webp 1200w" sizes="(max-width:768px) 78vw, 340px">
              <img src="img/servicios/domotica-600.jpg"
                   alt="Keypad de control instalado en living, escena de noche activa"
                   width="1200" height="1600" loading="lazy" decoding="async">
            </picture>
          </figure>
          <div class="card__body">
            <h3 class="card__title">Domótica e integración</h3>
            <span class="card__plus" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/>
              </svg>
            </span>
          </div>
          <span class="u-sr-only">Ver detalle de Domótica e integración</span>
        </a>
      </li>

      <!-- ...resto de tarjetas... -->
    </ul>

    <!-- controles -->
    <button class="carousel__nav carousel__nav--prev" type="button" aria-label="Servicios anteriores" hidden>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <button class="carousel__nav carousel__nav--next" type="button" aria-label="Servicios siguientes">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>

    <div class="carousel__progress" aria-hidden="true"><span class="carousel__progress-thumb"></span></div>
  </div>
</section>
```

Y el panel, uno por servicio, al final del `<body>`:

```html
<dialog class="panel" id="panel-domotica" aria-labelledby="panel-domotica-title">
  <div class="panel__progress" aria-hidden="true"><span></span></div>

  <button class="panel__close" type="button" aria-label="Cerrar detalle">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>
  </button>

  <!-- scroller interno: data-lenis-prevent es OBLIGATORIO -->
  <div class="panel__scroll" data-lenis-prevent>

    <header class="panel__head reveal">
      <h2 class="panel__title" id="panel-domotica-title">Domótica</h2>
      <p class="panel__lede">Escenas, climatización y accesos bajo una sola interfaz. Programado por nosotros, no por un tercero.</p>
    </header>

    <figure class="panel__hero reveal" data-format="wide">
      <picture>…</picture>
    </figure>

    <!-- bloque alternado: data-format define el aspecto de la imagen -->
    <div class="panel__block reveal" data-format="portrait">
      <figure class="panel__block-media"><picture>…</picture></figure>
      <div class="panel__block-text">
        <h3>Una app, no cinco</h3>
        <p>Home Assistant unifica luces, clima, riego y cámaras en un solo tablero. Sin saltar entre aplicaciones de fabricante.</p>
      </div>
    </div>

    <div class="panel__block reveal" data-format="landscape" data-flip>
      <figure class="panel__block-media"><picture>…</picture></figure>
      <div class="panel__block-text">
        <h3>Sistema abierto</h3>
        <p>No te atás a un fabricante. Si mañana cambiás una marca de dispositivo, el sistema sigue funcionando.</p>
      </div>
    </div>

    <footer class="panel__cta reveal">
      <a class="btn btn--gold" href="contacto.html">Pedir una visita técnica</a>
    </footer>
  </div>
</dialog>
```

**Formatos de imagen soportados** (`data-format`, esto es lo que Agustín pidió como "múltiples imágenes escalonadas con distintos formatos"):

| valor | `aspect-ratio` | uso |
|---|---|---|
| `portrait` | `4 / 5` | detalle de terminación, keypad, rack vertical |
| `landscape` | `16 / 10` | ambiente completo, fachada |
| `square` | `1 / 1` | producto, detalle de caja |
| `wide` | `21 / 9` | hero y cortes panorámicos full-bleed |

Regla dura: **ninguna imagen del panel supera `max-height: 68vh`**. Si una foto es más alta, se recorta con `object-fit: cover`. Es lo que hace que se pueda scrollear el panel sin perderse.

---

## 3. CSS — especificación

### 3.1 Tokens (usar los que ya existen en el repo; estos son los valores esperados)

```css
:root{
  --nd-azul-profundo:#0B132B;
  --nd-azul-nova:#141E61;
  --nd-gris:#787A91;
  --nd-crema:#FDFBF0;
  --nd-dorado:#C8A96E;
  --nd-ease:cubic-bezier(.16,1,.3,1);
  --nd-radius:16px;
}
```

### 3.2 Carrusel

```css
.carousel{ position:relative; }

.carousel__track{
  display:flex; gap:1rem;
  overflow-x:auto; overscroll-behavior-x:contain;
  scroll-snap-type:x mandatory; scroll-behavior:smooth;
  padding:.25rem .25rem 1.25rem;            /* espacio para el focus ring */
  scrollbar-width:none;                      /* Firefox */
  margin:0; list-style:none;
}
.carousel__track::-webkit-scrollbar{ display:none; }
.carousel__track:focus-visible{ outline:2px solid var(--nd-dorado); outline-offset:4px; }

.card{
  flex:0 0 clamp(260px, 78vw, 340px);        /* 1 tarjeta ancha en mobile, 3-4 en desktop */
  scroll-snap-align:start;
}
@media (min-width:900px){ .card{ flex-basis:340px; } }

.card__link{
  position:relative; display:block; overflow:hidden;
  aspect-ratio:3 / 4; border-radius:var(--nd-radius);
  background:var(--nd-azul-nova); text-decoration:none; color:var(--nd-crema);
}
.card__media, .card__media img{ width:100%; height:100%; margin:0; }
.card__media img{ object-fit:cover; display:block;
  transform:scale(1.001);
  transition:transform .8s var(--nd-ease), filter .5s ease;
}
.card__link:hover .card__media img,
.card__link:focus-visible .card__media img{ transform:scale(1.07); }

/* scrim: sin esto el título blanco no cumple contraste sobre foto */
.card__link::after{
  content:""; position:absolute; inset:0; pointer-events:none;
  background:linear-gradient(to top, rgba(11,19,43,.88) 0%, rgba(11,19,43,.35) 38%, transparent 62%);
}

.card__body{
  position:absolute; inset:auto 0 0 0; z-index:1;
  display:flex; align-items:flex-end; justify-content:space-between; gap:.75rem;
  padding:1.15rem 1.15rem 1.15rem 1.25rem;
}
.card__title{
  font-family:'Inter',Arial,sans-serif; font-weight:600;
  font-size:1.0625rem; line-height:1.25; margin:0; max-width:12ch;
  text-wrap:balance;
}

/* botón + : 44px de target táctil, se vuelve dorado en hover */
.card__plus{
  flex:0 0 auto; display:grid; place-items:center;
  width:44px; height:44px; border-radius:12px;
  border:1px solid rgba(253,251,240,.55);
  background:rgba(253,251,240,.10);
  backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px);
  transition:background .35s var(--nd-ease), border-color .35s var(--nd-ease),
             color .35s var(--nd-ease), transform .45s var(--nd-ease);
}
.card__link:hover .card__plus,
.card__link:focus-visible .card__plus{
  background:var(--nd-dorado); border-color:var(--nd-dorado);
  color:var(--nd-azul-profundo); transform:rotate(90deg);
}
```

### 3.3 Flechas — **este es el punto que Agustín marcó como deficiente en la referencia**

En el video la flecha es un cuadrado blanco casi transparente que se pierde sobre la foto. Acá va **sólida, con sombra, y con área táctil real**:

```css
.carousel__nav{
  position:absolute; top:calc(50% - 1.25rem); transform:translateY(-50%);
  z-index:3; display:grid; place-items:center;
  width:52px; height:52px; padding:0;
  border:none; border-radius:14px; cursor:pointer;
  background:var(--nd-crema); color:var(--nd-azul-profundo);
  box-shadow:0 8px 28px rgba(11,19,43,.45), 0 0 0 1px rgba(11,19,43,.08);
  transition:transform .3s var(--nd-ease), background .3s var(--nd-ease), opacity .3s ease;
}
.carousel__nav svg{ width:24px; height:24px; }
.carousel__nav:hover{ background:var(--nd-dorado); transform:translateY(-50%) scale(1.06); }
.carousel__nav:focus-visible{ outline:2px solid var(--nd-dorado); outline-offset:3px; }
.carousel__nav[hidden]{ display:none; }
.carousel__nav--prev{ left:-10px; }
.carousel__nav--next{ right:-10px; }

/* en táctil no van: se navega con swipe y queda la barra de progreso */
@media (pointer:coarse){ .carousel__nav{ display:none; } }
```

### 3.4 Barra de progreso del carrusel

Continua, no de puntitos: dice de un vistazo cuánto queda.

```css
.carousel__progress{
  position:relative; height:3px; border-radius:2px;
  background:rgba(120,122,145,.30); overflow:hidden;
  max-width:220px; margin:.25rem auto 0;
}
.carousel__progress-thumb{
  position:absolute; inset:0 auto 0 0; display:block;
  background:var(--nd-dorado); border-radius:2px;
  transform-origin:left center;
  will-change:transform;
}
```

El thumb se maneja con `scaleX` + `translateX` desde JS (ver §4.1). Solo `transform` → compositado, cero jank.

### 3.5 Panel

```css
.panel{
  width:min(1100px, 94vw); max-height:92vh; padding:0;
  border:none; border-radius:20px; overflow:hidden;
  background:var(--nd-azul-profundo); color:var(--nd-crema);
  box-shadow:0 40px 120px rgba(0,0,0,.6);
}
.panel::backdrop{ background:rgba(11,19,43,.72); backdrop-filter:blur(3px); }

/* animación de apertura: crece desde la tarjeta.
   --ox/--oy los setea el JS con la posición de la tarjeta clickeada */
.panel[open]{ animation:panel-in .55s var(--nd-ease) both; transform-origin:var(--ox,50%) var(--oy,50%); }
.panel.is-closing{ animation:panel-out .3s ease both; }
@keyframes panel-in{ from{ opacity:0; transform:scale(.86); } to{ opacity:1; transform:scale(1); } }
@keyframes panel-out{ to{ opacity:0; transform:scale(.96); } }
.panel::backdrop{ animation:fade-in .4s ease both; }
@keyframes fade-in{ from{opacity:0} to{opacity:1} }

.panel__scroll{
  max-height:92vh; overflow-y:auto; overscroll-behavior:contain;
  -webkit-overflow-scrolling:touch;
  padding-bottom:4rem;
}

/* progreso de lectura */
.panel__progress{ position:sticky; top:0; z-index:5; height:2px; background:rgba(120,122,145,.25); }
.panel__progress span{ display:block; height:100%; width:0; background:var(--nd-dorado); }

.panel__close{
  position:absolute; top:1rem; right:1rem; z-index:6;
  width:44px; height:44px; display:grid; place-items:center;
  border:none; border-radius:12px; cursor:pointer;
  background:var(--nd-crema); color:var(--nd-azul-profundo);
  box-shadow:0 6px 20px rgba(0,0,0,.35);
}

.panel__head{ padding:clamp(2rem,5vw,3.5rem) clamp(1.25rem,4vw,3rem) clamp(1.5rem,3vw,2.5rem); max-width:62ch; }
.panel__title{
  font-family:'Michroma',Arial,sans-serif;
  font-size:clamp(1.35rem,3.2vw,2rem); letter-spacing:.06em;
  text-transform:uppercase; margin:0 0 .9rem;
}
.panel__lede{ font-size:clamp(.95rem,1.6vw,1.0625rem); line-height:1.6; color:rgba(253,251,240,.82); margin:0; }

/* bloques alternados */
.panel__block{
  display:grid; gap:clamp(1.25rem,3vw,2.5rem); align-items:center;
  grid-template-columns:1fr;
  padding:clamp(1.5rem,4vw,3rem) clamp(1.25rem,4vw,3rem);
}
@media (min-width:820px){
  .panel__block{ grid-template-columns:1fr 1fr; }
  .panel__block[data-flip] .panel__block-media{ order:2; }
}
.panel__block-media{ margin:0; border-radius:14px; overflow:hidden; background:var(--nd-azul-nova); }
.panel__block-media img{ width:100%; height:100%; object-fit:cover; display:block; max-height:68vh; }

[data-format="portrait"]  .panel__block-media{ aspect-ratio:4/5; }
[data-format="landscape"] .panel__block-media{ aspect-ratio:16/10; }
[data-format="square"]    .panel__block-media{ aspect-ratio:1/1; }
[data-format="wide"]      .panel__block-media,
.panel__hero[data-format="wide"]{ aspect-ratio:21/9; border-radius:0; }

.panel__block-text h3{ font-family:'Inter',Arial,sans-serif; font-weight:600; font-size:clamp(1.1rem,2.2vw,1.5rem); line-height:1.3; margin:0 0 .75rem; }
.panel__block-text p{ font-size:.9375rem; line-height:1.65; color:rgba(253,251,240,.82); margin:0; max-width:46ch; }
```

### 3.6 Reveal (fundido + subida)

```css
.reveal{ opacity:1; }                          /* fallback sin JS: visible */
.js .reveal{ opacity:0; transform:translateY(26px); }
.js .reveal.is-in{
  opacity:1; transform:none;
  transition:opacity .75s var(--nd-ease), transform .75s var(--nd-ease);
}
/* la imagen entra primero, el texto 120ms después */
.js .panel__block.is-in .panel__block-text{ transition-delay:.12s; }

@media (prefers-reduced-motion:reduce){
  .card__media img, .card__plus, .carousel__nav{ transition:none !important; }
  .card__link:hover .card__media img{ transform:none; }
  .panel[open], .panel.is-closing, .panel::backdrop{ animation:none !important; }
  .js .reveal{ opacity:1; transform:none; }
  .js .reveal.is-in{ transition:none; }
  .carousel__track{ scroll-behavior:auto; }
}
```

`document.documentElement.classList.add('js')` como primera línea del script. Sin JS nada se oculta.

---

## 4. JavaScript — especificación

Dos módulos nuevos: `js/services-carousel.js` y `js/service-panel.js`. Vanilla, sin GSAP (no hace falta acá). Código y comentarios en inglés.

### 4.1 `services-carousel.js`

Responsabilidades, nada más:

1. **Flechas.** `track.scrollBy({ left: pageWidth, behavior:'smooth' })` donde `pageWidth = track.clientWidth * 0.9` (avanza casi una vista, dejando una tarjeta de pista visual — es lo que hace la referencia y por eso se entiende que hay más contenido).
2. **Estado de las flechas.** En `scroll` (throttled con `requestAnimationFrame`): `prev.hidden = scrollLeft <= 4`; `next.hidden = scrollLeft >= scrollWidth - clientWidth - 4`.
3. **Barra de progreso.** `ratio = clientWidth / scrollWidth` → `thumb.style.transform = 'scaleX(' + ratio + ') translateX(' + (scrollLeft / clientWidth * 100) + '%)'`. Recalcular en `resize` con `ResizeObserver`.
4. **Nada de drag con mouse custom.** El scroll nativo ya funciona con trackpad y con shift+wheel. No interceptar `wheel`.

Detalle Lenis: el `track` es scroll horizontal, Lenis por defecto solo maneja vertical, así que **no** hace falta `data-lenis-prevent` acá. Verificar en desktop con trackpad que el scroll horizontal del carrusel no arrastre la página; si lo hace, agregar `data-lenis-prevent` al track.

### 4.2 `service-panel.js`

Flujo de apertura:

```
click en .card__link
  → preventDefault()
  → guardar el <a> que disparó (para devolver el foco al cerrar)
  → medir rect de la tarjeta y setear --ox/--oy en el dialog:
      ox = (cardCenterX / window.innerWidth) * 100 + '%'
      oy = (cardCenterY / window.innerHeight) * 100 + '%'
  → lenis.stop()                        // CRÍTICO
  → document.documentElement.style.overflow = 'hidden'
  → dialog.showModal()
  → link.setAttribute('aria-expanded','true')
  → history.pushState({panel:id}, '', '#' + id)
  → observar los .reveal del panel con IntersectionObserver (root: .panel__scroll)
```

Flujo de cierre (X, ESC vía evento `cancel`, click en backdrop, `popstate`):

```
  → dialog.classList.add('is-closing')
  → esperar animationend (o 320ms de timeout de seguridad)
  → dialog.close(); classList.remove('is-closing')
  → lenis.start()
  → document.documentElement.style.overflow = ''
  → link.setAttribute('aria-expanded','false'); link.focus()
  → si la URL todavía tiene el hash del panel: history.back()
  → resetear .panel__scroll.scrollTop = 0 y quitar .is-in de los reveals
```

Puntos que **no se pueden omitir**:

- **`lenis.stop()` / `lenis.start()`**: sin esto, con el panel abierto el scroll se va a la página de atrás. Es el bug número uno de esta combinación.
- **`data-lenis-prevent` en `.panel__scroll`**: sin esto Lenis se come el wheel y el panel no scrollea con la rueda del mouse en desktop.
- **Click en backdrop**: `dialog.addEventListener('click', e => { if (e.target === dialog) close(); })`. Funciona porque el `::backdrop` reporta el propio dialog como target.
- **ESC**: `dialog.addEventListener('cancel', e => { e.preventDefault(); close(); })` — hay que interceptarlo para que corra la animación de salida en vez de cerrar de golpe.
- **`popstate`**: el botón atrás de Android cierra el panel en vez de salir del sitio. Es la diferencia entre que se sienta app o no.
- **Foco de vuelta al `+`** que abrió el panel.
- **Lazy de las imágenes del panel**: todas con `loading="lazy"`. Se cargan solo cuando se abre. Además, en el `mouseenter` de la tarjeta, hacer `link.querySelectorAll` del dialog asociado y forzar `img.loading='eager'` en la primera imagen para que el hero no aparezca en blanco — micro-optimización opcional, no bloqueante.

Reveal observer:

```js
// Reveal blocks as they enter the panel's own scroll container
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-in');
    io.unobserve(entry.target);          // one-way reveal, no re-trigger
  });
}, { root: scroller, rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
```

Barra de progreso de lectura, en el `scroll` del `.panel__scroll` (rAF-throttled):

```js
const max = scroller.scrollHeight - scroller.clientHeight;
bar.style.transform = 'scaleX(' + (max > 0 ? scroller.scrollTop / max : 0) + ')';
// bar con transform-origin:left; no tocar width (evita layout)
```

---

## 5. Fallback sin JavaScript

El `+` es un `<a href="#panel-id">`. Sin JS, `showModal()` nunca corre y el `<dialog>` está `display:none`. Para que el contenido siga siendo alcanzable:

```html
<noscript>
  <style>
    .panel{ display:block; position:static; max-height:none; width:auto; margin:2rem auto; }
    .panel__close, .panel__progress{ display:none; }
    .panel__scroll{ max-height:none; overflow:visible; }
    .carousel__nav, .carousel__progress{ display:none; }
  </style>
</noscript>
```

Resultado sin JS: el carrusel es una fila scrolleable nativa (funciona) y los paneles quedan como secciones apiladas legibles al final de la página, alcanzables por el `href`. Cumple el requisito de contenido esencial sin JS del proyecto.

---

## 6. Contenido — qué necesita Agustín antes de que esto sirva

Claude Code arma la estructura con placeholders, pero hay que pedirle esto y dejarlo anotado en `03_ESTADO_ACTUAL.md`:

- Por servicio: **1 foto de tarjeta vertical (3:4)** + **1 hero panorámico (21:9)** + **3 a 5 fotos de bloque** con formato mixto.
- Fotos propias de obra, nunca de catálogo del fabricante (regla del manual de marca).
- Todas con `alt` descriptivo real, no "foto de servicio".
- Variantes AVIF + WebP + JPEG generadas con `sharp` en 600w y 1200w (tarjetas) / 900w y 1800w (bloques). `width`/`height` siempre presentes para no romper CLS.
- Servicios a cubrir (confirmar la lista y el orden con Agustín): Obra eléctrica · Redes · Domótica e integración · Seguridad y videovigilancia · Iluminación inteligente · Control de accesos.

---

## 7. Orden de trabajo (una cosa por vez, confirmar cada archivo)

1. `css/components/_services-carousel.css` — carrusel completo, tarjetas, flechas, progreso. Verificar en desktop y en mobile antes de seguir.
2. `servicios.html` — markup del carrusel con 6 tarjetas y placeholders de imagen.
3. `js/services-carousel.js` — flechas, estado, barra de progreso.
4. `css/components/_service-panel.css` — panel, bloques, reveals.
5. `servicios.html` — los 6 `<dialog>` con 3 bloques cada uno.
6. `js/service-panel.js` — apertura/cierre, lock de Lenis, IntersectionObserver, progreso de lectura, popstate.
7. `<noscript>` fallback + repaso de `prefers-reduced-motion`.

Un commit por punto. Diff a la vista antes de commitear. `git add -p` si hay cambios sin relación en el mismo archivo.

---

## 8. Checklist de verificación antes de declararlo listo

**Funcional**
- [ ] Swipe en mobile mueve el carrusel; el snap deja la tarjeta alineada al borde izquierdo.
- [ ] Flecha izquierda oculta al inicio, derecha oculta al final.
- [ ] Barra de progreso llega al 100% exactamente en el último scroll.
- [ ] Abrir panel → la página de atrás NO scrollea con la rueda ni con el dedo.
- [ ] La rueda del mouse SÍ scrollea dentro del panel (test del `data-lenis-prevent`).
- [ ] ESC, X, click en backdrop y botón atrás de Android cierran el panel.
- [ ] Al cerrar, el foco vuelve al `+` de la tarjeta correspondiente.
- [ ] Reabrir el mismo panel arranca desde arriba, con los reveals otra vez ocultos.
- [ ] Los bloques aparecen con fundido + subida, imagen antes que texto.

**Accesibilidad**
- [ ] Tab llega al carrusel, flechas del teclado lo mueven, focus visible dorado.
- [ ] Con `prefers-reduced-motion: reduce` activado: nada de zoom, nada de escala, nada de translate. Solo aparece.
- [ ] Contraste del título sobre el scrim ≥ 4.5:1 medido, no estimado.
- [ ] Todas las imágenes con `alt`.
- [ ] `axe` / Lighthouse Accessibility ≥ 95.

**Performance**
- [ ] Lighthouse mobile Performance ≥ 90.
- [ ] CLS < 0.1 (todas las imágenes con `width`/`height` o `aspect-ratio`).
- [ ] INP < 200 ms al abrir el panel (medir en el panel Performance de DevTools, track de Interactions).
- [ ] Cero librerías nuevas en el bundle. Confirmar con un diff del `<head>`.

**Marca**
- [ ] Michroma solo en el título del panel y el H2 de sección. Todo lo demás Inter.
- [ ] Dorado solo en: hover del `+`, barra de progreso, focus ring, botón CTA. Nunca como fondo de superficie ni relleno de texto largo.
- [ ] Fondo del panel azul profundo `#0B132B`. Nada de la paleta interna del Portal.

**Deploy**
- [ ] Verificar el archivo servido con cache-busting, no el local:
      `fetch('/novadomus-web/servicios.html?v=' + Date.now()).then(r=>r.text()).then(t=>console.log(t.includes('service-panel.js')))`

---

## 9. Fase 2 (no hacer ahora)

- **GSAP Flip** para que la foto de la tarjeta viaje literalmente hasta el hero del panel (shared element real, no solo escala).
- **Duotono navy en hover** de las tarjetas (`mix-blend-mode: luminosity` + `filter: grayscale`), ya especificado en la investigación de imágenes del proyecto.
- **Grain SVG** de marca sobre el fondo del panel, opacidad ≤ 0.15.
- **GLightbox** si Agustín quiere zoom pinch sobre las fotos de obra dentro del panel.
- Deep-link real por servicio: abrir `servicios.html#panel-domotica` con el panel ya desplegado (hoy el hash existe pero no autoabre; es 5 líneas más).

Cada una de estas se mide contra el mismo umbral: si baja Lighthouse mobile de 90, sube INP de 200 ms o CLS de 0.1 — se revierte.
