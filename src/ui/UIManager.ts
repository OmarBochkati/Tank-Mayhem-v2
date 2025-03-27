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
  private settingsContainer: HTMLElement | null = null;
  private invertMouseXCheckbox: HTMLInputElement | null = null;
  private invertMouseYCheckbox: HTMLInputElement | null = null;
  private debugPanel: HTMLElement | null = null;
  private debugEnabled: boolean = false;
  
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
    this.settingsContainer = document.querySelector('.settings-container');
    this.invertMouseXCheckbox = document.querySelector('#invert-mouse-x');
    this.invertMouseYCheckbox = document.querySelector('#invert-mouse-y');
    
    // Create debug panel
    this.createDebugPanel();
    
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
    
    // Setup settings UI
    this.initializeSettings();
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
  
  private initializeSettings(): void {
    // Create settings UI if it doesn't exist
    if (!this.settingsContainer) {
      this.createSettingsUI();
    }
    
    // Add event listeners to settings controls
    if (this.invertMouseXCheckbox) {
      this.invertMouseXCheckbox.addEventListener('change', () => {
        this.emit('settingChanged', {
          setting: 'invertMouseX',
          value: this.invertMouseXCheckbox!.checked
        });
      });
    }
    
    if (this.invertMouseYCheckbox) {
      this.invertMouseYCheckbox.addEventListener('change', () => {
        this.emit('settingChanged', {
          setting: 'invertMouseY',
          value: this.invertMouseYCheckbox!.checked
        });
      });
    }
    
    // Add settings toggle button
    const settingsButton = document.createElement('button');
    settingsButton.className = 'settings-button';
    settingsButton.textContent = '⚙️';
    settingsButton.addEventListener('click', () => this.toggleSettings());
    document.body.appendChild(settingsButton);
  }
  
  private createSettingsUI(): void {
    // Create settings container
    this.settingsContainer = document.createElement('div');
    this.settingsContainer.className = 'settings-container hidden';
    
    // Create settings header
    const header = document.createElement('h2');
    header.textContent = 'Settings';
    this.settingsContainer.appendChild(header);
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'settings-close';
    closeButton.textContent = '×';
    closeButton.addEventListener('click', () => this.toggleSettings());
    this.settingsContainer.appendChild(closeButton);
    
    // Create settings content
    const content = document.createElement('div');
    content.className = 'settings-content';
    
    // Mouse settings section
    const mouseSection = document.createElement('div');
    mouseSection.className = 'settings-section';
    
    const mouseHeader = document.createElement('h3');
    mouseHeader.textContent = 'Mouse Settings';
    mouseSection.appendChild(mouseHeader);
    
    // Invert X axis
    const invertXContainer = document.createElement('div');
    invertXContainer.className = 'setting-item';
    
    this.invertMouseXCheckbox = document.createElement('input');
    this.invertMouseXCheckbox.type = 'checkbox';
    this.invertMouseXCheckbox.id = 'invert-mouse-x';
    
    const invertXLabel = document.createElement('label');
    invertXLabel.htmlFor = 'invert-mouse-x';
    invertXLabel.textContent = 'Invert Mouse X-Axis';
    
    invertXContainer.appendChild(this.invertMouseXCheckbox);
    invertXContainer.appendChild(invertXLabel);
    mouseSection.appendChild(invertXContainer);
    
    // Invert Y axis
    const invertYContainer = document.createElement('div');
    invertYContainer.className = 'setting-item';
    
    this.invertMouseYCheckbox = document.createElement('input');
    this.invertMouseYCheckbox.type = 'checkbox';
    this.invertMouseYCheckbox.id = 'invert-mouse-y';
    
    const invertYLabel = document.createElement('label');
    invertYLabel.htmlFor = 'invert-mouse-y';
    invertYLabel.textContent = 'Invert Mouse Y-Axis';
    
    invertYContainer.appendChild(this.invertMouseYCheckbox);
    invertYContainer.appendChild(invertYLabel);
    mouseSection.appendChild(invertYContainer);
    
    content.appendChild(mouseSection);
    this.settingsContainer.appendChild(content);
    
    // Add to DOM
    document.body.appendChild(this.settingsContainer);
    
    // Add CSS for settings
    this.addSettingsStyles();
  }
  
  private addSettingsStyles(): void {
    // Create style element if it doesn't exist
    let styleElement = document.getElementById('game-ui-styles');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'game-ui-styles';
      document.head.appendChild(styleElement);
    }
    
    // Add settings styles
    const styles = `
      .settings-button {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 40px;
        height: 40px;
        background: rgba(0, 0, 0, 0.5);
        border: 2px solid #fff;
        border-radius: 50%;
        color: #fff;
        font-size: 20px;
        cursor: pointer;
        z-index: 1000;
      }
      
      .settings-container {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 400px;
        background: rgba(0, 0, 0, 0.8);
        border: 2px solid #fff;
        border-radius: 10px;
        color: #fff;
        padding: 20px;
        z-index: 1001;
      }
      
      .settings-container.hidden {
        display: none;
      }
      
      .settings-close {
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        color: #fff;
        font-size: 24px;
        cursor: pointer;
      }
      
      .settings-content {
        max-height: 400px;
        overflow-y: auto;
      }
      
      .settings-section {
        margin-bottom: 20px;
      }
      
      .setting-item {
        display: flex;
        align-items: center;
        margin: 10px 0;
      }
      
      .setting-item input[type="checkbox"] {
        margin-right: 10px;
        width: 20px;
        height: 20px;
      }
      
      .setting-item label {
        font-size: 16px;
      }
      
      /* Debug Panel Styles */
      .debug-panel {
        position: absolute;
        top: 10px;
        left: 10px;
        background: rgba(0, 0, 0, 0.7);
        color: #0f0;
        font-family: monospace;
        font-size: 12px;
        padding: 10px;
        border-radius: 5px;
        z-index: 1000;
        min-width: 200px;
        max-width: 300px;
        pointer-events: none;
        display: none;
      }
      
      .debug-panel.active {
        display: block;
      }
      
      .debug-panel h3 {
        margin: 0 0 5px 0;
        font-size: 14px;
        color: #fff;
      }
      
      .debug-section {
        margin-bottom: 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.3);
        padding-bottom: 5px;
      }
      
      .debug-row {
        display: flex;
        justify-content: space-between;
        margin: 2px 0;
      }
      
      .debug-label {
        color: #aaa;
      }
      
      .debug-value {
        color: #0f0;
        text-align: right;
      }
      
      .debug-toggle {
        position: absolute;
        top: 10px;
        left: 10px;
        background: rgba(0, 0, 0, 0.5);
        color: #fff;
        border: 1px solid #fff;
        border-radius: 3px;
        padding: 3px 6px;
        font-size: 10px;
        cursor: pointer;
        z-index: 1001;
        pointer-events: auto;
      }
    `;
    
    styleElement.textContent += styles;
  }
  
  public toggleSettings(): void {
    if (!this.settingsContainer) return;
    
    this.settingsContainer.classList.toggle('hidden');
  }
  
  public updateSettings(settings: any): void {
    if (this.invertMouseXCheckbox && settings.invertMouseX !== undefined) {
      this.invertMouseXCheckbox.checked = settings.invertMouseX;
    }
    
    if (this.invertMouseYCheckbox && settings.invertMouseY !== undefined) {
      this.invertMouseYCheckbox.checked = settings.invertMouseY;
    }
  }
  
  /**
   * Create debug panel for displaying performance metrics and debug info
   */
  private createDebugPanel(): void {
    // Create debug panel container
    this.debugPanel = document.createElement('div');
    this.debugPanel.className = 'debug-panel';
    
    // Create debug toggle button
    const debugToggle = document.createElement('button');
    debugToggle.className = 'debug-toggle';
    debugToggle.textContent = 'DEBUG';
    debugToggle.addEventListener('click', () => this.toggleDebugPanel());
    
    // Add sections to debug panel
    this.debugPanel.innerHTML = `
      <div class="debug-section">
        <h3>Performance</h3>
        <div class="debug-row">
          <span class="debug-label">FPS:</span>
          <span class="debug-value" id="debug-fps">0</span>
        </div>
        <div class="debug-row">
          <span class="debug-label">Frame Time:</span>
          <span class="debug-value" id="debug-frame-time">0 ms</span>
        </div>
        <div class="debug-row">
          <span class="debug-label">Memory:</span>
          <span class="debug-value" id="debug-memory">0 MB</span>
        </div>
      </div>
      
      <div class="debug-section">
        <h3>Player</h3>
        <div class="debug-row">
          <span class="debug-label">Position:</span>
          <span class="debug-value" id="debug-position">0, 0, 0</span>
        </div>
        <div class="debug-row">
          <span class="debug-label">Rotation:</span>
          <span class="debug-value" id="debug-rotation">0, 0, 0</span>
        </div>
        <div class="debug-row">
          <span class="debug-label">Velocity:</span>
          <span class="debug-value" id="debug-velocity">0, 0, 0</span>
        </div>
      </div>
      
      <div class="debug-section">
        <h3>Scene</h3>
        <div class="debug-row">
          <span class="debug-label">Draw Calls:</span>
          <span class="debug-value" id="debug-draw-calls">0</span>
        </div>
        <div class="debug-row">
          <span class="debug-label">Triangles:</span>
          <span class="debug-value" id="debug-triangles">0</span>
        </div>
        <div class="debug-row">
          <span class="debug-label">Entities:</span>
          <span class="debug-value" id="debug-entities">0</span>
        </div>
      </div>
      
      <div class="debug-section">
        <h3>Physics</h3>
        <div class="debug-row">
          <span class="debug-label">Bodies:</span>
          <span class="debug-value" id="debug-physics-bodies">0</span>
        </div>
        <div class="debug-row">
          <span class="debug-label">Contacts:</span>
          <span class="debug-value" id="debug-physics-contacts">0</span>
        </div>
      </div>
    `;
    
    // Add to DOM
    document.body.appendChild(this.debugPanel);
    document.body.appendChild(debugToggle);
  }
  
  /**
   * Toggle debug panel visibility
   */
  public toggleDebugPanel(): void {
    this.debugEnabled = !this.debugEnabled;
    
    if (this.debugPanel) {
      if (this.debugEnabled) {
        this.debugPanel.classList.add('active');
      } else {
        this.debugPanel.classList.remove('active');
      }
    }
  }
  
  /**
   * Update debug panel with current metrics
   * @param debugData Object containing debug metrics
   */
  public updateDebugInfo(debugData: any): void {
    if (!this.debugEnabled || !this.debugPanel) return;
    
    // Update performance metrics
    document.getElementById('debug-fps')!.textContent = debugData.fps.toFixed(1);
    document.getElementById('debug-frame-time')!.textContent = `${debugData.frameTime.toFixed(2)} ms`;
    document.getElementById('debug-memory')!.textContent = `${debugData.memory.toFixed(1)} MB`;
    
    // Update player info
    document.getElementById('debug-position')!.textContent = 
      `${debugData.position.x.toFixed(1)}, ${debugData.position.y.toFixed(1)}, ${debugData.position.z.toFixed(1)}`;
    document.getElementById('debug-rotation')!.textContent = 
      `${debugData.rotation.x.toFixed(2)}, ${debugData.rotation.y.toFixed(2)}, ${debugData.rotation.z.toFixed(2)}`;
    document.getElementById('debug-velocity')!.textContent = 
      `${debugData.velocity.x.toFixed(1)}, ${debugData.velocity.y.toFixed(1)}, ${debugData.velocity.z.toFixed(1)}`;
    
    // Update scene info
    document.getElementById('debug-draw-calls')!.textContent = debugData.drawCalls.toString();
    document.getElementById('debug-triangles')!.textContent = debugData.triangles.toString();
    document.getElementById('debug-entities')!.textContent = debugData.entities.toString();
    
    // Update physics info
    document.getElementById('debug-physics-bodies')!.textContent = debugData.physicsBodies.toString();
    document.getElementById('debug-physics-contacts')!.textContent = debugData.physicsContacts.toString();
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
        // For Z axis, ensure positive values are shown correctly
        const mapX = 50 + (relX / 100) * 50;
        const mapZ = 50 - (relZ / 100) * 50; // Invert Z axis for display
        
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
