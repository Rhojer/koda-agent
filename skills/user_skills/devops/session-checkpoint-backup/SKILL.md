---
name: session-checkpoint-backup
description: "Cron+checkpoint pattern for sessions that keep resetting."
version: 1.0.0
author: Koda & DEScon
license: MIT
platforms: [linux, macos]
metadata:
  hermes:
    tags: [Reliability, Persistence, Checkpoint, Recovery, Cron]
    category: devops
---

# Session Checkpoint & Auto-Recovery

A class-level pattern for keeping long-running agentic sessions alive across context-exceeded auto-resets, network drops, and provider timeouts. Built around three durable artifacts: a `checkpoint.md` in the project workspace, a rotating backup directory, and a cron-driven snapshot script.

## When to Use

Trigger this skill when ANY of the following appear:

- User reports the previous session ended in "Context length exceeded" or auto-reset.
- User explicitly asks for a backup/checkpoint/safety net.
- Long-running work where the cost of losing the thread is high (thesis drafting, multi-day research, large refactors).
- Agent detects the context window approaching its limit mid-session.
- Provider instability (`:free` models with frequent mid-stream cuts) is the main risk.

## The Three Artifacts

### 1. `checkpoint.md` (project workspace)

A human-readable, agent-readable markdown file inside the project's workspace folder that captures the **current state of the work in progress**. Created once at the start of the project, then updated by the agent whenever a meaningful chunk of work is completed.

**Mandatory sections:**

| Section | Purpose |
|---|---|
| **State** | What chapter/section is active, what is the current draft file, what is the goal right now |
| **Verified data** | Pointers to all the citation cards, statistics, or sources already extracted with file paths |
| **Decisions log** | Every structural or content decision made in the session (so the next session inherits them) |
| **File inventory** | Absolute paths of the in-scope files (drafts, source PDFs, citation databases, scripts) |
| **Pending decisions** | Items deferred for the user/tutor (e.g., "prueba estadística por definir con tutor") |
| **Resume checklist** | A literal numbered list of steps to take on session start (read X, then Y, then Z) |

**Path convention:** `<project_workspace>/checkpoint.md` (e.g., `/root/.hermes/workspace_compartido/checkpoint.md`).

**Update cadence:** after each completed block of work, not just at session end. Treat it like a commit history.

### 2. Rotating backup directory

`/root/.hermes/backups/` (or equivalent) holds timestamped snapshots of `checkpoint.md` as `session_state_YYYYMMDD_HHMMSS.md`. A 5-snapshot rotation keeps recent history without filling disk.

### 3. Cron job + scripts (the engine)

Two reusable scripts and one cron job:

- `backup_session.sh` — copies `checkpoint.md` → `/root/.hermes/backups/session_state_<UTC-timestamp>.md`, prunes to last N files, prints the latest path.
- `recover_session.sh` — finds the newest backup, prints its timestamp + first 30 lines + a how-to-resume hint.
- Cron job running `*/30 * * * *` with `no_agent: true` and `deliver: local` (no Telegram spam, no LLM cost).

**Cron create pattern that works with Hermes:**

```bash
hermes cron create \
  --schedule "*/30 * * * *" \
  --name "session-backup" \
  --no-agent \
  --deliver local \
  --script "backup_session.sh"  # path is RELATIVE to ~/.hermes/scripts/
```

**Pitfall:** the `script` field must be a **filename relative to `~/.hermes/scripts/`**, not an absolute path. The first attempt with an absolute path is rejected with: *"Script path must be relative to ~/.hermes/scripts/. Got absolute or home-relative path."*

**To make the job recurrent** (the default `repeat: once` runs only once in the given window), update it with `repeat: 0` or supply a cron schedule like `*/30 * * * *` from the start.

## The Memory Contract

Add ONE entry to memory that future sessions will load automatically:

> "Al iniciar cualquier sesión que toque este proyecto, primero ejecutar `/root/.hermes/scripts/recover_session.sh` para detectar si hay un respaldo más reciente. Si existe, leerlo antes de continuar. El cron `<name>` (id: `<job_id>`) genera respaldos cada N min."

This is the auto-recovery bootstrap. The script handles the discovery; memory wires it into the agent's reflex.

## Script Templates

Both scripts live in `/root/.hermes/scripts/`. The bundled templates below are the canonical reference.

### backup_session.sh

```bash
#!/usr/bin/env bash
set -euo pipefail

CHECKPOINT="/root/.hermes/workspace_compartido/checkpoint.md"
BACKUP_DIR="/root/.hermes/backups"
MAX_BACKUPS=5
TIMESTAMP=$(date -u +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/session_state_${TIMESTAMP}.md"

mkdir -p "$BACKUP_DIR"

if [ ! -f "$CHECKPOINT" ]; then
  echo "[$(date -u +%FT%TZ)] ERROR: No se encontró $CHECKPOINT" >&2
  exit 1
fi

cp "$CHECKPOINT" "$BACKUP_FILE"
echo "[$(date -u +%FT%TZ)] Respaldo creado: $BACKUP_FILE"

BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/session_state_*.md 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
  ls -1t "$BACKUP_DIR"/session_state_*.md | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm -f
  echo "[$(date -u +%FT%TZ)] Rotación: se mantienen los últimos $MAX_BACKUPS respaldos"
fi

LATEST=$(ls -1t "$BACKUP_DIR"/session_state_*.md | head -1)
echo "ÚLTIMO_RESPALDO: $LATEST"
```

### recover_session.sh

```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/root/.hermes/backups"
CHECKPOINT="/root/.hermes/workspace_compartido/checkpoint.md"

if [ ! -d "$BACKUP_DIR" ]; then
  echo "NO_BACKUPS_FOUND"
  exit 0
fi

LATEST=$(ls -1t "$BACKUP_DIR"/session_state_*.md 2>/dev/null | head -1)
if [ -z "$LATEST" ]; then
  echo "NO_BACKUPS_FOUND"
  exit 0
fi

BACKUP_TIMESTAMP=$(basename "$LATEST" | sed 's/session_state_//;s/.md//')
BACKUP_DATE_FORMATTED=$(echo "$BACKUP_TIMESTAMP" | sed 's/\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)_\([0-9]\{2\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)/\1-\2-\3T\4:\5:\6Z/')
BACKUP_SIZE=$(stat -c%s "$LATEST" 2>/dev/null || stat -f%z "$LATEST" 2>/dev/null || echo "0")
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/session_state_*.md 2>/dev/null | wc -l)

echo "=== RECUPERACIÓN DE SESIÓN ==="
echo "Respaldo más reciente: $LATEST"
echo "Fecha del respaldo:   $BACKUP_DATE_FORMATTED"
echo "Tamaño:               $BACKUP_SIZE bytes"
echo "Total de respaldos:   $BACKUP_COUNT"
echo ""
echo "=== PRIMERAS 30 LÍNEAS DEL RESPALDO ==="
head -30 "$LATEST"
echo ""
echo "=== INSTRUCCIONES ==="
echo "Lee el archivo completo: $LATEST"
echo "Compara con el checkpoint actual: $CHECKPOINT"
```

## Anti-patterns (DO NOT do)

- ❌ Suggest installing third-party plugins (e.g., `hermes-lcm`) before exhausting the built-in `compression` knobs. Compression + checkpoint is enough; LCM adds a dependency and a failure surface.
- ❌ Use `clarify` with a recommended option that implicitly authorizes a destructive action. The user's explicit `dale` / `aplica` / `hazlo` is required.
- ❌ Pick `context.engine: "lcm"` without first confirming the plugin is installed and `plugins.enabled` lists it. The setting is silently ignored otherwise.
- ❌ Use `:free` models as the default for long-running, reliability-sensitive work. They cause most mid-stream network cuts.
- ❌ Create the backup script at an absolute path and feed it to `hermes cron create --script`. The CLI rejects absolute paths; use the filename relative to `~/.hermes/scripts/`.

## LCM (Lossless Context Management) — optional, only if needed

Hermes does ship a plugin path for `context.engine: "lcm"`, but the LCM engine itself (`hermes-lcm`) is a separate install. It replaces one-shot lossy summarization with a SQLite-backed DAG that preserves all messages. Only adopt it AFTER the built-in `compression` + checkpoint pattern fails, because:

- It is a third-party plugin (extra failure surface, slower upgrades).
- The same root-cause mitigations (smaller responses, fewer tool calls, focused PDFs) work either way.

If the user still wants LCM after the tradeoff is explained:

```yaml
plugins:
  enabled:
    - hermes-lcm
context:
  engine: "lcm"
```

…and install via `pip install hermes-lcm` (or the published wheel).

## Maintenance

- This skill should be re-checked whenever the user reports another session loss despite the cron running. Common causes: the script file was moved out of `~/.hermes/scripts/`, the cron job was paused, or the gateway is offline.
- The `MAX_BACKUPS` constant and the cron schedule (`*/30`) are sensible defaults but can be tuned per project.

**Canonical path:** `/root/.hermes/skills/devops/session-checkpoint-backup/SKILL.md`.
