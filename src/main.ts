import './style.css';
import { Game } from './core/Game';
import { UIManager } from './ui/UIManager';
import { AssetManager } from './core/AssetManager';

// Initialize asset manager
const assetManager = new AssetManager();
// Initialize UI Manager
const uiManager = new UIManager();

const loadingScreen = document.getElementById('loading-screen') as HTMLElement;
const progressBar = document.querySelector('.progress-fill') as HTMLElement;
const loadingText = document.querySelector('.loading-text') as HTMLElement;

// Main async function to handle game initialization
async function initGame() {
  // Create procedural textures instead of loading them
  await createProceduralTextures();

  
  assetManager.registerSounds([
    { name: 'engine', path: '/assets/sounds/engine.mp3' },
    { name: 'shot', path: '/assets/sounds/shot.mp3' },
    { name: 'explosion', path: '/assets/sounds/explosion.mp3' },
    { name: 'reload', path: '/assets/sounds/reload.mp3' },
    { name: 'hit', path: '/assets/sounds/hit.mp3' },
    { name: 'music', path: '/assets/sounds/music.mp3' }
  ]);
  
  // Load all assets with progress tracking
  await assetManager.loadAll((progress) => {
    progressBar.style.width = `${progress * 100}%`;
    loadingText.textContent = `Loading... ${Math.floor(progress * 100)}%`;
  });
  
  // Hide loading screen and show menu
  loadingScreen.classList.add('hidden');
  document.getElementById('menu')?.classList.add('active');
  
  // Create game instance
  const game = new Game({
    canvas: document.getElementById('game-canvas') as HTMLCanvasElement,
    assetManager,
    uiManager
  });
  
  // Handle window resize
  window.addEventListener('resize', () => {
    game.resize();
  });
  
  // Setup menu button event listeners
  document.getElementById('play-button')?.addEventListener('click', () => {
    document.getElementById('menu')?.classList.remove('active');
    document.getElementById('menu')?.classList.add('hidden');
    document.getElementById('game-ui')?.classList.remove('hidden');
    game.start();
  });
  
  document.getElementById('customize-button')?.addEventListener('click', () => {
    document.getElementById('menu')?.classList.remove('active');
    document.getElementById('customize-menu')?.classList.add('active');
  });
  
  document.getElementById('settings-button')?.addEventListener('click', () => {
    document.getElementById('menu')?.classList.remove('active');
    document.getElementById('menu')?.classList.add('hidden');
    document.getElementById('settings-menu')?.classList.add('active');
  });
  
  document.getElementById('leaderboard-button')?.addEventListener('click', () => {
    document.getElementById('menu')?.classList.remove('active');
    document.getElementById('leaderboard-screen')?.classList.add('active');
    // TODO: Fetch leaderboard data
  });
  
  // Back buttons
  document.getElementById('back-from-customize')?.addEventListener('click', () => {
    document.getElementById('customize-menu')?.classList.remove('active');
    document.getElementById('menu')?.classList.add('active');
  });
  
  document.getElementById('back-from-settings')?.addEventListener('click', () => {
    document.getElementById('settings-menu')?.classList.remove('active');
    document.getElementById('menu')?.classList.add('active');
  });
  
  document.getElementById('back-from-leaderboard')?.addEventListener('click', () => {
    document.getElementById('leaderboard-screen')?.classList.remove('active');
    document.getElementById('menu')?.classList.add('active');
  });
  
  // Game over buttons
  document.getElementById('respawn-button')?.addEventListener('click', () => {
    document.getElementById('game-over')?.classList.remove('active');
    game.respawnPlayer();
  });
  
  document.getElementById('main-menu-button')?.addEventListener('click', () => {
    document.getElementById('game-over')?.classList.remove('active');
    document.getElementById('game-ui')?.classList.add('hidden');
    document.getElementById('menu')?.classList.add('active');
    game.stop();
  });
}

// Create procedural textures instead of loading them
function createProceduralTextures() {
  // Create grass texture
  assetManager.createProceduralTexture('grass', 'grass');
  
  // Create sand texture
  assetManager.createProceduralTexture('sand', 'sand');
  
  // Create dirt texture
  assetManager.createProceduralTexture('dirt', 'dirt');
  
  // Create metal texture
  assetManager.createProceduralTexture('metal', 'metal');
  
  // Create rock texture
  assetManager.createProceduralTexture('rock', 'rock');
  
  console.log('Procedural textures created successfully');
  return Promise.resolve();
}

// Start the game initialization
initGame().catch(error => {
  console.error('Failed to initialize game:', error);
  loadingText.textContent = 'Failed to load game. Please refresh the page.';
});
