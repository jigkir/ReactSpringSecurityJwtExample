#!/usr/bin/env bash
# lib.sh : configuration et fonctions partagées par toutes les étapes.
# Ne s'exécute pas seul : chaque étape fait « source lib.sh ».

[[ -n "${_SETENV_LIB_LOADED:-}" ]] && return 0
_SETENV_LIB_LOADED=1

LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"   # scripts/setEnv
SCRIPTS_DIR="$(cd "$LIB_DIR/.." && pwd)"                  # scripts
ROOT_DIR="$(cd "$SCRIPTS_DIR/.." && pwd)"                 # racine du projet
CVS_DIR="${CVS_DIR:-$SCRIPTS_DIR/cvs}"
API="http://localhost:8080/api"
FRONT_DIR="$ROOT_DIR/react-vite-project"

MANAGER_EMAIL="gestion.stages@claurendeau.qc.ca"
MANAGER_PASSWORD='John123#'

log()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
fail() { printf '\033[1;31mERREUR : %s\033[0m\n' "$*" >&2; exit 1; }

json_get() { # json_get <champ>  (lit stdin)
  node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{console.log(JSON.parse(d)[process.argv[1]]??"")}catch(e){}})' "$1"
}

# IMPORTANT (Git Bash / Windows) : le JSON est envoyé par stdin (--data-binary @-)
# et NON en argument de curl. Sinon Windows réencode les accents (é, ô...) hors UTF-8
# et Spring répond 400. Ce fichier doit être enregistré en UTF-8 avec fins de ligne LF.
post_json() { # post_json <url> <json> [token]
  local url="$1" body="$2" token="${3:-}" out code
  local auth=()
  [[ -n "$token" ]] && auth=(-H "Authorization: Bearer $token")
  out=$(mktemp)
  code=$(printf '%s' "$body" | curl -s -o "$out" -w '%{http_code}' -X POST "$url" \
         -H 'Content-Type: application/json; charset=UTF-8' "${auth[@]}" --data-binary @-)
  printf '  %s  %s\n' "$code" "$url"
  if [[ "$code" != 2* ]]; then
    printf '       -> %s\n' "$(head -c 300 "$out")"
  fi
  rm -f "$out"
}

login() { # login <email> <password> -> imprime le token
  printf '{"email":"%s","password":"%s"}' "$1" "$2" | \
    curl -s -X POST "$API/login" -H 'Content-Type: application/json' --data-binary @- | json_get accessToken
}

student() { # firstName lastName studentId email password discipline
  post_json "$API/student/signup" \
    "{\"firstName\":\"$1\",\"lastName\":\"$2\",\"studentId\":\"$3\",\"email\":\"$4\",\"password\":\"$5\",\"discipline\":\"$6\"}"
}

employer() { # firstName lastName email password company discipline phone
  post_json "$API/employer/signup" \
    "{\"firstName\":\"$1\",\"lastName\":\"$2\",\"email\":\"$3\",\"password\":\"$4\",\"companyName\":\"$5\",\"discipline\":\"$6\",\"phoneNumber\":\"$7\"}"
}

upload_cv() { # upload_cv <token> <fichier.pdf>
  local token="$1" file="$2"
  [[ -f "$CVS_DIR/$file" ]] || { echo "  CV manquant : $CVS_DIR/$file"; return; }
  [[ -n "$token" ]] || { echo "  pas de jeton (connexion échouée) : CV $file ignoré"; return; }
  # cd + chemin relatif : Git Bash déforme « file=@/c/chemin;type=... » et curl ne trouve plus le fichier
  ( cd "$CVS_DIR" && curl -s -o /dev/null -w "  %{http_code}  CV $file\n" -X POST "$API/student/cvs" \
      -H "Authorization: Bearer $token" -F "file=@$file;type=application/pdf" )
}

internship() { # internship <token> <json>
  [[ -n "$1" ]] || { echo "  pas de jeton (connexion échouée) : offre ignorée"; return; }
  post_json "$API/employer/internship" "$2" "$1"
}
