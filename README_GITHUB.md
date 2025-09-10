# CounterBot VC - Discord Voice Chat Counter Bot

A powerful Discord bot for coordinated voice chat attacks and rally management in strategy games. Features precise timing, voice announcements, and flexible player coordination.

## 🚀 Features

### **Standard Attack Mode**
- **Synchronized Attacks**: Coordinate multiple players to arrive at the same time
- **Group Management**: Organize players into different attack groups
- **Voice Countdowns**: Real-time voice announcements for perfect timing
- **Flexible Timing**: Support for various travel times and coordination scenarios

### **Enemy Rally Mode** ⭐
- **Rally Tracking**: Monitor enemy rallies with preparation time + travel distance
- **Automatic Reinforcement**: Calculate and execute perfect counter-attacks
- **Precise Timing**: Arrive exactly 2 seconds before enemy rally reaches target
- **Smart Voice Alerts**: Dynamic announcements based on timing

### **Saved Rally Groups** ⭐
- **Quick Deployment**: Save and load complete rally configurations
- **Player Management**: Associate players with specific rally groups
- **Flexible Formats**: Support for both travel time and exact send times
- **Easy Editing**: Update any aspect of saved rally groups

### **Advanced Player Formats**
- **Travel Time**: `PlayerA:25` - Player takes 25 seconds to reach target
- **Send Time**: `PlayerA:11:02` - Player sends at exactly 11 minutes 2 seconds
- **Mixed Formats**: Combine both timing methods in the same rally

## 📋 Commands

### Player Management
- `/register <playername> <seconds> [group]` - Register a player
- `/update <playername> <seconds> [group]` - Update player timing
- `/remove <playername>` - Remove a player
- `/clear` - Remove all players
- `/list` - Show all registered players

### Voice Channel
- `/join` - Bot joins your voice channel
- `/leave` - Bot leaves the voice channel

### Attack Coordination
- `/preview [group]` - Preview attack sequence
- `/launch [group]` - Start synchronized attack
- `/stop` - Stop current countdown
- `/status` - Show bot status

### Rally Management
- `/rallyadd <name> <time> <travel> [group]` - Add enemy rally
- `/rallystart <groupid>` - Start saved rally group
- `/rallylist` - List all rallies
- `/rallyremove <name>` - Remove rally

### Saved Rally Groups
- `/rallysave <groupid> <rallyname> <time> <travel> <players>` - Save rally group
- `/rallyedit <groupid> [rallyname] [time] [travel] [players]` - Edit rally group
- `/rallygroups` - List saved groups
- `/rallydelete <groupid>` - Delete saved group

## 🛠️ Installation

### Prerequisites
- Node.js 16+ 
- Discord Bot Token
- FFmpeg (for audio processing)

### Quick Setup
1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/wos-voicechat-counter.git
   cd wos-voicechat-counter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Discord bot credentials
   ```

4. **Start the bot**
   ```bash
   npm start
   ```

### Production Deployment
For VPS deployment, use the included deployment scripts:

```bash
# Make deployment script executable
chmod +x deploy.sh

# Run automated deployment
./deploy.sh

# Configure bot
./setup.sh
```

## ⚙️ Configuration

### Environment Variables
```env
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_GUILD_ID=your_discord_guild_id
NODE_ENV=production
TTS_PROVIDER=local
```

### Time Format Support
- `1:30` = 1 minute 30 seconds
- `90` = 90 seconds
- `2:00` = 2 minutes
- `0:45` = 45 seconds

### Player Format Support
- `PlayerA:25` = PlayerA with 25 seconds travel time
- `PlayerA:11:02` = PlayerA sends at 11 minutes 2 seconds
- Mixed: `PlayerA:25,PlayerB:11:02,PlayerC:30`

## 🎯 Usage Examples

### Standard Attack
```
/register PlayerA 25
/register PlayerB 30
/register PlayerC 35
/join
/launch
```

### Rally Management
```
/rallysave group1 test 1:30 0:30 PlayerA:25,PlayerB:30,PlayerC:35
/rallystart group1
```

### Mixed Player Formats
```
/rallysave group2 test 1:30 0:30 PlayerA:11:02,PlayerB:25,PlayerC:11:05
/rallystart group2
```

## 🔧 Technical Details

### Architecture
- **Discord.js v14**: Modern Discord API integration
- **@discordjs/voice**: Voice channel management
- **FFmpeg**: Audio processing and TTS
- **Modular Design**: Separate managers for different functionalities

### Key Components
- `PlayerManager`: Player registration and timing
- `RallyManager`: Rally tracking and calculations
- `VoiceManager`: Voice announcements and audio
- `CommandHandler`: Discord slash command processing
- `TTSService`: Text-to-speech generation

### Timing Algorithm
- **Standard Attacks**: Synchronized arrival based on longest travel time
- **Rally Attacks**: Arrive exactly 2 seconds before enemy
- **Send Time**: Precise minute:second timing from rally start
- **Voice Scheduling**: Real-time announcements with perfect timing

## 📁 Project Structure

```
├── src/
│   ├── CommandHandler.js    # Discord command processing
│   ├── VoiceManager.js      # Voice channel management
│   ├── RallyManager.js      # Rally logic and timing
│   ├── PlayerManager.js     # Player data management
│   └── TTSService.js        # Text-to-speech service
├── deploy.sh                # Production deployment script
├── setup.sh                 # Quick configuration script
├── package.json             # Dependencies and scripts
└── README.md                # Documentation
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/wos-voicechat-counter/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOUR_USERNAME/wos-voicechat-counter/discussions)

## 🙏 Acknowledgments

- Discord.js community for excellent documentation
- FFmpeg for powerful audio processing
- All contributors and testers

---

**Made with ❤️ for the strategy gaming community**

