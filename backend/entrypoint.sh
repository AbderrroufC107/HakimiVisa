#!/bin/sh
set -e

# Create data directories with correct permissions
mkdir -p /app/uploads/logos /app/uploads/client-files /app/backups
chown -R node:node /app/uploads /app/backups

# Ensure MySQL native auth for root (needed by MariaDB mysqldump client)
mysql -h mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY '${MYSQL_ROOT_PASSWORD}'; FLUSH PRIVILEGES;" 2>/dev/null || true

# Run prisma migration
su -s /bin/sh -c 'npx prisma migrate deploy' node

# Start the app as node user
exec su -s /bin/sh -c 'node dist/src/main.js' node
