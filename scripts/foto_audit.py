#!/usr/bin/env python3
"""Auditoria de fotos candidatas de Nova Domus: mide, no elige.

Recorre los originales de --src y produce dos cosas:

  1. Un inventario medible (tabla en consola + audit.csv): orientacion real via
     EXIF, relacion de aspecto, nitidez, exposicion, GPS, duplicados por hash y
     si el nombre respeta la convencion nd-srv-<servicio>-<slot>-<orient>-<nn>.

  2. Laminas de contacto numeradas, al tamano REAL de render, con el degradado y
     el titulo de la tarjeta encima. Para slots de tarjeta genera las tres
     posiciones de recorte 3:4 (arriba / centro / abajo).

La decision la toma una persona mirando las laminas y se registra en
scripts/DECISIONES.md. Este script no escribe nunca en assets/img/.

Uso:
    pip install pillow pillow-heif numpy
    python scripts/foto_audit.py --src Fotos --out Fotos/_laminas
    python scripts/foto_audit.py --src Fotos --servicio videovigilancia

Seleccion en dos etapas, para no tener que elegir entre 36 opciones de una:

    # 1. preseleccion: un recorte por candidato
    python scripts/foto_audit.py --src Fotos --servicio redes --anchor centro
    # 2. ajuste de encuadre: las tres anclas, solo de las finalistas
    python scripts/foto_audit.py --src Fotos --servicio redes --solo v-03,v-07
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageOps

try:
    import pillow_heif
    pillow_heif.register_heif_opener()
    HEIC_OK = True
except ImportError:
    HEIC_OK = False

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp"}
VIDEO_EXTS = {".mp4", ".mov", ".m4v", ".avi"}

# Convencion de nombres del pedido de fotos a Lucas. La doble extension
# (.jpg.jpg / .jpg.HEIC) es habitual en la entrega y no es un error.
NAME_RE = re.compile(
    r"^nd-srv-(?P<servicio>[a-z-]+?)-(?P<slot>tarjeta|ancha|bloque)-(?P<orient>[hv])-(?P<nn>\d+)",
    re.IGNORECASE,
)

# Tamanos reales de render, leidos de servicios.html (no inventar):
#   tarjeta  -> sizes="320px", aspect-ratio 3/4  -> 320x427
#   ancha    -> sizes="880px" en panel__hero
CARD_W, CARD_H = 320, 427
HERO_W = 880

NAVY = (11, 19, 43)
CREMA = (253, 251, 240)


def load(path: Path) -> Image.Image:
    """Abre respetando la orientacion EXIF. Sin esto, una foto con
    orientation=6 se mide en el eje equivocado: es el error que dejo 6 de 7
    tarjetas fuera de relacion."""
    im = Image.open(path)
    im = ImageOps.exif_transpose(im)
    return im.convert("RGB") if im.mode != "RGB" else im


def sharpness(im: Image.Image) -> float:
    """Varianza del laplaciano sobre una version chica. Es un proxy de detalle,
    no de foco: una escena plana (pared blanca) da bajo aunque este nitida."""
    g = np.asarray(im.convert("L").resize((512, 512), Image.LANCZOS), dtype=np.float32)
    lap = (
        -4 * g[1:-1, 1:-1]
        + g[:-2, 1:-1] + g[2:, 1:-1] + g[1:-1, :-2] + g[1:-1, 2:]
    )
    return float(lap.var())


def exposure(im: Image.Image) -> tuple[float, float, float]:
    """Devuelve (luminancia media 0-1, % quemado, % aplastado)."""
    g = np.asarray(im.convert("L"), dtype=np.float32) / 255.0
    return float(g.mean()), float((g > 0.99).mean() * 100), float((g < 0.01).mean() * 100)


def has_gps(path: Path) -> bool:
    try:
        return 34853 in Image.open(path).getexif()
    except Exception:
        return False


def crop_34(im: Image.Image, anchor: str) -> Image.Image:
    w, h = im.size
    tw = round(h * 3 / 4)
    if tw <= w:                      # fuente mas ancha que 3:4 -> recorto a lo ancho
        x = (w - tw) // 2
        return im.crop((x, 0, x + tw, h))
    th = round(w * 4 / 3)            # fuente mas alta -> recorto a lo alto
    y = {"arriba": 0, "abajo": h - th}.get(anchor, (h - th) // 2)
    return im.crop((0, y, w, y + th))


def card_preview(im: Image.Image, title: str) -> Image.Image:
    """Reproduce la tarjeta como se ve: 320x427, con el degradado exacto de
    .card__link::after y el titulo en crema."""
    c = im.resize((CARD_W, CARD_H), Image.LANCZOS).convert("RGBA")
    ov = Image.new("RGBA", (CARD_W, CARD_H), (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    for y in range(CARD_H):
        up = (CARD_H - 1 - y) / (CARD_H - 1) * 100          # % desde abajo
        if up <= 40:
            a = 0.9 + (up / 40) * (0.35 - 0.9)
        elif up <= 62:
            a = 0.35 + ((up - 40) / 22) * (0.0 - 0.35)
        else:
            a = 0.0
        od.line([(0, y), (CARD_W, y)], fill=(*NAVY, int(a * 255)))
    c = Image.alpha_composite(c, ov).convert("RGB")
    d = ImageDraw.Draw(c)
    d.text((20, CARD_H - 46), title.upper()[:18], fill=CREMA)
    d.rectangle([CARD_W - 64, CARD_H - 64, CARD_W - 20, CARD_H - 20], outline=CREMA)
    return c


def etiqueta(nombre: str, servicio: str, slot: str) -> str:
    """Saca el prefijo comun nd-srv-<servicio>-<slot>- y la doble extension:
    'nd-srv-videovigilancia-tarjeta-v-02.jpg.jpg' -> 'v-02'. Sin esto la
    etiqueta se trunca justo antes de lo que distingue a cada candidato."""
    corto = re.sub(rf"^nd-srv-{re.escape(servicio)}-{re.escape(slot)}-", "", nombre,
                   flags=re.IGNORECASE)
    corto = re.sub(r"(\.(jpe?g|png|heic|heif|webp|mp4|mov))+$", "", corto, flags=re.IGNORECASE)
    return corto or nombre


def sheet(tiles: list[tuple[Image.Image, str]], out: Path, cols: int = 4) -> None:
    if not tiles:
        return
    tw = max(t[0].size[0] for t in tiles)
    th = max(t[0].size[1] for t in tiles)
    rows = (len(tiles) + cols - 1) // cols
    gap, lab = 16, 34
    img = Image.new("RGB", (cols * tw + (cols + 1) * gap, rows * (th + lab) + gap), NAVY)
    d = ImageDraw.Draw(img)
    for i, (tile, text) in enumerate(tiles):
        x = gap + (i % cols) * (tw + gap)
        y = gap + (i // cols) * (th + lab)
        img.paste(tile, (x, y))
        d.text((x + 2, y + th + 10), text, fill=(200, 169, 110))
    img.save(out)
    print(f"  lamina: {out}  ({len(tiles)} opciones)")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--src", default="Fotos", help="carpeta de originales (default: Fotos)")
    ap.add_argument("--out", default=None, help="carpeta de laminas (default: <src>/_laminas)")
    ap.add_argument("--servicio", default=None, help="filtrar por codigo de servicio")
    ap.add_argument("--no-sheets", action="store_true", help="solo inventario, sin laminas")
    ap.add_argument("--anchor", default="todas", choices=["todas", "arriba", "centro", "abajo"],
                    help="que recortes 3:4 mostrar en las laminas de tarjeta. "
                         "'centro' para la preseleccion; 'todas' para ajustar encuadre "
                         "(default: todas)")
    ap.add_argument("--solo", default=None,
                    help="coma-separada: mostrar solo los archivos que contengan alguno de "
                         "estos textos. Los numeros NO se renumeran, siguen siendo los de la "
                         "lamina completa")
    args = ap.parse_args()

    src = Path(args.src)
    if not src.is_dir():
        sys.exit(f"ERROR: no existe {src}")
    out = Path(args.out) if args.out else src / "_laminas"
    out.mkdir(parents=True, exist_ok=True)

    rows: list[dict] = []
    videos: list[Path] = []
    seen: dict[str, str] = {}

    for p in sorted(src.iterdir()):
        if not p.is_file():
            continue
        # Cuenta la ultima extension real, no la doble: nd-...jpg.mp4 es video.
        ext = p.suffix.lower()
        if ext in VIDEO_EXTS:
            videos.append(p)
            continue
        if ext not in IMAGE_EXTS:
            continue
        if ext in {".heic", ".heif"} and not HEIC_OK:
            print(f"  (!) {p.name}: falta pillow-heif, no se puede leer")
            continue

        m = NAME_RE.match(p.name)
        servicio = m.group("servicio").lower() if m else ""
        slot = m.group("slot").lower() if m else ""
        orient_claim = m.group("orient").lower() if m else ""
        if args.servicio and servicio != args.servicio.lower():
            continue

        try:
            im = load(p)
        except Exception as e:
            print(f"  ERROR {p.name}: {e}")
            continue

        w, h = im.size
        digest = hashlib.sha256(p.read_bytes()).hexdigest()
        lum, blown, crushed = exposure(im)
        real_orient = "v" if h > w else "h"
        rows.append(dict(
            archivo=p.name, servicio=servicio, slot=slot,
            convencion="si" if m else "NO",
            orient_nombre=orient_claim, orient_real=real_orient,
            coincide="si" if (not m or orient_claim == real_orient) else "NO",
            w=w, h=h, rel=round(w / h, 4),
            exif_orient=Image.open(p).getexif().get(274, 1),
            nitidez=round(sharpness(im), 1),
            luminancia=round(lum, 3), quemado=round(blown, 2), aplastado=round(crushed, 2),
            gps="SI" if has_gps(p) else "no",
            bytes=p.stat().st_size,
            duplicado_de=seen.get(digest, ""),
        ))
        seen.setdefault(digest, p.name)

    if not rows and not videos:
        sys.exit("no se encontro material")

    hdr = ["archivo", "servicio", "slot", "orient_real", "coincide", "w", "h", "rel",
           "nitidez", "luminancia", "gps", "duplicado_de"]
    print(f"\n{len(rows)} imagenes\n")
    print("  ".join(f"{c:>12s}" if c != "archivo" else f"{c:<44s}" for c in hdr))
    for r in sorted(rows, key=lambda r: (r["servicio"], r["slot"], r["archivo"])):
        print("  ".join(
            f"{str(r[c]):<44s}" if c == "archivo" else f"{str(r[c]):>12s}" for c in hdr))

    csv_path = out / "audit.csv"
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        wr = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        wr.writeheader()
        wr.writerows(rows)
    print(f"\ncsv: {csv_path}")

    # --- avisos que importan, con numero ---
    for r in rows:
        if r["coincide"] == "NO":
            print(f"  (!) {r['archivo']}: el nombre dice '{r['orient_nombre']}' y es "
                  f"'{r['orient_real']}' (EXIF orientation={r['exif_orient']})")
        if r["duplicado_de"]:
            print(f"  (!) {r['archivo']}: identico a {r['duplicado_de']}")
        if r["convencion"] == "NO":
            print(f"  (!) {r['archivo']}: fuera de convencion, sin servicio ni slot")
        if r["gps"] == "SI":
            print(f"  (i) {r['archivo']}: tiene GPS (lo despoja build_images.py)")
    if videos:
        print(f"\n{len(videos)} videos (necesitan extraccion de frame):")
        for v in videos:
            print(f"  {v.name}  {v.stat().st_size:,} B")

    if args.no_sheets:
        return

    # --- laminas por servicio y slot ---
    print("\nlaminas:")
    grupos: dict[tuple[str, str], list[dict]] = {}
    for r in rows:
        if r["servicio"] and r["slot"]:
            grupos.setdefault((r["servicio"], r["slot"]), []).append(r)

    anchors = ("arriba", "centro", "abajo") if args.anchor == "todas" else (args.anchor,)
    solo = [t.strip().lower() for t in args.solo.split(",")] if args.solo else None

    for (servicio, slot), items in sorted(grupos.items()):
        # El indice se asigna sobre el grupo COMPLETO y antes de filtrar: asi el
        # numero de una foto es el mismo en la lamina de preseleccion y en la de
        # ajuste de encuadre.
        numerados = list(enumerate(sorted(items, key=lambda r: r["archivo"]), start=1))
        if solo:
            numerados = [(i, r) for i, r in numerados
                         if any(t in r["archivo"].lower() for t in solo)]
        if not numerados:
            continue

        tiles = []
        for i, r in numerados:
            im = load(src / r["archivo"])
            if slot == "tarjeta":
                for anchor in anchors:
                    letra = {"arriba": "a", "centro": "b", "abajo": "c"}[anchor]
                    tiles.append((card_preview(crop_34(im, anchor), servicio),
                                  f"{i}{letra}  {anchor}  ({etiqueta(r['archivo'], servicio, slot)})"))
            else:
                th = max(round(HERO_W * r["h"] / r["w"]) // 2, 1)
                tiles.append((im.resize((HERO_W // 2, th), Image.LANCZOS),
                              f"{i}  {etiqueta(r['archivo'], servicio, slot)}"))

        cols = 4 if slot == "tarjeta" else 2
        if slot == "tarjeta" and len(anchors) == 3:
            cols = 3          # una fila por candidato: arriba / centro / abajo
        sufijo = f"-{args.anchor}" if args.anchor != "todas" else ""
        sheet(tiles, out / f"lamina-{servicio}-{slot}{sufijo}.png", cols=cols)

        print(f"    {servicio}/{slot}: " + ", ".join(
            f"{i}={etiqueta(r['archivo'], servicio, slot)}" for i, r in numerados))

    print("\nElegir por numero mirando las laminas. Registrar la eleccion y los "
          "vetos en scripts/DECISIONES.md antes de generar los WebP.")


if __name__ == "__main__":
    main()
