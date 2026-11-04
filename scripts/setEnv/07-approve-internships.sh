#!/usr/bin/env bash
# Étape 7 : approbation des offres en attente de toutes les sessions par le gestionnaire
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

log "Approbation des offres de stage par le gestionnaire"
MANAGER_TOKEN=$(login "$MANAGER_EMAIL" "$MANAGER_PASSWORD")
[[ -n "$MANAGER_TOKEN" ]] || fail "connexion du gestionnaire impossible"

# Sans sessionId, le backend ne renvoie que la session en cours : on parcourt toutes les sessions
for session_id in $(session_ids "$MANAGER_TOKEN"); do
  ids=$(get_json "$API/manager/internships/pending?sessionId=$session_id" "$MANAGER_TOKEN" | \
    node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>JSON.parse(d).forEach(i=>console.log(i.id)))') \
    || fail "lecture des offres en attente impossible (session #$session_id)"

  for id in $ids; do
    request PUT "$API/manager/internships/$id/approve" "$MANAGER_TOKEN"
  done
done
