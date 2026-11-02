#!/usr/bin/env bash
# Étape 6 : npm i dans react-vite-project
# (L'ancienne injection des utilisateurs est supprimée : le mode Dev charge maintenant
#  la liste des utilisateurs depuis le backend, GET /api/dev/users.)
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

log "Frontend : npm i dans $FRONT_DIR"
cd "$FRONT_DIR" || fail "dossier react-vite-project introuvable : $FRONT_DIR"
npm i || fail "npm i a échoué"

echo "Utilisateurs de démo : activez le bouton « Dev » (en bas à gauche) sur la page de connexion."
