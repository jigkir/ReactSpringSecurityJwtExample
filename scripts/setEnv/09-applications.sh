#!/usr/bin/env bash
# Étape 9 : candidatures, avec ou sans lettre de motivation et relevé de notes
# Léa (accès expiré à l'étape 11) et Olivier ne postulent pas.
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

apply() { # apply <email> <mot de passe> <titre de l'offre> <CV> [lettre de motivation] [relevé de notes]
  local token internship_id cv_id url query=""
  token=$(login "$1" "$2")
  [[ -n "$token" ]] || { echo "  pas de jeton (connexion échouée) : candidature de $1 ignorée"; return; }

  internship_id=$(get_json "$API/student/internship" "$token" | id_where title "$3")
  cv_id=$(get_json "$API/student/cvs/approved" "$token" | id_where fileName "$4")
  [[ -n "$internship_id" && -n "$cv_id" ]] || { echo "  offre « $3 » ou CV $4 introuvable"; return; }

  [[ -n "${5:-}" ]] && query+="&coverLetterId=$(get_json "$API/student/cover-letters" "$token" | id_where fileName "$5")"
  [[ -n "${6:-}" ]] && query+="&transcriptId=$(get_json "$API/student/academic-transcripts" "$token" | id_where fileName "$6")"

  url="$API/student/internship/$internship_id/apply/$cv_id"
  [[ -n "$query" ]] && url+="?${query#&}"
  request POST "$url" "$token"
}

log "Candidatures"
apply samuel.gagnon@claurendeau.qc.ca 'Samuel2026!' "Développeur full stack React/Spring" CV_Samuel_Gagnon.pdf \
      Lettre_Samuel_Gagnon_Tech_Quebec.pdf Releve_Samuel_Gagnon.pdf
apply samuel.gagnon@claurendeau.qc.ca 'Samuel2026!' "Stagiaire DevOps" CV_Samuel_Gagnon.pdf
# Ancien stage de Samuel : l'étape 10 déplace cette offre et sa candidature dans la session d'été passée
apply samuel.gagnon@claurendeau.qc.ca 'Samuel2026!' "Soutien informatique aux utilisateurs" CV_Samuel_Gagnon.pdf
apply emma.lavoie@claurendeau.qc.ca 'Emma2026!' "Assistant chargé de projet" CV_Emma_Lavoie.pdf \
      "" Releve_Emma_Lavoie.pdf
# Candidature d'Emma pour la démo eq3-18 : l'étape 12 la convoque en entrevue
apply emma.lavoie@claurendeau.qc.ca 'Emma2026!' "Stagiaire en estimation de coûts" CV_Emma_Lavoie.pdf \
      "" Releve_Emma_Lavoie.pdf
apply chloe.bergeron@claurendeau.qc.ca 'Chloe2026!' "Stagiaire en marketing numérique" CV_Chloe_Bergeron.pdf \
      Lettre_Chloe_Bergeron_Crea_Media.pdf
apply gabriel.morin@claurendeau.qc.ca 'Gabriel2026!' "Externat en soins infirmiers" CV_Gabriel_Morin.pdf