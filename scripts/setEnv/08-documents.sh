#!/usr/bin/env bash
# Étape 8 : lettres de motivation et relevés de notes de quelques étudiants
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

log "Lettres de motivation et relevés de notes"
T=$(login samuel.gagnon@claurendeau.qc.ca 'Samuel2026!')
upload_cover_letter "$T" Lettre_Samuel_Gagnon_Tech_Quebec.pdf
upload_transcript   "$T" Releve_Samuel_Gagnon.pdf
T=$(login emma.lavoie@claurendeau.qc.ca 'Emma2026!');      upload_transcript   "$T" Releve_Emma_Lavoie.pdf
T=$(login chloe.bergeron@claurendeau.qc.ca 'Chloe2026!');  upload_cover_letter "$T" Lettre_Chloe_Bergeron_Crea_Media.pdf
