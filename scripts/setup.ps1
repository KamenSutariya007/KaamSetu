# KaamSetu — new PC par ek vaar setup (PowerShell)
# Usage:  cd F:\KaamSetu
#         .\scripts\setup.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

Write-Host "`n=== KaamSetu Setup ===" -ForegroundColor Cyan
Write-Host "Project: $Root`n"

# --- .env files (copy from example if missing) ---
if (-not (Test-Path "$Root\.env")) {
    Copy-Item "$Root\.env.example" "$Root\.env"
    Write-Host "[OK] Created .env from .env.example — review Firebase path if needed" -ForegroundColor Yellow
} else {
    Write-Host "[OK] .env already exists"
}

if (-not (Test-Path "$Root\frontend\.env")) {
    Copy-Item "$Root\frontend\.env.example" "$Root\frontend\.env"
    Write-Host "[OK] Created frontend/.env from example" -ForegroundColor Yellow
} else {
    Write-Host "[OK] frontend/.env already exists"
}

# --- Firebase service account reminder ---
$firebaseKey = "$Root\backend\firebase-service-account.json"
if (-not (Test-Path $firebaseKey)) {
    Write-Host "[!] Missing backend/firebase-service-account.json" -ForegroundColor Yellow
    Write-Host "    Download from Firebase Console -> Service accounts -> Generate new private key"
    Write-Host "    Or copy from your old PC into: backend\firebase-service-account.json"
}

# --- Python backend ---
Write-Host "`n--- Backend (Django) ---" -ForegroundColor Cyan
Set-Location "$Root\backend"

if (-not (Test-Path "venv\Scripts\python.exe")) {
    Write-Host "Creating Python virtual environment..."
    python -m venv venv
}

Write-Host "Installing Python packages..."
& .\venv\Scripts\pip.exe install -r requirements.txt -q

Write-Host "Running migrations..."
& .\venv\Scripts\python.exe manage.py migrate

Write-Host "Checking Firebase / Django config..."
& .\venv\Scripts\python.exe manage.py check

Write-Host "[OK] Backend ready" -ForegroundColor Green

# --- Frontend ---
Write-Host "`n--- Frontend (React) ---" -ForegroundColor Cyan
Set-Location "$Root\frontend"

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] npm not found. Install Node.js from https://nodejs.org" -ForegroundColor Red
    exit 1
}

Write-Host "Installing npm packages..."
npm install

Write-Host "[OK] Frontend ready" -ForegroundColor Green

# --- Public tunnel (mobile data + WiFi reset links) ---
Write-Host "`n--- Public tunnel (optional, for phone on mobile data) ---" -ForegroundColor Cyan
$cf = Get-Command cloudflared -ErrorAction SilentlyContinue
if ($cf) {
    Write-Host "[OK] cloudflared found — run-dev will start public HTTPS link"
} else {
    Write-Host "[!] Install cloudflared for mobile-data reset links:" -ForegroundColor Yellow
    Write-Host "    winget install Cloudflare.cloudflared"
}

Set-Location $Root

Write-Host "`n=== Setup complete ===" -ForegroundColor Green
Write-Host "Run app:  .\scripts\run-dev.ps1"
Write-Host "Open:     http://localhost:5173`n"
