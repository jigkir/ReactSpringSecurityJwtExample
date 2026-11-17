#!/usr/bin/env bash
# startFE.sh : lance setEnv.sh, puis démarre le frontend (npm run dev).
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$HERE/../react-vite-project/src/components/config/Config.jsx"

if [[ ! -f "$CONFIG_FILE" ]]; then
  printf 'Config file not found: %s\n' "$CONFIG_FILE" >&2
  exit 1
fi

sed -i \
  -e 's/^[[:space:]]*\/\/ true \/\/ During development, make this to TRUE/    true \/\/ During development, make this to TRUE/' \
  -e 's/^[[:space:]]*false \/\/ During production, make this to FALSE/    \/\/ false \/\/ During production, make this to FALSE/' \
  "$CONFIG_FILE" || exit 1

"$HERE/setEnv.sh" || exit 1

cd "$HERE/../react-vite-project" || exit 1
printf '\n\033[1;36m==> npm run dev\033[0m\n'
npm run dev
