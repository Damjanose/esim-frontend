#!/usr/bin/env bash

set -euo pipefail

APP_DIR="/var/www/esim-frontend"
SERVICE_NAME="esim-frontend"
APP_PORT="3020"
LOCAL_FRONTEND_URL="http://127.0.0.1:${APP_PORT}"
PUBLIC_FRONTEND_URL="https://esim.uplisoft.com/"
PUBLIC_HEALTH_URL="https://esim.uplisoft.com/health"
PUBLIC_API_URL="https://esim.uplisoft.com/api"
DEPLOY_KEY="/root/.ssh/esim_frontend_deploy_key"

cd "$APP_DIR"

if [ -f "$DEPLOY_KEY" ]; then
  git config core.sshCommand "ssh -i $DEPLOY_KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"
fi

echo "Pulling latest frontend changes..."
git pull --ff-only

echo "Installing dependencies from lockfile..."
pnpm install --frozen-lockfile

echo "Building frontend..."
pnpm build

echo "Restarting ${SERVICE_NAME}..."
systemctl restart "$SERVICE_NAME"

echo "Waiting for local frontend..."
for attempt in $(seq 1 60); do
  if curl -fsS -o /dev/null "$LOCAL_FRONTEND_URL" 2>/dev/null; then
    break
  fi

  if [ "$attempt" = "60" ]; then
    echo "Local frontend did not become ready. Recent service logs:"
    journalctl -u "$SERVICE_NAME" -n 120 --no-pager || true
    exit 1
  fi

  sleep 1
done

echo "Verifying public routes..."
curl -fsS -o /dev/null -w "Frontend: %{http_code}\n" "$PUBLIC_FRONTEND_URL"
curl -fsS "$PUBLIC_HEALTH_URL"
echo
curl -fsS "$PUBLIC_API_URL"
echo

echo "Service status:"
systemctl status "$SERVICE_NAME" --no-pager

echo "Frontend deploy complete!"
