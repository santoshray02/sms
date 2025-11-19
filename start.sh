#!/bin/bash

# School Management System - Quick Start Script
# This script sets up and starts the entire application with Docker

set -e

echo "=============================================="
echo "School Management System - Quick Start"
echo "=============================================="
echo ""

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if docker-compose (v1) or docker compose (v2) is available
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✓ Docker is installed: $(docker --version)"
echo "✓ Docker Compose is installed: $($DOCKER_COMPOSE version)"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✓ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Please update .env file with your configuration before production use!"
    echo "   - Change DB_PASSWORD"
    echo "   - Change JWT_SECRET (generate with: python -c 'import secrets; print(secrets.token_urlsafe(32))')"
    echo "   - Add SMS gateway API keys if needed"
    echo ""
else
    echo "✓ .env file exists"
    echo ""
fi

# Check if Docker daemon is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker daemon is not running. Please start Docker first."
    exit 1
fi

echo "🚀 Starting services..."
echo ""

# Stop any running containers
echo "→ Stopping any existing containers..."
$DOCKER_COMPOSE down > /dev/null 2>&1 || true

# Start services
echo "→ Starting PostgreSQL, Backend, and Frontend..."
$DOCKER_COMPOSE up -d

echo ""
echo "⏳ Waiting for services to be ready..."
echo ""

# Wait for database
echo -n "→ Waiting for database... "
sleep 5
until $DOCKER_COMPOSE exec -T db pg_isready -U school_admin -q 2>/dev/null; do
    echo -n "."
    sleep 2
done
echo " ✓"

# Wait for backend
echo -n "→ Waiting for backend... "
sleep 3
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo " ✓"
        break
    fi
    echo -n "."
    sleep 2
done

echo ""

# Check if database is already initialized
echo "→ Checking database..."
TABLES=$($DOCKER_COMPOSE exec -T db psql -U school_admin -d school_management -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')

if [ "$TABLES" -eq "0" ]; then
    echo "→ Initializing database with sample data..."
    $DOCKER_COMPOSE exec -T backend python scripts/init_db.py
    echo "✓ Database initialized"
else
    echo "✓ Database already initialized ($TABLES tables found)"
fi

echo ""
echo "=============================================="
echo "✅ School Management System is ready!"
echo "=============================================="
echo ""
echo "📱 Access the application:"
echo ""
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo ""
echo "🔐 Default credentials:"
echo ""
echo "   Admin:      admin / admin123"
echo "   Accountant: accountant / account123"
echo ""
echo "=============================================="
echo ""
echo "📋 Useful commands:"
echo ""
echo "   View logs:           docker-compose logs -f backend"
echo "   Stop services:       docker-compose down"
echo "   Restart services:    docker-compose restart"
echo "   Database shell:      docker-compose exec db psql -U school_admin -d school_management"
echo "   Backend shell:       docker-compose exec backend bash"
echo ""
echo "📚 Documentation:"
echo ""
echo "   Docker Guide:        docs/DOCKER_GUIDE.md"
echo "   API Testing:         backend/API_TESTING_GUIDE.md"
echo "   Deployment:          docs/DEPLOYMENT.md"
echo ""
echo "=============================================="
