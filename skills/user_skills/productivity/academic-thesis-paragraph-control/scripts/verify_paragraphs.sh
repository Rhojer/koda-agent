#!/usr/bin/env bash
# verify_paragraphs.sh — verify that every paragraph in a text file
# falls within a lines-at-80-cols range (default 5-11).
#
# Usage:
#   bash verify_paragraphs.sh /path/to/chapter.txt [WIDTH] [MAX] [MIN]
#
# Defaults: WIDTH=80, MAX=11, MIN=5
#
# Exit codes:
#   0 = all paragraphs in range
#   1 = one or more paragraphs out of range, or file unreadable
#
# Output: one line per paragraph + a final summary.

set -u

FILE="${1:-}"
WIDTH="${2:-80}"
MAX="${3:-11}"
MIN="${4:-5}"

if [[ -z "$FILE" ]]; then
  echo "Usage: $0 FILE [WIDTH=80] [MAX=11] [MIN=5]" >&2
  exit 1
fi

if [[ ! -f "$FILE" ]]; then
  echo "File not found: $FILE" >&2
  exit 1
fi

# Use python3 (always present on linux/macOS/git-bash) — avoids an awk portability landmine
python3 - "$FILE" "$WIDTH" "$MAX" "$MIN" <<'PYEOF'
import sys, math
path, width, maxl, minl = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
with open(path, "r", encoding="utf-8") as f:
    texto = f.read()
# Normalize line endings and split on blank-line paragraph boundaries
texto = texto.replace("\r\n", "\n")
parrafos = [p.strip() for p in texto.split("\n\n") if p.strip()]

print(f"File: {path}")
print(f"Paragraphs: {len(parrafos)}  |  Width: {width} cols  |  Range: {minl}-{maxl} lines")
print("=" * 72)

all_ok = True
for i, p in enumerate(parrafos, 1):
    chars = len(p)
    palabras = len(p.split())
    lineas = math.ceil(chars / width)
    ok = minl <= lineas <= maxl
    if not ok:
        all_ok = False
    icono = "✅" if ok else "⚠️"
    print(f"{icono} P{i}: {palabras} pal · {chars} chars · ~{lineas} líneas")

print("=" * 72)
if all_ok:
    print(f"RESULTADO: ✅ Todos los párrafos en rango {minl}-{maxl}")
    sys.exit(0)
else:
    print(f"RESULTADO: ⚠️ Hay párrafos fuera de rango {minl}-{maxl}")
    sys.exit(1)
PYEOF