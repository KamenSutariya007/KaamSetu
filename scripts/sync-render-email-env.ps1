# Push local .env email settings to Render kaamsetu-api (fixes live OTP send_failed).
# Merges into existing env vars (does NOT wipe DATABASE_URL / SECRET_KEY).
#
# Usage:
#   $env:RENDER_API_KEY = "rnd_..."   # https://dashboard.render.com/u/settings#api-keys
#   .\scripts\sync-render-email-env.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $Root ".env"

if (-not $env:RENDER_API_KEY) {
    Write-Host "Set RENDER_API_KEY first:" -ForegroundColor Yellow
    Write-Host '  $env:RENDER_API_KEY = "rnd_..."'
    Write-Host "Get key: https://dashboard.render.com/u/settings#api-keys"
    exit 1
}
if (-not (Test-Path $EnvFile)) {
    Write-Host ".env not found at $EnvFile" -ForegroundColor Red
    exit 1
}

$vals = @{}
Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) { return }
    $i = $line.IndexOf("=")
    $k = $line.Substring(0, $i).Trim()
    $v = $line.Substring($i + 1).Trim().Trim('"').Trim("'")
    $vals[$k] = $v
}

$user = ($vals["EMAIL_HOST_USER"] -as [string]).Trim()
$pass = (($vals["EMAIL_HOST_PASSWORD"] -as [string]) -replace "\s", "").Trim()
$from = (($vals["DEFAULT_FROM_EMAIL"] -as [string]).Trim())
if (-not $from) { $from = $user }
$resend = (($vals["RESEND_API_KEY"] -as [string]).Trim())

if (-not $user -or $pass.Length -lt 16) {
    Write-Host "Local .env EMAIL_HOST_USER / EMAIL_HOST_PASSWORD missing or too short." -ForegroundColor Red
    exit 1
}

$headers = @{
    Accept        = "application/json"
    Authorization = "Bearer $($env:RENDER_API_KEY)"
}

Write-Host "Looking up kaamsetu-api on Render..." -ForegroundColor Cyan
$services = Invoke-RestMethod -Uri "https://api.render.com/v1/services?limit=100" -Headers $headers
$api = $services | Where-Object {
    $_.service.name -eq "kaamsetu-api" -or
    $_.service.name -eq "kaamsetu-api-vtac" -or
    ($_.service.serviceDetails.url -match "kaamsetu-api")
} | Select-Object -First 1

if (-not $api) {
    $api = $services | Where-Object { $_.service.name -match "kaamsetu" -and $_.service.type -eq "web_service" } | Select-Object -First 1
}
if (-not $api) {
    Write-Host "Could not find kaamsetu web service. Names found:" -ForegroundColor Red
    $services | ForEach-Object { Write-Host ("  - " + $_.service.name + " (" + $_.service.id + ")") }
    exit 1
}

$sid = $api.service.id
Write-Host "Service: $($api.service.name) ($sid)" -ForegroundColor Green

# Fetch existing so we don't wipe DATABASE_URL / SECRET_KEY / etc.
$existing = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$sid/env-vars" -Headers $headers
$map = @{}
foreach ($item in $existing) {
    $ev = if ($item.envVar) { $item.envVar } else { $item }
    if ($ev.key) { $map[$ev.key] = $ev.value }
}

$updates = @{
    DEMO_MODE                     = "False"
    EMAIL_VERIFICATION_DEV_MODE   = "False"
    EMAIL_VERIFICATION_REQUIRED   = "True"
    EMAIL_BACKEND                 = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST                    = "smtp.gmail.com"
    EMAIL_PORT                    = "587"
    EMAIL_USE_TLS                 = "True"
    EMAIL_TIMEOUT                 = "20"
    EMAIL_HOST_USER               = $user
    EMAIL_HOST_PASSWORD           = $pass
    DEFAULT_FROM_EMAIL            = $from
}
if ($resend) { $updates["RESEND_API_KEY"] = $resend }

foreach ($k in $updates.Keys) { $map[$k] = $updates[$k] }

$envBody = @()
foreach ($k in $map.Keys) {
    $envBody += @{ key = $k; value = [string]$map[$k] }
}

Write-Host "Updating $($updates.Count) email-related keys (merged with existing)..." -ForegroundColor Cyan
Invoke-RestMethod -Method Put `
    -Uri "https://api.render.com/v1/services/$sid/env-vars" `
    -Headers $headers `
    -ContentType "application/json" `
    -Body ($envBody | ConvertTo-Json -Depth 5) | Out-Null

Write-Host "Triggering deploy..." -ForegroundColor Cyan
$deployBody = @{ clearCache = "do_not_clear" } | ConvertTo-Json
Invoke-RestMethod -Method Post `
    -Uri "https://api.render.com/v1/services/$sid/deploys" `
    -Headers $headers `
    -ContentType "application/json" `
    -Body $deployBody | Out-Null

Write-Host ""
Write-Host "Done. Wait 2-5 min for deploy, then retry OTP on:" -ForegroundColor Green
Write-Host "  https://frontend-zeta-ten-20.vercel.app/"
