#!/bin/sh
set -e

# Create data directories with correct permissions
mkdir -p /app/uploads/logos /app/uploads/client-files /app/backups
chown -R node:node /app/uploads /app/backups

# Run prisma migration
su -s /bin/sh -c 'npx prisma migrate deploy' node

# Start the app as node user
exec su -s /bin/sh -c 'node dist/src/main.js' node
