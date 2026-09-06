#!/usr/bin/env bash
# backup_session.sh
# Respaldos automáticos del estado de la sesión.
# Fuente: <project_workspace>/checkpoint.md
# Destino: /root/.hermes/backups/session_state_YYYYMMDD_HHMMSS.md
# Rotación: mantiene solo los últimos 5 respaldos

set -euo pipefail

# Ajustar CHECKPOINT al path real del proyecto
CHECKPOINT="${CHECKPOINT:-/root/.hermes/workspace_compartido/checkpoint.md}"
BACKUP_DIR="${BACKUP_DIR:-/root/.hermes/backups}"
MAX_BACKUPS="${MAX_BACKUPS:-5}"
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
