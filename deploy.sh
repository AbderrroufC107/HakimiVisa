#!/bin/bash
# ═══════════════════════════════════════════
# HakimiVisa Production Deployment Script
# Run this on your VPS after cloning the repo
# ═══════════════════════════════════════════

set -e

echo "=== HakimiVisa Deployment ==="

# 1. Check Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    sudo usermod -aG docker $USER
    echo "Docker installed. You may need to log out and back in."
fi

if ! command -v docker compose &> /dev/null; then
    echo "Installing Docker Compose plugin..."
    sudo apt-get update
    sudo apt-get install -y docker-compose-plugin
fi

# 2. Check .env.prod exists
if [ ! -f .env.prod ]; then
    echo "ERROR: .env.prod not found!"
    echo "Copy .env.example to .env.prod and fill in your values."
    echo "  cp .env.example .env.prod"
    echo "  nano .env.prod"
    exit 1
fi

# 3. Create secrets directory for Firebase
mkdir -p backend/secrets

# 4. Build frontend locally (VITE_API_URL should be /api)
echo "Building frontend..."
cd frontend
npm ci
VITE_API_URL=/api npm run build
cd ..

# 5. Start services
echo "Starting Docker services..."
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# 6. Wait for MySQL
echo "Waiting for MySQL to be ready..."
sleep 15

# 7. Seed database
echo "Seeding database..."
docker exec hakimi-backend npx prisma migrate deploy
docker exec hakimi-backend npx prisma db seed

echo ""
echo "=== Deployment Complete ==="
echo "Frontend: http://YOUR_DOMAIN:3080"
echo "Backend API: http://YOUR_DOMAIN:3080/api"
echo "Swagger Docs: http://YOUR_DOMAIN:3080/api/docs"
echo ""
echo "Next steps:"
echo "1. Point your domain DNS to this server IP"
echo "2. Install SSL with Certbot:"
echo "   sudo apt install certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d yourdomain.com"
echo "3. Update .env.prod with your domain"
echo "4. Rebuild: docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build"
