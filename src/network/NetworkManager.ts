import { io, Socket } from 'socket.io-client';
import { EventEmitter } from '../utils/EventEmitter';
import { v4 as uuidv4 } from 'uuid';

export class NetworkManager extends EventEmitter {
  private socket: Socket | null = null;
  private clientId: string = '';
  private isConnected: boolean = false;
  private serverUrl: string = 'http://localhost:3000'; // Default server URL
  
  constructor() {
    super();
    
    // Generate a unique client ID
    this.clientId = uuidv4();
  }
  
  public async connect(): Promise<void> {
    if (this.isConnected) return;
    
    try {
      // For demo purposes, we'll simulate a connection
      // In a real implementation, this would connect to a Socket.IO server
      console.log('Connecting to server...');
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate successful connection
      this.isConnected = true;
      console.log('Connected to server');
      
      // Simulate receiving player data
      this.simulateNetworkEvents();
      
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to connect to server:', error);
      return Promise.reject(error);
    }
  }
  
  public disconnect(): void {
    if (!this.isConnected) return;
    
    // For demo purposes, we'll simulate a disconnection
    console.log('Disconnecting from server...');
    
    this.isConnected = false;
    console.log('Disconnected from server');
  }
  
  public getClientId(): string {
    return this.clientId;
  }
  
  public isConnectedToServer(): boolean {
    return this.isConnected;
  }
  
  // Send events to server
  public sendPlayerJoined(data: any): void {
    if (!this.isConnected) return;
    
    console.log('Sending player joined event:', data);
    // In a real implementation, this would send data to the server
    // this.socket.emit('playerJoined', data);
  }
  
  public sendPlayerUpdate(data: any): void {
    if (!this.isConnected) return;
    
    // In a real implementation, this would send data to the server
    // this.socket.emit('playerUpdate', data);
    
    // We don't log this to avoid console spam
  }
  
  public sendPlayerRespawned(data: any): void {
    if (!this.isConnected) return;
    
    console.log('Sending player respawned event:', data);
    // In a real implementation, this would send data to the server
    // this.socket.emit('playerRespawned', data);
  }
  
  public sendProjectileFired(data: any): void {
    if (!this.isConnected) return;
    
    console.log('Sending projectile fired event:', data);
    // In a real implementation, this would send data to the server
    // this.socket.emit('projectileFired', data);
    
    // Simulate receiving the event back from the server
    setTimeout(() => {
      this.emit('projectileFired', data);
    }, 50);
  }
  
  public sendChatMessage(data: any): void {
    if (!this.isConnected) return;
    
    console.log('Sending chat message:', data);
    // In a real implementation, this would send data to the server
    // this.socket.emit('chatMessage', data);
    
    // Simulate receiving the message back from the server
    setTimeout(() => {
      this.emit('chatMessage', {
        id: data.id,
        username: data.username,
        message: data.message,
        timestamp: Date.now()
      });
    }, 100);
  }
  
  // Simulate network events for demo purposes
  private simulateNetworkEvents(): void {
    // Simulate other players joining
    setTimeout(() => {
      this.emit('playerJoined', {
        id: 'bot1',
        username: 'TankMaster',
        position: { x: 20, y: 1, z: 20 },
        rotation: { x: 0, y: 0, z: 0 },
        health: 100,
        color: 0xff0000
      });
    }, 2000);
    
    setTimeout(() => {
      this.emit('playerJoined', {
        id: 'bot2',
        username: 'Destroyer',
        position: { x: -20, y: 1, z: -20 },
        rotation: { x: 0, y: 0, z: 0 },
        health: 100,
        color: 0x00ff00
      });
    }, 3000);
    
    // Simulate player updates
    setInterval(() => {
      if (!this.isConnected) return;
      
      // Simulate bot1 movement
      this.emit('playerUpdate', {
        id: 'bot1',
        position: {
          x: 20 + Math.sin(Date.now() / 1000) * 5,
          y: 1,
          z: 20 + Math.cos(Date.now() / 1000) * 5
        },
        rotation: {
          x: 0,
          y: Date.now() / 1000,
          z: 0
        },
        turretRotation: Date.now() / 1000 * 0.5,
        health: 100,
        velocity: {
          x: Math.cos(Date.now() / 1000) * 0.5,
          y: 0,
          z: -Math.sin(Date.now() / 1000) * 0.5
        }
      });
      
      // Simulate bot2 movement
      this.emit('playerUpdate', {
        id: 'bot2',
        position: {
          x: -20 + Math.cos(Date.now() / 1500) * 8,
          y: 1,
          z: -20 + Math.sin(Date.now() / 1500) * 8
        },
        rotation: {
          x: 0,
          y: -Date.now() / 1500,
          z: 0
        },
        turretRotation: -Date.now() / 1500 * 0.3,
        health: 100,
        velocity: {
          x: -Math.sin(Date.now() / 1500) * 0.5,
          y: 0,
          z: -Math.cos(Date.now() / 1500) * 0.5
        }
      });
    }, 100);
    
    // Simulate bot firing occasionally
    setInterval(() => {
      if (!this.isConnected) return;
      
      // 10% chance to fire
      if (Math.random() > 0.9) {
        const botId = Math.random() > 0.5 ? 'bot1' : 'bot2';
        const botPosition = botId === 'bot1' 
          ? { x: 20 + Math.sin(Date.now() / 1000) * 5, y: 2, z: 20 + Math.cos(Date.now() / 1000) * 5 }
          : { x: -20 + Math.cos(Date.now() / 1500) * 8, y: 2, z: -20 + Math.sin(Date.now() / 1500) * 8 };
        
        const angle = botId === 'bot1' ? Date.now() / 1000 * 0.5 : -Date.now() / 1500 * 0.3;
        const direction = {
          x: Math.sin(angle),
          y: 0,
          z: Math.cos(angle)
        };
        
        this.emit('projectileFired', {
          id: `projectile_${Date.now()}_${botId}`,
          position: botPosition,
          direction: direction,
          speed: 50,
          damage: 20,
          ownerId: botId
        });
      }
    }, 2000);
    
    // Simulate chat messages
    setTimeout(() => {
      if (!this.isConnected) return;
      
      this.emit('chatMessage', {
        id: 'bot1',
        username: 'TankMaster',
        message: 'Hello everyone! Ready for battle?',
        timestamp: Date.now()
      });
    }, 5000);
    
    setTimeout(() => {
      if (!this.isConnected) return;
      
      this.emit('chatMessage', {
        id: 'bot2',
        username: 'Destroyer',
        message: 'I\'m going to crush you all!',
        timestamp: Date.now()
      });
    }, 8000);
  }
}
