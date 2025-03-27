import { Entity } from './Entity';
import { Tank } from './Tank';
import * as THREE from 'three';

interface PlayerOptions {
  id: string;
  username: string;
  tank: Tank;
  isLocal: boolean;
}

export class Player extends Entity {
  private username: string;
  private tank: Tank;
  private isLocal: boolean;
  private score: number = 0;
  private kills: number = 0;
  private deaths: number = 0;
  
  constructor(options: PlayerOptions) {
    super(options.id);
    
    this.username = options.username;
    this.tank = options.tank;
    this.isLocal = options.isLocal;
    
    // Use tank's 3D object and physics body
    this.object3D = this.tank.getObject3D();
    this.physicsBody = this.tank.getPhysicsBody();
  }
  
  public getUsername(): string {
    return this.username;
  }
  
  public getTank(): Tank {
    return this.tank;
  }
  
  public isLocalPlayer(): boolean {
    return this.isLocal;
  }
  
  public getScore(): number {
    return this.score;
  }
  
  public getKills(): number {
    return this.kills;
  }
  
  public getDeaths(): number {
    return this.deaths;
  }
  
  public addKill(): void {
    this.kills++;
    this.score += 100;
  }
  
  public addDeath(): void {
    this.deaths++;
  }
  
  public update(delta: number, input?: any): void {
    // Update tank
    if (this.isLocal && input) {
      this.tank.controlWithInput(delta, input);
    } else {
      this.tank.update(delta);
    }
  }
  
  public dispose(): void {
    // Dispose tank resources
    this.tank.dispose();
    
    super.dispose();
  }
}
