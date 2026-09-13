#!/usr/bin/env python3
"""Procesa una imagen generada para una tarjeta de servicio de servicios.html.

Hace los cuatro pasos de la seccion "Excepcion: imagenes generadas en las
tarjetas de servicios" de DECISIONES.md, en orden, y falla fuerte si alguno no
da: verificacion de chunks por LISTA BLANCA (el C2PA inyectado no lo muestra
im.info de PIL), verificacion de relacion 3:4, export a 640w y decision sobre
si corresponde una variante 960w.

    python scripts/tarjeta_generada.py redes ~/Downloads/gemini-redes.png

Al terminar imprime la linea <img> exacta para pegar en servicios.html.
"""
import sys
from pathlib import Path

from PIL import Image, ImageOps

# Chunks de imagen de un contenedor WebP. Cualquier otro (EXIF, XMP, ICCP,
# C2PA) es metadata y se descarta: lista blanca, nunca lista negra.
KEEP = {"VP8 ", "VP8L", "VP8X", "ALPH", "ANIM", "ANMF"}

SLUGS = ["instalacion-electrica", "redes", "domotica", "videovigilancia",
         "cerraduras", "alarmas", "audio-video"]

TARGET_RATIO = 3 / 4
RATIO_TOLERANCE = 0.02   # el CSS hace object-fit:cover, tolera diferencias chicas
CARD_WIDTH = 640         # unico breakpoint real: el HTML usa sizes="320px"
WIDE_WIDTH = 960         # solo si la nativa da 960px o mas
QUALITY = 82


def audit_chunks(path: Path) -> list:
    """Devuelve los chunks que NO son de imagen. Vacio = limpio."""
    b = path.read_bytes()
    if b[:4] != b"RIFF" or b[8:12] != b"WEBP":
        raise ValueError(f"{path.name}: no es un WebP RIFF")
    found, i = [], 12
    while i + 8 <= len(b):
        cid = b[i:i + 4].decode("latin1")
        size = int.from_bytes(b[i + 4:i + 8], "little")
        if cid not in KEEP:
            found.append((cid, size))
        i += 8 + size + (size & 1)
    return found


def export(im: Image.Image, out: Path, width: int) -> Path:
    h = round(width * im.height / im.width)
    im.resize((width, h), Image.LANCZOS).save(
        out, "WEBP", quality=QUALITY, method=6)
    leftovers = audit_chunks(out)
    if leftovers:
        raise SystemExit(f"ERROR: {out.name} quedo con metadata {leftovers}. "
                         f"Correr scripts/strip_webp_chunks.py y revisar.")
    print(f"  {out.name}  {width}x{h}  {out.stat().st_size:,} B  metadata limpia")
    return out


def main() -> None:
    if len(sys.argv) != 3:
        sys.exit(f"uso: python scripts/tarjeta_generada.py <slug> <imagen>\n"
                 f"slugs: {', '.join(SLUGS)}")
    slug, src = sys.argv[1], Path(sys.argv[2]).expanduser()
    if slug not in SLUGS:
        sys.exit(f"slug desconocido: {slug}\nslugs validos: {', '.join(SLUGS)}")
    if not src.exists():
        sys.exit(f"no existe: {src}")

    out_dir = Path(__file__).resolve().parent.parent / "assets" / "img"
    im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    ratio = im.width / im.height
    print(f"\n{src.name}: {im.width}x{im.height}  ratio {ratio:.4f}")

    if abs(ratio - TARGET_RATIO) > RATIO_TOLERANCE:
        print(f"  AVISO: ratio fuera de 3:4 ({TARGET_RATIO:.4f} +- "
              f"{RATIO_TOLERANCE}). object-fit:cover va a recortar.\n"
              f"  Regenerar en 3:4 nativo antes que recortar acá: una "
              f"composicion pensada en horizontal no sobrevive el recorte.")

    print("  exportando:")
    export(im, out_dir / f"servicio-{slug}-tarjeta-{CARD_WIDTH}.webp", CARD_WIDTH)

    wide = out_dir / f"servicio-{slug}-tarjeta-{WIDE_WIDTH}.webp"
    if im.width >= WIDE_WIDTH:
        export(im, wide, WIDE_WIDTH)
        srcset = (f' srcset="assets/img/servicio-{slug}-tarjeta-{CARD_WIDTH}.webp '
                  f'{CARD_WIDTH}w, assets/img/servicio-{slug}-tarjeta-{WIDE_WIDTH}.webp '
                  f'{WIDE_WIDTH}w" sizes="320px"')
    else:
        srcset = ""
        print(f"  nativa de {im.width}px: no da para un {WIDE_WIDTH}w real, "
              f"va sin srcset (no inventar un {WIDE_WIDTH}w falso)")
        if wide.exists():
            print(f"  OJO: {wide.name} existe y queda huerfano -> git rm")

    h = round(CARD_WIDTH * im.height / im.width)
    print(f"\n  Pegar en servicios.html (tarjeta de {slug}):\n")
    print(f'<img src="assets/img/servicio-{slug}-tarjeta-{CARD_WIDTH}.webp"'
          f'{srcset} width="{CARD_WIDTH}" height="{h}" '
          f'loading="lazy" decoding="async" alt="">\n')
    print("  Falta todavia el chequeo que no hace ningun script: mirar la "
          "imagen a 320px de ancho y confirmar los guardrails de DECISIONES.md\n"
          "  (sin texto ni UI, sin clonar el diseno de una marca, sin logos,\n"
          "   sin personas, paleta oscura + acento dorado).\n")


if __name__ == "__main__":
    main()
