import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface ModelAsset {
  name: string;
  path: string;
}

interface TextureAsset {
  name: string;
  path: string;
}

interface SoundAsset {
  name: string;
  path: string;
}

export class AssetManager {
  private models: Map<string, THREE.Object3D> = new Map();
  private textures: Map<string, THREE.Texture> = new Map();
  private sounds: Map<string, AudioBuffer> = new Map();
  
  private modelAssets: ModelAsset[] = [];
  private textureAssets: TextureAsset[] = [];
  private soundAssets: SoundAsset[] = [];
  
  private gltfLoader: GLTFLoader;
  private textureLoader: THREE.TextureLoader;
  private audioLoader: AudioLoader;
  
  constructor() {
    this.gltfLoader = new GLTFLoader();
    this.textureLoader = new THREE.TextureLoader();
    this.audioLoader = new AudioLoader();
  }
  
  public registerModels(models: ModelAsset[]): void {
    this.modelAssets.push(...models);
  }
  
  public registerTextures(textures: TextureAsset[]): void {
    this.textureAssets.push(...textures);
  }
  
  public registerSounds(sounds: SoundAsset[]): void {
    this.soundAssets.push(...sounds);
  }
  
  public async loadAll(onProgress?: (progress: number) => void): Promise<void> {
    const totalAssets = this.modelAssets.length + this.textureAssets.length + this.soundAssets.length;
    let loadedAssets = 0;
    
    // Load models
    for (const model of this.modelAssets) {
      try {
        const gltf = await this.loadModel(model.path);
        this.models.set(model.name, gltf.scene);
        loadedAssets++;
        if (onProgress) onProgress(loadedAssets / totalAssets);
      } catch (error) {
        console.error(`Failed to load model: ${model.path}`, error);
      }
    }
    
    // Load textures
    for (const texture of this.textureAssets) {
      try {
        const tex = await this.loadTexture(texture.path);
        this.textures.set(texture.name, tex);
        loadedAssets++;
        if (onProgress) onProgress(loadedAssets / totalAssets);
      } catch (error) {
        console.error(`Failed to load texture: ${texture.path}`, error);
      }
    }
    
    // Load sounds
    for (const sound of this.soundAssets) {
      try {
        const audio = await this.loadSound(sound.path);
        this.sounds.set(sound.name, audio);
        loadedAssets++;
        if (onProgress) onProgress(loadedAssets / totalAssets);
      } catch (error) {
        console.error(`Failed to load sound: ${sound.path}`, error);
      }
    }
  }
  
  public getModel(name: string): THREE.Object3D | undefined {
    const model = this.models.get(name);
    if (!model) {
      console.warn(`Model not found: ${name}`);
      return undefined;
    }
    
    // Return a clone of the model to avoid modifying the original
    return model.clone();
  }
  
  public getTexture(name: string): THREE.Texture | undefined {
    const texture = this.textures.get(name);
    if (!texture) {
      console.warn(`Texture not found: ${name}`);
      return undefined;
    }
    
    // Return a clone of the texture to avoid modifying the original
    return texture.clone();
  }
  
  public getSound(name: string): AudioBuffer | undefined {
    const sound = this.sounds.get(name);
    if (!sound) {
      console.warn(`Sound not found: ${name}`);
      return undefined;
    }
    
    return sound;
  }
  
  private loadModel(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        path,
        (gltf) => resolve(gltf),
        undefined,
        (error) => reject(error)
      );
    });
  }
  
  private loadTexture(path: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        path,
        (texture) => {
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          resolve(texture);
        },
        undefined,
        (error) => reject(error)
      );
    });
  }
  
  private loadSound(path: string): Promise<AudioBuffer> {
    return new Promise((resolve, reject) => {
      this.audioLoader.load(
        path,
        (buffer) => resolve(buffer),
        undefined,
        (error) => reject(error)
      );
    });
  }

	// Create a procedural texture
  public createProceduralTexture(name: string, type: 'grass' | 'sand' | 'dirt' | 'metal' | 'rock'): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    switch (type) {
      case 'grass':
        this.createGrassTexture(ctx, canvas.width, canvas.height);
        break;
      case 'sand':
        this.createSandTexture(ctx, canvas.width, canvas.height);
        break;
      case 'dirt':
        this.createDirtTexture(ctx, canvas.width, canvas.height);
        break;
      case 'metal':
        this.createMetalTexture(ctx, canvas.width, canvas.height);
        break;
      case 'rock':
        this.createRockTexture(ctx, canvas.width, canvas.height);
        break;
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    // Store the texture
    this.textures.set(name, texture);
    
    return texture;
  }
  
  private createGrassTexture(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Base color
    ctx.fillStyle = '#4a7c10';
    ctx.fillRect(0, 0, width, height);
    
    // Add noise
    for (let i = 0; i < 50000; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 3 + 1;
      
      // Grass blades
      ctx.fillStyle = Math.random() > 0.5 ? '#5c9414' : '#3e6b0d';
      ctx.fillRect(x, y, size, size);
    }
    
    // Add some grass details
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 5 + 2;
      
      ctx.fillStyle = '#6db119';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  private createSandTexture(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Base color
    ctx.fillStyle = '#e6d191';
    ctx.fillRect(0, 0, width, height);
    
    // Add noise
    for (let i = 0; i < 50000; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 2 + 1;
      
      ctx.fillStyle = Math.random() > 0.5 ? '#d9c27e' : '#f0dca3';
      ctx.fillRect(x, y, size, size);
    }
    
    // Add some pebbles
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 3 + 1;
      
      ctx.fillStyle = '#c4b276';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  private createDirtTexture(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Base color
    ctx.fillStyle = '#6d4c33';
    ctx.fillRect(0, 0, width, height);
    
    // Add noise
    for (let i = 0; i < 50000; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 3 + 1;
      
      ctx.fillStyle = Math.random() > 0.5 ? '#5d4129' : '#7e583c';
      ctx.fillRect(x, y, size, size);
    }
    
    // Add some rocks and roots
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 4 + 1;
      
      ctx.fillStyle = Math.random() > 0.7 ? '#8f6b4a' : '#4d3423';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  private createMetalTexture(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Base color
    ctx.fillStyle = '#8c8c8c';
    ctx.fillRect(0, 0, width, height);
    
    // Add scratches
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const length = Math.random() * 50 + 10;
      const angle = Math.random() * Math.PI * 2;
      
      ctx.strokeStyle = Math.random() > 0.5 ? '#777777' : '#999999';
      ctx.lineWidth = Math.random() * 2 + 0.5;
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(
        x + Math.cos(angle) * length,
        y + Math.sin(angle) * length
      );
      ctx.stroke();
    }
    
    // Add some highlights
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 3 + 1;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  private createRockTexture(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Base color
    ctx.fillStyle = '#6e6e6e';
    ctx.fillRect(0, 0, width, height);
    
    // Add noise
    for (let i = 0; i < 50000; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 3 + 1;
      
      ctx.fillStyle = Math.random() > 0.5 ? '#5d5d5d' : '#7e7e7e';
      ctx.fillRect(x, y, size, size);
    }
    
    // Add some cracks
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const length = Math.random() * 100 + 20;
      const angle = Math.random() * Math.PI * 2;
      
      ctx.strokeStyle = '#4d4d4d';
      ctx.lineWidth = Math.random() * 2 + 0.5;
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      
      // Create a jagged line
      let currentX = x;
      let currentY = y;
      const segments = Math.floor(Math.random() * 5) + 3;
      
      for (let j = 0; j < segments; j++) {
        const segmentLength = length / segments;
        const newAngle = angle + (Math.random() * 0.5 - 0.25);
        
        currentX += Math.cos(newAngle) * segmentLength;
        currentY += Math.sin(newAngle) * segmentLength;
        
        ctx.lineTo(currentX, currentY);
      }
      
      ctx.stroke();
    }
  }
}

// Simple AudioLoader class since we're not using the Web Audio API directly
class AudioLoader {
  private audioContext: AudioContext;

  constructor() {
    // Create a new AudioContext when the class is instantiated
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  /**
   * Load an audio file and decode it into an AudioBuffer
   * @param url - URL of the audio file to load
   * @param onLoad - Callback function when audio is successfully loaded
   * @param onProgress - Optional callback for download progress
   * @param onError - Optional callback for errors
   */
  public load(
    url: string, 
    onLoad: (buffer: AudioBuffer) => void, 
    onProgress?: (event: ProgressEvent) => void, 
    onError?: (event: ErrorEvent | Error) => void
  ): void {
    // Fetch the audio file
    fetch(url)
      .then(response => {
        // Check if the response is ok
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Track download progress if a progress callback is provided
        if (onProgress && response.body) {
          const contentLength = response.headers.get('Content-Length');
          const total = contentLength ? parseInt(contentLength, 10) : 0;
          let loaded = 0;

          const reader = response.body.getReader();
          const progressTracker = new ReadableStream({
            start(controller) {
              function push() {
                reader.read().then(({ done, value }) => {
                  if (done) {
                    controller.close();
                    return;
                  }
                  loaded += value.length;
                  if (onProgress) {
                    onProgress({
                      lengthComputable: total > 0,
                      loaded,
                      total
                    } as ProgressEvent);
                  }
                  controller.enqueue(value);
                  push();
                }).catch(error => {
                  controller.error(error);
                });
              }
              push();
            }
          });

          return Promise.all([
            new Response(progressTracker).arrayBuffer(),
            total
          ]);
        }
        
        // If no progress tracking is needed, simply return the array buffer
        return response.arrayBuffer();
      })
      .then(arrayBuffer => {
        // Decode the audio data
        return this.audioContext.decodeAudioData(arrayBuffer);
      })
      .then(audioBuffer => {
        // Call the onLoad callback with the decoded AudioBuffer
        onLoad(audioBuffer);
      })
      .catch(error => {
        // Handle any errors during loading or decoding
        if (onError) {
          onError(error);
        } else {
          console.error('Audio loading error:', error);
        }
      });
  }

  /**
   * Cleanup method to close the AudioContext
   */
  public dispose(): void {
    this.audioContext.close();
  }
}
