# Post-Write Citation Audit (real-session patterns)

## Why a paragraph can be both "rule-compliant" and wrong

A draft can pass the 5-11 line check, have no subtitle, use `[Autor]` everywhere, and still be factually incorrect. The verification loop in `scripts/verify_paragraphs.sh` checks **layout**. It does not check **provenance**.

## Two failure modes caught in production

### 1. Ghost citation

The author in `[López González]` is cited, but no PDF in the workspace contains "López González" anywhere. The paragraph reads well, but the citation is unverifiable.

**Detection:** extract every `[Autor]` from the draft, then search each PDF (text-extracted via `pdftotext -layout`) for any of them. Any author with zero hits is a ghost.

### 2. Misattributed statistic

The author exists, but the number attributed to them is from a different source. Example from a real session:

- Source (Vega Ruiz, p.15): "los trastornos hemorrágicos **afectaron al** 43,7%" of MME patients.
- Draft: "los trastornos hemorrágicos **explican hasta el** 43,7%" of MME cases.

The percentage matches. The verb changed from passive ("afectaron") to active ("explican"), changing the meaning from "observed in 43.7%" to "account for 43.7%". A strict evaluator catches this.

## The audit loop (system-only, no extra packages)

```bash
# 1. Extract distinct [Autor] tags from the draft
grep -oE '\[[A-ZÁÉÍÓÚÑ][A-Za-záéíóúñÁÉÍÓÚÑ -]+\]' chapter.txt | sort -u
```

```python
# 2. Search each workspace PDF for each author + each statistic
import subprocess, os, re

PDFS_DIR = "/path/to/workspace"
autores = ["López González", "Vega Ruiz"]          # fill from step 1
stats = ["25%", "30%", "43,7%", "90%", "1,13", "72,5", "1,25", "90,4", "1,000", "1,500", "2,000", "2,500"]

for pdf in sorted(os.listdir(PDFS_DIR)):
    if not pdf.lower().endswith(".pdf"): continue
    ruta = os.path.join(PDFS_DIR, pdf)
    r = subprocess.run(["pdftotext", "-layout", ruta, "-"], capture_output=True, text=True)
    paginas = r.stdout.split("\f")
    for n_pag, contenido in enumerate(paginas, 1):
        for autor in autores:
            if autor in contenido:
                # Find a line containing this author for evidence
                for linea in contenido.split("\n"):
                    if autor in linea:
                        print(f"  ✅ {pdf} p.{n_pag} ({autor}): {linea.strip()[:100]}")
                        break
```

## Per-statistic verification

For every number in the draft (%, ml, AUC, mmHg, lpm, hours, days), search in BOTH decimal forms:

| Comma form | Point form |
|---|---|
| "1,000 ml" | "1.000 ml" |
| "43,7%" | "43.7%" |
| "AUC 72,5%" | "AUC 72.5%" |

Spanish-language theses predominantly use commas. If your search with the period form returns nothing, immediately retry with the comma form before declaring a citation unverified.

## Citation-output template for the user reply

When you report a verified citation, give the user the **page number** and **the exact line of evidence** so they can spot-check without re-reading the whole PDF:

```
✅ López González — 90% atonía/útero sobredistendido
   p.7: "...Tono (atonía uterina);..."
   p.9, p.15, p.18, p.41, p.54 (additional mentions)
```

Multi-page occurrences are normal — the author is the framework, and the exact statistic only needs ONE supporting page to be defensible. Report the page that contains the exact number, not just any mention.

## When to refuse to deliver

Refuse to deliver the file if:
- ANY `[Autor]` tag has zero hits across the workspace PDFs.
- ANY number (%, ml, AUC) in the draft has zero hits in BOTH comma and point forms.
- Any cited statistic requires paraphrasing the source's verb (see main SKILL.md "Interpreting vs transcribing").

In each case, surface the problem to the user with the offending citation/number, and propose either dropping it or sourcing it differently. Do not silently ship.