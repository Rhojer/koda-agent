#!/usr/bin/env bash
# recover_session.sh
# Recupera el estado más reciente de la sesión desde los respaldos automáticos.

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/root/.hermes/backups}"
CHECKPOINT="${CHECKPOINT:-/root/.hermes/workspace_compartido/checkpoint.md}"

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
echo "Para retomar el trabajo, lee el archivo completo:"
echo "  $LATEST"
echo ""
echo "Y compara con el checkpoint actual:"
echo "  $CHECKPOINT"
