import * as THREE from 'three';
import { Body, Vec3, Quaternion, Box, Cylinder, Material } from 'cannon-es';
import { Entity } from './Entity';
import { AssetManager } from '../core/AssetManager';

interface TankOptions {
  assetManager: AssetManager;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  color: number;
  isLocal: boolean;
  material?: Material;
}

export class Tank extends Entity {
  private assetManager: AssetManager;
  private position: THREE.Vector3;
  private rotation: THREE.Euler;
  private color: number;
  private isLocal: boolean;
  private material?: Material;
  
  // Tank components
  private tankBody: THREE.Object3D | null = null;
  private tankTurret: THREE.Object3D | null = null;
  private tankGroup: THREE.Group;
  
  // Physics
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private angularVelocity: THREE.Vector3 = new THREE.Vector3();
  
  // Tank properties
  private health: number = 100;
  private maxHealth: number = 100;
  private speed: number = 10;
  private turnSpeed: number = 2;
  private turretTurnSpeed: number = 3;
  private turretRotation: number = 0;
  
  // Weapon properties
  private ammo: number = 5;
  private maxAmmo: number = 5;
  private reloadTime: number = 2;
  private isReloading: boolean = false;
  private reloadTimer: number = 0;
  private damageDealt: number = 0;
  
  // Ground contact tracking
  private isGrounded: boolean = false;
  private lastGroundY: number = 0;
  
  constructor(options: TankOptions) {
    super(`tank_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    
    this.assetManager = options.assetManager;
    this.position = options.position.clone();
    this.rotation = options.rotation.clone();
    this.color = options.color;
    this.isLocal = options.isLocal;
    this.material = options.material;
    
    // Create tank 3D model
    this.createTankModel();
    
    // Create physics body
    this.createPhysicsBody();
  }
  
  private createTankModel(): void {
    // Create tank group
    this.tankGroup = new THREE.Group();
    
    // Load tank body model
    const tankBodyModel = this.assetManager.getModel('tankBody');
    
    if (tankBodyModel) {
      this.tankBody = tankBodyModel;
      
      // Apply color to tank body
      this.tankBody.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.material) {
            child.material = new THREE.MeshStandardMaterial({
              color: this.color,
              metalness: 0.7,
              roughness: 0.3
            });
          }
        }
      });
      
      this.tankGroup.add(this.tankBody);
    } else {
      // Fallback: Create simple tank body
      const bodyGeometry = new THREE.BoxGeometry(3, 1, 4);
      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: this.color,
        metalness: 0.7,
        roughness: 0.3
      });
      
      this.tankBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
      this.tankBody.position.y = 0.5;
      
      this.tankGroup.add(this.tankBody);
    }
    
    // Load tank turret model
    const tankTurretModel = this.assetManager.getModel('tankTurret');
    
    if (tankTurretModel) {
      this.tankTurret = tankTurretModel;
      
      // Apply color to tank turret
      this.tankTurret.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.material) {
            child.material = new THREE.MeshStandardMaterial({
              color: this.color,
              metalness: 0.7,
              roughness: 0.3
            });
          }
        }
      });
      
      // Position turret on top of body
      this.tankTurret.position.y = 1.5;
      
      this.tankGroup.add(this.tankTurret);
    } else {
      // Fallback: Create simple tank turret
      const turretGeometry = new THREE.BoxGeometry(2, 0.8, 3);
      const turretMaterial = new THREE.MeshStandardMaterial({
        color: this.color,
        metalness: 0.7,
        roughness: 0.3
      });
      
      this.tankTurret = new THREE.Mesh(turretGeometry, turretMaterial);
      this.tankTurret.position.y = 1.4;
      
      // Add gun barrel
      const barrelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3);
      const barrelMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.8,
        roughness: 0.2
      });
      
      const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.z = 2;
      
      this.tankTurret.add(barrel);
      this.tankGroup.add(this.tankTurret);
    }
    
    // Set tank position and rotation
    this.tankGroup.position.copy(this.position);
    this.tankGroup.rotation.copy(this.rotation);
    
    // Add shadows
    this.tankGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    // Set as object3D
    this.object3D = this.tankGroup;
  }
  
  private createPhysicsBody(): void {
    // Create tank physics body with increased mass to prevent sinking
    const body = new Body({
      mass: 1500, // Increased mass for better stability
      position: new Vec3(this.position.x, this.position.y, this.position.z),
      quaternion: new Quaternion().setFromEuler(
        this.rotation.x,
        this.rotation.y,
        this.rotation.z,
        'XYZ'
      ),
      material: this.material,
      linearDamping: 0.4, // Add damping to reduce bouncing
      angularDamping: 0.6, // Add angular damping to reduce tipping
      fixedRotation: false, // Allow rotation but control it
      allowSleep: false // Don't let the tank "sleep" in the physics simulation
    });
    
    // Add tank shape with adjusted dimensions
    const tankShape = new Box(new Vec3(1.5, 0.5, 2));
    body.addShape(tankShape, new Vec3(0, 0, 0));
    
    // Add turret shape
    const turretShape = new Box(new Vec3(1, 0.4, 1.5));
    body.addShape(turretShape, new Vec3(0, 1, 0));
    
    // Set user data
    body.userData = {
      type: 'tank',
      id: this.id
    };
    
    // Set up collision event listeners
    body.addEventListener('collide', (event) => {
      // Check if collision is with ground
      if (event.body.userData?.type === 'ground') {
        this.isGrounded = true;
        this.lastGroundY = event.contact.bi.position.y;
        
        // Apply upward force to counteract sinking if needed
        if (body.position.y < this.lastGroundY + 0.5) {
          const sinkDepth = (this.lastGroundY + 0.5) - body.position.y;
          body.applyLocalImpulse(
            new Vec3(0, sinkDepth * body.mass * 0.1, 0),
            new Vec3(0, 0, 0)
          );
        }
      }
    });
    
    // Set as physics body
    this.physicsBody = body;
  }
  
  public update(delta: number): void {
    // Update position and rotation from physics body
    if (this.physicsBody && this.object3D) {
      const position = this.physicsBody.position;
      const quaternion = this.physicsBody.quaternion;
      
      this.object3D.position.set(position.x, position.y, position.z);
      this.object3D.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
      
      // Anti-sink mechanism: Apply upward force if sinking too much
      if (this.isGrounded) {
        // Reset grounded flag each frame (will be set again on collision)
        this.isGrounded = false;
        
        // Apply a small constant upward force to prevent sinking
        this.physicsBody.applyLocalForce(
          new Vec3(0, this.physicsBody.mass * 9.82 * 1.02, 0), // Slightly more than gravity
          new Vec3(0, 0, 0)
        );
        
        // Limit vertical velocity to prevent excessive bouncing
        if (this.physicsBody.velocity.y < -5) {
          this.physicsBody.velocity.y = -5;
        }
      }
    }
    
    // Update reload timer
    if (this.isReloading) {
      this.reloadTimer += delta;
      
      if (this.reloadTimer >= this.reloadTime) {
        this.isReloading = false;
        this.reloadTimer = 0;
        this.ammo = this.maxAmmo;
      }
    }
  }
  
  public controlWithInput(delta: number, input: any): void {
    if (!this.physicsBody || !this.object3D) return;
    
    // Get current velocity
    const velocity = this.physicsBody.velocity;
    
    // Get forward direction
    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(this.object3D.quaternion);
    
    // Get right direction
    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(this.object3D.quaternion);
    
    // Reset forces
    this.physicsBody.force.set(0, this.physicsBody.force.y, 0); // Keep vertical force
    this.physicsBody.angularVelocity.set(0, 0, 0);
    
    // Apply movement forces
    if (input.forward) {
      this.physicsBody.force.x += forward.x * this.speed * 1000;
      this.physicsBody.force.z += forward.z * this.speed * 1000;
    }
    
    if (input.backward) {
      this.physicsBody.force.x -= forward.x * this.speed * 1000 * 0.7; // Slower reverse
      this.physicsBody.force.z -= forward.z * this.speed * 1000 * 0.7;
    }
    
    // Apply turning forces
    if (input.left) {
      this.physicsBody.angularVelocity.y = this.turnSpeed;
    }
    
    if (input.right) {
      this.physicsBody.angularVelocity.y = -this.turnSpeed;
    }
    
    // Apply damping
    this.physicsBody.linearDamping = 0.9;
    this.physicsBody.angularDamping = 0.9;
    
    // Limit horizontal velocity to prevent excessive speed
    const horizontalVelocity = new Vec3(
      this.physicsBody.velocity.x,
      0,
      this.physicsBody.velocity.z
    );
    
    const maxSpeed = 20;
    if (horizontalVelocity.length() > maxSpeed) {
      horizontalVelocity.normalize();
      horizontalVelocity.scale(maxSpeed, horizontalVelocity);
      this.physicsBody.velocity.x = horizontalVelocity.x;
      this.physicsBody.velocity.z = horizontalVelocity.z;
    }
    
    // Update turret rotation
    if (this.tankTurret) {
      this.turretRotation = input.turretX;
      this.tankTurret.rotation.y = this.turretRotation;
      this.tankTurret.rotation.x = input.turretY;
    }
    
    // Handle reload input
    if (input.reload && !this.isReloading && this.ammo < this.maxAmmo) {
      this.startReload();
    }
    
    // Update velocity for network sync
    this.velocity.set(
      this.physicsBody.velocity.x,
      this.physicsBody.velocity.y,
      this.physicsBody.velocity.z
    );
  }
  
  public fire(): boolean {
    if (this.ammo <= 0 || this.isReloading) {
      return false;
    }
    
    // Decrease ammo
    this.ammo--;
    
    // Auto-reload when empty
    if (this.ammo <= 0) {
      this.startReload();
    }
    
    return true;
  }
  
  private startReload(): void {
    this.isReloading = true;
    this.reloadTimer = 0;
  }
  
  public damage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
  }
  
  public heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }
  
  public isDead(): boolean {
    return this.health <= 0;
  }
  
  public reset(position?: THREE.Vector3): void {
    // Reset health and ammo
    this.health = this.maxHealth;
    this.ammo = this.maxAmmo;
    this.isReloading = false;
    this.reloadTimer = 0;
    
    // Reset position if provided
    if (position && this.physicsBody && this.object3D) {
      this.physicsBody.position.set(position.x, position.y, position.z);
      this.physicsBody.quaternion.setFromEuler(0, 0, 0);
      this.physicsBody.velocity.set(0, 0, 0);
      this.physicsBody.angularVelocity.set(0, 0, 0);
      
      this.object3D.position.copy(position);
      this.object3D.rotation.set(0, 0, 0);
    }
  }
  
  // Getters and setters
  public getPosition(): THREE.Vector3 {
    if (this.object3D) {
      return this.object3D.position.clone();
    }
    return this.position.clone();
  }
  
  public getRotation(): THREE.Euler {
    if (this.object3D) {
      return new THREE.Euler().setFromQuaternion(this.object3D.quaternion);
    }
    return this.rotation.clone();
  }
  
  public getTurretRotation(): number {
    return this.turretRotation;
  }
  
  public getVelocity(): THREE.Vector3 {
    return this.velocity.clone();
  }
  
  public getHealth(): number {
    return this.health;
  }
  
  public getMaxHealth(): number {
    return this.maxHealth;
  }
  
  public getAmmo(): number {
    return this.ammo;
  }
  
  public getMaxAmmo(): number {
    return this.maxAmmo;
  }

  
  public getColor(): number {
    return this.color;
  }
  
  public getDamageDealt(): number {
    return this.damageDealt;
  }
  
  public addDamageDealt(amount: number): void {
    this.damageDealt += amount;
  }
  
  public setPosition(position: THREE.Vector3): void {
    if (this.physicsBody) {
      this.physicsBody.position.set(position.x, position.y, position.z);
    }
    
    if (this.object3D) {
      this.object3D.position.copy(position);
    }
  }
  
  public setRotation(rotation: THREE.Euler): void {
    if (this.physicsBody) {
      this.physicsBody.quaternion.setFromEuler(rotation.x, rotation.y, rotation.z, 'XYZ');
    }
    
    if (this.object3D) {
      this.object3D.rotation.copy(rotation);
    }
  }
  
  public setTurretRotation(rotation: number): void {
    this.turretRotation = rotation;
    
    if (this.tankTurret) {
      this.tankTurret.rotation.y = rotation;
    }
  }
  
  public setVelocity(velocity: THREE.Vector3): void {
    this.velocity.copy(velocity);
    
    if (this.physicsBody) {
      this.physicsBody.velocity.set(velocity.x, velocity.y, velocity.z);
    }
  }
  
  public setHealth(health: number): void {
    this.health = Math.max(0, Math.min(this.maxHealth, health));
  }
  
  public getTurretPosition(): THREE.Vector3 {
    if (this.tankTurret) {
      const position = new THREE.Vector3();
      this.tankTurret.getWorldPosition(position);
      
      // Adjust position to be at the end of the barrel
      const direction = this.getTurretDirection();
      position.add(direction.multiplyScalar(3));
      
      return position;
    }
    
    return this.getPosition().add(new THREE.Vector3(0, 1.5, 0));
  }
  
  public getTurretDirection(): THREE.Vector3 {
    if (this.tankTurret) {
      const direction = new THREE.Vector3(0, 0, 1);
      direction.applyQuaternion(this.tankTurret.getWorldQuaternion(new THREE.Quaternion()));
      return direction.normalize();
    }
    
    const direction = new THREE.Vector3(0, 0, 1);
    if (this.object3D) {
      direction.applyQuaternion(this.object3D.quaternion);
    }
    return direction.normalize();
  }
  
  public getTurretObject(): THREE.Object3D | null {
    return this.tankTurret;
  }
}
