# Reading .pptx without python-pptx (system-tools-only fallback)

## When this applies

- `python-pptx` is not installed in the sandbox (the active kernel) and **the user has a standing no-install policy** (`pip install …` is rejected by the safety guard as a destructive system-modifying action).
- You need to **read** a thesis maquette, blueprint, or any small `.pptx` (typically 5-20 slides of plain text) to extract:
  - Portada (title, author, tutor)
  - Objetivos (general + específicos, in slide order)
  - Metodología (tipo de estudio, población, muestra, criterios de inclusión/exclusión, técnica, instrumento, análisis)
  - Operacionalización de variables (definition, scale, categories)

You do **not** need to render images, charts, or speaker notes for this use case.

## Recipe (works on every Linux with `unzip` + standard text utils)

```bash
mkdir -p /tmp/pptx_extract
cd /tmp/pptx_extract
unzip -o "/path/to/file.pptx" > /dev/null
# Slide XML files live at ppt/slides/slideN.xml
ls ppt/slides/

# Plain-text extraction (strip XML tags, collapse whitespace):
for f in ppt/slides/slide*.xml; do
  echo "=========================="
  echo "FILE: $f"
  echo "=========================="
  sed -E 's/<[^>]+>/ /g; s/  +/ /g; s/^ //; s/ $//' "$f" \
    | grep -v '^$' \
    | head -80
done
```

## What you get

For a thesis maquette of 5-7 slides, this dump typically yields 60-150 lines of plain text across all slides, with:

- Title and author from slide 1
- Objectives from slide 2 (read top-to-bottom, preserving enumeration order)
- Methodology from slide 3
- Instrument header from slide 4
- Operationalization from slide 5

## What you LOSE vs python-pptx

- **Formatting** (bold, italic, font, color, alignment) — irrelevant for content extraction
- **Tables** — they appear as concatenated cell text separated by `|` or just space; readable but lossy
- **Images** — not extracted (the dump prints `[IMAGEN]` placeholders if you also grep for shape type 13, but for a maquette the images are usually logos)
- **Charts** — not extracted (raw XML is unreadable for chart data without python-pptx or xlrd)
- **Speaker notes** — accessible via `ppt/notesSlides/notesSlideN.xml` with the same recipe if needed

For thesis-blueprint extraction (the use case that triggered this fallback), none of those losses matter.

## Why this works

A `.pptx` is a ZIP archive of XML files in the OOXML format. `unzip` ships with every Linux/macOS/Windows Git-Bash install. `sed` is POSIX-standard. The text content of each slide lives in `ppt/slides/slideN.xml` interleaved with `<a:t>` tags; stripping all XML tags with `sed 's/<[^>]+>/ /g'` leaves the human-readable text in reading order. Adjacent runs of whitespace collapse with `s/  +/ /g`.

## When to escalate

If the maquette has **embedded tables with multi-row layout** that the simple dump mangles, or **charts with category data you must extract verbatim**, escalate by:

1. Asking the user to grant a one-time install of `python-pptx` (they may approve in that session, or via `hermes skills install python-pptx`).
2. Or asking the user to **paste the relevant slide content directly** into chat — for a 5-slide maquette this is usually faster than tooling escalation.

Do **not** silently fall back to web search; the user's thesis rules ban internet substitution for content.

## Cross-references

- Companion skill: `powerpoint` (covers python-pptx workflows; use only when the dependency is acceptable)
- This file lives at: `references/extract-pptx-without-python-pptx.md`