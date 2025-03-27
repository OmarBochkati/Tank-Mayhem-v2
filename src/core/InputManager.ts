import { EventEmitter } from '../utils/EventEmitter';

interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  turretX: number;
  turretY: number;
  fire: boolean;
  reload: boolean;
  toggleCamera: boolean;
  toggleChat: boolean;
}

interface InputSettings {
  invertMouseX: boolean;
  invertMouseY: boolean;
}

export class InputManager extends EventEmitter {
  private canvas: HTMLCanvasElement;
  private inputState: InputState;
  private isPointerLocked: boolean = false;
  private settings: InputSettings = {
    invertMouseX: false,
    invertMouseY: false
  };
  
  constructor(canvas: HTMLCanvasElement) {
    super();
    
    this.canvas = canvas;
    this.inputState = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      turretX: 0,
      turretY: 0,
      fire: false,
      reload: false,
      toggleCamera: false,
      toggleChat: false
    };
    
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Mouse events
    this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
    document.addEventListener('pointerlockchange', this.handlePointerLockChange.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // Touch events for mobile
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }
  
  private handleKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.inputState.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.inputState.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.inputState.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.inputState.right = true;
        break;
      case 'KeyR':
        this.inputState.reload = true;
        this.emit('reload');
        break;
      case 'KeyC':
        this.inputState.toggleCamera = true;
        this.emit('toggleCamera');
        break;
      case 'KeyT':
        this.inputState.toggleChat = true;
        this.emit('toggleChat');
        break;
      case 'Escape':
        if (this.isPointerLocked) {
          document.exitPointerLock();
        }
        break;
    }
  }
  
  private handleKeyUp(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.inputState.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.inputState.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.inputState.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.inputState.right = false;
        break;
      case 'KeyR':
        this.inputState.reload = false;
        break;
      case 'KeyC':
        this.inputState.toggleCamera = false;
        break;
      case 'KeyT':
        this.inputState.toggleChat = false;
        break;
    }
  }
  
  private handleCanvasClick(event: MouseEvent): void {
    if (!this.isPointerLocked) {
      this.canvas.requestPointerLock();
    }
  }
  
  private handlePointerLockChange(): void {
    this.isPointerLocked = document.pointerLockElement === this.canvas;
  }
  
  private handleMouseMove(event: MouseEvent): void {
    if (this.isPointerLocked) {
      // Apply mouse movement with inversion settings
      const movementX = this.settings.invertMouseX ? -event.movementX : event.movementX;
      const movementY = this.settings.invertMouseY ? -event.movementY : event.movementY;
      
      // Update turret rotation based on mouse movement
      this.inputState.turretX += movementX * 0.002;
      this.inputState.turretY += movementY * 0.002;
      
      // Clamp vertical rotation to prevent flipping
      this.inputState.turretY = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, this.inputState.turretY));
    }
  }
  
  private handleMouseDown(event: MouseEvent): void {
    if (this.isPointerLocked && event.button === 0) {
      this.inputState.fire = true;
      this.emit('fire');
    }
  }
  
  private handleMouseUp(event: MouseEvent): void {
    if (event.button === 0) {
      this.inputState.fire = false;
    }
  }
  
  // Basic touch controls for mobile
  private touchControls = {
    moveTouch: null as Touch | null,
    aimTouch: null as Touch | null,
    lastMovePosition: { x: 0, y: 0 },
    lastAimPosition: { x: 0, y: 0 }
  };
  
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    
    const touches = event.changedTouches;
    
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      const x = touch.clientX;
      const y = touch.clientY;
      
      // Left side of screen for movement
      if (x < window.innerWidth / 2) {
        this.touchControls.moveTouch = touch;
        this.touchControls.lastMovePosition = { x, y };
      } 
      // Right side of screen for aiming and firing
      else {
        this.touchControls.aimTouch = touch;
        this.touchControls.lastAimPosition = { x, y };
        
        // Double tap to fire
        const now = Date.now();
        if (now - this.lastTapTime < 300) {
          this.inputState.fire = true;
          this.emit('fire');
          setTimeout(() => {
            this.inputState.fire = false;
          }, 100);
        }
        this.lastTapTime = now;
      }
    }
  }
  
  private lastTapTime: number = 0;
  
  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    
    const touches = event.changedTouches;
    
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      
      // Movement touch
      if (this.touchControls.moveTouch && touch.identifier === this.touchControls.moveTouch.identifier) {
        const x = touch.clientX;
        const y = touch.clientY;
        
        const deltaX = x - this.touchControls.lastMovePosition.x;
        const deltaY = y - this.touchControls.lastMovePosition.y;
        
        // Update movement state based on touch movement
        this.inputState.forward = deltaY < -20;
        this.inputState.backward = deltaY > 20;
        this.inputState.left = deltaX < -20;
        this.inputState.right = deltaX > 20;
        
        this.touchControls.lastMovePosition = { x, y };
      }
      
      // Aiming touch
      if (this.touchControls.aimTouch && touch.identifier === this.touchControls.aimTouch.identifier) {
        const x = touch.clientX;
        const y = touch.clientY;
        
        const deltaX = x - this.touchControls.lastAimPosition.x;
        const deltaY = y - this.touchControls.lastAimPosition.y;
        
        // Apply touch movement with inversion settings
        const adjustedDeltaX = this.settings.invertMouseX ? -deltaX : deltaX;
        const adjustedDeltaY = this.settings.invertMouseY ? -deltaY : deltaY;
        
        // Update turret rotation based on touch movement
        this.inputState.turretX += adjustedDeltaX * 0.01;
        this.inputState.turretY += adjustedDeltaY * 0.01;
        
        // Clamp vertical rotation to prevent flipping
        this.inputState.turretY = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, this.inputState.turretY));
        
        this.touchControls.lastAimPosition = { x, y };
      }
    }
  }
  
  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    
    const touches = event.changedTouches;
    
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      
      // Movement touch ended
      if (this.touchControls.moveTouch && touch.identifier === this.touchControls.moveTouch.identifier) {
        this.touchControls.moveTouch = null;
        this.inputState.forward = false;
        this.inputState.backward = false;
        this.inputState.left = false;
        this.inputState.right = false;
      }
      
      // Aiming touch ended
      if (this.touchControls.aimTouch && touch.identifier === this.touchControls.aimTouch.identifier) {
        this.touchControls.aimTouch = null;
      }
    }
  }
  
  public getInput(): InputState {
    return { ...this.inputState };
  }
  
  public resetInput(): void {
    this.inputState = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      turretX: this.inputState.turretX,
      turretY: this.inputState.turretY,
      fire: false,
      reload: false,
      toggleCamera: false,
      toggleChat: false
    };
  }
  
  /**
   * Get the current input settings
   */
  public getSettings(): InputSettings {
    return { ...this.settings };
  }
  
  /**
   * Update input settings
   * @param settings New settings to apply
   */
  public updateSettings(settings: Partial<InputSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.emit('settingsChanged', this.getSettings());
  }
  
  /**
   * Toggle mouse X-axis inversion
   */
  public toggleInvertMouseX(): void {
    this.settings.invertMouseX = !this.settings.invertMouseX;
    this.emit('settingsChanged', this.getSettings());
  }
  
  /**
   * Toggle mouse Y-axis inversion
   */
  public toggleInvertMouseY(): void {
    this.settings.invertMouseY = !this.settings.invertMouseY;
    this.emit('settingsChanged', this.getSettings());
  }
}
