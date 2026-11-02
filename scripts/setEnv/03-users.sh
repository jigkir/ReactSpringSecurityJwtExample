#!/usr/bin/env bash
# Étape 3 : inscription des étudiants et des employeurs
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

log "Étudiants"
student Samuel  Gagnon   2245678 samuel.gagnon@claurendeau.qc.ca  'Samuel2026!'  COMPUTER_SCIENCE
student Léa     Tremblay 2234567 lea.tremblay@claurendeau.qc.ca   'Lea2026!'     COMPUTER_SCIENCE
student Emma    Lavoie   2256789 emma.lavoie@claurendeau.qc.ca    'Emma2026!'    CIVIL_ENGINEERING
student Olivier Côté     2267890 olivier.cote@claurendeau.qc.ca   'Olivier2026!' ELECTRICAL_ENGINEERING
student Chloé   Bergeron 2278901 chloe.bergeron@claurendeau.qc.ca 'Chloe2026!'   MARKETING
student Gabriel Morin    2289012 gabriel.morin@claurendeau.qc.ca  'Gabriel2026!' NURSING

# ----------------------------------------------------------------- 3b. Employeurs
log "Employeurs"
employer Sophie   Roy      sophie.roy@techquebec.com                    'Sophie123@'   "Tech Quebec"               COMPUTER_SCIENCE       5145550123
employer Marc     Bouchard marc.bouchard@logiciellaval.com              'Marc123@'     "Logiciel Laval"            COMPUTER_SCIENCE       4505550111
employer Julie    Gauthier julie.gauthier@constructionrivesud.com       'Julie123@'    "Construction Rive-Sud"     CIVIL_ENGINEERING      4505550122
employer Patrick  Leblanc  patrick.leblanc@electrosystemes.com          'Patrick123@'  "Électro Systèmes"          ELECTRICAL_ENGINEERING 4505550133
employer Isabelle Fortin   isabelle.fortin@agencecreamedia.com          'Isabelle123@' "Agence Créa Média"         MARKETING              5145550144
employer Nathalie Girard   nathalie.girard@cliniquesantelongueuil.com   'Nathalie123@' "Clinique Santé Longueuil"  NURSING                4505550155

