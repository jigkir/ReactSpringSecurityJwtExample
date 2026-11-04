#!/usr/bin/env bash
# Étape 12 : convocations en entrevue (test des notifications côté étudiant)
# Prérequis : étapes 3 à 9 (étudiants, offres approuvées, candidatures).
#   Samuel  : convocation « Développeur full stack » (en ligne) + « Stagiaire DevOps » (modifiée -> INTERVIEW_UPDATED)
#   Emma    : convocation « Assistant chargé de projet » (en personne)
#   Chloé   : convocation « Stagiaire en marketing numérique » (en ligne)
#   Gabriel : aucune convocation (sert à vérifier qu'il ne voit rien)
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

future_date() { # future_date <jours> <heure>  -> 2026-11-10T14:00:00 (compatible Git Bash / macOS / Linux)
  node -e 'const d=new Date(Date.now()+process.argv[1]*864e5);const p=n=>String(n).padStart(2,"0");console.log(`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${process.argv[2]}:00:00`)' "$1" "$2"
}

find_application() { # find_application <jeton employeur> <titre de l'offre> <courriel étudiant> -> id (toutes les sessions)
  local token="$1" sid id
  for sid in $(session_ids "$token"); do
    id=$(get_json "$API/employer/applications?sessionId=$sid" "$token" | \
      node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{const [t,e]=process.argv.slice(1);const a=JSON.parse(d).find(a=>a.internshipTitle===t&&a.student?.email===e);console.log(a?.id??"")}catch(x){}})' "$2" "$3")
    [[ -n "$id" ]] && { echo "$id"; return; }
  done
}

interview_json() { # interview_json <message> <date> <type> <détails>
  printf '{"message":"%s","interviewDate":"%s","meetingType":"%s","meetingDetails":"%s"}' "$1" "$2" "$3" "$4"
}

convoke() { # convoke <courriel employeur> <mot de passe> <titre offre> <courriel étudiant> <jours> <heure> <type> <détails> <message>
  local token app_id
  token=$(login "$1" "$2")
  [[ -n "$token" ]] || { echo "  pas de jeton pour $1"; return; }
  app_id=$(find_application "$token" "$3" "$4")
  [[ -n "$app_id" ]] || { echo "  candidature de $4 pour « $3 » introuvable (étape 9 faite ?)"; return; }
  post_json "$API/employer/applications/$app_id/interview" \
    "$(interview_json "$9" "$(future_date "$5" "$6")" "$7" "$8")" "$token"
}

log "Convocations en entrevue"
convoke sophie.roy@techquebec.com 'Sophie123@' "Développeur full stack React/Spring" samuel.gagnon@claurendeau.qc.ca \
        7 10 ONLINE "https://meet.example.com/tech-quebec-samuel" \
        "Bonjour Samuel, nous aimerions vous rencontrer pour discuter du poste."
convoke sophie.roy@techquebec.com 'Sophie123@' "Stagiaire DevOps" samuel.gagnon@claurendeau.qc.ca \
        9 14 PHONE "514-555-0123" \
        "Bonjour Samuel, une courte entrevue téléphonique pour le poste DevOps."
convoke julie.gauthier@constructionrivesud.com 'Julie123@' "Assistant chargé de projet" emma.lavoie@claurendeau.qc.ca \
        5 9 IN_PERSON "1200 boul. Taschereau, Brossard" \
        "Bonjour Emma, venez nous rencontrer à nos bureaux."
convoke isabelle.fortin@agencecreamedia.com 'Isabelle123@' "Stagiaire en marketing numérique" chloe.bergeron@claurendeau.qc.ca \
        6 13 ONLINE "https://meet.example.com/crea-media-chloe" \
        "Bonjour Chloé, parlons de votre candidature."

log "Modification de la convocation DevOps de Samuel (génère INTERVIEW_UPDATED)"
T=$(login sophie.roy@techquebec.com 'Sophie123@')
app_id=$(find_application "$T" "Stagiaire DevOps" samuel.gagnon@claurendeau.qc.ca)
interview_id=$(get_json "$API/employer/$app_id/interviews" "$T" | \
  node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{console.log(JSON.parse(d).at(-1)?.id??"")}catch(e){}})')
if [[ -n "$interview_id" ]]; then
  put_json "$API/employer/interviews/$interview_id" \
    "$(interview_json "L'heure a changé : rendez-vous plus tard cette journée-là." "$(future_date 9 16)" PHONE "514-555-0123")" "$T"
else
  echo "  convocation DevOps introuvable"
fi

# ------------------------------------------------------------ vérification
log "Vérification : notifications non lues de chaque étudiant"
check() { # check <courriel> <mot de passe> <nombre attendu>
  local token count
  token=$(login "$1" "$2")
  count=$(get_json "$API/notifications" "$token" | \
    node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{const l=JSON.parse(d).filter(n=>n.targetType==="INTERVIEW");console.log(l.length+" ("+l.map(n=>n.notificationType).join(", ")+")")}catch(e){console.log("?")}})')
  printf '  %-42s entrevue : %s  [attendu : %s]\n' "$1" "$count" "$3"
}
check samuel.gagnon@claurendeau.qc.ca 'Samuel2026!' "2 (CONVOCATION, UPDATED)"
check emma.lavoie@claurendeau.qc.ca   'Emma2026!'   "1 (CONVOCATION)"
check chloe.bergeron@claurendeau.qc.ca 'Chloe2026!' "1 (CONVOCATION)"
check gabriel.morin@claurendeau.qc.ca 'Gabriel2026!' "0"

cat <<'TXT'

À vérifier dans le navigateur (mode Dev, bouton « Dev » en bas à gauche) :
  1. Samuel : cloche = 2, deux lignes avec entreprise / poste / date, FR puis EN (bouton FR/EN).
  2. Clic sur une ligne -> /interviews#interview-ID : carte surlignée + pastille « En attente de votre réponse ».
  3. Après l'ouverture de /interviews, la cloche retombe à 0.
  4. Gabriel : aucune notification d'entrevue. Relancer l'étape 12 ne duplique pas les convocations non lues.
TXT