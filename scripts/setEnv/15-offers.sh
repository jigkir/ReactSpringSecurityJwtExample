#!/usr/bin/env bash
# Étape 15 : offre de stage faite à Emma Lavoie, par l'API pour que sa notification soit réellement générée
#   Julie Gauthier (Construction Rive-Sud) offre « Assistant chargé de projet » à Emma
#   Effet : Emma a une notification « Offre de stage reçue » (entreprise + poste) qui mène à /offers
#   L'offre « Stagiaire en estimation de coûts » reste intacte : Emma y est convoquée en entrevue (étape 12)
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

OFFER_EMPLOYER_EMAIL="julie.gauthier@constructionrivesud.com"
OFFER_EMPLOYER_PASSWORD='Julie123@'
OFFER_INTERNSHIP_TITLE="Assistant chargé de projet"
OFFER_STUDENT_EMAIL="emma.lavoie@claurendeau.qc.ca"

log "Offre de stage faite à Emma Lavoie"
token=$(login "$OFFER_EMPLOYER_EMAIL" "$OFFER_EMPLOYER_PASSWORD")
[[ -n "$token" ]] || fail "connexion de $OFFER_EMPLOYER_EMAIL impossible"

application_id=$(sql "SELECT application.id
                      FROM internship_application application
                      JOIN internship ON internship.id = application.internship_id
                      JOIN user_app student ON student.id = application.student_id
                      WHERE internship.title = '$OFFER_INTERNSHIP_TITLE'
                        AND student.email = '$OFFER_STUDENT_EMAIL';")
[[ -n "$application_id" ]] || fail "candidature d'Emma pour « $OFFER_INTERNSHIP_TITLE » introuvable (étape 9 exécutée ?)"

# Le point d'accès reçoit la liste des ids de candidatures à embaucher
put_json "$API/employer/applications/offer" "[$application_id]" "$token"