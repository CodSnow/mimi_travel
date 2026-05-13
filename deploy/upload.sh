#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ==============================================================================
# Configuration
# ==============================================================================
# Set these variables when running the script, e.g.:
# SERVER_HOST=1.2.3.4 SERVER_USER=root scripts/upload.sh
SERVER_USER="${SERVER_USER:-root}"
SERVER_HOST="${SERVER_HOST:-10.52.3.176}"
SERVER_PORT="${SERVER_PORT:-25214}"
SERVER_DIR="${SERVER_DIR:-/opt/app/mimi_travel}"
DRY_RUN="${DRY_RUN:-false}"

if [[ -z "$SERVER_HOST" ]]; then
  echo "Error: SERVER_HOST is not set."
  echo "Usage: SERVER_HOST=1.2.3.4 [SERVER_USER=root] [SERVER_DIR=/opt/minimal-app-portal] scripts/upload.sh"
  exit 1
fi

# ==============================================================================
# rsync Options & Exclusions
# ==============================================================================
RSYNC_OPTS=(
  -avz              # Archive mode, verbose, compressed
  --progress        # Show progress
  --delete          # Delete files on the destination that don't exist locally
)

# Build the exclusion list based on current project structure
EXCLUDES=(
  # Version control & IDEs
  ".git/"
  ".idea/"
  ".vscode/"
  ".ace-tool/"
  ".DS_Store"

  # Dependencies & Build artifacts
  "node_modules/"
  "frontend/dist/"
  "__pycache__/"
  "venv/"
  ".venv/"

  # --- CRITICAL EXCLUSIONS ---
  # These are preserved on the server. Because they are excluded, 
  # --delete will NOT delete them on the remote side.
  "releases/"
  # ".env"
  ".env.production"
  "service-account.json"
  "firebase-applet-config.json"
  "backend/firebase-applet-config.json"
  "*.log"
)

# Apply exclusions
for e in "${EXCLUDES[@]}"; do
  RSYNC_OPTS+=(--exclude="$e")
done

if [[ "$DRY_RUN" == "true" ]]; then
  echo "=========================================================="
  echo " [!] DRY RUN MODE ENABLED - NO FILES WILL BE TRANSFERRED"
  echo "=========================================================="
  RSYNC_OPTS+=(--dry-run)
fi

echo "[upload] Syncing project to ${SERVER_USER}@${SERVER_HOST}:${SERVER_DIR}..."
echo "[upload] Excluded directories (preserved on server): releases/, .env, node_modules/, etc."

# Run rsync
# Note: Ensure the source path ends with '/' to sync contents, not the folder itself
rsync "${RSYNC_OPTS[@]}" \
  -e "ssh -p ${SERVER_PORT}" \
  "$ROOT_DIR/" "${SERVER_USER}@${SERVER_HOST}:${SERVER_DIR}/"

echo "[upload] Done."
