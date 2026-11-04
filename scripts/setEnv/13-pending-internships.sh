#!/usr/bin/env bash
# Étape 13 : offres créées après l'approbation de l'étape 7, pour qu'elles restent en attente
#   Sophie, hiver 2027 : Stagiaire en intelligence artificielle (refusée pendant la démo Fix sprint 3)
#                        Stagiaire en cybersécurité (en attente, puis approuvée pendant la démo Fix sprint 3)
#   Patrick, été 2027  : Stage en électronique de puissance (déplacée en H2027 pendant la démo EQ3-297)
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

log "Offres en attente de validation"

T=$(login sophie.roy@techquebec.com 'Sophie123@')
internship "$T" "$(cat <<'JSON'
{
  "title": "Stagiaire en intelligence artificielle",
  "description": "Tu travailleras avec l'équipe IA pour développer des modèles de machine learning.\n\nTâches :\n- Préparer et nettoyer les données pour l'entraînement des modèles\n- Implémenter et tester des algorithmes de classification et de régression\n- Participer à la mise en production des modèles\n\nProfil recherché : bonnes bases en mathématiques et en programmation Python.",
  "requiredSkills": "Python, Pandas, Scikit-learn, Machine Learning",
  "durationInWeeks": 10, "location": "Montréal", "workMode": "REMOTE",
  "startDate": "2027-01-25", "applicationDeadline": "2026-12-18",
  "compensationAmount": 0, "compensationNegotiable": false
}
JSON
)"
internship "$T" "$(cat <<'JSON'
{
  "title": "Stagiaire en cybersécurité",
  "description": "Tu travailleras avec l'équipe Sécurité pour protéger les données de nos clients.\n\nTâches :\n- Analyser les journaux d'événements et détecter les anomalies\n- Participer aux tests d'intrusion et aux audits de sécurité\n- Rédiger des rapports et des recommandations\n\nProfil recherché : intérêt pour la cybersécurité et curiosité technique.",
  "requiredSkills": "Wireshark, Kali Linux, Analyse de logs, Tests d'intrusion",
  "durationInWeeks": 12, "location": "Montréal", "workMode": "HYBRID",
  "startDate": "2027-01-18", "applicationDeadline": "2026-12-11",
  "compensationAmount": 0, "compensationNegotiable": false
}
JSON
)"

T=$(login patrick.leblanc@electrosystemes.com 'Patrick123@')
internship "$T" "$(cat <<'JSON'
{
  "title": "Stage en électronique de puissance",
  "description": "Tu participeras à la conception et aux tests de convertisseurs de puissance pour des bornes de recharge.\n\nTâches :\n- Monter les prototypes\n- Mesurer les performances au banc d'essai\n- Documenter les résultats\n\nProfil recherché : à l'aise avec le fer à souder et l'oscilloscope.",
  "requiredSkills": "Électronique de puissance, Soudure, Oscilloscope",
  "durationInWeeks": 12, "location": "Longueuil", "workMode": "IN_PERSON",
  "startDate": "2027-06-14", "applicationDeadline": "2026-12-11",
  "compensationAmount": 22.00, "compensationNegotiable": false
}
JSON
)"
