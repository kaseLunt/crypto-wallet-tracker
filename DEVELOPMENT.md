# Crypto Portfolio Tracker - Development Guide

A comprehensive guide to understanding and managing the development environment for this multi-chain cryptocurrency portfolio tracker.

## 🏗️ Architecture Overview

This project consists of multiple services and components:

### Frontend Applications
- **Web App** (`apps/web`) - Next.js 15 application on port 3000
- **GraphQL Gateway** (`apps/graphql-gateway`) - GraphQL API server on port 4000

### Backend Services
- **Indexer** (`services/indexer`) - Go-based blockchain indexer on port 8081 (HTTP) and 50051 (gRPC)

### Infrastructure Services (Docker)
- **TimescaleDB** - PostgreSQL with time-series extensions on port 5432
- **Redis Stack** - Caching and real-time data on port 6379
- **NATS** - Event streaming on port 4222
- **Jaeger** - Distributed tracing on port 16686
- **pgAdmin** - Database management UI on port 5050 (optional, start with `--profile tools`)

### Shared Packages
- **@crypto-tracker/core** - Database models (Prisma schema) and shared logic
- **@crypto-tracker/proto** - Protocol Buffers for gRPC definitions
- **@crypto-tracker/telemetry** - OpenTelemetry instrumentation
- **@crypto-tracker/ui** - React component library

## 🚀 Quick Start

### Prerequisites
- Node.js 22+
- pnpm 10+
- Docker Desktop
- Go 1.22+ (for indexer development)

### First Time Setup
```bash
# Run the setup script (only needed once)
./scripts/dev/setup.sh
```

This will:
- Check prerequisites
- Create environment files
- Install dependencies
- Generate Prisma client

### Daily Development
```bash
# Start everything (recommended)
pnpm dev:full
```

This starts Docker infrastructure and all applications concurrently.

Your services will be available at:
- Web App: http://localhost:3000
- GraphQL: http://localhost:4000/graphql
- Jaeger UI: http://localhost:16686

Alternatively:
```bash
# Start infrastructure
pnpm dev:infra

# Start apps
pnpm dev
```

## 📋 Available Commands

### Root Level Commands

| Command | Description | What It Does |
|---------|-------------|--------------|
| `pnpm dev` | Start Node.js development servers | Runs web app and GraphQL gateway in parallel |
| `pnpm dev:full` | Complete development startup | Starts infrastructure + apps |
| `pnpm dev:infra` | Start Docker services only | Starts database, Redis, NATS, indexer, etc. |
| `pnpm dev` | Start Node.js apps only | Starts web and GraphQL (after infra) |
| `pnpm build` | Build all applications | Production builds |
| `pnpm lint` | Code linting | Runs Biome across monorepo |
| `pnpm test` | Run all tests | Executes tests across packages |
| `pnpm type-check` | TypeScript validation | Checks types |
| `pnpm format` | Code formatting | Formats with Biome |
| `pnpm clean` | Clean artifacts | Removes dist/, .next/, etc. |

### Docker Management

| Command | Description | Ports Affected |
|---------|-------------|----------------|
| `pnpm docker:start` | Start all Docker services | 5432, 6379, 4222, etc. |
| `pnpm docker:stop` | Stop all Docker services | - |
| `pnpm docker:reset` | Reset Docker environment | ⚠️ Deletes all data |
| `pnpm docker:logs [service]` | View service logs | - |
| `pnpm docker:psql` | Connect to PostgreSQL | - |
| `pnpm docker:redis-cli` | Connect to Redis | - |

To start optional tools like pgAdmin:
```bash
docker compose --profile tools up -d
```

### Database Management

| Command | Description |
|---------|-------------|
| `pnpm --filter @crypto-tracker/core run db:push` | Apply schema changes |
| `pnpm --filter @crypto-tracker/core run db:seed` | Seed sample data |
| `pnpm --filter @crypto-tracker/core run db:generate` | Generate Prisma client |
| `pnpm --filter @crypto-tracker/core run db:reset` | ⚠️ Reset database |
| `./scripts/db/init-timescale.sh` | Initialize TimescaleDB extensions |
| `./scripts/db/test-timescale.sh` | Test TimescaleDB setup |

### Code Generation

| Command | Description |
|---------|-------------|
| `pnpm --filter @crypto-tracker/graphql-gateway run codegen` | Generate GraphQL types |
| `pnpm --filter @crypto-tracker/proto run generate` | Generate ProtoBuf code |

For indexer (Go):
- Use `air` for hot-reloading (configured in .air.toml)

## 🌐 Service Ports & URLs

### Core Services
| Service | Port | URL | Description |
|---------|------|-----|-------------|
| Web App | 3000 | http://localhost:3000 | Frontend |
| GraphQL Gateway | 4000 | http://localhost:4000/graphql | API endpoint |
| Indexer HTTP | 8081 | http://localhost:8081 | Indexer metrics/health |
| Indexer gRPC | 50051 | - | gRPC endpoint |
| TimescaleDB | 5432 | postgresql://postgres:postgres@localhost:5432/crypto_tracker | Database |
| Redis | 6379 | redis://:redis@localhost:6379 | Cache |
| NATS | 4222 | nats://nats:nats@localhost:4222 | Messaging |

### UI/Monitoring
| Service | Port | URL | Description |
|---------|------|-----|-------------|
| Redis Insight | 8001 | http://localhost:8001 | Redis UI |
| NATS Monitor | 8222 | http://localhost:8222 | NATS stats |
| Jaeger UI | 16686 | http://localhost:16686 | Tracing |
| pgAdmin | 5050 | http://localhost:5050 | Database UI (optional) |

## 🔄 Development Workflows

### Starting Development
```bash
# Full stack
pnpm dev:full

# Infrastructure only
pnpm dev:infra

# Apps only
pnpm dev

# Indexer only (from services/indexer)
air
```

### Database Changes
1. Edit `packages/core/prisma/schema.prisma`
2. Run `pnpm --filter @crypto-tracker/core run db:push`
3. Regenerate client: `pnpm --filter @crypto-tracker/core run db:generate`
4. If time-series changes: Run `./scripts/db/init-timescale.sh`

### GraphQL Changes
1. Edit schema in `apps/graphql-gateway/src/schema/`
2. Run `pnpm --filter @crypto-tracker/graphql-gateway run codegen`
3. Update resolvers in `apps/graphql-gateway/src/resolvers.ts`

### Proto Changes
1. Edit proto files in `packages/proto/`
2. Run `pnpm --filter @crypto-tracker/proto run generate`

### UI Components
1. Edit in `packages/ui/src/components/`
2. Test in isolation or in web app

### Go Indexer
- Run `air` in `services/indexer/` for hot-reloading
- Build: `go build ./cmd/indexer`

## 🧪 Infrastructure Health Checks

Run `./scripts/health-check.sh` for comprehensive checks including:
- Docker services
- Application endpoints
- Infrastructure health
- Code quality (types/lint)
- Database status

### Detailed Diagnostics
```bash
# Service logs
pnpm docker:logs [service]

# Database
pnpm docker:psql
# Commands: \dt crypto.*; \dt analytics.*;

# Redis
pnpm docker:redis-cli
# Commands: INFO; KEYS *

# TimescaleDB hypertables
docker compose exec timescaledb psql -U postgres -d crypto_tracker -c "SELECT * FROM timescaledb_information.hypertables;"
```

## 🐛 Common Issues & Solutions

### Port Conflicts
```bash
lsof -i :3000  # Check port
kill -9 $(lsof -ti:3000)  # Kill process
```

### Docker Issues
```bash
pnpm docker:reset  # Reset environment
docker compose build --no-cache  # Rebuild
docker system prune  # Cleanup
```

### Database Issues
```bash
pnpm --filter @crypto-tracker/core run db:reset  # Reset DB
./scripts/db/init-timescale.sh  # Re-init Timescale
pnpm docker:logs timescaledb  # View logs
```

### Node Issues
```bash
pnpm clean:all && pnpm install  # Reinstall
rm -rf apps/web/.next  # Clear Next cache
rm -rf .turbo  # Clear Turbo cache
```

### Go Indexer Issues
- Ensure Go 1.22+ installed
- Run `go mod tidy` in `services/indexer`
- Check logs: `pnpm docker:logs indexer`

## 📁 Project Structure

```
kaselunt-crypto-wallet-tracker.git/
├── README.md
├── biome.json
├── DEVELOPMENT.md
├── docker-compose.yml
├── pnpm-workspace.yaml
├── turbo.json
├── apps/
│   ├── graphql-gateway/
│   └── web/
├── docker/
│   ├── config/
│   │   ├── nats/
│   │   ├── redis/
│   │   └── timescaledb/
│   └── scripts/
├── packages/
│   ├── core/
│   ├── proto/
│   ├── telemetry/
│   └── ui/
├── scripts/
│   ├── dev.sh
│   ├── health-check.sh
│   ├── db/
│   └── dev/
└── services/
    └── indexer/
```

## 🔧 Environment Variables

### `.env.local` (Applications)
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/crypto_tracker"
REDIS_URL="redis://:redis@localhost:6379"
NATS_URL="nats://nats:nats@localhost:4222"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318"
```

### `.env.docker` (Infrastructure)
```bash
POSTGRES_PASSWORD=postgres
REDIS_PASSWORD=redis
PGADMIN_PASSWORD=admin
ETHEREUM_RPC_URL=your_rpc_url
```

## 🚨 Emergency Procedures

### Full Reset
```bash
pnpm clean:all
pnpm docker:reset
rm -f .setup-complete
./scripts/dev/setup.sh
pnpm dev:full
```

### Database Backup/Restore
```bash
# Backup
docker compose exec timescaledb pg_dump -U postgres crypto_tracker > backup.sql

# Restore
docker compose exec -T timescaledb psql -U postgres crypto_tracker < backup.sql
```

## 📚 Additional Resources

- [Next.js Docs](https://nextjs.org/docs)
- [GraphQL Yoga Docs](https://the-guild.dev/graphql/yoga-server)
- [Prisma Docs](https://www.prisma.io/docs)
- [TimescaleDB Docs](https://docs.timescale.com)
- [Go Ethereum Docs](https://geth.ethereum.org/docs)
- [NATS Docs](https://docs.nats.io)
- [OpenTelemetry Docs](https://opentelemetry.io/docs)

## 🤝 Contributing

1. Run `./scripts/health-check.sh`
2. `pnpm test`
3. `pnpm type-check`
4. `pnpm format`
5. `pnpm lint`

**Need Help?** Run health checks, check logs, or reset if needed.