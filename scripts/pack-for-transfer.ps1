# KaamSetu — USB / Google Drive par transfer mate zip banavo
# node_modules ane venv exclude — navi PC par setup.ps1 chalavo
# Usage:  .\scripts\pack-for-transfer.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$OutZip = Join-Path $Root "KaamSetu-transfer.zip"

Write-Host "Creating transfer zip (without node_modules / venv)..." -ForegroundColor Cyan

if (Test-Path $OutZip) { Remove-Item $OutZip -Force }

$tempDir = Join-Path $env:TEMP "KaamSetu-pack-$(Get-Random)"
New-Item -ItemType Directory -Path $tempDir | Out-Null

try {
    robocopy $Root $tempDir /E /XD node_modules venv dist __pycache__ .git /XF KaamSetu-transfer.zip *.pyc /NFL /NDL /NJH /NJS | Out-Null

    Compress-Archive -Path "$tempDir\*" -DestinationPath $OutZip -Force
    Write-Host "`n[OK] Created: $OutZip" -ForegroundColor Green
    Write-Host "`nNew PC par:"
    Write-Host "  1. Zip extract karo"
    Write-Host "  2. .env + frontend\.env + backend\firebase-service-account.json copy karo (purani PC thi)"
    Write-Host "  3. .\scripts\setup.ps1"
    Write-Host "  4. .\scripts\run-dev.ps1"
} finally {
    Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}
