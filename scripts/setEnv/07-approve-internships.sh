#!/usr/bin/env bash
# Étape 7 : approbation de toutes les offres en attente par le gestionnaire
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

log "Approbation des offres de stage par le gestionnaire"
MANAGER_TOKEN=$(login "$MANAGER_EMAIL" "$MANAGER_PASSWORD")
[[ -n "$MANAGER_TOKEN" ]] || fail "connexion du gestionnaire impossible"

# Ce point d'accès renvoie les offres en attente de toutes les sessions
ids=$(get_json "$API/manager/internships/pending" "$MANAGER_TOKEN" | \
  node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>JSON.parse(d).forEach(i=>console.log(i.id)))') \
  || fail "lecture des offres en attente impossible"

for id in $ids; do
  request PUT "$API/manager/internships/$id/approve" "$MANAGER_TOKEN"
done
