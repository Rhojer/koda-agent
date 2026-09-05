---
name: academic-thesis-paragraph-control
description: "Use for paragraph-length-bound academic prose (Vancouver)."
version: 1.0.0
author: Koda
license: MIT
metadata:
  hermes:
    tags: [Thesis, Academic, Paragraphs, Layout, Vancouver, PPTX, Fallback]
    category: productivity
---

# Academic Thesis Paragraph Control

A class-level umbrella for one of the most failure-prone moments in thesis writing: keeping paragraphs inside the user's hard length envelope (typically **5 to 11 lines**) without losing verifiable data, and adapting when the workspace contains a maquette or template in a non-PDF format (PowerPoint, Word) instead of a PDF.

## When to Use

- The user has stated a paragraph-length rule (e.g. "5-11 líneas", "8-12 sentences") and a citation style (typically Vancouver `[Autor]`).
- You are drafting or auditing any chapter (introducción, marco teórico, antecedentes, justificación, discusión).
- The user gave you a maquette/blueprint in `.pptx` or `.docx` and you must align the draft to its structural choices (objetivos enumerados, variables operacionalizadas, criterios de inclusión/exclusión).
- You need to decide: shorten the prose vs split the paragraph when one overshoots.

## Core Principles

1. **Never count lines visually or by paragraph length alone.** Use a deterministic measure: characters at a fixed column width (80 cols is the de-facto A4 standard). Then `ceil(chars / 80)` = visual lines.
2. **When a paragraph is too long, split — do not trim.** Trimming sacrifices verifiable data and the user will reject it. Splitting preserves every `[Autor]` citation and keeps the [Author]–statistic adjacency intact.
3. **The split point is usually the natural sub-idea boundary.** If the paragraph describes two sub-claims (e.g. "clasificación por clases" + "regla de los 30"), those are already separate paragraphs waiting to happen.
4. **The split must produce two paragraphs that BOTH fall in the 5-11 range.** If a split leaves one at 4 lines, merge with the neighbour or add one more sentence. Re-verify mathematically after every split.
5. **Audit any output before declaring it done.** A draft that "looks right" is not verified. The verification script in `scripts/` must pass.

## Decision Tree (paragraph overshoots)

```
paragraph > 11 lines at 80 cols?
├── Contains two or more clearly separable sub-claims?  → YES → split at boundary, re-verify
├── Single tight argument but with sub-examples?         → split the example out as a new paragraph
└── One inseparable argument?                            → tighten prose, never drop a citation
                                                          → if tightening still overshoots,
                                                            warn the user and propose dropping
                                                            the lowest-priority example
```

## The Verification Loop (mandatory)

Run after every write/patch:

```bash
bash scripts/verify_paragraphs.sh /path/to/chapter.txt 80 11 5
```

Or the inline Python equivalent:

```python
texto = open(path).read()
parrafos = [p.strip() for p in texto.split("\n\n") if p.strip()]
ANCHO = 80; MAX = 11; MIN = 5
for i, p in enumerate(parrafos, 1):
    lineas = -(-len(p) // ANCHO)
    ok = MIN <= lineas <= MAX
    print(f"{'✅' if ok else '⚠️'} P{i}: {len(p.split())} pal · ~{lineas} líneas")
```

If ANY paragraph fails, do not deliver. Split/merge and re-run until all pass.

## Handling .pptx / .docx Sources

The user's thesis blueprint often arrives as a `.pptx` maquette (5-7 slides covering portada, objetivos, metodología, instrumento, operacionalización). Do **not** require `python-pptx` — installation is a forbidden action in this environment. Use the **system-only fallback** in `references/extract-pptx-without-python-pptx.md` instead.

## Anti-Patterns

- ❌ Counting lines by paragraph length alone (a 900-char paragraph at 80 cols is 12 lines, not "1 paragraph = 1 line").
- ❌ Visually inspecting a write_file output and declaring "OK" without re-reading with `read_file` + math.
- ❌ Trimming a paragraph to fit 5-11 lines and silently losing a `[Autor]` citation.
- ❌ Mixing "split into more paragraphs" with "merge into one" — pick one operation per turn.
- ❌ Trying `pip install python-pptx` when the environment blocks it (the user has a standing no-install policy).
- ❌ Inventing operationalization details not present in the maquette (variables, criterios de inclusión) — copy from the slide, do not paraphrase from memory.

## Workflow

1. Extract maquette content with the system-only fallback (see references/).
2. Align the draft's variables, objetivos numerados, criterios de inclusión with the maquette **verbatim**, in the order they appear on the slide (with the user's correction on numbering if any).
3. Draft paragraph by paragraph. After each one, run the verification script.
4. When overshooting, apply the decision tree above.
5. Before delivering the file, run `verify_paragraphs.sh` on the full file and include the output in your reply as evidence.

## Post-Writing Citation Verification (mandatory after every draft)

A paragraph that satisfies the 5-11 rule can still be **wrong** if a `[Autor]` citation doesn't actually exist in any PDF or if the cited statistic doesn't match what the source says. Two failure modes discovered in real sessions:

1. **Ghost citations** — the author doesn't appear in any workspace PDF.
2. **Misattributed statistics** — the author exists, but the exact number (%, ml, AUC) is from a different source.

After any write/patch that introduces `[Autor]` citations, run the citation audit loop:

```bash
# 1. Extract every distinct [Autor] used in the draft
grep -oE '\[[A-ZÁÉÍÓÚÑ][A-Za-záéíóúñÁÉÍÓÚÑ -]+\]' chapter.txt | sort -u > citas_usadas.txt

# 2. For each, search every PDF in the workspace (uses pdftotext layout)
for pdf in /path/to/workspace/*.pdf; do
    pdftotext -layout "$pdf" - | grep -l -i "<Autor>"
done
```

Or the inline Python equivalent (returns the page number where the citation first appears):

```python
import subprocess, os, re
PDFS_DIR = "/path/to/workspace"
autores = ["López González", "Vega Ruiz", "Rivas-Perdomo"]
for pdf in os.listdir(PDFS_DIR):
    if not pdf.endswith(".pdf"): continue
    r = subprocess.run(["pdftotext","-layout", os.path.join(PDFS_DIR,pdf), "-"],
                       capture_output=True, text=True)
    paginas = r.stdout.split("\f")
    for n, contenido in enumerate(paginas, 1):
        for a in autores:
            if a in contenido:
                print(f"  {pdf} p.{n}: {a}")
```

Then for each statistic in the draft (%, ml, AUC, mmHg, lpm) do a **separate** search using **both** decimal separators (comma AND point) — many Spanish-language sources write "1,000 ml" not "1.000 ml".

## Common pitfalls when reading the draft back

- **`read_file` output is line-numbered**: it returns `"LINE_NUM|CONTENT"` per line. A naive `content.split("\n\n")` fails because every line carries a numeric prefix and a `|`. Strip the prefix before splitting:

  ```python
  raw = read_file(path).content
  lineas = raw.split("\n")
  limpio = "\n".join(l.split("|", 1)[1] if "|" in l else l for l in lineas)
  parrafos = [p.strip() for p in limpio.split("\n\n") if p.strip()]
  ```

- **`write_file`'s "verified: true" ≠ rule compliance**: it confirms the bytes landed, not that paragraphs are 5-11 lines or that citations are correct. Always re-run `verify_paragraphs.sh`.

- **Decimal separator trap**: Spanish sources usually use comma ("1,000 ml", "43,7%"). If your search with the period version returns nothing, retry with comma. Same for AUC decimals ("72,5" vs "72.5").

## Interpreting vs transcribing citations

When the source says "X **affected** 43.7% of patients" and you write "X **explained** 43.7% of cases", that's a **factual** reframe even if the number matches. Strict evaluators will mark it. Rule: transcribe the source's verb, not paraphrase it. If the paraphrase is structurally necessary (e.g. you need a transitive verb for the sentence), propose the change to the user before writing.

## Maintenance

Patch this skill whenever the user tightens the length envelope, changes the citation style, or adds a new maquette format. Reference: `tesis-grado` and `evidence-grounded-writing` cover the higher-level thesis rules — this skill is the layout/format companion.

**Canonical path:** `/root/.hermes/skills/productivity/academic-thesis-paragraph-control/SKILL.md`