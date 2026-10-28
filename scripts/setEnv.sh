#!/usr/bin/env bash
# setEnv.sh : prépare l'environnement APRÈS avoir cliqué ▶ #1 (Compose Deployment)
# puis ▶ #2 (ReactSpringSecurityJwtApplication) dans IntelliJ.
#
#   ./scripts/setEnv.sh            toutes les étapes
#   ./scripts/setEnv.sh 3 4 5      seulement certaines étapes (numéros)
#
# Étapes : 1 vérif docker | 2 attente backend | 3 users | 4 cvs | 5 internships | 6 npm i

set -uo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/setEnv"
source "$DIR/lib.sh"

STEPS=(01-docker 02-backend 03-users 04-cvs 05-internships 06-frontend)

run_step() { ( source "$DIR/$1.sh" ) || fail "l'étape $1 a échoué"; }

if [[ $# -eq 0 ]]; then
  for s in "${STEPS[@]}"; do run_step "$s"; done
else
  for n in "$@"; do
    s=$(printf '%s\n' "${STEPS[@]}" | grep "^0*$n-" || true)
    [[ -n "$s" ]] || fail "étape inconnue : $n"
    run_step "$s"
  done
fi
log "setEnv terminé"
