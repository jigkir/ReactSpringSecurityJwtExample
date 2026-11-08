#!/usr/bin/env bash
# Étape 14 : Noah s'inscrit pour la première fois après décembre, son compte attend l'approbation du gestionnaire
# L'inscription d'aujourd'hui est hors de cette période : on lui donne le statut PENDING qu'aurait donné une inscription en janvier.
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

LATE_STUDENT_EMAIL="noah.pelletier@claurendeau.qc.ca"

log "Inscription tardive de $LATE_STUDENT_EMAIL"
student Noah Pelletier 2290123 "$LATE_STUDENT_EMAIL" 'Noah2026!' COMPUTER_SCIENCE
updated_id=$(sql "UPDATE student
                  SET account_status = 'PENDING'
                  WHERE id = (SELECT id FROM user_app WHERE email = '$LATE_STUDENT_EMAIL')
                  RETURNING id;")
[[ -n "$updated_id" ]] || fail "aucun étudiant avec le courriel $LATE_STUDENT_EMAIL"