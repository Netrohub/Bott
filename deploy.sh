#!/bin/bash

# CounterBot VC - Deployment Script for Hostinger VPS
# This script sets up and deploys the Discord voice chat counter bot

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root for security reasons"
        print_status "Please run as a regular user with sudo privileges"
        exit 1
    fi
}

# Function to update system packages
update_system() {
    print_status "Updating system packages..."
    sudo apt update && sudo apt upgrade -y
    print_success "System packages updated"
}

# Function to install Node.js
install_nodejs() {
    print_status "Installing Node.js..."
    
    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_warning "Node.js is already installed: $NODE_VERSION"
        print_status "Checking if version is compatible..."
        
        # Check if Node.js version is 16 or higher
        NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR_VERSION" -lt 16 ]; then
            print_warning "Node.js version $NODE_VERSION is too old. Installing Node.js 18..."
            install_nodejs_18
        else
            print_success "Node.js version $NODE_VERSION is compatible"
        fi
    else
        print_status "Node.js not found. Installing Node.js 18..."
        install_nodejs_18
    fi
}

# Function to install Node.js 18
install_nodejs_18() {
    # Remove old Node.js if exists
    sudo apt remove -y nodejs npm 2>/dev/null || true
    
    # Install Node.js 18
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    
    # Verify installation
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    print_success "Node.js installed: $NODE_VERSION"
    print_success "npm installed: $NPM_VERSION"
}

# Function to install system dependencies
install_system_dependencies() {
    print_status "Installing system dependencies..."
    
    # Install essential packages
    sudo apt install -y curl wget git build-essential python3 python3-pip
    
    # Install FFmpeg for audio processing
    sudo apt install -y ffmpeg
    
    # Install espeak for TTS (fallback)
    sudo apt install -y espeak espeak-data
    
    # Install additional audio libraries
    sudo apt install -y libasound2-dev libpulse-dev
    
    print_success "System dependencies installed"
}

# Function to create application directory
create_app_directory() {
    print_status "Setting up application directory..."
    
    # Create app directory
    APP_DIR="/home/$USER/counterbot-vc"
    
    if [ -d "$APP_DIR" ]; then
        print_warning "Application directory already exists: $APP_DIR"
        print_status "Backing up existing installation..."
        sudo mv "$APP_DIR" "${APP_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Create new directory
    mkdir -p "$APP_DIR"
    cd "$APP_DIR"
    
    print_success "Application directory created: $APP_DIR"
}

# Function to install PM2 for process management
install_pm2() {
    print_status "Installing PM2 process manager..."
    
    if command_exists pm2; then
        print_warning "PM2 is already installed"
    else
        sudo npm install -g pm2
        print_success "PM2 installed"
    fi
    
    # Setup PM2 startup
    print_status "Setting up PM2 startup..."
    pm2 startup
    print_success "PM2 startup configured"
}

# Function to create systemd service
create_systemd_service() {
    print_status "Creating systemd service..."
    
    SERVICE_FILE="/etc/systemd/system/counterbot-vc.service"
    
    sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=CounterBot VC Discord Bot
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$APP_DIR

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd and enable service
    sudo systemctl daemon-reload
    sudo systemctl enable counterbot-vc
    
    print_success "Systemd service created and enabled"
}

# Function to setup firewall
setup_firewall() {
    print_status "Setting up firewall..."
    
    # Install ufw if not present
    if ! command_exists ufw; then
        sudo apt install -y ufw
    fi
    
    # Configure firewall
    sudo ufw --force reset
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow ssh
    sudo ufw allow 22
    sudo ufw --force enable
    
    print_success "Firewall configured"
}

# Function to create environment file
create_env_file() {
    print_status "Creating environment configuration..."
    
    ENV_FILE="$APP_DIR/.env"
    
    cat > "$ENV_FILE" <<EOF
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_GUILD_ID=your_discord_guild_id_here

# Bot Configuration
NODE_ENV=production
LOG_LEVEL=info

# TTS Configuration
TTS_PROVIDER=local
TTS_VOICE=default

# Audio Configuration
AUDIO_CACHE_SIZE=100
AUDIO_CACHE_TTL=3600
EOF

    print_success "Environment file created: $ENV_FILE"
    print_warning "Please edit $ENV_FILE and add your Discord bot credentials"
}

# Function to create PM2 ecosystem file
create_pm2_config() {
    print_status "Creating PM2 configuration..."
    
    PM2_FILE="$APP_DIR/ecosystem.config.js"
    
    cat > "$PM2_FILE" <<EOF
module.exports = {
  apps: [{
    name: 'counterbot-vc',
    script: 'index.js',
    cwd: '$APP_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

    # Create logs directory
    mkdir -p "$APP_DIR/logs"
    
    print_success "PM2 configuration created: $PM2_FILE"
}

# Function to create startup script
create_startup_script() {
    print_status "Creating startup script..."
    
    STARTUP_FILE="$APP_DIR/start.sh"
    
    cat > "$STARTUP_FILE" <<EOF
#!/bin/bash

# CounterBot VC Startup Script
cd "$APP_DIR"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found!"
    echo "Please create .env file with your Discord bot credentials"
    exit 1
fi

# Load environment variables
export \$(cat .env | grep -v '^#' | xargs)

# Start the bot
echo "Starting CounterBot VC..."
node index.js
EOF

    chmod +x "$STARTUP_FILE"
    print_success "Startup script created: $STARTUP_FILE"
}

# Function to create update script
create_update_script() {
    print_status "Creating update script..."
    
    UPDATE_FILE="$APP_DIR/update.sh"
    
    cat > "$UPDATE_FILE" <<EOF
#!/bin/bash

# CounterBot VC Update Script
set -e

echo "Updating CounterBot VC..."

# Stop the bot
pm2 stop counterbot-vc 2>/dev/null || true

# Backup current version
BACKUP_DIR="backup_\$(date +%Y%m%d_%H%M%S)"
mkdir -p "\$BACKUP_DIR"
cp -r . "\$BACKUP_DIR/" 2>/dev/null || true

# Update dependencies
npm install

# Start the bot
pm2 start ecosystem.config.js

echo "Update completed!"
echo "Backup created in: \$BACKUP_DIR"
EOF

    chmod +x "$UPDATE_FILE"
    print_success "Update script created: $UPDATE_FILE"
}

# Function to create monitoring script
create_monitoring_script() {
    print_status "Creating monitoring script..."
    
    MONITOR_FILE="$APP_DIR/monitor.sh"
    
    cat > "$MONITOR_FILE" <<EOF
#!/bin/bash

# CounterBot VC Monitoring Script
echo "=== CounterBot VC Status ==="
echo "Date: \$(date)"
echo "Uptime: \$(uptime)"
echo ""

echo "=== PM2 Status ==="
pm2 status

echo ""
echo "=== Bot Logs (last 20 lines) ==="
pm2 logs counterbot-vc --lines 20

echo ""
echo "=== System Resources ==="
echo "Memory Usage:"
free -h
echo ""
echo "Disk Usage:"
df -h
echo ""
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)"
EOF

    chmod +x "$MONITOR_FILE"
    print_success "Monitoring script created: $MONITOR_FILE"
}

# Function to install project dependencies
install_project_dependencies() {
    print_status "Installing project dependencies..."
    
    # Copy package.json if it exists in current directory
    if [ -f "package.json" ]; then
        cp package.json "$APP_DIR/"
    else
        print_warning "package.json not found in current directory"
        print_status "Please ensure package.json is in the same directory as this script"
        exit 1
    fi
    
    # Install dependencies
    cd "$APP_DIR"
    npm install --production
    
    print_success "Project dependencies installed"
}

# Function to copy application files
copy_application_files() {
    print_status "Copying application files..."
    
    # Copy all necessary files
    cp -r src/ "$APP_DIR/" 2>/dev/null || true
    cp index.js "$APP_DIR/" 2>/dev/null || true
    cp config.json "$APP_DIR/" 2>/dev/null || true
    cp README.md "$APP_DIR/" 2>/dev/null || true
    
    # Create temp directory for TTS
    mkdir -p "$APP_DIR/temp"
    mkdir -p "$APP_DIR/temp/library"
    
    # Set proper permissions
    chmod -R 755 "$APP_DIR"
    chown -R "$USER:$USER" "$APP_DIR"
    
    print_success "Application files copied"
}

# Function to setup log rotation
setup_log_rotation() {
    print_status "Setting up log rotation..."
    
    LOGROTATE_FILE="/etc/logrotate.d/counterbot-vc"
    
    sudo tee "$LOGROTATE_FILE" > /dev/null <<EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

    print_success "Log rotation configured"
}

# Function to create management script
create_management_script() {
    print_status "Creating management script..."
    
    MANAGE_FILE="$APP_DIR/manage.sh"
    
    cat > "$MANAGE_FILE" <<EOF
#!/bin/bash

# CounterBot VC Management Script
APP_DIR="$APP_DIR"

case "\$1" in
    start)
        echo "Starting CounterBot VC..."
        pm2 start ecosystem.config.js
        ;;
    stop)
        echo "Stopping CounterBot VC..."
        pm2 stop counterbot-vc
        ;;
    restart)
        echo "Restarting CounterBot VC..."
        pm2 restart counterbot-vc
        ;;
    status)
        echo "CounterBot VC Status:"
        pm2 status counterbot-vc
        ;;
    logs)
        echo "CounterBot VC Logs:"
        pm2 logs counterbot-vc
        ;;
    monitor)
        echo "CounterBot VC Monitoring:"
        ./monitor.sh
        ;;
    update)
        echo "Updating CounterBot VC..."
        ./update.sh
        ;;
    *)
        echo "Usage: \$0 {start|stop|restart|status|logs|monitor|update}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the bot"
        echo "  stop    - Stop the bot"
        echo "  restart - Restart the bot"
        echo "  status  - Show bot status"
        echo "  logs    - Show bot logs"
        echo "  monitor - Show detailed monitoring info"
        echo "  update  - Update the bot"
        exit 1
        ;;
esac
EOF

    chmod +x "$MANAGE_FILE"
    print_success "Management script created: $MANAGE_FILE"
}

# Function to display final instructions
display_final_instructions() {
    print_success "Deployment completed successfully!"
    echo ""
    echo "=== NEXT STEPS ==="
    echo ""
    echo "1. Configure your Discord bot:"
    echo "   - Edit $APP_DIR/.env"
    echo "   - Add your Discord bot token and other credentials"
    echo ""
    echo "2. Start the bot:"
    echo "   cd $APP_DIR"
    echo "   ./manage.sh start"
    echo ""
    echo "3. Check bot status:"
    echo "   ./manage.sh status"
    echo ""
    echo "4. View logs:"
    echo "   ./manage.sh logs"
    echo ""
    echo "5. Monitor the bot:"
    echo "   ./manage.sh monitor"
    echo ""
    echo "=== USEFUL COMMANDS ==="
    echo ""
    echo "Start bot:     ./manage.sh start"
    echo "Stop bot:      ./manage.sh stop"
    echo "Restart bot:   ./manage.sh restart"
    echo "Check status:  ./manage.sh status"
    echo "View logs:     ./manage.sh logs"
    echo "Monitor:       ./manage.sh monitor"
    echo "Update:        ./manage.sh update"
    echo ""
    echo "=== FILES CREATED ==="
    echo "Application:    $APP_DIR"
    echo "Config:         $APP_DIR/.env"
    echo "PM2 Config:     $APP_DIR/ecosystem.config.js"
    echo "Management:     $APP_DIR/manage.sh"
    echo "Monitoring:     $APP_DIR/monitor.sh"
    echo "Update:         $APP_DIR/update.sh"
    echo "Service:        /etc/systemd/system/counterbot-vc.service"
    echo ""
    print_success "Bot is ready for configuration and startup!"
}

# Main deployment function
main() {
    echo "=========================================="
    echo "CounterBot VC - Deployment Script"
    echo "=========================================="
    echo ""
    
    # Check if running as root
    check_root
    
    # Update system
    update_system
    
    # Install Node.js
    install_nodejs
    
    # Install system dependencies
    install_system_dependencies
    
    # Create application directory
    create_app_directory
    
    # Install PM2
    install_pm2
    
    # Copy application files
    copy_application_files
    
    # Install project dependencies
    install_project_dependencies
    
    # Create configuration files
    create_env_file
    create_pm2_config
    create_startup_script
    create_update_script
    create_monitoring_script
    create_management_script
    
    # Setup systemd service
    create_systemd_service
    
    # Setup firewall
    setup_firewall
    
    # Setup log rotation
    setup_log_rotation
    
    # Display final instructions
    display_final_instructions
}

# Run main function
main "$@"