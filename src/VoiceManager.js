const { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState
} = require('@discordjs/voice');
const { EmbedBuilder } = require('discord.js');
const { TTSService } = require('./TTSService');
const fs = require('fs');
const path = require('path');

class VoiceManager {
  constructor(client) {
    this.client = client;
    this.connections = new Map();
    this.audioPlayers = new Map();
    this.countdownTimers = new Map();
    this.ttsService = new TTSService();
    
    // Set TTS provider to local for actual voice output
    this.ttsService.setProvider('local');
  }

  // Join a voice channel
  async joinVoiceChannel(interaction) {
    const voiceChannel = interaction.member.voice.channel;
    
    if (!voiceChannel) {
      throw new Error('You need to be in a voice channel to use this command!');
    }

    try {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false
      });

      const audioPlayer = createAudioPlayer();
      connection.subscribe(audioPlayer);

      this.connections.set(interaction.guildId, connection);
      this.audioPlayers.set(interaction.guildId, audioPlayer);

      // Handle connection events
      connection.on(VoiceConnectionStatus.Ready, () => {
        console.log('Voice connection ready');
      });

      connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
        } catch (error) {
          connection.destroy();
          this.connections.delete(interaction.guildId);
          this.audioPlayers.delete(interaction.guildId);
        }
      });

      return connection;
    } catch (error) {
      throw new Error(`Failed to join voice channel: ${error.message}`);
    }
  }

  // Leave voice channel
  leaveVoiceChannel(guildId) {
    const connection = this.connections.get(guildId);
    if (connection) {
      connection.destroy();
      this.connections.delete(guildId);
      this.audioPlayers.delete(guildId);
      
      // Clear any active countdown
      const timer = this.countdownTimers.get(guildId);
      if (timer) {
        clearTimeout(timer);
        this.countdownTimers.delete(guildId);
      }
    }
  }

  // Start synchronized attack countdown
  async startAttackCountdown(interaction, attackTiming) {
    if (!this.connections.has(interaction.guildId)) {
      throw new Error('Bot is not in a voice channel. Use /join first.');
    }

    const { players, totalDuration } = attackTiming;
    
    // Create countdown embed
    const groupText = attackTiming.attackGroup ? `Attack Group ${attackTiming.attackGroup}` : 'All Groups';
    
    const embed = new EmbedBuilder()
      .setTitle('🚀 Attack Sequence Initiated!')
      .setColor('#FF6B6B')
      .setDescription(`**${groupText}**\n**Total Duration:** ${totalDuration} seconds\n**Players:** ${players.length}`)
      .addFields(
        players.map(player => ({
          name: `Player ${player.attackOrder}: ${player.name} (Group ${player.attackGroup})`,
          value: `Starts in: **${player.attackStartTime}s** | Arrives in: **${player.timeToDestination}s**`,
          inline: false
        }))
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Generate and play synchronized countdown
    await this.playSynchronizedCountdown(interaction.guildId, players, totalDuration);
  }

  // Start rally attack countdown with grouped announcements
  async startRallyCountdown(interaction, attackTiming) {
    if (!this.connections.has(interaction.guildId)) {
      throw new Error('Bot is not in a voice channel. Use /join first.');
    }

    const { rally, players, groupedPlayers, enemyArrivalTime, ourAttackTime } = attackTiming;
    
    // Create rally countdown embed
    const embed = new EmbedBuilder()
      .setTitle('⚔️ Rally Attack Sequence Initiated!')
      .setColor('#FF6B6B')
      .setDescription(`**Rally:** ${rally.name}\n**Enemy Arrives:** ${enemyArrivalTime.toLocaleString()}\n**Our Attack:** ${ourAttackTime.toLocaleString()}\n**Players:** ${players.length}`)
      .addFields(
        groupedPlayers.map(group => {
          const playerNames = group.players.map(p => p.name).join(', ');
          const timeText = group.attackTime === 0 ? 'Immediately' : `In ${group.attackTime}s`;
          return {
            name: `Attack Group (${timeText})`,
            value: `**Players:** ${playerNames}`,
            inline: false
          };
        })
      )
      .setTimestamp();

    // Send follow-up message instead of replying
    await interaction.followUp({ embeds: [embed] });

    // Generate and play rally countdown with grouped announcements
    await this.playRallyCountdown(interaction.guildId, rally, groupedPlayers);
  }

  // Stop the current attack countdown
  async stopAttackCountdown(interaction) {
    const guildId = interaction.guildId;
    
    // Clear any active countdown timers
    const timer = this.countdownTimers.get(guildId);
    if (timer) {
      clearTimeout(timer);
      this.countdownTimers.delete(guildId);
    }

    // Stop any ongoing audio
    const audioPlayer = this.audioPlayers.get(guildId);
    if (audioPlayer) {
      audioPlayer.stop();
    }

    // Clear the countdown state
    this.countdownTimers.delete(guildId);
    
    return true;
  }

  // Check if there's an active countdown
  isCountdownActive(guildId) {
    return this.countdownTimers.has(guildId);
  }

  // Play synchronized countdown sequence
  async playSynchronizedCountdown(guildId, players, totalDuration) {
    const connection = this.connections.get(guildId);
    const audioPlayer = this.audioPlayers.get(guildId);
    
    if (!connection || !audioPlayer) {
      throw new Error('Voice connection not available');
    }

    try {
      // Generate the complete synchronized countdown audio
      const audioResource = await this.ttsService.generateSynchronizedCountdown(players, totalDuration);
      
      if (audioResource) {
        // Store the countdown timer for potential stopping
        const countdownTimer = setTimeout(() => {
          this.countdownTimers.delete(guildId);
        }, (totalDuration + 5) * 1000); // Add 5 seconds buffer
        
        this.countdownTimers.set(guildId, countdownTimer);
        
        // Play the complete synchronized countdown
        audioPlayer.play(audioResource);
        
        // Wait for audio to finish
        return new Promise((resolve) => {
          audioPlayer.once(AudioPlayerStatus.Idle, () => {
            this.countdownTimers.delete(guildId);
            resolve();
          });
        });
      } else {
        throw new Error('Failed to generate countdown audio');
      }
      
    } catch (error) {
      console.error('Synchronized countdown error:', error);
      throw error;
    }
  }

  // Play rally countdown with grouped announcements for same-time players
  async playRallyCountdown(guildId, rally, groupedPlayers) {
    const connection = this.connections.get(guildId);
    const audioPlayer = this.audioPlayers.get(guildId);
    
    console.log(`🔊 playRallyCountdown called for guild ${guildId}`);
    console.log(`🔊 Connection exists: ${!!connection}`);
    console.log(`🔊 Audio player exists: ${!!audioPlayer}`);
    
    if (!connection || !audioPlayer) {
      throw new Error('Voice connection not available');
    }

    try {
      // Find the first player's attack time
      const firstPlayerTime = Math.min(...groupedPlayers.map(g => g.attackTime));
      const prepareTime = Math.max(0, firstPlayerTime - 10);
      
      // First, play the rally intro
      const introText = `${rally.name} has started a rally it will arrive after ${this.formatRallyTime(rally)}.`;
      console.log(`🔊 RALLY INTRO: ${introText}`);
      
      const introResource = await this.ttsService.generateSpeech(introText);
      if (introResource) {
        console.log(`🔊 Playing rally intro`);
        audioPlayer.play(introResource);
        await new Promise((resolve) => {
          audioPlayer.once(AudioPlayerStatus.Idle, resolve);
        });
        console.log(`🔊 Rally intro completed`);
      } else {
        console.log(`❌ Failed to generate rally intro`);
      }

      // Schedule "be ready" 10 seconds before first player
      if (prepareTime > 0) {
        console.log(`🔊 Scheduling prepare announcement in ${prepareTime} seconds`);
        setTimeout(async () => {
          console.log(`🔊 PREPARE ANNOUNCEMENT: Be ready.`);
          const prepareText = "Be ready.";
          const prepareResource = await this.ttsService.generateSpeech(prepareText);
          if (prepareResource) {
            console.log(`🔊 Playing prepare announcement`);
            audioPlayer.play(prepareResource);
          } else {
            console.log(`❌ Failed to generate prepare announcement`);
          }
        }, prepareTime * 1000);
      }

      // Schedule individual player announcements
      console.log(`🔊 Scheduling player announcements...`);
      await this.schedulePlayerAnnouncements(guildId, groupedPlayers, rally);
      console.log(`🔊 Player announcements scheduled`);
      
    } catch (error) {
      console.error('Rally countdown error:', error);
      throw error;
    }
  }

  // Format rally time for display
  formatRallyTime(rally) {
    const totalTimeSeconds = (rally.rallyTimeMinutes * 60) + rally.travelDistanceSeconds;
    const minutes = Math.floor(totalTimeSeconds / 60);
    const seconds = totalTimeSeconds % 60;
    
    if (minutes > 0) {
      return seconds > 0 ? `${minutes} minutes and ${seconds} seconds` : `${minutes} minutes`;
    } else {
      return `${seconds} seconds`;
    }
  }

  // Schedule player announcements at the correct times
  async schedulePlayerAnnouncements(guildId, groupedPlayers, rally) {
    const audioPlayer = this.audioPlayers.get(guildId);
    
    console.log('🔊 Scheduling player announcements for groups:', groupedPlayers.map(g => ({ 
      players: g.players.map(p => p.name), 
      attackTime: g.attackTime 
    })));
    
    // Schedule each group's announcement
    for (const group of groupedPlayers) {
      const { players, attackTime } = group;
      const playerNames = players.map(p => p.name).join(', ');
      
      if (attackTime === 0) {
        // Immediate announcement
        console.log(`🔊 IMMEDIATE ANNOUNCEMENT: ${playerNames} go!`);
        const immediateText = `${playerNames} go!`;
        const immediateResource = await this.ttsService.generateSpeech(immediateText);
        if (immediateResource) {
          console.log(`🔊 Playing immediate announcement for ${playerNames}`);
          audioPlayer.play(immediateResource);
        } else {
          console.log(`❌ Failed to generate immediate announcement for ${playerNames}`);
        }
      } else {
        // Delayed announcement - use more accurate timing
        console.log(`🔊 Scheduling announcement for ${playerNames} in ${attackTime} seconds`);
        setTimeout(async () => {
          console.log(`🔊 DELAYED ANNOUNCEMENT: ${playerNames} go!`);
          const delayedText = `${playerNames} go!`;
          const delayedResource = await this.ttsService.generateSpeech(delayedText);
          if (delayedResource) {
            console.log(`🔊 Playing delayed announcement for ${playerNames}`);
            audioPlayer.play(delayedResource);
          } else {
            console.log(`❌ Failed to generate delayed announcement for ${playerNames}`);
          }
        }, attackTime * 1000);
      }
    }
    
    // Schedule final completion message - when rally actually reaches target
    const totalRallyTime = (rally.rallyTimeMinutes * 60) + rally.travelDistanceSeconds;
    console.log(`🔊 Scheduling rally complete message in ${totalRallyTime} seconds`);
    setTimeout(async () => {
      console.log('🔊 FINAL MESSAGE: Rally complete.');
      const finalText = "Rally complete.";
      const finalResource = await this.ttsService.generateSpeech(finalText);
      if (finalResource) {
        console.log(`🔊 Playing final message`);
        audioPlayer.play(finalResource);
      } else {
        console.log(`❌ Failed to generate final message`);
      }
    }, totalRallyTime * 1000);
  }

  // This method is no longer used with the synchronized approach
  // Kept for compatibility but not called
  async countdownForPlayer(audioPlayer, playerName) {
    // Deprecated - using synchronized countdown instead
    console.log(`Countdown for ${playerName} - using synchronized approach`);
  }

  // Speak text using TTS service
  async speakText(audioPlayer, text) {
    try {
      // Generate speech using the TTS service
      const audioResource = await this.ttsService.generateSpeech(text);
      
      if (audioResource) {
        // Play the audio if TTS service provided audio
        audioPlayer.play(audioResource);
        
        // Wait for audio to finish before continuing
        return new Promise((resolve) => {
          audioPlayer.once(AudioPlayerStatus.Idle, resolve);
        });
      } else {
        // If no audio resource (e.g., console TTS), just wait a bit
        await this.delay(500);
      }
    } catch (error) {
      console.error('TTS error:', error);
      // Fallback to console logging
      console.log(`🔊 TTS Fallback: ${text}`);
      await this.delay(500);
    }
  }

  // Utility delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Check if bot is in a voice channel
  isInVoiceChannel(guildId) {
    return this.connections.has(guildId);
  }

  // Get current voice connection
  getConnection(guildId) {
    return this.connections.get(guildId);
  }

  // Announce rally start in all connected voice channels
  async announceRallyStart(rallyName) {
    const announcementText = this.client.rallyManager.getRallyStartAnnouncement(rallyName);
    
    if (!announcementText) {
      return;
    }

    console.log(`🔊 RALLY START ANNOUNCEMENT: ${announcementText}`);

    // Announce in all connected voice channels
    for (const [guildId, connection] of this.connections) {
      const audioPlayer = this.audioPlayers.get(guildId);
      
      if (audioPlayer && connection.state.status === 'ready') {
        try {
          // Generate and play rally start announcement
          const audioResource = await this.ttsService.generateSpeech(announcementText);
          if (audioResource) {
            audioPlayer.play(audioResource);
            console.log(`🔊 Rally start announced in guild ${guildId}: ${rallyName}`);
          }
        } catch (error) {
          console.error(`Failed to announce rally start in guild ${guildId}:`, error);
        }
      }
    }
  }
}

module.exports = { VoiceManager }; 