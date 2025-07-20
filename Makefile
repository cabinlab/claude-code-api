.PHONY: help install dev build start stop logs clean generate-certs

# Default target
help:
	@echo "Claude Code API - Available commands:"
	@echo "  make install       - Install dependencies"
	@echo "  make dev          - Run development server with hot reload"
	@echo "  make build        - Build TypeScript to JavaScript"
	@echo "  make start        - Start production server"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker-up    - Start with Docker Compose"
	@echo "  make docker-down  - Stop Docker containers"
	@echo "  make logs         - View Docker logs"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make generate-certs - Generate self-signed certificates"

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