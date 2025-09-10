const { 
  SlashCommandBuilder, 
  EmbedBuilder,
  PermissionFlagsBits 
} = require('discord.js');

class CommandHandler {
  constructor(client) {
    this.client = client;
    this.commands = new Map();
    this.initializeCommands();
  }

  initializeCommands() {
    // Register player command
    this.commands.set('register', new SlashCommandBuilder()
      .setName('register')
      .setDescription('Register a player with their time to destination')
      .addStringOption(option =>
        option.setName('playername')
          .setDescription('Name of the player')
          .setRequired(true))
      .addIntegerOption(option =>
        option.setName('seconds')
          .setDescription('Time in seconds to reach destination')
          .setRequired(true)
          .setMinValue(1))
      .addIntegerOption(option =>
        option.setName('group')
          .setDescription('Attack group number (default: 1)')
          .setRequired(false)
          .setMinValue(1))
      .toJSON());

    // Update player command
    this.commands.set('update', new SlashCommandBuilder()
      .setName('update')
      .setDescription('Update a player\'s time to destination and/or attack group')
      .addStringOption(option =>
        option.setName('playername')
          .setDescription('Name of the player to update')
          .setRequired(true))
      .addIntegerOption(option =>
        option.setName('seconds')
          .setDescription('New time in seconds to reach destination')
          .setRequired(true)
          .setMinValue(1))
      .addIntegerOption(option =>
        option.setName('group')
          .setDescription('New attack group number (optional)')
          .setRequired(false)
          .setMinValue(1))
      .toJSON());

    // Remove player command
    this.commands.set('remove', new SlashCommandBuilder()
      .setName('remove')
      .setDescription('Remove a player from the list')
      .addStringOption(option =>
        option.setName('playername')
          .setDescription('Name of the player to remove')
          .setRequired(true))
      .toJSON());

    // Clear all players command
    this.commands.set('clear', new SlashCommandBuilder()
      .setName('clear')
      .setDescription('Remove all registered players')
      .toJSON());

    // Clear players by group command
    this.commands.set('cleargroup', new SlashCommandBuilder()
      .setName('cleargroup')
      .setDescription('Remove all players from a specific attack group')
      .addIntegerOption(option =>
        option.setName('group')
          .setDescription('Attack group number to clear')
          .setRequired(true)
          .setMinValue(1))
      .toJSON());

    // List players command
    this.commands.set('list', new SlashCommandBuilder()
      .setName('list')
      .setDescription('List all registered players')
      .toJSON());

    // Join voice channel command
    this.commands.set('join', new SlashCommandBuilder()
      .setName('join')
      .setDescription('Join the voice channel you are currently in')
      .toJSON());

    // Leave voice channel command
    this.commands.set('leave', new SlashCommandBuilder()
      .setName('leave')
      .setDescription('Leave the voice channel')
      .toJSON());

    // Launch attack command
    this.commands.set('launch', new SlashCommandBuilder()
      .setName('launch')
      .setDescription('Launch synchronized attack sequence')
      .addIntegerOption(option =>
        option.setName('group')
          .setDescription('Attack group to launch (default: all groups)')
          .setRequired(false)
          .setMinValue(1))
      .toJSON());

    // Preview attack command
    this.commands.set('preview', new SlashCommandBuilder()
      .setName('preview')
      .setDescription('Preview the attack sequence without launching')
      .addIntegerOption(option =>
        option.setName('group')
          .setDescription('Attack group to preview (default: all groups)')
          .setRequired(false)
          .setMinValue(1))
      .toJSON());

    // Stop attack command
    this.commands.set('stop', new SlashCommandBuilder()
      .setName('stop')
      .setDescription('Stop the current attack countdown')
      .toJSON());

    // Status command
    this.commands.set('status', new SlashCommandBuilder()
      .setName('status')
      .setDescription('Show current bot status and player count')
      .toJSON());

    // Rally management commands
    this.commands.set('rallyadd', new SlashCommandBuilder()
      .setName('rallyadd')
      .setDescription('Add an enemy rally to track')
      .addStringOption(option =>
        option.setName('name')
          .setDescription('Name of the enemy rally')
          .setRequired(true))
      .addIntegerOption(option =>
        option.setName('time')
          .setDescription('Rally preparation time in minutes')
          .setRequired(true)
          .setMinValue(1))
      .addIntegerOption(option =>
        option.setName('travel')
          .setDescription('Travel distance in seconds')
          .setRequired(true)
          .setMinValue(1))
      .addIntegerOption(option =>
        option.setName('group')
          .setDescription('Attack group number (default: 1)')
          .setRequired(false)
          .setMinValue(1))
      .toJSON());

    this.commands.set('rallystart', new SlashCommandBuilder()
      .setName('rallystart')
      .setDescription('Start a saved rally group')
      .addStringOption(option =>
        option.setName('groupid')
          .setDescription('Group ID of the saved rally to start')
          .setRequired(true))
      .toJSON());

    this.commands.set('rallylist', new SlashCommandBuilder()
      .setName('rallylist')
      .setDescription('List all enemy rallies')
      .toJSON());

    this.commands.set('rallyremove', new SlashCommandBuilder()
      .setName('rallyremove')
      .setDescription('Remove an enemy rally')
      .addStringOption(option =>
        option.setName('name')
          .setDescription('Name of the rally to remove')
          .setRequired(true))
      .toJSON());


    this.commands.set('rallypreview', new SlashCommandBuilder()
      .setName('rallypreview')
      .setDescription('Preview attack sequence against a rally without launching')
      .addStringOption(option =>
        option.setName('name')
          .setDescription('Name of the rally to preview')
          .setRequired(true))
      .toJSON());

    this.commands.set('rallyannounce', new SlashCommandBuilder()
      .setName('rallyannounce')
      .setDescription('Manually announce that a rally has started')
      .addStringOption(option =>
        option.setName('name')
          .setDescription('Name of the rally to announce')
          .setRequired(true))
      .toJSON());

    // Saved Rally Group Commands
    this.commands.set('rallysave', new SlashCommandBuilder()
      .setName('rallysave')
      .setDescription('Save a rally group with players for future use')
      .addStringOption(option =>
        option.setName('groupid')
          .setDescription('Unique group ID to save this rally configuration')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('rallyname')
          .setDescription('Name of the rally')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('time')
          .setDescription('Rally time (format: 1:30 for 1 min 30 sec, or 90 for 90 seconds)')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('travel')
          .setDescription('Travel distance (format: 1:30 for 1 min 30 sec, or 90 for 90 seconds)')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('players')
          .setDescription('Comma-separated list of players (format: PlayerA:25,PlayerB:30 or PlayerA:11:02)')
          .setRequired(true))
      .toJSON());


    this.commands.set('rallygroups', new SlashCommandBuilder()
      .setName('rallygroups')
      .setDescription('List all saved rally groups')
      .toJSON());

    this.commands.set('rallydelete', new SlashCommandBuilder()
      .setName('rallydelete')
      .setDescription('Delete a saved rally group')
      .addStringOption(option =>
        option.setName('groupid')
          .setDescription('Group ID of the rally group to delete')
          .setRequired(true))
      .toJSON());

    this.commands.set('rallyedit', new SlashCommandBuilder()
      .setName('rallyedit')
      .setDescription('Edit a saved rally group')
      .addStringOption(option =>
        option.setName('groupid')
          .setDescription('Group ID of the rally group to edit')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('rallyname')
          .setDescription('New rally name (optional)')
          .setRequired(false))
      .addStringOption(option =>
        option.setName('time')
          .setDescription('New rally time (format: 1:30 for 1 min 30 sec, or 90 for 90 seconds)')
          .setRequired(false))
      .addStringOption(option =>
        option.setName('travel')
          .setDescription('New travel distance (format: 1:30 for 1 min 30 sec, or 90 for 90 seconds)')
          .setRequired(false))
      .addStringOption(option =>
        option.setName('players')
          .setDescription('New players list (format: PlayerA:25,PlayerB:30 or PlayerA:11:02)')
          .setRequired(false))
      .toJSON());
  }

  async registerCommands() {
    try {
      const { REST, Routes } = require('discord.js');
      const path = require('path');
      const config = require(path.join(__dirname, '../config.json'));
      
      const rest = new REST({ version: '10' }).setToken(config.token);
      
      console.log('Started refreshing application (/) commands.');
      
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: Array.from(this.commands.values()) }
      );
      
      console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
      console.error('Error registering commands:', error);
    }
  }

  async handleCommand(interaction) {
    const commandName = interaction.commandName;
    
    switch (commandName) {
      case 'register':
        await this.handleRegister(interaction);
        break;
      case 'update':
        await this.handleUpdate(interaction);
        break;
      case 'remove':
        await this.handleRemove(interaction);
        break;
      case 'clear':
        await this.handleClear(interaction);
        break;
      case 'cleargroup':
        await this.handleClearGroup(interaction);
        break;
      case 'list':
        await this.handleList(interaction);
        break;
      case 'join':
        await this.handleJoin(interaction);
        break;
      case 'leave':
        await this.handleLeave(interaction);
        break;
      case 'launch':
        await this.handleLaunch(interaction);
        break;
      case 'preview':
        await this.handlePreview(interaction);
        break;
      case 'stop':
        await this.handleStop(interaction);
        break;
      case 'status':
        await this.handleStatus(interaction);
        break;
      case 'rallyadd':
        await this.handleRallyAdd(interaction);
        break;
      case 'rallystart':
        await this.handleRallyStart(interaction);
        break;
      case 'rallylist':
        await this.handleRallyList(interaction);
        break;
      case 'rallyremove':
        await this.handleRallyRemove(interaction);
        break;
      case 'rallypreview':
        await this.handleRallyPreview(interaction);
        break;
      case 'rallyannounce':
        await this.handleRallyAnnounce(interaction);
        break;
      case 'rallysave':
        await this.handleRallySave(interaction);
        break;
      case 'rallygroups':
        await this.handleRallyGroups(interaction);
        break;
      case 'rallydelete':
        await this.handleRallyDelete(interaction);
        break;
      case 'rallyedit':
        await this.handleRallyEdit(interaction);
        break;
      default:
        await interaction.reply({ 
          content: 'Unknown command!', 
          ephemeral: true 
        });
    }
  }

  async handleRegister(interaction) {
    const playerName = interaction.options.getString('playername');
    const seconds = interaction.options.getInteger('seconds');
    const group = interaction.options.getInteger('group') || 1;

    try {
      const player = this.client.playerManager.registerPlayer(playerName, seconds, group);
      
      const embed = new EmbedBuilder()
        .setTitle('✅ Player Registered!')
        .setColor('#4CAF50')
        .setDescription(`**${playerName}** has been registered with **${seconds} seconds** to destination in **Attack Group ${group}**.`)
        .addFields(
          { name: 'Total Players', value: this.client.playerManager.getPlayerCount().toString(), inline: true },
          { name: 'Attack Group', value: `Group ${group}`, inline: true },
          { name: 'Registered At', value: new Date(player.registeredAt).toLocaleString(), inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      await interaction.reply({ 
        content: `❌ Error: ${error.message}`, 
        ephemeral: true 
      });
    }
  }

  async handleUpdate(interaction) {
    const playerName = interaction.options.getString('playername');
    const seconds = interaction.options.getInteger('seconds');
    const group = interaction.options.getInteger('group');

    try {
      const player = this.client.playerManager.updatePlayer(playerName, seconds, group);
      
      let description = `**${playerName}** has been updated to **${seconds} seconds** to destination.`;
      if (group !== null) {
        description += ` Moved to **Attack Group ${group}**.`;
      }
      
      const embed = new EmbedBuilder()
        .setTitle('🔄 Player Updated!')
        .setColor('#FF9800')
        .setDescription(description)
        .addFields(
          { name: 'Updated At', value: new Date(player.updatedAt).toLocaleString(), inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      await interaction.reply({ 
        content: `❌ Error: ${error.message}`, 
        ephemeral: true 
      });
    }
  }

  async handleRemove(interaction) {
    const playerName = interaction.options.getString('playername');

    try {
      this.client.playerManager.removePlayer(playerName);
      
      const embed = new EmbedBuilder()
        .setTitle('🗑️ Player Removed!')
        .setColor('#F44336')
        .setDescription(`**${playerName}** has been removed from the player list.`)
        .addFields(
          { name: 'Remaining Players', value: this.client.playerManager.getPlayerCount().toString(), inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      await interaction.reply({ 
        content: `❌ Error: ${error.message}`, 
        ephemeral: true 
      });
    }
  }

  async handleClear(interaction) {
    try {
      const count = this.client.playerManager.clearAllPlayers();
      
      const embed = new EmbedBuilder()
        .setTitle('🧹 All Players Cleared!')
        .setColor('#9C27B0')
        .setDescription(`**${count} players** have been removed from the list.`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      await interaction.reply({ 
        content: `❌ Error: ${error.message}`, 
        ephemeral: true 
      });
    }
  }

  async handleClearGroup(interaction) {
    const group = interaction.options.getInteger('group');

    try {
      const playersInGroup = this.client.playerManager.getPlayersByGroup(group);
      const count = playersInGroup.length;
      
      if (count === 0) {
        await interaction.reply({ 
          content: `❌ No players found in Attack Group ${group}!`, 
          ephemeral: true 
        });
        return;
      }

      // Remove each player in the group
      playersInGroup.forEach(player => {
        this.client.playerManager.removePlayer(player.name);
      });
      
      const embed = new EmbedBuilder()
        .setTitle('🧹 Attack Group Cleared!')
        .setColor('#9C27B0')
        .setDescription(`**${count} players** have been removed from **Attack Group ${group}**.`)
        .addFields(
          { name: 'Removed Players', value: playersInGroup.map(p => p.name).join(', '), inline: false }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      await interaction.reply({ 
        content: `❌ Error: ${error.message}`, 
        ephemeral: true 
      });
    }
  }

  async handleList(interaction) {
    const players = this.client.playerManager.getAllPlayers();
    const groups = this.client.playerManager.getAttackGroups();
    
    if (players.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('📋 Player List')
        .setColor('#607D8B')
        .setDescription('No players registered yet.')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('📋 Registered Players')
      .setColor('#2196F3')
      .setDescription(`Total Players: **${players.length}** | Attack Groups: **${groups.join(', ')}**`)
      .addFields(
        players.map(player => ({
          name: `${player.name} (Group ${player.attackGroup})`,
          value: `⏱️ **${player.timeToDestination}s** to destination\n📅 Registered: ${new Date(player.registeredAt).toLocaleString()}`,
          inline: true
        }))
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }

  async handleJoin(interaction) {
    try {
      await this.client.voiceManager.joinVoiceChannel(interaction);
      
      const embed = new EmbedBuilder()
        .setTitle('🎤 Voice Channel Joined!')
        .setColor('#4CAF50')
        .setDescription('Bot is now in the voice channel and ready for synchronized attacks!')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      await interaction.reply({ 
        content: `❌ Error: ${error.message}`, 
        ephemeral: true 
      });
    }
  }

  async handleLeave(interaction) {
    try {
      this.client.voiceManager.leaveVoiceChannel(interaction.guildId);
      
      const embed = new EmbedBuilder()
        .setTitle('👋 Voice Channel Left!')
        .setColor('#F44336')
        .setDescription('Bot has left the voice channel.')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      await interaction.reply({ 
        content: `❌ Error: ${error.message}`, 
        ephemeral: true 
      });
    }
  }

  async handleLaunch(interaction) {
    try {
      const group = interaction.options.getInteger('group');

      // Check if bot is in voice channel
      if (!this.client.voiceManager.isInVoiceChannel(interaction.guildId)) {
        await interaction.reply({ 
          content: '❌ Bot must be in a voice channel first! Use `/join` to add the bot to your voice channel.', 
          ephemeral: true 
        });
        return;
      }

      // Check if players are registered
      if (this.client.playerManager.getPlayerCount() === 0) {
        await interaction.reply({ 
          content: '❌ No players registered! Use `/register` to add players first.', 
          ephemeral: true 
        });
        return;
      }

      // Calculate attack timing
      const attackTiming = this.client.playerManager.calculateAttackTiming(group);
      
      // Start the countdown
      await this.client.voiceManager.startAttackCountdown(interaction, attackTiming);
      
    } catch (error) {
      await interaction.reply({ 
        content: `❌ Error: ${error.message}`, 
        ephemeral: true 
      });
    }
  }

  async handlePreview(interaction) {
    try {
      const group = interaction.options.getInteger('group');

      // Check if players are registered
      if (this.client.playerManager.getPlayerCount() === 0) {
        await interaction.reply({ 
          content: '❌ No players registered! Use `/register` to add players first.', 
          ephemeral: true 
        });
        return;
      }

      // Calculate attack timing
      const attackTiming = this.client.playerManager.calculateAttackTiming(group);
      
      // Generate preview embed (same as launch but without starting countdown)
      const { players, totalDuration, attackGroup } = attackTiming;
      
      const groupText = attackGroup ? `Attack Group ${attackGroup}` : 'All Groups';
      
      const embed = new EmbedBuilder()
        .setTitle('👁️ Attack Sequence Preview')
        .setColor('#9C27B0')
        .setDescription(`**${groupText}**\n**Total Duration:** ${totalDuration} seconds\n**Players:** ${players.length}\n\n*This is a preview - no countdown will be started.*`)
        .addFields(
          players.map(player => ({
            name: `Player ${player.attackOrder}: ${player.name} (Group ${player.attackGroup})`,
            value: `Starts in: **${player.attackStartTime}s** | Arrives in: **${player.timeToDestination}s**`,
            inline: false
          }))
        )
        .addFields(
          { name: '🎤 Voice Channel Status', value: this.client.voiceManager.isInVoiceChannel(interaction.guildId) ? '✅ Connected' : '❌ Not Connected', inline: true },
          { name: '🚀 Ready to Launch', value: this.client.voiceManager.isInVoiceChannel(interaction.guildId) ? '✅ Yes' : '❌ Use `/join` first', inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      await interaction.reply({ 
        content: `❌ Error: ${error.message}`, 
        ephemeral: true 
      });
    }
  }

  async handleStop(interaction) {
    try {
      // Check if there's an active countdown
      if (!this.client.voiceManager.isCountdownActive(interaction.guildId)) {
        await interaction.reply({ 
          content: '❌ No active attack countdown to stop!', 
          ephemeral: true 
        });
        return;
      }

      // Stop the countdown
      await this.client.voiceManager.stopAttackCountdown(interaction);
      
      const embed = new EmbedBuilder()
        .setTitle('⏹️ Attack Countdown Stopped!')
        .setColor('#F44336')
        .setDescription('The synchronized attack countdown has been cancelled.')
        .addFields(
          { name: 'Status', value: 'Countdown stopped and reset', inline: true },
          { name: 'Ready for New Launch', value: '✅ Yes', inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Stop command error:', error);
      
      // Try to reply, but handle the case where interaction might have timed out
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({ 
            content: `❌ Error: ${error.message}`, 
            ephemeral: true 
          });
        } else {
          await interaction.reply({ 
            content: `❌ Error: ${error.message}`, 
            ephemeral: true 
          });
        }
      } catch (replyError) {
        console.error('Failed to reply to interaction:', replyError);
      }
    }
  }

  async handleStatus(interaction) {
    const playerCount = this.client.playerManager.getPlayerCount();
    const groups = this.client.playerManager.getAttackGroups();
    const rallyCount = this.client.rallyManager.getRallyCount();
    const rallyGroups = this.client.rallyManager.getRallyAttackGroups();
    const inVoiceChannel = this.client.voiceManager.isInVoiceChannel(interaction.guildId);
    const countdownActive = this.client.voiceManager.isCountdownActive(interaction.guildId);
    
    const embed = new EmbedBuilder()
      .setTitle('📊 Bot Status')
      .setColor('#2196F3')
      .addFields(
        { name: '🎮 Players Registered', value: playerCount.toString(), inline: true },
        { name: '⚔️ Attack Groups', value: groups.length > 0 ? groups.join(', ') : 'None', inline: true },
        { name: '🎤 Voice Channel', value: inVoiceChannel ? '✅ Connected' : '❌ Not Connected', inline: true },
        { name: '🚀 Ready for Launch', value: (playerCount > 0 && inVoiceChannel) ? '✅ Yes' : '❌ No', inline: true },
        { name: '⏱️ Countdown Active', value: countdownActive ? '🔄 Running' : '⏹️ Stopped', inline: true },
        { name: '⚔️ Enemy Rallies', value: rallyCount.toString(), inline: true },
        { name: '🎯 Rally Groups', value: rallyGroups.length > 0 ? rallyGroups.join(', ') : 'None', inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }

  async handleRallyAdd(interaction) {
    const rallyName = interaction.options.getString('name');
    const timeMinutes = interaction.options.getInteger('time');
    const travelSeconds = interaction.options.getInteger('travel');
    const group = interaction.options.getInteger('group') || 1;

    try {
      const rally = this.client.rallyManager.addRally(rallyName, timeMinutes, travelSeconds, group);
      
      const embed = new EmbedBuilder()
        .setTitle('⚔️ Enemy Rally Added!')
        .setColor('#FF6B6B')
        .setDescription(`**${rallyName}** has been added to track enemy rally.`)
        .addFields(
          { name: 'Rally Time', value: `${timeMinutes} minutes`, inline: true },
          { name: 'Travel Distance', value: `${travelSeconds} seconds`, inline: true },
          { name: 'Total Time', value: `${timeMinutes}m ${travelSeconds}s`, inline: true },
          { name: 'Attack Group', value: `Group ${group}`, inline: true },
          { name: 'Status', value: '⏳ Not Started', inline: true },
          { name: 'Next Step', value: 'Use `/rallystart` to begin the rally', inline: false }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      await interaction.reply({ 
        content: `❌ Error: ${error.message}`, 
        ephemeral: true 
      });
    }
  }

  async handleRallyStart(interaction) {
    const groupId = interaction.options.getString('groupid');

    try {
      // Check if saved group exists
      if (!this.client.rallyManager.hasSavedRallyGroup(groupId)) {
        await interaction.reply({ 
          content: `❌ Saved rally group "${groupId}" not found! Use \`/rallygroups\` to see available groups.`, 
          ephemeral: true 
        });
        return;
      }

      // Check if bot is in voice channel
      if (!this.client.voiceManager.isInVoiceChannel(interaction.guildId)) {
        await interaction.reply({ 
          content: '❌ Bot must be in a voice channel first! Use `/join` to add the bot to your voice channel.', 
          ephemeral: true 
        });
        return;
      }

      // Load the saved rally group
      const loadedGroup = this.client.rallyManager.loadSavedRallyGroup(groupId, this.client.playerManager);

      // Start the rally automatically
      this.client.rallyManager.startRally(loadedGroup.rally.name);

      const totalTimeSeconds = (loadedGroup.rally.rallyTimeMinutes * 60) + loadedGroup.rally.travelDistanceSeconds;
      
      const embed = new EmbedBuilder()
        .setTitle('🚀 Rally Group Started!')
        .setColor('#4CAF50')
        .setDescription(`**${loadedGroup.rally.name}** rally has been started from group **${groupId}**!`)
        .addFields(
          { name: 'Rally Time', value: `${loadedGroup.rally.rallyTimeMinutes} minutes`, inline: true },
          { name: 'Travel Distance', value: `${loadedGroup.rally.travelDistanceSeconds} seconds`, inline: true },
          { name: 'Total Time', value: `${loadedGroup.rally.rallyTimeMinutes}m ${loadedGroup.rally.travelDistanceSeconds}s`, inline: true },
          { name: 'Attack Group', value: `Group ${loadedGroup.rally.attackGroup}`, inline: true },
          { name: 'Status', value: '🔴 Active', inline: true },
          { name: 'Enemy Arrives In', value: `${totalTimeSeconds} seconds`, inline: false },
          { name: 'Players Loaded', value: loadedGroup.players.map(p => {
            if (p.type === 'travel') {
              return `${p.name} (${p.timeToDestination}s travel)`;
            } else if (p.type === 'send') {
              const minutes = Math.floor(p.sendTime / 60);
              const seconds = p.sendTime % 60;
              const timeStr = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`;
              return `${p.name} (${timeStr} send)`;
            }
            return `${p.name} (unknown)`;
          }).join(', '), inline: false },
          { name: 'Reinforcement', value: 'Starting automatically...', inline: false }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      // Announce rally start in voice channel
      await this.client.voiceManager.announceRallyStart(loadedGroup.rally.name);

      // Calculate and start reinforcement timing
      const players = this.client.playerManager.getAllPlayers();
      const attackTiming = this.client.rallyManager.calculateRallyAttackTiming(loadedGroup.rally.name, players);
      
      // Start the rally countdown automatically
      await this.client.voiceManager.startRallyCountdown(interaction, attackTiming);
      
    } catch (error) {
      await interaction.reply({ 
        content: `❌ Error: ${error.message}`, 
        ephemeral: true 
      });
    }
  }

  async handleRallyList(interaction) {
    const rallies = this.client.rallyManager.getAllRallies();
    
    if (rallies.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('⚔️ Enemy Rallies')
        .setColor('#607D8B')
        .setDescription('No enemy rallies tracked yet.')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('⚔️ Tracked Enemy Rallies')
      .setColor('#FF6B6B')
      .setDescription(`Total Rallies: **${rallies.length}**`)
      .addFields(
        rallies.map(rally => {
          const status = rally.isStarted ? '🔴 Started' : '⏳ Not Started';
          const timeUntilEnemy = this.client.rallyManager.getTimeUntilEnemyArrival(rally.name);
          const timeText = timeUntilEnemy !== null ? `${timeUntilEnemy}s` : 'Not started';
          const totalTime = (rally.rallyTimeMinutes * 60) + rally.travelDistanceSeconds;
          
          return {
            name: `${rally.name} (Group ${rally.attackGroup}) ${status}`,
            value: `**Rally Time:** ${rally.rallyTimeMinutes}m | **Travel:** ${rally.travelDistanceSeconds}s | **Total:** ${totalTime}s\n**Status:** ${status} | **Enemy Arrives In:** ${timeText}\n**Started At:** ${rally.startedAt ? rally.startedAt.toLocaleString() : 'Not started'}`,
            inline: false
          };
        })
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }

  async handleRallyRemove(interaction) {
    const rallyName = interaction.options.getString('name');

    try {
      this.client.rallyManager.removeRally(rallyName);
      
      const embed = new EmbedBuilder()
        .setTitle('🗑️ Rally Removed!')
        .setColor('#F44336')
        .setDescription(`**${rallyName}** has been removed from tracking.`)
        .addFields(
          { name: 'Remaining Rallies', value: this.client.rallyManager.getRallyCount().toString(), inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      await interaction.reply({ 
        content: `❌ Error: ${error.message}`, 
        ephemeral: true 
      });
    }
  }


  async handleRallyPreview(interaction) {
    try {
      const rallyName = interaction.options.getString('name');

      // Check if rally exists
      if (!this.client.rallyManager.hasRally(rallyName)) {
        await interaction.reply({ 
          content: `❌ Rally "${rallyName}" not found! Use \`/rallylist\` to see available rallies.`, 
          ephemeral: true 
        });
        return;
      }

      // Check if players are registered
      if (this.client.playerManager.getPlayerCount() === 0) {
        await interaction.reply({ 
          content: '❌ No players registered! Use `/register` to add players first.', 
          ephemeral: true 
        });
        return;
      }

      // Get rally and calculate timing
      const rally = this.client.rallyManager.getRally(rallyName);
      const players = this.client.playerManager.getAllPlayers();
      const attackTiming = this.client.rallyManager.calculateRallyAttackTiming(rallyName, players);
      
      // Generate preview embed
      const { players: timingPlayers, rally: rallyData, groupedPlayers } = attackTiming;
      
      const embed = new EmbedBuilder()
        .setTitle('👁️ Rally Attack Sequence Preview')
        .setColor('#9C27B0')
        .setDescription(`**Rally:** ${rallyName}\n**Enemy Arrives:** ${rallyData.enemyArrivalTime.toLocaleString()}\n**Our Attack:** ${rallyData.ourAttackTime.toLocaleString()}\n**Players:** ${timingPlayers.length}\n\n*This is a preview - no countdown will be started.*`)
        .addFields(
          groupedPlayers.map(group => {
            const playerNames = group.players.map(p => p.name).join(', ');
            const timeText = group.attackTime === 0 ? 'Immediately' : `In ${group.attackTime}s`;
            return {
              name: `Attack Group (${timeText})`,
              value: `**Players:** ${playerNames}\n**Attack Time:** ${timeText}`,
              inline: false
            };
          })
        )
        .addFields(
          { name: '🎤 Voice Channel Status', value: this.client.voiceManager.isInVoiceChannel(interaction.guildId) ? '✅ Connected' : '❌ Not Connected', inline: true },
          { name: '🚀 Ready to Launch', value: this.client.voiceManager.isInVoiceChannel(interaction.guildId) ? '✅ Yes' : '❌ Use `/join` first', inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      await interaction.reply({ 
        content: `❌ Error: ${error.message}`, 
        ephemeral: true 
      });
    }
  }

  async handleRallyAnnounce(interaction) {
    try {
      const rallyName = interaction.options.getString('name');

      // Check if rally exists
      if (!this.client.rallyManager.hasRally(rallyName)) {
        await interaction.reply({ 
          content: `❌ Rally "${rallyName}" not found! Use \`/rallylist\` to see available rallies.`, 
          ephemeral: true 
        });
        return;
      }

      // Check if bot is in voice channel
      if (!this.client.voiceManager.isInVoiceChannel(interaction.guildId)) {
        await interaction.reply({ 
          content: '❌ Bot must be in a voice channel first! Use `/join` to add the bot to your voice channel.', 
          ephemeral: true 
        });
        return;
      }

      // Announce rally start
      await this.client.voiceManager.announceRallyStart(rallyName);
      
      const embed = new EmbedBuilder()
        .setTitle('🔊 Rally Start Announced!')
        .setColor('#FF6B6B')
        .setDescription(`Rally start announcement for **${rallyName}** has been played in voice channel.`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      await interaction.reply({ 
        content: `❌ Error: ${error.message}`, 
        ephemeral: true 
      });
    }
  }

  async handleRallySave(interaction) {
    try {
      const groupId = interaction.options.getString('groupid');
      const rallyName = interaction.options.getString('rallyname');
      const timeString = interaction.options.getString('time');
      const travelString = interaction.options.getString('travel');
      const playersString = interaction.options.getString('players');

      // Parse time string
      let timeMinutes, travelSeconds;
      try {
        const timeTotalSeconds = this.client.rallyManager.parseTimeString(timeString);
        timeMinutes = Math.floor(timeTotalSeconds / 60);
      } catch (error) {
        await interaction.reply({ 
          content: `❌ Invalid time format: ${error.message}`, 
          ephemeral: true 
        });
        return;
      }

      try {
        travelSeconds = this.client.rallyManager.parseTimeString(travelString);
      } catch (error) {
        await interaction.reply({ 
          content: `❌ Invalid travel format: ${error.message}`, 
          ephemeral: true 
        });
        return;
      }

      // Parse players string (format: PlayerA:25,PlayerB:30 or PlayerA:11:02)
      const players = [];
      const playerEntries = playersString.split(',');
      
      for (const entry of playerEntries) {
        try {
          const parsedPlayer = this.client.rallyManager.parsePlayerString(entry.trim());
          players.push(parsedPlayer);
        } catch (error) {
          throw new Error(`Invalid player format: "${entry}". ${error.message}`);
        }
      }

      // Save the rally group
      const savedGroup = this.client.rallyManager.saveRallyGroup(
        groupId,
        rallyName,
        timeMinutes,
        travelSeconds,
        players
      );

      const embed = new EmbedBuilder()
        .setTitle('💾 Rally Group Saved!')
        .setColor('#4CAF50')
        .setDescription(`Rally group **${groupId}** has been saved successfully.`)
        .addFields(
          { name: 'Rally Name', value: savedGroup.rallyName, inline: true },
          { name: 'Rally Time', value: `${savedGroup.rallyTimeMinutes} minutes`, inline: true },
          { name: 'Travel Distance', value: `${savedGroup.travelDistanceSeconds} seconds`, inline: true },
          { name: 'Players', value: savedGroup.players.map(p => {
            if (p.type === 'travel') {
              return `${p.name} (${p.timeToDestination}s travel)`;
            } else if (p.type === 'send') {
              const minutes = Math.floor(p.sendTime / 60);
              const seconds = p.sendTime % 60;
              const timeStr = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`;
              return `${p.name} (${timeStr} send)`;
            }
            return `${p.name} (unknown)`;
          }).join(', '), inline: false },
          { name: 'Saved At', value: savedGroup.savedAt.toLocaleString(), inline: false }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      await interaction.reply({ 
        content: `❌ Error: ${error.message}`, 
        ephemeral: true 
      });
    }
  }


  async handleRallyGroups(interaction) {
    try {
      const savedGroups = this.client.rallyManager.getAllSavedRallyGroups();
      
      if (savedGroups.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle('📋 Saved Rally Groups')
          .setColor('#FFA500')
          .setDescription('No saved rally groups found. Use `/rallysave` to save a rally group.')
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('📋 Saved Rally Groups')
        .setColor('#4CAF50')
        .setDescription(`Found ${savedGroups.length} saved rally group(s).`)
        .setTimestamp();

      savedGroups.forEach((group, index) => {
        const playersList = group.players.map(p => {
          if (p.type === 'travel') {
            return `${p.name} (${p.timeToDestination}s travel)`;
          } else if (p.type === 'send') {
            const minutes = Math.floor(p.sendTime / 60);
            const seconds = p.sendTime % 60;
            const timeStr = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`;
            return `${p.name} (${timeStr} send)`;
          }
          return `${p.name} (unknown)`;
        }).join(', ');
        const totalTime = group.rallyTimeMinutes * 60 + group.travelDistanceSeconds;
        
        embed.addFields({
          name: `Group ${index + 1}: ${group.groupId}`,
          value: `**Rally:** ${group.rallyName}\n**Time:** ${group.rallyTimeMinutes}m ${group.travelDistanceSeconds}s (${totalTime}s total)\n**Players:** ${playersList}\n**Saved:** ${group.savedAt.toLocaleDateString()}`,
          inline: false
        });
      });

      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      await interaction.reply({ 
        content: `❌ Error: ${error.message}`, 
        ephemeral: true 
      });
    }
  }

  async handleRallyDelete(interaction) {
    try {
      const groupId = interaction.options.getString('groupid');

      // Check if saved group exists
      if (!this.client.rallyManager.hasSavedRallyGroup(groupId)) {
        await interaction.reply({ 
          content: `❌ Saved rally group "${groupId}" not found! Use \`/rallygroups\` to see available groups.`, 
          ephemeral: true 
        });
        return;
      }

      // Get group info before deleting
      const groupInfo = this.client.rallyManager.getSavedRallyGroup(groupId);

      // Delete the saved group
      this.client.rallyManager.deleteSavedRallyGroup(groupId);

      const embed = new EmbedBuilder()
        .setTitle('🗑️ Rally Group Deleted!')
        .setColor('#F44336')
        .setDescription(`Rally group **${groupId}** has been deleted successfully.`)
        .addFields(
          { name: 'Rally Name', value: groupInfo.rallyName, inline: true },
          { name: 'Rally Time', value: `${groupInfo.rallyTimeMinutes} minutes`, inline: true },
          { name: 'Travel Distance', value: `${groupInfo.travelDistanceSeconds} seconds`, inline: true },
          { name: 'Players', value: groupInfo.players.map(p => {
            if (p.type === 'travel') {
              return `${p.name} (${p.timeToDestination}s travel)`;
            } else if (p.type === 'send') {
              const minutes = Math.floor(p.sendTime / 60);
              const seconds = p.sendTime % 60;
              const timeStr = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`;
              return `${p.name} (${timeStr} send)`;
            }
            return `${p.name} (unknown)`;
          }).join(', '), inline: false }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      await interaction.reply({ 
        content: `❌ Error: ${error.message}`, 
        ephemeral: true 
      });
    }
  }

  async handleRallyEdit(interaction) {
    try {
      const groupId = interaction.options.getString('groupid');
      const newRallyName = interaction.options.getString('rallyname');
      const newTimeString = interaction.options.getString('time');
      const newTravelString = interaction.options.getString('travel');
      const newPlayersString = interaction.options.getString('players');

      // Check if saved group exists
      if (!this.client.rallyManager.hasSavedRallyGroup(groupId)) {
        await interaction.reply({ 
          content: `❌ Saved rally group "${groupId}" not found! Use \`/rallygroups\` to see available groups.`, 
          ephemeral: true 
        });
        return;
      }

      // Get current group info
      const currentGroup = this.client.rallyManager.getSavedRallyGroup(groupId);

      // Prepare updates object
      const updates = {};

      // Update rally name if provided
      if (newRallyName !== null) {
        updates.rallyName = newRallyName;
      }

      // Update rally time if provided
      if (newTimeString !== null) {
        try {
          const totalSeconds = this.client.rallyManager.parseTimeString(newTimeString);
          updates.rallyTimeMinutes = Math.floor(totalSeconds / 60);
        } catch (error) {
          await interaction.reply({ 
            content: `❌ Invalid time format: ${error.message}`, 
            ephemeral: true 
          });
          return;
        }
      }

      // Update travel distance if provided
      if (newTravelString !== null) {
        try {
          const totalSeconds = this.client.rallyManager.parseTimeString(newTravelString);
          updates.travelDistanceSeconds = totalSeconds;
        } catch (error) {
          await interaction.reply({ 
            content: `❌ Invalid travel format: ${error.message}`, 
            ephemeral: true 
          });
          return;
        }
      }

      // Update players if provided
      if (newPlayersString !== null) {
        try {
          // Parse players string (format: PlayerA:25,PlayerB:30 or PlayerA:11:02)
          const players = [];
          const playerEntries = newPlayersString.split(',');
          
          for (const entry of playerEntries) {
            try {
              const parsedPlayer = this.client.rallyManager.parsePlayerString(entry.trim());
              players.push(parsedPlayer);
            } catch (error) {
              throw new Error(`Invalid player format: "${entry}". ${error.message}`);
            }
          }

          updates.players = players;
        } catch (error) {
          await interaction.reply({ 
            content: `❌ Invalid players format: ${error.message}`, 
            ephemeral: true 
          });
          return;
        }
      }

      // Check if any updates were provided
      if (Object.keys(updates).length === 0) {
        await interaction.reply({ 
          content: '❌ No updates provided. Please specify at least one field to update.', 
          ephemeral: true 
        });
        return;
      }

      // Update the saved group
      const updatedGroup = this.client.rallyManager.updateSavedRallyGroup(groupId, updates);

      const embed = new EmbedBuilder()
        .setTitle('✏️ Rally Group Updated!')
        .setColor('#4CAF50')
        .setDescription(`Rally group **${groupId}** has been updated successfully.`)
        .addFields(
          { name: 'Rally Name', value: updatedGroup.rallyName, inline: true },
          { name: 'Rally Time', value: `${updatedGroup.rallyTimeMinutes} minutes`, inline: true },
          { name: 'Travel Distance', value: `${updatedGroup.travelDistanceSeconds} seconds`, inline: true },
          { name: 'Players', value: updatedGroup.players.map(p => {
            if (p.type === 'travel') {
              return `${p.name} (${p.timeToDestination}s travel)`;
            } else if (p.type === 'send') {
              const minutes = Math.floor(p.sendTime / 60);
              const seconds = p.sendTime % 60;
              const timeStr = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`;
              return `${p.name} (${timeStr} send)`;
            }
            return `${p.name} (unknown)`;
          }).join(', '), inline: false },
          { name: 'Updated At', value: updatedGroup.updatedAt.toLocaleString(), inline: false }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      await interaction.reply({ 
        content: `❌ Error: ${error.message}`, 
        ephemeral: true 
      });
    }
  }
}

module.exports = { CommandHandler }; 