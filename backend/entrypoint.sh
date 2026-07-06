#!/bin/sh
set -e

# Create upload directories with correct permissions
mkdir -p /app/uploads/logos /app/uploads/client-files
chown -R node:node /app/uploads

# Run prisma migration
su -s /bin/sh -c 'npx prisma migrate deploy' node

# Start the app as node user
exec su -s /bin/sh -c 'node dist/src/main.js' node
