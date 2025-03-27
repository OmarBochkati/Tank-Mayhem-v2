import * as THREE from 'three';
import { World, Body } from 'cannon-es';
import { AssetManager } from './AssetManager';
import { UIManager } from '../ui/UIManager';
import { InputManager } from './InputManager';
import { NetworkManager } from '../network/NetworkManager';
import { Player } from '../entities/Player';
import { Tank } from '../entities/Tank';
import { Projectile } from '../entities/Projectile';
import { WorldManager } from '../world/WorldManager';
import { CameraManager } from './CameraManager';
import { CollisionManager } from './CollisionManager';
import { GameState } from '../types/GameState';
import { EntityManager } from './EntityManager';
import { AudioManager } from './AudioManager';
import { registerDefaultModels } from '../utils/DefaultModels';

interface GameOptions {
  canvas: HTMLCanvasElement;
  assetManager: AssetManager;
  uiManager: UIManager;
}

export class Game {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private clock: THREE.Clock;
  private physicsWorld: World;
  private isRunning: boolean = false;
  
  // Debug metrics
  private fpsCounter: number[] = [];
  private lastFrameTime: number = 0;
  
  // Managers
  private assetManager: AssetManager;
  private uiManager: UIManager;
  private inputManager: InputManager;
  private networkManager: NetworkManager;
  private worldManager: WorldManager;
  private cameraManager: CameraManager;
  private collisionManager: CollisionManager;
  private entityManager: EntityManager;
  private audioManager: AudioManager;
  
  // Game state
  private gameState: GameState = {
    players: new Map(),
    projectiles: new Map(),
    worldObjects: new Map(),
    playerScore: 0,
    playerKills: 0,
    gameTime: 0
  };
  
  // Player
  private localPlayer: Player | null = null;
  
  constructor(options: GameOptions) {
    this.canvas = options.canvas;
    this.assetManager = options.assetManager;
    this.uiManager = options.uiManager;
    
    // Initialize Three.js renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
    
    // Initialize physics world with improved settings
    this.physicsWorld = new World();
    this.physicsWorld.gravity.set(0, -9.82, 0); // Standard Earth gravity (Y is up/down)
    this.physicsWorld.defaultContactMaterial.contactEquationStiffness = 1e7; // Reduced stiffness to prevent bouncing
    this.physicsWorld.defaultContactMaterial.contactEquationRelaxation = 4; // Increased relaxation
    this.physicsWorld.defaultContactMaterial.friction = 0.5; // Moderate friction
    this.physicsWorld.defaultContactMaterial.restitution = 0.05; // Very low bounciness
    this.physicsWorld.solver.iterations = 10; // Reduced iterations for better performance
    this.physicsWorld.broadphase.useBoundingBoxes = true; // Use bounding boxes for better performance
    
    // Initialize clock for delta time
    this.clock = new THREE.Clock();
    
    // Initialize managers
    this.inputManager = new InputManager(this.canvas);
    this.networkManager = new NetworkManager();
    this.collisionManager = new CollisionManager(this.physicsWorld);
    this.worldManager = new WorldManager(
      this.scene, 
      this.physicsWorld, 
      this.assetManager, 
      this.collisionManager.getGroundMaterial()
    );
    this.cameraManager = new CameraManager(this.canvas);
    this.entityManager = new EntityManager(this.scene, this.physicsWorld);
    this.audioManager = new AudioManager(this.assetManager);
    
    // Add camera to scene
    this.scene.add(this.cameraManager.getCamera());
    
    // Setup event listeners
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // Network events
    this.networkManager.on('playerJoined', this.handlePlayerJoined.bind(this));
    this.networkManager.on('playerLeft', this.handlePlayerLeft.bind(this));
    this.networkManager.on('playerUpdate', this.handlePlayerUpdate.bind(this));
    this.networkManager.on('projectileFired', this.handleProjectileFired.bind(this));
    this.networkManager.on('playerHit', this.handlePlayerHit.bind(this));
    
    // Input events
    this.inputManager.on('fire', this.handleFireInput.bind(this));
    this.inputManager.on('toggleCamera', this.handleToggleCameraInput.bind(this));
    this.inputManager.on('toggleChat', this.handleToggleChatInput.bind(this));
    this.inputManager.on('settingsChanged', this.handleInputSettingsChanged.bind(this));
    
    // UI events
    this.uiManager.on('chatMessage', this.handleChatMessage.bind(this));
    this.uiManager.on('settingChanged', this.handleSettingChanged.bind(this));
    
    // Collision events
    this.collisionManager.on('tankHitGround', this.handleTankHitGround.bind(this));
    
    // Settings menu events
    this.setupSettingsEvents();
  }
  
  public async start(): Promise<void> {
    if (this.isRunning) return;
    
    // Register default models in case asset loading fails
    registerDefaultModels(this.assetManager);
    
    // Generate world
    await this.worldManager.generateWorld();
    
    // Connect to server
    await this.networkManager.connect();
    
    // Create local player
    this.createLocalPlayer();
    
    // Initialize UI with current settings
    this.uiManager.updateSettings(this.inputManager.getSettings());
    
    // Start game loop
    this.isRunning = true;
    this.clock.start();
    this.animate();
    
    // Play background music
    this.audioManager.playMusic('music', 0.3, true);
    
    console.log('Game started');
  }
  
  public stop(): void {
    if (!this.isRunning) return;
    
    // Disconnect from server
    this.networkManager.disconnect();
    
    // Stop game loop
    this.isRunning = false;
    this.clock.stop();
    
    // Stop all audio
    this.audioManager.stopAll();
    
    // Clear entities
    this.entityManager.clear();
    
    // Reset game state
    this.gameState = {
      players: new Map(),
      projectiles: new Map(),
      worldObjects: new Map(),
      playerScore: 0,
      playerKills: 0,
      gameTime: 0
    };
    
    this.localPlayer = null;
    
    console.log('Game stopped');
  }
  
  public resize(): void {
    if (!this.canvas) return;
    
    // Update renderer and camera
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.cameraManager.updateAspect(window.innerWidth / window.innerHeight);
  }
  
  private createLocalPlayer(): void {
    // Create player entity with tank material
    const playerTank = new Tank({
      assetManager: this.assetManager,
      position: new THREE.Vector3(0, 5, 0), // Start slightly above ground to prevent immediate sinking
      rotation: new THREE.Euler(0, 0, 0),
      color: 0x3366ff,
      isLocal: true,
      material: this.collisionManager.getTankMaterial()
    });
    
    this.localPlayer = new Player({
      id: this.networkManager.getClientId(),
      username: 'Player_' + Math.floor(Math.random() * 1000),
      tank: playerTank,
      isLocal: true
    });
    
    // Add player to entity manager
    this.entityManager.addEntity(this.localPlayer);
    
    // Set camera to follow player
    this.cameraManager.followEntity(playerTank.getObject3D(), playerTank.getTurretObject());
    
    // Send player joined event to server
    this.networkManager.sendPlayerJoined({
      id: this.localPlayer.getId(),
      username: this.localPlayer.getUsername(),
      position: playerTank.getPosition(),
      rotation: playerTank.getRotation(),
      health: playerTank.getHealth(),
      color: playerTank.getColor()
    });
    
    // Update UI
    this.uiManager.updateHealth(playerTank.getHealth());
    this.uiManager.updateAmmo(playerTank.getAmmo(), playerTank.getMaxAmmo());
  }
  
  public respawnPlayer(): void {
    if (!this.localPlayer) return;
    
    // Get random spawn position
    const spawnPosition = this.worldManager.getRandomSpawnPosition();
    // Add height to prevent sinking on spawn
    spawnPosition.y += 2;
    
    // Reset player tank
    const playerTank = this.localPlayer.getTank();
    playerTank.reset(spawnPosition);
    
    // Update UI
    this.uiManager.updateHealth(playerTank.getHealth());
    this.uiManager.updateAmmo(playerTank.getAmmo(), playerTank.getMaxAmmo());
    
    // Send respawn event to server
    this.networkManager.sendPlayerRespawned({
      id: this.localPlayer.getId(),
      position: spawnPosition,
      rotation: playerTank.getRotation()
    });
  }
  
  private animate(): void {
    if (!this.isRunning) return;
    
    requestAnimationFrame(this.animate.bind(this));
    
    // Calculate frame time and FPS
    const now = performance.now();
    const delta = this.clock.getDelta();
    const frameTime = now - this.lastFrameTime;
    this.lastFrameTime = now;
    
    // Update FPS counter (rolling average of last 60 frames)
    this.fpsCounter.push(1000 / frameTime);
    if (this.fpsCounter.length > 60) {
      this.fpsCounter.shift();
    }
    
    this.update(delta);
    this.render();
    this.updateDebugInfo();
  }
  
  private update(delta: number): void {
    // Limit delta time to prevent large jumps in physics
    const cappedDelta = Math.min(delta, 1/30);
    
    // Update physics with fixed timestep for stability
    // Use more substeps for better stability
    this.physicsWorld.step(1/60, cappedDelta, 10);
    
    // Update game time
    this.gameState.gameTime += delta;
    
    // Update local player
    if (this.localPlayer) {
      // Get input
      const input = this.inputManager.getInput();
      
      // Update player
      this.localPlayer.update(delta, input);
      
      // Check if player is dead
      if (this.localPlayer.getTank().isDead() && !document.getElementById('game-over')?.classList.contains('active')) {
        this.handlePlayerDeath();
      }
      
      // Send player update to server
      const playerTank = this.localPlayer.getTank();
      this.networkManager.sendPlayerUpdate({
        id: this.localPlayer.getId(),
        position: playerTank.getPosition(),
        rotation: playerTank.getRotation(),
        turretRotation: playerTank.getTurretRotation(),
        health: playerTank.getHealth(),
        velocity: playerTank.getVelocity()
      });
      
      // Update camera
      this.cameraManager.update(delta);
      
      // Update UI
      this.uiManager.updateHealth(playerTank.getHealth());
      if (playerTank.isReloading) {
        this.uiManager.showReloadIndicator();
      } else {
        this.uiManager.hideReloadIndicator();
        this.uiManager.updateAmmo(playerTank.getAmmo(), playerTank.getMaxAmmo());
      }
    
      // Update minimap
      this.uiManager.updateMiniMap(
        { x: playerTank.getPosition().x, z: playerTank.getPosition().z },
        this.getEntitiesForMinimap()
      );
    }
    
    // Update all entities
    this.entityManager.update(delta);
    
    // Update projectiles
    this.updateProjectiles(delta);
    
    // Check collisions
    this.collisionManager.checkCollisions();
  }
  
  private updateProjectiles(delta: number): void {
    // Update all projectiles
    this.gameState.projectiles.forEach((projectile, id) => {
      projectile.update(delta);
      
      // Check if projectile is out of bounds or expired
      if (projectile.isExpired()) {
        // Remove projectile
        this.entityManager.removeEntity(projectile);
        this.gameState.projectiles.delete(id);
      }
    });
  }
  
  private render(): void {
    this.renderer.render(this.scene, this.cameraManager.getCamera());
  }
  
  /**
   * Collect and update debug information
   */
  private updateDebugInfo(): void {
    if (!this.localPlayer) return;
    
    // Calculate average FPS
    const avgFps = this.fpsCounter.reduce((sum, fps) => sum + fps, 0) / this.fpsCounter.length;
    
    // Get player tank
    const playerTank = this.localPlayer.getTank();
    const position = playerTank.getPosition();
    const rotation = playerTank.getRotation();
    const velocity = playerTank.getVelocity();
    
    // Get memory usage if available
    let memory = 0;
    if (window.performance && (performance as any).memory) {
      memory = (performance as any).memory.usedJSHeapSize / (1024 * 1024);
    }
    
    // Collect debug data
    const debugData = {
      // Performance metrics
      fps: avgFps,
      frameTime: 1000 / avgFps,
      memory: memory,
      
      // Player info
      position: position,
      rotation: rotation,
      velocity: velocity,
      
      // Scene info
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      entities: this.entityManager.getEntityCount(),
      
      // Physics info
      physicsBodies: this.physicsWorld.bodies.length,
      physicsContacts: this.physicsWorld.contacts.length
    };
    
    // Update UI
    this.uiManager.updateDebugInfo(debugData);
  }
  
  // Event handlers
  private handlePlayerJoined(data: any): void {
    // Create new player with tank material
    const playerTank = new Tank({
      assetManager: this.assetManager,
      position: new THREE.Vector3(data.position.x, data.position.y, data.position.z),
      rotation: new THREE.Euler(data.rotation.x, data.rotation.y, data.rotation.z),
      color: data.color,
      isLocal: false,
      material: this.collisionManager.getTankMaterial()
    });
    
    const player = new Player({
      id: data.id,
      username: data.username,
      tank: playerTank,
      isLocal: false
    });
    
    // Add player to entity manager
    this.entityManager.addEntity(player);
    
    // Add player to game state
    this.gameState.players.set(data.id, player);
    
    // Show notification
    this.uiManager.addNotification(`${data.username} joined the game`);
  }
  
  private handlePlayerLeft(data: any): void {
    const player = this.gameState.players.get(data.id);
    
    if (player) {
      // Remove player from entity manager
      this.entityManager.removeEntity(player);
      
      // Remove player from game state
      this.gameState.players.delete(data.id);
      
      // Show notification
      this.uiManager.addNotification(`${player.getUsername()} left the game`);
    }
  }
  
  private handlePlayerUpdate(data: any): void {
    const player = this.gameState.players.get(data.id);
    
    if (player) {
      // Update player
      player.getTank().setPosition(new THREE.Vector3(data.position.x, data.position.y, data.position.z));
      player.getTank().setRotation(new THREE.Euler(data.rotation.x, data.rotation.y, data.rotation.z));
      player.getTank().setTurretRotation(data.turretRotation);
      player.getTank().setHealth(data.health);
      player.getTank().setVelocity(new THREE.Vector3(data.velocity.x, data.velocity.y, data.velocity.z));
    }
  }
  
  private handleProjectileFired(data: any): void {
    // Create projectile
    const projectile = new Projectile({
      id: data.id,
      position: new THREE.Vector3(data.position.x, data.position.y, data.position.z),
      direction: new THREE.Vector3(data.direction.x, data.direction.y, data.direction.z),
      speed: data.speed,
      damage: data.damage,
      ownerId: data.ownerId,
      scene: this.scene,
      physicsWorld: this.physicsWorld
    });
    
    // Add projectile to entity manager
    this.entityManager.addEntity(projectile);
    
    // Add projectile to game state
    this.gameState.projectiles.set(data.id, projectile);
    
    // Play sound
    this.audioManager.playSound('shot', 0.5);
  }
  
  private handlePlayerHit(data: any): void {
    const player = this.gameState.players.get(data.playerId);
    
    if (player) {
      // Update player health
      player.getTank().damage(data.damage);
      
      // Play hit sound
      this.audioManager.playSound('hit', 0.5);
      
      // Show damage indicator if local player was hit
      if (this.localPlayer && data.playerId === this.localPlayer.getId()) {
        this.uiManager.showDamageIndicator(data.damage);
        this.uiManager.updateHealth(this.localPlayer.getTank().getHealth());
      }
      
      // Check if player died
      if (player.getTank().isDead()) {
        // Play explosion sound
        this.audioManager.playSound('explosion', 0.7);
        
        // Show kill feed
        const killer = data.killerId ? 
          (this.gameState.players.get(data.killerId)?.getUsername() || 'Unknown') : 
          'Environment';
        
        this.uiManager.addKillFeed(`${killer} killed ${player.getUsername()}`);
        
        // Update score if local player got the kill
        if (this.localPlayer && data.killerId === this.localPlayer.getId()) {
          this.gameState.playerKills++;
          this.gameState.playerScore += 100;
          this.uiManager.updateScore(this.gameState.playerScore);
        }
      }
    }
  }
  
  private handleTankHitGround(data: any): void {
    // This is called when a tank hits the ground
    // We can use this to apply additional forces if needed
    if (this.localPlayer && data.tankId === this.localPlayer.getId()) {
      // Local player hit ground - could add effects here
    }
  }
  
  private handlePlayerDeath(): void {
    if (!this.localPlayer) return;
    
    // Show game over screen
    document.getElementById('game-over')?.classList.add('active');
    
    // Update stats
    document.getElementById('kills-count')!.textContent = this.gameState.playerKills.toString();
    document.getElementById('damage-dealt')!.textContent = this.localPlayer.getTank().getDamageDealt().toString();
    
    // Format survival time
    const minutes = Math.floor(this.gameState.gameTime / 60);
    const seconds = Math.floor(this.gameState.gameTime % 60);
    document.getElementById('survival-time')!.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Play death sound
    this.audioManager.playSound('explosion', 0.7);
  }
  
  private handleFireInput(): void {
    if (!this.localPlayer || this.localPlayer.getTank().isDead() || this.localPlayer.getTank().isReloading) return;
    
    const tank = this.localPlayer.getTank();
    
    // Fire projectile
    if (tank.fire()) {
      // Get projectile data
      const turretPosition = tank.getTurretPosition();
      const turretDirection = tank.getTurretDirection();
      
      // Create projectile
      const projectileId = `projectile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const projectile = new Projectile({
        id: projectileId,
        position: turretPosition,
        direction: turretDirection,
        speed: 50,
        damage: 20,
        ownerId: this.localPlayer.getId(),
        scene: this.scene,
        physicsWorld: this.physicsWorld
      });
      
      // Add projectile to entity manager
      this.entityManager.addEntity(projectile);
      
      // Add projectile to game state
      this.gameState.projectiles.set(projectileId, projectile);
      
      // Send projectile fired event to server
      this.networkManager.sendProjectileFired({
        id: projectileId,
        position: turretPosition,
        direction: turretDirection,
        speed: 50,
        damage: 20,
        ownerId: this.localPlayer.getId()
      });
      
      // Play sound
      this.audioManager.playSound('shot', 0.5);
      
      // Update UI
      this.uiManager.updateAmmo(tank.getAmmo(), tank.getMaxAmmo());
    }
  }
  
  private handleToggleCameraInput(): void {
    if (!this.localPlayer) return;
    
    this.cameraManager.toggleCameraMode();
  }
  
  private handleToggleChatInput(): void {
    this.uiManager.toggleChat();
  }
  
  private handleChatMessage(message: string): void {
    if (!this.localPlayer) return;
    
    // Send chat message to server
    this.networkManager.sendChatMessage({
      id: this.localPlayer.getId(),
      username: this.localPlayer.getUsername(),
      message: message
    });
  }
  
  private handleSettingChanged(data: any): void {
    // Handle settings changes from UI
    if (data.setting === 'invertMouseX') {
      this.inputManager.updateSettings({ invertMouseX: data.value });
    } else if (data.setting === 'invertMouseY') {
      this.inputManager.updateSettings({ invertMouseY: data.value });
    }
  }
  
  private handleInputSettingsChanged(settings: any): void {
    // Update UI when input settings change
    this.uiManager.updateSettings(settings);
    
    // Update settings menu checkboxes
    const invertXCheckbox = document.getElementById('invert-mouse-x') as HTMLInputElement;
    const invertYCheckbox = document.getElementById('invert-mouse-y') as HTMLInputElement;
    
    if (invertXCheckbox && settings.invertMouseX !== undefined) {
      invertXCheckbox.checked = settings.invertMouseX;
    }
    
    if (invertYCheckbox && settings.invertMouseY !== undefined) {
      invertYCheckbox.checked = settings.invertMouseY;
    }
  }
  
  /**
   * Get entities for minimap display
   */
  private getEntitiesForMinimap(): any[] {
    const entities: any[] = [];
    
    // Add other players
    this.gameState.players.forEach(player => {
      if (player !== this.localPlayer) {
        entities.push({
          type: 'player',
          position: player.getTank().getPosition()
        });
      }
    });
    
    // Add projectiles
    this.gameState.projectiles.forEach(projectile => {
      if (projectile.object3D) {
        entities.push({
          type: 'projectile',
          position: projectile.object3D.position
        });
      }
    });
    
    // Add world objects (could be added later)
    
    return entities;
  }
  
  private setupSettingsEvents(): void {
    // Get settings elements
    const invertXCheckbox = document.getElementById('invert-mouse-x') as HTMLInputElement;
    const invertYCheckbox = document.getElementById('invert-mouse-y') as HTMLInputElement;
    const backButton = document.getElementById('back-from-settings');
    
    // Add event listeners
    if (invertXCheckbox) {
      invertXCheckbox.addEventListener('change', () => {
        this.inputManager.updateSettings({ invertMouseX: invertXCheckbox.checked });
      });
    }
    
    if (invertYCheckbox) {
      invertYCheckbox.addEventListener('change', () => {
        this.inputManager.updateSettings({ invertMouseY: invertYCheckbox.checked });
      });
    }
    
    // Initialize checkboxes with current settings
    const settings = this.inputManager.getSettings();
    if (invertXCheckbox) {
      invertXCheckbox.checked = settings.invertMouseX;
    }
    
    if (invertYCheckbox) {
      invertYCheckbox.checked = settings.invertMouseY;
    }
  }
}
