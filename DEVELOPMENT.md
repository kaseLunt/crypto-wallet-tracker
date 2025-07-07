# Crypto Portfolio Tracker - Development Guide

A comprehensive guide to understanding and managing the development environment for this multi-chain cryptocurrency portfolio tracker.

## 🏗️ Architecture Overview

This project consists of multiple services and components:

### Frontend Applications
- **Web App** (`apps/web`) - Next.js 15 application on port 3000
- **GraphQL Gateway** (`apps/graphql-gateway`) - GraphQL API server on port 4000

### Infrastructure Services (Docker)
- **TimescaleDB** - PostgreSQL with time-series extensions on port 5432
- **Redis Stack** - Caching and real-time data on port 6379
- **NATS** - Event streaming on port 4222
- **Jaeger** - Distributed tracing on port 16686
- **pgAdmin** - Database management UI on port 5050 (optional)

### Shared Packages
- **@crypto-tracker/core** - Database models and shared logic
- **@crypto-tracker/ui** - React component library
- **@crypto-tracker/telemetry** - OpenTelemetry instrumentation
- **@crypto-tracker/tsconfig** - Shared TypeScript configurations

## 🚀 Quick Start

### Prerequisites
- Node.js 22+
- pnpm 10+
- Docker Desktop

### First Time Setup
```bash
# Run the setup script (only needed once)
./scripts/dev/setup.sh

# Or manually:
pnpm install
pnpm docker:start
pnpm --filter @crypto-tracker/core run db:push
pnpm --filter @crypto-tracker/core run db:seed
```

### Daily Development
```bash
# Start everything (recommended)
pnpm dev:full

# Or start services separately:
pnpm docker:start        # Start Docker services
pnpm dev                 # Start development servers
```

## 📋 Available Commands

### Root Level Commands

| Command | Description | What It Does |
|---------|-------------|--------------|
| `pnpm dev` | Start all development servers | Runs web app, GraphQL gateway in parallel |
| `pnpm dev:full` | Complete development startup | Runs setup script + starts all services |
| `pnpm dev:services` | Start Docker services only | Starts database, Redis, NATS, etc. |
| `pnpm dev:apps` | Start applications only | Starts web app and GraphQL gateway |
| `pnpm build` | Build all applications | Production builds for deployment |
| `pnpm test` | Run all tests | Executes test suites across packages |
| `pnpm type-check` | TypeScript validation | Checks types without building |
| `pnpm lint` | Code linting | Runs Biome linter on all packages |
| `pnpm format` | Code formatting | Formats code with Biome |
| `pnpm clean` | Clean build artifacts | Removes dist/, .next/, node_modules |

### Docker Management

| Command | Description | Ports |
|---------|-------------|-------|
| `pnpm docker:start` | Start all Docker services | See port table below |
| `pnpm docker:stop` | Stop all Docker services | - |
| `pnpm docker:reset` | Reset Docker environment | ⚠️ Deletes all data |
| `pnpm docker:logs [service]` | View service logs | - |
| `pnpm docker:psql` | Connect to PostgreSQL | - |
| `pnpm docker:redis-cli` | Connect to Redis | - |

### Database Management

| Command | Description |
|---------|-------------|
| `pnpm --filter @crypto-tracker/core run db:push` | Apply schema changes |
| `pnpm --filter @crypto-tracker/core run db:seed` | Seed with sample data |
| `pnpm --filter @crypto-tracker/core run db:studio` | Open Prisma Studio |
| `pnpm --filter @crypto-tracker/core run db:generate` | Generate Prisma client |
| `pnpm --filter @crypto-tracker/core run db:reset` | ⚠️ Reset database |

### Code Generation

| Command | Description |
|---------|-------------|
| `pnpm generate` | Generate all code (GraphQL types, Prisma client) |
| `pnpm --filter @crypto-tracker/graphql-gateway run codegen` | Generate GraphQL types |

## 🌐 Service Ports & URLs

### Development Services
| Service | Port | URL | Description |
|---------|------|-----|-------------|
| Web App | 3000 | http://localhost:3000 | Main application |
| GraphQL Gateway | 4000 | http://localhost:4000/graphql | API + GraphiQL |
| TimescaleDB | 5432 | postgresql://localhost:5432/crypto_tracker | Database |
| Redis | 6379 | redis://localhost:6379 | Cache & sessions |
| Redis Insight | 8001 | http://localhost:8001 | Redis management UI |
| NATS | 4222 | nats://localhost:4222 | Message streaming |
| NATS Monitor | 8222 | http://localhost:8222 | NATS monitoring |
| Jaeger UI | 16686 | http://localhost:16686 | Distributed tracing |
| pgAdmin | 5050 | http://localhost:5050 | Database management |

### Observability (Optional)
| Service | Port | URL | Description |
|---------|------|-----|-------------|
| Prometheus | 9090 | http://localhost:9090 | Metrics collection |
| Grafana | 3001 | http://localhost:3001 | Metrics dashboards |
| OTEL Collector | 4318/4319 | - | Telemetry collection |

## 🔄 Development Workflows

### Starting Development
```bash
# Option 1: Everything at once (recommended)
pnpm dev:full

# Option 2: Step by step
pnpm docker:start
pnpm dev

# Option 3: Services only (for backend work)
pnpm dev:services
pnpm --filter @crypto-tracker/graphql-gateway run dev
```

### Making Database Changes
```bash
# 1. Edit schema in packages/core/prisma/schema.prisma
# 2. Apply changes
pnpm --filter @crypto-tracker/core run db:push
# 3. Regenerate client
pnpm --filter @crypto-tracker/core run db:generate
```

### Adding New GraphQL Types
```bash
# 1. Edit schema files in apps/graphql-gateway/src/schema/
# 2. Regenerate types
pnpm --filter @crypto-tracker/graphql-gateway run codegen
# 3. Update resolvers in apps/graphql-gateway/src/resolvers.ts
```

### Working with UI Components
```bash
# Start Storybook (if available)
pnpm --filter @crypto-tracker/ui run storybook

# Test components in isolation
pnpm --filter @crypto-tracker/ui run dev
```

## 🧪 Infrastructure Health Checks

### Quick Health Check Script
Create and run this script to verify everything is working:

```bash
#!/bin/bash
# Save as scripts/health-check.sh

echo "🏥 Infrastructure Health Check"
echo "=============================="

# Check Docker services
echo "📦 Docker Services:"
docker compose ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}"

# Check application endpoints
echo -e "\n🌐 Application Health:"

# Web App
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Web App (3000) - Running"
else
    echo "❌ Web App (3000) - Down"
fi

# GraphQL Gateway
if curl -s http://localhost:4000/graphql > /dev/null; then
    echo "✅ GraphQL Gateway (4000) - Running"
else
    echo "❌ GraphQL Gateway (4000) - Down"
fi

# Database
if docker compose exec -T timescaledb pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ TimescaleDB (5432) - Running"
else
    echo "❌ TimescaleDB (5432) - Down"
fi

# Redis
if docker compose exec -T redis redis-cli -a redis ping > /dev/null 2>&1; then
    echo "✅ Redis (6379) - Running"
else
    echo "❌ Redis (6379) - Down"
fi

# NATS
if curl -s http://localhost:8222/healthz > /dev/null; then
    echo "✅ NATS (4222) - Running"
else
    echo "❌ NATS (4222) - Down"
fi

echo -e "\n📊 Database Status:"
docker compose exec -T timescaledb psql -U postgres -d crypto_tracker -c "
SELECT 
    schemaname || '.' || tablename as table_name,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables 
WHERE schemaname IN ('crypto', 'analytics')
ORDER BY schemaname, tablename;
" 2>/dev/null || echo "❌ Cannot connect to database"

echo -e "\n🔧 TypeScript Status:"
pnpm type-check --silent && echo "✅ TypeScript - No errors" || echo "❌ TypeScript - Has errors"

echo -e "\n📝 Linting Status:"
pnpm lint --silent && echo "✅ Linting - Clean" || echo "❌ Linting - Has issues"

echo -e "\n✨ Health check complete!"
```

### Detailed Diagnostics

```bash
# Check specific service logs
pnpm docker:logs timescaledb
pnpm docker:logs redis
pnpm docker:logs nats

# Check application logs
# (Applications log to console when running with pnpm dev)

# Database diagnostics
pnpm docker:psql
# Then run: \dt crypto.*; \dt analytics.*;

# Redis diagnostics
pnpm docker:redis-cli
# Then run: INFO, KEYS *

# Check TimescaleDB hypertables
docker compose exec timescaledb psql -U postgres -d crypto_tracker -c "
SELECT hypertable_schema, hypertable_name, compression_enabled 
FROM timescaledb_information.hypertables;"
```

## 🐛 Common Issues & Solutions

### Port Conflicts
```bash
# Check what's using a port
lsof -i :3000
lsof -i :4000
lsof -i :5432

# Kill process using port
kill -9 $(lsof -ti:3000)
```

### Docker Issues
```bash
# Reset Docker environment
pnpm docker:reset

# Rebuild containers
docker compose build --no-cache

# Check Docker resources
docker system df
docker system prune  # Clean up unused resources
```

### Database Issues
```bash
# Reset database completely
pnpm --filter @crypto-tracker/core run db:reset

# Check database connection
pnpm docker:psql

# View database logs
pnpm docker:logs timescaledb
```

### Node.js Issues
```bash
# Clear all node_modules and reinstall
pnpm clean:all
pnpm install

# Clear Next.js cache
rm -rf apps/web/.next

# Clear Turbo cache
rm -rf .turbo
```

## 📁 Project Structure

```
crypto-portfolio-tracker/
├── apps/
│   ├── web/                    # Next.js frontend
│   └── graphql-gateway/        # GraphQL API server
├── packages/
│   ├── core/                   # Database models & shared logic
│   ├── ui/                     # React component library
│   ├── telemetry/              # OpenTelemetry instrumentation
│   └── tsconfig/               # Shared TypeScript configs
├── docker/
│   ├── config/                 # Service configurations
│   ├── data/                   # Persistent data (gitignored)
│   └── scripts/                # Docker utility scripts
├── scripts/
│   ├── dev/                    # Development scripts
│   └── db/                     # Database scripts
├── docker-compose.yml          # Main services
├── docker-compose.observability.yml  # Monitoring stack
└── turbo.json                  # Monorepo configuration
```

## 🔧 Environment Variables

### Required Files
- `.env.local` - Application environment variables
- `.env.docker` - Docker service configuration

### Key Variables
```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/crypto_tracker"

# GraphQL
GRAPHQL_ENDPOINT="http://localhost:4000/graphql"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Development
NODE_ENV="development"
```

## 🚨 Emergency Procedures

### Complete Reset
```bash
# Nuclear option - reset everything
pnpm clean:all
pnpm docker:reset
rm -rf .setup-complete
./scripts/dev/setup.sh
pnpm dev:full
```

### Backup Important Data
```bash
# Backup database
docker compose exec timescaledb pg_dump -U postgres crypto_tracker > backup.sql

# Restore database
docker compose exec -T timescaledb psql -U postgres crypto_tracker < backup.sql
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [GraphQL Yoga Documentation](https://the-guild.dev/graphql/yoga-server)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TimescaleDB Documentation](https://docs.timescale.com)
- [Docker Compose Documentation](https://docs.docker.com/compose)

## 🤝 Contributing

1. Run health checks before committing: `./scripts/health-check.sh`
2. Ensure all tests pass: `pnpm test`
3. Check TypeScript: `pnpm type-check`
4. Format code: `pnpm format`
5. Lint code: `pnpm check`

---

**Need Help?** Check the logs, run health checks, or reset the environment if needed.