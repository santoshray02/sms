#!/bin/bash

# School Management System - Stop Script
# This script stops all Docker containers

set -e

echo "=============================================="
echo "School Management System - Stopping Services"
echo "=============================================="
echo ""

# Check if docker-compose (v1) or docker compose (v2) is available
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ Docker Compose is not installed."
    exit 1
fi

echo "🛑 Stopping all services..."
$DOCKER_COMPOSE down

echo ""
echo "✅ All services stopped successfully"
echo ""
echo "To start again, run: ./start.sh"
echo "To remove all data: docker-compose down -v"
echo ""
