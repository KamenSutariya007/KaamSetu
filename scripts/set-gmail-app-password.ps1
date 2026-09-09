# Update Gmail App Password in .env and verify SMTP login.
# Usage:  .\scripts\set-gmail-app-password.ps1
# Get password: https://myaccount.google.com/apppasswords  (2FA must be ON)

$Root = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $Root '.env'
if (-not (Test-Path $EnvFile)) {
    Write-Host ".env not found at $EnvFile" -ForegroundColor Red
    exit 1
}

Write-Host "Open https://myaccount.google.com/apppasswords" -ForegroundColor Cyan
Write-Host "Create app password for 'Mail' / 'KaamSetu', then paste the 16 characters below.`n"

$secure = Read-Host "Gmail App Password" -AsSecureString
$BSTR = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($BSTR)
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
}
$plain = ($plain -replace '\s', '').Trim()
if ($plain.Length -lt 16) {
    Write-Host "Password looks too short ($($plain.Length)). Use the 16-char App Password, not your Gmail login password." -ForegroundColor Red
    exit 1
}

$lines = Get-Content $EnvFile
$updated = $false
$newLines = foreach ($line in $lines) {
    if ($line -match '^\s*EMAIL_HOST_PASSWORD\s*=') {
        $updated = $true
        "EMAIL_HOST_PASSWORD=$plain"
    } else {
        $line
    }
}
if (-not $updated) {
    $newLines += "EMAIL_HOST_PASSWORD=$plain"
}
Set-Content -Path $EnvFile -Value $newLines -Encoding UTF8

Write-Host "Saved to .env. Testing SMTP..." -ForegroundColor Yellow
& "$Root\backend\venv\Scripts\python.exe" -c @"
import os, smtplib, ssl
from pathlib import Path
from dotenv import dotenv_values
vals = dotenv_values(Path(r'$Root') / '.env')
user = (vals.get('EMAIL_HOST_USER') or '').strip()
pw = (vals.get('EMAIL_HOST_PASSWORD') or '').replace(' ', '').strip()
server = smtplib.SMTP('smtp.gmail.com', 587, timeout=30)
server.ehlo(); server.starttls(context=ssl.create_default_context()); server.ehlo()
server.login(user, pw)
server.quit()
print('SMTP_OK for', user)
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "SMTP still failing. Regenerate App Password (2-Step Verification must be enabled)." -ForegroundColor Red
    exit 1
}

Write-Host "`nOK. Restart backend so it picks up the new password:" -ForegroundColor Green
Write-Host "  Stop old server, then:  cd backend; .\\venv\\Scripts\\python.exe manage.py runserver"
