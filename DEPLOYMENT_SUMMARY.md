# CounterBot VC - Deployment Summary

## Files Created for Hostinger VPS Deployment

### 1. `deploy.sh` - Main Deployment Script
- **Purpose**: Complete automated setup and deployment
- **Features**:
  - Installs Node.js 18, PM2, FFmpeg, and system dependencies
  - Creates application directory structure
  - Sets up systemd service for auto-start
  - Configures firewall and security
  - Creates management and monitoring scripts
  - Sets up log rotation

### 2. `setup.sh` - Quick Configuration Script
- **Purpose**: Easy bot configuration after deployment
- **Features**:
  - Interactive Discord credentials setup
  - Configuration validation
  - Bot startup testing
  - Generates Discord invite URL

### 3. `DEPLOYMENT.md` - Complete Deployment Guide
- **Purpose**: Detailed documentation for manual setup
- **Features**:
  - Step-by-step instructions
  - Troubleshooting guide
  - Management commands
  - Security configuration

## Quick Start on Hostinger VPS

### Step 1: Upload Files
```bash
# Upload all files to your VPS
scp -r * user@your-vps-ip:/home/user/
```

### Step 2: Make Scripts Executable
```bash
# On your VPS, make scripts executable
chmod +x deploy.sh setup.sh
```

### Step 3: Run Deployment
```bash
# Run the automated deployment
./deploy.sh
```

### Step 4: Configure Bot
```bash
# Configure Discord credentials
./setup.sh
```

### Step 5: Start Bot
```bash
# Start the bot
./manage.sh start
```

## What the Deployment Script Does

### System Setup
- ✅ Updates Ubuntu/Debian packages
- ✅ Installs Node.js 18
- ✅ Installs FFmpeg for audio processing
- ✅ Installs espeak for TTS fallback
- ✅ Installs PM2 for process management
- ✅ Configures firewall (UFW)

### Application Setup
- ✅ Creates `/home/user/counterbot-vc/` directory
- ✅ Copies all bot files
- ✅ Installs npm dependencies
- ✅ Creates environment configuration
- ✅ Sets up PM2 ecosystem configuration

### Management Tools Created
- ✅ `manage.sh` - Main management script
- ✅ `monitor.sh` - System monitoring
- ✅ `update.sh` - Bot update script
- ✅ `start.sh` - Startup script

### System Integration
- ✅ Creates systemd service for auto-start
- ✅ Sets up log rotation
- ✅ Configures proper file permissions
- ✅ Sets up security restrictions

## Management Commands

After deployment, use these commands:

```bash
# Start bot
./manage.sh start

# Stop bot
./manage.sh stop

# Restart bot
./manage.sh restart

# Check status
./manage.sh status

# View logs
./manage.sh logs

# Monitor system
./manage.sh monitor

# Update bot
./manage.sh update
```

## Discord Bot Setup

### Required Permissions
- Send Messages
- Use Slash Commands
- Connect to Voice
- Speak in Voice
- Use Voice Activity

### Bot Commands
- `/join` - Join voice channel
- `/rallyadd <name> <time> <travel>` - Add enemy rally
- `/register <name> <travel_time>` - Register player
- `/rallystart <name>` - Start rally and begin reinforcement
- `/rallylist` - List all rallies
- `/rallyremove <name>` - Remove rally

## File Structure After Deployment

```
/home/user/counterbot-vc/
├── src/                    # Bot source code
│   ├── CommandHandler.js   # Discord commands
│   ├── VoiceManager.js     # Voice management
│   ├── RallyManager.js     # Rally logic
│   ├── PlayerManager.js    # Player management
│   └── TTSService.js       # Text-to-Speech
├── logs/                   # Log files
├── temp/                   # TTS cache
├── .env                    # Environment config
├── ecosystem.config.js     # PM2 configuration
├── manage.sh              # Management script
├── monitor.sh             # Monitoring script
├── update.sh              # Update script
├── setup.sh               # Setup script
└── package.json           # Dependencies
```

## Security Features

- ✅ Firewall configuration (UFW)
- ✅ Non-root user execution
- ✅ File permission restrictions
- ✅ Systemd security settings
- ✅ Log rotation to prevent disk fill

## Monitoring Features

- ✅ PM2 process management
- ✅ System resource monitoring
- ✅ Log file management
- ✅ Automatic restart on failure
- ✅ Memory usage monitoring

## Troubleshooting

### Common Issues
1. **Bot not starting**: Check logs with `./manage.sh logs`
2. **Permission errors**: Run `sudo chown -R user:user /home/user/counterbot-vc`
3. **TTS not working**: Install espeak with `sudo apt install espeak`
4. **Memory issues**: Restart with `./manage.sh restart`

### Log Files
- Error logs: `logs/err.log`
- Output logs: `logs/out.log`
- Combined logs: `logs/combined.log`

## Support

The deployment creates a complete, production-ready setup with:
- ✅ Automatic startup on server boot
- ✅ Process management with PM2
- ✅ Log rotation and monitoring
- ✅ Security configuration
- ✅ Easy management commands
- ✅ Update and maintenance scripts

Your CounterBot VC is now ready for production use on Hostinger VPS! 🎉
