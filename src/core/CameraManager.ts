import * as THREE from 'three';

export enum CameraMode {
  FIRST_PERSON,
  THIRD_PERSON
}

export class CameraManager {
  private camera: THREE.PerspectiveCamera;
  private cameraMode: CameraMode = CameraMode.FIRST_PERSON;
  private target: THREE.Object3D | null = null;
  private turretTarget: THREE.Object3D | null = null;
  
  // Camera positioning
  private firstPersonOffset = new THREE.Vector3(0, 2, 0);
  private thirdPersonOffset = new THREE.Vector3(0, 5, -10);
  private currentPosition = new THREE.Vector3();
  private targetPosition = new THREE.Vector3();
  
  // Smoothing
  private positionLerpFactor = 0.1;
  private rotationLerpFactor = 0.1;
  
  constructor(canvas: HTMLCanvasElement) {
    // Create perspective camera
    this.camera = new THREE.PerspectiveCamera(
      75, // FOV
      canvas.clientWidth / canvas.clientHeight, // Aspect ratio
      0.1, // Near plane
      1000 // Far plane
    );
    
    // Set initial position
    this.camera.position.set(0, 5, -10);
    this.camera.lookAt(0, 0, 0);
  }
  
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
  
  public updateAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
  
  public followEntity(target: THREE.Object3D, turretTarget?: THREE.Object3D): void {
    this.target = target;
    this.turretTarget = turretTarget || null;
  }
  
  public toggleCameraMode(): void {
    this.cameraMode = this.cameraMode === CameraMode.FIRST_PERSON
      ? CameraMode.THIRD_PERSON
      : CameraMode.FIRST_PERSON;
  }
  
  public setCameraMode(mode: CameraMode): void {
    this.cameraMode = mode;
  }
  
  public update(delta: number): void {
    if (!this.target) return;
    
    const targetPosition = new THREE.Vector3();
    this.target.getWorldPosition(targetPosition);
    
    const targetQuaternion = new THREE.Quaternion();
    this.target.getWorldQuaternion(targetQuaternion);
    
    // Calculate camera position based on mode
    if (this.cameraMode === CameraMode.FIRST_PERSON && this.turretTarget) {
      // First person: position camera at turret
      const turretPosition = new THREE.Vector3();
      this.turretTarget.getWorldPosition(turretPosition);
      
      const turretQuaternion = new THREE.Quaternion();
      this.turretTarget.getWorldQuaternion(turretQuaternion);
      
      // Apply offset to position camera at eye level
      const offset = this.firstPersonOffset.clone();
      offset.applyQuaternion(turretQuaternion);
      
      this.targetPosition.copy(turretPosition).add(offset);
      
      // Set camera rotation to match turret
      this.camera.quaternion.slerp(turretQuaternion, this.rotationLerpFactor);
    } else {
      // Third person: position camera behind and above tank
      const offset = this.thirdPersonOffset.clone();
      offset.applyQuaternion(targetQuaternion);
      
      this.targetPosition.copy(targetPosition).add(offset);
      
      // Look at tank
      const lookAtPosition = targetPosition.clone();
      lookAtPosition.y += 2; // Look slightly above the tank
      
      this.camera.lookAt(lookAtPosition);
    }
    
    // Smoothly interpolate camera position
    this.camera.position.lerp(this.targetPosition, this.positionLerpFactor);
  }
}
