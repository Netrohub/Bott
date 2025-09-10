const { createAudioResource } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const say = require('say');
const { exec, execFile } = require('child_process');

class TTSService {
  constructor() {
    this.provider = 'console'; // Default to console logging
    this.audioCache = new Map(); // key -> filePath
    this.numberLibrary = new Map(); // number -> filePath
    this.libraryInitialized = false;
    this.platform = process.platform;
  }

  // Set the TTS provider
  setProvider(provider) {
    this.provider = provider;
  }

  // Cross-platform TTS generation with fallbacks
  async generateCrossPlatformTTS(text, outputFile) {
    try {
      // Try the say package first with default voice (no specific voice selection)
      return new Promise((resolve, reject) => {
        say.export(text, null, 1.0, outputFile, (error) => {
          if (error) {
            console.warn(`Say package failed: ${error.message}, trying platform-specific fallback...`);
            // Fall back to platform-specific commands
            this.generatePlatformSpecificTTS(text, outputFile)
              .then(resolve)
              .catch(reject);
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      // If say package fails completely, use platform-specific fallback
      return this.generatePlatformSpecificTTS(text, outputFile);
    }
  }

  // Platform-specific TTS fallback
  async generatePlatformSpecificTTS(text, outputFile) {
    const platform = this.platform;
    
    try {
      if (platform === 'win32') {
        // Windows: Use PowerShell with SAPI (try default voice first, then fallback)
        const command = `powershell.exe -Command "Add-Type -AssemblyName System.Speech; $synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer; try { $synthesizer.SelectVoice('Microsoft Zira Desktop') } catch { try { $synthesizer.SelectVoice('Microsoft David Desktop') } catch { } }; $synthesizer.SetOutputToWaveFile('${outputFile}'); $synthesizer.Speak('${text}'); $synthesizer.Dispose()"`;
        await new Promise((resolve, reject) => {
          exec(command, (error) => {
            if (error) reject(error);
            else resolve();
          });
        });
      } else if (platform === 'darwin') {
        // macOS: Use say command
        const command = `say -o "${outputFile}" -v "Samantha" -r 170 "${text}"`;
        await new Promise((resolve, reject) => {
          exec(command, (error) => {
            if (error) reject(error);
            else resolve();
          });
        });
      } else {
        // Linux: Try espeak, then festival
        try {
          const command = `espeak -w "${outputFile}" "${text}"`;
          await new Promise((resolve, reject) => {
            exec(command, (error) => {
              if (error) reject(error);
              else resolve();
            });
          });
        } catch (espeakError) {
          // Fallback to festival
          const command = `echo "${text}" | festival --tts --output "${outputFile}"`;
          await new Promise((resolve, reject) => {
            exec(command, (error) => {
              if (error) reject(error);
              else resolve();
            });
          });
        }
      }
    } catch (error) {
      throw new Error(`Platform-specific TTS failed for ${platform}: ${error.message}`);
    }
  }

  // Initialize the number library (pre-generate numbers 1-200)
  async initializeNumberLibrary() {
    if (this.libraryInitialized) return;

    try {
      const { execFile } = require('child_process');
      const ffmpegPath = require('ffmpeg-static');

      // Ensure library directory exists
      const libraryDir = path.join(__dirname, '../temp/library');
      if (!fs.existsSync(libraryDir)) {
        fs.mkdirSync(libraryDir, { recursive: true });
      }

      const run = (cmd) => new Promise((resolve, reject) => {
        exec(cmd, (err, stdout, stderr) => {
          if (err) return reject(err);
          resolve({ stdout, stderr });
        });
      });

      const runFfmpeg = (args) => new Promise((resolve, reject) => {
        execFile(ffmpegPath, args, (err, stdout, stderr) => {
          if (err) return reject(new Error(stderr || err.message));
          resolve({ stdout, stderr });
        });
      });

      console.log('🔊 Initializing number library (1-200)...');

      // Generate numbers 1-200
      for (let i = 1; i <= 200; i++) {
        const numberFile = path.join(libraryDir, `${i}.wav`);
        
        // Skip if already exists
        if (fs.existsSync(numberFile)) {
          this.numberLibrary.set(i, numberFile);
          continue;
        }

        // Generate the number using cross-platform TTS with fallbacks
        const rawFile = path.join(libraryDir, `raw_${i}.wav`);
        await this.generateCrossPlatformTTS(`${i}.`, rawFile);
        
        // Pad/truncate to exactly 1.000s with better quality settings
        await runFfmpeg(['-y', '-i', rawFile, '-af', 'apad=pad_dur=1,atrim=0:1', '-ar', '48000', '-ac', '2', '-sample_fmt', 's16', numberFile]);
        
        // Clean up raw file
        try { fs.unlinkSync(rawFile); } catch (_) {}
        
        this.numberLibrary.set(i, numberFile);
      }

      this.libraryInitialized = true;
      console.log('✅ Number library initialized!');
      
    } catch (error) {
      console.error('❌ Failed to initialize number library:', error);
      throw error;
    }
  }

  // Generate speech from text
  async generateSpeech(text, options = {}) {
    switch (this.provider) {
      case 'console':
        return this.consoleTTS(text);
      case 'local':
        return this.localTTS(text, options);
      case 'google':
        return this.googleTTS(text, options);
      case 'azure':
        return this.azureTTS(text, options);
      case 'polly':
        return this.amazonPollyTTS(text, options);
      default:
        return this.consoleTTS(text);
    }
  }

  // Console TTS (default - just logs to console)
  async consoleTTS(text) {
    console.log(`🔊 TTS: ${text}`);
    return null; // No audio resource
  }

  // Build a stable cache key for a given players/timing configuration
  buildCountdownCacheKey(players) {
    // Normalize: sort by attackStartTime then name, pick only relevant fields
    const normalized = [...players]
      .map(p => ({ name: String(p.name), t: Number(p.attackStartTime) }))
      .sort((a, b) => (a.t - b.t) || a.name.localeCompare(b.name));

    // Include voice and algo version to avoid cross-version cache collisions
    const payload = {
      v: 'sync-v5', // Updated version for cross-platform TTS with fallbacks
      voice: 'Samantha',
      rate: 170,
      platform: this.platform,
      players: normalized,
    };

    return crypto
      .createHash('sha1')
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  // Generate rally countdown with grouped announcements for same-time players
  async generateRallyCountdown(rally, groupedPlayers) {
    try {
      // Initialize number library if needed
      await this.initializeNumberLibrary();

      // Check cache first
      const cacheKey = this.buildRallyCountdownCacheKey(rally, groupedPlayers);
      const cachedPath = this.audioCache.get(cacheKey);
      if (cachedPath && fs.existsSync(cachedPath)) {
        return createAudioResource(cachedPath);
      }

      const { execFile } = require('child_process');
      const ffmpegPath = require('ffmpeg-static');

      // Ensure temp dir
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const runFfmpeg = (args) => new Promise((resolve, reject) => {
        execFile(ffmpegPath, args, (err, stdout, stderr) => {
          if (err) return reject(new Error(stderr || err.message));
          resolve({ stdout, stderr });
        });
      });

      const ts = Date.now();
      const audioSegments = [];

      // Generate rally intro
      const totalTimeSeconds = (rally.rallyTimeMinutes * 60) + rally.travelDistanceSeconds;
      const minutes = Math.floor(totalTimeSeconds / 60);
      const seconds = totalTimeSeconds % 60;
      
      let timeText;
      if (minutes > 0) {
        timeText = seconds > 0 ? `${minutes} minutes and ${seconds} seconds` : `${minutes} minutes`;
      } else {
        timeText = `${seconds} seconds`;
      }
      
      const rallyIntro = `Enemy rally ${rally.name} detected. Rally arrives in ${timeText}. Prepare for reinforcement in 10 seconds.`;
      const introRaw = path.join(tempDir, `rally_intro_raw_${ts}.wav`);
      const introFile = path.join(tempDir, `rally_intro_${ts}.wav`);
      
      await this.generateCrossPlatformTTS(rallyIntro, introRaw);
      await runFfmpeg(['-y', '-i', introRaw, '-ar', '48000', '-ac', '2', '-sample_fmt', 's16', introFile]);
      try { fs.unlinkSync(introRaw); } catch (_) {}
      audioSegments.push(introFile);

      // Generate countdown segments for each group
      for (let i = 0; i < groupedPlayers.length; i++) {
        const group = groupedPlayers[i];
        const { players, attackTime } = group;
        
        if (attackTime === 0) {
          // Immediate attack - just say player names and go
          const playerNames = players.map(p => p.name).join(', ');
          const immediateText = `${playerNames} send reinforcement now!`;
          
          const immediateRaw = path.join(tempDir, `immediate_${i}_raw_${ts}.wav`);
          const immediateFile = path.join(tempDir, `immediate_${i}_${ts}.wav`);
          
          await this.generateCrossPlatformTTS(immediateText, immediateRaw);
          await runFfmpeg(['-y', '-i', immediateRaw, '-ar', '48000', '-ac', '2', '-sample_fmt', 's16', immediateFile]);
          try { fs.unlinkSync(immediateRaw); } catch (_) {}
          audioSegments.push(immediateFile);
        } else {
          // Delayed attack - tell players when to send reinforcement
          const playerNames = players.map(p => p.name).join(', ');
          const timeText = attackTime === 1 ? '1 second' : `${attackTime} seconds`;
          const delayedText = `${playerNames} send reinforcement in ${timeText}!`;
          
          const delayedRaw = path.join(tempDir, `delayed_${i}_raw_${ts}.wav`);
          const delayedFile = path.join(tempDir, `delayed_${i}_${ts}.wav`);
          
          await this.generateCrossPlatformTTS(delayedText, delayedRaw);
          await runFfmpeg(['-y', '-i', delayedRaw, '-ar', '48000', '-ac', '2', '-sample_fmt', 's16', delayedFile]);
          try { fs.unlinkSync(delayedRaw); } catch (_) {}
          audioSegments.push(delayedFile);
        }
      }

      // Generate final completion message
      const finalText = "Rally attack sequence complete.";
      const finalRaw = path.join(tempDir, `rally_final_raw_${ts}.wav`);
      const finalFile = path.join(tempDir, `rally_final_${ts}.wav`);
      
      await this.generateCrossPlatformTTS(finalText, finalRaw);
      await runFfmpeg(['-y', '-i', finalRaw, '-ar', '48000', '-ac', '2', '-sample_fmt', 's16', finalFile]);
      try { fs.unlinkSync(finalRaw); } catch (_) {}
      audioSegments.push(finalFile);

      // Concatenate all segments
      const listFile = path.join(tempDir, `rally_list_${ts}.txt`);
      const outputFile = path.join(tempDir, `rally_countdown_${cacheKey}.wav`);

      fs.writeFileSync(listFile, audioSegments.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'));

      await runFfmpeg(['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c:a', 'pcm_s16le', '-ar', '48000', '-ac', '2', outputFile]);

      // Cleanup intermediate files
      try { fs.unlinkSync(listFile); } catch (_) {}
      audioSegments.forEach(file => {
        try { fs.unlinkSync(file); } catch (_) {}
      });

      // Store in cache and return audio resource
      this.audioCache.set(cacheKey, outputFile);
      return createAudioResource(outputFile);
      
    } catch (error) {
      console.error('Rally countdown error:', error);
      throw error;
    }
  }

  // Build cache key for rally countdown
  buildRallyCountdownCacheKey(rally, groupedPlayers) {
    const normalized = groupedPlayers.map(group => ({
      time: group.attackTime,
      players: group.players.map(p => ({ name: String(p.name), order: p.attackOrder }))
    }));

    const payload = {
      v: 'rally-v1',
      voice: 'Samantha',
      rate: 170,
      platform: this.platform,
      rally: {
        name: rally.name,
        time: rally.rallyTimeMinutes,
        travel: rally.travelDistanceSeconds
      },
      groups: normalized,
    };

    return crypto
      .createHash('sha1')
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  // Generate a complete synchronized countdown sequence with precise 1-second ticks
  async generateSynchronizedCountdown(players, totalDuration) {
    try {
      // Initialize number library if needed
      await this.initializeNumberLibrary();

      // Check cache first
      const cacheKey = this.buildCountdownCacheKey(players);
      const cachedPath = this.audioCache.get(cacheKey);
      if (cachedPath && fs.existsSync(cachedPath)) {
        // Reuse previously generated file
        return createAudioResource(cachedPath);
      }

      const { execFile } = require('child_process');
      const ffmpegPath = require('ffmpeg-static');

      // Ensure temp dir
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const runFfmpeg = (args) => new Promise((resolve, reject) => {
        execFile(ffmpegPath, args, (err, stdout, stderr) => {
          if (err) return reject(new Error(stderr || err.message));
          resolve({ stdout, stderr });
        });
      });

      // Build simplified intro script
      const firstPlayer = players.find(p => p.attackStartTime === 0) || players[0];
      const maxTime = Math.max(...players.map(p => p.attackStartTime));

      let introScript = '';
      introScript += `Synchronized attack sequence. ${firstPlayer.name} starts first. `;
      players.forEach((p) => {
        if (p.attackStartTime === 0) introScript += `${p.name} starts immediately. `;
        else introScript += `${p.name} starts at second ${p.attackStartTime}. `;
      });
      introScript += `${firstPlayer.name} ready. Three. Two. One. Go. `;

      const ts = Date.now();
      const introRaw = path.join(tempDir, `intro_raw_${ts}.wav`);
      const introFile = path.join(tempDir, `intro_${ts}.wav`);
      
      // Generate intro with consistent quality
      await this.generateCrossPlatformTTS(introScript, introRaw);
      
      // Process intro to match library quality
      await runFfmpeg(['-y', '-i', introRaw, '-ar', '48000', '-ac', '2', '-sample_fmt', 's16', introFile]);
      try { fs.unlinkSync(introRaw); } catch (_) {}

      // Use pre-generated number library instead of generating each number
      const numberFiles = [];
      for (let i = 1; i <= maxTime; i++) {
        const numberFile = this.numberLibrary.get(i);
        if (numberFile && fs.existsSync(numberFile)) {
          numberFiles.push(numberFile);
        } else {
          // Fallback: generate the number if not in library
          console.warn(`Number ${i} not found in library, generating...`);
          const raw = path.join(tempDir, `raw_${i}_${ts}.wav`);
          const seg = path.join(tempDir, `seg_${i}_${ts}.wav`);
          await this.generateCrossPlatformTTS(`${i}.`, raw);
          await runFfmpeg(['-y', '-i', raw, '-af', 'apad=pad_dur=1,atrim=0:1', '-ar', '48000', '-ac', '2', '-sample_fmt', 's16', seg]);
          numberFiles.push(seg);
          try { fs.unlinkSync(raw); } catch (_) {}
        }
      }

      // Create final phrase clip: "Sequence complete."
      const finalRaw = path.join(tempDir, `final_raw_${ts}.wav`);
      const finalWav = path.join(tempDir, `final_${ts}.wav`);
      
      await this.generateCrossPlatformTTS("Sequence complete.", finalRaw);
      
      // Process final phrase to match library quality
      await runFfmpeg(['-y', '-i', finalRaw, '-ar', '48000', '-ac', '2', '-sample_fmt', 's16', finalWav]);
      try { fs.unlinkSync(finalRaw); } catch (_) {}

      // Concat: intro + library numbers + final line
      const listFile = path.join(tempDir, `list_${ts}.txt`);
      const outputFile = path.join(tempDir, `sync_countdown_${cacheKey}.wav`);

      // Ensure intro is consistent format for concat; re-encode intro
                const introWav = introFile; // Already in WAV format

      const concatFiles = [introWav, ...numberFiles, finalWav];
      fs.writeFileSync(listFile, concatFiles.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'));

      // Use better concatenation settings to preserve audio quality
      await runFfmpeg(['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c:a', 'pcm_s16le', '-ar', '48000', '-ac', '2', outputFile]);

      // Cleanup intermediates (keep final output for playback)
      try { fs.unlinkSync(introWav); } catch (_) {}
      try { fs.unlinkSync(finalWav); } catch (_) {}
      try { fs.unlinkSync(listFile); } catch (_) {}
      // Don't delete library files, but clean up any fallback files
      for (const f of numberFiles) {
        if (f.includes(`seg_${ts}`)) {
          try { fs.unlinkSync(f); } catch (_) {}
        }
      }

      // Store in cache and return audio resource for the final file
      this.audioCache.set(cacheKey, outputFile);
      const audioResource = createAudioResource(outputFile);
      return audioResource;
    } catch (error) {
      console.error('Synchronized countdown error:', error);
      throw error;
    }
  }

  // Local TTS using cross-platform TTS with fallbacks
  async localTTS(text, options = {}) {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Create temp directory if it doesn't exist
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Generate unique filename
      const outputFile = path.join(tempDir, `tts_${Date.now()}.wav`);
      
      console.log(`🔊 Generating TTS audio for: "${text}"`);
      console.log(`🔊 Output file: ${outputFile}`);
      
      // Use cross-platform TTS with fallbacks to generate audio
      await this.generateCrossPlatformTTS(text, outputFile);
      
      // Wait a bit for file to be written
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (fs.existsSync(outputFile)) {
            console.log(`🔊 Audio file created successfully: ${outputFile}`);
            // Create audio resource from the generated file
            const audioResource = createAudioResource(outputFile);
            resolve(audioResource);
            
            // Clean up file after a delay
            setTimeout(() => {
              try {
                fs.unlinkSync(outputFile);
                console.log(`🔊 Cleaned up audio file: ${outputFile}`);
              } catch (cleanupError) {
                console.log('Cleanup error (non-critical):', cleanupError.message);
              }
            }, 10000); // Clean up after 10 seconds
          } else {
            console.error(`🔊 Audio file was not created: ${outputFile}`);
            reject(new Error('Audio file was not created'));
          }
        }, 1000); // Wait 1 second for file to be written
      });
      
    } catch (error) {
      console.error('Local TTS error:', error);
      return this.consoleTTS(text);
    }
  }

  // Google Cloud Text-to-Speech
  async googleTTS(text, options = {}) {
    try {
      // This is a placeholder for Google Cloud TTS integration
      // You'll need to:
      // 1. Set up Google Cloud project
      // 2. Enable Text-to-Speech API
      // 3. Set GOOGLE_APPLICATION_CREDENTIALS environment variable
      // 4. Install @google-cloud/text-to-speech package
      
      console.log(`🔊 Google TTS: ${text}`);
      
      // Example implementation:
      // const textToSpeech = require('@google-cloud/text-to-speech');
      // const client = new textToSpeech.TextToSpeechClient();
      // 
      // const request = {
      //   input: { text: text },
      //   voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
      //   audioConfig: { audioEncoding: 'MP3' },
      // };
      // 
      // const [response] = await client.synthesizeSpeech(request);
      // const audioContent = response.audioContent;
      // 
      // // Convert to audio resource
      // const resource = createAudioResource(Buffer.from(audioContent));
      // return resource;
      
      return null;
    } catch (error) {
      console.error('Google TTS error:', error);
      return this.consoleTTS(text);
    }
  }

  // Microsoft Azure Speech Services
  async azureTTS(text, options = {}) {
    try {
      // This is a placeholder for Azure Speech Services integration
      // You'll need to:
      // 1. Set up Azure Speech Services
      // 2. Get subscription key and region
      // 3. Install microsoft-cognitiveservices-speech-sdk package
      
      console.log(`🔊 Azure TTS: ${text}`);
      
      // Example implementation:
      // const sdk = require('microsoft-cognitiveservices-speech-sdk');
      // const speechConfig = sdk.SpeechConfig.fromSubscription(
      //   process.env.AZURE_SPEECH_KEY,
      //   process.env.AZURE_SPEECH_REGION
      // );
      // 
      // const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
      // const result = await synthesizer.speakTextAsync(text);
      // 
      // if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
      //   const resource = createAudioResource(result.audioData);
      //   return resource;
      // }
      
      return null;
    } catch (error) {
      console.error('Azure TTS error:', error);
      return this.consoleTTS(text);
    }
  }

  // Amazon Polly TTS
  async amazonPollyTTS(text, options = {}) {
    try {
      // This is a placeholder for Amazon Polly integration
      // You'll need to:
      // 1. Set up AWS account
      // 2. Configure AWS credentials
      // 3. Install aws-sdk package
      
      console.log(`🔊 Amazon Polly TTS: ${text}`);
      
      // Example implementation:
      // const AWS = require('aws-sdk');
      // const polly = new AWS.Polly();
      // 
      // const params = {
      //   Text: text,
      //   OutputFormat: 'mp3',
      //   VoiceId: 'Joanna'
      // };
      // 
      // const result = await polly.synthesizeSpeech(params).promise();
      // const resource = createAudioResource(result.AudioStream);
      // return resource;
      
      return null;
    } catch (error) {
      console.error('Amazon Polly TTS error:', error);
      return this.consoleTTS(text);
    }
  }

  // Get available TTS providers
  getAvailableProviders() {
    return [
      'console',
      'local',
      'google',
      'azure',
      'polly'
    ];
  }

  // Check if a provider is available
  isProviderAvailable(provider) {
    return this.getAvailableProviders().includes(provider);
  }

  // Get current provider
  getCurrentProvider() {
    return this.provider;
  }
}

module.exports = { TTSService }; 