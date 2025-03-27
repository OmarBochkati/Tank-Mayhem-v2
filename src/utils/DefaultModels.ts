import * as THREE from 'three';
import { AssetManager } from '../core/AssetManager';

/**
 * Registers default procedural models for the game
 * This ensures we always have fallback models even if the asset loading fails
 */
export function registerDefaultModels(assetManager: AssetManager): void {
    // Create default tank body model
    const tankBody = createDefaultTankBody();
    assetManager.registerProceduralModel('tankBody', tankBody);

    // Create default tank turret model
    const tankTurret = createDefaultTankTurret();
    assetManager.registerProceduralModel('tankTurret', tankTurret);
}

/**
 * Creates a default tank body model
 */
function createDefaultTankBody(): THREE.Object3D {
    const body = new THREE.Group();

    // Main hull
    const hullGeometry = new THREE.BoxGeometry(3, 1, 4);
    const hullMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        metalness: 0.7,
        roughness: 0.3
    });

    const hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.y = 0.5;
    body.add(hull);

    // Tracks
    const trackGeometry = new THREE.BoxGeometry(0.5, 0.4, 4.2);
    const trackMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        metalness: 0.5,
        roughness: 0.8
    });

    const leftTrack = new THREE.Mesh(trackGeometry, trackMaterial);
    leftTrack.position.set(-1.5, 0.2, 0);
    body.add(leftTrack);

    const rightTrack = new THREE.Mesh(trackGeometry, trackMaterial);
    rightTrack.position.set(1.5, 0.2, 0);
    body.add(rightTrack);

    return body;
}

/**
 * Creates a default tank turret model
 */
function createDefaultTankTurret(): THREE.Object3D {
    const turret = new THREE.Group();

    // Main turret body
    const turretGeometry = new THREE.BoxGeometry(2, 0.8, 3);
    const turretMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        metalness: 0.7,
        roughness: 0.3
    });

    const turretBody = new THREE.Mesh(turretGeometry, turretMaterial);
    turret.add(turretBody);

    // Gun barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3);
    const barrelMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.8,
        roughness: 0.2
    });

    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = 2;
    turret.add(barrel);

    return turret;
}
