#!/bin/bash
cd /opt/hermes-agent

# 1. Sincronizar las skills aprendidas por Koda desde ~/.hermes/skills hacia el repositorio
mkdir -p /opt/hermes-agent/skills/user_skills
if [ -d /root/.hermes/skills ]; then
    rsync -av --exclude='.*' /root/.hermes/skills/ /opt/hermes-agent/skills/user_skills/ >/dev/null 2>&1
fi

# 2. Si hay cambios locales (skills creadas o modificadas por Koda), hacer COMMIT y PUSH a GitHub
if [ -n "$(git status --porcelain skills/ tools/ web/)" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Detectados cambios en skills o herramientas. Respaldando a GitHub..." >> /root/.hermes/git_sync.log
    git add skills/ tools/ web/
    git commit -m "Koda: Auto-backup skills and tools [$(date '+%Y-%m-%d %H:%M:%S')]" >> /root/.hermes/git_sync.log 2>&1
    git push origin main >> /root/.hermes/git_sync.log 2>&1
fi

# 3. Traer cambios nuevos desde GitHub (si tú programaste algo nuevo desde tu PC)
git fetch origin main >/dev/null 2>&1
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Nuevos cambios remotos en GitHub. Actualizando VPS..." >> /root/.hermes/git_sync.log
    git pull --rebase origin main >> /root/.hermes/git_sync.log 2>&1
    
    # Reiniciar servicios tras la actualización
    systemctl restart koda-gateway koda-dashboard >> /root/.hermes/git_sync.log 2>&1
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Koda actualizado y reiniciado en vivo!" >> /root/.hermes/git_sync.log
fi
