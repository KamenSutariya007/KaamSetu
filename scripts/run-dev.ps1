# KaamSetu — pure Django web app (HTML + CSS + Python) + optional tunnel
# Usage:  .\scripts\run-dev.ps1

$Root = Split-Path -Parent $PSScriptRoot

Write-Host "Starting KaamSetu..." -ForegroundColor Cyan
Write-Host "App URL: http://localhost:8000"
Write-Host "Tunnel:  public HTTPS link for phone (mobile data + WiFi)`n"

# Backend / Web App (venv python.exe — no activate needed; avoids system Python / daphne miss)
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "cd '$Root\backend'; & '.\venv\Scripts\python.exe' kaamsetu.py"
)

Start-Sleep -Seconds 3

# Public tunnel (cloudflared) — reset links work on mobile data
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "cd '$Root'; .\scripts\tunnel.ps1"
)

Write-Host "Started 2 windows: Web App (Django) | Tunnel" -ForegroundColor Green
Write-Host "Install tunnel once if needed: winget install Cloudflare.cloudflared" -ForegroundColor Yellow
Write-Host "Open in browser: http://localhost:8000`n" -ForegroundColor Cyan
