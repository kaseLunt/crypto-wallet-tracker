#!/bin/bash
set -e

echo "🚀 Starting Crypto Tracker Docker services..."

# Load environment variables safely
if [ -f .env.docker ]; then
    # The 'set -a' command tells the shell to automatically export
    # any variables that are created or modified.
    set -a

    # The 'source' command executes the file in the current shell context,
    # which loads the variables. Because of 'set -a', they are exported.
    source .env.docker

    # The 'set +a' command disables the auto-export behavior.
    set +a
fi

# Create data directories if they don't exist
mkdir -p docker/data/{timescaledb,redis,nats,pgadmin}

# Start services using modern docker compose command
docker compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check service health
docker compose ps

echo "✅ Services started successfully!"
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