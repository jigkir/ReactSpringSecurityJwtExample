#!/usr/bin/env bash
# Étape 12 : convocation en entrevue, par l'API pour que la notification de l'étudiant soit réellement générée
#   Gabriel Morin (Clinique Santé Longueuil) : démo EQ3-174, il refuse puis accepte la convocation
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

invite() { # invite <courriel de l'employeur> <mot de passe> <courriel de l'étudiant> <titre de l'offre> <convocation JSON>
  local token application_id
  token=$(login "$1" "$2")
  [[ -n "$token" ]] || fail "connexion de $1 impossible"

  application_id=$(application_id_of "$3" "$4")
  [[ -n "$application_id" ]] || fail "candidature de $3 pour « $4 » introuvable (étape 9 exécutée ?)"

  post_json "$API/employer/applications/$application_id/interview" "$5" "$token"
}

log "Convocation de Gabriel Morin en entrevue"
invite nathalie.girard@cliniquesantelongueuil.com 'Nathalie123@' gabriel.morin@claurendeau.qc.ca "Externat en soins infirmiers" "$(cat <<'JSON'
{
  "message": "Bonjour Gabriel, votre CV nous intéresse. Nous aimerions vous rencontrer pour parler de l'externat et vous faire visiter la clinique.",
  "interviewDate": "2026-12-10T09:30:00",
  "meetingType": "IN_PERSON",
  "meetingDetails": "Clinique Santé Longueuil, 2100 boulevard Roland-Therrien, Longueuil, réception du 2e étage"
}
JSON
)"
