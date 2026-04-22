#!/bin/sh
set -e

PORTAL="$1"

STATUS_DIR="/app/data/upload-status"
LOG_DIR="/app/data/upload-logs"
STATUS_FILE="$STATUS_DIR/$PORTAL.json"
LOCAL_DIR="/app/dist/$PORTAL"
REMOTE_PREFIX="dist/$PORTAL"

mkdir -p "$STATUS_DIR"
mkdir -p "$LOG_DIR"

write_status() {
  STATE="$1"
  MESSAGE="$2"
  ERROR_TEXT="$3"

  cat > "$STATUS_FILE" <<EOF
{"ok":true,"portal":"$PORTAL","state":"$STATE","message":"$MESSAGE","error":"$ERROR_TEXT"}
EOF
}

require_env() {
  VAR_NAME="$1"
  VAR_VALUE="$(printenv "$VAR_NAME" 2>/dev/null || true)"
  if [ -z "$VAR_VALUE" ]; then
    echo "ERROR: missing environment variable: $VAR_NAME"
    write_status "failed" "Missing environment variable" "$VAR_NAME"
    exit 1
  fi
}

write_status "uploading" "Uploading build" ""

echo "SYNC STARTED: $PORTAL"
echo "LOCAL_DIR: $LOCAL_DIR"

if [ ! -d "$LOCAL_DIR" ]; then
  echo "ERROR: dist directory not found: $LOCAL_DIR"
  write_status "failed" "dist directory not found" "dist directory not found: $LOCAL_DIR"
  exit 1
fi

require_env "R2_BUCKET"
require_env "R2_ACCESS_KEY_ID"
require_env "R2_SECRET_ACCESS_KEY"

if [ -z "$R2_ENDPOINT" ]; then
  require_env "R2_ACCOUNT_ID"
  ENDPOINT_URL="https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com"
else
  ENDPOINT_URL="$R2_ENDPOINT"
fi

export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
export AWS_DEFAULT_REGION="auto"

echo "UPLOADING BUILD..."
echo "ENDPOINT: $ENDPOINT_URL"
echo "BUCKET: $R2_BUCKET"
echo "REMOTE_PREFIX: $REMOTE_PREFIX"

aws s3 sync "$LOCAL_DIR" "s3://$R2_BUCKET/$REMOTE_PREFIX" \
  --delete \
  --only-show-errors \
  --endpoint-url "$ENDPOINT_URL"

echo "SYNC COMPLETE: $PORTAL"
write_status "success" "Site published" ""

echo "Cleaning up local dist..."
rm -rf "$LOCAL_DIR"
echo "Cleanup complete: $LOCAL_DIR"
