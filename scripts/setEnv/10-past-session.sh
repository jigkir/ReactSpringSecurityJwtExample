#!/usr/bin/env bash
# Étape 10 : une offre dans la session d'été passée, pour montrer que les sessions passées restent consultables
# Samuel y a postulé (étape 09) : c'est son ancien stage, déjà consulté par l'employeur.
# L'API refuse les dates passées : l'offre et sa candidature sont donc déplacées directement dans la base de données.
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

PAST_INTERNSHIP_TITLE="Soutien informatique aux utilisateurs"
PAST_SUMMER_YEAR=$(current_academic_year)

log "Offre « $PAST_INTERNSHIP_TITLE » déplacée dans la session d'été $PAST_SUMMER_YEAR"
ensure_summer_session "$PAST_SUMMER_YEAR"
sql "UPDATE internship
     SET session_id = (SELECT id FROM academic_session WHERE season = 'SUMMER' AND session_year = $PAST_SUMMER_YEAR),
         start_date = '$PAST_SUMMER_YEAR-06-01',
         application_deadline = '$PAST_SUMMER_YEAR-05-01',
         upload_date = '$PAST_SUMMER_YEAR-04-15 09:00'
     WHERE title = '$PAST_INTERNSHIP_TITLE';"
sql "UPDATE internship_application
     SET application_date = '$PAST_SUMMER_YEAR-04-20',
         internship_application_status = 'READ'
     WHERE internship_id = (SELECT id FROM internship WHERE title = '$PAST_INTERNSHIP_TITLE');"
sql "UPDATE notification
     SET status = 'READ'
     WHERE target_type = 'INTERNSHIP_APPLICATION'
       AND target_id IN (SELECT application.id FROM internship_application application
                         JOIN internship ON internship.id = application.internship_id
                         WHERE internship.title = '$PAST_INTERNSHIP_TITLE');"