.PHONY: up down build logs clean test ps restart-backend restart-agent

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build --parallel

logs:
	docker compose logs -f

clean:
	docker compose down -v --rmi local

test:
	docker compose up -d
	pwsh ./test_docker.ps1

ps:
	docker compose ps

restart-backend:
	docker compose restart backend

restart-agent:
	docker compose restart agent-service

# Rebuild with cache mounts (fast incremental)
rebuild:
	docker compose build --parallel
	docker compose up -d
