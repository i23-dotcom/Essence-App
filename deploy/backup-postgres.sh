#!/bin/sh
set -eu
mkdir -p backups
STAMP=$(date +"%Y%m%d-%H%M%S")
pg_dump "$DATABASE_URL" | gzip > "backups/essence_network_$STAMP.sql.gz"
echo "Backup written to backups/essence_network_$STAMP.sql.gz"
