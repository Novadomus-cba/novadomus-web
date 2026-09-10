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
| `videovigilancia` | hero | `nd-srv-videovigilancia-ancha-h-02` | sin recorte, 16:9 | el original tiene GPS, lo despoja el pipeline. **No muestra cámara**: es fachada de edificio, el copy tiene que hacerse cargo |
| `instalacion-electrica` | tarjeta | `4-ILUMINACION.pdf` pág. 1 (plano propio) | 3:4 del ala densa de planta baja | rótulo **fuera** del recorte, no tapado. Fondo pasado a crema `#FDFBF0` con blend multiply: cambia el papel sin tocar los trazos |
| `instalacion-electrica` | hero | el archivo que ya estaba | sin cambios | |
| `redes` | bloque 1 | `nd-srv-redes-bloque-h-01.jpg` | sin recorte, 16:10 | rack instalado, coincide con el copy ya publicado |
| `redes` | bloque 2 | `nd-srv-redes-bloque-v-02.jpeg` | sin recorte, ratio original | rack en banco de armado — original de 720px, calidad justa |

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

## Pendiente de decisión

- **`climatizacion`**: publicada, pero la tarjeta es foto de producto (un Sensibo sobre pared
  blanca), no de obra, y el hero es el mismo objeto en 0,563 a 880 px de ancho. El contraste del
  título está medido y es apto (11,52:1), así que el problema no es accesibilidad. Opciones:
  revertir a capacidad dentro de Domótica, cambiar el hero por algo horizontal con ambiente, o
  pedir una vertical del equipo *en contexto*.
- **Tarjeta `Servicios` del home** (`home-card-servicios-*`): la foto muestra una caja de EZVIZ
  en primer plano. Es packaging de producto, y el copy de la tarjeta habla de instalación,
  redes, domótica y seguridad. Sirve para Vidriera o Sistemas y marcas, no para Servicios.
- **`redes`, `domotica`, `alarmas`**: tarjetas fuera de 3:4 (2,222 · 1,776 · 0,563). Arreglarlas
  implica migrarlas a la convención de dos archivos.
- **Videos**: los slots que solo tienen video necesitan extracción de frame (`ffmpeg -vf fps=1/2
  -q:v 1`). Un frame de celular rinde peor que una foto: sirve para hero, para tarjeta hay que
  mirarlo antes.
- **`videovigilancia` bloque**: las dos tomas entregadas (`nd-srv-videovigilancia-bloque-v-01/02`)
  no muestran cámara instalada y quedan identificables dos compañeros de fondo. Se pidió material
  nuevo a Lucas. Movidas a `Fotos/_sin_asignar/` — no vetadas para siempre, no sirven para esto.
- **`cerraduras` bloque**: `nd-srv-cerraduras-bloque-h-01.jpg` es un stand de producto Yale con
  fondo blanco, no una puerta instalada. Posible detalle de teclado más adelante, no decidido.
  En `Fotos/_sin_asignar/`.
- **`domotica` bloque adicional**: `nd-srv-domotica-bloque-h-01.jpeg`, idéntica a
  `nd-srv-domotica-bloque-v-03.jpg.jpeg` (ya evaluada antes), rótulo "Isa Room" (nombre de
  persona) visible en pantalla y sin confirmar si la app que se ve es Home Assistant — el
  posicionamiento del sitio es sistema abierto. En `Fotos/_sin_asignar/`.
- **`domotica` bloque 1 — el recorte propuesto no alcanza**: `nd-srv-domotica-bloque-h-02.HEIC`
  (showroom real, elegida) tenía un recorte manual planeado en `(1370,680,4032,2344)` para sacar
  el cartel de marca "Shelly" del cuadro. Probado y **no alcanza**: quedan legibles TP-Link
  Omada, Sonos, Yale (×2), Philips y WiZ en los dos estantes que bordean el TV — son cajas de
  producto apiladas en cada estante, no equipo instalado. Se probaron dos recortes más angostos
  (excluyendo la pared con el cartel de Shelly) y el problema persiste: los dos estantes que
  flanquean el TV arriba y abajo están cargados de cajas en toda su extensión, no hay una
  sub-región 16:10 dentro de esta foto libre de marca legible. La foto en sí es una pared de
  demo/producto, no una instalación terminada — puede no ser la elegida correcta para "showroom
  real" más allá del recorte. Original en `Fotos/_sin_asignar/nd-srv-domotica-bloque-h-02.HEIC`,
  intento de recorte fallido guardado como referencia en
  `Fotos/_sin_asignar/servicio-domotica-bloque-1-INTENTO-con-marcas.jpg`. No se generó WebP ni se
  tocó `servicios.html` para este bloque — falta que Agustín mire las dos fotos y decida: otra
  toma, aceptar la marca visible, o pedir una reshoot sin packaging en cuadro.

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
