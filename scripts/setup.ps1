Write-Host "=== HakimiVisa Setup Script ===" -ForegroundColor Cyan

Write-Host "`n[1/6] Installing backend dependencies..." -ForegroundColor Yellow
Set-Location -LiteralPath "$PSScriptRoot\..\backend"
npm install

Write-Host "`n[2/6] Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location -LiteralPath "$PSScriptRoot\..\frontend"
npm install

Write-Host "`n[3/6] Setting up environment files..." -ForegroundColor Yellow
Set-Location -LiteralPath "$PSScriptRoot\.."
if (-not (Test-Path ".env")) {
    Copy-Item -LiteralPath ".env.example" -Destination ".env"
    Write-Host "  Created .env from .env.example"
}

Set-Location -LiteralPath "$PSScriptRoot\..\backend"
if (-not (Test-Path ".env")) {
    Copy-Item -LiteralPath ".env.example" -Destination ".env"
    Write-Host "  Created backend/.env from backend/.env.example"
}

Set-Location -LiteralPath "$PSScriptRoot\..\frontend"
if (-not (Test-Path ".env")) {
    Copy-Item -LiteralPath ".env.example" -Destination ".env"
    Write-Host "  Created frontend/.env from frontend/.env.example"
}

Write-Host "`n[4/6] Generating Prisma client..." -ForegroundColor Yellow
Set-Location -LiteralPath "$PSScriptRoot\..\backend"
npx prisma generate

Write-Host "`n[5/6] Running Prisma migrations..." -ForegroundColor Yellow
npx prisma migrate dev --name init

Write-Host "`n[6/6] Setup complete!" -ForegroundColor Green
Write-Host "`nTo start the application:"
Write-Host "  - Backend:  cd backend && npm run start:dev"
Write-Host "  - Frontend: cd frontend && npm run dev"
Write-Host "  - Docker:   docker-compose -f docker-compose.dev.yml up -d"
Write-Host "`nAccess the app at http://localhost:5173" -ForegroundColor Cyan
