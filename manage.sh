#!/bin/bash

# School Management System - Management Script
# Unified script to manage the entire application lifecycle

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Detect Docker Compose command
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE=""
fi

# Helper functions
print_header() {
    echo -e "${BLUE}=============================================="
    echo -e "$1"
    echo -e "==============================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}→ $1${NC}"
}

# Check Docker installation
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi

    if [ -z "$DOCKER_COMPOSE" ]; then
        print_error "Docker Compose is not installed"
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi

    if ! docker info > /dev/null 2>&1; then
        print_error "Docker daemon is not running"
        exit 1
    fi
}

# Install dependencies
install() {
    print_header "Installing School Management System"

    check_docker
    print_success "Docker is installed: $(docker --version)"
    print_success "Docker Compose is installed: $($DOCKER_COMPOSE version)"

    # Create .env file
    if [ ! -f .env ]; then
        print_info "Creating .env file..."
        cp .env.example .env
        print_success ".env file created"

        print_warning "IMPORTANT: Update .env with your configuration:"
        echo "  - Change DB_PASSWORD"
        echo "  - Change JWT_SECRET"
        echo "  - Add SMS gateway API keys"
        echo ""
    else
        print_success ".env file already exists"
    fi

    # Create required directories
    print_info "Creating directories..."
    mkdir -p logs backups
    print_success "Directories created"

    # Pull Docker images
    print_info "Pulling Docker images..."
    $DOCKER_COMPOSE pull
    print_success "Docker images pulled"

    echo ""
    print_success "Installation complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Edit .env file: nano .env"
    echo "  2. Start services: ./manage.sh start"
}

# Configure the system
configure() {
    print_header "Configuration"

    if [ ! -f .env ]; then
        print_error ".env file not found. Run: ./manage.sh install"
        exit 1
    fi

    echo "Current configuration (.env):"
    echo ""
    grep -v '^#' .env | grep -v '^$' || true
    echo ""

    read -p "Do you want to edit the configuration? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ${EDITOR:-nano} .env
        print_success "Configuration updated"
    fi
}

# Start services
start() {
    print_header "Starting School Management System"

    check_docker

    if [ ! -f .env ]; then
        print_warning ".env file not found, creating from template..."
        cp .env.example .env
    fi

    print_info "Starting services..."
    $DOCKER_COMPOSE up -d

    echo ""
    print_info "Waiting for services to be ready..."

    # Wait for database
    echo -n "  Database... "
    sleep 5
    for i in {1..30}; do
        if $DOCKER_COMPOSE exec -T db pg_isready -U school_admin -q 2>/dev/null; then
            echo "✓"
            break
        fi
        echo -n "."
        sleep 2
    done

    # Wait for backend
    echo -n "  Backend... "
    sleep 3
    for i in {1..30}; do
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            echo "✓"
            break
        fi
        echo -n "."
        sleep 2
    done

    # Check if database needs initialization
    echo ""
    TABLES=$($DOCKER_COMPOSE exec -T db psql -U school_admin -d school_management -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo "0")

    if [ "$TABLES" = "0" ]; then
        print_warning "Database is empty. Initializing..."
        $DOCKER_COMPOSE exec -T backend python scripts/init_db.py
        print_success "Database initialized with sample data"
    fi

    echo ""
    print_success "School Management System is running!"
    echo ""
    echo "Access the application:"
    echo "  Frontend:  http://localhost:3000"
    echo "  Backend:   http://localhost:8000"
    echo "  API Docs:  http://localhost:8000/docs"
    echo ""
    echo "Default credentials:"
    echo "  Admin:      admin / admin123"
    echo "  Accountant: accountant / account123"
}

# Stop services
stop() {
    print_header "Stopping School Management System"

    check_docker

    print_info "Stopping services..."
    $DOCKER_COMPOSE down

    echo ""
    print_success "All services stopped"
}

# Restart services
restart() {
    print_header "Restarting School Management System"

    stop
    echo ""
    start
}

# Show status
status() {
    print_header "Service Status"

    check_docker

    $DOCKER_COMPOSE ps

    echo ""
    echo "Service Health:"

    # Check database
    if $DOCKER_COMPOSE exec -T db pg_isready -U school_admin -q 2>/dev/null; then
        print_success "Database is running"
    else
        print_error "Database is not responding"
    fi

    # Check backend
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        print_success "Backend is running"
    else
        print_error "Backend is not responding"
    fi

    # Check frontend
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_success "Frontend is running"
    else
        print_error "Frontend is not responding"
    fi
}

# Show logs
logs() {
    check_docker

    if [ -z "$2" ]; then
        print_info "Showing all logs (Ctrl+C to exit)"
        $DOCKER_COMPOSE logs -f
    else
        print_info "Showing logs for: $2"
        $DOCKER_COMPOSE logs -f "$2"
    fi
}

# Initialize/reset database
init_db() {
    print_header "Database Initialization"

    check_docker

    print_warning "This will initialize/reset the database with sample data"
    read -p "Are you sure? (y/n) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Initializing database..."
        $DOCKER_COMPOSE exec -T backend python scripts/init_db.py
        print_success "Database initialized"
    else
        print_info "Cancelled"
    fi
}

# Backup database
backup() {
    print_header "Database Backup"

    check_docker

    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql.gz"

    print_info "Creating backup: $BACKUP_FILE"
    mkdir -p backups
    $DOCKER_COMPOSE exec -T db pg_dump -U school_admin school_management | gzip > "backups/$BACKUP_FILE"

    print_success "Backup created: backups/$BACKUP_FILE"
    print_info "Size: $(du -h backups/$BACKUP_FILE | cut -f1)"
}

# Restore database
restore() {
    print_header "Database Restore"

    check_docker

    if [ -z "$2" ]; then
        print_error "Usage: ./manage.sh restore <backup-file>"
        echo ""
        echo "Available backups:"
        ls -lh backups/*.sql.gz 2>/dev/null || echo "  No backups found"
        exit 1
    fi

    if [ ! -f "$2" ]; then
        print_error "Backup file not found: $2"
        exit 1
    fi

    print_warning "This will replace the current database!"
    read -p "Are you sure? (y/n) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Restoring from: $2"
        gunzip -c "$2" | $DOCKER_COMPOSE exec -T db psql -U school_admin school_management
        print_success "Database restored"
    else
        print_info "Cancelled"
    fi
}

# Run migrations
migrate() {
    print_header "Database Migration"

    check_docker

    print_info "Running migrations..."
    $DOCKER_COMPOSE exec backend alembic upgrade head
    print_success "Migrations complete"
}

# Access shell
shell() {
    check_docker

    SERVICE="${2:-backend}"

    print_info "Opening shell for: $SERVICE"

    if [ "$SERVICE" = "db" ]; then
        $DOCKER_COMPOSE exec db psql -U school_admin -d school_management
    elif [ "$SERVICE" = "backend" ]; then
        $DOCKER_COMPOSE exec backend bash
    elif [ "$SERVICE" = "frontend" ]; then
        $DOCKER_COMPOSE exec frontend sh
    else
        print_error "Unknown service: $SERVICE"
        echo "Available: backend, frontend, db"
        exit 1
    fi
}

# Clean up everything
clean() {
    print_header "Clean Up"

    check_docker

    print_warning "This will stop all containers and remove volumes (ALL DATA WILL BE LOST!)"
    read -p "Are you sure? (y/n) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Stopping and removing containers..."
        $DOCKER_COMPOSE down -v

        print_info "Removing logs and temp files..."
        rm -rf logs/*.log

        print_success "Cleanup complete"
        echo ""
        echo "To start fresh: ./manage.sh install"
    else
        print_info "Cancelled"
    fi
}

# Update system
update() {
    print_header "System Update"

    check_docker

    print_info "Pulling latest changes..."
    git pull

    print_info "Pulling latest Docker images..."
    $DOCKER_COMPOSE pull

    print_info "Rebuilding containers..."
    $DOCKER_COMPOSE up -d --build

    print_info "Running migrations..."
    $DOCKER_COMPOSE exec backend alembic upgrade head

    print_success "Update complete"
}

# Show help
show_help() {
    print_header "School Management System - Management Script"

    echo "Usage: ./manage.sh <command> [options]"
    echo ""
    echo "Commands:"
    echo ""
    echo "  install          Install and setup the system"
    echo "  configure        Edit configuration (.env file)"
    echo "  start            Start all services"
    echo "  stop             Stop all services"
    echo "  restart          Restart all services"
    echo "  status           Show service status"
    echo "  logs [service]   Show logs (optional: backend, frontend, db)"
    echo ""
    echo "  init-db          Initialize database with sample data"
    echo "  backup           Create database backup"
    echo "  restore <file>   Restore database from backup"
    echo "  migrate          Run database migrations"
    echo ""
    echo "  shell [service]  Access shell (backend, frontend, db)"
    echo "  update           Update system to latest version"
    echo "  clean            Remove all data and containers"
    echo ""
    echo "Examples:"
    echo ""
    echo "  ./manage.sh install              # First time setup"
    echo "  ./manage.sh start                # Start the system"
    echo "  ./manage.sh logs backend         # View backend logs"
    echo "  ./manage.sh backup               # Create database backup"
    echo "  ./manage.sh shell db             # Access database"
    echo "  ./manage.sh restore backup.sql.gz # Restore from backup"
    echo ""
    echo "Quick Start:"
    echo "  1. ./manage.sh install"
    echo "  2. ./manage.sh configure  # (optional)"
    echo "  3. ./manage.sh start"
    echo ""
    echo "Documentation:"
    echo "  README.md              - Project overview"
    echo "  docs/DOCKER_GUIDE.md   - Docker deployment"
    echo "  docs/DEPLOYMENT.md     - Production deployment"
    echo ""
}

# Main command handler
case "${1:-}" in
    install)
        install
        ;;
    configure|config)
        configure
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    logs)
        logs "$@"
        ;;
    init-db)
        init_db
        ;;
    backup)
        backup
        ;;
    restore)
        restore "$@"
        ;;
    migrate)
        migrate
        ;;
    shell)
        shell "$@"
        ;;
    update)
        update
        ;;
    clean)
        clean
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: ${1:-}"
        echo ""
        echo "Run './manage.sh help' for usage information"
        exit 1
        ;;
esac
