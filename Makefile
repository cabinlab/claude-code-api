.PHONY: help install dev build start stop logs clean generate-certs test-up test-down test-logs test-setup

# Default target
help:
	@echo "Claude Code API - Available commands:"
	@echo ""
	@echo "Development:"
	@echo "  make install       - Install dependencies"
	@echo "  make dev          - Run development server with hot reload"
	@echo "  make build        - Build TypeScript to JavaScript"
	@echo "  make start        - Start production server"
	@echo "  make generate-certs - Generate self-signed certificates"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker-up    - Start with Docker Compose"
	@echo "  make docker-down  - Stop Docker containers"
	@echo "  make logs         - View Docker logs"
	@echo ""
	@echo "Testing with OpenWebUI:"
	@echo "  make test-setup   - Set up test environment file"
	@echo "  make test-up      - Start test stack with OpenWebUI"
	@echo "  make test-down    - Stop test stack"
	@echo "  make test-logs    - View test stack logs"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean        - Clean build artifacts"

# Install dependencies
install:
	npm install

# Run development server
dev:
	npm run dev

# Build TypeScript
build:
	npm run build

# Start production server
start: build
	npm start

# Docker commands
docker-build:
	docker build -t claude-code-api .

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

logs:
	docker-compose logs -f

# Generate self-signed certificates
generate-certs:
	npm run generate-certs

# Clean build artifacts
clean:
	rm -rf dist/
	rm -rf node_modules/

# Test stack commands
test-setup:
	@if [ ! -f .env.test ]; then \
		cp .env.test.example .env.test; \
		echo "Created .env.test from template"; \
		echo "Please edit .env.test and add your Claude OAuth token"; \
	else \
		echo ".env.test already exists"; \
	fi

test-up: test-setup
	docker compose -f compose-test-openwebui.yaml --env-file .env.test up -d

test-down:
	docker compose -f compose-test-openwebui.yaml --env-file .env.test down

test-logs:
	docker compose -f compose-test-openwebui.yaml --env-file .env.test logs -f

# Rebuild and restart test stack
test-restart:
	docker compose -f compose-test-openwebui.yaml --env-file .env.test build
	docker compose -f compose-test-openwebui.yaml --env-file .env.test up -d