#!/usr/bin/env bash
# Étape 4 : téléversement des CV puis approbation par le gestionnaire
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

log "Téléversement des CV"
T=$(login samuel.gagnon@claurendeau.qc.ca 'Samuel2026!')
upload_cv "$T" CV_Samuel_Gagnon.pdf        # le plus ancien = présélectionné
upload_cv "$T" CV_Samuel_Gagnon_EN.pdf
T=$(login emma.lavoie@claurendeau.qc.ca 'Emma2026!');        upload_cv "$T" CV_Emma_Lavoie.pdf
T=$(login olivier.cote@claurendeau.qc.ca 'Olivier2026!');    upload_cv "$T" CV_Olivier_Cote.pdf
T=$(login chloe.bergeron@claurendeau.qc.ca 'Chloe2026!');    upload_cv "$T" CV_Chloe_Bergeron.pdf
T=$(login gabriel.morin@claurendeau.qc.ca 'Gabriel2026!');   upload_cv "$T" CV_Gabriel_Morin.pdf

log "Approbation des CV par le gestionnaire"
MANAGER_TOKEN=$(login "$MANAGER_EMAIL" "$MANAGER_PASSWORD")
[[ -n "$MANAGER_TOKEN" ]] || fail "connexion du gestionnaire impossible"

# Un id par ligne (jamais le nom du fichier dans la boucle : il peut contenir des espaces)
ids=$(curl -s "$API/manager/cvs" -H "Authorization: Bearer $MANAGER_TOKEN" \
  | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{JSON.parse(d).forEach(cv=>console.log(cv.id))}catch(e){}})')

for id in $ids; do
  curl -s -o /dev/null -w "  %{http_code}  approuvé CV #$id\n" -X PUT \
       "$API/manager/cvs/$id/approve" -H "Authorization: Bearer $MANAGER_TOKEN"
done
