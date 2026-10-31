#!/usr/bin/env bash
# startFE.sh : lance setEnv.sh, puis démarre le frontend (npm run dev).
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"$HERE/setEnv.sh" || exit 1

cd "$HERE/../react-vite-project" || exit 1
printf '\n\033[1;36m==> npm run dev\033[0m\n'
npm run dev
