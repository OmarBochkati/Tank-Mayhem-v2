import { EventEmitter } from '../utils/EventEmitter';

export class UIManager extends EventEmitter {
  private healthBar: HTMLElement | null = null;
  private healthText: HTMLElement | null = null;
  private ammoCount: HTMLElement | null = null;
  private ammoMax: HTMLElement | null = null;
  private reloadIndicator: HTMLElement | null = null;
  private killFeed: HTMLElement | null = null;
  private chatMessages: HTMLElement | null = null;
  private chatInput: HTMLInputElement | null = null;
  private chatContainer: HTMLElement | null = null;
  private miniMap: HTMLElement | null = null;
  
  constructor() {
    super();
    
    // Initialize UI elements
    this.initializeUI();
  }
  
  private initializeUI(): void {
    // Get UI elements
    this.healthBar = document.querySelector('.health-fill');
    this.healthText = document.querySelector('.health-text');
    this.ammoCount = document.querySelector('.ammo-count');
    this.ammoMax = document.querySelector('.ammo-max');
    this.reloadIndicator = document.querySelector('.reload-indicator');
    this.killFeed = document.querySelector('.kill-feed');
    this.chatMessages = document.querySelector('.chat-messages');
    this.chatInput = document.querySelector('.chat-input');
    this.chatContainer = document.querySelector('.chat-container');
    this.miniMap = document.querySelector('.mini-map');
    
    // Setup chat input
    if (this.chatInput) {
      this.chatInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          const message = this.chatInput!.value.trim();
          if (message) {
            this.emit('chatMessage', message);
            this.chatInput!.value = '';
          }
          this.toggleChat();
          event.preventDefault();
        } else if (event.key === 'Escape') {
          this.toggleChat();
          event.preventDefault();
        }
      });
    }
  }
  
  public updateHealth(health: number): void {
    if (this.healthBar) {
      this.healthBar.style.width = `${health}%`;
      
      // Change color based on health
      if (health > 60) {
        this.healthBar.style.backgroundColor = 'var(--health-color)';
      } else if (health > 30) {
        this.healthBar.style.backgroundColor = 'orange';
      } else {
        this.healthBar.style.backgroundColor = 'var(--damage-color)';
      }
    }
    
    if (this.healthText) {
      this.healthText.textContent = Math.max(0, Math.round(health)).toString();
    }
  }
  
  public updateAmmo(ammo: number, maxAmmo: number): void {
    if (this.ammoCount) {
      this.ammoCount.textContent = ammo.toString();
    }
    
    if (this.ammoMax) {
      this.ammoMax.textContent = `/${maxAmmo}`;
    }
  }
  
  public showReloadIndicator(): void {
    if (this.reloadIndicator) {
      this.reloadIndicator.classList.remove('hidden');
    }
  }
  
  public hideReloadIndicator(): void {
    if (this.reloadIndicator) {
      this.reloadIndicator.classList.add('hidden');
    }
  }
  
  public updateScore(score: number): void {
    // Update score display if we add one
  }
  
  public addKillFeed(message: string): void {
    if (!this.killFeed) return;
    
    const killMessage = document.createElement('div');
    killMessage.className = 'kill-message';
    killMessage.textContent = message;
    
    this.killFeed.appendChild(killMessage);
    
    // Remove after animation completes
    setTimeout(() => {
      if (killMessage.parentNode === this.killFeed) {
        this.killFeed!.removeChild(killMessage);
      }
    }, 5000);
  }
  
  public addChatMessage(username: string, message: string): void {
    if (!this.chatMessages) return;
    
    const chatMessage = document.createElement('div');
    chatMessage.className = 'chat-message';
    
    const usernameSpan = document.createElement('span');
    usernameSpan.className = 'chat-username';
    usernameSpan.textContent = username + ': ';
    
    const messageSpan = document.createElement('span');
    messageSpan.className = 'chat-text';
    messageSpan.textContent = message;
    
    chatMessage.appendChild(usernameSpan);
    chatMessage.appendChild(messageSpan);
    
    this.chatMessages.appendChild(chatMessage);
    
    // Scroll to bottom
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }
  
  public toggleChat(): void {
    if (!this.chatContainer) return;
    
    const isHidden = this.chatContainer.classList.contains('hidden');
    
    if (isHidden) {
      this.chatContainer.classList.remove('hidden');
      this.chatInput?.focus();
    } else {
      this.chatContainer.classList.add('hidden');
      this.chatInput?.blur();
    }
  }
  
  public showDamageIndicator(damage: number): void {
    // Create damage indicator
    const damageIndicator = document.createElement('div');
    damageIndicator.className = 'damage-indicator';
    damageIndicator.textContent = `-${damage}`;
    
    // Position randomly around the center of the screen
    const x = 50 + (Math.random() * 20 - 10);
    const y = 50 + (Math.random() * 20 - 10);
    
    damageIndicator.style.left = `${x}%`;
    damageIndicator.style.top = `${y}%`;
    
    // Add to DOM
    document.body.appendChild(damageIndicator);
    
    // Remove after animation
    setTimeout(() => {
      if (damageIndicator.parentNode === document.body) {
        document.body.removeChild(damageIndicator);
      }
    }, 1000);
  }
  
  public addNotification(message: string): void {
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Remove after animation
    setTimeout(() => {
      if (notification.parentNode === document.body) {
        document.body.removeChild(notification);
      }
    }, 3000);
  }
  
  public updateMiniMap(playerPosition: { x: number, z: number }, entities: any[]): void {
    if (!this.miniMap) return;
    
    // Clear mini-map
    this.miniMap.innerHTML = '';
    
    // Create player marker
    const playerMarker = document.createElement('div');
    playerMarker.className = 'mini-map-player';
    
    // Position player in center
    playerMarker.style.left = '50%';
    playerMarker.style.top = '50%';
    
    this.miniMap.appendChild(playerMarker);
    
    // Add other entities
    entities.forEach(entity => {
      if (entity.position) {
        // Calculate relative position
        const relX = entity.position.x - playerPosition.x;
        const relZ = entity.position.z - playerPosition.z;
        
        // Scale to mini-map size (75px is half the mini-map width/height)
        const mapX = 50 + (relX / 100) * 50;
        const mapZ = 50 + (relZ / 100) * 50;
        
        // Only show if within mini-map bounds
        if (mapX >= 0 && mapX <= 100 && mapZ >= 0 && mapZ <= 100) {
          const marker = document.createElement('div');
          
          // Set marker type based on entity type
          if (entity.type === 'player') {
            marker.className = 'mini-map-enemy';
          } else if (entity.type === 'projectile') {
            marker.className = 'mini-map-projectile';
          } else {
            marker.className = 'mini-map-object';
          }
          
          // Position marker
          marker.style.left = `${mapX}%`;
          marker.style.top = `${mapZ}%`;
          
          this.miniMap.appendChild(marker);
        }
      }
    });
  }
}
