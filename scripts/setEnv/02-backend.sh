#!/usr/bin/env bash
# Étape 2 : Vérifie que le backend est prêt (avec pause interactive ou timeout de 5 sec).
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

log "Attente du backend sur $API"

echo ""
echo -e "\033[1;33m========================================================\033[0m"
echo -e "\033[1;33m 🛑 ACTION REQUISE :\033[0m"
echo -e "\033[1;33m La base de données vient d'être réinitialisée.\033[0m"
echo -e "\033[1;33m Veuillez cliquer sur le bouton VERT de redémarrage\033[0m"
echo -e "\033[1;33m de 'ReactSpringSecurityJwtApplication' dans IntelliJ.\033[0m"
echo -e "\033[1;33m========================================================\033[0m"

echo -n "👉 Appuyez sur [Entrée] (ou continuation automatique dans 5s) : "
read -t 5 -r || true
echo ""

log "Vérification de la connexion au backend..."
code=000
for _ in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/login" \
         -H 'Content-Type: application/json' -d '{}' || true)
  [[ "$code" != "000" ]] && break
  sleep 2
done

[[ "$code" == "000" ]] && fail "backend non joignable sur $API : assurez-vous qu'il est bien démarré."
echo "Backend prêt (HTTP $code)."