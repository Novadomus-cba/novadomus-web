# KICKOFF F — Menú mobile: cierre, lado del drawer y gestos iOS

**Repo:** `Novadomus-cba/novadomus-web` · rama `main` · GitHub Pages
**Alcance:** navegación mobile (`<820px`) en las 7 páginas. No toca contenido, ni Supabase, ni el
carrusel de servicios, ni el portal interno.
**Auditado contra el repo el 2026-09-09** (GitHub API, rama `main`).

---

## 0. Diagnóstico (verificado en código, no supuesto)

Estado actual en las 7 páginas (CSS inline, bloque idéntico byte a byte en todas):

```css
.nav{position:fixed;top:0;left:0;right:0;z-index:60; ... }
.mobile-menu{position:fixed;inset:0;z-index:70; ... transform:translateX(100%); ... }
```

y en `js/site.js`, `initMobileMenu()` que sólo alterna la clase `.open` y `body.menu-open`.

Tres fallas concretas:

1. **No hay forma de cerrar.** El panel es `inset:0` con `z-index:70`, por encima de `.nav`
   (`z-index:60`). El hamburger sigue existiendo debajo pero queda tapado: el toque cae sobre el
   fondo del menú. Tampoco hay franja de backdrop para tocar afuera, ni botón de cierre propio.
2. **El "atrás" del sistema saca de la página.** `initMobileMenu()` no toca `history`, así que el
   botón/gesto de retroceso navega hacia atrás en serio. En iOS ese gesto (swipe desde el borde
   izquierdo) es el reflejo principal del usuario para "salir de lo que se abrió".
3. **El lock de scroll no es confiable en iOS.** `body{overflow:hidden}` solo no frena el
   rubber-banding de Safari, y además nunca se llama `window.lenis.stop()` — Lenis sigue corriendo
   detrás del menú.

---

## 1. Decisiones ya tomadas — no re-discutir, implementar

| Decisión | Por qué |
|---|---|
| **El drawer queda a la DERECHA** | En Safari iOS el gesto de retroceso es swipe desde el **borde izquierdo**. Un drawer izquierdo se cierra con swipe hacia la izquierda arrancando justo sobre ese borde: colisión frontal con el gesto del sistema. A la derecha sólo compite con el gesto de "adelante" (borde derecho), que requiere historial hacia adelante. Además el hamburger ya está arriba a la derecha: el panel sale de donde el dedo tocó. |
| **Deja de ser full-bleed: `min(86vw, 380px)`** | La franja de backdrop a la izquierda es lo que habilita el "tocar afuera para cerrar", que es el reflejo universal en iOS. Un panel `inset:0` no tiene afuera. |
| **Pasa a `<dialog>` + `showModal()`** | Trae gratis foco atrapado, inerte el resto de la página, ESC y `::backdrop`. Es el mismo patrón que ya usa `js/service-panel.js` en este repo — no se inventa un mecanismo nuevo. **Consecuencia:** el top layer del `<dialog>` gana sobre cualquier `z-index`, así que **NO hay que subir el `z-index` de `.nav`**; el cierre se resuelve con un botón X propio dentro del panel, ubicado en las mismas coordenadas que el hamburger (`top:14px;right:22px`, 44×44) para que se lea como si el hamburger se transformara en X. |
| **El gesto/botón "atrás" cierra el menú, no la página** | `history.pushState` al abrir + `popstate` que cierra, copiando el patrón ya resuelto en `service-panel.js`. Convierte el swipe desde el borde izquierdo de iOS en una forma más de cerrar en vez de una trampa. |
| **Swipe-to-close: opcional, último commit** | Backdrop + X + gesto atrás ya cubren el 100% de los caminos de salida. El swipe es refinamiento; va en un commit aparte para poder descartarlo sin tocar el resto. |

---

## 2. Archivos afectados

- `index.html`, `servicios.html`, `marcas.html`, `obras.html`, `vidriera.html`, `nosotros.html`,
  `contacto.html` — CSS inline + markup del menú + bloque `<noscript>`.
- `js/site.js` — `initMobileMenu()` completo.

**No se toca:** `js/motion.js`, `js/service-panel.js`, `js/services-carousel.js`, `js/vidriera.js`,
`js/respaldo.js`, ni ningún asset.

**Nota de duplicación:** el CSS del menú está copiado en las 7 páginas. Este kickoff lo corrige en
las 7 y deja el bloque **idéntico en todas** para que un futuro extract a CSS compartido sea un
corte limpio. No hacer ese extract acá.

---

## PASO 1 — CSS del drawer (7 archivos)

En cada página, **reemplazar exactamente estas 4 líneas** (están contiguas, arrancan en la línea
53-55 según el archivo):

```css
.mobile-menu{position:fixed;inset:0;z-index:70;background:var(--azul-profundo);transform:translateX(100%);transition:transform .3s ease;display:flex;flex-direction:column;padding:90px 28px 28px;}
.mobile-menu.open{transform:translateX(0);}
.mobile-menu a{font-size:1.25rem;padding:14px 0;border-bottom:1px solid var(--line);}
.mobile-menu .nav-cta{margin-top:20px;text-align:center;}
```

por este bloque:

```css
/* ---------- MOBILE MENU (drawer derecha, <dialog> nativo) ---------- */
.mobile-menu{position:fixed;inset:0;width:100%;max-width:none;height:100dvh;max-height:none;margin:0;padding:0;border:0;background:transparent;color:var(--crema);overflow:hidden;}
.mobile-menu::backdrop{background:rgba(11,19,43,.72);backdrop-filter:blur(6px);}
.mobile-menu__panel{position:absolute;top:0;right:0;bottom:0;width:min(86vw,380px);background:var(--azul-profundo);border-left:1px solid var(--line);box-shadow:-18px 0 44px rgba(0,0,0,.45);display:flex;flex-direction:column;padding:84px 24px max(24px,env(safe-area-inset-bottom)) 24px;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;}
.mobile-menu__close{position:absolute;top:14px;right:22px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;}
.mobile-menu__close::before,.mobile-menu__close::after{content:'';position:absolute;width:22px;height:2px;background:var(--crema);}
.mobile-menu__close::before{transform:rotate(45deg);}
.mobile-menu__close::after{transform:rotate(-45deg);}
.mobile-menu a{font-size:1.25rem;padding:14px 0;border-bottom:1px solid var(--line);}
.mobile-menu .nav-cta{margin-top:20px;text-align:center;}
@media (prefers-reduced-motion:no-preference){
  .mobile-menu[open]::backdrop{animation:nd-menu-fade .25s ease both;}
  .mobile-menu[open] .mobile-menu__panel{animation:nd-menu-in .28s cubic-bezier(.25,.1,.25,1) both;}
  .mobile-menu.is-closing::backdrop{animation:nd-menu-fade .2s ease reverse both;}
  .mobile-menu.is-closing .mobile-menu__panel{animation:nd-menu-out .22s ease both;}
}
@keyframes nd-menu-fade{from{opacity:0;}to{opacity:1;}}
@keyframes nd-menu-in{from{transform:translateX(100%);}to{transform:translateX(0);}}
@keyframes nd-menu-out{from{transform:translateX(0);}to{transform:translateX(100%);}}
```

**Y aparte, la línea siguiente (`body.menu-open`) — ojo que NO es igual en todas:**

- En `index.html`, `marcas.html`, `obras.html`, `nosotros.html`, `contacto.html` la línea es
  `body.menu-open{overflow:hidden;}` → **borrarla completa** (el lock pasa a `documentElement` en JS).
- En `servicios.html` y `vidriera.html` la línea es `body.menu-open,body.scroll-lock{overflow:hidden;}`
  → **dejarla en `body.scroll-lock{overflow:hidden;}`**. No borrar la línea entera: `scroll-lock` la
  usan otros componentes de esas páginas.

> Commit: `fix(nav): drawer mobile a la derecha con backdrop, safe-area y 100dvh`

---

## PASO 2 — Markup del menú (7 archivos)

### 2.1 El botón hamburger

Reemplazar (línea única, idéntica en las 7):

```html
<button class="menu-toggle" data-menu-toggle aria-expanded="false" aria-label="Abrir menú"><span></span><span></span><span></span></button>
```

por:

```html
<button class="menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="mobile-menu" aria-label="Abrir menú"><span></span><span></span><span></span></button>
```

### 2.2 El panel

Reemplazar el `<div class="mobile-menu" data-menu>…</div>` completo por:

```html
<dialog class="mobile-menu" id="mobile-menu" data-menu aria-label="Menú principal">
  <div class="mobile-menu__panel">
    <button class="mobile-menu__close" type="button" data-menu-close aria-label="Cerrar menú"></button>
    <a href="servicios.html">Servicios</a>
    <a href="marcas.html">Marcas</a>
    <a href="obras.html">Obras</a>
    <a href="vidriera.html">Vidriera</a>
    <a href="nosotros.html">Nosotros</a>
    <a href="contacto.html">Contacto</a>
    <a class="btn btn-outline nav-cta" href="https://wa.me/543516747513?text=Hola%20Nova%20Domus%2C%20quiero%20hacer%20una%20consulta" target="_blank" rel="noopener">Escribinos por WhatsApp</a>
  </div>
</dialog>
```

**Preservar la clase del CTA tal como está hoy en cada archivo:** `index.html` usa
`btn btn-primary nav-cta`; las otras 6 usan `btn btn-outline nav-cta`. No unificar acá.

### 2.3 Navegación sin JavaScript (gap existente que se cierra de paso)

Hoy, con JS deshabilitado y pantalla `<820px`, no hay ninguna forma de navegar: `.nav-links` está
oculto por `.desktop-only` y el hamburger no hace nada. Con `<dialog>` sería peor (arranca en
`display:none`). Agregar estas dos reglas **dentro del bloque `<noscript><style>` que ya existe en
el `<head>` de las 7 páginas** (el que fuerza `.rv{opacity:1}`):

```css
.menu-toggle{display:none!important;}
@media (max-width:820px){
  .nav-inner{flex-wrap:wrap;}
  .nav-links.desktop-only{display:flex!important;flex-wrap:wrap;gap:14px;font-size:.8rem;}
}
```

> Commit: `fix(nav): menu mobile como dialog nativo con boton de cierre + fallback sin JS`

---

## PASO 3 — `js/site.js`

Reemplazar la función `initMobileMenu()` completa por esta. El resto del archivo
(`initStickySubnav`, `initReveal`, `initFooterYear`, `initGalleryTabs`, el `DOMContentLoaded`) queda
igual. La variable `reduceMotion` ya existe arriba en el IIFE.

```js
  function initMobileMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var menu = document.querySelector('[data-menu]');
    if (!toggle || !menu) return;
    // Navegador sin <dialog>: el fallback es la nav visible (ver noscript/CSS), no un menu roto.
    if (typeof menu.showModal !== 'function') { toggle.hidden = true; return; }

    var closeBtn = menu.querySelector('[data-menu-close]');
    var isOpen = false;
    var pendingHref = null;   // link tocado dentro del menu, se navega despues de cerrar

    function lockScroll() {
      if (window.lenis) window.lenis.stop();
      document.documentElement.style.overflow = 'hidden';
    }
    function unlockScroll() {
      if (window.lenis) window.lenis.start();
      document.documentElement.style.overflow = '';
    }

    function open() {
      if (isOpen) return;
      isOpen = true;
      lockScroll();
      menu.showModal();
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Cerrar menú');
      // Entrada de historial propia: el gesto/boton "atras" cierra el menu en vez de salir del sitio.
      history.pushState({ ndMenu: true }, '');
    }

    function finishClose() {
      menu.classList.remove('is-closing');
      menu.close();
      unlockScroll();
      isOpen = false;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menú');
      if (pendingHref) {
        var href = pendingHref;
        pendingHref = null;
        location.assign(href);   // la entrada del menu ya se consumio con history.back()
        return;
      }
      toggle.focus();
    }

    // viaPopstate: el cierre lo disparo el historial, no hay que tocar history de nuevo.
    // immediate: sin animacion de salida (cuando se esta navegando a otra pagina).
    function close(viaPopstate, immediate) {
      if (!isOpen) return;
      if (!viaPopstate && history.state && history.state.ndMenu) {
        history.back();          // dispara popstate -> vuelve por close(true)
        return;
      }
      if (reduceMotion || immediate) { finishClose(); return; }
      menu.classList.add('is-closing');
      var done = false;
      function onEnd() { if (done) return; done = true; finishClose(); }
      menu.addEventListener('animationend', onEnd, { once: true });
      setTimeout(onEnd, 320);    // respaldo: si la animacion no dispara, el panel igual se cierra
    }

    toggle.addEventListener('click', function () {
      isOpen ? close() : open();
    });

    if (closeBtn) closeBtn.addEventListener('click', function () { close(); });

    // Tocar el backdrop: con el dialog a pantalla completa, el toque afuera del panel
    // cae sobre el <dialog> mismo.
    menu.addEventListener('click', function (e) {
      if (e.target === menu) close();
    });

    // ESC: se intercepta para que pase por nuestra logica de historial.
    menu.addEventListener('cancel', function (e) {
      e.preventDefault();
      close();
    });

    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var href = a.getAttribute('href');
        var newTab = a.target === '_blank';
        if (!href || newTab || /^(https?:|mailto:|tel:)/i.test(href)) { close(); return; }
        if (!(history.state && history.state.ndMenu)) { close(); return; }
        // Consumimos la entrada de historial del menu antes de navegar, para no dejar
        // una entrada fantasma que obligue a tocar "atras" dos veces.
        e.preventDefault();
        pendingHref = href;
        close();
      });
    });

    window.addEventListener('popstate', function () {
      if (isOpen) close(true, !!pendingHref);
    });
  }
```

Eliminar también el viejo listener global de `keydown`/Escape que estaba dentro de
`initMobileMenu()` — el evento `cancel` del `<dialog>` lo cubre.

> Commit: `fix(nav): cerrar menu mobile con backdrop, X y gesto atras de iOS`

---

## PASO 4 (OPCIONAL) — swipe-to-close

Sólo después de que los pasos 1-3 estén verificados en un iPhone real. Agregar al final de
`initMobileMenu()`, antes del listener de `popstate`:

```js
    // Swipe hacia la derecha para cerrar. touch-action:pan-y en el panel (CSS) deja el scroll
    // vertical intacto y evita que el navegador se quede el gesto horizontal.
    var panel = menu.querySelector('.mobile-menu__panel');
    if (panel && window.PointerEvent) {
      var sx = 0, sy = 0, tracking = false;
      panel.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse') return;
        sx = e.clientX; sy = e.clientY; tracking = true;
      }, { passive: true });
      panel.addEventListener('pointerup', function (e) {
        if (!tracking) return;
        tracking = false;
        var dx = e.clientX - sx, dy = e.clientY - sy;
        if (dx > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) close();
      }, { passive: true });
      panel.addEventListener('pointercancel', function () { tracking = false; }, { passive: true });
    }
```

Si el gesto pelea con el "adelante" de Safari (sólo pasa si hay historial hacia adelante) o se
dispara sin querer al scrollear, **revertir este commit y quedarse con los pasos 1-3**. No
"arreglarlo" subiendo umbrales a ciegas.

> Commit: `feat(nav): swipe hacia la derecha para cerrar el menu mobile`

---

## PASO 5 — Commitear este kickoff

Copiar este archivo al root del repo como `KICKOFF_F_menu_mobile.md`, al lado de
`KICKOFF_D_carrusel_servicios.md`.

> Commit: `docs: kickoff F — menu mobile`

---

## 3. Bugs no obvios ya resueltos acá (no reintroducir)

1. **El top layer del `<dialog>` gana sobre cualquier `z-index`.** No sirve subir `.nav` a
   `z-index:80` para "dejar el hamburger arriba": va a quedar tapado igual. El cierre es el botón X
   propio dentro del panel.
2. **`body{overflow:hidden}` no alcanza en Safari iOS.** El lock real es
   `documentElement.style.overflow` + `overscroll-behavior:contain` en el panel + `lenis.stop()`.
   Los tres, no uno.
3. **La entrada de historial fantasma.** Si al tocar un link se navega sin consumir la entrada del
   menú, el usuario tiene que tocar "atrás" dos veces en la página siguiente para volver de verdad.
   De ahí el `history.back()` + `location.assign()` diferido.
4. **`100vh` en iOS incluye la barra de Safari** y recorta el CTA de WhatsApp. Va `100dvh`, y el
   padding inferior con `max(24px, env(safe-area-inset-bottom))`.
5. **Un `<dialog>` cerrado con `.close()` desaparece de golpe.** Para que la animación de salida se
   vea hay que retrasar el `.close()` con `animationend` **y** un `setTimeout` de respaldo (320 ms),
   igual que en `service-panel.js`.
6. **`popstate` convive con el panel de servicios.** En `servicios.html` los dos componentes pushean
   historial; por eso el menú marca su estado con `{ ndMenu: true }` y sólo actúa si `isOpen`. No
   cambiar esa guarda.

---

## 4. Checklist de verificación

**Antes de commitear:**
- [ ] Los 7 archivos tienen el bloque CSS del menú **idéntico** (`diff` entre ellos del bloque).
- [ ] En `servicios.html` y `vidriera.html` sobrevive `body.scroll-lock{overflow:hidden;}`.
- [ ] `index.html` conserva `btn-primary` en el CTA del menú; las otras 6, `btn-outline`.
- [ ] `node --check js/site.js` (o abrir la consola sin errores) — un error de sintaxis mata también
      los reveals y el año del footer.

**En navegador, después del deploy (iPhone real, no simulador):**
- [ ] Abre el menú y el panel entra desde la derecha, ocupando ~86% del ancho, con el fondo
      atenuado y visible a la izquierda.
- [ ] La X cierra.
- [ ] Tocar el backdrop cierra.
- [ ] Swipe desde el borde izquierdo (gesto atrás de iOS) **cierra el menú y no sale del sitio**.
      Repetir el gesto una segunda vez sí sale: es lo correcto.
- [ ] Con el menú abierto, la página de atrás **no** scrollea (ni rubber-banding).
- [ ] Tocar "Obras" navega y, al volver con "atrás" desde Obras, se cae en la página anterior de una
      sola vez (no dos).
- [ ] **La transición entre páginas (View Transitions) sigue ocurriendo al tocar un link del menú.**
      Si se perdió por usar `location.assign`, revertir a navegación normal (quitar el
      `e.preventDefault()` y el `pendingHref`) y aceptar la entrada extra de historial. Anotarlo acá.
- [ ] El CTA de WhatsApp no queda debajo de la barra inferior de Safari.
- [ ] Android + Chrome: el botón físico/gestual de atrás cierra el menú.
- [ ] Desktop >820px: nada cambió (nav-links visibles, hamburger oculto, `.menu-toggle{display:none}`).
- [ ] Con `prefers-reduced-motion: reduce` activado: el menú abre y cierra sin animación, y funciona.
- [ ] Con JS deshabilitado en mobile: los 6 links de la nav quedan visibles y navegables.

**Verificación de deploy (no basta el 200):**
```js
fetch('/novadomus-web/index.html?v=' + Date.now())
  .then(r => r.text())
  .then(t => console.log('dialog:', t.includes('<dialog class="mobile-menu"'),
                         'panel:',  t.includes('mobile-menu__panel')));
fetch('/novadomus-web/js/site.js?v=' + Date.now())
  .then(r => r.text())
  .then(t => console.log('history:', t.includes('ndMenu')));
```
Repetir para las 7 páginas antes de declararlo listo.

---

## 5. Qué NO hacer en este kickoff

- No extraer el CSS/header a un archivo compartido (es otra decisión, otro commit, otra sesión).
- No cambiar el `z-index` de `.nav` (ver bug 1).
- No tocar `service-panel.js` ni el carrusel: si algo del menú parece necesitar cambiarlos, parar y
  preguntar.
- No agregar librerías. El presupuesto de JS (~100 KB gzip) ya está consumido por GSAP +
  ScrollTrigger + Lenis. Todo esto es vanilla y suma menos de 1 KB.
- No unificar las clases de botón del CTA ni retocar tipografía/colores del menú: la fuente de verdad
  de marca es la skill `nova-domus-identidad-marca`.
- No mover el drawer a la izquierda "para probar" sin hablarlo antes: la decisión está fundada en el
  gesto de retroceso de iOS (sección 1).
