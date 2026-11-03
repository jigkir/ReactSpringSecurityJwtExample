#!/usr/bin/env bash
# Étape 7 : Approbation de toutes les offres de stage en attente
set -uo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

log "Connexion en tant que gestionnaire pour approuver les stages"

MANAGER_TOKEN=$(login "$MANAGER_EMAIL" "$MANAGER_PASSWORD")
[[ -n "$MANAGER_TOKEN" ]] || fail "connexion du gestionnaire impossible"

response_file=$(mktemp)
trap 'rm -f "$response_file"' EXIT

log "Récupération des offres de stage en attente"

http_code=$(curl -sS \
  -o "$response_file" \
  -w '%{http_code}' \
  "$API/manager/internships/pending" \
  -H "Authorization: Bearer $MANAGER_TOKEN")

if [[ "$http_code" != 2* ]]; then
  printf 'Réponse du serveur :\n'
  cat "$response_file"
  fail "récupération des stages en attente impossible (HTTP $http_code)"
fi

ids=$(
  node - "$response_file" <<'NODE'
const fs = require("fs");

const file = process.argv[2];
const internships = JSON.parse(fs.readFileSync(file, "utf8"));

if (!Array.isArray(internships)) {
  throw new Error("La réponse du serveur n'est pas une liste de stages.");
}

for (const internship of internships) {
  if (internship.id === undefined || internship.id === null) {
    throw new Error("Un stage ne contient pas d'identifiant.");
  }

  console.log(internship.id);
}
NODE
) || fail "lecture des stages en attente impossible"

if [[ -z "$ids" ]]; then
  log "Aucun stage en attente."
  exit 0
fi

while IFS= read -r id; do
  [[ -n "$id" ]] || continue

  approval_code=$(
    curl -sS \
      -o /dev/null \
      -w '%{http_code}' \
      -X PUT \
      "$API/manager/internships/$id/approve" \
      -H "Authorization: Bearer $MANAGER_TOKEN"
  )

  if [[ "$approval_code" != 2* ]]; then
    fail "approbation du stage #$id impossible (HTTP $approval_code)"
  fi

  printf '  %s  stage approuvé #%s\n' "$approval_code" "$id"
done <<< "$ids"

log "Tous les stages en attente ont été approuvés par le gestionnaire."