#!/usr/bin/env bash
# Étape 16 : contrats pour la démo EQ3-307, par l'API pour que les notifications soient réellement générées
#   Olivier Côté accepte l'offre « Technicien en automatisation » : contrat à signer par le gestionnaire
#   Samuel Gagnon accepte l'offre « Développeur full stack React/Spring » : contrat déjà signé par le gestionnaire (Dev Mode)
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

application_id_of() { # application_id_of <courriel de l'étudiant> <titre de l'offre>
  sql "SELECT application.id
       FROM internship_application application
       JOIN internship ON internship.id = application.internship_id
       JOIN user_app student ON student.id = application.student_id
       WHERE internship.title = '$2'
         AND student.email = '$1';"
}

contract_id_of() { # contract_id_of <courriel de l'étudiant> <titre de l'offre>
  sql "SELECT contract.id
       FROM contract
       JOIN internship ON internship.id = contract.internship_id
       JOIN user_app student ON student.id = contract.student_id
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

log "Contrat d'Olivier Côté à signer par le gestionnaire"
hire patrick.leblanc@electrosystemes.com 'Patrick123@' olivier.cote@claurendeau.qc.ca 'Olivier2026!' "Technicien en automatisation"

log "Contrat de Samuel Gagnon déjà signé par le gestionnaire"
hire sophie.roy@techquebec.com 'Sophie123@' samuel.gagnon@claurendeau.qc.ca 'Samuel2026!' "Développeur full stack React/Spring"

contract_id=$(contract_id_of samuel.gagnon@claurendeau.qc.ca "Développeur full stack React/Spring")
[[ -n "$contract_id" ]] || fail "contrat de Samuel introuvable"

manager_token=$(login "$MANAGER_EMAIL" "$MANAGER_PASSWORD")
request PUT "$API/dev/contracts/$contract_id/signature?email=$MANAGER_EMAIL" "$manager_token"