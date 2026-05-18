#!/usr/bin/env sh
set -eu

docker compose -f docker-compose.yml pull
docker compose -f docker-compose.yml run --rm backend npm run prisma:migrate:deploy
docker compose -f docker-compose.yml up -d

if command -v pm2 >/dev/null 2>&1; then
  pm2 reload deploy/ecosystem.config.cjs --update-env
fi

echo "Deployment complete"
