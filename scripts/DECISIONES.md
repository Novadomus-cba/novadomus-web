# Decisiones de foto — registro

Este archivo es la fuente de verdad de **qué foto va en cada slot, con qué recorte, y qué
fotos están vetadas**. Vive en el repo a propósito: las decisiones tomadas en un chat se
pierden, y el material rechazado vuelve a aparecer como candidato en el siguiente relevamiento.

## Cómo se elige una foto

1. Los originales viven en `Fotos/` (ignorada por git: traen GPS y son pesadas).
2. `scripts/foto_audit.py` mide todo y genera láminas de contacto numeradas en
   `Fotos/_laminas/`, al **tamaño real de render** y con el degradado y el título encima.
   Con muchos candidatos va en dos etapas, porque elegir entre 36 opciones es peor que
   elegir entre 12:

   ```bash
   # 1. preseleccion: un solo recorte por candidato
   python scripts/foto_audit.py --src Fotos --servicio redes --anchor centro
   # 2. ajuste de encuadre: las tres anclas, solo de las finalistas
   python scripts/foto_audit.py --src Fotos --servicio redes --solo v-03,v-07
   ```

   Los números **no se renumeran** entre etapas: si en la preselección algo es el 7, en la
   segunda lámina sigue siendo el 7.
3. **Una persona elige por número.** Ni el pipeline ni Claude Code eligen.
4. La elección se anota acá, con el recorte y el ancla.
5. Recién entonces se generan los WebP y se commitean.

### Por qué la elección no se delega

Tres cosas no están en los píxeles y no las puede resolver ningún modelo:

- **Si la instalación está bien hecha.** Ver el veto de `videovigilancia-tarjeta-v-01`.
- **Si la obra es propia o material de banco.**
- **Si el cliente es identificable** (número de casa, patente, cartel, rótulo de plano).

Lo que sí se delega es el filtrado mecánico: relación, orientación real, nitidez, exposición,
duplicados y convención de nombres. Eso lo hace `foto_audit.py`.

### Criterios de encuadre

**Tarjeta** (320 × 427 en pantalla, `aspect-ratio: 3/4`, `object-fit: cover`):
- Sujeto vertical, una sola idea legible **a 320 px de ancho**. Juzgar a ese tamaño, no al
  original: el mismo recorte puede ganar en grande y perder en chico.
- Tercio inferior con estructura o sombra: ahí vive el título en crema.
- Sin packaging de producto ni logos de terceros dominando el cuadro.
- Obra limpia. Si no está limpia, no se publica.

**Hero de panel** (`sizes="880px"`): horizontal, contexto de ambiente, aire a un costado.
Un 3:4 a 880 px de ancho da un bloque altísimo — por eso tarjeta y hero son archivos
distintos.

## Convención de nombres en `assets/img/`

Verificado contra `servicios.html`. **Las dos convenciones conviven** y hay que respetar cuál
usa cada servicio antes de sobreescribir nada:

| Rol | Nombre | Anchos que se usan |
|---|---|---|
| Tarjeta | `servicio-<id>-tarjeta-{640,960}.webp` | 640 y 960 (`sizes="320px"`) |
| Hero | `servicio-<id>-{960,1440}.webp` | 960 y 1440 (`sizes="880px"`) |

Los 4 servicios viejos (`redes`, `domotica`, `alarmas`, `cerraduras`) todavía usan **un solo
archivo** `servicio-<id>-{640,960,1440}.webp` que hace de tarjeta *y* de hero. Recortar ese
archivo a 3:4 le arruina el hero: hay que migrarlo al par de arriba.

El `alt` de la tarjeta va **vacío**: es decorativa, el significado lo cargan `card__title` y el
texto para lector de pantalla.

## Elegido y publicado

| Servicio | Slot | Origen | Recorte | Notas |
|---|---|---|---|---|
| `videovigilancia` | tarjeta | `nd-srv-videovigilancia-tarjeta-v-02` | 3:4, **ancla abajo** (opción 2c) | la cámara está en el tercio inferior; centrado o arriba queda casi todo cielo |
| `videovigilancia` | hero | video (3 archivos: av1, h264, poster) | recorte de origen 1120×630 (no 1130×636 como los otros 4 paneles de video — el sello de agua de este clip estaba más a la izquierda, sigue siendo 16:9 válido) | **pasa de foto a video** (11/09/2026). Sin `data-panel-video-once`: loopea, trae el ping-pong horneado |
| `instalacion-electrica` | tarjeta | ~~`4-ILUMINACION.pdf` pág. 1 (plano propio)~~ → **imagen generada** | 3:4 nativo (640×857) | **SUPERSEDIDA el 13/09/2026** por la excepción de tarjetas generadas (ver sección abajo). El criterio del plano — rótulo fuera del recorte, fondo a crema `#FDFBF0` con blend multiply — queda registrado por si se vuelve atrás; el archivo del plano no se borró de `Fotos/` |
| `instalacion-electrica` | hero | el archivo que ya estaba | sin cambios | |
| `redes` | bloque 1 | `nd-srv-redes-bloque-h-01.jpg` | sin recorte, 16:10 | rack instalado, coincide con el copy ya publicado |
| `redes` | bloque 2 | `nd-srv-redes-bloque-v-02.jpeg` | sin recorte, ratio original | rack en banco de armado — original de 720px, calidad justa |
| `domotica` | bloque 1 | `nd-srv-domotica-bloque-h-02.HEIC` | sin recorte — 4:3 nativo, 4032×3024 | showroom real. Quedan legibles TP-Link Omada, Sonos, Yale, Philips y WiZ — la marca visible no se recorta ni se disimula, ver regla general más abajo (corregido 11/09/2026, revierte un recorte manual `(1370,680,4032,2344)` que se había hecho por error para "sacar" una marca del cuadro) |
| `domotica` | bloque 2 (ex-`climatizacion`) | `Climatización 1-Vertical.DNG` (entrega 10/09) | sin recorte, 3:4 nativo | panel de pared con temperatura/humedad/consumo en vivo, reemplaza la foto de producto (Sensibo sobre pared blanca) que tenía este slot. **Climatización deja de ser servicio propio, absorbido como capacidad dentro de Domótica** (decisión de Agustín, 10/09/2026) — resuelve el pendiente de abajo |
| `videovigilancia` | bloque 1 | `nd-srv-videovigilancia-bloque-v-03.jpg.jpeg` | banco de pruebas con cámaras domo reales, no es instalación en fachada — sirve como "así se prueba" mientras se espera material nuevo de Lucas para el hero |
| `videovigilancia` | bloque 2 | `nd-srv-videovigilancia-ancha-h-02.jpg.jpg` | sin recorte, 16:9 (1440×810 real) | **la foto que hasta ahora era el hero** baja al cuerpo del panel cuando el hero pasa a video (11/09/2026). Mismo copy/alt que tenía como hero — fachada de edificio, no muestra cámara |
| `videovigilancia` | bloque 3 | `nd-srv-videovigilancia-ancha-h-03.jpg.jpg` | sin recorte, 16:9 (1440×810 real) | fachada con cámara domo sí visible en el cuadro — complementa el bloque 2, que no la mostraba |
| `cerraduras` | bloque 1 | `nd-srv-cerraduras-bloque-h-01.jpg` | sin recorte, `data-format="landscape"` (4:3 nativo, 1440×1080) | reemplaza la versión anterior recortada a 1:1 vía CSS. Mismo origen, mismo criterio que el hero real ya publicado (que sí es obra): stand de producto Yale, no puerta instalada. **Aprobado por Agustín** (10/09/2026, actualizado 11/09/2026) |
| `redes` | bloque 3 | `nd-srv-redes-ancha-h-01.jpg.jpg` | sin recorte, 16:9 (1440×810 real) | rack de pared más chico, con monitor de cámaras a la vista — mismo criterio de cableado que bloque 1 y 2 |
| `domotica` | bloque 3 | `nd-srv-domotica-ancha-h-01.jpg.jpg` | sin recorte, 16:9 (1440×811 real) | fachada iluminada al atardecer. **Numerada bloque 3, no bloque 2** — ese slot ya lo ocupaba el panel de pared de climatización (ver fila de arriba), el kickoff que la pidió no sabía que ya estaba tomado |
| `domotica` | bloque 4 | `nd-srv-clima-bloque-v-02.jpg.jpg` | sin recorte, 3:4 nativo (1440×2558 real) | Sensibo instalado sobre pared. **Es el mismo tipo de foto (Sensibo sobre pared blanca) que el bloque 2 ya había reemplazado a propósito** — se agrega igual como bloque 4 por decisión explícita de Agustín (11/09/2026, quedan las dos: el panel de pared con datos en vivo y el dispositivo en sí), no por descuido |
| `cerraduras` | bloque 2 | Frame extraído de video de WhatsApp (2026-09-11) | sin recorte, 9:16 nativo (1080×1920 real) — usa `data-format="portrait-9x16"`, casi sin uso hasta ahora en el sitio | cerradura Yale real instalada en puerta de madera maciza, mano abriendo con la manija. Complementa el bloque 1 (stand de demo) con una instalación real. Sin cara visible, solo mano/brazo |
| `audio-video` | bloque 1 | Foto de WhatsApp (2026-09-11) | sin recorte, 3:4 (960×1280 real — el original es 960px de ancho, no 1280 como se asumió al pedirlo; el `-1440.webp` generado es un duplicado byte a byte del `-960.webp`, se omite del `srcset`) | primera foto de cuerpo de este panel (estaba en cero). Home cinema en obra, Despeñaderos — pantalla Denon y parlante Triad visibles, sin restricción de marca. Sin cara visible |
| `alarmas` | hero (video) | Generado Gemini, texto puro (3 archivos: av1, h264, poster) | recorte de origen 1120×630 (misma tanda de Gemini que videovigilancia, mismo motivo: sello de agua más a la izquierda) | **pasa de foto a video** (11/09/2026). Vivienda premium, sensor + living de fondo. Sin `data-panel-video-once`: loopea. `object-position:40% center` — el sensor queda a la izquierda del cuadro. Se generó tambien un segundo clip (variante fábrica/nave industrial) que todavía no llegó — pendiente de decisión de Agustín si reemplaza a este o se usa para otra cosa, no asumir nada todavía |
| `alarmas` | bloque 1 | la foto que hasta ahora era el hero (`servicio-alarmas.jpg` original no localizado en `Fotos/`, se regeneró desde el `-1440.webp` ya publicado) | 3:4 nativo (1440×2559 real) | **la foto que hasta ahora era el hero** baja al cuerpo del panel cuando el hero pasa a video (11/09/2026), mismo copy/alt que tenía como hero. Primer bloque con foto de este panel (estaba en cero) |
| `audio-video` | hero (video) | Generado Gemini, texto puro (3 archivos: av1, h264, poster) | recorte de origen 1120×630 (misma tanda que alarmas/videovigilancia) | **pasa de foto a video** (11/09/2026). Home theater premium, pantalla con contenido abstracto. Sin `data-panel-video-once`: loopea. `object-position:50% center` |
| `audio-video` | bloque 2 | la foto que hasta ahora era el hero (fuente original no localizada en `Fotos/`, se regeneró desde el `-1440.webp` ya publicado) | 4:3 (1440×1080 real) | **la foto que hasta ahora era el hero** baja al cuerpo del panel cuando el hero pasa a video (11/09/2026), mismo copy/alt que tenía como hero. Amplificador VSSL y parlantes de techo |

## `nosotros.html` — reescritura completa (13/09/2026, KICKOFF_L)

Material identificado por Cowork en el export de Instagram, entregado en
`2026-09-13_nosotros-paquete-completo.zip`. De los candidatos, dos pares eran alternativas del
mismo evento — la elección de composición entre ambos la hizo Code (no una selección entre
material de origen distinto, que sigue siendo decisión humana):

| Slot | Origen | Recorte | Notas |
|---|---|---|---|
| `#origen`, cierre — foto de equipo | `nosotros-equipo-2026.jpeg` (WhatsApp, subida por Agustín 13/09/2026) | sin recorte, 1600×899 nativo | **Reemplaza** la elección original de Cowork (`nosotros-equipo-asado-2025`, candid de asado, 1440×955) — Agustín subió esta directamente. Foto posada del equipo con remeras de isotipo actual, sin el wordmark viejo. Sin pie de foto (la imagen habla sola). Supersede también a las dos `BAJA-RES` (360×300/310, cuadrilla en obra) — con esta foto ya no hacen falta como único registro del equipo completo |
| `#respaldo` / Dónde nos viste — Proyectar 2026 | `nosotros-proyectar-2026-stand.png` | sin recorte, 720×960 | Elegida sobre la alternativa `-mostrador` (persona sola a cámara, menos dinámica): esta muestra el stand con cartel de marca, un integrante atendiendo a dos visitantes, cajas de Yale/Philips Hue/WiZ visibles |
| `#respaldo` / Dónde nos viste — Casa FOA 2026 | `nosotros-casafoa-2026-espacio18.png` | sin recorte, 720×1280 | Elegida sobre la alternativa `-detalle` (mural decorativo, sin tecnología a la vista): esta muestra la estantería con perfil LED integrado — trabajo real de iluminación, no solo ambiente |
| `#respaldo` / Dónde nos viste — Proyectar/Yale 2024 | `nosotros-yale-naos-2024.png` | sin recorte, 1080×1920 | Cerradura Yale YMF30 instalada en la puerta del stand de NAOS Aberturas |
| `#para-quien` columna B | `nosotros-obra-electrica.png` | sin recorte, 720×960 | Obra en bruto (paredes de hormigón visto, escalera sin terminar) — refuerza "entramos en anteproyecto, antes de que se pique la pared" |
| `#respaldo` / Dónde nos viste — Proyectar 2026 (prensa) | `nosotros-prensa-canalc.png` | sin recorte, 720×406 | Agustín Dávila entrevistado por Canal C |

**Descartadas del zip, no usadas:** `nosotros-proyectar-2026-mostrador.png`,
`nosotros-casafoa-2026-detalle.png` (alternativas de composición, ver arriba),
`nosotros-equipo-asado-2025.png`, `nosotros-equipo-obra-BAJA-RES.png`,
`nosotros-equipo-escalera-BAJA-RES.png` (superadas por `nosotros-equipo-2026.jpeg`). Quedan en
`Fotos/` (gitignored) por si hacen falta después, no se borraron.

**`-1440.webp` duplicado de `-960.webp` en 4 de las 6:** `nosotros-prensa-canalc`,
`nosotros-proyectar-2026-stand`, `nosotros-casafoa-2026-espacio18` y `nosotros-obra-electrica`
son originales de 720px de ancho — `build_images.py` generó el bucket 960 y el 1440 al mismo
ancho real (720), archivos idénticos. El `srcset` de estas cuatro omite el descriptor 1440 y
usa el nombre de archivo real con el ancho real (`...-960.webp 720w`), no `1440w` — ver gotcha
de nombrado más abajo en este documento.

## `participaciones.html` — pagina nueva (13/09/2026)

Fotos identificadas revisando el export completo de Instagram (1815 historias + posts/reels)
buscando menciones de ferias, expos, conferencias y capacitaciones. Igual que en `nosotros.html`,
cuando habia mas de un candidato del mismo evento la eleccion de composicion la hizo Code (no
una seleccion entre fuentes de origen distinto).

| Slot | Origen | Recorte | Notas |
|---|---|---|---|
| Casa FOA 2023, tarjeta 1 | `participacion-casafoa2023-b` (story) | sin recorte, 480x854 | Espacio 6, visitantes junto a la mesa con las luminarias instaladas |
| Casa FOA 2023, tarjeta 2 | `participacion-casafoa2023-a` (story) | sin recorte, 828x1472 | mismo Espacio 6, luminarias WorldLedsGo ya encendidas |
| Casa FOA 2024, tarjeta 1 | `participacion-casafoa2024-a` (frame de reel, Espacio 37) | sin recorte, 360x640 -- frame de video, no foto | "Green House Office", cielorraso curvo con luz integrada |
| Expo Estilo Casa 2023, tarjeta 1 | `participacion-estilocasa2023-a` (frame de reel) | sin recorte, 720x1280 | integrante posando con el logo Nova Domus + Control4 + Philips Hue de fondo, stand 88 |
| Expo Estilo Casa 2023, tarjeta 2 | `participacion-estilocasa2023-b` (frame de reel) | sin recorte, 720x1280 | el stand con visitantes reales, bajo la cupula geodesica |
| Expo Estilo Casa 2024, tarjeta 1 | `participacion-estilocasa2024-stand` (frame de story) | sin recorte, 360x640 | equipo armando el stand propio en una terraza |
| Proyectar Cordoba 2024 | `participacion-proyectar2024` (frame de reel) | sin recorte, 720x1280 | stand de NAOS Aberturas -- toma con leve movimiento de camara, es lo mejor disponible de este evento |
| Proyectar Cordoba 2026, tarjeta 2 | `participacion-proyectar2026-stand2` (frame de reel) | sin recorte, 720x1280 | stand propio con productos Yale, distinta de `nosotros-proyectar-2026-stand` (que quedo sin uso, ver nota abajo) |
| Conferencia CEDIA | `participacion-conf-cedia` (frame de story) | sin recorte, 360x640 | conversatorio de Manuel Fernandez, tomado durante Expo Estilo Casa 2024 -- se cuenta como "Conferencias" por tipo de contenido, no por el lugar fisico |
| Conferencia Dina Asociados | `participacion-conf-dina` (frame de story) | sin recorte, 360x640 | auditorio con la oradora Paula Zuccotti en pantalla |
| Evento ASETEC | `participacion-conf-asetec` (frame de story) | sin recorte, 360x640 | encuentro informal, confirma presencia pero no muestra una charla |
| Capacitacion Yale | `participacion-capacit-yale` (frame de story) | sin recorte, 360x640 | 3 personas posando con cajas de producto, Electro Alem |
| Capacitacion Shelly | `participacion-capacit-shelly` (frame de story) | sin recorte, 360x640 | grupo de ~9 personas alrededor de la mesa de productos |
| Capacitacion Hikvision | `participacion-capacit-hikvision` (frame de story) | sin recorte, 720x1280 | orador presentando, banner de la marca de fondo |

**Reusadas de `nosotros.html` sin reprocesar:** `nosotros-casafoa-2026-espacio18` (Casa FOA 2026)
y `nosotros-prensa-canalc` (Proyectar 2026, entrevista Canal C) -- mismos archivos, mismo slot
conceptual, no hacia falta duplicar el procesamiento.

**Descartada por screenshot de videollamada, no foto real:** la story de TP-Link/Omada
(4/09/2026, "gran parte del equipo presente") es una captura de una reunion por Zoom/Teams --
no lee bien como foto de referencia en una tarjeta. Capacitaciones quedo con 3 tarjetas en vez
de 4 por este motivo.

**`nosotros-proyectar-2026-stand.webp` (las 3 resoluciones) quedan sin uso** tras simplificar
la seccion "Donde nos viste" de `nosotros.html` a un teaser que linkea a `participaciones.html`
en vez de repetir las mismas 4 fotos en las dos paginas. No se borraron los archivos.

### Sobre el plano como tarjeta

El set eléctrico (`1-Diagrama unifilar`, `2-ACU y TUE`, `3-TUG y Cortineros`, `4-ILUMINACION`,
`5-Señales débiles`) es **propiedad de Nova Domus** (`admin@nova-domus.com.ar`). El DWG de
arquitectura y el interiorismo de la misma obra son de `equipo@estudiojad.com` — esos no se
usan.

El rótulo original del plano dice el nombre del estudio, el identificador de la obra y el
barrio, y el PDF hermano de interiorismo nombra al comitente. **Nada de eso entra en el
recorte.** Lo único legible son leyendas técnicas neutras. Si hay que recortar más, se recorta;
no se tapa con un rectángulo.

## Excepción: imágenes generadas en las tarjetas de servicios (13/09/2026)

**Qué se decidió.** Las 7 tarjetas del carrusel de `servicios.html` (`.card__link img`) dejan de
usar foto real propia y pasan a usar una still atmosférica generada con Gemini, coherente en
estilo con el video hero que cada panel ya tiene.

**Quién y cuándo.** Autorizada explícitamente por **Agustín Davila** (dueño/director), 13/09/2026,
después de discutir el tradeoff. No es un descuido del pipeline ni una decisión de Claude.

**Por qué.** El hero de cada panel ya es video generado con Gemini/Flow desde el 11/09/2026 —
ver las filas de `videovigilancia`, `alarmas` y `audio-video` en la tabla de arriba. La tarjeta
era el último lugar donde seguía vigente la regla de foto real, y el salto visual entre una
tarjeta documental y un hero atmosférico se notaba. La excepción unifica el lenguaje visual del
componente, y además permite que la tarjeta y su preview en hover sean literalmente la misma
escena.

**Alcance exacto — solo esto:**

- Las 7 imágenes de tarjeta (`.card__link img`) de `servicios.html`.

**Lo que NO cubre, y sigue con foto real propia sin ningún cambio:**

- Los bloques documentales dentro de cada panel (`.panel__block img`) — fotos de Lucas, pipeline
  de `foto_audit.py` intacto. Son la prueba de obra propia; ahí la regla general sigue entera.
- `obras.html` y `vidriera.html` — ninguna relación con esta tarea.
- Cualquier pieza fuera del sitio: propuestas comerciales, redes sociales, presentaciones.

**Guardrails que toda tarjeta generada tiene que pasar antes de entrar** (salieron de inspeccionar
los posters ya en producción, no son hipotéticos):

- Sin texto ni UI en pantalla. El poster real de Domótica muestra una TV con una interfaz de texto
  inventado — artefacto típico de generación. Si la escena tiene pantalla: apagada o fuera de foco.
- Sin réplica cercana del diseño de un producto de una marca puntual. Una foto **real** de un Yale
  instalado está perfecta (ver "Marcas en fotos: sin restricción" más abajo, esa regla no cambia).
  Una imagen **generada** que clona el diseño de una marca es un riesgo distinto: herraje genérico.
- Sin logos de terceros visibles, sin personas fabricadas o identificables.
- Paleta oscura + acento cálido dorado; nunca el dorado como relleno de superficie grande.
- Composición vertical 3:4 nativa — no generar horizontal y recortar después.

**Procesamiento.** WebP a 640px de ancho, quality ~82. Es el único breakpoint real: el HTML usa
`sizes="320px"`, así que 640w ya cubre retina 2x. Se suma un `-960.webp` al `srcset` **solo** si la
nativa de Gemini da 960px o más — si no, va `src` a secas sin `srcset`, sin inventar un 960w falso.

**La trampa del C2PA se repite por este canal.** La imagen de `instalacion-electrica` llegó con un
manifiesto **C2PA de 5759 bytes** inyectado. `im.info` de PIL **no lo muestra** — solo lo detecta el
chequeo por lista blanca de chunks RIFF. Se limpió con `scripts/strip_webp_chunks.py` (42.954 B →
37.186 B, sin recomprimir). **Verificar por lista blanca cada imagen generada, siempre**, es el mismo
síntoma ya registrado en "Trampas ya pagadas" pero por un canal nuevo (el zip de handoff).

**Estado (13/09/2026).** Las 7 tarjetas hechas y publicadas. Las cinco primeras
(`instalacion-electrica`, `redes`, `videovigilancia`, `alarmas`, `audio-video`) pasaron los
guardrails sin observaciones. Las dos últimas entraron con una decisión explícita de Agustín, ver
abajo.

### Las dos tarjetas que entraron con waiver (13/09/2026)

Ambas se habían rechazado en la auditoría. **Agustín las aprobó igual, explícitamente**, y se
publicaron con el recorte a 3:4 que les faltaba. Queda anotado qué se levantó y qué no:

**`domotica`** — la imagen entregada tenía una tablet con interfaz y texto sobre la mesada, además
de venir apaisada (2216×1920). **El recorte a 3:4 dejó la tablet fuera de cuadro**: se tomó el
sector izquierdo (0,0)–(1440,1920), que es el que tiene el cove LED, la pared de hormigón y el
ventanal. O sea que el guardrail de "sin UI con texto" terminó cumpliéndose por geometría, no por
waiver — lo único que se levantó fue el criterio de regenerar en vez de recortar. Queda visible el
teclado de pared a la izquierda, de unos 5 px a tamaño de tarjeta: mancha, no texto.

**`cerraduras`** — la imagen entregada tiene el **wordmark de Yale legible** sobre la cerradura y
el teclado numérico con texto ("CARD" y los dígitos), y es una réplica cercana de un producto Yale
real. Vino cuadrada (2048×2048). Se recortó a 3:4 tomando (512,0)–(2048,2048), el encuadre más
parecido al del video hero, que además deja el logo más chico dentro del cuadro.

- **Lo que se levantó:** la regla de que una imagen *generada* no clone el diseño de un producto de
  una marca puntual ni muestre su logo. Nova Domus es partner de Yale y la decisión es de Agustín.
- **Lo que NO se hizo, a propósito: no se le borró el logo por retoque.** Sacarle la marca no
  arregla nada — deja un clon sin identificar de un producto real, que es peor que mostrarlo de
  frente. Si en algún momento se quiere sin marca, se regenera con herraje genérico (la variante
  del tirador vertical con tira luminosa está en el kickoff), no se retoca esta.
- **Alcance:** esta tarjeta y nada más. No habilita imágenes generadas con marcas de terceros en
  ningún otro slot del sitio, ni en propuestas, ni en redes.

**Contraste verificado en navegador** (título crema `#FDFBF0` sobre el píxel más claro que queda
detrás, con el degradado aplicado): las 7 pasan WCAG AA. La más ajustada es `cerraduras` con
**7,69:1** y le sigue `domotica` con **11,97:1**; el resto está por encima de 17:1. El mínimo AA es
4,5:1.

## Vetadas — no usar nunca

| Archivo | Motivo |
|---|---|
| `nd-srv-videovigilancia-tarjeta-v-01` | **La cámara está mal instalada.** No entra como tarjeta, ni como hero, ni como bloque, ni en redes sociales. No es un problema de foto |
| `nd-srv-instalacion-electrica-bloque-h-02` | Sala de exhibición ajena ("Patagonia Flooring" legible), personas identificables — no es obra de Nova Domus |
| `nd-srv-domotica-bloque-v-01` | Misma sala ajena que la anterior |

## Marcas en fotos: sin restricción

La regla de no nombrar marcas de terceros es sobre el **texto** (copy, alt, títulos) — nunca
sobre lo fotografiado. Que se vea instalado un producto real de una marca que Nova Domus
representa (Shelly, Sonos, Hikvision, TP-Link, Yale, Ubiquiti, etc.) es bueno y no requiere
recorte ni disimulo.

## Pendiente de decisión

- **`cerraduras` bloque 2**: la foto real de tarjeta Yale (`accesos-v-03`) mide 609×1076px, muy
  chica para publicar a los tamaños del sitio. Pedirle a Lucas la misma toma en mejor resolución
  si la tiene. El panel se queda en 1 bloque por ahora.
- **`alarmas`**: sigue sin resolver qué son los dos artefactos de `alarmas-bloque-v-01`
  (¿sensores o spots?). No meterla hasta confirmar — sería el mismo error que la foto de redes
  que resultó ser un mueble de carpintería.
- **`audio-y-video`**: sigue en cero. Hay 2 archivos HEIC sin auditar — el entorno de Cowork no
  pudo decodificarlos. Pedir que se resuelva con `pip install pillow-heif` en un entorno con
  internet, o subirlos por chat como se hizo con las de videovigilancia.
- **Tarjeta `Servicios` del home** (`home-card-servicios-*`): la foto muestra una caja de EZVIZ
  en primer plano. Es packaging de producto, y el copy de la tarjeta habla de instalación,
  redes, domótica y seguridad. Sirve para Vidriera o Sistemas y marcas, no para Servicios.
- **`redes`, `domotica`, `alarmas`**: tarjetas fuera de 3:4 (2,222 · 1,776 · 0,563). Arreglarlas
  implica migrarlas a la convención de dos archivos.
- **Videos**: los slots que solo tienen video necesitan extracción de frame (`ffmpeg -vf fps=1/2
  -q:v 1`). Un frame de celular rinde peor que una foto: sirve para hero, para tarjeta hay que
  mirarlo antes.
- **`videovigilancia` bloque**: resuelto con `nd-srv-videovigilancia-bloque-v-03.jpg.jpeg`
  (banco de pruebas, ver tabla de arriba) mientras se consigue una toma real de cámara instalada.
  Las tomas `nd-srv-videovigilancia-bloque-v-01/02` (HEIC) siguen sin servir — no muestran cámara
  instalada y quedan identificables dos compañeros de fondo.
- **`videovigilancia` hero**: sigue sin semilla real (domo instalado en fachada, no banco de
  pruebas ni pantalla de software) — pendiente de material nuevo de Lucas.
- **`redes`**: `nd-srv-redes-bloque-v-01.jpg` y `-01-1.jpg` (par contaminado/limpio del mismo
  archivo) están mal categorizados desde el origen — es un mueble de carpintería en obra, sin
  ningún equipo de networking. Movidos a `Fotos/_sin_asignar/`. Si se identifica de qué obra es,
  podría servir para `obras.html`, no para este panel.
- **`accesos`**: `nd-srv-videovigilancia-bloque-v-02.jpg.jpeg` (pared de porteros/intercomunicadores)
  es contenido de accesos, no de videovigilancia. Candidato para el día que ese panel tenga
  bloques de foto propios. Movida a `Fotos/_sin_asignar/`.
- **`domotica` bloque adicional**: `nd-srv-domotica-bloque-h-01.jpeg`, idéntica a
  `nd-srv-domotica-bloque-v-03.jpg.jpeg` (ya evaluada antes), rótulo "Isa Room" (nombre de
  persona) visible en pantalla y sin confirmar si la app que se ve es Home Assistant — el
  posicionamiento del sitio es sistema abierto. En `Fotos/_sin_asignar/`.

## Cerrado

- `home-card-obras-*`: **es obra propia** (confirmado por Agustín, 8/09/2026). La pregunta de
  procedencia queda resuelta.

## Trampas ya pagadas

- **La orientación EXIF no se puede ignorar.** `tarjeta-v-02/03/04` están guardadas
  horizontales con `orientation=6`: son verticales. Medirlas sin `ImageOps.exif_transpose` da el
  eje equivocado.
- **`build_images.py` no recorta.** `h = round(w * orig_h / orig_w)` conserva la relación de
  origen. El 3:4 se hace **antes**, a mano. Es la causa de que 6 de 7 tarjetas nacieran fuera de
  relación.
- **El criterio de chunks tiene que ser lista blanca, no lista negra.** Pedir "sin `EXIF` ni
  `XMP `" dejó pasar un manifiesto `C2PA` de 5,8 KB que agregó el canal de entrega de archivos.
  Lo correcto: si aparece cualquier chunk que no sea de imagen, se rechaza. `strip_webp_chunks.py`
  lo quita sin recomprimir.
- **Los nombres de Lucas pueden mentir sobre la orientación pero no sobre el servicio.** Y las
  dobles extensiones (`.jpg.jpg`, `.jpg.mp4`) son normales en la entrega: manda el tipo real,
  no el nombre.
- **C2PA/JUMBF vía `device_commit_files` (canal de escritura remota).** Igual que con las
  herramientas de imagen, el canal que escribe archivos remotamente en Fotos/ inyecta un
  manifiesto C2PA/JUMBF espurio al escribir (+5771 bytes en JPEG, +5876 en HEIC) — no es un
  problema de la herramienta de conversión, es del transporte. Mismo síntoma, canal distinto.
  Si un archivo pesa "de más" sin explicación después de escribirse por ese canal, sospechar
  esto antes que un bug de compresión. Se resuelve reemplazando el archivo desde el filesystem
  local directamente (sin pasar por ese canal) o corriendo strip_webp_chunks.py / equivalente
  después. Afectó 11 archivos de la limpieza del 2026-09-11 (los
  `nd-srv-instalacion-electrica-bloque-*`, `nd-srv-redes-bloque-v-01`,
  `nd-srv-videovigilancia-bloque-v-*` y las 2 VETADA-*) — reemplazados manualmente por
  Agustín, verificados byte a byte, ya limpios.
- **`build_images.py` nombra por ancho objetivo, no por ancho real.** Si el original es más
  angosto que 1440px, el archivo generado igual se llama `-1440.webp` (nunca `-1200.webp` ni
  similar) aunque el contenido adentro quede más chico — el `manifest.json` es la única fuente
  confiable del ancho real por variante. El `srcset` tiene que usar el nombre de archivo real
  con el descriptor de ancho real (ej. `servicio-x-1440.webp 1200w`), no inventar un nombre de
  archivo con el ancho real.
