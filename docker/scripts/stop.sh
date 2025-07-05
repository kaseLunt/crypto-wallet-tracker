#!/bin/bash
set -e

echo "🛑 Stopping Crypto Tracker Docker services..."

docker compose down

echo "✅ Services stopped successfully!"