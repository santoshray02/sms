#!/bin/bash
# ERPNext Education Management Script
# Simple script to manage your school deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory for portability
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Configuration file path (relative to script directory)
CONFIG_FILE="${CONFIG_FILE:-${SCRIPT_DIR}/.school.conf}"

# Default values
USERNAME=$(whoami)
SCHOOL_CODE=""
BASE_PORT=8080
HTTPS_PORT=8443
ERPNEXT_VERSION="version-15"
SITE_NAME="school.localhost"

# Data directory (store everything in script directory)
DATA_DIR="${SCRIPT_DIR}/data"
COMPOSE_DIR="${SCRIPT_DIR}/deployments"

# Function to load configuration
load_config() {
    local config_path="$1"

    if [ ! -f "$config_path" ]; then
        print_error "Configuration file not found: $config_path"
        print_info "Create a configuration file based on .school.conf.example"
        print_info "Example: cp .school.conf.example .school.conf"
        exit 1
    fi

    # Source the config file
    # shellcheck disable=SC1090
    source "$config_path"

    # Validate required fields
    if [ -z "$SCHOOL_CODE" ]; then
        print_error "SCHOOL_CODE not set in configuration file"
        exit 1
    fi

    print_info "Loaded configuration: $config_path"
    print_info "School Code: $SCHOOL_CODE"
    print_info "Container Pattern: ${USERNAME}_${SCHOOL_CODE}"
}

# Get username for project naming
USERNAME=$(whoami)

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ ${NC}$1"
}

print_success() {
    echo -e "${GREEN}✓ ${NC}$1"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${NC}$1"
}

print_error() {
    echo -e "${RED}✗ ${NC}$1"
}

# Function to get project name from config
get_project_name() {
    echo "${USERNAME}_${SCHOOL_CODE}"
}

# Function to get compose file path
get_compose_file() {
    local project_name=$(get_project_name)
    echo "${COMPOSE_DIR}/${project_name}-compose.yml"
}

# Function to get env file path
get_env_file() {
    local project_name=$(get_project_name)
    echo "${COMPOSE_DIR}/${project_name}.env"
}

# Function to get credentials file path
get_credentials_file() {
    local project_name=$(get_project_name)
    echo "${DATA_DIR}/${project_name}-credentials.txt"
}

# Function to show config info
show_config_info() {
    load_config "$CONFIG_FILE"

    local project_name=$(get_project_name)
    local compose_file=$(get_compose_file)
    local creds_file=$(get_credentials_file)

    echo -e "\n${BLUE}Configuration Info:${NC}\n"
    echo -e "  School Code: ${YELLOW}${SCHOOL_CODE}${NC}"
    echo -e "  Container Pattern: ${YELLOW}${project_name}${NC}"
    echo -e "  Base Port: ${YELLOW}${BASE_PORT}${NC}"
    if [ -n "$HTTPS_PORT" ]; then
        echo -e "  HTTPS Port: ${YELLOW}${HTTPS_PORT}${NC}"
    fi
    echo -e "  Site Name: ${YELLOW}${SITE_NAME}${NC}"
    echo ""

    # Check container status
    local running=$(docker ps --filter "name=${project_name}" --format '{{.Names}}' | wc -l)
    local total=$(docker ps -a --filter "name=${project_name}" --format '{{.Names}}' | wc -l)

    if [ "$running" -gt 0 ]; then
        echo -e "  Status: ${GREEN}●${NC} Running (${running}/${total} containers)"
    elif [ "$total" -gt 0 ]; then
        echo -e "  Status: ${YELLOW}●${NC} Stopped (${total} containers)"
    else
        echo -e "  Status: ${RED}●${NC} Not deployed"
    fi

    if [ -f "$compose_file" ]; then
        echo -e "  Compose file: ${compose_file}"
    fi

    if [ -f "$creds_file" ]; then
        echo -e "  Credentials: ${creds_file}"
    fi
    echo ""
}

# Function to start a project
start_project() {
    load_config "$CONFIG_FILE"

    local project_name=$(get_project_name)
    local compose_file=$(get_compose_file)
    local creds_file=$(get_credentials_file)

    print_info "Starting project: ${SCHOOL_CODE}"

    if [ ! -f "$compose_file" ]; then
        print_error "Compose file not found: ${compose_file}"
        print_info "Run 'install' command first to deploy the instance"
        exit 1
    fi

    docker compose -p "$project_name" -f "$compose_file" start
    print_success "Project ${SCHOOL_CODE} started"

    # Show access info
    echo ""
    print_info "Access your site:"
    if [ -n "$BASE_PORT" ]; then
        echo "  URL: http://localhost:${BASE_PORT}"
    fi
    if [ -n "$HTTPS_PORT" ]; then
        echo "  HTTPS: https://localhost:${HTTPS_PORT}"
    fi
    if [ -f "$creds_file" ]; then
        echo "  Credentials: cat ${creds_file}"
    fi
}

# Function to stop a project
stop_project() {
    load_config "$CONFIG_FILE"

    local project_name=$(get_project_name)
    local compose_file=$(get_compose_file)

    print_info "Stopping project: ${SCHOOL_CODE}"

    if [ ! -f "$compose_file" ]; then
        print_error "Compose file not found: ${compose_file}"
        exit 1
    fi

    docker compose -p "$project_name" -f "$compose_file" stop
    print_success "Project ${SCHOOL_CODE} stopped"
}

# Function to restart a project
restart_project() {
    load_config "$CONFIG_FILE"

    local project_name=$(get_project_name)
    local compose_file=$(get_compose_file)

    print_info "Restarting project: ${SCHOOL_CODE}"

    if [ ! -f "$compose_file" ]; then
        print_error "Compose file not found: ${compose_file}"
        exit 1
    fi

    docker compose -p "$project_name" -f "$compose_file" restart
    print_success "Project ${SCHOOL_CODE} restarted"
}

# Function to show status
status_project() {
    load_config "$CONFIG_FILE"

    local project_name=$(get_project_name)
    local compose_file=$(get_compose_file)

    print_info "Status for project: ${SCHOOL_CODE}"
    echo ""

    if [ ! -f "$compose_file" ]; then
        print_error "Compose file not found: ${compose_file}"
        print_info "Run 'install' command first to deploy the instance"
        exit 1
    fi

    docker compose -p "$project_name" -f "$compose_file" ps
}

# Function to show logs
logs_project() {
    load_config "$CONFIG_FILE"

    local project_name=$(get_project_name)
    local compose_file=$(get_compose_file)

    if [ ! -f "$compose_file" ]; then
        print_error "Compose file not found: ${compose_file}"
        exit 1
    fi

    print_info "Showing logs for project: ${SCHOOL_CODE} (Ctrl+C to exit)"
    echo ""
    docker compose -p "$project_name" -f "$compose_file" logs -f --tail=100
}

# Function to access shell
shell_project() {
    load_config "$CONFIG_FILE"

    local project_name=$(get_project_name)
    local compose_file=$(get_compose_file)

    if [ ! -f "$compose_file" ]; then
        print_error "Compose file not found: ${compose_file}"
        exit 1
    fi

    print_info "Accessing backend shell for project: ${SCHOOL_CODE}"
    echo ""
    docker compose -p "$project_name" -f "$compose_file" exec backend bash
}

# Function to show help
show_help() {
    cat << EOF
${BLUE}ERPNext Education Management Script${NC}

${GREEN}Usage:${NC}
  $0 <command> [options]
  CONFIG_FILE=path/to/config.conf $0 <command>

${GREEN}Commands:${NC}
  ${YELLOW}info${NC}              Show configuration and deployment info
  ${YELLOW}install${NC}           Deploy a new school instance
  ${YELLOW}start${NC}             Start the school instance
  ${YELLOW}stop${NC}              Stop the school instance
  ${YELLOW}restart${NC}           Restart the school instance
  ${YELLOW}status${NC}            Show detailed container status
  ${YELLOW}logs${NC}              Show and follow logs
  ${YELLOW}shell${NC}             Access backend shell
  ${YELLOW}help${NC}              Show this help message

${GREEN}Configuration:${NC}
  The script reads configuration from .school.conf in the script directory.
  You can override this by setting the CONFIG_FILE environment variable.

  Example config files:
    - .school.conf (default)
    - .school-main.conf
    - .school-branch.conf

${GREEN}Examples:${NC}
  # Show current configuration info
  $0 info

  # Use default config (.school.conf)
  $0 install
  $0 start
  $0 stop
  $0 status
  $0 logs
  $0 shell

  # Use specific config file for multiple schools
  CONFIG_FILE=.school-main.conf $0 start
  CONFIG_FILE=.school-branch.conf $0 start
  CONFIG_FILE=.school-main.conf $0 status

${GREEN}Configuration File:${NC}
  Copy .school.conf.example to .school.conf and customize:
    cp .school.conf.example .school.conf
    vim .school.conf

  Required fields:
    - SCHOOL_CODE: Unique identifier for the school
    - BASE_PORT: Port for HTTP access

${GREEN}Container Naming:${NC}
  Containers are named using pattern: ${USERNAME}_<SCHOOL_CODE>
  Example: ${USERNAME}_main_school

${GREEN}File Locations:${NC}
  - Configurations: ${SCRIPT_DIR}/.school*.conf
  - Compose files: ${SCRIPT_DIR}/deployments/
  - Data files: ${SCRIPT_DIR}/data/
  - Credentials: ${SCRIPT_DIR}/data/*-credentials.txt

EOF
}

# Main script logic
case "${1:-help}" in
    info)
        show_config_info
        ;;
    install)
        print_error "Install command not yet implemented"
        print_info "This will deploy a new ERPNext instance based on your configuration"
        exit 1
        ;;
    start)
        start_project
        ;;
    stop)
        stop_project
        ;;
    restart)
        restart_project
        ;;
    status|ps)
        status_project
        ;;
    logs)
        logs_project
        ;;
    shell|bash|exec)
        shell_project
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
