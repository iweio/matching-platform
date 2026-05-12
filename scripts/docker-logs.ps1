param(
    [string]$Service,
    [switch]$Follow
)

if ($Service) {
    if ($Follow) {
        docker compose logs -f $Service
    } else {
        docker compose logs $Service
    }
} else {
    if ($Follow) {
        docker compose logs -f
    } else {
        docker compose logs --tail=100
    }
}
