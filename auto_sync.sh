#!/bin/bash
cd /opt/hermes-agent
# Traer información remota
git fetch origin main >/dev/null 2>&1
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)
# Si hay cambios nuevos en GitHub:
if [ "$LOCAL" != "$REMOTE" ]; then
    echo "[$(date)] ¡Nuevos cambios detectados en GitHub! Actualizando..." >> /root/.hermes/auto_sync.log
    
    # 1. Hacer pull
    git pull origin main >> /root/.hermes/auto_sync.log 2>&1
    
    # 2. Reiniciar los servicios de Koda para aplicar los cambios
    pkill -f "hermes_cli.main gateway run"
    pkill -f "hermes_cli.web_server"
    sleep 2
    
    export PYTHONPATH="/opt/hermes-agent:$PYTHONPATH"
    nohup /opt/hermes-agent/venv/bin/python -m hermes_cli.main gateway run >> /root/.hermes/gateway.log 2>&1 &
    nohup /opt/hermes-agent/venv/bin/python -m hermes_cli.web_server --host 0.0.0.0 --port 9119 >> /root/.hermes/dashboard.log 2>&1 &
    
    echo "[$(date)] ¡Koda actualizado y reiniciado exitosamente!" >> /root/.hermes/auto_sync.log
fi
