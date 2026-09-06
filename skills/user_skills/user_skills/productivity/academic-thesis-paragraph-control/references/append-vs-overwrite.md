# Append vs Overwrite — The Single Most Destructive Pitfall in Thesis Drafting

## The trap (real session, 2026-09-06)

The thesis draft `avance_introduccion_completo.txt` had ~6 KB of completed prose (Planteamiento + Factores + 5 Antecedentes) — 17 paragraphs, hours of work, every `[Autor]` citation verified against workspace PDFs. A new section (Justificación, 3 paragraphs, ~2 KB) needed to be added at the end.

The wrong tool was chosen: `write_file(path, content)` with the justification string. The tool's `verified: true` output made it look safe.

**Result:** the entire 6 KB of pre-existing content was deleted. The file went from 17 paragraphs / 6179 characters to 6 lines / 1985 characters — only the new Justificación block. The agent only noticed after the tool returned.

This is the failure mode this reference exists to prevent.

## The rule (memorize)

| If you want to... | Use this tool | NOT this tool |
|---|---|---|
| Create a brand-new file (file does not exist yet) | `write_file` | — |
| Add content at the END of an existing file (append) | `terminal(cat >> file <<EOF ... EOF)` or `patch` or `execute_code` with `open(path,'a')` | **`write_file`** — overwrites everything |
| Replace a specific paragraph | `patch(mode='replace', old_string, new_string)` with enough surrounding context for uniqueness | `write_file` with the full file re-written manually |
| Re-create the file with a meaningful structural change | `write_file`, BUT only after reading the full current content with `read_file` and pasting it back verbatim inside the new content | `write_file` from memory — drops anything you forget |

`write_file` is **not an editor. It is a "replace file contents with exactly this string" primitive.** Its "verified" flag confirms the bytes landed, not that they are the right bytes.

## The mandatory pre-write checklist (run before EVERY `write_file` on a file that may already exist)

1. `ls -la <path>` or `read_file(path, limit=1)` to confirm whether the file exists and its current size.
2. If the file exists and you are NOT writing the complete new version of it, **stop. Pick an append or patch tool instead.**
3. If the file exists AND you are writing a complete new version: read the full current content first, paste it into the new content verbatim, then modify. This is the only safe use of `write_file` on an existing file.
4. If you used `write_file` and only then realized the file already had content, treat it as a destructive incident — see recovery below.

## The recovery playbook (when you've already overwritten)

1. **Stop. Do not write again.** Every additional write compounds the loss.
2. Check whether the lost content is recoverable from any of these sources, in order:
   - **The current conversation context.** If the lost content was drafted or quoted in the last few turns, it is still in the agent's context window. Reconstruct the full file from the quoted content.
   - **A backup.** Check `/root/.hermes/backups/`, the cron `session-backup` output, or any snapshot the user kept. (The thesis workspace does not have automatic file backups unless explicitly configured.)
   - **The user's local copy.** Ask whether they have a copy in their editor, an `undo` history, or a recent PDF export.
   - **Original source files in the workspace.** The PDFs that backed each citation are still there; the prose can be reconstructed citation-by-citation.
3. Reconstruct the file by `write_file`-ing the **complete reconstructed version** (old + new content) in one shot, then verify with `read_file` and `wc -l` that the paragraph count matches the expected total.
4. Tell the user **honestly and immediately** that the file was overwritten, that X paragraphs were temporarily lost, and how they were recovered. Do not silently rewrite as if nothing happened.

## The safe pattern (in code)

```python
# SAFE append — works even on long content with quotes/brackets
with open(path, 'a', encoding='utf-8') as f:
    f.write('\n' + new_section + '\n')
```

```bash
# SAFE append from shell
cat >> /path/to/draft.txt <<'EOF'

Por último, este estudio se justifica...
EOF
```

```python
# SAFE targeted patch — replace one specific block
patch(
    path='/path/to/draft.txt',
    mode='replace',
    old_string='... unique surrounding context ...',
    new_string='... new block ...'
)
```

## What the agent did right after the mistake (for the record)

- Acknowledged the destructive write immediately in the next reply (no silent rewrite).
- Checked `ls -la` and `wc -l` to confirm the loss.
- Checked for backups (`/root/.hermes/backups/` — none for the file).
- Reconstructed the full file in one `write_file` (now safe because the complete reconstructed content was the new file's intended content).
- Verified the reconstruction with `wc -l`, paragraph count, and `grep` of all 8 expected Vancouver citations.
- The user accepted the recovery without rollback.

## TL;DR

`write_file` = "replace the file with exactly this string." For appending or editing existing drafts, use `patch`, `terminal(cat >>)`, or `execute_code` with mode `'a'`. Re-read the file with `read_file` before any destructive write. If you overwrote, recover from context, not from guesswork, and tell the user.
