#!/usr/bin/env bash
# Étape 12 : convocations en entrevue, par l'API pour que les notifications des étudiantes soient réellement générées
#   Emma (Construction Rive-Sud) : démo EQ3-18, notification de convocation
#   Chloé (Agence Créa Média)    : démo EQ3-282, liste des entrevues, convocation modifiée pendant la démo
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

invite() { # invite <courriel de l'employeur> <mot de passe> <titre de l'offre> <convocation JSON>
  local token application_id
  token=$(login "$1" "$2")
  [[ -n "$token" ]] || fail "connexion de $1 impossible"

  application_id=$(sql "SELECT application.id
                        FROM internship_application application
                        JOIN internship ON internship.id = application.internship_id
                        WHERE internship.title = '$3';")
  [[ -n "$application_id" ]] || fail "candidature pour « $3 » introuvable (étape 9 exécutée ?)"

  post_json "$API/employer/applications/$application_id/interview" "$4" "$token"
}

log "Convocation d'Emma Lavoie en entrevue"
invite julie.gauthier@constructionrivesud.com 'Julie123@' "Stagiaire en estimation de coûts" "$(cat <<'JSON'
{
  "message": "Bonjour, nous trouvons votre CV intéressant et nous voulons vous voir en entrevue. Veuillez être sûr d'apporter une caméra.",
  "interviewDate": "2026-12-03T13:30:00",
  "meetingType": "ONLINE",
  "meetingDetails": "meeting.meetme.112931888121"
}
JSON
)"

log "Convocation de Chloé Bergeron en entrevue"
invite isabelle.fortin@agencecreamedia.com 'Isabelle123@' "Stagiaire en marketing numérique" "$(cat <<'JSON'
{
  "message": "Bonjour Chloé, votre lettre nous a beaucoup plu. Venez nous présenter deux publications que vous avez créées.",
  "interviewDate": "2026-12-08T10:00:00",
  "meetingType": "IN_PERSON",
  "meetingDetails": "Agence Créa Média, 1250 rue Sherbrooke Ouest, bureau 400, Montréal"
}
JSON
)"
