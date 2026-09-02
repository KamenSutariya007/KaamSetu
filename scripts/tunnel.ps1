# KaamSetu — public HTTPS tunnel (WiFi + mobile data for reset-password links)
# Usage:  .\scripts\tunnel.ps1
# Requires frontend on port 5173. Install once:  winget install Cloudflare.cloudflared

$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
$TunnelFile = Join-Path $Root ".tunnel-url"
$Port = if ($env:FRONTEND_PORT) { $env:FRONTEND_PORT } else { "5173" }

Remove-Item $TunnelFile -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== KaamSetu Public Tunnel ===" -ForegroundColor Cyan
Write-Host "Exposes frontend so reset links work on mobile data AND WiFi."
Write-Host "Keep this window open while testing forgot-password.`n"

function Save-TunnelUrl([string]$Url) {
    if ($Url -and (Test-Path $TunnelFile)) {
        $existing = (Get-Content $TunnelFile -Raw -ErrorAction SilentlyContinue).Trim()
        if ($existing -eq $Url) { return }
    }
    # UTF-8 without BOM — Python/Django must read the URL correctly
    [System.IO.File]::WriteAllText($TunnelFile, $Url, (New-Object System.Text.UTF8Encoding $false))
    Write-Host ""
    Write-Host "Public URL (WiFi + mobile data):" -ForegroundColor Green
    Write-Host "  $Url" -ForegroundColor Green
    Write-Host "Password-reset emails will use this link.`n" -ForegroundColor Green
}

$cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
if ($cloudflared) {
    Write-Host "Starting cloudflared -> http://127.0.0.1:$Port ..." -ForegroundColor Gray
    & cloudflared tunnel --url "http://127.0.0.1:$Port" 2>&1 | ForEach-Object {
        $line = $_.ToString()
        if ($line -match '(https://[a-z0-9-]+\.trycloudflare\.com)') {
            Save-TunnelUrl $matches[1]
        }
        Write-Host $line
    }
    exit $LASTEXITCODE
}

Write-Host "[!] cloudflared not installed." -ForegroundColor Yellow
Write-Host "    Install (one time):  winget install Cloudflare.cloudflared" -ForegroundColor Yellow
Write-Host "    Then run again:      .\scripts\tunnel.ps1`n" -ForegroundColor Yellow
Write-Host "Fallback: npx localtunnel (may show a click-through page on phone)...`n" -ForegroundColor Gray

if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] npx not found. Install Node.js or cloudflared." -ForegroundColor Red
    exit 1
}

npx --yes localtunnel --port $Port 2>&1 | ForEach-Object {
    $line = $_.ToString()
    if ($line -match 'your url is:\s*(https://\S+)') {
        Save-TunnelUrl $matches[1].Trim()
    }
    Write-Host $line
}
