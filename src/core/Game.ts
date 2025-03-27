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
    this.physicsWorld.gravity.set(0, -9.82, 0);
    this.physicsWorld.defaultContactMaterial.contactEquationStiffness = 1e7;
    this.physicsWorld.defaultContactMaterial.contactEquationRelaxation = 3;
    this.physicsWorld.solver.iterations = 10; // Increase solver iterations for better stability
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
    
    // UI events
    this.uiManager.on('chatMessage', this.handleChatMessage.bind(this));
    
    // Collision events
    this.collisionManager.on('tankHitGround', this.handleTankHitGround.bind(this));
  }
  
  public async start(): Promise<void> {
    if (this.isRunning) return;
    
    // Generate world
    await this.worldManager.generateWorld();
    
    // Connect to server
    await this.networkManager.connect();
    
    // Create local player
    this.createLocalPlayer();
    
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
    
    const delta = this.clock.getDelta();
    this.update(delta);
    this.render();
  }
  
  private update(delta: number): void {
    // Limit delta time to prevent large jumps in physics
    const cappedDelta = Math.min(delta, 1/30);
    
    // Update physics with fixed timestep for stability
    this.physicsWorld.step(1/60, cappedDelta, 3);
    
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
}
