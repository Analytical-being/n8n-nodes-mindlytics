#!/usr/bin/env bash
# Deploy the n8n community node to the remote n8n instance.
# Usage: bash deploy.sh

set -euo pipefail

SERVER="77.42.21.95"
REMOTE="root@$SERVER"
SSH_KEY="$HOME/.ssh/id_ed25519_mindlytics"
SOCKET="/tmp/ssh-mux-mindlytics-n8n-node"
SSH_OPTS="-i $SSH_KEY -o IdentitiesOnly=yes -o ControlMaster=auto -o ControlPath=$SOCKET -o ControlPersist=60"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG_NAME="n8n-nodes-mindlytics"
PKG_VERSION="0.1.0"
INSTALL_DIR="/home/node/.n8n/nodes/node_modules/$PKG_NAME"

echo "==> Building ..."
(cd "$SCRIPT_DIR" && npm run build)

echo "==> Opening SSH connection to $REMOTE ..."
ssh $SSH_OPTS -fN "$REMOTE"

echo "==> Uploading ..."
# Sync only runtime files — no .d.ts
rsync -az --delete --exclude='*.d.ts' \
  -e "ssh $SSH_OPTS" \
  "$SCRIPT_DIR/dist" "$SCRIPT_DIR/package.json" \
  "$REMOTE:/tmp/n8n-nodes-mindlytics-deploy/"

echo "==> Installing into container ..."
ssh $SSH_OPTS "$REMOTE" "
  docker exec n8n-main sh -c '
    rm -rf $INSTALL_DIR
    mkdir -p $INSTALL_DIR
  '
  docker cp /tmp/n8n-nodes-mindlytics-deploy/. n8n-main:$INSTALL_DIR/

  docker exec n8n-postgres psql -U n8n -d n8n -c \"
    INSERT INTO installed_packages (\\\"packageName\\\", \\\"installedVersion\\\")
    VALUES ('$PKG_NAME', '$PKG_VERSION')
    ON CONFLICT (\\\"packageName\\\") DO UPDATE SET \\\"installedVersion\\\" = '$PKG_VERSION', \\\"updatedAt\\\" = NOW();
    INSERT INTO installed_nodes (name, type, \\\"latestVersion\\\", package)
    VALUES ('mindlytics', '$PKG_NAME.mindlytics', 1, '$PKG_NAME')
    ON CONFLICT (name) DO UPDATE SET type = '$PKG_NAME.mindlytics', package = '$PKG_NAME';
  \"

  docker restart n8n-main n8n-worker
"

echo "==> Done. Visit https://workflow.mindlytics.dev"

ssh -O exit -o ControlPath=$SOCKET "$REMOTE" 2>/dev/null || true
