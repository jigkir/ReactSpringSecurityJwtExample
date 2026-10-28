#!/usr/bin/env bash
# Étape 5 : offres de stage (toutes PENDING)
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

log "Offres de stage"

T=$(login sophie.roy@techquebec.com 'Sophie123@')
internship "$T" "$(cat <<'JSON'
{
  "title": "Développeur full stack React/Spring",
  "description": "Au sein de l'équipe Produits numériques, tu participeras au développement du portail client de Tech Quebec.\n\nTâches :\n- Développer des écrans React connectés à notre API REST\n- Ajouter des points d'accès Spring Boot sécurisés avec JWT\n- Écrire des tests unitaires (JUnit, Vitest) et participer aux revues de code\n\nProfil recherché : étudiant(e) en informatique, à l'aise avec Git et le travail en équipe Scrum.",
  "requiredSkills": "React, Spring Boot, PostgreSQL, Git, JUnit",
  "durationInWeeks": 15, "location": "Montréal", "workMode": "HYBRID",
  "startDate": "2027-01-11", "applicationDeadline": "2026-12-04",
  "compensationAmount": 25.00, "compensationNegotiable": false
}
JSON
)"
internship "$T" "$(cat <<'JSON'
{
  "title": "Stagiaire DevOps",
  "description": "Tu rejoindras l'équipe Plateforme qui maintient nos environnements de test et de production.\n\nTâches :\n- Automatiser les pipelines CI/CD avec GitHub Actions\n- Conteneuriser nos services avec Docker\n- Mettre en place des tableaux de bord de surveillance (Grafana)\n\nProfil recherché : intérêt pour Linux, l'automatisation et l'infonuagique.",
  "requiredSkills": "Docker, GitHub Actions, Linux, Bash",
  "durationInWeeks": 12, "location": "Longueuil", "workMode": "REMOTE",
  "startDate": "2027-01-18", "applicationDeadline": "2026-11-27",
  "compensationAmount": 23.00, "compensationNegotiable": false
}
JSON
)"
# Analyste QA : rémunération « à discuter » -> refusée puis corrigée pendant la démo
internship "$T" "$(cat <<'JSON'
{
  "title": "Analyste QA",
  "description": "Tu travailleras avec l'équipe Qualité pour tester les nouvelles versions de notre application de facturation.\n\nTâches :\n- Rédiger et exécuter des plans de tests\n- Automatiser des tests d'interface avec Selenium\n- Documenter les anomalies dans Jira\n\nProfil recherché : sens du détail et bonne communication écrite.",
  "requiredSkills": "Selenium, JUnit, Jira, Tests manuels",
  "durationInWeeks": 10, "location": "Montréal", "workMode": "IN_PERSON",
  "startDate": "2027-02-01", "applicationDeadline": "2026-12-11",
  "compensationAmount": null, "compensationNegotiable": true
}
JSON
)"

T=$(login marc.bouchard@logiciellaval.com 'Marc123@')
internship "$T" "$(cat <<'JSON'
{
  "title": "Développeur mobile Android",
  "description": "Logiciel Laval développe une application de réservation pour les centres sportifs.\n\nTâches :\n- Développer de nouveaux écrans en Kotlin avec Jetpack Compose\n- Consommer notre API REST\n- Corriger les anomalies signalées par les utilisateurs\n\nProfil recherché : bonnes bases en programmation orientée objet et intérêt pour le mobile.",
  "requiredSkills": "Kotlin, Android, Jetpack Compose, REST",
  "durationInWeeks": 15, "location": "Laval", "workMode": "IN_PERSON",
  "startDate": "2027-01-11", "applicationDeadline": "2026-12-01",
  "compensationAmount": 21.00, "compensationNegotiable": false
}
JSON
)"

T=$(login julie.gauthier@constructionrivesud.com 'Julie123@')
internship "$T" "$(cat <<'JSON'
{
  "title": "Assistant chargé de projet",
  "description": "Construction Rive-Sud réalise des projets résidentiels et commerciaux sur la Rive-Sud.\n\nTâches :\n- Assister le chargé de projet dans le suivi des échéanciers\n- Faire des relevés de quantités et des visites de chantier\n- Contrôler la qualité des travaux et rédiger les rapports\n\nProfil recherché : carte ASP Construction et aisance avec la lecture de plans.",
  "requiredSkills": "AutoCAD, Lecture de plans, MS Project, Carte ASP Construction",
  "durationInWeeks": 12, "location": "Brossard", "workMode": "IN_PERSON",
  "startDate": "2027-01-11", "applicationDeadline": "2026-12-04",
  "compensationAmount": 23.00, "compensationNegotiable": false
}
JSON
)"

T=$(login patrick.leblanc@electrosystemes.com 'Patrick123@')
internship "$T" "$(cat <<'JSON'
{
  "title": "Technicien en automatisation",
  "description": "Électro Systèmes conçoit des panneaux de contrôle pour l'industrie agroalimentaire.\n\nTâches :\n- Programmer et tester des automates\n- Participer à la mise en service chez les clients\n- Mettre à jour les schémas électriques\n\nProfil recherché : connaissances en automatisation et respect des règles de sécurité.",
  "requiredSkills": "Automates programmables, Studio 5000, Lecture de schémas, Cadenassage",
  "durationInWeeks": 14, "location": "Saint-Hyacinthe", "workMode": "IN_PERSON",
  "startDate": "2027-01-18", "applicationDeadline": "2026-12-04",
  "compensationAmount": 24.00, "compensationNegotiable": false
}
JSON
)"

T=$(login isabelle.fortin@agencecreamedia.com 'Isabelle123@')
internship "$T" "$(cat <<'JSON'
{
  "title": "Stagiaire en marketing numérique",
  "description": "Agence Créa Média accompagne des PME dans leur présence en ligne.\n\nTâches :\n- Créer du contenu pour Instagram, Facebook et LinkedIn\n- Planifier les publications des clients\n- Analyser les résultats des campagnes publicitaires\n\nProfil recherché : créativité, bonne plume et intérêt pour les données.",
  "requiredSkills": "Réseaux sociaux, Google Analytics, Canva, Rédaction",
  "durationInWeeks": 10, "location": "Montréal", "workMode": "HYBRID",
  "startDate": "2027-01-25", "applicationDeadline": "2026-12-11",
  "compensationAmount": null, "compensationNegotiable": true
}
JSON
)"

T=$(login nathalie.girard@cliniquesantelongueuil.com 'Nathalie123@')
internship "$T" "$(cat <<'JSON'
{
  "title": "Externat en soins infirmiers",
  "description": "La Clinique Santé Longueuil offre des soins de première ligne à plus de 8 000 patients.\n\nTâches :\n- Accueillir les patients et prendre les signes vitaux\n- Assister l'infirmière clinicienne lors des prélèvements et des vaccinations\n- Faire l'enseignement de base au patient\n\nProfil recherché : étudiant(e) en soins infirmiers ayant complété ses stages en milieu hospitalier.",
  "requiredSkills": "Signes vitaux, Prévention des infections, RCR, Communication",
  "durationInWeeks": 8, "location": "Longueuil", "workMode": "IN_PERSON",
  "startDate": "2027-01-11", "applicationDeadline": "2026-12-04",
  "compensationAmount": 21.00, "compensationNegotiable": false
}
JSON
)"
