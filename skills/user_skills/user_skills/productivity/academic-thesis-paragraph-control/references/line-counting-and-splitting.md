# Line-counting and Splitting for Paragraph-length Rules

## Why "paragraphs between 5 and 11 lines" is ambiguous

"Lines" can mean:

1. **Physical lines in the source file** (`\n`-separated). A paragraph written as one block is 1 physical line. This is meaningless for the rule.
2. **Visual lines on a printed/rendered A4 page** at the user's font and margin settings.
3. **Characters ÷ columns**, i.e. characters per "line" assuming a fixed column width.

For thesis writing the operative measure is **(3)** with **80 columns** as the proxy. This matches Word/Writer default at body text size (Times New Roman 12pt, 1.5 spacing, default margins). The user's rule of "5-11 líneas" maps cleanly to `ceil(chars / 80) ∈ [5, 11]`.

## The 80-column proxy

| Paragraph length (chars) | Visual lines @ 80 cols |
|---------------------------|------------------------|
| 400                       | 5                      |
| 560                       | 7                      |
| 720                       | 9                      |
| 800                       | 10                     |
| 880                       | 11                     |
| 960                       | 12 (overshoots)        |
| 1000                      | 13 (overshoots)        |

## Implementation: pure shell (no python-pptx, no python at all)

A bash one-liner that prints per-paragraph line count:

```bash
awk 'BEGIN{RS="\n\n"; WIDTH=80; MIN=5; MAX=11}
     NF>0 {
       n=length($0); lines=int((n+WIDTH-1)/WIDTH);
       status=(lines>=MIN && lines<=MAX) ? "OK " : "BAD";
       printf "%s P%d: %d chars · ~%d lines · %d words\n",
              status, NR, n, lines, NF
     }' /path/to/chapter.txt
```

Caveat: `awk` `NF` counts whitespace-separated tokens and `length` counts characters of the record. This works for paragraphs separated by `\n\n`.

## Implementation: Python (more robust)

```python
texto = open(path).read()
parrafos = [p.strip() for p in texto.split("\n\n") if p.strip()]
ANCHO, MIN, MAX = 80, 5, 11
for i, p in enumerate(parrafos, 1):
    lineas = -(-len(p) // ANCHO)        # ceil division
    ok = MIN <= lineas <= MAX
    print(f"{'✅' if ok else '⚠️'} P{i}: {len(p.split())} pal · {len(p)} chars · ~{lineas} líneas")
```

This is what the companion script `scripts/verify_paragraphs.sh` runs.

## Splitting rules (when a paragraph overshoots)

1. **Find the natural sub-claim boundary.** Common patterns:
   - "X. Además, Y." → split between X and Y if Y is its own idea.
   - "X según [Autor1]; Y según [Autor2]." → keep both citations with their respective claims.
   - "X (definición) + Y (clasificación/regla paralela)" → split.
2. **Each new paragraph must independently fall in 5-11 lines.** If splitting leaves a 4-line orphan, **add one supporting sentence** (with its own `[Autor]` if needed) rather than merging back.
3. **Never split a citation from the claim it backs.** If `[Autor]` references a specific statistic in the middle of the paragraph, the split point must not fall between the statistic and the citation.
4. **Preserve all data verbatim.** Numbers, percentages, AUC, IC, classes, ml, mmHg — copy exactly. The split must not introduce typos in the verifiable data.

## Worked example (from a real session)

Before:
> One ~12-line paragraph that bundles "clasificación por clases (I-IV)" + "regla de los 30". Both are parallel clinical tools, both are cited to `[López González]`.

After:
- Paragraph 4 (74 words, ~6 lines): "Clasificación I-IV… facilita la toma de decisiones oportunas en el equipo médico." — closes with `[López González]`.
- Paragraph 5 (98 words, ~8 lines): "La regla de los 30… Su aplicación conjunta con el índice de choque refuerza la detección temprana de hipoperfusión en la paciente obstétrica." — closes with `[López González]`.

Both within range, all data preserved, both citations intact.

## Anti-patterns in the verification step

- ❌ Trusting `write_file`'s "verified: true" as a guarantee that content matches the user's intent. It only confirms the bytes landed on disk; it does **not** parse paragraphs or check rules.
- ❌ Counting `\n` characters in the file and assuming each is a "line" of prose. A single paragraph has 0 internal `\n`s in a clean write.
- ❌ Skipping the verification step because "the previous turn was clean". Re-verify every write; even a small patch can shift a paragraph across the boundary.