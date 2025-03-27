import * as THREE from 'three';
import { Body, Vec3, Sphere } from 'cannon-es';
import { Entity } from './Entity';

interface ProjectileOptions {
  id: string;
  position: THREE.Vector3;
  direction: THREE.Vector3;
  speed: number;
  damage: number;
  ownerId: string;
  scene: THREE.Scene;
  physicsWorld: any;
}

export class Projectile extends Entity {
  private position: THREE.Vector3;
  private direction: THREE.Vector3;
  private speed: number;
  private damage: number;
  private ownerId: string;
  private scene: THREE.Scene;
  private physicsWorld: any;
  
  private lifeTime: number = 5; // Seconds
  private age: number = 0;
  private radius: number = 0.2;
  
  constructor(options: ProjectileOptions) {
    super(options.id);
    
    this.position = options.position.clone();
    this.direction = options.direction.normalize();
    this.speed = options.speed;
    this.damage = options.damage;
    this.ownerId = options.ownerId;
    this.scene = options.scene;
    this.physicsWorld = options.physicsWorld;
    
    // Create projectile 3D model
    this.createProjectileModel();
    
    // Create physics body
    this.createPhysicsBody();
  }
  
  private createProjectileModel(): void {
    // Create projectile mesh
    const geometry = new THREE.SphereGeometry(this.radius, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff3300,
      metalness: 0.3,
      roughness: 0.2
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Add trail effect
    const trailGeometry = new THREE.CylinderGeometry(0.05, 0.2, 2, 8);
    const trailMaterial = new THREE.MeshBasicMaterial({
      color: 0xff3300,
      transparent: true,
      opacity: 0.7
    });
    
    const trail = new THREE.Mesh(trailGeometry, trailMaterial);
    trail.rotation.x = Math.PI / 2;
    trail.position.z = -1;
    
    // Create group
    const group = new THREE.Group();
    group.add(mesh);
    group.add(trail);
    
    // Set position and rotation
    group.position.copy(this.position);
    group.lookAt(this.position.clone().add(this.direction));
    
    // Add light
    const light = new THREE.PointLight(0xff6600, 1, 5);
    light.position.set(0, 0, 0);
    group.add(light);
    
    // Set as object3D
    this.object3D = group;
  }
  
  private createPhysicsBody(): void {
    // Create projectile physics body
    const body = new Body({
      mass: 5,
      position: new Vec3(this.position.x, this.position.y, this.position.z),
      shape: new Sphere(this.radius)
    });
    
    // Set initial velocity
    const velocity = new Vec3(
      this.direction.x * this.speed,
      this.direction.y * this.speed,
      this.direction.z * this.speed
    );
    
    body.velocity.copy(velocity);
    
    // Set user data
    body.userData = {
      type: 'projectile',
      id: this.id,
      ownerId: this.ownerId,
      damage: this.damage
    };
    
    // Set as physics body
    this.physicsBody = body;
  }
  
  public update(delta: number): void {
    // Update age
    this.age += delta;
    
    // Update position and rotation from physics body
    if (this.physicsBody && this.object3D) {
      const position = this.physicsBody.position;
      
      this.object3D.position.set(position.x, position.y, position.z);
      
      // Update rotation to match velocity direction
      if (this.physicsBody.velocity.length() > 0.1) {
        const direction = new THREE.Vector3(
          this.physicsBody.velocity.x,
          this.physicsBody.velocity.y,
          this.physicsBody.velocity.z
        ).normalize();
        
        this.object3D.lookAt(
          this.object3D.position.clone().add(direction)
        );
      }
    }
  }
  
  public isExpired(): boolean {
    return this.age >= this.lifeTime;
  }
  
  public getOwnerId(): string {
    return this.ownerId;
  }
  
  public getDamage(): number {
    return this.damage;
  }
  
  public dispose(): void {
    super.dispose();
  }
}
