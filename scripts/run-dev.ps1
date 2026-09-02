# KaamSetu — backend + frontend + public tunnel (WiFi + mobile data)
# Usage:  .\scripts\run-dev.ps1

$Root = Split-Path -Parent $PSScriptRoot

Write-Host "Starting KaamSetu..." -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:8000"
Write-Host "Frontend: http://localhost:5173"
Write-Host "Tunnel:   public HTTPS link for phone (mobile data + WiFi)`n"

# Backend
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "cd '$Root\backend'; .\venv\Scripts\activate; python kaamsetu.py"
)

Start-Sleep -Seconds 2

# Frontend
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "cd '$Root\frontend'; npm.cmd run dev"
)

Start-Sleep -Seconds 5

# Public tunnel (cloudflared) — reset links work on mobile data
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "cd '$Root'; .\scripts\tunnel.ps1"
)

Write-Host "Started 3 windows: Backend | Frontend | Tunnel" -ForegroundColor Green
Write-Host "Install tunnel once if needed: winget install Cloudflare.cloudflared" -ForegroundColor Yellow
Write-Host "Wait for tunnel URL, then use Forgot Password.`n" -ForegroundColor Gray
