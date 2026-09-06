# Long-Session Survival for Evidence-Traced Writing

Recovery recipe for evidence-traced writing sessions that run long
enough to hit a context-overflow auto-reset or a network mid-stream
cut. Validated in thesis-writing sessions, 2026-09.

## The two reset modes (and why both look the same to the user)

| Mode | Trigger | User-visible message |
|---|---|---|
| **Context overflow** | Accumulated tokens (PDF reads + draft + chat history) cross the model's window; lossy compressor can't shrink further | `Context length exceeded (N tokens). Cannot compress further. Session auto-reset — your next message will start a fresh session.` |
| **Network mid-stream cut** | Provider drops the connection while streaming a response | `The previous response was cut off by a network error mid-stream. Continue exactly where you left off.` |

Both look identical to the user: "the system reset, we lost the
thread." Both are recoverable **only** if the project has an external
checkpoint the next session can read on resume. Without one, the next
session starts with zero memory of what was just done.

## The checkpoint pattern (the entire safety net)

A single file in the workspace, updated at the end of every
productive turn, is all you need.

**Path:** `<workspace>/checkpoint.md`

**Required sections** (keep this order — the next session's first
read relies on it):

```markdown
# <Project name> — Checkpoint
**Last updated:** YYYY-MM-DD

## Estado actual
- Chapter/section in progress: <path to draft file>
- Last verified statistic: <card_id> = "<quote>" (source: <file.pdf>, p. N)
- Last paragraph written: para N of file X
- Line count: <N lines / N-M range>

## Verified facts ledger (citation cards in use)
- L1: "<exact quote>" — source: <file.pdf>, p. N — verified YYYY-MM-DD
- L2: ...
- (V, R, M, etc. as needed)

## Pending decisions
- <Decision>: <options, leaning toward>

## Working agreements (do not violate without asking)
- Read PDFs by page range only — never whole.
- Drafts on disk, not in chat.
- One task per turn.
- Update this checkpoint at the END of every productive turn.
```

**Update cadence:** end of every productive turn, even if the turn
was "just a small edit." The cost of one extra write is trivial; the
cost of losing 30 minutes of work to a mid-stream cut is not.

## The six rules that prevent 90% of resets

### 1. Focal PDF reads, never whole

`pdftotext -f N -l N file.pdf -` (one page at a time) or `search_files`
with a regex. Token cost comparison:

- 50-page PDF read whole ≈ cost of 4–5 full responses
- Regex search for `"43,7%|afectaron al"` over same PDF ≈ 1% of that, lands the answer

For scanned PDFs, use the same page-range discipline with
`vision_analyze` or `pdftoppm` + OCR.

### 2. Drafts on disk, not in chat

The deliverable `.txt` is the source of truth. Chat messages are
working memory. If the user asks "show me paragraph 3", read the
file and quote paragraph 3 — don't paste the whole draft into the
response "so the user can see it." Showing long drafts in chat
burns context on every follow-up turn and is the usual trigger for
the overflow reset.

### 3. One task per turn

"Write the next paragraph" is one task. "Write the next paragraph,
verify citations, update the checkpoint, and check the references"
is four tasks; doing them in one turn dumps all four results back
into context simultaneously.

### 4. Tune `compression.*` early, not late

The default `config.yaml` has:

```yaml
compression:
  enabled: true
  threshold: 0.5        # start compressing at 50% of window
  target_ratio: 0.2     # shrink to 20% of original
  protect_last_n: 20
```

If a session is consistently hitting the overflow reset:

```bash
hermes config set compression.threshold 0.3
hermes config set compression.protect_last_n 30
```

- Lower `threshold` = compressor starts earlier, before the cliff.
- Higher `protect_last_n` = more recent turns are preserved verbatim.

Inspect current values:

```bash
hermes config get compression
hermes config show | grep -A 20 compression
```

### 5. Model selection — the silent killer

`:free` model suffixes (`*:free` on OpenRouter) are the most common
cause of the mid-stream network reset. These models:

- Have aggressive rate limits that cut responses mid-stream without warning
- Are deprioritized for capacity, especially during peak hours
- Often return `network error mid-stream` after 1–3k tokens of output

For long writing sessions, prefer:

- A small paid model on the same provider
  (`anthropic/claude-haiku-4`, `google/gemini-2.5-flash`)
- A local model via custom provider (fast, no rate limits, lower quality)
- A `fallback_model` chain so a `:free` failure auto-retries on a paid slot

### 6. Citation cards are the unit of recovery

When the session resets, the first thing to restore is the
`citation_cards.jsonl` and the inline `{{XX:...}}` markers in the
draft. These are the recoverable units — re-running
`validate_citations.py check` against the saved cards is faster
than re-reading the source PDFs.

If the next session finds the cards but not the draft, regenerate
the draft from the cards in one pass.

## Recovery procedure (after a reset)

When a session opens with the auto-reset message and the user asks
"¿por qué pasó esto?":

1. **Don't apologize; diagnose.** Run
   `session_search(query="<topic>", limit=5)` to find the last
   productive session and read its `bookend_start` + `bookend_end`
   for what was decided.
2. **Read the checkpoint.** If the user has been following the
   pattern, `<workspace>/checkpoint.md` has the full state.
3. **Restore the verified facts.** Pull the citation cards /
   data ledger from the last session's artifacts. Spot-check 2–3
   cards against the source PDFs to confirm the ledger is still
   valid (cheap, anchor-pages only).
4. **Resume with a smaller task.** Ask for "the next paragraph"
   or "the next verification step", not "everything we were
   doing."

The whole recovery takes one turn. Without the checkpoint it takes
several and risks re-introducing decisions the previous session
already settled.

## Quick diagnostic: which reset mode was it?

```bash
# 1. Check the session for the auto-reset message
hermes sessions show <session_id> | grep -i "context length\|network error"

# 2. If "context length" → tune compression, lower threshold
hermes config get compression
hermes config set compression.threshold 0.3

# 3. If "network error" → switch off :free models
hermes config get model.default
hermes model  # pick a paid/stable model
```

Then write the `checkpoint.md` if it doesn't exist, and resume.
