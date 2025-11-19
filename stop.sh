#!/bin/bash

# School Management System - Stop Script
# This script stops all Docker containers

set -e

echo "=============================================="
echo "School Management System - Stopping Services"
echo "=============================================="
echo ""

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed."
    exit 1
fi

echo "🛑 Stopping all services..."
docker-compose down

echo ""
echo "✅ All services stopped successfully"
echo ""
echo "To start again, run: ./start.sh"
echo "To remove all data: docker-compose down -v"
echo ""
