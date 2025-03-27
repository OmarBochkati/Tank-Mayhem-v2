import * as THREE from 'three';
import { Body, Box, Cylinder, Vec3, BODY_TYPES} from 'cannon-es';
import { AssetManager } from '../core/AssetManager';
import { ProceduralModels } from './ProceduralModels';

interface WorldObjectOptions {
  type: string;
  position: THREE.Vector3;
  scale: THREE.Vector3;
  rotation: THREE.Euler;
  scene: THREE.Scene;
  physicsWorld: any;
  assetManager: AssetManager;
  material?: any;
}

export class WorldObject {
  private type: string;
  private position: THREE.Vector3;
  private scale: THREE.Vector3;
  private rotation: THREE.Euler;
  private scene: THREE.Scene;
  private physicsWorld: any;
  private assetManager: AssetManager;
  private material?: any;

  private object3D: THREE.Object3D | null = null;
  private physicsBody: Body | null = null;
  private id: string;

  constructor(options: WorldObjectOptions) {
    this.type = options.type;
    this.position = options.position.clone();
    this.scale = options.scale.clone();
    this.rotation = options.rotation.clone();
    this.scene = options.scene;
    this.physicsWorld = options.physicsWorld;
    this.assetManager = options.assetManager;
    this.material = options.material;
    this.id = `${this.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public async createModel(): Promise<void> {
    // Try to load model from asset manager first

    if (!['tree','rock','building'].includes(this.type)) {
      const model = this.assetManager.getModel(this.type)!;
      this.object3D = model;
    } else {
      // Fallback: Create procedural model based on type
      switch (this.type) {
        case 'tree':
          this.object3D = ProceduralModels.createTree();
          break;

        case 'rock':
          this.object3D = ProceduralModels.createRock();
          break;

        case 'building':
          this.object3D = ProceduralModels.createBuilding();
          break;

        default:
          // Create simple box as fallback
          const geometry = new THREE.BoxGeometry(1, 1, 1);
          const material = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            roughness: 0.7,
            metalness: 0.3
          });

          this.object3D = new THREE.Mesh(geometry, material);
          break;
      }
    }

    // Apply position, scale, and rotation
    if (this.object3D) {
      this.object3D.position.copy(this.position);
      this.object3D.scale.copy(this.scale);
      this.object3D.rotation.copy(this.rotation);

      // Add shadows
      this.object3D.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Add to scene
      this.scene.add(this.object3D);
    }

    // Create physics body
    this.createPhysicsBody();

    return Promise.resolve();
  }

  private createPhysicsBody(): void {
    // Create physics body based on type
    let shape;

    switch (this.type) {
      case 'tree':
        // Create compound shape for tree
        this.physicsBody = new Body({
          mass: 0, // Static body
          position: new Vec3(this.position.x, this.position.y, this.position.z),
          material: this.material
        });

        // Add trunk shape
        const trunkShape = new Cylinder(
          0.2 * this.scale.x,
          0.3 * this.scale.x,
          2 * this.scale.y,
          8
        );
        this.physicsBody.addShape(trunkShape, new Vec3(0, 1 * this.scale.y, 0));

        break;

      case 'rock':
        // Create box shape for rock
        shape = new Box(new Vec3(
          0.8 * this.scale.x,
          0.8 * this.scale.y,
          0.8 * this.scale.z
        ));

        this.physicsBody = new Body({
          mass: 0, // Static body
          position: new Vec3(this.position.x, this.position.y, this.position.z),
          shape: shape,
          material: this.material
        });

        break;

      case 'building':
        // Create box shape for building
        const buildingWidth = 2 + Math.random() * 2;
        const buildingDepth = 2 + Math.random() * 2;
        const buildingHeight = 2 + Math.random() * 3;

        shape = new Box(new Vec3(
          buildingWidth/2 * this.scale.x,
          buildingHeight/2 * this.scale.y,
          buildingDepth/2 * this.scale.z
        ));

        this.physicsBody = new Body({
          mass: 0, // Static body
          position: new Vec3(
            this.position.x,
            this.position.y + buildingHeight/2 * this.scale.y,
            this.position.z
          ),
          shape: shape,
          material: this.material
        });

        break;

      default:
        // Create box shape
        shape = new Box(new Vec3(
          0.5 * this.scale.x,
          0.5 * this.scale.y,
          0.5 * this.scale.z
        ));

        this.physicsBody = new Body({
          mass: 0, // Static body
          position: new Vec3(this.position.x, this.position.y, this.position.z),
          shape: shape,
          material: this.material
        });

        break;
    }

    // Apply rotation
    if (this.physicsBody) {
      this.physicsBody.quaternion.setFromEuler(
        this.rotation.x,
        this.rotation.y,
        this.rotation.z,
        'XYZ'
      );

      // Add custom properties to the physics body
      this.physicsBody.type = BODY_TYPES.STATIC;
      this.physicsBody.id = Number(this.id);

      // Add to physics world
      this.physicsWorld.addBody(this.physicsBody);
    }
  }

  public getId(): string {
    return this.id;
  }

  public getType(): string {
    return this.type;
  }

  public getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  public getObject3D(): THREE.Object3D | null {
    return this.object3D;
  }

  public getPhysicsBody(): Body | null {
    return this.physicsBody;
  }
}
