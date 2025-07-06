#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REQUIRED_NODE_VERSION="22"
REQUIRED_PNPM_VERSION="10"

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

log_step() {
    echo -e "\n${BLUE}▶${NC} $1"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

version_gte() {
    # Compare version numbers
    [ "$(printf '%s\n' "$2" "$1" | sort -V | head -n1)" = "$2" ]
}

# Main setup script
echo "🔧 Crypto Tracker Development Environment Setup"
echo "=============================================="

# Step 1: Check system requirements
log_step "Checking system requirements..."

# Check OS
OS="unknown"
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    log_info "Detected macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    log_info "Detected Linux"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
    log_info "Detected Windows (WSL recommended)"
fi

# Step 2: Check required tools
log_step "Checking required tools..."

# Check Node.js
if ! command_exists node; then
    log_error "Node.js is not installed"
    echo "Please install Node.js ${REQUIRED_NODE_VERSION}.x or higher from https://nodejs.org/"
    exit 1
else
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt "$REQUIRED_NODE_VERSION" ]; then
        log_error "Node.js version $NODE_VERSION is too old (need ${REQUIRED_NODE_VERSION}+)"
        exit 1
    else
        log_info "Node.js $(node -v) installed"
    fi
fi

# Check pnpm
if ! command_exists pnpm; then
    log_warn "pnpm is not installed"
    echo "Installing pnpm..."
    npm install -g pnpm@${REQUIRED_PNPM_VERSION}
    log_info "pnpm installed successfully"
else
    PNPM_VERSION=$(pnpm -v | cut -d'.' -f1)
    if [ "$PNPM_VERSION" -lt "$REQUIRED_PNPM_VERSION" ]; then
        log_error "pnpm version $PNPM_VERSION is too old (need ${REQUIRED_PNPM_VERSION}+)"
        echo "Run: npm install -g pnpm@${REQUIRED_PNPM_VERSION}"
        exit 1
    else
        log_info "pnpm $(pnpm -v) installed"
    fi
fi

# Check Docker
if ! command_exists docker; then
    log_error "Docker is not installed"
    echo "Please install Docker Desktop from https://www.docker.com/products/docker-desktop/"
    exit 1
else
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker daemon is not running"
        echo "Please start Docker Desktop"
        exit 1
    else
        log_info "Docker $(docker --version | cut -d' ' -f3 | tr -d ',') installed and running"
    fi
fi

# Check Docker Compose v2
if ! docker compose version >/dev/null 2>&1; then
    log_error "Docker Compose v2 is not available"
    echo "Please update Docker Desktop to the latest version"
    exit 1
else
    log_info "Docker Compose $(docker compose version --short) installed"
fi

# Step 3: Setup environment files
log_step "Setting up environment files..."

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    log_info "Creating .env.local from .env.example"
    if [ -f .env.example ]; then
        cp .env.example .env.local
    else
        # Create a basic .env.local
        cat > .env.local << 'EOF'
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/crypto_tracker?schema=public"
DIRECT_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/crypto_tracker?schema=public"

# Redis
REDIS_URL="redis://:redis@localhost:6379"

# NATS
NATS_URL="nats://nats:nats@localhost:4222"

# GraphQL
GRAPHQL_ENDPOINT="http://localhost:4000/graphql"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_GRAPHQL_ENDPOINT="http://localhost:4000/graphql"

# Development
NODE_ENV="development"
EOF
        log_info "Created .env.local with default values"
    fi
else
    log_info ".env.local already exists"
fi

# Create .env.docker if it doesn't exist
if [ ! -f .env.docker ]; then
    log_info "Creating .env.docker"
    cat > .env.docker << 'EOF'
# PostgreSQL/TimescaleDB
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=crypto_tracker

# Redis
REDIS_PASSWORD=redis

# NATS
NATS_USER=nats
NATS_PASSWORD=nats

# pgAdmin
PGADMIN_EMAIL=admin@crypto-tracker.local
PGADMIN_PASSWORD=admin
EOF
    log_info "Created .env.docker with default values"
else
    log_info ".env.docker already exists"
fi

# Step 4: Create required directories
log_step "Creating required directories..."

directories=(
    "docker/data/timescaledb"
    "docker/data/redis"
    "docker/data/nats"
    "docker/data/pgadmin"
    "logs"
    "generated"
)

for dir in "${directories[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        log_info "Created $dir"
    fi
done

# Step 5: Install dependencies
log_step "Installing dependencies..."

pnpm install

# Step 6: Generate Prisma client
log_step "Generating Prisma client..."

pnpm --filter @crypto-tracker/core run db:generate

# Step 7: Make scripts executable
log_step "Making scripts executable..."

find ./scripts -type f -name "*.sh" -exec chmod +x {} \;
find ./docker/scripts -type f -name "*.sh" -exec chmod +x {} \;

# Step 8: System-specific setup
if [ "$OS" = "macos" ]; then
    log_step "macOS-specific setup..."

    # Check if Docker Desktop has enough resources
    DOCKER_MEM=$(docker system info --format '{{.MemTotal}}' 2>/dev/null || echo "0")
    DOCKER_MEM_GB=$((DOCKER_MEM / 1073741824))

    if [ "$DOCKER_MEM_GB" -lt 4 ]; then
        log_warn "Docker Desktop has only ${DOCKER_MEM_GB}GB memory allocated"
        echo "Recommended: 4GB+ for optimal performance"
        echo "You can increase this in Docker Desktop > Preferences > Resources"
    fi
fi

# Step 9: Final checks
log_step "Running final checks..."

# Check if ports are available
ports=(3000 4000 5432 6379 4222 8222)
for port in "${ports[@]}"; do
    if lsof -Pi :"$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warn "Port $port is already in use"
    fi
done

# Create a setup completion marker
touch .setup-complete
date > .setup-complete

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Review and update .env.local with your settings"
echo "  2. Run 'pnpm docker:start' to start Docker services"
echo "  3. Run 'pnpm --filter @crypto-tracker/core run db:push' to setup database"
echo "  4. Run 'pnpm dev' to start the development servers"
echo ""
echo "For more information, see README.md"