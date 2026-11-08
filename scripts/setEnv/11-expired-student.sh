#!/usr/bin/env bash
# Étape 11 : Léa commence la démo avec un accès expiré, comme après le 15 août
# Son accès date de la session d'hiver passée : à sa connexion, elle voit la page d'attente
# et le gestionnaire reçoit une notification. L'API ne permet pas de reculer cette date : on passe par la base.
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

EXPIRED_STUDENT_EMAIL="lea.tremblay@claurendeau.qc.ca"
PAST_WINTER_YEAR=$(past_winter_year)

log "Accès de $EXPIRED_STUDENT_EMAIL expiré (session d'hiver $PAST_WINTER_YEAR)"
ensure_winter_session "$PAST_WINTER_YEAR"
updated_id=$(sql "UPDATE student
                  SET access_session_id = (SELECT id FROM academic_session WHERE season = 'WINTER' AND session_year = $PAST_WINTER_YEAR)
                  WHERE id = (SELECT id FROM user_app WHERE email = '$EXPIRED_STUDENT_EMAIL')
                  RETURNING id;")
[[ -n "$updated_id" ]] || fail "aucun étudiant avec le courriel $EXPIRED_STUDENT_EMAIL"
