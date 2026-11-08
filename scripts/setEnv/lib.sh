#!/usr/bin/env bash
# lib.sh : configuration et fonctions partagées par toutes les étapes.
# Ne s'exécute pas seul : chaque étape fait « source lib.sh ».

[[ -n "${_SETENV_LIB_LOADED:-}" ]] && return 0
_SETENV_LIB_LOADED=1

LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"   # scripts/setEnv
SCRIPTS_DIR="$(cd "$LIB_DIR/.." && pwd)"                  # scripts
ROOT_DIR="$(cd "$SCRIPTS_DIR/.." && pwd)"                 # racine du projet
CVS_DIR="${CVS_DIR:-$SCRIPTS_DIR/cvs}"
DOCUMENTS_DIR="${DOCUMENTS_DIR:-$SCRIPTS_DIR/documents}"
API="http://localhost:8080/api"
FRONT_DIR="$ROOT_DIR/react-vite-project"

MANAGER_EMAIL="gestion.stages@claurendeau.qc.ca"
MANAGER_PASSWORD='John123#'

DB_SERVICE="postgres"
DB_NAME="rsbjwt"
DB_USER="rsbjwt"
WINTER_LAST_DAY="0531"   # la session d'hiver se termine le 31 mai

log()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
fail() { printf '\033[1;31mERREUR : %s\033[0m\n' "$*" >&2; exit 1; }

json_get() { # json_get <champ>  (lit stdin)
  node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{console.log(JSON.parse(d)[process.argv[1]]??"")}catch(e){}})' "$1"
}

id_where() { # id_where <champ[.sous-champ]> <valeur>  (lit une liste JSON sur stdin, imprime l'id du premier élément trouvé)
  node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{const [path,value]=process.argv.slice(1);const item=JSON.parse(d).find(i=>path.split(".").reduce((o,k)=>o?.[k],i)===value);console.log(item?.id??"")}catch(e){}})' "$1" "$2"
}

# IMPORTANT (Git Bash / Windows) : le JSON est envoyé par stdin (--data-binary @-)
# et NON en argument de curl. Sinon Windows réencode les accents (é, ô...) hors UTF-8
# et Spring répond 400. Ce fichier doit être enregistré en UTF-8 avec fins de ligne LF.
send_json() { # send_json <POST|PUT> <url> <json> [token]
  local method="$1" url="$2" body="$3" token="${4:-}" out code
  local auth=()
  [[ -n "$token" ]] && auth=(-H "Authorization: Bearer $token")
  out=$(mktemp)
  code=$(printf '%s' "$body" | curl -s -o "$out" -w '%{http_code}' -X "$method" "$url" \
         -H 'Content-Type: application/json; charset=UTF-8' "${auth[@]}" --data-binary @-)
  printf '  %s  %s %s\n' "$code" "$method" "$url"
  if [[ "$code" != 2* ]]; then
    printf '       -> %s\n' "$(head -c 300 "$out")"
  fi
  rm -f "$out"
}

post_json() { # post_json <url> <json> [token]
  send_json POST "$@"
}

put_json() { # put_json <url> <json> <token>
  send_json PUT "$@"
}

request() { # request <POST|PUT> <url> <token>  (requête sans corps)
  curl -s -o /dev/null -w "  %{http_code}  $1 $2\n" -X "$1" "$2" -H "Authorization: Bearer $3"
}

get_json() { # get_json <url> <token>  -> imprime la réponse JSON
  curl -s "$1" -H "Authorization: Bearer $2"
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

upload_document() { # upload_document <token> <chemin API> <dossier> <fichier.pdf>
  local token="$1" path="$2" dir="$3" file="$4"
  [[ -f "$dir/$file" ]] || { echo "  document manquant : $dir/$file"; return; }
  [[ -n "$token" ]] || { echo "  pas de jeton (connexion échouée) : $file ignoré"; return; }
  # cd + chemin relatif : Git Bash déforme « file=@/c/chemin;type=... » et curl ne trouve plus le fichier
  ( cd "$dir" && curl -s -o /dev/null -w "  %{http_code}  $file\n" -X POST "$API/student/$path" \
      -H "Authorization: Bearer $token" -F "file=@$file;type=application/pdf" )
}

upload_cv() { # upload_cv <token> <fichier.pdf>
  upload_document "$1" cvs "$CVS_DIR" "$2"
}

upload_cover_letter() { # upload_cover_letter <token> <fichier.pdf>
  upload_document "$1" cover-letters "$DOCUMENTS_DIR" "$2"
}

upload_transcript() { # upload_transcript <token> <fichier.pdf>
  upload_document "$1" academic-transcripts "$DOCUMENTS_DIR" "$2"
}

internship() { # internship <token> <json>
  [[ -n "$1" ]] || { echo "  pas de jeton (connexion échouée) : offre ignorée"; return; }
  post_json "$API/employer/internship" "$2" "$1"
}

sql() { # sql <requête>  -> exécute la requête dans la base du conteneur Docker
  docker compose -f "$ROOT_DIR/docker-compose.yml" exec -T "$DB_SERVICE" \
    psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -q -t -A -c "$1" || fail "requête SQL refusée"
}

past_winter_year() { # année de la dernière session d'hiver terminée
  local year
  year=$(date +%Y)
  [[ "$(date +%m%d)" > "$WINTER_LAST_DAY" ]] || year=$((year - 1))
  echo "$year"
}

ensure_winter_session() { # ensure_winter_session <année>  -> crée la session d'hiver si elle n'existe pas encore
  sql "INSERT INTO academic_session (season, session_year, start_date, end_date)
       VALUES ('WINTER', $1, '$1-01-01', '$1-05-31')
       ON CONFLICT (season, session_year) DO NOTHING;"
}
