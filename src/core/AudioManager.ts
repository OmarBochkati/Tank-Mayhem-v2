import { AssetManager } from './AssetManager';

export class AudioManager {
  private assetManager: AssetManager;
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBufferSourceNode> = new Map();
  private gainNodes: Map<string, GainNode> = new Map();
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  
  constructor(assetManager: AssetManager) {
    this.assetManager = assetManager;
    
    // Initialize audio context on user interaction
    document.addEventListener('click', this.initAudioContext.bind(this), { once: true });
  }
  
  private initAudioContext(): void {
    if (this.audioContext) return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create master gain node
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 1.0;
      this.masterGain.connect(this.audioContext.destination);
      
      // Create music gain node
      this.musicGain = this.audioContext.createGain();
      this.musicGain.gain.value = 0.5;
      this.musicGain.connect(this.masterGain);
      
      // Create SFX gain node
      this.sfxGain = this.audioContext.createGain();
      this.sfxGain.gain.value = 0.7;
      this.sfxGain.connect(this.masterGain);
      
      console.log('Audio context initialized');
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }
  
  public playSound(name: string, volume: number = 1.0, loop: boolean = false): void {
    if (!this.audioContext || !this.sfxGain) {
      this.initAudioContext();
      if (!this.audioContext || !this.sfxGain) return;
    }
    
    const buffer = this.assetManager.getSound(name);
    if (!buffer) return;
    
    try {
      // Create source node
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = loop;
      
      // Create gain node for this sound
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = volume;
      
      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(this.sfxGain);
      
      // Start playback
      source.start(0);
      
      // Store references with unique ID to allow multiple instances of the same sound
      const id = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.sounds.set(id, source);
      this.gainNodes.set(id, gainNode);
      
      // Remove references when sound ends
      source.onended = () => {
        this.sounds.delete(id);
        this.gainNodes.delete(id);
      };
      
      return id;
    } catch (error) {
      console.error(`Failed to play sound: ${name}`, error);
    }
  }
  
  public playMusic(name: string, volume: number = 1.0, loop: boolean = true): void {
    if (!this.audioContext || !this.musicGain) {
      this.initAudioContext();
      if (!this.audioContext || !this.musicGain) return;
    }
    
    const buffer = this.assetManager.getSound(name);
    if (!buffer) {
      console.warn(`Music not found: ${name}`);
      return;
    }
    
    try {
      // Stop any currently playing music
      this.stopMusic();
      
      // Create source node
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = loop;
      
      // Create gain node for this music
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = volume;
      
      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(this.musicGain);
      
      // Start playback
      source.start(0);
      
      // Store references
      const id = `music_${name}`;
      this.sounds.set(id, source);
      this.gainNodes.set(id, gainNode);
      
      // Remove references when music ends (if not looping)
      if (!loop) {
        source.onended = () => {
          this.sounds.delete(id);
          this.gainNodes.delete(id);
        };
      }
      
      return id;
    } catch (error) {
      console.error(`Failed to play music: ${name}`, error);
    }
  }
  
  public stopSound(id: string): void {
    const source = this.sounds.get(id);
    if (source) {
      source.stop();
      this.sounds.delete(id);
      this.gainNodes.delete(id);
    }
  }
  
  public stopMusic(): void {
    // Stop all sounds that start with "music_"
    this.sounds.forEach((source, id) => {
      if (id.startsWith('music_')) {
        source.stop();
        this.sounds.delete(id);
        this.gainNodes.delete(id);
      }
    });
  }
  
  public stopAll(): void {
    // Stop all sounds
    this.sounds.forEach((source) => {
      source.stop();
    });
    
    this.sounds.clear();
    this.gainNodes.clear();
  }
  
  public setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }
  
  public setMusicVolume(volume: number): void {
    if (this.musicGain) {
      this.musicGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }
  
  public setSfxVolume(volume: number): void {
    if (this.sfxGain) {
      this.sfxGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }
}
