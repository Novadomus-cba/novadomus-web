# NOVA DOMUS — Jerarquía de Marcas y Dispositivos
### Insumo para la vidriera del sitio web
**Fecha de medición:** 31/08/2026 · **Base:** Supabase `vvwnyszcfindtuvojqgs` (único vigente)

---

## 0. Metodología y límite de la evidencia

Todo lo que sigue sale de contar líneas reales cotizadas, no de criterio ni de memoria. Se cruzaron
dos universos:

| Universo | Tabla | Volumen | Qué representa |
|---|---|---|---|
| **PY** — proyectos de integración | `proyectos_items` | 194 líneas / **7 proyectos** | Obra de arquitectura tecnológica: el corazón del negocio |
| **PC** — presupuestos comerciales | `presupuestos_items` | 268 líneas / **109 presupuestos** | Venta de producto y kits sueltos |

⚠️ **Límite importante y accionable:** la tabla `proyectos` tiene **28 proyectos**, pero solo **7**
tienen el BOM congelado en `proyectos_items`. Los otros 21 quedaron registrados con totales pero sin
detalle de ítems. Eso significa que la columna "PY" de abajo mide **el 25% de la obra real**, y que
marcas y dispositivos que hoy figuran con 1-2 apariciones probablemente estén subrepresentados.

**Consecuencia para la web:** la jerarquía de abajo es sólida para decidir **qué mostrar**, pero no
sirve como estadística pública ("instalamos X unidades de Y"). Para eso hay que completar el
snapshot de los 21 proyectos faltantes primero. Lo dejo abajo como pendiente #1.

**Hallazgo estructural:** PY y PC tienen jerarquías **distintas**, no la misma con distinto volumen.
Yale es la marca #1 por cantidad de documentos (58) y aparece en solo 2 proyectos de integración.
Shelly es lo opuesto: 3 proyectos pero 520 unidades. **La vidriera tiene que reflejar las dos
lógicas o va a mentir en una de las dos direcciones.**

---

## 1. JERARQUÍA DE MARCAS

### 1.1 Datos crudos (ordenado por documentos totales)

| Marca | PY docs | PY unid. | PC docs | PC unid. | SKUs distintos |
|---|---:|---:|---:|---:|---:|
| YALE | 2 | 98 | **57** | 269 | 23 |
| NOVA DOMUS *(marca propia)* | 0 | 0 | 46 | 539 | 23 |
| SHELLY | 3 | **520** | 17 | 72 | 29 |
| HIKVISION | **5** | 327 | 6 | 12 | 29 |
| EZVIZ | 0 | 0 | 10 | 123 | 12 |
| SEAGATE | 5 | 10 | 1 | 1 | 3 |
| FORZA | 4 | 5 | 2 | 2 | 3 |
| PHILIPS HUE | 0 | 0 | 5 | 23 | 6 |
| GLC | 4 | 23 | 0 | 0 | 8 |
| TP-LINK | 3 (+1) | 64 | 0 | 0 | 10 |
| STARLIGH | 1 | 138 | 2 | 2 | 1 |
| HOME ASSISTANT | 3 | 6 | 0 | 0 | 3 |
| SENSIBO | 2 | 9 | 1 | 1 | 2 |
| SONOS | 1 | 10 | 1 | 5 | 8 |
| EPISODE | 2 | 7 | 0 | 0 | 2 |
| VSSL | 2 | 2 | 0 | 0 | 2 |
| SMLIGHT | 1 | 1 | 0 | 0 | 1 |
| EATON | 1 | 9 | 0 | 0 | 2 |
| OPTOMA | 1 | 2 | 0 | 0 | 2 |
| RACMATICK ⚠️ | 1 | 9 | 0 | 0 | 1 |
| DAHUA ⚠️ | 0 | 0 | 1 | 4 | 1 |
| WIZ | 0 | 0 | 1 | 1 | 1 |

### 1.2 Jerarquía propuesta para la vidriera

**TIER 1 — NÚCLEO TÉCNICO** *(la marca ES el sistema; sin ella no hay proyecto)*

| Marca | Rol | Por qué es Tier 1 |
|---|---|---|
| **SHELLY** | Iluminación + control de cargas | 520 unidades en 3 proyectos, 29 SKUs distintos. Es la marca de mayor densidad por obra de todo el inventario |
| **HIKVISION** | Seguridad, video, alarma AXPro, accesos | Presente en 5 de 7 proyectos con BOM — la marca de mayor **cobertura** de obra. 327 unidades |
| **TP-LINK / OMADA** | Redes — el cimiento | En 3 proyectos con 64 unidades, y es línea mandataria por estándar ND |
| **HOME ASSISTANT** | Core / orquestación | 3 de 7 proyectos. Es lo que convierte dispositivos sueltos en sistema |

Estas cuatro deben tener **presencia visual dominante**: logo grande, video de respaldo, ficha
propia. Son la respuesta a "¿con qué trabajan?".

**TIER 2 — ESTRUCTURAL OBLIGATORIA** *(no las elige el cliente, las impone el estándar ND)*

| Marca | Rol | Frecuencia |
|---|---|---|
| **GLC** | Rack y accesorios | 4 de 7 proyectos, 23 unidades |
| **FORZA** | UPS (obligatorio por estándar) | 4 proyectos |
| **SEAGATE** | Disco SkyHawk de videovigilancia | 5 proyectos — empatado con Hikvision en cobertura |
| **SENSIBO** | Confort / clima por split | 2 proyectos |
| **SMLIGHT** | Coordinador Zigbee (SLZB-06) | 1 proyecto, pero es estándar vigente que reemplaza SkyConnect |

Presencia **secundaria**: mención en un bloque de "infraestructura", sin video ni ficha extensa.
Nadie compra Nova Domus por la marca del rack, pero mostrarlas prueba rigor.

**TIER 3 — MOTOR COMERCIAL** *(alta rotación de venta, baja penetración en obra)*

| Marca | PC docs | Lectura |
|---|---:|---|
| **YALE** | 57 | **La marca más cotizada de la empresa.** 23 SKUs, 269 unidades. Es puerta de entrada de cliente nuevo |
| **EZVIZ** | 10 | 123 unidades, 0 proyectos. Producto de reventa, sin margen B2B para escala |
| **PHILIPS HUE** | 5 | Línea propia (ND es distribuidor), 0 proyectos con BOM congelado |
| **STARLIGH** | 2 + 1 PY | 138 unidades en un solo proyecto — hardware de acceso, gran volumen concentrado |

⚠️ **Decisión de diseño que te toca a vos:** Yale es lo que más se cotiza y **no** es parte del
corazón de integración. Si la vidriera se ordena solo por frecuencia, Yale queda arriba de Shelly y
el mensaje pasa a ser "vendemos cerraduras". Mi recomendación está en la sección 4.

**TIER 4 — PREMIUM / CATÁLOGO DISPONIBLE** *(capacidad real, rotación baja o nula)*

Sonos (1 PY + 1 PC), Episode (2 PY), VSSL (2 PY), Control4, Triad, Russound, Araknis, Bose, Optoma.

Son proyecto-dependientes y de ticket alto. Van en un bloque de "también integramos" o dentro de la
sección de Entretenimiento, **no** en la vidriera principal: 382 SKUs de Control4 cargados con 0
apariciones en presupuestos sería una vidriera que promete lo que no rota.

**TIER 5 — NO PUBLICAR**

| Marca | Motivo |
|---|---|
| RACMATICK / RACKMATIK | Reemplazada por GLC como estándar. Aparece en 1 proyecto viejo (9 unidades) — es histórico, no vigente |
| DAHUA | 118 SKUs cargados, 1 aparición. Competencia directa de Hikvision: publicarla diluye el posicionamiento |
| UBIQUITI | 160 SKUs cargados, 0 apariciones. Omada es la línea |
| WIZ, EATON, SAMSUNG, OPTOMA | Apariciones aisladas, sin rol definido en el stack |
| AYAX | En `marcas_respaldo` como pendiente, sin una sola aparición en inventario usado |

---

## 2. JERARQUÍA DE DISPOSITIVOS

Ordenado por los 6 sistemas del framework ND. La columna **Estado ficha** es lo que define si el
dispositivo puede publicarse hoy: `F` = foto cargada, `T` = ficha técnica cargada.

### 2.1 ILUMINACIÓN — el sistema más denso

| # | ID | Dispositivo | Docs | Unid. | F | T | Nota |
|---|---:|---|---:|---:|:-:|:-:|---|
| 1 | 387 | **Shelly 1PM Mini Gen4** | 7 | **245** | ✅ | ✅ | El dispositivo más cotizado de toda la empresa |
| 2 | 357 | **Shelly Plus 2PM Gen4** | 6 | 45 | ✅ | ✅ | |
| 3 | 389 | **Shelly Plus i4** | 5 | 22 | ✅ | ✅ | Ficha aclara correctamente "sin salida de relé" |
| 4 | 358 | **Shelly Dimmer Gen4** | 2 | 94 | ✅ | ✅ | |
| 5 | 416 | Shelly Pro 2PM DIN | 4 | 8 | ✅ | ✅ | remarque 0,97 → alerta |
| 6 | 354 | Shelly 1 Gen4 | 4 | 7 | ✅ | ✅ | Portón/reja |
| 7 | 420 | Shelly Pro 4PM DIN | 2 | 18 | ✅ | ✅ | remarque 0,94 → alerta |
| 8 | 403 | Shelly Dimmer **Gen3** | 3 | 15 | ✅ | ✅ | ⚠️ ver §3.4 |
| 9 | 659 | Shelly BLU Door/Window ZB | 1 | **84** | ✅ | ✅ | Kit de seguridad / automatismo de paso |
| — | 386 | Shelly 1 Mini Gen4 | 2 | 3 | ❌ | ✅ | falta foto |

**Los 4 primeros son la vidriera de Iluminación.** Cubren el 100% de la jerarquía Shelly del
estándar (1 punto / 2 puntos / 3+ puntos / zona de reposo) y los cuatro tienen foto y ficha
completas. Se puede publicar hoy sin trabajo previo.

### 2.2 SEGURIDAD — la mayor cobertura de obra

| # | ID | Dispositivo | Docs | Unid. | F | T |
|---|---:|---|---:|---:|:-:|:-:|
| 1 | 147 | **Cámara IP 2MP ColorVu 3.0 AcuSense** DS-2CD1027G3-LIU | 2 | **81** | ✅ | ✅ |
| 2 | 136 | **Kit alarma AXPro** DS-PWA96-Kit-WB | 3 | 3 | ✅ | ✅ |
| 3 | 204 | Sirena exterior AXPro DS-PS1-E-WB | 3 | 7 | ✅ | ✅ |
| 4 | 1805 | Cámara IP 4MP ColorVu DS-2CD1047G3-LIU | 2 | 11 | ✅ | ✅ |
| 5 | 202 | Detector PIR interior DS-PDP15P-EG2-WB | 2 | 13 | ✅ | ✅ |
| 6 | 129 | Teclado LED AXPro DS-PK1-E-WB | 2 | 3 | ✅ | ✅ |
| 7 | 132 | Repetidor AXPro DS-PR1-WB(B) | 2 | 3 | ✅ | ⚠️ ficha corta |
| 8 | 1966 | Kit alarma AXHome DS-PA201P-Kit-16WB | 3 | 3 | ✅ | ✅ |
| 9 | 191 | Control de acceso facial DS-K1T323MBWX-QRE1 | 1 | 12 | ✅ | ✅ |
| 10 | 188 | **Pantalla videoportero DS-KH6110-WE1** | 1 | **84** | ❌ | ✅ |

Seguridad está en excelente estado: 9 de 10 con foto y ficha. El único hueco es el #10, que además
es el de mayor volumen unitario del rubro (84 unidades) — **prioridad 1 de sourcing**.

### 2.3 ACCESOS / CERRADURAS — el motor comercial

| # | ID | Dispositivo | Docs | Unid. | F | T |
|---|---:|---|---:|---:|:-:|:-:|
| 1 | 641 | **KIT YSD 100 Batiente + HUB** | **14** | 16 | ✅ | ✅ |
| 2 | 645 | **KIT LIA Mortise + HUB** | 13 | 23 | ✅ | ✅ |
| 3 | 624 | **YSD 100 Batiente Smart Digital** | 13 | 16 | ✅ | ✅ |
| 4 | 647 | **KIT YMC 420 Mortise + HUB** | 8 | **195** | ✅ | ✅ |
| 5 | 637 | KIT YRD 256 + HUB | 5 | 17 | ✅ | ✅ |
| 6 | 616 | YMC 410 Negro | 5 | 6 | ✅ | ✅ |
| 7 | 617 | YMC 410 Plateado | 3 | 3 | ✅ | ✅ |
| 8 | 632 | YMC 420 Mortise (sin hub) | 3 | 4 | ✅ | ✅ |
| 9 | 628 | LIA Cerradura completa | 5 | 12 | ❌ | ✅ |
| 10 | 613 | YDD 120 Digital Deadbolt | 3 | 6 | ❌ | ✅ |
| — | 89 | EZVIZ CS-DL05-R201 | 3 | **102** | ✅ | ✅ |
| — | 482 | Starligh Kit Accesos Proximidad | 2 | 2 | ❌ | ✅ |
| — | 191 | Hikvision acceso facial + QR | 1 | 12 | ✅ | ✅ |

Los 4 primeros (todos con foto y ficha) son la vidriera de Accesos. **Recordatorio para el copy
web:** en Argentina Yale **no** integra a Home Assistant — la vidriera no puede insinuar control
unificado en las fichas de Yale.

### 2.4 REDES

| # | ID | Dispositivo | Docs | Unid. | F | T |
|---|---:|---|---:|---:|:-:|:-:|
| 1 | 1311 | **EAP650-OUT** (AP exterior WiFi 6) | 2 | 14 | ✅ | ✅ |
| 2 | 1461 | **TL-SG2218P** (switch 16p PoE+ 150W) | 2 | 9 | ✅ | ✅ |
| 3 | 1302 | **EAP650** (AP interior WiFi 6) | 2 | 8 | ✅ | ✅ |
| 4 | 1469 | TL-SG3428MP (switch 24p L2 PoE+) | 2 | 4 | ✅ | ✅ |
| 5 | 1455 | TL-SM311LS (módulo SFP) | 1 | 16 | ✅ | ✅ |
| ⚠️ | 1448 | **ER7212PC** | 2 | 2 | ✅ | ✅ | **DESCONTINUADO — no publicar** |

⚠️ **Hueco de vidriera:** los 4 dispositivos publicables de Redes son APs y switches. **El router no
tiene reemplazo cargado con historial**: ER7212PC está descontinuado y el reemplazo estándar
(ER605 + OC200) no aparece en ningún presupuesto medido. Antes de publicar Redes hay que verificar
que ER605 y OC200 estén activos, con foto y ficha.

### 2.5 CORE

| # | ID | Dispositivo | Docs | Unid. | F | T |
|---|---:|---|---:|---:|:-:|:-:|
| 1 | 344 | **Shelly Wall Display XL Black** | 3 | 3 | ✅ | ✅ |
| 2 | 209 | **Home Assistant Green** | 2 | 2 | ✅ | ✅ |
| 3 | 208 | SkyConnect USB | 2 | 2 | ✅ | ✅ |
| 4 | 371 | Shelly Wall Display | 2 | 3 | ✅ | ✅ |

Core está 100% publicable. Es el mejor material de vidriera que tenés: pocos dispositivos, todos
con foto y ficha, y es el sistema que explica el concepto de integración.

Nota: SkyConnect sigue apareciendo aunque el estándar vigente es SMLIGHT SLZB-06 — el SLZB tiene 1
aparición y falta foto. Definir cuál se publica.

### 2.6 INFRAESTRUCTURA (rack, energía, almacenamiento)

| ID | Dispositivo | Docs | F | T |
|---:|---|---:|:-:|:-:|
| 1126 | Seagate SkyHawk 4TB ST4000VX016 | 3 | ✅ | ✅ |
| 108 | GLC Organizador de cable 1U | 2 | ✅ | ✅ |
| 111 | GLC Canal de tensión CT5000 | 2 | ✅ | ✅ |
| 109 | GLC Bandeja 1U30 | 2 | ✅ | ✅ |
| 817 | UPS Forza Online Rackeable 1000VA 1U | 2 | ✅ | ✅ |
| 812 | UPS Forza Interactiva 750VA | 2 | ❌ | ✅ |

### 2.7 CONFORT y ENTRETENIMIENTO — los dos sistemas flacos

| Sistema | Dispositivos con historial | Estado |
|---|---|---|
| **CONFORT** | Sensibo Air B2B (id 325, 2 docs, ✅✅) — y nada más | Un solo dispositivo. Cero cortinas cotizadas |
| **ENTRETENIMIENTO** | Sonos Arc (437, 2 docs, ✅✅), Episode (2 PY), VSSL (2 PY), Optoma (1) | Disperso, sin dispositivo repetido |

⚠️ **Estos dos sistemas no tienen material para una vidriera creíble hoy.** Opciones honestas: (a)
presentarlos como capacidad sin grilla de producto, (b) dejarlos afuera de la vidriera y tratarlos
en la narrativa de proyecto. Lo que **no** conviene es armar una grilla de 8 productos que nunca se
cotizaron.

---

## 3. ESTADO DE COMPLETITUD — qué se puede publicar hoy

### 3.1 Fichas técnicas: prácticamente resueltas ✅

`caracteristicas_principales` está cargada en **>99% de los ítems activos** de todas las marcas del
stack. Verifiqué 18 fichas por muestreo: son reales, específicas y de calidad publicable (amperajes,
protocolos, lúmenes, presupuesto PoE, MTBF). **No hace falta trabajo de redacción técnica.**

Único caso a revisar: id 132 (Repetidor AXPro), ficha por debajo del umbral.

### 3.2 Fotos: el cuello de botella real ❌

| Marca | Activos | Foto cargada | % |
|---|---:|---:|---:|
| GLC | 14 | 9 | 64% |
| HOME ASSISTANT | 7 | 4 | 57% |
| SENSIBO | 5 | 2 | 40% |
| SHELLY | 107 | 28 | **26%** |
| VSSL | 17 | 4 | 24% |
| SONOS | 53 | 10 | 19% |
| YALE | 51 | 11 | **22%** |
| EZVIZ | 52 | 9 | 17% |
| SEAGATE | 31 | 4 | 13% |
| FORZA | 27 | 4 | 15% |
| TP-LINK | 253 | 20 | 8% |
| HIKVISION | 676 | 46 | **7%** |
| PHILIPS HUE | 61 | 0 (3 "revisar") | **0%** |
| CONTROL4 | 382 | 0 | 0% |
| EPISODE | 273 | 3 | 1% |

**Lectura clave:** los porcentajes globales asustan, pero **el subconjunto que importa está casi
resuelto**. De los ~45 dispositivos con historial real de cotización, solo **13 no tienen foto**. La
vidriera no necesita 676 fotos de Hikvision: necesita las 45 de los dispositivos que efectivamente
se venden.

### 3.3 Videos de marca (`marcas_respaldo`)

- **Cargados (13):** Shelly, Hikvision, TP-Link, Home Assistant, Yale, Sonos, VSSL, EZVIZ, Philips
  Hue, Sensibo, Control4, Bose, Ubiquiti → **cubre el 100% de Tier 1 y Tier 3** ✅
- **`no_aplica` (14):** GLC, Forza, Seagate, Starligh, SMLIGHT, Episode, Triad, Russound, Araknis,
  Optoma, Luma, TruAudio, Bond, Astrotool
- **Pendientes (3):** AYAX, Eaton, RACKMATIK → los tres son Tier 5, **no bloquean nada**

Para la vidriera, videos está **resuelto**.

### 3.4 Huecos de datos detectados (para corregir, no para la web)

| # | Hallazgo | Impacto |
|---|---|---|
| 1 | **21 de 28 proyectos sin BOM** en `proyectos_items` | Bloquea estadística pública y distorsiona esta jerarquía |
| 2 | `sku_mo` NULL: Hikvision **278**, Control4 361, Episode 267, Bose 42, Optoma 34, Triad 63, Araknis 31, Sonos 26, TP-Link 16, Home Assistant 4 | Riesgo directo de MO mal calculada (el error Docta-Massello) |
| 3 | SKU vacío: Shelly **58**, EZVIZ 41, Starligh 23, Sonos 15, GLC 14, WIZ 9, VSSL 8 | La vidriera no puede mostrar SKU en esos ítems |
| 4 | Marcas sin normalizar: `TPLINK` vs `TP-Link`, `EZVIZ (HIKVISION)` vs `EZVIZ`, `SIN MARCA CARGADA` (8 líneas), `RACMATICK` (inventario) vs `RACKMATIK` (marcas_respaldo) | Rompe cualquier agrupación automática por marca en la web |
| 5 | **Dimmer Gen3 (id 403) cotizado en 3 docs** vs Gen4 (id 358) en 2 | Contradice la jerarquía Gen4 del estándar — ¿Gen3 sigue vigente o es residual? |
| 6 | Descontinuados con historial: ER7212PC (1448), Yale XTR 226 (631) | No deben aparecer en la web |
| 7 | Remarque >0,73: Shelly 12 ítems, Yale 5, EZVIZ 1. Caso extremo: **Yale Door Closer 2065, remarque 2,30 (230%)** | Alerta ya conocida — un cierrapuertas mecánico no sostiene ese markup |
| 8 | `pvp_referencia_fecha` cargada en solo 6 de los ~45 ítems de vidriera | Remarques sin fechar envejecen sin aviso |

---

## 4. RECOMENDACIÓN DE ARQUITECTURA PARA LA VIDRIERA

La tensión Yale-vs-Shelly no se resuelve con un solo ranking. Propuesta de **dos entradas
separadas**, que además responden a dos búsquedas distintas del visitante:

**Entrada A — "Con qué construimos"** *(el stack de integración)*
Shelly · Hikvision · TP-Link Omada · Home Assistant, con GLC/Forza/Seagate/Sensibo como
infraestructura de soporte. Logo grande + video + los 4 dispositivos estrella de cada uno.
Responde a *"¿son serios?"*.

**Entrada B — "Qué instalamos"** *(producto por sistema)*
Grillas por los 6 sistemas, con los dispositivos de §2. Aquí Yale es protagonista de Accesos sin
competir con Shelly por el titular. Responde a *"¿me sirve para lo que necesito?"*.

**Orden sugerido de los sistemas** — por material publicable disponible, no por importancia teórica:
1. Iluminación (4 dispositivos listos, es el más demostrable)
2. Seguridad (9 de 10 listos)
3. Accesos (8 listos)
4. Core (4 de 4 listos)
5. Redes (4 listos, **pendiente resolver el router**)
6. Infraestructura (5 de 6 listos)
7. Confort / Entretenimiento → sin grilla, solo capacidad narrada

**Regla de publicación:** un dispositivo entra a la vidriera solo con **foto real + ficha técnica**.
Con ese filtro hay **~32 dispositivos publicables hoy**, distribuidos en 6 sistemas. Es suficiente
para una vidriera densa y creíble sin esperar el pipeline de fotos.

---

## 5. PENDIENTES ORDENADOS POR BLOQUEO

### Bloquean la vidriera
1. **13 fotos** de dispositivos con historial de cotización (kickoff en §6)
2. **Router de Redes:** confirmar ER605 + OC200 activos con foto y ficha, y bajar ER7212PC de todo
   material público
3. **Decisión Confort/Entretenimiento:** ¿grilla o solo narrativa?
4. **Decisión SkyConnect vs SMLIGHT SLZB-06:** cuál se publica como coordinador Zigbee
5. **Normalizar marcas** (hueco #4) antes de agrupar por marca en el front

### No bloquean, pero deberían resolverse igual
6. Completar BOM de los 21 proyectos sin `proyectos_items` — habilita estadística pública real
7. Cargar `sku_mo` faltantes, empezando por los 278 de Hikvision
8. Definir vigencia del Dimmer Gen3
9. Fechar `pvp_referencia` de los ~45 ítems de vidriera
10. Revisar el remarque 230% del Yale Door Closer 2065

---

## 6. KICKOFF DE FOTOS — prioridad para Claude Code

Los 13 dispositivos con historial real de cotización y sin `imagen_url`. Foto real de
fabricante/distribuidor, subida a Storage `productos/[marca]/`, luego
`UPDATE inventario SET imagen_url=..., imagen_estado='cargada'` en `vvwnyszcfindtuvojqgs`.

| Prioridad | ID | Nombre | SKU | Marca | Docs | Unid. |
|---:|---:|---|---|---|---:|---:|
| 1 | 188 | Pantalla videoportero interior 4.3" PoE | DS-KH6110-WE1 | HIKVISION | 1 | 84 |
| 2 | 628 | LIA Cerradura completa | 16705 | YALE | 5 | 12 |
| 3 | 613 | YDD 120 Digital Deadbolt | 16104 | YALE | 3 | 6 |
| 4 | 609 | YRD 256 Deadbolt SL Bronce | 11474 | YALE | 3 | 4 |
| 5 | 267 | Hue A67 E27 White Ambiance | HUEA6713WTWP | PHILIPS HUE | 3 | 6 |
| 6 | 386 | Shelly 1 Mini Gen4 | *(sin SKU)* | SHELLY | 2 | 3 |
| 7 | 390 | Shelly 1 Gen3 | *(sin SKU)* | SHELLY | 2 | 3 |
| 8 | 622 | YDM 25 | 16777 | YALE | 2 | 3 |
| 9 | 614 | YDD 120 Black | 9974 | YALE | 2 | 2 |
| 10 | 812 | UPS Forza Interactiva 750VA/375W | NT-752A | FORZA | 2 | 3 |
| 11 | 482 | Kit Accesos Proximidad interior | *(sin SKU)* | STARLIGH | 2 | 2 |
| 12 | 91 | EZVIZ DL06 PRO doble huella | 855000 | EZVIZ | 2 | 2 |
| 13 | 593 | Yale Door Closer 2065 S VIS | 10956 | YALE | 2 | 6 |

**Revisar (no faltan, están marcadas `revisar`):** id 267 y 2 ítems más de Philips Hue, 2 de Yale,
1 de EZVIZ.

**Nota:** 8 de 13 son Yale. Una sesión enfocada en Yale cierra el 60% del kickoff.

---

*Fuente única: Supabase `vvwnyszcfindtuvojqgs`. Sin escrituras en esta sesión — todas las consultas
fueron de lectura. Medición 31/08/2026.*
