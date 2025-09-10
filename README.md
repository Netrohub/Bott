# CounterBot VC - Discord Synchronized Attack Bot

A Discord bot that coordinates synchronized attacks by calculating optimal timing for multiple players based on their distance to target. The bot provides voice countdowns to ensure all players launch their attacks at the perfect moment for synchronized arrival.

## Features

- **Player Management**: Register, update, and remove players with their time-to-destination
- **Synchronization Logic**: Automatically calculates when each player should start their attack
- **Voice Countdowns**: Provides voice announcements and countdowns in Discord voice channels
- **Real-time Coordination**: Ensures all attacks arrive at the target simultaneously
- **Easy Commands**: Simple slash commands for all operations

## Commands

### Player Management
- `/register <playername> <seconds> [group]` - Register a new player with their time to destination and attack group (default: 1)
- `/update <playername> <seconds> [group]` - Update a player's time to destination and/or attack group
- `/remove <playername>` - Remove a specific player
- `/clear` - Remove all registered players
- `/cleargroup <group>` - Remove all players from a specific attack group
- `/list` - Show all registered players with their groups

### Voice Channel
- `/join` - Bot joins your current voice channel
- `/leave` - Bot leaves the voice channel

### Attack Coordination
- `/preview [group]` - Preview the attack sequence without launching (optional: specific group)
- `/launch [group]` - Start the synchronized attack sequence (optional: specific group)
- `/stop` - Stop the current attack countdown
- `/status` - Show current bot status and player count

### Enemy Rally Management
- `/rallyadd <name> <time> <travel> [group]` - Add an enemy rally to track (time in minutes, travel in seconds)
- `/rallystart <groupid>` - Start a saved rally group and automatically begin reinforcement
- `/rallylist` - List all tracked enemy rallies
- `/rallyremove <name>` - Remove a specific enemy rally
- `/rallypreview <name>` - Preview attack sequence against a rally without launching
- `/rallyannounce <name>` - Manually announce that a rally has started

### Saved Rally Groups (NEW!)
- `/rallysave <groupid> <rallyname> <time> <travel> <players>` - Save a rally group with players for future use
- `/rallyedit <groupid> [rallyname] [time] [travel] [players]` - Edit a saved rally group (any field optional)
- `/rallygroups` - List all saved rally groups
- `/rallydelete <groupid>` - Delete a saved rally group

## How It Works

### Standard Attack Mode
1. **Register Players**: Add players with their time to reach the target and attack group
2. **Organize Groups**: Players can be assigned to different attack groups for multiple coordinated attacks
3. **Join Voice Channel**: Bot joins your voice channel for announcements
4. **Preview/Launch**: Preview the plan or launch the sequence for specific groups or all groups
5. **Synchronized Attack**: Each group's players get synchronized countdowns ensuring perfect timing
6. **Emergency Stop**: Use `/stop` if players miss timing to reset and restart the sequence

### Enemy Rally Mode (NEW!)
1. **Add Enemy Rally**: Track enemy rally with preparation time + travel distance
2. **Register Players**: Add your players with their travel times
3. **Join Voice Channel**: Bot joins your voice channel for announcements
4. **Manually Start Rally**: Use `/rallystart` when enemy actually starts their rally
5. **Automatic Reinforcement**: Bot automatically calculates and starts reinforcement timing
6. **Smart Voice Alerts**: 
   - Rally start: "[Rally Name] has started a rally. Enemy will arrive in [X minutes and Y seconds]. Prepare for reinforcement!"
   - Attack sequence: "Enemy rally [name] detected. Rally arrives in [X minutes and Y seconds]. Prepare for reinforcement in 10 seconds."
   - First player gets full countdown: "Player A 3 2 1 go"
   - Same-time players get grouped: "Player B, Player C go"
   - Precise timing ensures perfect synchronization
7. **Reinforcement Timing**: All attacks arrive exactly 2 seconds before enemy rally

### Saved Rally Groups (NEW!)
1. **Save Rally Groups**: Save complete rally configurations with players for quick reuse
2. **Group Management**: Each saved group has a unique ID for easy identification
3. **Quick Loading**: Load and start saved rally groups with one command
4. **Player Association**: Players are automatically registered when loading a group
5. **Persistent Storage**: Saved groups persist between bot restarts
6. **Easy Management**: List, update, or delete saved groups as needed

**Example Usage:**
- Save: `/rallysave group1 test 1:30 0:30 PlayerA:25,PlayerB:30,PlayerC:35` (1 min 30 sec rally, 30 sec travel)
- Save with send times: `/rallysave group2 test 1:30 0:30 PlayerA:11:02,PlayerB:11:05,PlayerC:11:08` (exact send times)
- Edit: `/rallyedit group1 time:2:00 travel:0:45` (update time to 2 min, travel to 45 sec)
- Start: `/rallystart group1` (loads players and starts rally automatically)
- List: `/rallygroups` (shows all saved groups)
- Delete: `/rallydelete group1` (removes saved group)

**Time Format Support:**
- `1:30` = 1 minute 30 seconds
- `90` = 90 seconds
- `2:00` = 2 minutes
- `0:45` = 45 seconds

**Player Format Support:**
- `PlayerA:25` = PlayerA with 25 seconds travel time
- `PlayerA:11:02` = PlayerA should send at 11 minutes 2 seconds from rally start
- Mixed: `PlayerA:25,PlayerB:11:02,PlayerC:30` = Mix of travel time and send time

### Example Scenarios

#### Standard Attack Mode
**Attack Group 1:**
- **Player A**: 10 seconds to target
- **Player B**: 15 seconds to target  
- **Player C**: 20 seconds to target

**Result**: 
- **Group 1**: All attacks arrive at 20s
  - Player A starts at 10 seconds (arrives at 20s)
  - Player B starts at 5 seconds (arrives at 20s)
  - Player C starts at 0 seconds (arrives at 20s)

#### Enemy Rally Mode (NEW!)
**Enemy Rally "test":**
- **Rally Time**: 5 minutes (preparation time)
- **Travel Distance**: 30 seconds (time to reach target)
- **Total Time**: 5m 30s (5 minutes + 30 seconds = 330 seconds)
- **Manual Start**: Use `/rallystart test` when enemy actually starts

**Our Players:**
- **Player A**: 10 seconds to target
- **Player B**: 15 seconds to target
- **Player C**: 20 seconds to target

**Workflow:**
1. **Add Rally**: `/rallyadd test 5 30` (5 minutes preparation + 30 seconds travel)
2. **Register Players**: `/register PlayerA 10`, `/register PlayerB 15`, `/register PlayerC 20`
3. **Join Voice**: `/join`
4. **Start Rally**: `/rallystart test` (when enemy actually starts - automatically begins reinforcement)

**Voice Sequence:**
1. "test has started a rally. Enemy will arrive in 5 minutes and 30 seconds. Prepare for reinforcement!"
2. "Enemy rally test detected. Rally arrives in 5 minutes and 30 seconds. Prepare for reinforcement in 10 seconds."
3. "Player A send reinforcement in X seconds!" (at calculated time)
4. "Player B, Player C send reinforcement in Y seconds!" (at calculated time) - grouped because they attack at same time
5. "Reinforcement sequence complete."

**Result**: All our attacks arrive exactly 2 seconds before enemy!

## Setup Instructions

### 🐳 Docker Deployment (Recommended)

For the easiest setup with guaranteed cross-platform compatibility:

1. **Clone the repository**
2. **Create `config/config.json`** with your Discord bot credentials
3. **Run `./deploy.sh`**

See [DOCKER.md](DOCKER.md) for detailed Docker instructions.

### 🔧 Manual Setup

#### 1. Prerequisites
- Node.js 16.9.0 or higher
- Discord Bot Token
- Discord Application with proper permissions

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Configure the Bot
1. Edit `config.json` with your bot credentials:
```json
{
  "token": "YOUR_DISCORD_BOT_TOKEN_HERE",
  "clientId": "YOUR_CLIENT_ID_HERE",
  "guildId": "YOUR_GUILD_ID_HERE"
}
```

2. Ensure your bot has these permissions:
   - Send Messages
   - Use Slash Commands
   - Connect to Voice Channels
   - Speak in Voice Channels
   - Use Voice Activity

#### 4. Run the Bot
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## Voice Features

The bot now provides **actual voice announcements** in Discord voice channels using:

- **Local TTS (Default)** - Uses cross-platform `say` npm package for immediate voice output
- **Google Cloud Text-to-Speech** - For cloud-based voice synthesis
- **Amazon Polly** - AWS-powered voice generation
- **Microsoft Azure Speech Services** - Enterprise-grade TTS
- **Console Logging** - Fallback for debugging

### Cross-Platform Compatibility

The bot now works on **Windows**, **macOS**, and **Linux**:
- **Windows**: Uses Windows SAPI (Speech API)
- **macOS**: Uses built-in `say` command
- **Linux**: Uses `espeak` (if installed) or falls back to other TTS engines

### Voice Output
- ✅ **Real-time voice countdowns** in Discord voice channels
- ✅ **Player-specific announcements** with timing information
- ✅ **Synchronized countdown sequences** (3, 2, 1, Go!)
- ✅ **Automatic audio file management** with cleanup

The bot will now speak the countdowns instead of just logging them to console!

## Technical Details

- **Framework**: Discord.js v14
- **Voice Support**: @discordjs/voice
- **Architecture**: Modular design with separate managers for different concerns
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Real-time**: Uses Discord's real-time APIs for instant coordination

## Troubleshooting

### Common Issues

1. **Bot won't join voice channel**
   - Ensure bot has voice permissions
   - Check if you're in a voice channel
   - Verify bot is online

2. **Commands not working**
   - Check if slash commands are registered
   - Verify bot has proper permissions
   - Ensure bot is in the correct guild

3. **Voice not working**
   - Check voice permissions
   - Verify bot is connected to voice channel
   - Check console for error messages

### Permissions Checklist

- [ ] Bot has `Send Messages` permission
- [ ] Bot has `Use Slash Commands` permission  
- [ ] Bot has `Connect` permission for voice channels
- [ ] Bot has `Speak` permission in voice channels
- [ ] Bot has `Use Voice Activity` permission

## Contributing

Feel free to submit issues and enhancement requests!
If you like the project you can buy me a coffee :P
https://buymeacoffee.com/bj0rd

## License

MIT License - see LICENSE file for details. 