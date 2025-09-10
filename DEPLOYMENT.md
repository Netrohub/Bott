# CounterBot VC - Deployment Guide for Hostinger VPS

This guide will help you deploy the CounterBot VC Discord bot on your Hostinger VPS.

## Prerequisites

- Hostinger VPS with Ubuntu 20.04+ or Debian 10+
- Root access or sudo privileges
- Discord bot token and application ID
- Basic knowledge of Linux commands

## Quick Deployment

1. **Upload the bot files to your VPS:**
   ```bash
   # Upload all files to your VPS home directory
   scp -r * user@your-vps-ip:/home/user/
   ```

2. **Make the deployment script executable:**
   ```bash
   chmod +x deploy.sh
   ```

3. **Run the deployment script:**
   ```bash
   ./deploy.sh
   ```

4. **Configure your Discord bot:**
   ```bash
   nano /home/user/counterbot-vc/.env
   ```

5. **Start the bot:**
   ```bash
   cd /home/user/counterbot-vc
   ./manage.sh start
   ```

## Manual Setup (Alternative)

If you prefer to set up manually:

### 1. System Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install system dependencies
sudo apt install -y ffmpeg espeak espeak-data build-essential python3 python3-pip

# Install PM2
sudo npm install -g pm2
```

### 2. Application Setup

```bash
# Create application directory
mkdir -p /home/user/counterbot-vc
cd /home/user/counterbot-vc

# Copy your bot files
cp -r /path/to/your/bot/files/* .

# Install dependencies
npm install --production

# Create environment file
nano .env
```

### 3. Environment Configuration

Create `.env` file with your Discord credentials:

```env
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_GUILD_ID=your_discord_guild_id_here
NODE_ENV=production
LOG_LEVEL=info
TTS_PROVIDER=local
TTS_VOICE=default
AUDIO_CACHE_SIZE=100
AUDIO_CACHE_TTL=3600
```

### 4. PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'counterbot-vc',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 5. Start the Bot

```bash
# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

## Management Commands

The deployment script creates several management tools:

### Main Management Script

```bash
./manage.sh [command]
```

**Commands:**
- `start` - Start the bot
- `stop` - Stop the bot
- `restart` - Restart the bot
- `status` - Show bot status
- `logs` - Show bot logs
- `monitor` - Show detailed monitoring info
- `update` - Update the bot

### Examples

```bash
# Start the bot
./manage.sh start

# Check status
./manage.sh status

# View logs
./manage.sh logs

# Monitor system
./manage.sh monitor

# Update bot
./manage.sh update
```

## Monitoring

### Check Bot Status

```bash
# PM2 status
pm2 status

# Bot logs
pm2 logs counterbot-vc

# System monitoring
./monitor.sh
```

### Log Files

- **Error logs:** `logs/err.log`
- **Output logs:** `logs/out.log`
- **Combined logs:** `logs/combined.log`

### System Resources

```bash
# Memory usage
free -h

# Disk usage
df -h

# CPU usage
top
```

## Troubleshooting

### Common Issues

1. **Bot not starting:**
   ```bash
   # Check logs
   pm2 logs counterbot-vc
   
   # Check environment file
   cat .env
   
   # Restart bot
   pm2 restart counterbot-vc
   ```

2. **Permission errors:**
   ```bash
   # Fix permissions
   sudo chown -R user:user /home/user/counterbot-vc
   chmod -R 755 /home/user/counterbot-vc
   ```

3. **TTS not working:**
   ```bash
   # Install additional TTS packages
   sudo apt install -y espeak espeak-data
   
   # Check audio system
   aplay /usr/share/sounds/alsa/Front_Left.wav
   ```

4. **Memory issues:**
   ```bash
   # Check memory usage
   free -h
   
   # Restart bot
   pm2 restart counterbot-vc
   ```

### Log Analysis

```bash
# View recent errors
tail -f logs/err.log

# Search for specific errors
grep "ERROR" logs/combined.log

# Monitor real-time logs
pm2 logs counterbot-vc --lines 50
```

## Security

### Firewall Setup

```bash
# Install UFW
sudo apt install -y ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 22
sudo ufw enable
```

### File Permissions

```bash
# Set proper permissions
chmod 600 .env
chmod 755 *.sh
chmod -R 755 src/
```

## Updates

### Automatic Update

```bash
# Run update script
./update.sh
```

### Manual Update

```bash
# Stop bot
pm2 stop counterbot-vc

# Backup current version
cp -r . backup_$(date +%Y%m%d_%H%M%S)

# Update files
# (copy new files here)

# Install new dependencies
npm install

# Start bot
pm2 start counterbot-vc
```

## Discord Bot Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name your application (e.g., "CounterBot VC")
4. Go to "Bot" section
5. Click "Add Bot"
6. Copy the bot token

### 2. Bot Permissions

Required permissions:
- Send Messages
- Use Slash Commands
- Connect to Voice
- Speak in Voice
- Use Voice Activity

### 3. Invite Bot to Server

1. Go to "OAuth2" > "URL Generator"
2. Select "bot" and "applications.commands"
3. Select required permissions
4. Copy the generated URL
5. Open URL in browser to invite bot

### 4. Get Guild ID

1. Enable Developer Mode in Discord
2. Right-click on your server
3. Select "Copy Server ID"

## File Structure

```
/home/user/counterbot-vc/
├── src/                    # Bot source code
├── logs/                   # Log files
├── temp/                   # TTS cache
├── .env                    # Environment configuration
├── ecosystem.config.js     # PM2 configuration
├── manage.sh              # Management script
├── monitor.sh             # Monitoring script
├── update.sh              # Update script
├── start.sh               # Startup script
└── package.json           # Dependencies
```

## Support

If you encounter issues:

1. Check the logs: `./manage.sh logs`
2. Monitor system: `./manage.sh monitor`
3. Check Discord bot permissions
4. Verify environment configuration
5. Restart the bot: `./manage.sh restart`

## Performance Tips

1. **Memory Management:**
   - Monitor memory usage regularly
   - Restart bot if memory usage is high
   - Use PM2's memory restart feature

2. **TTS Optimization:**
   - Clear TTS cache periodically
   - Use local TTS for better performance
   - Monitor disk space for audio files

3. **System Resources:**
   - Keep system updated
   - Monitor CPU and memory usage
   - Clean up old log files

---

**Note:** This deployment script is designed for Hostinger VPS with Ubuntu/Debian. Adjust commands as needed for your specific setup.