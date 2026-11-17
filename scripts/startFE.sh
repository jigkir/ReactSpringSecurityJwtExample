#!/usr/bin/env bash
# startFE.sh : lance setEnv.sh, puis démarre le frontend (npm run dev).
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$HERE/../react-vite-project/.env.development.local"

# Dev Mode for local runs only: this file is ignored by git, so Config.jsx is never modified
[[ -f "$ENV_FILE" ]] || printf 'VITE_DEV_MODE=true\n' > "$ENV_FILE"

"$HERE/setEnv.sh" || exit 1

cd "$HERE/../react-vite-project" || exit 1
printf '\n\033[1;36m==> npm run dev\033[0m\n'
npm run dev
