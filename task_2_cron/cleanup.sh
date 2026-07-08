#!/bin/bash

CRON_DIR="/home/cron"
# Fallback if /home/cron is not accessible
[ -d "$CRON_DIR" ] || CRON_DIR="$HOME/home/cron"

if [ ! -d "$CRON_DIR" ]; then
  echo "[Cleansing] Directory $CRON_DIR does not exist. Nothing to clean."
  exit 0
fi

echo "[Cleansing] Deleting files in $CRON_DIR older than 30 days..."

# Use native 'find' command to delete files matching pattern 'cron_*' older than 30 days
# -type f: look for files
# -name "cron_*": filter by name
# -mtime +30: modified more than 30 days ago
# -exec rm -f: delete them
find "$CRON_DIR" -type f -name "cron_*" -mtime +30 -exec rm -f {} \; -print
echo "[Cleansing] Cleanup completed."
