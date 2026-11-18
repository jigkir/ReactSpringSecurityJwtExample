#!/usr/bin/env bash
# Étape 16 : contrat pour la démo des signatures (EQ3-307, EQ3-23, EQ3-24), par l'API pour que les notifications soient réellement générées
#   Olivier Côté accepte l'offre « Technicien en automatisation » de Patrick Leblanc :
#   le contrat attend la signature du gestionnaire, de l'employeur et de l'étudiant
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

log "Contrat d'Olivier Côté à signer par les trois parties"
offer        patrick.leblanc@electrosystemes.com 'Patrick123@' olivier.cote@claurendeau.qc.ca "Technicien en automatisation"
accept_offer olivier.cote@claurendeau.qc.ca 'Olivier2026!' "Technicien en automatisation"
