#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_step() {
    echo -e "\n${BLUE}▶${NC} $1"
}

echo "🗄️  Database Setup"
echo "================"

# Step 1: Run Prisma migrations
log_step "Running Prisma migrations..."
pnpm --filter @crypto-tracker/core run db:push

# Step 2: Initialize TimescaleDB features
log_step "Initializing TimescaleDB..."
./scripts/db/init-timescale.sh

# Step 3: Seed initial data
log_step "Seeding database..."
pnpm --filter @crypto-tracker/core run db:seed

log_info "Database setup complete!"