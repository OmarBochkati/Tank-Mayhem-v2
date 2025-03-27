import * as THREE from 'three';
import { Body } from 'cannon-es';

export abstract class Entity {
  protected id: string;
  protected object3D: THREE.Object3D | null = null;
  protected physicsBody: Body | null = null;
  
  constructor(id: string) {
    this.id = id;
  }
  
  public getId(): string {
    return this.id;
  }
  
  public getObject3D(): THREE.Object3D | null {
    return this.object3D;
  }
  
  public getPhysicsBody(): Body | null {
    return this.physicsBody;
  }
  
  public abstract update(delta: number, ...args: any[]): void;
  
  public dispose(): void {
    // Dispose of any resources
    if (this.object3D) {
      // Recursively dispose of geometries and materials
      this.object3D.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    }
  }
}
