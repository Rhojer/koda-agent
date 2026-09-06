---
name: draft-audit-and-revision
description: "Audit drafts. Show fixes before writing."
version: 1.0.0
author: Koda & DEScon
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [Writing, Revision, QA, Show-Before-Write, Draft, Audit]
    category: productivity
---

# Draft Audit & Revision

When the user hands you an already-written file (paragraph, chapter, document) and asks "revisa si está bien" / "qué está mal" / "corrige esto" / "sigue desde donde quedamos" — your job is to **audit first, propose second, write last**. Never start editing the file before the user has seen your diagnosis and approved the fix in plain text.

## When to Use

- User pastes prose or hands you a file and asks for review or correction.
- The task includes prior content that may contain errors (citations, figures, structure, attributions).
- The next action would modify a file in place (`write_file`, `patch`, `terminal` sed/awk).

Do NOT use when:
- Drafting from scratch with the user in the loop (use `thesis-grado` / `evidence-grounded-writing` or domain-specific skills).
- The user explicitly says "apply" / "write it" / "go ahead" referring to a proposal already shown in chat.

## The Iron Rule

```
NEVER WRITE TO DISK BEFORE SHOWING THE PROPOSAL IN CHAT AND GETTING EXPLICIT TEXTUAL APPROVAL
```

The user's "sí" / "ok" / "perfecto" in response to a diagnostic question is **not** the same as approving a file edit. A `clarify` choice that implies "I will rewrite the file once you pick option 1" is a footgun. If you suspect any ambiguity, spell it out: "If you choose A I will edit the file. If you only want to see the proposal, pick B."

## Procedure

### Phase 1 — Inventory (read-only)
1. Read the file the user brought. Note: paragraph count, block sequence (does it match the expected skeleton?), visible citations, visible figures.
2. Identify which sources back which claims, **without opening the source yet**.
3. Deliver a one-line summary: "We have N paragraphs covering blocks X, Y, Z. The following items need verification: [list]."

### Phase 2 — Verify (read-only against source files)
For each claim/citation in the draft:
- Extract the source text (`pdftotext -layout` for PDFs, `read_file` for local docs).
- Search the source for the exact figure or the named author.
- Classify each claim: ✓ verified / ✗ incorrect / ⚠️ matizable.
- For citations: confirm the author exists in the source's authorship line. Generic tags like `[Tesis X]`, `[Enfispo]`, `[Paper Y]` are NOT authors — replace with real surnames.

### Phase 3 — Diagnose (deliver in chat)
Produce, in this order, **before touching the file**:
1. **Mapa estructural** — qué párrafos existen y a qué fase pertenecen (problem statement, variables, instruments, antecedents, justification).
2. **Tabla de auditoría** — cifra del draft / ¿verificada? / fuente real / estado (OK / Reescribir / Cambiar cita / Eliminar).
3. **Lista de citas inválidas** — tags que no son nombres de autor humanos.
4. **Mezclas estructurales** — bloques que deberían estar en Justificación y están en Planteamiento (o viceversa).

### Phase 4 — Propose (deliver in chat)
For each fix:
- The proposed rewritten paragraph in full.
- A before/after diff or change list at the end.

Do NOT execute `write_file` or `patch` yet. End the message with: "Si te gusta, dime 'aplica' y lo escribo. Si no, ajustamos."

### Phase 5 — Apply (only on explicit textual approval)
Only when the user types something like:
- "aplica" / "escribe" / "hazlo" / "ok escribe" / "dale"
- Or responds with a concrete correction ("cambia X por Y y aplica")

Then run `write_file` / `patch` / `terminal` edit.

After writing, **show the resulting diff or first 30 lines** so the user can confirm. Never say "listo" without that evidence.

## Anti-patterns (footguns that broke this rule in past sessions)

- ❌ `clarify` with a recommended option that says "Rewrites the file when accepted". The acceptance semantics look like approval but the user was choosing among variants, not authorizing disk writes.
- ❌ "Te paso el texto corregido en el chat para que valides" as option B vs. "Rewrites the file directly" as option A — that's still implying option A auto-writes. Default to "show first, then write on approval".
- ❌ Editing the file in the same turn the user accepts a diagnostic — even if the proposal seems obvious.
- ❌ Saying "listo" after editing without showing the diff or a content excerpt.
- ❌ Treating the user's "sí" to "¿lo reescribo?" as consent when the proposal was not visible yet.

## Companion Skills
- For thesis / academic chapters: pair with `tesis-grado` and `evidence-grounded-writing` (user-owned). They handle the structural skeleton (Vancouver, paragraph length, macro→micro); this skill handles the audit-then-propose gate around them.

## Verification
After applying an edit, the deliverable must include:
- Path of the file touched.
- Diff excerpt (preferred: `diff` output or first/last 30 lines).
- Number of paragraphs and citations before/after.

If any of those are missing, the edit did not actually land. Re-read the file before claiming completion.

## Maintenance
If the user corrects how you handle a draft audit (e.g. "show me the citation before you change anything", "don't write to disk yet", "send the proposal in one message and wait"), patch this skill in the same turn.

Canonical path: `/root/.hermes/skills/productivity/draft-audit-and-revision/SKILL.md`. Do not create duplicates.