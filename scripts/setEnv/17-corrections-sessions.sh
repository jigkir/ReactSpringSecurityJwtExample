#!/usr/bin/env bash
# Étape 17 : données de la démo des corrections du sprint 3 et des sessions (EQ3-262, EQ3-297)
#   Antoine Lefebvre (informatique) : CV approuvé, lettre et relevé, candidature à « Développeur mobile Android »
#                                     avec les trois documents, et un 2e CV laissé en attente
#   Marc Bouchard                   : « Développeur backend Java » en attente et « Intégrateur web » refusée
# Aucune autre étape ni aucune autre démo n'utilise Antoine ou ces deux offres de Marc.
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

STUDENT_EMAIL="antoine.lefebvre@claurendeau.qc.ca"
STUDENT_PASSWORD='Antoine2026!'
EMPLOYER_EMAIL="marc.bouchard@logiciellaval.com"
EMPLOYER_PASSWORD='Marc123@'

APPROVED_CV="CV_Antoine_Lefebvre.pdf"
PENDING_CV="CV_Antoine_Lefebvre_Mobile.pdf"
COVER_LETTER="Lettre_Antoine_Lefebvre_Logiciel_Laval.pdf"
TRANSCRIPT="Releve_Antoine_Lefebvre.pdf"

APPLIED_INTERNSHIP_TITLE="Développeur mobile Android"
REJECTED_INTERNSHIP_TITLE="Intégrateur web"
REJECTION_COMMENT="Le montant horaire n'est pas indiqué. Ajoute-le, puis soumets l'offre de nouveau."

log "Inscription d'Antoine Lefebvre"
student Antoine Lefebvre 2301234 "$STUDENT_EMAIL" "$STUDENT_PASSWORD" COMPUTER_SCIENCE

STUDENT_TOKEN=$(login "$STUDENT_EMAIL" "$STUDENT_PASSWORD")
MANAGER_TOKEN=$(login "$MANAGER_EMAIL" "$MANAGER_PASSWORD")
EMPLOYER_TOKEN=$(login "$EMPLOYER_EMAIL" "$EMPLOYER_PASSWORD")
[[ -n "$STUDENT_TOKEN" && -n "$MANAGER_TOKEN" && -n "$EMPLOYER_TOKEN" ]] || fail "connexion d'Antoine, du gestionnaire ou de Marc impossible"

log "CV, lettre et relevé d'Antoine"
upload_cv           "$STUDENT_TOKEN" "$APPROVED_CV"
upload_cover_letter "$STUDENT_TOKEN" "$COVER_LETTER"
upload_transcript   "$STUDENT_TOKEN" "$TRANSCRIPT"

cv_id=$(get_json "$API/manager/cvs" "$MANAGER_TOKEN" | id_where fileName "$APPROVED_CV")
[[ -n "$cv_id" ]] || fail "CV $APPROVED_CV introuvable"
request PUT "$API/manager/cvs/$cv_id/approve" "$MANAGER_TOKEN"

log "Candidature d'Antoine avec ses trois documents"
apply "$STUDENT_EMAIL" "$STUDENT_PASSWORD" "$APPLIED_INTERNSHIP_TITLE" "$APPROVED_CV" "$COVER_LETTER" "$TRANSCRIPT"

# Déposé après l'approbation : ce CV reste en attente sur l'accueil du gestionnaire
upload_cv "$STUDENT_TOKEN" "$PENDING_CV"

log "Offres de Marc Bouchard pour l'ordre des statuts"
internship "$EMPLOYER_TOKEN" "$(cat <<'JSON'
{
  "title": "Développeur backend Java",
  "description": "Logiciel Laval développe l'API qui alimente son application de réservation pour les centres sportifs.\n\nTâches :\n- Ajouter des points d'accès REST avec Spring Boot\n- Écrire les tests unitaires et d'intégration\n- Participer aux revues de code de l'équipe\n\nProfil recherché : bonnes bases en Java et en bases de données relationnelles.",
  "requiredSkills": "Java, Spring Boot, PostgreSQL, JUnit",
  "durationInWeeks": 12, "location": "Laval", "workMode": "HYBRID",
  "startDate": "2027-01-18", "applicationDeadline": "2026-12-11",
  "compensationAmount": 22, "compensationNegotiable": false
}
JSON
)"
internship "$EMPLOYER_TOKEN" "$(cat <<'JSON'
{
  "title": "Intégrateur web",
  "description": "Logiciel Laval refait le site vitrine de ses clients.\n\nTâches :\n- Intégrer les maquettes en HTML et CSS\n- Rendre les pages accessibles et adaptées au mobile\n- Corriger les anomalies d'affichage\n\nProfil recherché : souci du détail et intérêt pour le design.",
  "requiredSkills": "HTML, CSS, JavaScript, Accessibilité",
  "durationInWeeks": 10, "location": "Laval", "workMode": "IN_PERSON",
  "startDate": "2027-02-01", "applicationDeadline": "2026-12-18",
  "compensationAmount": 0, "compensationNegotiable": false
}
JSON
)"

rejected_id=$(get_json "$API/manager/internships/pending" "$MANAGER_TOKEN" | id_where title "$REJECTED_INTERNSHIP_TITLE")
[[ -n "$rejected_id" ]] || fail "offre « $REJECTED_INTERNSHIP_TITLE » introuvable"
put_json "$API/manager/internships/$rejected_id/reject" "{\"comment\": \"$REJECTION_COMMENT\"}" "$MANAGER_TOKEN"
