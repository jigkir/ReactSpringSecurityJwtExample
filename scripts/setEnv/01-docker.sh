#!/usr/bin/env bash
# Étape 1 : Réinitialise la base de données et lance PostgreSQL + LibreTranslate
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

cd "$ROOT_DIR" || fail "racine du projet introuvable"

clear

log "Docker : réinitialisation de la base de données"
docker compose -f docker-compose.yml down || fail "échec de docker compose down"
docker volume rm reactspringsecurityjwtexample_pgdata 2>/dev/null || true

log "Docker : démarrage de PostgreSQL et LibreTranslate"
docker compose -f docker-compose.yml up -d postgres libretranslate || fail "échec de docker compose up -d"

log "Docker : conteneurs en cours d'exécution"
docker compose -f docker-compose.yml ps || fail "docker compose ne répond pas : ouvre Docker Desktop"

if [[ -z "$(docker compose -f docker-compose.yml ps --status running -q 2>/dev/null)" ]]; then
  fail "aucun conteneur ne tourne : vérifie Docker Desktop"
fi

log "PostgreSQL : attente de la disponibilité"
for _ in {1..30}; do
  if docker exec rsbjwt-postgres pg_isready -U rsbjwt -d rsbjwt >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
docker exec rsbjwt-postgres pg_isready -U rsbjwt -d rsbjwt >/dev/null 2>&1 \
  || fail "PostgreSQL n'est pas prêt après 30 s"

log "LibreTranslate : au premier lancement, le téléchargement des modèles peut prendre quelques minutes (docker compose logs -f libretranslate)"