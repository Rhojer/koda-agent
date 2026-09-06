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

## Long-session survival: prevent context-overflow auto-reset

Evidence-traced writing sessions routinely exceed the model's
context window because they accumulate: full PDF reads, citation
card lookups, long draft files, and citation verification output.
Two distinct interruption modes:

| Mode | Trigger | User-visible message |
|---|---|---|
| **Context overflow** | Tokens cross window; lossy compressor can't shrink further | `Context length exceeded (N tokens). Cannot compress further. Session auto-reset…` |
| **Network mid-stream cut** | Provider drops the connection while streaming a response | `The previous response was cut off by a network error mid-stream. Continue exactly where you left off.` |

The mitigation discipline (validated in real thesis sessions, 2026-09):

1. **Maintain a `checkpoint.md` in the workspace.** Plain markdown,
   human-readable, updated at the end of every productive turn
   with: current draft state, last verified card, pending
   decisions, working agreements. Without this file a reset
   destroys hours of in-progress work; with it, the next session
   resumes in one read.
2. **Focal PDF reads, never whole.** Use `pdftotext -f N -l N` or
   `search_files` with a regex. Reading a 50-page PDF whole is
   roughly the cost of 4–5 full responses; a regex for `43,7%`
   over the same PDF costs ~1% and lands the answer.
3. **Drafts on disk, not in chat.** The .txt is the source of
   truth. Chat messages are working memory. Showing long drafts in
   chat burns context on every follow-up turn.
4. **One task per turn.** "Write the next paragraph" is one task.
   Adding citation audit + checkpoint update to the same turn
   dumps all three results back into context simultaneously.
5. **Tune `compression.*` early.** Default `threshold: 0.5` is
   conservative. For long sessions, lower to `0.3` and raise
   `protect_last_n` to 30. Inspect with `hermes config get compression`.
6. **Prefer paid/stable models for long sessions.** `:free` model
   suffixes (e.g. `liquid/lfm-2.5-2.6b:free`) are the most common
   cause of the mid-stream network reset — aggressive rate limits
   cut responses without warning.

The full recipe with copy-pasteable snippets lives in
`references/long-session-survival.md`.

## Verify user-suggested configs before applying

When the user (or a tutorial) proposes a `config.yaml` change, look
it up before running `hermes config set`. Several "official-looking"
options are actually third-party plugins.

**Verification procedure:**

```bash
# 1. Does the key exist in the running schema?
hermes config get <key.path>

# 2. If it does, what are the legal values?
hermes config show | grep -A 5 "<key.path>"

# 3. If it doesn't, is it a plugin reference?
grep -r "<value>" /root/.hermes/skills/ 2>/dev/null
```

**Real example (2026-09):** user proposed
`context.engine: "lcm"` thinking it was a built-in lossless
compressor. Verification returned `null` for `context.engine` — the
correct answer is that `lcm` is a third-party plugin (`hermes-lcm`
on PyPI) requiring a separate install and
`plugins.enabled: hermes-lcm`. Without all three, the change breaks
context handling silently.

The verify-first check and the full decision tree live in
`references/verify-config-changes.md`.
