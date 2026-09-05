---
name: evidence-traced-writing
description: Use when writing academic text where every statistic must be auditable. Triggers on theses, monographs, research papers, systematic reviews, or any document that needs citations tied to exact page numbers in local PDFs.
---

# Evidence-Traced Writing

A workflow for academic writing where **every statistic in the text is tied to a specific page in a local PDF**, with a self-validating system that catches errors before delivery.

## When to use

- Theses (pregrado, posgrado, maestrías, doctorados)
- Monographs and research papers
- Systematic reviews and meta-analyses
- Any document with Vancouver/APA/ISO citations and exact data points (percentages, p-values, AUC, etc.)

## When NOT to use

- Opinion pieces, blog posts, or creative writing
- Documents based on web research (this skill assumes **local PDFs**)
- Documents with fewer than 5 citable facts (overhead exceeds benefit)

## The system (3 components)

### 1. Citation Cards (JSONL)

One card per verifiable fact. Schema:

```json
{
  "id": "L1",                          // unique short ID, prefix = author
  "autor_corto": "López González",      // how it appears in [brackets]
  "autor_largo": "Full Name",
  "archivo_pdf": "exact_filename.pdf",
  "pagina": 5,                          // exact page number
  "dato_en_borrador": "short label",    // what claim it supports
  "tipo": "estadistica|definicion|rango_normal|clasificacion|regla_clinica|fisiologia",
  "match_type": "exacto|paráfrasis",
  "confidence": "alta|media|baja",
  "quote_exact": "verbatim text from PDF, with original Unicode",
  "contexto_adicional": "optional notes",
  "last_verified": "YYYY-MM-DD"
}
```

**ID conventions:** `L` = López, `V` = Vega, `R` = Rivas. Add prefixes as your author list grows.

### 2. Inline markers in the .txt

Inside the writing file, mark every data point with its card ID:

```text
La hemorragia obstétrica representa entre el 25% y 30% de las muertes
maternas {{L1:25-30%}}[López González].
```

`{{L1:25-30%}}` is invisible in printed output (strip it before delivery). Its only job is to make the card lookup instantaneous.

### 3. Validation script

`scripts/validate_citations.py` with three modes:

| Command | What it does |
|---|---|
| `python3 validate_citations.py check` | Audits every `{{XX}}` in the .txt, finds its card, opens the PDF page, verifies the quote is there. Reports errors (0 = safe to deliver) and warnings. |
| `python3 validate_citations.py strip-marks` | Removes all `{{XX:...}}` markers, saves a clean .txt ready for the tutor. |
| `python3 validate_citations.py report` | Markdown report of all cards, with "✅ in use" / "⚪ orphan" status. |

The script **must** handle Unicode quirks: collapse duplicated combining tildes (a common OCR artifact in Spanish PDFs), normalize to NFC, and tolerate whitespace differences. Sample normalization function:

```python
import unicodedata, re
def _norm(s):
    s = unicodedata.normalize("NFC", s)
    return re.sub("\u0301\u0301+", "\u0301", s)
```

## Workflow (the discipline)

For **every** data point you add to the text:

1. **Search** the source PDF for the exact statistic. Use `pdftotext -layout -f N -l N file.pdf -` to extract one page at a time.
2. **Copy** the verbatim text into the `quote_exact` field of a new card. **Do not paraphrase** — preserve original Unicode (especially tildes, accents, ≥ signs, Spanish decimal commas).
3. **Place** an inline marker `{{CardID:short_label}}` right next to the statistic in the .txt.
4. **Cite** in Vancouver format: `[Apellido]` or `[Apellido1 y Apellido2]`.
5. **Run** `python3 validate_citations.py check`. If errors appear, fix the card or the text — never the script.

## Common pitfalls

1. **OCR double-tildes**: Spanish PDFs often have `o\u0301\u0301` instead of `o\u0301` (e.g. `asoció` rendered as `asoció́`). The script must collapse them. Verify with byte-level comparison before claiming the quote is wrong.
2. **Decimal notation**: Spanish sources use `43,7%` (comma), English use `43.7%` (period). Search with both.
3. **Quote length**: Long quotes split across multiple visual lines in the PDF. Store only the first line in `quote_exact` and document the rest in `contexto_adicional` or use `quote_exact_l2`, `quote_exact_l3` keys.
4. **Card vs marker drift**: A card can become orphan (defined but unused) or a marker can lose its card. The `check` mode reports both. Treat orphans as a signal to either reference the card or delete it.
5. **Semantic accuracy ≠ literal accuracy**: A card may "match" the PDF byte-for-byte but the **interpretation** in your text can be wrong. The validator catches the first; you must catch the second by re-reading the source paragraph.

## Files this skill produces

```
workspace_compartido/
├── citation_cards.jsonl          # one card per line
├── avance_introduccion_completo.txt   # text with inline {{XX}} markers
├── scripts/
│   └── validate_citations.py     # the validator
└── .citation_logs/
    ├── audit_YYYYMMDD_HHMMSS.md  # one per check run
    └── report_YYYYMMDD_HHMMSS.md # one per report run
```

## Integration with other skills

- **`evidence-grounded-writing`** (user_skills): the macro rule ("never invent data"). This skill is the **mechanism** that enforces it.
- **`draft-audit-and-revision`**: run `validate_citations.py check` as part of every audit cycle.
- **`academic-thesis-paragraph-control`**: this skill provides the data; the paragraph skill enforces 5-11 lines and Vancouver formatting.

## Self-test (run after setup)

1. Create 2 cards pointing to known facts in your PDFs.
2. Write 2 paragraphs with `{{XX}}` markers and Vancouver citations.
3. Run `check` — expect 0 errors.
4. Edit one card's page number to a wrong one — run `check` — expect 1 error pointing to the bad card.
5. Run `strip-marks` — verify the .txt output has no `{{}}` and is paragraph-valid.
6. Delete the output and rerun — confirm idempotency.
