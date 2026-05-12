param(
    [switch]$Volumes,
    [switch]$Images
)

Write-Host "Stopping Matching Platform..." -ForegroundColor Yellow

if ($Volumes) {
    docker compose down -v
} elseif ($Images) {
    docker compose down --rmi local -v
} else {
    docker compose down
}

Write-Host "Done." -ForegroundColor Yellow
