#!/usr/bin/env bash
# Étape 15 : offres d'embauche encore sans réponse, par l'API pour que les notifications soient réellement générées
#   Julie Gauthier offre ses deux stages à Emma Lavoie : démo EQ3-312, Emma accepte « Stagiaire en estimation de coûts »
#   Sophie Roy offre « Stagiaire DevOps » à Samuel Gagnon : démo EQ3-292, Sophie lui offre aussi le stage full stack pendant la démo
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

log "Offres d'embauche faites à Emma Lavoie"
offer julie.gauthier@constructionrivesud.com 'Julie123@' emma.lavoie@claurendeau.qc.ca "Assistant chargé de projet"
offer julie.gauthier@constructionrivesud.com 'Julie123@' emma.lavoie@claurendeau.qc.ca "Stagiaire en estimation de coûts"

log "Offre d'embauche faite à Samuel Gagnon"
offer sophie.roy@techquebec.com 'Sophie123@' samuel.gagnon@claurendeau.qc.ca "Stagiaire DevOps"