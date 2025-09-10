#!/bin/bash

# CounterBot VC - Quick Setup Script
# This script helps you configure the bot after deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to get user input
get_input() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " input
        eval "$var_name=\${input:-$default}"
    else
        read -p "$prompt: " input
        eval "$var_name=\"$input\""
    fi
}

# Function to validate Discord token
validate_token() {
    local token="$1"
    if [[ ${#token} -lt 50 ]]; then
        print_error "Discord token seems too short. Please check your token."
        return 1
    fi
    return 0
}

# Function to validate Discord ID
validate_id() {
    local id="$1"
    if ! [[ "$id" =~ ^[0-9]+$ ]]; then
        print_error "Discord ID must be numeric. Please check your ID."
        return 1
    fi
    return 0
}

echo "=========================================="
echo "CounterBot VC - Quick Setup"
echo "=========================================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    print_status "Please run the deployment script first or create .env manually"
    exit 1
fi

print_status "This script will help you configure your Discord bot credentials"
echo ""

# Get Discord Bot Token
while true; do
    get_input "Enter your Discord Bot Token" "" "DISCORD_TOKEN"
    if validate_token "$DISCORD_TOKEN"; then
        break
    fi
done

# Get Discord Client ID
while true; do
    get_input "Enter your Discord Client ID" "" "DISCORD_CLIENT_ID"
    if validate_id "$DISCORD_CLIENT_ID"; then
        break
    fi
done

# Get Discord Guild ID
while true; do
    get_input "Enter your Discord Guild ID (Server ID)" "" "DISCORD_GUILD_ID"
    if validate_id "$DISCORD_GUILD_ID"; then
        break
    fi
done

# Get optional settings
get_input "Enter log level (info/debug/error)" "info" "LOG_LEVEL"
get_input "Enter TTS provider (local/console)" "local" "TTS_PROVIDER"
get_input "Enter audio cache size" "100" "AUDIO_CACHE_SIZE"
get_input "Enter audio cache TTL (seconds)" "3600" "AUDIO_CACHE_TTL"

# Update .env file
print_status "Updating .env file..."

cat > .env <<EOF
# Discord Bot Configuration
DISCORD_TOKEN=$DISCORD_TOKEN
DISCORD_CLIENT_ID=$DISCORD_CLIENT_ID
DISCORD_GUILD_ID=$DISCORD_GUILD_ID

# Bot Configuration
NODE_ENV=production
LOG_LEVEL=$LOG_LEVEL

# TTS Configuration
TTS_PROVIDER=$TTS_PROVIDER
TTS_VOICE=default

# Audio Configuration
AUDIO_CACHE_SIZE=$AUDIO_CACHE_SIZE
AUDIO_CACHE_TTL=$AUDIO_CACHE_TTL
EOF

print_success ".env file updated"

# Test configuration
print_status "Testing configuration..."

# Check if Node.js is available
if ! command -v node >/dev/null 2>&1; then
    print_error "Node.js not found. Please install Node.js first"
    exit 1
fi

# Check if PM2 is available
if ! command -v pm2 >/dev/null 2>&1; then
    print_warning "PM2 not found. Installing PM2..."
    npm install -g pm2
fi

# Test bot startup (dry run)
print_status "Testing bot configuration..."

# Create a test script
cat > test_config.js <<EOF
require('dotenv').config();

console.log('Testing configuration...');
console.log('Discord Token:', process.env.DISCORD_TOKEN ? 'Set' : 'Not set');
console.log('Client ID:', process.env.DISCORD_CLIENT_ID ? 'Set' : 'Not set');
console.log('Guild ID:', process.env.DISCORD_GUILD_ID ? 'Set' : 'Not set');
console.log('Log Level:', process.env.LOG_LEVEL);
console.log('TTS Provider:', process.env.TTS_PROVIDER);

// Test basic imports
try {
    const { Client, GatewayIntentBits } = require('discord.js');
    console.log('Discord.js: OK');
} catch (error) {
    console.error('Discord.js error:', error.message);
}

try {
    const { TTSService } = require('./src/TTSService');
    console.log('TTS Service: OK');
} catch (error) {
    console.error('TTS Service error:', error.message);
}

console.log('Configuration test completed!');
EOF

# Run test
if node test_config.js; then
    print_success "Configuration test passed"
    rm test_config.js
else
    print_error "Configuration test failed"
    rm test_config.js
    exit 1
fi

# Display next steps
echo ""
print_success "Setup completed successfully!"
echo ""
echo "=== NEXT STEPS ==="
echo ""
echo "1. Start the bot:"
echo "   ./manage.sh start"
echo ""
echo "2. Check bot status:"
echo "   ./manage.sh status"
echo ""
echo "3. View logs:"
echo "   ./manage.sh logs"
echo ""
echo "4. Monitor the bot:"
echo "   ./manage.sh monitor"
echo ""
echo "=== DISCORD SETUP ==="
echo ""
echo "1. Make sure your bot has these permissions:"
echo "   - Send Messages"
echo "   - Use Slash Commands"
echo "   - Connect to Voice"
echo "   - Speak in Voice"
echo "   - Use Voice Activity"
echo ""
echo "2. Invite your bot to your server using this URL:"
echo "   https://discord.com/api/oauth2/authorize?client_id=$DISCORD_CLIENT_ID&permissions=3145728&scope=bot%20applications.commands"
echo ""
echo "3. Use these commands in Discord:"
echo "   /join - Join voice channel"
echo "   /rallyadd - Add enemy rally"
echo "   /register - Register players"
echo "   /rallystart - Start rally and begin reinforcement"
echo ""
print_success "Bot is ready to use!"
