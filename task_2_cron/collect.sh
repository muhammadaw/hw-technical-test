#!/bin/bash

# Target directory
CRON_DIR="/home/cron"
mkdir -p "$CRON_DIR" 2>/dev/null || CRON_DIR="$HOME/home/cron"
mkdir -p "$CRON_DIR"

# Date formatting: cron_MMDDYYYY_HH.00.csv
DATE_STR=$(date +"%m%d%Y")
HOUR_STR=$(date +"%H")
FILENAME="cron_${DATE_STR}_${HOUR_STR}.00.csv"
TARGET_PATH="$CRON_DIR/$FILENAME"

echo "[Collection] Starting shell-based collection to $TARGET_PATH..."

# 1. Try fetching from Express API
HTTP_STATUS=$(curl -s -o /tmp/submissions_response.json -w "%{http_code}" http://localhost:5000/api/submissions --max-time 3)

if [ "$HTTP_STATUS" -eq 200 ]; then
  if command -v node >/dev/null 2>&1; then
    node -e "
      const fs = require('fs');
      const data = JSON.parse(fs.readFileSync('/tmp/submissions_response.json', 'utf8')).data;
      const escape = v => (v === undefined || v === null) ? '' : (String(v).includes(',') || String(v).includes('\"') || String(v).includes('\n')) ? '\"' + String(v).replace(/\"/g, '\"\"') + '\"' : String(v);
      const csv = 'id,name,email,message,createdAt\n' + data.map(sub => [escape(sub.id), escape(sub.name), escape(sub.email), escape(sub.message), escape(sub.createdAt)].join(',')).join('\n') + '\n';
      fs.writeFileSync('$TARGET_PATH', csv, 'utf8');
    " 2>/dev/null && echo "[Collection] Successfully collected data from API using Node helper." && exit 0
  fi
fi

# 2. Fallback to copying local data.csv
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOCAL_CSV="$SCRIPT_DIR/../data.csv"

if [ -f "$LOCAL_CSV" ]; then
  cp "$LOCAL_CSV" "$TARGET_PATH"
  echo "[Collection] Fallback: Copied data from local CSV database $LOCAL_CSV."
else
  # 3. Create empty CSV headers if nothing exists
  echo "id,name,email,message,createdAt" > "$TARGET_PATH"
  echo "[Collection] Initialized empty CSV database at $TARGET_PATH."
fi
