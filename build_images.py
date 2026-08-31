#!/usr/bin/env python3
"""Pipeline de imagenes de Nova Domus: Fotos/ (originales) -> assets/img/ (WebP web-ready).

Por cada original en --src (sin bajar a subcarpetas), genera WebP a 1440/960/640px
de ancho, aplica la orientacion EXIF y descarta toda la metadata (EXIF, GPS, ICC).
Escribe manifest.json en --out con las dimensiones y el peso de cada variante.

Uso:
    pip install pillow pillow-heif
    python build_images.py --src "C:/Users/agust/novadomus-web/Fotos" --out "C:/Users/agust/novadomus-web/assets/img"
"""

import argparse
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps

try:
    import pillow_heif
    pillow_heif.register_heif_opener()
except ImportError:
    pillow_heif = None

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".heic", ".heif"}
WIDTHS = [1440, 960, 640]
WEBP_QUALITY = 82
QUALITY_FLOOR = 55  # no bajar de aca aunque siga pesada
HEAVY_THRESHOLD_BYTES = 200 * 1024  # objetivo del 1440px; si se pasa, se reintenta con menos calidad


def slugify(stem: str) -> str:
    """Normaliza un nombre de archivo a slug. No-op para nombres ya prolijos
    (servicio-redes, obra-san-isidro, etc.) - es red de seguridad, no el
    criterio de nombrado (eso se define renombrando el original en Fotos/)."""
    slug = stem.strip().lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug


def load_image(path: Path) -> Image.Image:
    im = Image.open(path)
    im = ImageOps.exif_transpose(im)  # hornea la orientacion, despues se descarta el EXIF entero
    if im.mode != "RGB":
        im = im.convert("RGB")
    return im


def save_under_threshold(resized: Image.Image, out_path: Path, threshold: int) -> tuple[int, int]:
    """Guarda como WEBP; si supera el umbral, reintenta bajando calidad hasta
    QUALITY_FLOOR. Devuelve (bytes, calidad_usada)."""
    quality = WEBP_QUALITY
    while True:
        # Sin exif= ni icc_profile=: la variante sale sin metadata.
        resized.save(out_path, "WEBP", quality=quality, method=6)
        size = out_path.stat().st_size
        if size <= threshold or quality <= QUALITY_FLOOR:
            return size, quality
        quality -= 10


def make_variants(im: Image.Image, slug: str, out_dir: Path) -> dict:
    orig_w, orig_h = im.size
    variants = {}
    for target_w in WIDTHS:
        w = min(target_w, orig_w)
        if w != target_w:
            print(f"  (!) {slug}: original de {orig_w}px, no se agranda a {target_w}px -> se genero a {w}px")
        h = round(w * orig_h / orig_w)
        resized = im.resize((w, h), Image.LANCZOS)
        out_name = f"{slug}-{target_w}.webp"
        out_path = out_dir / out_name
        size, quality_used = save_under_threshold(resized, out_path, HEAVY_THRESHOLD_BYTES)
        if quality_used < WEBP_QUALITY:
            note = "bajo el umbral" if size <= HEAVY_THRESHOLD_BYTES else "sigue pesada, calidad minima"
            print(f"  (i) {slug}-{target_w}.webp: calidad {WEBP_QUALITY}->{quality_used} ({note}, {size / 1024:.0f} KB)")
        variants[str(target_w)] = {
            "file": out_name,
            "width": w,
            "height": h,
            "bytes": size,
        }
    return variants


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--src", default="Fotos", help="Carpeta con los originales (default: Fotos)")
    parser.add_argument("--out", default="assets/img", help="Carpeta de salida (default: assets/img)")
    args = parser.parse_args()

    src_dir = Path(args.src)
    out_dir = Path(args.out)

    if not src_dir.is_dir():
        print(f"ERROR: no existe la carpeta de origen: {src_dir}", file=sys.stderr)
        sys.exit(1)
    if pillow_heif is None:
        print("ERROR: falta pillow-heif. Instalá con: pip install pillow pillow-heif", file=sys.stderr)
        sys.exit(1)

    out_dir.mkdir(parents=True, exist_ok=True)

    manifest = {}
    heavy = []

    # Solo el nivel raiz de --src: subcarpetas como _descartadas/ o _sin_asignar/
    # quedan afuera del pipeline a proposito.
    files = sorted(p for p in src_dir.iterdir() if p.is_file())

    for path in files:
        ext = path.suffix.lower()
        if ext not in IMAGE_EXTS:
            print(f"  skip (no es imagen): {path.name}")
            continue

        slug = slugify(path.stem)
        try:
            im = load_image(path)
        except Exception as e:
            print(f"  ERROR procesando {path.name}: {e}", file=sys.stderr)
            continue

        variants = make_variants(im, slug, out_dir)
        manifest[slug] = {"source": path.name, "variants": variants}

        v1440 = variants.get("1440")
        if v1440 and v1440["bytes"] > HEAVY_THRESHOLD_BYTES:
            heavy.append((slug, v1440["bytes"]))

        print(f"OK {path.name} -> {slug} ({im.size[0]}x{im.size[1]})")

    manifest_path = out_dir / "manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print()
    print(f"{len(manifest)} originales procesados -> {out_dir}")
    print(f"manifest: {manifest_path} (no se commitea, es material de trabajo)")

    if heavy:
        print()
        print("Revisar - mas de 200 KB a 1440px:")
        for slug, size in sorted(heavy, key=lambda x: -x[1]):
            print(f"  {slug}-1440.webp: {size / 1024:.0f} KB  <-- PESADA")


if __name__ == "__main__":
    main()
