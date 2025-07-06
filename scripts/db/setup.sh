#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_step() {
    echo -e "\n${BLUE}▶${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

echo "🗄️  Database Setup"
echo "================"

# Step 0: Check if database is running
log_step "Checking database connection..."
if ! docker compose exec -T timescaledb pg_isready -U postgres >/dev/null 2>&1; then
    log_error "Database is not running. Starting services..."
    docker compose up -d timescaledb
    sleep 5  # Give it a moment to fully start
fi

# Step 1: Run Prisma migrations
log_step "Running Prisma migrations..."
pnpm --filter @crypto-tracker/core run db:push

# Step 2: Initialize TimescaleDB features
log_step "Initializing TimescaleDB..."
./scripts/db/init-timescale.sh

# Step 3: Seed initial data
log_step "Seeding database..."
pnpm --filter @crypto-tracker/core run db:seed

# Optional: Run a quick test
log_step "Running TimescaleDB test..."
if [ -f "./scripts/db/test-timescale.sh" ]; then
    ./scripts/db/test-timescale.sh
fi

log_info "Database setup complete!"