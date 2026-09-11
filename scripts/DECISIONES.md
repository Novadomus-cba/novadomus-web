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
| `instalacion-electrica` | tarjeta | `4-ILUMINACION.pdf` pág. 1 (plano propio) | 3:4 del ala densa de planta baja | rótulo **fuera** del recorte, no tapado. Fondo pasado a crema `#FDFBF0` con blend multiply: cambia el papel sin tocar los trazos |
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

### Sobre el plano como tarjeta

El set eléctrico (`1-Diagrama unifilar`, `2-ACU y TUE`, `3-TUG y Cortineros`, `4-ILUMINACION`,
`5-Señales débiles`) es **propiedad de Nova Domus** (`admin@nova-domus.com.ar`). El DWG de
arquitectura y el interiorismo de la misma obra son de `equipo@estudiojad.com` — esos no se
usan.

El rótulo original del plano dice el nombre del estudio, el identificador de la obra y el
barrio, y el PDF hermano de interiorismo nombra al comitente. **Nada de eso entra en el
recorte.** Lo único legible son leyendas técnicas neutras. Si hay que recortar más, se recorta;
no se tapa con un rectángulo.

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
