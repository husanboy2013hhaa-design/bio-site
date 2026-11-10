# LinkHub dev launcher - opens backend and frontend in two separate windows.
# Usage:  .\start-dev.ps1
# If blocked:  powershell -ExecutionPolicy Bypass -File .\start-dev.ps1

$root = $PSScriptRoot

$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"
$venvPython = Join-Path $root ".venv\Scripts\python.exe"

if (-not (Test-Path $venvPython)) {
    Write-Host "Missing .venv - run: python -m venv .venv; pip install -r backend\requirements.txt" -ForegroundColor Red
    exit 1
}

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$backend'; & '$venvPython' manage.py runserver"
)

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$frontend'; npm run dev"
)

Write-Host "Backend:  http://127.0.0.1:8000  (docs: /api/docs/)" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
