#!/bin/bash

service=$1

if [ -z "$service" ]; then
    echo "📋 Showing logs for all services..."
    docker compose logs -f --tail=100
else
    echo "📋 Showing logs for $service..."
    docker compose logs -f --tail=100 "$service"
fi