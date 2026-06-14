# Reset local dev database and uploaded files.
# Requires MySQL client (XAMPP: C:\xampp\mysql\bin\mysql.exe)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

$Mysql = @(
    "C:\xampp\mysql\bin\mysql.exe",
    "${env:ProgramFiles}\xampp\mysql\bin\mysql.exe",
    "mysql"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $Mysql) {
    Write-Error "mysql.exe not found. Install XAMPP or add mysql to PATH."
}

$Schema = Join-Path $Root "infra\mysql\init\002_app_schema.sql"
if (-not (Test-Path $Schema)) {
    Write-Error "Schema file not found: $Schema"
}

Write-Host "Resetting database axonote..."
Get-Content $Schema -Raw | & $Mysql -u root
if ($LASTEXITCODE -ne 0) {
    Write-Error "mysql failed with exit code $LASTEXITCODE"
}

$Uploads = Join-Path $Root "uploads"
if (Test-Path $Uploads) {
    Write-Host "Clearing uploads..."
    Get-ChildItem $Uploads -File | Remove-Item -Force
}

Write-Host "Done. Database and uploads reset."
