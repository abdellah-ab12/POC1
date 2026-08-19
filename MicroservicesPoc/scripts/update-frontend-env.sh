#!/bin/bash
# Régénère frontend/.env avec les URLs KodeKloud de la session en cours.
# Le hash change à chaque nouvelle session KodeKloud -> à relancer à chaque fois.
#
# Usage : ./scripts/update-frontend-env.sh <hash-kodekloud>
# Exemple : ./scripts/update-frontend-env.sh gm5mkqwnzgzrwqgf
# (le hash = la partie après "port-" dans une URL du type
#  5173-port-gm5mkqwnzgzrwqgf.labs.kodekloud.com)

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <hash-kodekloud>"
  echo "Exemple: $0 gm5mkqwnzgzrwqgf"
  exit 1
fi

HASH="$1"
DOMAIN="labs.kodekloud.com"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../frontend/.env"

cat > "$ENV_FILE" << ENVEOF
VITE_USERS_API_URL=https://5001-port-${HASH}.${DOMAIN}
VITE_ORDERS_API_URL=https://5002-port-${HASH}.${DOMAIN}
VITE_NOTIFICATIONS_API_URL=https://5003-port-${HASH}.${DOMAIN}
ENVEOF

echo "-> $ENV_FILE régénéré :"
cat "$ENV_FILE"
echo ""
echo "N'oublie pas de redémarrer 'npm run dev' pour que Vite recharge le .env."
