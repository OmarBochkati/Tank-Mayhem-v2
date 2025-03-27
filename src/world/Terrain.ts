import * as THREE from 'three';
import { World, Body, Plane, Heightfield, Vec3, Material } from 'cannon-es';
import { AssetManager } from '../core/AssetManager';
import { createNoise2D } from 'simplex-noise';

interface TerrainOptions {
  size: number;
  resolution: number;
  maxHeight: number;
  scene: THREE.Scene;
  physicsWorld: World;
  assetManager: AssetManager;
  material?: Material;
}

export class Terrain {
  private size: number;
  private resolution: number;
  private maxHeight: number;
  private scene: THREE.Scene;
  private physicsWorld: World;
  private assetManager: AssetManager;
  private material?: Material;
  
  private geometry: THREE.PlaneGeometry | null = null;
  private mesh: THREE.Mesh | null = null;
  private heightData: number[][] = [];
  private physicsBody: Body | null = null;
  
  constructor(options: TerrainOptions) {
    this.size = options.size;
    this.resolution = options.resolution;
    this.maxHeight = options.maxHeight;
    this.scene = options.scene;
    this.physicsWorld = options.physicsWorld;
    this.assetManager = options.assetManager;
    this.material = options.material;
  }
  
  public async generate(): Promise<void> {
    // Generate height data using simplex noise
    this.generateHeightData();
    
    // Create terrain geometry
    this.createTerrainGeometry();
    
    // Create physics body
    this.createPhysicsBody();
    
    return Promise.resolve();
  }
  
  private generateHeightData(): void {
    // Initialize height data array
    this.heightData = Array(this.resolution + 1).fill(0).map(() => Array(this.resolution + 1).fill(0));
    
    // Create simplex noise generator
    const noise2D = createNoise2D(() => Math.random());
    
    // Generate height data
    for (let i = 0; i <= this.resolution; i++) {
      for (let j = 0; j <= this.resolution; j++) {
        // Normalize coordinates to [0, 1]
        const x = i / this.resolution;
        const z = j / this.resolution;
        
        // Generate multi-octave noise
        let height = 0;
        let frequency = 1;
        let amplitude = 1;
        const octaves = 6;
        
        for (let k = 0; k < octaves; k++) {
          height += noise2D(x * frequency, z * frequency) * amplitude;
          frequency *= 2;
          amplitude *= 0.5;
        }
        
        // Normalize and scale height
        height = (height + 1) / 2; // Map from [-1, 1] to [0, 1]
        height *= this.maxHeight;
        
        // Add some flat areas for gameplay
        if (height < this.maxHeight * 0.3) {
          height = this.maxHeight * 0.3;
        }
        
        this.heightData[i][j] = height;
      }
    }
  }
  
  private createTerrainGeometry(): void {
    // Create plane geometry
    this.geometry = new THREE.PlaneGeometry(
      this.size,
      this.size,
      this.resolution,
      this.resolution
    );
    
    // Rotate to horizontal
    this.geometry.rotateX(-Math.PI / 2);
    
    // Applyprivate createTerrainGeometry(): void {
    // Create plane geometry
    this.geometry = new THREE.PlaneGeometry(
      this.size,
      this.size,
      this.resolution,
      this.resolution
    );
    
    // Rotate to horizontal
    this.geometry.rotateX(-Math.PI / 2);
    
    // Apply height data to vertices
    const vertices = this.geometry.attributes.position.array;
    
    for (let i = 0, j = 0; i < vertices.length; i += 3, j++) {
      const x = Math.floor(j / (this.resolution + 1));
      const z = j % (this.resolution + 1);
      
      vertices[i + 1] = this.heightData[x][z];
    }
    
    // Update normals
    this.geometry.computeVertexNormals();
    
    // Get textures
    const grassTexture = this.assetManager.getTexture('grass');
    const sandTexture = this.assetManager.getTexture('sand');
    const dirtTexture = this.assetManager.getTexture('dirt');
    
    // Create material
    let material;
    
    if (grassTexture && sandTexture && dirtTexture) {
      // Create shader material for blending textures
      material = new THREE.MeshStandardMaterial({
        map: grassTexture,
        roughness: 0.8,
        metalness: 0.2
      });
      
      // Set texture repeat
      grassTexture.repeat.set(20, 20);
      sandTexture.repeat.set(20, 20);
      dirtTexture.repeat.set(20, 20);
    } else {
      // Fallback: Create simple material
      material = new THREE.MeshStandardMaterial({
        color: 0x3a7e4d,
        roughness: 0.8,
        metalness: 0.2
      });
    }
    
    // Create mesh
    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.receiveShadow = true;
    
    // Add to scene
    this.scene.add(this.mesh);
  }
  
  private createPhysicsBody(): void {
    // Convert height data to format expected by Cannon.js
    const data = [];
    
    for (let i = 0; i < this.resolution; i++) {
      data[i] = [];
      for (let j = 0; j < this.resolution; j++) {
        data[i][j] = this.heightData[i][j];
      }
    }
    
    // Create heightfield shape with improved parameters
    const heightfieldShape = new Heightfield(data, {
      elementSize: this.size / this.resolution
    });
    
    // Create body with improved parameters
    this.physicsBody = new Body({
      mass: 0, // Static body
      position: new Vec3(-this.size / 2, 0, -this.size / 2),
      material: this.material
    });
    
    // Add shape to body
    this.physicsBody.addShape(heightfieldShape);
    
    // Set user data
    this.physicsBody.userData = {
      type: 'ground'
    };
    
    // Add to physics world
    this.physicsWorld.addBody(this.physicsBody);
  }
  
  public getHeightAt(x: number, z: number): number {
    // Convert world coordinates to heightmap indices
    const i = Math.floor((x + this.size / 2) / this.size * this.resolution);
    const j = Math.floor((z + this.size / 2) / this.size * this.resolution);
    
    // Clamp indices to valid range
    const clampedI = Math.max(0, Math.min(this.resolution, i));
    const clampedJ = Math.max(0, Math.min(this.resolution, j));
    
    // Return height at position
    return this.heightData[clampedI][clampedJ];
  }
}
