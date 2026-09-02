# Deploy KaamSetu backend to Render (Blueprint or redeploy existing service)
# Usage:
#   $env:RENDER_API_KEY = "rnd_..."   # from https://dashboard.render.com/u/settings#api-keys
#   .\scripts\deploy-render.ps1

$ErrorActionPreference = "Stop"
$RepoUrl = "https://github.com/KamenSutariya007/KaamSetu"
$BlueprintUrl = "https://render.com/deploy?repo=$RepoUrl"

Write-Host "KaamSetu Render Deploy" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan

if (-not $env:RENDER_API_KEY) {
    Write-Host ""
    Write-Host "RENDER_API_KEY not set — one-click Blueprint deploy:" -ForegroundColor Yellow
    Write-Host $BlueprintUrl
    Write-Host ""
    Write-Host "Steps:"
    Write-Host "  1) Open link above (Render login with GitHub)"
    Write-Host "  2) Delete old 'Hello World' kaamsetu-api if it exists (wrong type)"
    Write-Host "  3) Click Deploy Blueprint — creates PostgreSQL + Django API"
    Write-Host "  4) Add Gmail SMTP env vars in Render dashboard (from your local .env)"
    Write-Host "  5) Test: https://kaamsetu-api.onrender.com/api/services/categories/"
    Write-Host ""
    Start-Process $BlueprintUrl
    exit 0
}

$headers = @{
    Accept        = "application/json"
    Authorization = "Bearer $env:RENDER_API_KEY"
}

Write-Host "Checking existing services..." -ForegroundColor Gray
try {
    $services = Invoke-RestMethod -Uri "https://api.render.com/v1/services?limit=100" -Headers $headers
} catch {
    Write-Host "Render API error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Check RENDER_API_KEY at https://dashboard.render.com/u/settings#api-keys"
    exit 1
}

$api = $services | Where-Object { $_.service.name -eq "kaamsetu-api" -or $_.service.slug -eq "kaamsetu-api" } | Select-Object -First 1

if ($api) {
    $sid = $api.service.id
    Write-Host "Found kaamsetu-api ($sid) — triggering deploy..." -ForegroundColor Green
    $body = @{ clearCache = "do_not_clear" } | ConvertTo-Json
    Invoke-RestMethod -Method Post -Uri "https://api.render.com/v1/services/$sid/deploys" -Headers $headers -Body $body -ContentType "application/json" | Out-Null
    Write-Host "Deploy started. Wait 5-10 min, then test:"
    Write-Host "  https://kaamsetu-api.onrender.com/api/services/categories/"
} else {
    Write-Host "kaamsetu-api not found — use Blueprint deploy:" -ForegroundColor Yellow
    Write-Host $BlueprintUrl
    Start-Process $BlueprintUrl
}
