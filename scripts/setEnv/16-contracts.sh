#!/usr/bin/env bash
# Étape 16 : contrat pour la démo des signatures (EQ3-307, EQ3-23, EQ3-24), par l'API pour que les notifications soient réellement générées
#   Olivier Côté accepte l'offre « Technicien en automatisation » de Patrick Leblanc :
#   le contrat attend la signature du gestionnaire, de l'employeur et de l'étudiant
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

application_id_of() { # application_id_of <courriel de l'étudiant> <titre de l'offre>
  sql "SELECT application.id
       FROM internship_application application
       JOIN internship ON internship.id = application.internship_id
       JOIN user_app student ON student.id = application.student_id
       WHERE internship.title = '$2'
         AND student.email = '$1';"
}

hire() { # hire <courriel de l'employeur> <mot de passe> <courriel de l'étudiant> <mot de passe> <titre de l'offre>
  local employer_token student_token application_id
  employer_token=$(login "$1" "$2")
  student_token=$(login "$3" "$4")
  [[ -n "$employer_token" && -n "$student_token" ]] || fail "connexion de $1 ou de $3 impossible"

  application_id=$(application_id_of "$3" "$5")
  [[ -n "$application_id" ]] || fail "candidature de $3 pour « $5 » introuvable (étape 9 exécutée ?)"

  put_json "$API/employer/applications/offer" "[$application_id]" "$employer_token"
  request PUT "$API/student/applications/offers/$application_id/accept" "$student_token"
}

log "Contrat d'Olivier Côté à signer par les trois parties"
hire patrick.leblanc@electrosystemes.com 'Patrick123@' olivier.cote@claurendeau.qc.ca 'Olivier2026!' "Technicien en automatisation"
