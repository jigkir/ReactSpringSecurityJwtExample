#!/usr/bin/env bash
# Étape 1 : Réinitialise la base de données et lance PostgreSQL (LibreTranslate se lance à part, au besoin)
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

cd "$ROOT_DIR" || fail "racine du projet introuvable"

clear

log "Docker : réinitialisation de la base de données (docker compose down -v)"
docker compose -f docker-compose.yml down -v || fail "échec de docker compose down -v"

log "Docker : démarrage de PostgreSQL (docker compose up -d postgres)"
docker compose -f docker-compose.yml up -d postgres || fail "échec de docker compose up -d postgres"

log "Docker : conteneurs en cours d'exécution"
docker compose -f docker-compose.yml ps || fail "docker compose ne répond pas : ouvre Docker Desktop"

if [[ -z "$(docker compose -f docker-compose.yml ps --status running -q 2>/dev/null)" ]]; then
  fail "aucun conteneur ne tourne : vérifie Docker Desktop"
fi