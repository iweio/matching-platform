param(
    [switch]$Build,
    [switch]$Detach,
    [string]$Service
)

Write-Host "Starting Matching Platform..." -ForegroundColor Cyan

if ($Build) {
    Write-Host "Building images..." -ForegroundColor Gray
    docker compose build --parallel
}

if ($Service) {
    docker compose up -d $Service
} else {
    docker compose up -d
}

Write-Host "`nService status:" -ForegroundColor Cyan
docker compose ps
