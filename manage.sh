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
EMAIL=""
ADMIN_PASSWORD=""

# Data directory (store everything in script directory)
DATA_DIR="${SCRIPT_DIR}/data"

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

# Function to get env file path
get_env_file() {
    local project_name=$(get_project_name)
    echo "${DATA_DIR}/${project_name}.env"
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
    local env_file=$(get_env_file)
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

    if [ -f "$env_file" ]; then
        echo -e "  Environment file: ${env_file}"
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
    local env_file=$(get_env_file)
    local creds_file=$(get_credentials_file)

    print_info "Starting project: ${SCHOOL_CODE}"

    if [ ! -f "$env_file" ]; then
        print_error "Environment file not found: ${env_file}"
        print_info "Run 'install' command first to deploy the instance"
        exit 1
    fi

    docker compose -p "$project_name" --env-file "$env_file" start
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
    local env_file=$(get_env_file)

    print_info "Stopping project: ${SCHOOL_CODE}"

    if [ ! -f "$env_file" ]; then
        print_error "Environment file not found: ${env_file}"
        exit 1
    fi

    docker compose -p "$project_name" --env-file "$env_file" stop
    print_success "Project ${SCHOOL_CODE} stopped"
}

# Function to restart a project
restart_project() {
    load_config "$CONFIG_FILE"

    local project_name=$(get_project_name)
    local env_file=$(get_env_file)

    print_info "Restarting project: ${SCHOOL_CODE}"

    if [ ! -f "$env_file" ]; then
        print_error "Environment file not found: ${env_file}"
        exit 1
    fi

    docker compose -p "$project_name" --env-file "$env_file" restart
    print_success "Project ${SCHOOL_CODE} restarted"
}

# Function to show status
status_project() {
    load_config "$CONFIG_FILE"

    local project_name=$(get_project_name)
    local env_file=$(get_env_file)

    print_info "Status for project: ${SCHOOL_CODE}"
    echo ""

    if [ ! -f "$env_file" ]; then
        print_error "Environment file not found: ${env_file}"
        print_info "Run 'install' command first to deploy the instance"
        exit 1
    fi

    docker compose -p "$project_name" --env-file "$env_file" ps
}

# Function to show logs
logs_project() {
    load_config "$CONFIG_FILE"

    local project_name=$(get_project_name)
    local env_file=$(get_env_file)

    if [ ! -f "$env_file" ]; then
        print_error "Environment file not found: ${env_file}"
        exit 1
    fi

    print_info "Showing logs for project: ${SCHOOL_CODE} (Ctrl+C to exit)"
    echo ""
    docker compose -p "$project_name" --env-file "$env_file" logs -f --tail=100
}

# Function to access shell
shell_project() {
    load_config "$CONFIG_FILE"

    local project_name=$(get_project_name)
    local env_file=$(get_env_file)

    if [ ! -f "$env_file" ]; then
        print_error "Environment file not found: ${env_file}"
        exit 1
    fi

    print_info "Accessing backend shell for project: ${SCHOOL_CODE}"
    echo ""
    docker compose -p "$project_name" --env-file "$env_file" exec backend bash
}

# Function to set hostname for site
set_hostname() {
    load_config "$CONFIG_FILE"

    local project_name=$(get_project_name)
    local env_file=$(get_env_file)
    local hostname="$1"

    if [ -z "$hostname" ]; then
        print_error "Hostname required"
        echo "Usage: $0 set-hostname <hostname>"
        echo "Example: $0 set-hostname internal3.paperentry.ai"
        exit 1
    fi

    if [ ! -f "$env_file" ]; then
        print_error "Environment file not found: ${env_file}"
        print_info "Run 'install' command first to deploy the instance"
        exit 1
    fi

    print_info "Setting hostname to: ${hostname}"

    # Set host_name in site config
    docker compose -p "$project_name" --env-file "$env_file" exec -T backend \
        bench --site "${SITE_NAME}" set-config host_name "http://${hostname}:${BASE_PORT}"

    if [ $? -ne 0 ]; then
        print_error "Failed to set hostname config"
        exit 1
    fi

    # Create symlink for hostname routing
    print_info "Creating site symlink for hostname..."
    docker compose -p "$project_name" --env-file "$env_file" exec -T backend \
        bash -c "cd sites && ln -sf '${SITE_NAME}' '${hostname}'"

    if [ $? -eq 0 ]; then
        print_success "Hostname set successfully"
        echo ""
        print_info "Restarting services to apply changes..."
        docker compose -p "$project_name" --env-file "$env_file" restart frontend websocket backend
        echo ""
        print_success "Site can now be accessed at: http://${hostname}:${BASE_PORT}"
    else
        print_error "Failed to create hostname symlink"
        exit 1
    fi
}

# Function to setup SSL certificate
setup_ssl() {
    load_config "$CONFIG_FILE"

    local project_name=$(get_project_name)
    local env_file=$(get_env_file)

    if [ ! -f "$env_file" ]; then
        print_error "Environment file not found: ${env_file}"
        print_info "Run 'install' command first to deploy the instance"
        exit 1
    fi

    if [ -z "$CUSTOM_DOMAIN" ]; then
        print_error "CUSTOM_DOMAIN not set in .school.conf"
        print_info "Please set CUSTOM_DOMAIN before setting up SSL"
        exit 1
    fi

    # Validate domain
    if [[ "$CUSTOM_DOMAIN" =~ \.localhost$ ]]; then
        print_error "SSL cannot be enabled for .localhost domains"
        exit 1
    fi

    # Validate email
    if [ -z "$SSL_EMAIL" ] || [ "$SSL_EMAIL" = "admin@localhost" ]; then
        print_error "SSL_EMAIL must be set to a real email address"
        print_info "Please update SSL_EMAIL in .school.conf"
        exit 1
    fi

    print_info "Setting up SSL certificate for ${CUSTOM_DOMAIN}"
    echo ""
    print_warning "Requirements for SSL to work:"
    print_warning "  ✓ Domain ${CUSTOM_DOMAIN} must point to this server's public IP"
    print_warning "  ✓ Ports 80 and 443 must be accessible from the internet"
    print_warning "  ✓ DNS propagation must be complete"
    echo ""
    read -p "Have you verified the above requirements? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        print_info "SSL setup cancelled"
        exit 0
    fi

    print_info "Obtaining SSL certificate from Let's Encrypt..."
    docker compose -p "$project_name" --env-file "$env_file" exec -T backend \
        sudo -H bench setup lets-encrypt "${SITE_NAME}" --custom-domain "${CUSTOM_DOMAIN}"

    if [ $? -eq 0 ]; then
        print_success "SSL certificate obtained and configured successfully"
        echo ""
        print_info "Updating site configuration..."

        # Update host_name to use https
        docker compose -p "$project_name" --env_file "$env_file" exec -T backend \
            bench --site "${SITE_NAME}" set-config host_name "https://${CUSTOM_DOMAIN}"

        print_info "Restarting services..."
        docker compose -p "$project_name" --env-file "$env_file" restart frontend websocket backend

        echo ""
        print_success "SSL setup complete!"
        print_success "Site can now be accessed at: https://${CUSTOM_DOMAIN}"
        print_info "Certificate will auto-renew before expiration"
    else
        print_error "SSL setup failed"
        echo ""
        print_info "Common issues:"
        print_info "  - Domain not pointing to this server"
        print_info "  - Ports 80/443 not accessible from internet"
        print_info "  - Firewall blocking access"
        print_info "  - DNS not propagated yet (can take up to 48 hours)"
        echo ""
        print_info "After fixing the issue, try again with: ./manage.sh setup-ssl"
        exit 1
    fi
}

# Function to generate passwords
generate_password() {
    openssl rand -hex 12
}

# Function to install a new project
install_project() {
    load_config "$CONFIG_FILE"

    local project_name=$(get_project_name)
    local env_file=$(get_env_file)
    local creds_file=$(get_credentials_file)

    print_info "Installing project: ${SCHOOL_CODE}"
    echo ""

    # Check if already installed
    if [ -f "$env_file" ]; then
        print_error "Project already installed: ${env_file}"
        print_info "Use 'start' command to start the existing project"
        exit 1
    fi

    # Create directories if they don't exist
    mkdir -p "$DATA_DIR"

    print_info "Generating configuration files..."

    # Generate passwords if not provided
    local admin_pass="${ADMIN_PASSWORD:-$(generate_password)}"
    local db_pass="$(generate_password | cut -c1-9)"

    # Calculate consecutive ports
    local db_port=$((BASE_PORT + 1))
    local redis_cache_port=$((BASE_PORT + 2))
    local redis_queue_port=$((BASE_PORT + 3))
    local redis_socketio_port=$((BASE_PORT + 4))

    # Create environment file
    cat > "$env_file" << EOF
# ERPNext Configuration for ${SCHOOL_CODE}
COMPOSE_PROJECT_NAME=${project_name}
ERPNEXT_VERSION=${ERPNEXT_VERSION}
DB_PASSWORD=${db_pass}
DB_HOST=db
DB_PORT=3306
REDIS_CACHE=redis-cache:6379
REDIS_QUEUE=redis-queue:6379
REDIS_SOCKETIO=redis-socketio:6379
LETSENCRYPT_EMAIL=${EMAIL:-admin@localhost}
SITE_ADMIN_PASS=${admin_pass}
SITES=\`${SITE_NAME}\`
PULL_POLICY=missing
HTTP_PUBLISH_PORT=${BASE_PORT}
DB_PUBLISH_PORT=${db_port}
REDIS_CACHE_PUBLISH_PORT=${redis_cache_port}
REDIS_QUEUE_PUBLISH_PORT=${redis_queue_port}
REDIS_SOCKETIO_PUBLISH_PORT=${redis_socketio_port}
EOF

    print_success "Environment file created: ${env_file}"

    # Save credentials
    cat > "$creds_file" << EOF
# ERPNext Credentials for ${SCHOOL_CODE}
# Generated on $(date)

Site Name: ${SITE_NAME}
Site URL: http://localhost:${BASE_PORT}
$([ -n "$HTTPS_PORT" ] && echo "HTTPS URL: https://localhost:${HTTPS_PORT}")

Administrator Username: Administrator
Administrator Password: ${admin_pass}

MariaDB Root Password: ${db_pass}

Database Port: ${db_port}
Redis Cache Port: ${redis_cache_port}
Redis Queue Port: ${redis_queue_port}

Project Name: ${project_name}
Environment File: ${env_file}
EOF

    chmod 600 "$creds_file"
    print_success "Credentials saved: ${creds_file}"

    # Start containers
    echo ""
    print_info "Starting Docker containers..."
    docker compose -p "$project_name" --env-file "$env_file" up -d

    if [ $? -ne 0 ]; then
        print_error "Failed to start Docker containers"
        exit 1
    fi

    print_success "Docker containers started"

    # Wait for services to be ready
    print_info "Waiting for services to initialize (this may take a minute)..."
    sleep 30

    # Create site
    print_info "Creating ERPNext site: ${SITE_NAME}"
    docker compose -p "$project_name" --env-file "$env_file" exec -T backend \
        bench new-site "$SITE_NAME" \
        --mariadb-root-password "$db_pass" \
        --admin-password "$admin_pass" \
        --install-app erpnext \
        --set-default

    if [ $? -ne 0 ]; then
        print_error "Failed to create site"
        print_info "You can try creating the site manually:"
        print_info "  docker compose -p ${project_name} --env-file ${env_file} exec backend bash"
        print_info "  Then run: bench new-site ${SITE_NAME} --mariadb-root-password <password> --admin-password <password> --install-app erpnext --set-default"
        exit 1
    fi

    print_success "Site created successfully"

    # Fix database permissions for container restarts
    print_info "Configuring database permissions..."
    local site_db_name=$(docker compose -p "$project_name" --env-file "$env_file" exec -T backend \
        bench --site "$SITE_NAME" get-site-config db_name 2>/dev/null | tr -d '\r')
    local site_db_user=$(docker compose -p "$project_name" --env-file "$env_file" exec -T backend \
        bench --site "$SITE_NAME" get-site-config db_name 2>/dev/null | tr -d '\r')
    local site_db_pass=$(docker compose -p "$project_name" --env-file "$env_file" exec -T backend \
        bench --site "$SITE_NAME" get-site-config db_password 2>/dev/null | tr -d '\r')

    if [ -n "$site_db_user" ] && [ -n "$site_db_pass" ]; then
        docker compose -p "$project_name" --env-file "$env_file" exec -T db \
            mysql -uroot -p"$db_pass" -e "GRANT ALL PRIVILEGES ON \`$site_db_name\`.* TO '$site_db_user'@'%' IDENTIFIED BY '$site_db_pass'; FLUSH PRIVILEGES;" 2>/dev/null
        print_success "Database permissions configured for container mobility"
    fi

    # Automatic School Setup
    echo ""
    print_info "Installing Education app and school data..."
    echo ""

    # Install Education app
    print_info "Step 1: Installing Education app (this takes ~5 minutes)..."
    docker compose -p "$project_name" --env-file "$env_file" exec -T backend \
        bash -c "cd /home/frappe/frappe-bench && bench get-app education --branch version-15" 2>&1 | grep -v "^$" || true

    docker compose -p "$project_name" --env-file "$env_file" exec -T backend \
        bench --site "$SITE_NAME" install-app education

    if [ $? -eq 0 ]; then
        print_success "Education app installed"
    else
        print_warning "Education app installation had issues (may already be installed)"
    fi

    # Wait for app to be ready
    sleep 10

    # Copy and run school setup script
    print_info "Step 2: Creating school data (programs, courses, users, students)..."

    # Find backend container
    local backend_container=$(docker ps --filter "name=backend" --format "{{.Names}}" | grep "$project_name" | head -1)

    if [ -n "$backend_container" ] && [ -f "complete_school_setup.py" ]; then
        # Copy setup script to container
        cat complete_school_setup.py | docker exec -i "$backend_container" \
            bash -c "cat > /home/frappe/frappe-bench/apps/frappe/frappe/school_setup.py && chmod 644 /home/frappe/frappe-bench/apps/frappe/frappe/school_setup.py"

        # Execute setup
        docker exec -w /home/frappe/frappe-bench "$backend_container" \
            bench --site "$SITE_NAME" execute frappe.school_setup.main

        if [ $? -eq 0 ]; then
            print_success "School data created successfully"
        else
            print_warning "School setup had some issues (check logs for details)"
        fi
    else
        print_warning "School setup script not found (complete_school_setup.py)"
        print_info "You can run it manually later: ./install-education-and-setup.sh"
    fi

    # Configure custom domain if set
    if [ -n "$CUSTOM_DOMAIN" ]; then
        echo ""
        print_info "Configuring custom domain: ${CUSTOM_DOMAIN}"

        local protocol="http"
        local port_suffix=":${BASE_PORT}"

        # Determine protocol and port based on SSL settings
        if [ "$SSL_ENABLED" = "true" ]; then
            protocol="https"
            # Standard HTTPS port (443) doesn't need to be shown in URL
            if [ "${BASE_PORT}" = "443" ] || [ "${HTTPS_PORT}" = "443" ]; then
                port_suffix=""
            else
                port_suffix=":${HTTPS_PORT:-${BASE_PORT}}"
            fi
        fi

        # Set host_name in site config
        docker compose -p "$project_name" --env-file "$env_file" exec -T backend \
            bench --site "${SITE_NAME}" set-config host_name "${protocol}://${CUSTOM_DOMAIN}${port_suffix}"

        # Create symlink for hostname routing
        docker compose -p "$project_name" --env-file "$env_file" exec -T backend \
            bash -c "cd sites && ln -sf '${SITE_NAME}' '${CUSTOM_DOMAIN}'"

        if [ $? -eq 0 ]; then
            print_success "Custom domain configured successfully"

            # Setup SSL if enabled
            if [ "$SSL_ENABLED" = "true" ]; then
                print_info "Setting up SSL certificate for ${CUSTOM_DOMAIN}..."

                # Validate requirements
                if [[ "$CUSTOM_DOMAIN" =~ \.localhost$ ]]; then
                    print_warning "SSL cannot be enabled for .localhost domains"
                    print_info "Skipping SSL setup..."
                elif [ -z "$SSL_EMAIL" ] || [ "$SSL_EMAIL" = "admin@localhost" ]; then
                    print_warning "SSL_EMAIL must be set to a real email address for SSL"
                    print_info "Please update .school.conf with a valid SSL_EMAIL"
                    print_info "Then run: ./manage.sh setup-ssl"
                else
                    # Use Frappe's built-in SSL setup
                    print_info "Obtaining SSL certificate from Let's Encrypt..."
                    print_warning "Note: This requires DNS to be properly configured and accessible from the internet"
                    docker compose -p "$project_name" --env-file "$env_file" exec -T backend \
                        sudo -H bench setup lets-encrypt "${SITE_NAME}" --custom-domain "${CUSTOM_DOMAIN}"

                    if [ $? -eq 0 ]; then
                        print_success "SSL certificate obtained and configured"
                        print_info "Certificate will auto-renew before expiration"
                    else
                        print_warning "SSL setup failed. Common issues:"
                        print_warning "  - Domain must point to this server's public IP"
                        print_warning "  - Ports 80 and 443 must be accessible from internet"
                        print_warning "  - DNS propagation may take time"
                        print_info "You can retry later with: ./manage.sh setup-ssl"
                    fi
                fi
            fi

            # Restart services to apply changes
            print_info "Restarting services..."
            docker compose -p "$project_name" --env-file "$env_file" restart frontend websocket backend
            print_success "Services restarted"
        else
            print_warning "Failed to configure custom domain (you can set it later with: ./manage.sh set-hostname ${CUSTOM_DOMAIN})"
        fi
    fi

    # Show summary
    echo ""
    echo "========================================"
    print_success "Installation completed successfully!"
    echo "========================================"
    echo ""
    print_info "Access your site:"
    echo "  URL: http://localhost:${BASE_PORT}"
    if [ -n "$CUSTOM_DOMAIN" ]; then
        if [ "$SSL_ENABLED" = "true" ]; then
            echo "  Custom Domain: https://${CUSTOM_DOMAIN}"
        else
            echo "  Custom Domain: http://${CUSTOM_DOMAIN}:${BASE_PORT}"
        fi
    fi
    if [ -n "$HTTPS_PORT" ]; then
        echo "  HTTPS: https://localhost:${HTTPS_PORT}"
    fi
    echo ""
    print_info "Administrator Account:"
    echo "  Username: Administrator"
    echo "  Password: ${admin_pass}"
    echo ""
    print_info "School User Accounts:"
    echo "  Principal:   principal@school.local   / principal123"
    echo "  Teacher 1:   teacher1@school.local    / teacher123"
    echo "  Teacher 2:   teacher2@school.local    / teacher123"
    echo "  Teacher 3:   teacher3@school.local    / teacher123"
    echo "  Accountant:  accountant@school.local  / accounts123"
    echo ""
    print_warning "⚠️  Change all default passwords immediately!"
    echo ""
    print_info "Credentials file: ${creds_file}"
    echo ""
    print_info "What was created:"
    echo "  ✓ 20 CBSE Programs (Playgroup to Class 12)"
    echo "  ✓ 19 CBSE Courses"
    echo "  ✓ 23 Classrooms"
    echo "  ✓ 5 Sample Users + 5 Sample Students"
    echo ""
    print_warning "⚠️  Fee Structures Setup Required:"
    echo "  1. Complete ERPNext Setup Wizard (creates company)"
    echo "  2. Run: ./manage.sh setup-fees"
    echo ""
    print_info "Management commands:"
    echo "  ./manage.sh status  - Check status"
    echo "  ./manage.sh logs    - View logs"
    echo "  ./manage.sh shell   - Access shell"
    echo "  ./manage.sh stop    - Stop services"
    echo "  ./manage.sh start   - Start services"
    echo ""
    print_info "See QUICK_SETUP.md for daily operations guide"
    echo ""
}

# Function to recreate containers (keeps data)
recreate_project() {
    load_config "$CONFIG_FILE"

    local project_name=$(get_project_name)
    local env_file=$(get_env_file)

    print_info "Recreating containers for project: ${SCHOOL_CODE}"

    if [ ! -f "$env_file" ]; then
        print_error "Environment file not found: ${env_file}"
        print_info "Run 'install' command first to deploy the instance"
        exit 1
    fi

    print_warning "This will recreate all containers but keep your data"
    echo ""

    # Stop and remove containers (but keep volumes)
    docker compose -p "$project_name" --env-file "$env_file" down

    # Recreate containers
    docker compose -p "$project_name" --env-file "$env_file" up -d

    if [ $? -eq 0 ]; then
        print_success "Containers recreated successfully"
        echo ""
        print_info "Check status with: ./manage.sh status"
    else
        print_error "Failed to recreate containers"
        exit 1
    fi
}

# Function to rebuild containers (with image pull)
rebuild_project() {
    load_config "$CONFIG_FILE"

    local project_name=$(get_project_name)
    local env_file=$(get_env_file)

    print_info "Rebuilding project: ${SCHOOL_CODE}"

    if [ ! -f "$env_file" ]; then
        print_error "Environment file not found: ${env_file}"
        print_info "Run 'install' command first to deploy the instance"
        exit 1
    fi

    print_warning "This will pull new images and recreate containers (data will be kept)"
    echo ""

    # Stop and remove containers
    docker compose -p "$project_name" --env-file "$env_file" down

    # Pull latest images
    print_info "Pulling latest images..."
    docker compose -p "$project_name" --env-file "$env_file" pull

    # Recreate containers
    print_info "Recreating containers..."
    docker compose -p "$project_name" --env-file "$env_file" up -d

    if [ $? -eq 0 ]; then
        print_success "Project rebuilt successfully"
        echo ""
        print_info "Check status with: ./manage.sh status"
    else
        print_error "Failed to rebuild project"
        exit 1
    fi
}

# Function to reset project (delete everything)
reset_project() {
    load_config "$CONFIG_FILE"

    local project_name=$(get_project_name)
    local env_file=$(get_env_file)
    local creds_file=$(get_credentials_file)

    print_warning "⚠️  WARNING: This will DELETE ALL DATA for ${SCHOOL_CODE} ⚠️"
    echo ""
    echo "This includes:"
    echo "  - All containers"
    echo "  - All volumes (database, sites, redis data)"
    echo "  - Configuration files"
    echo ""
    read -p "Type 'DELETE' to confirm: " confirm

    if [ "$confirm" != "DELETE" ]; then
        print_info "Reset cancelled"
        exit 0
    fi

    print_info "Resetting project: ${SCHOOL_CODE}"

    # Stop and remove everything including volumes
    if [ -f "$env_file" ]; then
        docker compose -p "$project_name" --env-file "$env_file" down -v
    fi

    # Remove config files
    if [ -f "$env_file" ]; then
        rm -f "$env_file"
        print_success "Removed: ${env_file}"
    fi

    if [ -f "$creds_file" ]; then
        rm -f "$creds_file"
        print_success "Removed: ${creds_file}"
    fi

    print_success "Project reset complete"
    echo ""
    print_info "You can now run './manage.sh install' to create a fresh installation"
}

# Function to setup fee structures
setup_fee_structures() {
    load_config "$CONFIG_FILE"

    local project_name=$(get_project_name)
    local env_file=$(get_env_file)

    print_info "Setting up fee structures for: ${SCHOOL_CODE}"

    if [ ! -f "$env_file" ]; then
        print_error "Environment file not found: ${env_file}"
        print_info "Run 'install' command first to deploy the instance"
        exit 1
    fi

    # Find backend container
    local backend_container=$(docker ps --filter "name=${project_name}.*backend" --format "{{.Names}}" | head -1)

    if [ -z "$backend_container" ]; then
        print_error "Backend container not found. Is the instance running?"
        print_info "Run './manage.sh status' to check container status"
        exit 1
    fi

    print_info "Creating fee structures for all CBSE programs..."
    echo ""

    # Create inline Python script for fee structures
    docker exec -i "$backend_container" bash -c "cat > /tmp/setup_fee_structures.py" << 'EOFPYTHON'
import frappe

def setup_fee_structures():
    """Create fee structures for all CBSE programs"""

    # Check if company exists
    companies = frappe.get_all("Company", filters={"is_group": 0}, fields=["name"], limit=1)

    if not companies:
        print("❌ Error: No company found")
        print("")
        print("Fee Structures require a company to be created first.")
        print("Please complete the ERPNext Setup Wizard:")
        print("  1. Login as Administrator")
        print("  2. Go to Setup > Setup Wizard")
        print("  3. Complete all steps to create your company")
        print("")
        print("After completing Setup Wizard, run this command again:")
        print("  ./manage.sh setup-fees")
        return False

    company = companies[0].name
    print(f"✓ Found company: {company}")

    # Get receivable account
    receivable_account = frappe.db.get_value("Company", company, "default_receivable_account")

    if not receivable_account:
        print(f"❌ Error: No default receivable account found for company {company}")
        print("Please set up the company's default receivable account in Company settings")
        return False

    print(f"✓ Using receivable account: {receivable_account}")
    print("")

    # Fee structures for all 20 CBSE programs
    fee_structures = [
        {"program": "Playgroup", "monthly_fee": 500},
        {"program": "Nursery", "monthly_fee": 550},
        {"program": "LKG", "monthly_fee": 600},
        {"program": "UKG", "monthly_fee": 650},
        {"program": "Class 1", "monthly_fee": 700},
        {"program": "Class 2", "monthly_fee": 750},
        {"program": "Class 3", "monthly_fee": 800},
        {"program": "Class 4", "monthly_fee": 850},
        {"program": "Class 5", "monthly_fee": 900},
        {"program": "Class 6", "monthly_fee": 950},
        {"program": "Class 7", "monthly_fee": 1000},
        {"program": "Class 8", "monthly_fee": 1050},
        {"program": "Class 9", "monthly_fee": 1100},
        {"program": "Class 10", "monthly_fee": 1150},
        {"program": "Class 11 Science", "monthly_fee": 1200},
        {"program": "Class 11 Commerce", "monthly_fee": 1200},
        {"program": "Class 11 Arts", "monthly_fee": 1200},
        {"program": "Class 12 Science", "monthly_fee": 1200},
        {"program": "Class 12 Commerce", "monthly_fee": 1200},
        {"program": "Class 12 Arts", "monthly_fee": 1200},
    ]

    created_count = 0
    skipped_count = 0

    for item in fee_structures:
        program_name = item["program"]
        monthly_fee = item["monthly_fee"]

        # Check if program exists
        if not frappe.db.exists("Program", program_name):
            print(f"⚠ Skipping {program_name}: Program not found")
            skipped_count += 1
            continue

        # Check if fee structure already exists
        fee_structure_name = f"{program_name} - Standard Fee Structure"
        if frappe.db.exists("Fee Structure", fee_structure_name):
            print(f"⊙ {program_name}: Fee structure already exists")
            skipped_count += 1
            continue

        try:
            # Create fee structure
            fee_structure = frappe.get_doc({
                "doctype": "Fee Structure",
                "fee_structure_name": fee_structure_name,
                "program": program_name,
                "receivable_account": receivable_account,
                "company": company,
                "components": [
                    {
                        "fees_category": "Tuition Fee",
                        "amount": monthly_fee
                    }
                ]
            })
            fee_structure.insert(ignore_permissions=True)
            frappe.db.commit()

            print(f"✓ Created fee structure for {program_name}: ₹{monthly_fee}/month")
            created_count += 1

        except Exception as e:
            print(f"✗ Failed to create fee structure for {program_name}: {str(e)}")

    print("")
    print(f"Summary: {created_count} created, {skipped_count} skipped")
    return True

if __name__ == "__main__":
    frappe.init(site="site1.localhost")
    frappe.connect()
    setup_fee_structures()
    frappe.destroy()
EOFPYTHON

    # Execute the Python script
    docker exec -i "$backend_container" bench --site "${SITE_NAME}" execute frappe.commands.utils.execute_in_shell /tmp/setup_fee_structures.py

    if [ $? -eq 0 ]; then
        echo ""
        print_success "Fee structures setup completed"
    else
        echo ""
        print_error "Fee structures setup encountered errors"
        exit 1
    fi
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
  ${YELLOW}recreate${NC}          Recreate containers (keeps data) - useful after config changes
  ${YELLOW}rebuild${NC}           Pull new images and recreate containers (keeps data)
  ${YELLOW}reset${NC}             Delete everything and start fresh (requires confirmation)
  ${YELLOW}set-hostname${NC}      Set the hostname for the site (e.g., set-hostname internal3.paperentry.ai)
  ${YELLOW}setup-ssl${NC}         Setup Let's Encrypt SSL certificate for custom domain
  ${YELLOW}setup-fees${NC}        Setup fee structures (run after completing Setup Wizard)
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

  # Update docker-compose.yml and recreate containers
  $0 recreate

  # Pull latest images and rebuild
  $0 rebuild

  # Complete reset (deletes all data)
  $0 reset

  # Set custom hostname for external access
  $0 set-hostname internal3.paperentry.ai

  # Setup SSL certificate (requires CUSTOM_DOMAIN and SSL_EMAIL in config)
  $0 setup-ssl

  # Setup fee structures after completing Setup Wizard
  $0 setup-fees

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
  - Docker Compose: ${SCRIPT_DIR}/docker-compose.yml (template)
  - Data files: ${SCRIPT_DIR}/data/
  - Environment files: ${SCRIPT_DIR}/data/*.env
  - Credentials: ${SCRIPT_DIR}/data/*-credentials.txt

EOF
}

# Main script logic
case "${1:-help}" in
    info)
        show_config_info
        ;;
    install)
        install_project
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
    recreate)
        recreate_project
        ;;
    rebuild)
        rebuild_project
        ;;
    reset)
        reset_project
        ;;
    set-hostname)
        set_hostname "$2"
        ;;
    setup-ssl)
        setup_ssl
        ;;
    setup-fees)
        setup_fee_structures
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
