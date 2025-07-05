#!/bin/bash
set -e

echo "⚠️  WARNING: This will delete all Docker data!"
read -p "Are you sure? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi

echo "🧹 Resetting Docker environment..."

# Stop services
docker compose down -v

# Remove data directories
rm -rf docker/data/*

# Recreate data directories
mkdir -p docker/data/{timescaledb,redis,nats,pgadmin}

echo "✅ Docker environment reset successfully!"