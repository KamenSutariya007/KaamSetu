# Update SMS Gateway API Key in .env and verify SMS dispatch.
# Usage:  .\scripts\set-sms-api-key.ps1
# Free Signup: https://www.fast2sms.com  (Click 'Dev API' -> copy API Key)

$Root = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $Root '.env'
if (-not (Test-Path $EnvFile)) {
    Write-Host ".env not found at $EnvFile" -ForegroundColor Red
    exit 1
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  KAAMSETU — FREE MOBILE SMS GATEWAY SETUP (Fast2SMS)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "To send REAL OTP SMS to any Indian mobile number for FREE:" -ForegroundColor Yellow
Write-Host "1. Open https://www.fast2sms.com in browser"
Write-Host "2. Create a Free Account (Instant free SMS credits credited)"
Write-Host "3. Click on 'Dev API' in the left menu"
Write-Host "4. Copy your 'API Authorization Key'`n"

$apiKey = Read-Host "Paste Fast2SMS API Key"
$apiKey = $apiKey.Trim()

if ([string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Host "API Key cannot be empty." -ForegroundColor Red
    exit 1
}

$lines = Get-Content $EnvFile
$updated = $false
$newLines = foreach ($line in $lines) {
    if ($line -match '^\s*FAST2SMS_API_KEY\s*=') {
        $updated = $true
        "FAST2SMS_API_KEY=$apiKey"
    } else {
        $line
    }
}
if (-not $updated) {
    $newLines += "FAST2SMS_API_KEY=$apiKey"
}
Set-Content -Path $EnvFile -Value $newLines -Encoding UTF8

Write-Host "Saved to .env!" -ForegroundColor Green

$testPhone = Read-Host "Enter your 10-digit mobile number to test SMS (e.g. 9876543210)"
$testPhone = ($testPhone -replace '\D', '').Trim()
if ($testPhone.Length -eq 12 -and $testPhone.StartsWith('91')) {
    $testPhone = $testPhone.Substring(2)
}

if ($testPhone.Length -eq 10) {
    Write-Host "Sending test OTP SMS to +91 $testPhone..." -ForegroundColor Yellow
    & "$Root\backend\venv\Scripts\python.exe" -c @"
import os, sys
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(r'$Root') / '.env')
sys.path.insert(0, str(Path(r'$Root') / 'backend'))
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from accounts.sms_service import send_mobile_otp
res = send_mobile_otp('$testPhone')
print('SMS Dispatch Result:', res)
if res.get('sms_dispatched'):
    print('\nSUCCESS! Real SMS has been dispatched to +91 $testPhone.')
else:
    print('\nNotice:', res.get('message'))
"@
} else {
    Write-Host "Skipped test SMS dispatch." -ForegroundColor DarkGray
}

Write-Host "`nSetup complete. Mobile OTP is now configured to send real SMS!" -ForegroundColor Green
