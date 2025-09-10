class RallyManager {
  constructor() {
    this.rallies = new Map();
    this.savedRallies = new Map(); // groupId -> saved rally data with players
  }

  // Parse time string in format "1:30" (1 min 30 sec) or "90" (90 seconds)
  parseTimeString(timeString) {
    if (!timeString || typeof timeString !== 'string') {
      throw new Error('Time string is required');
    }

    const trimmed = timeString.trim();
    
    // Check if it contains colon (format: "1:30")
    if (trimmed.includes(':')) {
      const parts = trimmed.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid time format. Use "1:30" for 1 minute 30 seconds or "90" for 90 seconds');
      }
      
      const minutes = parseInt(parts[0]);
      const seconds = parseInt(parts[1]);
      
      if (isNaN(minutes) || isNaN(seconds)) {
        throw new Error('Invalid time format. Minutes and seconds must be numbers');
      }
      
      if (minutes < 0 || seconds < 0) {
        throw new Error('Time values cannot be negative');
      }
      
      if (seconds >= 60) {
        throw new Error('Seconds must be less than 60');
      }
      
      return minutes * 60 + seconds; // Return total seconds
    } else {
      // Assume it's just seconds
      const totalSeconds = parseInt(trimmed);
      if (isNaN(totalSeconds)) {
        throw new Error('Invalid time format. Use "1:30" for 1 minute 30 seconds or "90" for 90 seconds');
      }
      
      if (totalSeconds < 0) {
        throw new Error('Time cannot be negative');
      }
      
      return totalSeconds;
    }
  }

  // Format seconds back to readable time string
  formatTimeString(totalSeconds) {
    if (totalSeconds < 60) {
      return `${totalSeconds}s`;
    } else {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  // Parse player string with either travel time or send time
  parsePlayerString(playerString) {
    if (!playerString || typeof playerString !== 'string') {
      throw new Error('Player string is required');
    }

    const trimmed = playerString.trim();
    
    // Check if it contains colon (format: "PlayerA:11:02" or "PlayerA:25")
    if (trimmed.includes(':')) {
      const parts = trimmed.split(':');
      if (parts.length === 2) {
        // Format: "PlayerA:25" (travel time in seconds)
        const name = parts[0].trim();
        const timeStr = parts[1].trim();
        
        if (!name) {
          throw new Error('Player name cannot be empty');
        }
        
        const timeToDestination = parseInt(timeStr);
        if (isNaN(timeToDestination) || timeToDestination <= 0) {
          throw new Error(`Invalid travel time for ${name}: ${timeStr}. Must be a positive number.`);
        }
        
        return {
          name: name,
          timeToDestination: timeToDestination,
          sendTime: null,
          type: 'travel'
        };
      } else if (parts.length === 3) {
        // Format: "PlayerA:11:02" (exact send time)
        const name = parts[0].trim();
        const minutesStr = parts[1].trim();
        const secondsStr = parts[2].trim();
        
        if (!name) {
          throw new Error('Player name cannot be empty');
        }
        
        const minutes = parseInt(minutesStr);
        const seconds = parseInt(secondsStr);
        
        if (isNaN(minutes) || isNaN(seconds)) {
          throw new Error(`Invalid send time for ${name}: ${minutesStr}:${secondsStr}. Minutes and seconds must be numbers.`);
        }
        
        if (minutes < 0 || seconds < 0) {
          throw new Error(`Send time for ${name} cannot be negative`);
        }
        
        if (seconds >= 60) {
          throw new Error(`Seconds for ${name} must be less than 60`);
        }
        
        const totalSeconds = minutes * 60 + seconds;
        
        return {
          name: name,
          timeToDestination: null,
          sendTime: totalSeconds,
          type: 'send'
        };
      } else {
        throw new Error(`Invalid player format: "${trimmed}". Use "PlayerA:25" for travel time or "PlayerA:11:02" for send time.`);
      }
    } else {
      throw new Error(`Invalid player format: "${trimmed}". Use "PlayerA:25" for travel time or "PlayerA:11:02" for send time.`);
    }
  }

  // Add a new enemy rally
  addRally(rallyName, rallyTimeMinutes, travelDistanceSeconds, attackGroup = 1) {
    if (rallyTimeMinutes <= 0) {
      throw new Error('Rally time must be greater than 0');
    }
    
    if (travelDistanceSeconds <= 0) {
      throw new Error('Travel distance must be greater than 0');
    }
    
    if (attackGroup <= 0) {
      throw new Error('Attack group must be greater than 0');
    }

    this.rallies.set(rallyName, {
      name: rallyName,
      rallyTimeMinutes: rallyTimeMinutes,
      travelDistanceSeconds: travelDistanceSeconds,
      attackGroup: attackGroup,
      isStarted: false,
      startedAt: null,
      createdAt: Date.now()
    });
    
    return this.rallies.get(rallyName);
  }

  // Update an existing rally
  updateRally(rallyName, newRallyTimeMinutes, newTravelDistanceSeconds, newAttackGroup = null) {
    if (!this.rallies.has(rallyName)) {
      throw new Error(`Rally ${rallyName} not found`);
    }
    
    if (newRallyTimeMinutes <= 0) {
      throw new Error('Rally time must be greater than 0');
    }
    
    if (newTravelDistanceSeconds <= 0) {
      throw new Error('Travel distance must be greater than 0');
    }
    
    if (newAttackGroup !== null && newAttackGroup <= 0) {
      throw new Error('Attack group must be greater than 0');
    }
    
    const rally = this.rallies.get(rallyName);
    rally.rallyTimeMinutes = newRallyTimeMinutes;
    rally.travelDistanceSeconds = newTravelDistanceSeconds;
    
    if (newAttackGroup !== null) {
      rally.attackGroup = newAttackGroup;
    }
    
    rally.updatedAt = Date.now();
    
    return rally;
  }

  // Remove a specific rally
  removeRally(rallyName) {
    if (!this.rallies.has(rallyName)) {
      throw new Error(`Rally ${rallyName} not found`);
    }
    
    return this.rallies.delete(rallyName);
  }

  // Remove all rallies
  clearAllRallies() {
    const count = this.rallies.size;
    this.rallies.clear();
    return count;
  }

  // Get all rallies
  getAllRallies() {
    return Array.from(this.rallies.values());
  }

  // Get a specific rally
  getRally(rallyName) {
    return this.rallies.get(rallyName);
  }

  // Check if a rally exists
  hasRally(rallyName) {
    return this.rallies.has(rallyName);
  }

  // Get rallies by attack group
  getRalliesByGroup(attackGroup) {
    return this.getAllRallies().filter(rally => rally.attackGroup === attackGroup);
  }

  // Get all unique attack groups with rallies
  getRallyAttackGroups() {
    const groups = new Set(this.getAllRallies().map(rally => rally.attackGroup));
    return Array.from(groups).sort((a, b) => a - b);
  }

  // Calculate attack timing for a specific rally
  calculateRallyAttackTiming(rallyName, players) {
    const rally = this.getRally(rallyName);
    if (!rally) {
      throw new Error(`Rally ${rallyName} not found`);
    }

    if (!rally.isStarted) {
      throw new Error(`Rally ${rallyName} has not been started yet. Use /rallystart first.`);
    }

    if (players.length === 0) {
      throw new Error('No players provided for rally attack');
    }

    // Calculate when each player should start their attack
    // Rally time + Travel distance = Total time to reach target
    // We want to arrive 2 seconds before enemy reaches target
    const now = Date.now();
    const totalTimeToTarget = (rally.rallyTimeMinutes * 60 * 1000) + (rally.travelDistanceSeconds * 1000);
    const enemyArrivalTime = rally.startedAt.getTime() + totalTimeToTarget;
    const ourAttackTime = enemyArrivalTime - 2000; // 2 seconds before enemy
    
    const attackTiming = players.map(player => {
      let playerStartTime;
      let timeUntilStart;
      
      if (player.sendTime) {
        // Player has exact send time (in seconds from rally start)
        const sendTimeMs = player.sendTime * 1000;
        playerStartTime = rally.startedAt.getTime() + sendTimeMs;
        timeUntilStart = Math.max(0, playerStartTime - now);
      } else {
        // Player has travel time (standard calculation)
        const playerArrivalTime = ourAttackTime;
        playerStartTime = playerArrivalTime - (player.timeToDestination * 1000);
        timeUntilStart = Math.max(0, playerStartTime - now);
      }
      
      return {
        ...player,
        attackStartTime: Math.ceil(timeUntilStart / 1000), // Convert to seconds
        attackOrder: 0, // Will be set later
        rallyName: rallyName,
        enemyArrivalTime: new Date(enemyArrivalTime),
        ourAttackTime: new Date(ourAttackTime)
      };
    });

    // Sort by attack start time (earliest first)
    attackTiming.sort((a, b) => a.attackStartTime - b.attackStartTime);
    
    // Assign attack order
    attackTiming.forEach((player, index) => {
      player.attackOrder = index + 1;
    });

    // Group players by attack time for voice announcements
    const groupedPlayers = this.groupPlayersByAttackTime(attackTiming);

    return {
      rally: rally,
      players: attackTiming,
      groupedPlayers: groupedPlayers,
      totalDuration: Math.max(...attackTiming.map(p => p.attackStartTime)),
      launchTime: now,
      enemyArrivalTime: new Date(enemyArrivalTime),
      ourAttackTime: new Date(ourAttackTime)
    };
  }

  // Group players by their attack time for voice announcements
  groupPlayersByAttackTime(players) {
    const groups = new Map();
    
    players.forEach(player => {
      const timeKey = player.attackStartTime;
      if (!groups.has(timeKey)) {
        groups.set(timeKey, []);
      }
      groups.get(timeKey).push(player);
    });
    
    // Convert to array and sort by time
    return Array.from(groups.entries())
      .map(([time, players]) => ({
        attackTime: parseInt(time),
        players: players.sort((a, b) => a.attackOrder - b.attackOrder)
      }))
      .sort((a, b) => a.attackTime - b.attackTime);
  }

  // Get time remaining until enemy arrives (only if rally is started)
  getTimeUntilEnemyArrival(rallyName) {
    const rally = this.getRally(rallyName);
    if (!rally) {
      throw new Error(`Rally ${rallyName} not found`);
    }
    
    if (!rally.isStarted) {
      return null; // Rally not started yet
    }
    
    const now = new Date();
    const totalTimeToTarget = (rally.rallyTimeMinutes * 60 * 1000) + (rally.travelDistanceSeconds * 1000);
    const enemyArrivalTime = rally.startedAt.getTime() + totalTimeToTarget;
    const timeDiff = enemyArrivalTime - now.getTime();
    
    if (timeDiff <= 0) {
      return 0; // Enemy has already arrived
    }
    
    return Math.ceil(timeDiff / 1000); // Return seconds
  }

  // Manually start a rally
  startRally(rallyName) {
    const rally = this.getRally(rallyName);
    if (!rally) {
      throw new Error(`Rally ${rallyName} not found`);
    }
    
    if (rally.isStarted) {
      throw new Error(`Rally ${rallyName} has already been started`);
    }
    
    rally.isStarted = true;
    rally.startedAt = new Date();
    
    return rally;
  }

  // Check if rally has been started
  isRallyStarted(rallyName) {
    const rally = this.getRally(rallyName);
    if (!rally) {
      return false;
    }
    
    return rally.isStarted;
  }

  // Get rally start announcement text
  getRallyStartAnnouncement(rallyName) {
    const rally = this.getRally(rallyName);
    if (!rally) {
      return null;
    }
    
    const totalTimeSeconds = (rally.rallyTimeMinutes * 60) + rally.travelDistanceSeconds;
    const minutes = Math.floor(totalTimeSeconds / 60);
    const seconds = totalTimeSeconds % 60;
    
    let timeText;
    if (minutes > 0) {
      timeText = seconds > 0 ? `${minutes} minutes and ${seconds} seconds` : `${minutes} minutes`;
    } else {
      timeText = `${seconds} seconds`;
    }
    
    return `${rally.name} has started a rally. Enemy will arrive in ${timeText}. Prepare for reinforcement!`;
  }

  // Get rally count
  getRallyCount() {
    return this.rallies.size;
  }

  // Format time for display
  formatTimeRemaining(seconds) {
    if (seconds <= 0) return '0s';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }

  // Save rally group with players
  saveRallyGroup(groupId, rallyName, rallyTimeMinutes, travelDistanceSeconds, players) {
    if (!groupId || groupId.trim() === '') {
      throw new Error('Group ID cannot be empty');
    }

    if (!rallyName || rallyName.trim() === '') {
      throw new Error('Rally name cannot be empty');
    }

    if (rallyTimeMinutes <= 0) {
      throw new Error('Rally time must be greater than 0');
    }
    
    if (travelDistanceSeconds <= 0) {
      throw new Error('Travel distance must be greater than 0');
    }

    if (!players || players.length === 0) {
      throw new Error('At least one player must be provided');
    }

    // Validate players
    const validatedPlayers = players.map(player => {
      if (typeof player === 'string') {
        // Parse player string
        return this.parsePlayerString(player);
      } else if (typeof player === 'object') {
        // Validate object format
        if (!player.name || player.name.trim() === '') {
          throw new Error('Player name cannot be empty');
        }
        
        // Check if it's travel time or send time format
        if (player.timeToDestination && player.timeToDestination > 0) {
          return {
            name: player.name.trim(),
            timeToDestination: player.timeToDestination,
            sendTime: null,
            type: 'travel'
          };
        } else if (player.sendTime && player.sendTime > 0) {
          return {
            name: player.name.trim(),
            timeToDestination: null,
            sendTime: player.sendTime,
            type: 'send'
          };
        } else {
          throw new Error(`Player ${player.name} must have either timeToDestination or sendTime`);
        }
      } else {
        throw new Error('Invalid player format');
      }
    });

    this.savedRallies.set(groupId, {
      groupId: groupId,
      rallyName: rallyName.trim(),
      rallyTimeMinutes: rallyTimeMinutes,
      travelDistanceSeconds: travelDistanceSeconds,
      players: validatedPlayers,
      savedAt: new Date(),
      attackGroup: 1 // Default attack group
    });

    return this.savedRallies.get(groupId);
  }

  // Get saved rally group
  getSavedRallyGroup(groupId) {
    return this.savedRallies.get(groupId);
  }

  // Get all saved rally groups
  getAllSavedRallyGroups() {
    return Array.from(this.savedRallies.values());
  }

  // Check if saved rally group exists
  hasSavedRallyGroup(groupId) {
    return this.savedRallies.has(groupId);
  }

  // Delete saved rally group
  deleteSavedRallyGroup(groupId) {
    if (!this.savedRallies.has(groupId)) {
      throw new Error(`Saved rally group "${groupId}" not found`);
    }
    
    this.savedRallies.delete(groupId);
    return true;
  }

  // Load saved rally group (creates active rally and registers players)
  loadSavedRallyGroup(groupId, playerManager) {
    const savedGroup = this.getSavedRallyGroup(groupId);
    if (!savedGroup) {
      throw new Error(`Saved rally group "${groupId}" not found`);
    }

    // Clear existing players for this group
    const existingPlayers = playerManager.getAllPlayers();
    existingPlayers.forEach(player => {
      if (player.groupId === groupId) {
        playerManager.removePlayer(player.name);
      }
    });

    // Register players from saved group
    savedGroup.players.forEach(player => {
      if (player.type === 'travel') {
        // Use travel time for standard registration
        playerManager.registerPlayer(player.name, player.timeToDestination, 1, groupId);
      } else if (player.type === 'send') {
        // For send time players, we need to calculate travel time based on rally timing
        // This will be handled in the timing calculation
        playerManager.registerPlayer(player.name, 0, 1, groupId, player.sendTime);
      }
    });

    // Create active rally
    const rally = this.addRally(
      savedGroup.rallyName,
      savedGroup.rallyTimeMinutes,
      savedGroup.travelDistanceSeconds,
      savedGroup.attackGroup
    );

    return {
      rally: rally,
      players: savedGroup.players,
      groupId: groupId
    };
  }

  // Update saved rally group
  updateSavedRallyGroup(groupId, updates) {
    const savedGroup = this.getSavedRallyGroup(groupId);
    if (!savedGroup) {
      throw new Error(`Saved rally group "${groupId}" not found`);
    }

    // Update allowed fields
    if (updates.rallyName !== undefined) {
      if (!updates.rallyName || updates.rallyName.trim() === '') {
        throw new Error('Rally name cannot be empty');
      }
      savedGroup.rallyName = updates.rallyName.trim();
    }

    if (updates.rallyTimeMinutes !== undefined) {
      if (updates.rallyTimeMinutes <= 0) {
        throw new Error('Rally time must be greater than 0');
      }
      savedGroup.rallyTimeMinutes = updates.rallyTimeMinutes;
    }

    if (updates.travelDistanceSeconds !== undefined) {
      if (updates.travelDistanceSeconds <= 0) {
        throw new Error('Travel distance must be greater than 0');
      }
      savedGroup.travelDistanceSeconds = updates.travelDistanceSeconds;
    }

    if (updates.players !== undefined) {
      if (!updates.players || updates.players.length === 0) {
        throw new Error('At least one player must be provided');
      }

      // Validate players
      const validatedPlayers = updates.players.map(player => {
        if (typeof player === 'string') {
          // Parse player string
          return this.parsePlayerString(player);
        } else if (typeof player === 'object') {
          // Validate object format
          if (!player.name || player.name.trim() === '') {
            throw new Error('Player name cannot be empty');
          }
          
          // Check if it's travel time or send time format
          if (player.timeToDestination && player.timeToDestination > 0) {
            return {
              name: player.name.trim(),
              timeToDestination: player.timeToDestination,
              sendTime: null,
              type: 'travel'
            };
          } else if (player.sendTime && player.sendTime > 0) {
            return {
              name: player.name.trim(),
              timeToDestination: null,
              sendTime: player.sendTime,
              type: 'send'
            };
          } else {
            throw new Error(`Player ${player.name} must have either timeToDestination or sendTime`);
          }
        } else {
          throw new Error('Invalid player format');
        }
      });

      savedGroup.players = validatedPlayers;
    }

    savedGroup.updatedAt = new Date();
    return savedGroup;
  }
}

module.exports = { RallyManager };
