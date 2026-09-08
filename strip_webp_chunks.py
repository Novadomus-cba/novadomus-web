#!/usr/bin/env python3
"""Quita todo chunk que no sea de imagen de un WebP, sin recomprimir.

Reescribe el contenedor RIFF conservando unicamente los chunks de imagen
(VP8 / VP8L / VP8X + ALPH / ANIM / ANMF) y descartando metadata (EXIF, XMP,
C2PA, ICCP). El payload de imagen no se toca: es una operacion sin perdida.
"""
import sys
from pathlib import Path

KEEP = {"VP8 ", "VP8L", "VP8X", "ALPH", "ANIM", "ANMF"}

def chunks(b: bytes):
    i = 12
    while i + 8 <= len(b):
        cid = b[i:i+8-4].decode("latin1")
        size = int.from_bytes(b[i+4:i+8], "little")
        yield cid, b[i:i+8+size+(size & 1)], size
        i += 8 + size + (size & 1)

def strip(path: Path) -> tuple[bool, list, list]:
    b = path.read_bytes()
    if b[:4] != b"RIFF" or b[8:12] != b"WEBP":
        raise ValueError(f"{path.name}: no es un WebP RIFF")
    kept, dropped, out = [], [], b""
    for cid, raw, _ in chunks(b):
        (kept if cid in KEEP else dropped).append(cid)
        if cid in KEEP:
            out += raw
    if not dropped:
        return False, kept, dropped
    new = b"RIFF" + (len(out) + 4).to_bytes(4, "little") + b"WEBP" + out
    path.write_bytes(new)
    return True, kept, dropped

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("uso: python strip_webp_chunks.py <archivo.webp> [...]")
    for arg in sys.argv[1:]:
        p = Path(arg)
        changed, kept, dropped = strip(p)
        s = p.stat().st_size
        if changed:
            print(f"{p.name}: quitados {dropped} -> quedan {kept}  {s:,} B")
        else:
            print(f"{p.name}: ya estaba limpio {kept}  {s:,} B")
