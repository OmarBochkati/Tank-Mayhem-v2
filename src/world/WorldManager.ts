import * as THREE from 'three';
import { World, Material } from 'cannon-es';
import { AssetManager } from '../core/AssetManager';
import { Terrain } from './Terrain';
import { WorldObject } from './WorldObject';

export class WorldManager {
  private scene: THREE.Scene;
  private physicsWorld: World;
  private assetManager: AssetManager;
  private groundMaterial?: Material;
  
  private terrain: Terrain | null = null;
  private worldObjects: WorldObject[] = [];
  private spawnPoints: THREE.Vector3[] = [];
  
  constructor(scene: THREE.Scene, physicsWorld: World, assetManager: AssetManager, groundMaterial?: Material) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.assetManager = assetManager;
    this.groundMaterial = groundMaterial;
  }
  
  public async generateWorld(): Promise<void> {
    // Create terrain
    this.terrain = new Terrain({
      size: 1000,
      resolution: 128,
      maxHeight: 50,
      scene: this.scene,
      physicsWorld: this.physicsWorld,
      assetManager: this.assetManager,
      material: this.groundMaterial
    });
    
    await this.terrain.generate();
    
    // Add lighting
    this.addLighting();
    
    // Add world objects
    await this.addWorldObjects();
    
    // Generate spawn points
    this.generateSpawnPoints();
    
    return Promise.resolve();
  }
  
  private addLighting(): void {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    // Add directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    
    // Configure shadow properties
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    
    this.scene.add(directionalLight);
    
    // Add hemisphere light for better ambient lighting
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x3a7e4d, 0.6);
    this.scene.add(hemisphereLight);
  }
  
  private async addWorldObjects(): Promise<void> {
    // Add trees, rocks, buildings, etc.
    const numTrees = 100;
    const numRocks = 50;
    const numBuildings = 20;
    
    // Add trees
    for (let i = 0; i < numTrees; i++) {
      const position = this.getRandomPosition();
      
      if (this.terrain) {
        position.y = this.terrain.getHeightAt(position.x, position.z);
      }
      
      const tree = new WorldObject({
        type: 'tree',
        position,
        scale: new THREE.Vector3(1, 1, 1).multiplyScalar(Math.random() * 0.5 + 0.8),
        rotation: new THREE.Euler(0, Math.random() * Math.PI * 2, 0),
        assetManager: this.assetManager,
        scene: this.scene,
        physicsWorld: this.physicsWorld,
        material: this.groundMaterial
      });
      
      await tree.createModel();
      this.worldObjects.push(tree);
    }
    
    // Add rocks
    for (let i = 0; i < numRocks; i++) {
      const position = this.getRandomPosition();
      
      if (this.terrain) {
        position.y = this.terrain.getHeightAt(position.x, position.z);
      }
      
      const rock = new WorldObject({
        type: 'rock',
        position,
        scale: new THREE.Vector3(1, 1, 1).multiplyScalar(Math.random() * 0.5 + 0.5),
        rotation: new THREE.Euler(
          Math.random() * 0.2,
          Math.random() * Math.PI * 2,
          Math.random() * 0.2
        ),
        assetManager: this.assetManager,
        scene: this.scene,
        physicsWorld: this.physicsWorld,
        material: this.groundMaterial
      });
      
      await rock.createModel();
      this.worldObjects.push(rock);
    }
    
    // Add buildings
    for (let i = 0; i < numBuildings; i++) {
      const position = this.getRandomPosition();
      
      if (this.terrain) {
        position.y = this.terrain.getHeightAt(position.x, position.z);
      }
      
      const building = new WorldObject({
        type: 'building',
        position,
        scale: new THREE.Vector3(1, 1, 1).multiplyScalar(Math.random() * 0.5 + 0.8),
        rotation: new THREE.Euler(0, Math.random() * Math.PI * 2, 0),
        assetManager: this.assetManager,
        scene: this.scene,
        physicsWorld: this.physicsWorld,
        material: this.groundMaterial
      });
      
      await building.createModel();
      this.worldObjects.push(building);
    }
    
    return Promise.resolve();
  }
  
  private generateSpawnPoints(): void {
    // Generate spawn points around the map
    const numSpawnPoints = 10;
    const mapSize = 1000;
    const margin = 100;
    
    for (let i = 0; i < numSpawnPoints; i++) {
      const x = Math.random() * (mapSize - margin * 2) - (mapSize / 2 - margin);
      const z = Math.random() * (mapSize - margin * 2) - (mapSize / 2 - margin);
      
      let y = 0;
      if (this.terrain) {
        y = this.terrain.getHeightAt(x, z) + 2; // Add a small offset to prevent sinking
      }
      
      const spawnPoint = new THREE.Vector3(x, y, z);
      this.spawnPoints.push(spawnPoint);
    }
  }
  
  private getRandomPosition(): THREE.Vector3 {
    const mapSize = 1000;
    const margin = 50;
    
    const x = Math.random() * (mapSize - margin * 2) - (mapSize / 2 - margin);
    const z = Math.random() * (mapSize - margin * 2) - (mapSize / 2 - margin);
    
    return new THREE.Vector3(x, 0, z);
  }
  
  public getRandomSpawnPosition(): THREE.Vector3 {
    if (this.spawnPoints.length === 0) {
      // Fallback if no spawn points are available
      const position = this.getRandomPosition();
      
      if (this.terrain) {
        position.y = this.terrain.getHeightAt(position.x, position.z) + 2; // Add offset to prevent sinking
      }
      
      return position;
    }
    
    // Get a random spawn point
    const index = Math.floor(Math.random() * this.spawnPoints.length);
    return this.spawnPoints[index].clone();
  }
  
  public getTerrainHeightAt(x: number, z: number): number {
    if (this.terrain) {
      return this.terrain.getHeightAt(x, z);
    }
    
    return 0;
  }
}
