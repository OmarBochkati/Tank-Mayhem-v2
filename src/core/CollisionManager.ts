import { World, Body, ContactMaterial, Material, Vec3 } from 'cannon-es';
import { EventEmitter } from '../utils/EventEmitter';

export class CollisionManager extends EventEmitter {
  private world: World;
  
  // Materials
  private tankMaterial: Material;
  private projectileMaterial: Material;
  private groundMaterial: Material;
  private obstacleMaterial: Material;
  
  constructor(world: World) {
    super();
    
    this.world = world;
    
    // Create materials
    this.tankMaterial = new Material('tank');
    this.projectileMaterial = new Material('projectile');
    this.groundMaterial = new Material('ground');
    this.obstacleMaterial = new Material('obstacle');
    
    // Create contact materials
    this.setupContactMaterials();
    
    // Setup collision event listeners
    this.setupCollisionEvents();
  }
  
  private setupContactMaterials(): void {
    // Tank-Ground contact - Improved to prevent sinking
    const tankGroundContact = new ContactMaterial(
      this.tankMaterial,
      this.groundMaterial,
      {
        friction: 0.7,       // Increased friction for better traction
        restitution: 0.1,    // Reduced restitution to minimize bouncing
        contactEquationStiffness: 1e8,  // Increased stiffness to prevent sinking
        contactEquationRelaxation: 3,   // Adjusted relaxation for stability
        frictionEquationStiffness: 1e8, // Increased friction stiffness
        frictionEquationRelaxation: 3   // Adjusted friction relaxation
      }
    );
    
    // Tank-Obstacle contact
    const tankObstacleContact = new ContactMaterial(
      this.tankMaterial,
      this.obstacleMaterial,
      {
        friction: 0.5,
        restitution: 0.2,
        contactEquationStiffness: 1e7,
        contactEquationRelaxation: 3
      }
    );
    
    // Projectile-Ground contact
    const projectileGroundContact = new ContactMaterial(
      this.projectileMaterial,
      this.groundMaterial,
      {
        friction: 0.3,
        restitution: 0.5
      }
    );
    
    // Projectile-Obstacle contact
    const projectileObstacleContact = new ContactMaterial(
      this.projectileMaterial,
      this.obstacleMaterial,
      {
        friction: 0.2,
        restitution: 0.2
      }
    );
    
    // Projectile-Tank contact
    const projectileTankContact = new ContactMaterial(
      this.projectileMaterial,
      this.tankMaterial,
      {
        friction: 0.2,
        restitution: 0.2
      }
    );
    
    // Add contact materials to world
    this.world.addContactMaterial(tankGroundContact);
    this.world.addContactMaterial(tankObstacleContact);
    this.world.addContactMaterial(projectileGroundContact);
    this.world.addContactMaterial(projectileObstacleContact);
    this.world.addContactMaterial(projectileTankContact);
  }
  
  private setupCollisionEvents(): void {
    // Listen for collision events
    this.world.addEventListener('beginContact', (event) => {
      const bodyA = event.bodyA;
      const bodyB = event.bodyB;
      
      if (!bodyA || !bodyB) return;
      
      // Check for projectile-tank collision
      if (
        (bodyA.userData?.type === 'projectile' && bodyB.userData?.type === 'tank') ||
        (bodyA.userData?.type === 'tank' && bodyB.userData?.type === 'projectile')
      ) {
        const projectileBody = bodyA.userData?.type === 'projectile' ? bodyA : bodyB;
        const tankBody = bodyA.userData?.type === 'tank' ? bodyA : bodyB;
        
        this.emit('projectileHitTank', {
          projectileId: projectileBody.userData?.id,
          tankId: tankBody.userData?.id,
          projectileOwnerId: projectileBody.userData?.ownerId,
          damage: projectileBody.userData?.damage || 20,
          position: new Vec3().copy(projectileBody.position)
        });
      }
      
      // Check for projectile-obstacle collision
      if (
        (bodyA.userData?.type === 'projectile' && bodyB.userData?.type === 'obstacle') ||
        (bodyA.userData?.type === 'obstacle' && bodyB.userData?.type === 'projectile')
      ) {
        const projectileBody = bodyA.userData?.type === 'projectile' ? bodyA : bodyB;
        const obstacleBody = bodyA.userData?.type === 'obstacle' ? bodyA : bodyB;
        
        this.emit('projectileHitObstacle', {
          projectileId: projectileBody.userData?.id,
          obstacleId: obstacleBody.userData?.id,
          position: new Vec3().copy(projectileBody.position)
        });
      }
      
      // Check for projectile-ground collision
      if (
        (bodyA.userData?.type === 'projectile' && bodyB.userData?.type === 'ground') ||
        (bodyA.userData?.type === 'ground' && bodyB.userData?.type === 'projectile')
      ) {
        const projectileBody = bodyA.userData?.type === 'projectile' ? bodyA : bodyB;
        
        this.emit('projectileHitGround', {
          projectileId: projectileBody.userData?.id,
          position: new Vec3().copy(projectileBody.position)
        });
      }
      
      // Check for tank-obstacle collision
      if (
        (bodyA.userData?.type === 'tank' && bodyB.userData?.type === 'obstacle') ||
        (bodyA.userData?.type === 'obstacle' && bodyB.userData?.type === 'tank')
      ) {
        const tankBody = bodyA.userData?.type === 'tank' ? bodyA : bodyB;
        const obstacleBody = bodyA.userData?.type === 'obstacle' ? bodyA : bodyB;
        
        this.emit('tankHitObstacle', {
          tankId: tankBody.userData?.id,
          obstacleId: obstacleBody.userData?.id
        });
      }
      
      // Check for tank-ground collision
      if (
        (bodyA.userData?.type === 'tank' && bodyB.userData?.type === 'ground') ||
        (bodyA.userData?.type === 'ground' && bodyB.userData?.type === 'tank')
      ) {
        const tankBody = bodyA.userData?.type === 'tank' ? bodyA : bodyB;
        const groundBody = bodyA.userData?.type === 'ground' ? bodyA : bodyB;
        
        this.emit('tankHitGround', {
          tankId: tankBody.userData?.id,
          position: new Vec3().copy(tankBody.position)
        });
      }
    });
  }
  
  public getTankMaterial(): Material {
    return this.tankMaterial;
  }
  
  public getProjectileMaterial(): Material {
    return this.projectileMaterial;
  }
  
  public getGroundMaterial(): Material {
    return this.groundMaterial;
  }
  
  public getObstacleMaterial(): Material {
    return this.obstacleMaterial;
  }
  
  public checkCollisions(): void {
    // This method is called every frame
    // The actual collision detection is handled by Cannon.js
    // We just need to make sure the physics world is updated
  }
}
