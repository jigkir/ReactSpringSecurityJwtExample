#!/usr/bin/env bash
# Étape 12 : Julie (Construction Rive-Sud) convoque Emma en entrevue pour l'offre de l'automne 2026
# Passe par l'API (pas par SQL) pour que la notification de l'étudiante soit réellement générée.
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

INTERNSHIP_TITLE="Stagiaire en estimation de coûts"

log "Convocation d'Emma Lavoie en entrevue"
T=$(login julie.gauthier@constructionrivesud.com 'Julie123@')
[[ -n "$T" ]] || fail "connexion de Julie impossible"

application_id=$(sql "SELECT application.id
                      FROM internship_application application
                      JOIN internship ON internship.id = application.internship_id
                      WHERE internship.title = '$INTERNSHIP_TITLE';")
[[ -n "$application_id" ]] || fail "candidature d'Emma introuvable (étape 9 exécutée ?)"

post_json "$API/employer/applications/$application_id/interview" "$(cat <<'JSON'
{
  "message": "Bonjour, nous trouvons votre CV intéressant et nous voulons vous voir en entrevue. Veuillez être sûr d'apporter une caméra.",
  "interviewDate": "2026-12-03T13:30:00",
  "meetingType": "ONLINE",
  "meetingDetails": "meeting.meetme.112931888121"
}
JSON
)" "$T"