#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Wait for a service to be healthy
wait_for_service() {
    local service=$1
    local max_attempts=30
    local attempt=0

    echo -n "Waiting for $service to be healthy"

    while [ $attempt -lt $max_attempts ]; do
        if docker compose exec -T $service pg_isready -U postgres >/dev/null 2>&1; then
            echo " ✓"
            return 0
        fi

        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done

    echo " ✗"
    return 1
}

# Main script starts here
echo "🚀 Starting Crypto Tracker Docker services..."

# Step 1: Check dependencies
log_info "Checking dependencies..."

if ! command_exists docker; then
    log_error "Docker is not installed. Please install Docker Desktop."
    exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
    log_error "Docker Compose v2 is not available. Please update Docker Desktop."
    exit 1
fi

# Step 2: Load environment
if [ -f .env.docker ]; then
    log_info "Loading environment from .env.docker"
    set -a
    source .env.docker
    set +a
else
    log_warn ".env.docker not found, using defaults"
fi

# Step 3: Create directories
log_info "Creating data directories..."
mkdir -p docker/data/{timescaledb,redis,nats,pgadmin}

# Step 4: Start services
log_info "Starting Docker services..."
docker compose up -d

# Step 5: Wait for services to be healthy
log_info "Waiting for services to be healthy..."

# Check TimescaleDB
if ! wait_for_service timescaledb; then
    log_error "TimescaleDB failed to start"
    docker compose logs timescaledb
    exit 1
fi

# Check Redis
echo -n "Waiting for Redis to be healthy"
attempt=0
while [ $attempt -lt 30 ]; do
    if docker compose exec -T redis redis-cli -a "${REDIS_PASSWORD:-redis}" ping >/dev/null 2>&1; then
        echo " ✓"
        break
    fi
    echo -n "."
    sleep 1
    attempt=$((attempt + 1))
done

if [ $attempt -eq 30 ]; then
    log_error "Redis failed to start"
    docker compose logs redis
    exit 1
fi

# Check NATS
echo -n "Waiting for NATS to be healthy"
attempt=0
while [ $attempt -lt 30 ]; do
    if curl -s http://localhost:8222/healthz >/dev/null 2>&1; then
        echo " ✓"
        break
    fi
    echo -n "."
    sleep 1
    attempt=$((attempt + 1))
done

if [ $attempt -eq 30 ]; then
    log_error "NATS failed to start"
    docker compose logs nats
    exit 1
fi

# Step 6: Initialize database (if needed)
if [ ! -f docker/data/.initialized ]; then
    log_info "First time setup - initializing database..."

    # Run any additional SQL scripts
    # docker compose exec -T timescaledb psql -U postgres -d crypto_tracker < docker/config/timescaledb/post-init.sql

    # Mark as initialized
    touch docker/data/.initialized
fi

# Step 7: Show status
log_info "All services started successfully!"
echo ""
echo "📊 Service URLs:"
echo "  - TimescaleDB: postgresql://localhost:5432/crypto_tracker"
echo "  - Redis: redis://localhost:6379"
echo "  - Redis Insight: http://localhost:8001"
echo "  - NATS: nats://localhost:4222"
echo "  - NATS Monitor: http://localhost:8222"
echo ""
echo "To start pgAdmin, run: docker compose --profile tools up -d"
echo "pgAdmin will be available at: http://localhost:5050"