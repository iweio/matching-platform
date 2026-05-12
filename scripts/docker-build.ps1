param(
    [string]$Service,
    [switch]$NoCache
)

if ($Service) {
    if ($NoCache) {
        docker compose build --no-cache $Service
    } else {
        docker compose build $Service
    }
} else {
    $args = @("build")
    if ($NoCache) { $args += "--no-cache" }
    docker compose build --parallel @args
}

Write-Host "Build complete." -ForegroundColor Green
