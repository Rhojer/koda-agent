---
name: evidence-grounded-writing
description: "Use for thesis or academic text where every statistical claim must be backed by an exact figure extracted from a local workspace PDF — no assumptions, no internet-only claims for the core content."
version: 2.0.0
author: Koda & DEScon
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [Thesis, Academic, Statistics, Grounding, Evidence, Zero-Assumption]
    category: research
---

# Evidence-Grounded Thesis Writing

## When to Use
Use when drafting any academic chapter that contains epidemiological data, percentages, ranges or clinical figures that must be sourced exclusively from PDFs already present in the local workspace (`/root/.hermes/workspace_compartido/` or the active project folder).

## Core Rules
1. **Zero Empty Rhetoric:** Never write vague claims like "diversos estudios muestran" without a bracketed author. Every figure must come with an exact percentage or range and its source.
2. **Strict Document Grounding:** All epidemiological numbers (percentages, prevalences, ranges) must originate directly from a shared workspace PDF. If a figure is not found in any local PDF, do NOT include it.
3. **Continuous Flow:** Paragraphs strictly between 5 and 11 lines. Zero subheadings inside the introduction or theoretical chapters.
4. **Bracketed Citations (Vancouver variant):** Use `[Author]` only — no numbers, no commas, no parentheses, no page numbers in the citation. Multiple sources in one idea separated by `;`: `[Autor1; Autor2]`.
5. **Macro-to-Micro Problem Framing:** In the problem statement (planteamiento), strictly describe the problematic reality from global → regional → local contexts (epidemiology, physiological limitations, clinical consequences). Never drift into justification, benefits of the study, or social relevance — those belong to the Justification section.
6. **No Internet Substitution:** Never replace a missing local PDF with an invented or web-only statistic for the core thesis content. Internet searches are reserved for verifying URLs/DOIs during the antecedente scouting phase, never as a data source for the body text.
7. **Antecedentes Metadata Rule:** When scouting antecedentes, record the public URL or DOI as search metadata. Once a paper is downloaded into the workspace, cite it from the local file — the URL does not need to be repeated in the body text.

## Verification Workflow (per paragraph)
1. Identify the claim that needs a statistic.
2. Search the workspace PDFs for an exact figure that supports it.
3. If found → include with `[Author]` citation.
4. If not found → do NOT include the claim. Report to the user that the figure is missing and suggest next steps (which PDF to review, which section of which PDF, or whether to drop the claim).
5. Count the lines of the paragraph. If outside 5-11, split or merge with neighbours.

## Anti-patterns
- ❌ Invented prevalences like "aproximadamente un 80%" without a local source.
- ❌ Citing `[1]` style Vancouver with numbers in the body.
- ❌ Subheadings inside the introduction.
- ❌ Paragraphs of 1-4 lines or 12+ lines.
- ❌ Mixing problem description with study justification in the same paragraph.

## Maintenance
This skill is critical. If the user corrects any writing behaviour during a session, patch this skill in the same turn so the rule persists.

**Canonical path:** `/root/.hermes/skills/user_skills/research/evidence-grounded-writing/SKILL.md`. Do not create duplicates in nested paths.