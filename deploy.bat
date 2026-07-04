@echo off
REM ═══════════════════════════════════════
REM  HakimiVisa Production Deploy Script
REM ═══════════════════════════════════════

echo [1/4] Checking .env.prod file...
if not exist .env.prod (
    echo ERROR: .env.prod not found!
    echo Copy .env.example to .env.prod and fill in the values.
    exit /b 1
)

echo [2/4] Building Docker images...
docker compose -f docker-compose.prod.yml build --no-cache

echo [3/4] Running database migrations...
docker compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy

echo [4/4] Starting all services...
docker compose -f docker-compose.prod.yml up -d

echo.
echo ═══════════════════════════════════════
echo  Deployment complete!
echo  Frontend: http://localhost
echo  Backend:  http://localhost/api
echo  Health:   http://localhost/api/health/live
echo ═══════════════════════════════════════
