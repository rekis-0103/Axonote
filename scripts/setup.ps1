# Axonote dev setup (Windows PowerShell).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Write-Host "==> Web + shared (npm workspaces)"
Push-Location $root
npm install
Pop-Location

Write-Host "==> API venv"
Push-Location "$root\apps\api"
python -m venv .venv
& ".venv\Scripts\python.exe" -m pip install --upgrade pip
& ".venv\Scripts\python.exe" -m pip install -r requirements.txt
Pop-Location

Write-Host "==> Worker venv"
Push-Location "$root\apps\worker"
python -m venv .venv
& ".venv\Scripts\python.exe" -m pip install --upgrade pip
& ".venv\Scripts\python.exe" -m pip install -r requirements.txt
Pop-Location

Write-Host "==> Done. Copy .env.example to .env and start services (see README)."
