#!/usr/bin/env bash
# Étape 9 : candidatures, avec ou sans lettre de motivation et relevé de notes
# Léa (accès expiré à l'étape 11) ne postule pas.
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

log "Candidatures"
apply samuel.gagnon@claurendeau.qc.ca 'Samuel2026!' "Développeur full stack React/Spring" CV_Samuel_Gagnon.pdf \
      Lettre_Samuel_Gagnon_Tech_Quebec.pdf Releve_Samuel_Gagnon.pdf
apply samuel.gagnon@claurendeau.qc.ca 'Samuel2026!' "Stagiaire DevOps" CV_Samuel_Gagnon.pdf
# Ancien stage de Samuel : l'étape 10 déplace cette offre et sa candidature dans la session d'hiver passée
apply samuel.gagnon@claurendeau.qc.ca 'Samuel2026!' "Soutien informatique aux utilisateurs" CV_Samuel_Gagnon.pdf
apply emma.lavoie@claurendeau.qc.ca 'Emma2026!' "Assistant chargé de projet" CV_Emma_Lavoie.pdf \
      "" Releve_Emma_Lavoie.pdf
# Démo EQ3-312 : l'étape 15 offre ce stage à Emma, qui l'accepte pendant la démo
apply emma.lavoie@claurendeau.qc.ca 'Emma2026!' "Stagiaire en estimation de coûts" CV_Emma_Lavoie.pdf \
      "" Releve_Emma_Lavoie.pdf
# Démo EQ3-19 : Isabelle embauche Chloé et Lebron pendant la démo
apply chloe.bergeron@claurendeau.qc.ca 'Chloe2026!' "Stagiaire en marketing numérique" CV_Chloe_Bergeron.pdf \
      Lettre_Chloe_Bergeron_Crea_Media.pdf
apply lebron.james@claurendeau.qc.ca 'Lebron2026!' "Stagiaire en marketing numérique" CV_Lebron_James.pdf
# Démo EQ3-174 : l'étape 12 convoque Gabriel en entrevue
apply gabriel.morin@claurendeau.qc.ca 'Gabriel2026!' "Externat en soins infirmiers" CV_Gabriel_Morin.pdf
# Candidature d'Olivier pour la démo EQ3-307 : l'étape 16 en fait un contrat
apply olivier.cote@claurendeau.qc.ca 'Olivier2026!' "Technicien en automatisation" CV_Olivier_Cote.pdf
