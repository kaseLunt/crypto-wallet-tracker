#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
# shellcheck disable=SC2034
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_step() {
    echo -e "\n${BLUE}▶${NC} $1"
}

# Main development script
echo "🚀 Starting Crypto Tracker Development Environment"
echo "================================================"

# Check if setup has been run
if [ ! -f .setup-complete ]; then
    echo "First time setup required. Running setup script..."
    ./scripts/dev/setup.sh
    # shellcheck disable=SC2181
    if [ $? -ne 0 ]; then
        exit 1
    fi
fi

# Step 1: Start Docker services
log_step "Starting Docker services..."
pnpm docker:start

# Step 2: Wait for database to be ready
log_step "Waiting for database..."
attempts=0
until docker compose exec -T timescaledb pg_isready -U postgres >/dev/null 2>&1; do
    if [ $attempts -eq 30 ]; then
        echo "Database failed to start"
        exit 1
    fi
    echo -n "."
    sleep 1
    attempts=$((attempts + 1))
done
echo " Ready!"

# Step 3: Run database migrations
log_step "Running database migrations..."
pnpm --filter @crypto-tracker/core run db:push

# Step 4: Seed database (only if empty)
log_step "Checking database seed..."
WALLET_COUNT=$(docker compose exec -T timescaledb psql -U postgres -d crypto_tracker -t -c "SELECT COUNT(*) FROM crypto.wallets;" 2>/dev/null || echo "0")
if [ "$WALLET_COUNT" -eq "0" ]; then
    log_info "Seeding database..."
    pnpm --filter @crypto-tracker/core run db:seed
else
    log_info "Database already has data"
fi

# Step 5: Generate GraphQL types
log_step "Generating GraphQL types..."
pnpm --filter @crypto-tracker/graphql-gateway run codegen

# Step 6: Start development servers
log_step "Starting development servers..."
echo ""
echo "📡 Services will be available at:"
echo "  - Web App:     http://localhost:3000"
echo "  - GraphQL:     http://localhost:4000/graphql"
echo "  - Database:    postgresql://localhost:5432/crypto_tracker"
echo "  - Redis:       redis://localhost:6379"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Start all dev servers
pnpm dev