import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import { WorldObject } from '../world/WorldObject';

export interface GameState {
  players: Map<string, Player>;
  projectiles: Map<string, Projectile>;
  worldObjects: Map<string, WorldObject>;
  playerScore: number;
  playerKills: number;
  gameTime: number;
}
