#!/usr/bin/env bash
# Étape 18 : données de la démo EQ3-26 (le gestionnaire assigne un enseignant à un stagiaire)
#   Contrôles Industriels Brossard (génie électrique) embauche Camille Bélanger et Jérémie Paquette
#   Studio Boréal Communication (marketing) embauche Laurence Morissette
#   Les trois contrats sont signés par les trois parties : chaque contrat signé crée un suivi de stage
#   Marie Dubois (génie électrique) est déjà assignée à Camille, Jérémie attend un enseignant,
#   et aucun enseignant n'est en marketing : Laurence n'a aucun enseignant disponible
# Aucune autre étape ni aucune autre démo n'utilise ces employeurs, ces étudiants ou ces offres.
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

ELECTRICAL_EMPLOYER_EMAIL="karim.haddad@controlesbrossard.com"
ELECTRICAL_EMPLOYER_PASSWORD='Karim123@'
MARKETING_EMPLOYER_EMAIL="valerie.nadeau@studioboreal.com"
MARKETING_EMPLOYER_PASSWORD='Valerie123@'

ELECTRICAL_INTERNSHIP_TITLE="Technicien en instrumentation et contrôle"
MARKETING_INTERNSHIP_TITLE="Stagiaire en création de contenu"

ASSIGNED_STUDENT_EMAIL="camille.belanger@claurendeau.qc.ca"
TEACHER_EMAIL="marie.dubois@claurendeau.qc.ca"

hire_and_sign() { # hire_and_sign <courriel de l'employeur> <mot de passe> <courriel de l'étudiant> <mot de passe> <CV> <titre de l'offre>
  local contract_id signer
  apply "$3" "$4" "$6" "$5"
  offer "$1" "$2" "$3" "$6"
  accept_offer "$3" "$4" "$6"

  contract_id=$(sql "SELECT contract.id
                     FROM contract
                     JOIN user_app student ON student.id = contract.student_id
                     WHERE student.email = '$3';")
  [[ -n "$contract_id" ]] || fail "contrat de $3 introuvable"

  for signer in "$MANAGER_EMAIL" "$1" "$3"; do
    request PUT "$API/dev/contracts/$contract_id/signature?email=$signer" "$MANAGER_TOKEN"
  done
}

log "Employeurs et étudiants de la démo des suivis de stage"
employer Karim   Haddad "$ELECTRICAL_EMPLOYER_EMAIL" "$ELECTRICAL_EMPLOYER_PASSWORD" "Contrôles Industriels Brossard" ELECTRICAL_ENGINEERING 4505550166
employer Valérie Nadeau "$MARKETING_EMPLOYER_EMAIL"  "$MARKETING_EMPLOYER_PASSWORD"   "Studio Boréal Communication"    MARKETING              5145550177
student Camille  Bélanger    2312345 camille.belanger@claurendeau.qc.ca    'Camille2026!'  ELECTRICAL_ENGINEERING
student Jérémie  Paquette    2334567 jeremie.paquette@claurendeau.qc.ca    'Jeremie2026!'  ELECTRICAL_ENGINEERING
student Laurence Morissette  2345678 laurence.morissette@claurendeau.qc.ca 'Laurence2026!' MARKETING

MANAGER_TOKEN=$(login "$MANAGER_EMAIL" "$MANAGER_PASSWORD")
[[ -n "$MANAGER_TOKEN" ]] || fail "connexion du gestionnaire impossible"

log "CV approuvés"
T=$(login camille.belanger@claurendeau.qc.ca 'Camille2026!');       upload_cv "$T" CV_Camille_Belanger.pdf
T=$(login jeremie.paquette@claurendeau.qc.ca 'Jeremie2026!');       upload_cv "$T" CV_Jeremie_Paquette.pdf
T=$(login laurence.morissette@claurendeau.qc.ca 'Laurence2026!');   upload_cv "$T" CV_Laurence_Morissette.pdf
for cv in CV_Camille_Belanger.pdf CV_Jeremie_Paquette.pdf CV_Laurence_Morissette.pdf; do
  cv_id=$(get_json "$API/manager/cvs" "$MANAGER_TOKEN" | id_where fileName "$cv")
  [[ -n "$cv_id" ]] || fail "CV $cv introuvable"
  request PUT "$API/manager/cvs/$cv_id/approve" "$MANAGER_TOKEN"
done

log "Offres approuvées"
T=$(login "$ELECTRICAL_EMPLOYER_EMAIL" "$ELECTRICAL_EMPLOYER_PASSWORD")
internship "$T" "$(cat <<'JSON'
{
  "title": "Technicien en instrumentation et contrôle",
  "description": "Contrôles Industriels Brossard installe et entretient les systèmes de contrôle des usines de la Rive-Sud.\n\nTâches :\n- Étalonner les capteurs et les transmetteurs\n- Programmer des automates et des écrans d'opérateur\n- Participer à la mise en service chez les clients\n\nProfil recherché : intérêt pour l'instrumentation et souci de la sécurité.",
  "requiredSkills": "Instrumentation 4-20 mA, Régulation PID, Automates programmables, Lecture de schémas",
  "durationInWeeks": 12, "location": "Brossard", "workMode": "IN_PERSON",
  "startDate": "2027-01-18", "applicationDeadline": "2026-12-11",
  "compensationAmount": 23.00, "compensationNegotiable": false
}
JSON
)"
T=$(login "$MARKETING_EMPLOYER_EMAIL" "$MARKETING_EMPLOYER_PASSWORD")
internship "$T" "$(cat <<'JSON'
{
  "title": "Stagiaire en création de contenu",
  "description": "Studio Boréal Communication raconte l'histoire des entreprises touristiques du Québec.\n\nTâches :\n- Rédiger des articles de blogue et des infolettres\n- Photographier et monter de courtes vidéos\n- Planifier les publications sur les réseaux sociaux\n\nProfil recherché : bonne plume, sens visuel et autonomie.",
  "requiredSkills": "Rédaction web, Photographie, Canva, Réseaux sociaux",
  "durationInWeeks": 10, "location": "Montréal", "workMode": "HYBRID",
  "startDate": "2027-01-25", "applicationDeadline": "2026-12-11",
  "compensationAmount": 19.00, "compensationNegotiable": false
}
JSON
)"
for title in "$ELECTRICAL_INTERNSHIP_TITLE" "$MARKETING_INTERNSHIP_TITLE"; do
  internship_id=$(get_json "$API/manager/internships/pending" "$MANAGER_TOKEN" | id_where title "$title")
  [[ -n "$internship_id" ]] || fail "offre « $title » introuvable"
  request PUT "$API/manager/internships/$internship_id/approve" "$MANAGER_TOKEN"
done

# Camille en premier : la page Suivi trie du plus récent au plus ancien, sa carte « Assigné » est donc en bas
log "Embauches et contrats signés par les trois parties"
hire_and_sign "$ELECTRICAL_EMPLOYER_EMAIL" "$ELECTRICAL_EMPLOYER_PASSWORD" camille.belanger@claurendeau.qc.ca    'Camille2026!'  CV_Camille_Belanger.pdf    "$ELECTRICAL_INTERNSHIP_TITLE"
hire_and_sign "$ELECTRICAL_EMPLOYER_EMAIL" "$ELECTRICAL_EMPLOYER_PASSWORD" jeremie.paquette@claurendeau.qc.ca    'Jeremie2026!'  CV_Jeremie_Paquette.pdf    "$ELECTRICAL_INTERNSHIP_TITLE"
hire_and_sign "$MARKETING_EMPLOYER_EMAIL"  "$MARKETING_EMPLOYER_PASSWORD"  laurence.morissette@claurendeau.qc.ca 'Laurence2026!' CV_Laurence_Morissette.pdf "$MARKETING_INTERNSHIP_TITLE"

log "Marie Dubois assignée à Camille Bélanger"
tracking_id=$(get_json "$API/manager/internship-trackings" "$MANAGER_TOKEN" | id_where student.email "$ASSIGNED_STUDENT_EMAIL")
[[ -n "$tracking_id" ]] || fail "suivi de stage de $ASSIGNED_STUDENT_EMAIL introuvable"
teacher_id=$(get_json "$API/manager/internship-trackings/$tracking_id/teachers" "$MANAGER_TOKEN" | id_where email "$TEACHER_EMAIL")
[[ -n "$teacher_id" ]] || fail "enseignante $TEACHER_EMAIL introuvable (étape 3 exécutée ?)"
request PUT "$API/manager/internship-trackings/$tracking_id/teacher/$teacher_id" "$MANAGER_TOKEN"