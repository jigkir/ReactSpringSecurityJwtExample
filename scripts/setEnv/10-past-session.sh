#!/usr/bin/env bash
# Étape 10 : une offre et un CV dans la session d'hiver passée, pour montrer que les sessions passées restent consultables
# Samuel a postulé à cette offre (étape 09) : c'est son ancien stage, déjà consulté par l'employeur.
# Son CV anglais a été déposé pendant la recherche de cet ancien stage : le gestionnaire ne le voit que dans la session passée.
# L'API refuse les dates passées : l'offre, sa candidature et le CV sont donc déplacés directement dans la base de données.
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

PAST_INTERNSHIP_TITLE="Soutien informatique aux utilisateurs"
PAST_CV_FILE_NAME="CV_Samuel_Gagnon_EN.pdf"
PAST_WINTER_YEAR=$(past_winter_year)
PAST_SEARCH_YEAR=$((PAST_WINTER_YEAR - 1))
PAST_SESSION_ID="(SELECT id FROM academic_session WHERE season = 'WINTER' AND session_year = $PAST_WINTER_YEAR)"

log "Offre « $PAST_INTERNSHIP_TITLE » et CV $PAST_CV_FILE_NAME déplacés dans la session d'hiver $PAST_WINTER_YEAR"
ensure_winter_session "$PAST_WINTER_YEAR"
sql "UPDATE internship
     SET session_id = $PAST_SESSION_ID,
         start_date = '$PAST_WINTER_YEAR-02-02',
         application_deadline = '$PAST_WINTER_YEAR-01-08',
         upload_date = '$PAST_SEARCH_YEAR-11-15 09:00'
     WHERE title = '$PAST_INTERNSHIP_TITLE';"
sql "UPDATE internship_application
     SET application_date = '$PAST_SEARCH_YEAR-11-20',
         internship_application_status = 'READ'
     WHERE internship_id = (SELECT id FROM internship WHERE title = '$PAST_INTERNSHIP_TITLE');"
sql "UPDATE cv
     SET session_id = $PAST_SESSION_ID
     WHERE id = (SELECT id FROM document WHERE file_name = '$PAST_CV_FILE_NAME');"
sql "UPDATE document
     SET upload_date = '$PAST_SEARCH_YEAR-11-05 10:00'
     WHERE file_name = '$PAST_CV_FILE_NAME';"

# Les notifications des éléments de la session passée datent de cette ancienne recherche : elles sont déjà lues
sql "UPDATE notification
    SET status = 'READ'
    WHERE (target_type = 'INTERNSHIP_OFFER'
           AND target_id IN (SELECT id FROM internship WHERE session_id = $PAST_SESSION_ID))
       OR (target_type = 'INTERNSHIP_APPLICATION'
           AND target_id IN (SELECT application.id FROM internship_application application
                             JOIN internship ON internship.id = application.internship_id
                             WHERE internship.session_id = $PAST_SESSION_ID))
       OR (target_type = 'CV'
           AND target_id IN (SELECT id FROM cv WHERE session_id = $PAST_SESSION_ID));"