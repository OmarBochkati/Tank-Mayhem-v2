import * as THREE from 'three';
import { World } from 'cannon-es';
import { Entity } from '../entities/Entity';

export class EntityManager {
  private scene: THREE.Scene;
  private physicsWorld: World;
  private entities: Map<string, Entity> = new Map();
  
  constructor(scene: THREE.Scene, physicsWorld: World) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
  }
  
  public addEntity(entity: Entity): void {
    // Add entity to map
    this.entities.set(entity.getId(), entity);
    
    // Add entity's 3D object to scene
    const object3D = entity.getObject3D();
    if (object3D) {
      this.scene.add(object3D);
    }
    
    // Add entity's physics body to world
    const physicsBody = entity.getPhysicsBody();
    if (physicsBody) {
      this.physicsWorld.addBody(physicsBody);
    }
  }
  
  public removeEntity(entity: Entity): void {
    // Remove entity from map
    this.entities.delete(entity.getId());
    
    // Remove entity's 3D object from scene
    const object3D = entity.getObject3D();
    if (object3D) {
      this.scene.remove(object3D);
    }
    
    // Remove entity's physics body from world
    const physicsBody = entity.getPhysicsBody();
    if (physicsBody) {
      this.physicsWorld.removeBody(physicsBody);
    }
    
    // Dispose entity resources
    entity.dispose();
  }
  
  public getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }
  
  public getEntities(): Map<string, Entity> {
    return this.entities;
  }
  
  public update(delta: number): void {
    // Update all entities
    this.entities.forEach(entity => {
      entity.update(delta);
    });
  }
  
  public clear(): void {
    // Remove all entities
    this.entities.forEach(entity => {
      this.removeEntity(entity);
    });
    
    this.entities.clear();
  }
}
