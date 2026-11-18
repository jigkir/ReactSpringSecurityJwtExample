#!/usr/bin/env bash
# Étape 19 : cloches et badges « Nouveau » prêts pour les démos (à lancer en dernier)
# Les étapes précédentes passent par l'API : elles créent aussi les notifications d'événements déjà passés
# (CV approuvés, nouvelles offres, candidatures reçues, offres approuvées...). On les marque lues.
# Restent non lues :
#   - celles du gestionnaire : elles disparaissent seulement quand il traite le CV, l'offre, l'accès ou le contrat
#   - les contrats à signer (Patrick et Olivier), la convocation de Gabriel
#   - les offres d'embauche encore sans réponse (Emma et Samuel)
# Un employeur a forcément lu une candidature à laquelle il a répondu : elle perd son badge « Nouveau ».
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

log "Notifications d'événements passés marquées lues"
sql "UPDATE notification
     SET status = 'READ'
     WHERE status = 'UNREAD'
       AND user_id NOT IN (SELECT id FROM manager)
       AND notification_type NOT IN ('CONTRACT_TO_SIGN_BY_EMPLOYER', 'CONTRACT_TO_SIGN_BY_STUDENT', 'INTERVIEW_CONVOCATION')
       AND NOT (notification_type = 'INTERNSHIP_OFFERED'
                AND target_id IN (SELECT id FROM internship_application WHERE student_internship_consent = 'PENDING'));"

log "Candidatures déjà traitées par l'employeur marquées lues"
sql "UPDATE internship_application
     SET internship_application_status = 'READ'
     WHERE employer_decision <> 'PENDING';"