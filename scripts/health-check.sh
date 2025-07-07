#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_success() {
    echo -e "${GREEN}✅${NC} $1"
}

log_error() {
    echo -e "${RED}❌${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

log_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

log_step() {
    echo -e "\n${BLUE}▶${NC} $1"
}

# Track overall health
HEALTH_ISSUES=0

echo "🏥 Crypto Tracker Infrastructure Health Check"
echo "============================================="

# Step 1: Check Docker services
log_step "Checking Docker Services"
if ! command -v docker >/dev/null 2>&1; then
    log_error "Docker is not installed"
    HEALTH_ISSUES=$((HEALTH_ISSUES + 1))
elif ! docker info >/dev/null 2>&1; then
    log_error "Docker daemon is not running"
    HEALTH_ISSUES=$((HEALTH_ISSUES + 1))
else
    log_success "Docker is running"

    # Check individual services
    echo ""
    echo "📦 Docker Service Status:"
    docker compose ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || {
        log_error "Cannot get Docker service status"
        HEALTH_ISSUES=$((HEALTH_ISSUES + 1))
    }
fi

# Step 2: Check application endpoints
log_step "Checking Application Health"

# Web App (Next.js)
if curl -s --max-time 5 http://localhost:3000 >/dev/null 2>&1; then
    log_success "Web App (port 3000) - Running"
else
    log_error "Web App (port 3000) - Not responding"
    HEALTH_ISSUES=$((HEALTH_ISSUES + 1))
fi

# GraphQL Gateway
if curl -s --max-time 5 http://localhost:4000/graphql >/dev/null 2>&1; then
    log_success "GraphQL Gateway (port 4000) - Running"
else
    log_error "GraphQL Gateway (port 4000) - Not responding"
    HEALTH_ISSUES=$((HEALTH_ISSUES + 1))
fi

# Step 3: Check infrastructure services
log_step "Checking Infrastructure Services"

# TimescaleDB
if docker compose exec -T timescaledb pg_isready -U postgres >/dev/null 2>&1; then
    log_success "TimescaleDB (port 5432) - Running"

    # Check database connectivity
    DB_TABLES=$(docker compose exec -T timescaledb psql -U postgres -d crypto_tracker -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema IN ('crypto', 'analytics');" 2>/dev/null | tr -d ' ')
    if [ "$DB_TABLES" -gt 0 ]; then
        log_success "Database schema exists ($DB_TABLES tables)"
    else
        log_warning "Database schema not found - run 'pnpm --filter @crypto-tracker/core run db:push'"
        HEALTH_ISSUES=$((HEALTH_ISSUES + 1))
    fi
else
    log_error "TimescaleDB (port 5432) - Not responding"
    HEALTH_ISSUES=$((HEALTH_ISSUES + 1))
fi

# Redis
if docker compose exec -T redis redis-cli -a redis ping >/dev/null 2>&1; then
    log_success "Redis (port 6379) - Running"
else
    log_error "Redis (port 6379) - Not responding"
    HEALTH_ISSUES=$((HEALTH_ISSUES + 1))
fi

# NATS
if curl -s --max-time 5 http://localhost:8222/healthz >/dev/null 2>&1; then
    log_success "NATS (port 4222) - Running"
else
    log_error "NATS (port 4222) - Not responding"
    HEALTH_ISSUES=$((HEALTH_ISSUES + 1))
fi

# Step 4: Check optional services
log_step "Checking Optional Services"

# Jaeger
if curl -s --max-time 5 http://localhost:16686 >/dev/null 2>&1; then
    log_success "Jaeger UI (port 16686) - Running"
else
    log_info "Jaeger UI (port 16686) - Not running (optional)"
fi

# Redis Insight
if curl -s --max-time 5 http://localhost:8001 >/dev/null 2>&1; then
    log_success "Redis Insight (port 8001) - Running"
else
    log_info "Redis Insight (port 8001) - Not running (optional)"
fi

# Step 5: Check development tools
log_step "Checking Development Environment"

# Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node -v)
    log_success "Node.js $NODE_VERSION installed"
else
    log_error "Node.js not found"
    HEALTH_ISSUES=$((HEALTH_ISSUES + 1))
fi

# pnpm
if command -v pnpm >/dev/null 2>&1; then
    PNPM_VERSION=$(pnpm -v)
    log_success "pnpm $PNPM_VERSION installed"
else
    log_error "pnpm not found"
    HEALTH_ISSUES=$((HEALTH_ISSUES + 1))
fi

# TypeScript check
log_step "Checking Code Quality"

if pnpm type-check >/dev/null 2>&1; then
    log_success "TypeScript - No type errors"
else
    log_warning "TypeScript - Has type errors (run 'pnpm type-check' for details)"
    HEALTH_ISSUES=$((HEALTH_ISSUES + 1))
fi

# Linting check
if pnpm lint >/dev/null 2>&1; then
    log_success "Linting - Clean"
else
    log_warning "Linting - Has issues (run 'pnpm lint' for details)"
    HEALTH_ISSUES=$((HEALTH_ISSUES + 1))
fi

# Step 6: Database detailed check
if [ $HEALTH_ISSUES -eq 0 ] || docker compose exec -T timescaledb pg_isready -U postgres >/dev/null 2>&1; then
    log_step "Database Detailed Status"

    echo ""
    echo "📊 Database Tables:"
    docker compose exec -T timescaledb psql -U postgres -d crypto_tracker -c "
    SELECT
        schemaname || '.' || tablename as table_name,
        COALESCE(n_tup_ins, 0) as inserts,
        COALESCE(n_tup_upd, 0) as updates,
        COALESCE(n_tup_del, 0) as deletes
    FROM pg_stat_user_tables
    WHERE schemaname IN ('crypto', 'analytics')
    ORDER BY schemaname, tablename;
    " 2>/dev/null || log_warning "Could not fetch database statistics"

    # Check TimescaleDB hypertables
    echo ""
    echo "⏰ TimescaleDB Hypertables:"
    docker compose exec -T timescaledb psql -U postgres -d crypto_tracker -c "
    SELECT
        hypertable_schema || '.' || hypertable_name as hypertable,
        CASE WHEN compression_enabled THEN 'Yes' ELSE 'No' END as compression
    FROM timescaledb_information.hypertables
    WHERE hypertable_schema IN ('crypto', 'analytics');
    " 2>/dev/null || log_info "No TimescaleDB hypertables found (run database setup if needed)"
fi

# Step 7: Port usage check
log_step "Checking Port Usage"

REQUIRED_PORTS=(3000 4000 5432 6379 4222)
for port in "${REQUIRED_PORTS[@]}"; do
    if lsof -Pi :"$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
        PROCESS=$(lsof -Pi :"$port" -sTCP:LISTEN -t | head -1)
        PROCESS_NAME=$(ps -p "$PROCESS" -o comm= 2>/dev/null || echo "unknown")
        log_success "Port $port - In use by $PROCESS_NAME (PID: $PROCESS)"
    else
        log_warning "Port $port - Not in use"
        HEALTH_ISSUES=$((HEALTH_ISSUES + 1))
    fi
done

# Step 8: Environment files check
log_step "Checking Environment Configuration"

if [ -f ".env.local" ]; then
    log_success ".env.local exists"
else
    log_warning ".env.local missing (run setup script)"
    HEALTH_ISSUES=$((HEALTH_ISSUES + 1))
fi

if [ -f ".env.docker" ]; then
    log_success ".env.docker exists"
else
    log_warning ".env.docker missing (run setup script)"
    HEALTH_ISSUES=$((HEALTH_ISSUES + 1))
fi

# Step 9: Final summary
echo ""
echo "🏁 Health Check Summary"
echo "======================"

if [ $HEALTH_ISSUES -eq 0 ]; then
    log_success "All systems operational! 🎉"
    echo ""
    echo "🌐 Quick Access URLs:"
    echo "  • Web App:      http://localhost:3000"
    echo "  • GraphQL:      http://localhost:4000/graphql"
    echo "  • Redis UI:     http://localhost:8001"
    echo "  • NATS Monitor: http://localhost:8222"
    echo "  • Jaeger UI:    http://localhost:16686"
    exit 0
else
    log_error "Found $HEALTH_ISSUES issue(s) that need attention"
    echo ""
    echo "🔧 Common fixes:"
    echo "  • Start services:    pnpm docker:start"
    echo "  • Setup database:    pnpm --filter @crypto-tracker/core run db:push"
    echo "  • Start apps:        pnpm dev"
    echo "  • Full reset:        pnpm docker:reset && ./scripts/dev/setup.sh"
    echo "  • Check logs:        pnpm docker:logs [service]"
    exit 1
fi