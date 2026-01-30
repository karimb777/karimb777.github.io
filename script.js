// ============================================================================
// GAME CONFIGURATION
// ============================================================================

const CONFIG = {
  INITIAL_LIVES: 3,
  INITIAL_BULLETS: 0,
  MAX_BULLETS: 6,
  AI_MISTAKE_CHANCE: 0.25,
  ATEM_UNLOCK_WINS: 20,
  CHEAT_CODE: "777",
  CHEAT_CODE_LENGTH: 3,
  AUDIO_VOLUME: 0.5
};

const AUDIO_FILES = {
  shoot: "shoot.mp3",
  block: "block.mp3",
  reload: "reload.mp3",
  lose: "lose.mp3",
  win: "win.mp3",
  dryfire: "dryfire.mp3"
};

const CHARACTERS = {
  averageGuy: {
    id: "averageGuy",
    name: "James",
    moves: {
      shoot: "Shoot",
      reload: "Reload",
      block: "Block"
    }
  },
  neo: {
    id: "neo",
    name: "Neo",
    moves: {
      shoot: "Bullet Time",
      reload: "Code Up",
      block: "Matrix Dodge"
    }
  },
  goku: {
    id: "goku",
    name: "Goku",
    moves: {
      shoot: "Kamehameha",
      reload: "Charge Ki",
      block: "Instant Transmission"
    }
  },
  yourPick: {
    id: "yourPick",
    name: "Gem Holder",
    moves: {
      shoot: "Shatter Pulse",
      reload: "Core Charge",
      block: "Null Guard"
    }
  },
  atem: {
    id: "atem",
    name: "Atem",
    moves: {
      shoot: "Dark Magic Attack",
      reload: "Draw Power",
      block: "Defense Mode"
    },
    perk: {
      name: "Heart of the Cards",
      description: "When Atem has 1 life left, a random spell activates: Monster Reborn (+1 life) or Pot of Greed (+2 bullets)."
    }
  }
};

// ============================================================================
// AUDIO MANAGER
// ============================================================================

class AudioManager {
  constructor() {
    this.sounds = {};
    this.enabled = true;
    this._loadAudio();
  }

  _loadAudio() {
    Object.entries(AUDIO_FILES).forEach(([key, filename]) => {
      const audio = new Audio();
      audio.src = filename;
      audio.volume = CONFIG.AUDIO_VOLUME;
      audio.preload = 'auto';
      
      audio.addEventListener('error', () => {
        console.warn(`Failed to load audio: ${filename}`);
      });
      
      this.sounds[key] = audio;
    });
  }

  play(soundName) {
    if (!this.enabled || !this.sounds[soundName]) return;
    
    try {
      const sound = this.sounds[soundName].cloneNode();
      sound.volume = CONFIG.AUDIO_VOLUME;
      sound.play().catch(err => {
        console.warn(`Failed to play sound ${soundName}:`, err);
      });
    } catch (error) {
      console.warn(`Error playing sound ${soundName}:`, error);
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

// ============================================================================
// GAME STATE MANAGER
// ============================================================================

class GameState {
  constructor() {
    this.reset();
    this.currentCharacter = CHARACTERS.averageGuy;
    this.cheatCode = "";
    this.cheatActive = false;
    this.atemPerkUsed = false;
    this.winCount = this._getValidatedScore("wins");
    this.lossCount = this._getValidatedScore("losses");
  }

  reset() {
    this.playerBullets = CONFIG.INITIAL_BULLETS;
    this.aiBullets = CONFIG.INITIAL_BULLETS;
    this.playerLives = CONFIG.INITIAL_LIVES;
    this.aiLives = CONFIG.INITIAL_LIVES;
    this.atemPerkUsed = false;
    this.cheatActive = false;
  }

  _getValidatedScore(key) {
    try {
      const value = Number(localStorage.getItem(key));
      return (isNaN(value) || value < 0) ? 0 : Math.floor(value);
    } catch (error) {
      console.warn(`Failed to read ${key} from localStorage:`, error);
      return 0;
    }
  }

  _saveScore(key, value) {
    try {
      localStorage.setItem(key, Math.floor(value));
    } catch (error) {
      console.warn(`Failed to save ${key} to localStorage:`, error);
    }
  }

  incrementWins() {
    this.winCount++;
    this._saveScore("wins", this.winCount);
  }

  incrementLosses() {
    this.lossCount++;
    this._saveScore("losses", this.lossCount);
  }

  setCharacter(characterKey) {
    // Handle both 'Atem' and 'atem' for backwards compatibility
    const normalizedKey = characterKey === 'Atem' ? 'atem' : characterKey;
    
    if (!CHARACTERS[normalizedKey]) {
      console.error(`Invalid character key: ${characterKey}`);
      return false;
    }
    this.currentCharacter = CHARACTERS[normalizedKey];
    this.atemPerkUsed = false;
    return true;
  }

  addBullets(player, amount) {
    if (player === 'player') {
      this.playerBullets = Math.min(this.playerBullets + amount, CONFIG.MAX_BULLETS);
    } else {
      this.aiBullets = Math.min(this.aiBullets + amount, CONFIG.MAX_BULLETS);
    }
  }

  canShoot(player) {
    return player === 'player' ? this.playerBullets > 0 : this.aiBullets > 0;
  }

  shoot(player) {
    if (player === 'player' && this.playerBullets > 0) {
      this.playerBullets--;
      return true;
    } else if (player === 'ai' && this.aiBullets > 0) {
      this.aiBullets--;
      return true;
    }
    return false;
  }

  damage(target) {
    if (target === 'player') {
      this.playerLives = Math.max(0, this.playerLives - 1);
    } else {
      this.aiLives = Math.max(0, this.aiLives - 1);
    }
  }

  heal(target) {
    if (target === 'player') {
      this.playerLives++;
    }
  }

  isGameOver() {
    if (this.playerLives <= 0 && this.aiLives <= 0) {
      return 'draw';
    } else if (this.playerLives <= 0) {
      return 'loss';
    } else if (this.aiLives <= 0) {
      return 'win';
    }
    return null;
  }

  shouldTriggerAtemPerk() {
    return (
      this.currentCharacter.id === 'atem' &&
      this.currentCharacter.perk &&
      !this.atemPerkUsed &&
      this.playerLives === 1
    );
  }

  activateAtemPerk() {
    this.atemPerkUsed = true;
    const isMonsterReborn = Math.random() < 0.5;
    
    if (isMonsterReborn) {
      this.heal('player');
      return { type: 'heal', message: '✨ Atem activated *Monster Reborn*! +1 life!' };
    } else {
      this.addBullets('player', 2);
      return { type: 'bullets', message: '✨ Atem activated *Pot of Greed*! +2 bullets!' };
    }
  }
}

// ============================================================================
// AI LOGIC
// ============================================================================

class AIPlayer {
  constructor(gameState) {
    this.gameState = gameState;
  }

  getMove() {
    // Randomly make a suboptimal move
    if (Math.random() < CONFIG.AI_MISTAKE_CHANCE) {
      return this._getMistake();
    }
    return this._getOptimalMove();
  }

  _getOptimalMove() {
    const { aiBullets, playerBullets } = this.gameState;

    // If we have bullets and they don't, shoot
    if (aiBullets > 0 && playerBullets === 0) {
      return 'shoot';
    }

    // If we have no bullets, reload
    if (aiBullets === 0) {
      return 'reload';
    }

    // If they have bullets and we have bullets, mix strategy
    if (playerBullets > 0 && aiBullets > 0) {
      // 60% block, 30% reload, 10% shoot (aggressive bluff)
      const rand = Math.random();
      if (rand < 0.6) return 'block';
      if (rand < 0.9) return 'reload';
      return 'shoot';
    }

    // Default: reload
    return 'reload';
  }

  _getMistake() {
    const moves = ['shoot', 'reload', 'block'];
    const optimal = this._getOptimalMove();
    
    // Filter out the optimal move
    const suboptimal = moves.filter(m => m !== optimal);
    
    // Return a random suboptimal move
    return suboptimal[Math.floor(Math.random() * suboptimal.length)];
  }
}

// ============================================================================
// UI MANAGER
// ============================================================================

class UIManager {
  constructor() {
    this.elements = {};
    this._cacheElements();
  }

  _cacheElements() {
    const ids = [
      'gameTitle', 'scoreboard', 'characterSelect', 'game', 'gameOver',
      'status', 'shootBtn', 'reloadBtn', 'blockBtn',
      'playerLives', 'aiLives', 'playerBullets', 'aiBullets',
      'gameOverMessage', 'obliterateBtn', 'atemBtn'
    ];

    ids.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        this.elements[id] = element;
      } else {
        console.warn(`Element with id '${id}' not found`);
      }
    });

    // Alias for backwards compatibility
    this.elements.title = this.elements.gameTitle;
  }

  updateScoreboard(wins, losses, unlockAtem = false) {
    if (this.elements.scoreboard) {
      this.elements.scoreboard.textContent = `Wins: ${wins} | Losses: ${losses}`;
    }
    
    if (unlockAtem && this.elements.atemBtn) {
      this.elements.atemBtn.style.display = 'inline-block';
    }
  }

  updateGameStats(gameState) {
    if (this.elements.playerLives) {
      this.elements.playerLives.textContent = gameState.playerLives;
    }
    if (this.elements.aiLives) {
      this.elements.aiLives.textContent = gameState.aiLives;
    }
    if (this.elements.playerBullets) {
      this.elements.playerBullets.textContent = gameState.playerBullets;
    }
    if (this.elements.aiBullets) {
      this.elements.aiBullets.textContent = gameState.aiBullets;
    }
  }

  updateStatus(message) {
    if (this.elements.status) {
      this.elements.status.textContent = message;
    }
  }

  showCharacterSelect() {
    this._show('characterSelect');
    this._hide('game');
    this._hide('gameOver');
  }

  showGame() {
    this._hide('characterSelect');
    this._show('game');
    this._hide('gameOver');
  }

  showGameOver(message) {
    this._hide('game');
    this._show('gameOver');
    if (this.elements.gameOverMessage) {
      this.elements.gameOverMessage.textContent = message;
    }
  }

  updateMoveButtons(character) {
    if (this.elements.shootBtn) {
      this.elements.shootBtn.textContent = `🔫 ${character.moves.shoot}`;
    }
    if (this.elements.reloadBtn) {
      this.elements.reloadBtn.textContent = `🔄 ${character.moves.reload}`;
    }
    if (this.elements.blockBtn) {
      this.elements.blockBtn.textContent = `🛡️ ${character.moves.block}`;
    }
  }

  disableGameButtons() {
    ['shootBtn', 'reloadBtn', 'blockBtn'].forEach(id => {
      if (this.elements[id]) {
        this.elements[id].disabled = true;
      }
    });
  }

  enableGameButtons() {
    ['shootBtn', 'reloadBtn', 'blockBtn'].forEach(id => {
      if (this.elements[id]) {
        this.elements[id].disabled = false;
      }
    });
  }

  showCheatButton() {
    if (this.elements.obliterateBtn) {
      this.elements.obliterateBtn.style.display = 'inline-block';
    }
    if (this.elements.title) {
      this.elements.title.textContent = '777 Game';
    }
  }

  hideCheatButton() {
    if (this.elements.obliterateBtn) {
      this.elements.obliterateBtn.style.display = 'none';
    }
    if (this.elements.title) {
      this.elements.title.textContent = '007 Game';
    }
  }

  _show(elementId) {
    if (this.elements[elementId]) {
      this.elements[elementId].style.display = 'block';
    }
  }

  _hide(elementId) {
    if (this.elements[elementId]) {
      this.elements[elementId].style.display = 'none';
    }
  }
}

// ============================================================================
// GAME CONTROLLER
// ============================================================================

class GameController {
  constructor() {
    this.gameState = new GameState();
    this.audioManager = new AudioManager();
    this.uiManager = new UIManager();
    this.aiPlayer = new AIPlayer(this.gameState);
    
    this._initialize();
  }

  _initialize() {
    // Ensure we start on character select screen
    this.uiManager.showCharacterSelect();
    
    this.uiManager.updateScoreboard(
      this.gameState.winCount,
      this.gameState.lossCount,
      this.gameState.winCount >= CONFIG.ATEM_UNLOCK_WINS
    );
    this._setupCheatCodeListener();
    this._setupMobileCheatListener();
  }

  _setupMobileCheatListener() {
    // Mobile/touch cheat: tap title 7 times quickly
    let tapCount = 0;
    let tapTimeout = null;
    
    const titleElement = document.getElementById('gameTitle');
    if (!titleElement) return;

    const resetTapCount = () => {
      tapCount = 0;
      if (tapTimeout) clearTimeout(tapTimeout);
    };

    titleElement.addEventListener('click', () => {
      tapCount++;
      
      // Reset counter after 2 seconds of no taps
      if (tapTimeout) clearTimeout(tapTimeout);
      tapTimeout = setTimeout(resetTapCount, 2000);

      // Check if we hit 7 taps
      if (tapCount === 7) {
        this._activateCheat();
        resetTapCount();
      }
    });
  }

  _setupCheatCodeListener() {
    window.addEventListener('keydown', (e) => {
      // Ignore if typing in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      this.gameState.cheatCode += e.key;
      
      // Keep only last 3 characters
      if (this.gameState.cheatCode.length > CONFIG.CHEAT_CODE_LENGTH) {
        this.gameState.cheatCode = this.gameState.cheatCode.slice(-CONFIG.CHEAT_CODE_LENGTH);
      }

      // Check for exact match
      if (this.gameState.cheatCode === CONFIG.CHEAT_CODE) {
        this._activateCheat();
        this.gameState.cheatCode = "";
      }
    });
  }

  _activateCheat() {
    if (this.gameState.cheatActive) return;
    
    this.gameState.cheatActive = true;
    this.uiManager.showCheatButton();
    this.uiManager.updateStatus('Cheat code activated! Obliterate button unlocked.');
    this.audioManager.play('reload');
  }

  selectCharacter(characterKey) {
    console.log(`Selecting character: ${characterKey}`);
    
    if (!this.gameState.setCharacter(characterKey)) {
      console.error(`Failed to set character: ${characterKey}`);
      return;
    }

    console.log(`Character set successfully:`, this.gameState.currentCharacter);
    
    this.uiManager.showGame();
    this.uiManager.updateMoveButtons(this.gameState.currentCharacter);
    this.uiManager.updateStatus(`Agent Selected: ${this.gameState.currentCharacter.name}`);
    this.uiManager.updateGameStats(this.gameState);
  }

  playerMove(move) {
    if (this.gameState.isGameOver()) return;

    // Check for Atem perk BEFORE the turn
    let perkResult = null;
    if (this.gameState.shouldTriggerAtemPerk()) {
      perkResult = this.gameState.activateAtemPerk();
    }

    const aiMove = this.aiPlayer.getMove();
    const results = [];

    // Add perk message if triggered
    if (perkResult) {
      results.push(perkResult.message);
    }

    // Show what moves were made
    results.push(`You: ${this.gameState.currentCharacter.moves[move]} | AI: ${this._formatAIMove(aiMove)}`);

    // Process player move
    this._processMove('player', move, aiMove, results);

    // Process AI move
    this._processMove('ai', aiMove, move, results);

    // Update UI
    this.uiManager.updateStatus(results.join('\n'));
    this.uiManager.updateGameStats(this.gameState);

    // Check for game over
    this._checkGameOver();
  }

  _processMove(actor, move, opponentMove, results) {
    if (move === 'shoot') {
      if (this.gameState.canShoot(actor)) {
        this.gameState.shoot(actor);
        this.audioManager.play('shoot');
        
        if (opponentMove !== 'block') {
          const target = actor === 'player' ? 'ai' : 'player';
          this.gameState.damage(target);
          results.push(actor === 'player' ? '🎯 You hit the AI!' : '💥 AI hit you!');
        } else {
          this.audioManager.play('block');
          results.push(actor === 'player' ? '🛡️ AI blocked your shot!' : '🛡️ You blocked AI\'s shot!');
        }
      } else {
        this.audioManager.play('dryfire');
        results.push(actor === 'player' ? '❌ No bullets to shoot!' : '❌ AI had no bullets!');
      }
    } else if (move === 'reload') {
      const beforeBullets = actor === 'player' ? this.gameState.playerBullets : this.gameState.aiBullets;
      this.gameState.addBullets(actor, 1);
      const afterBullets = actor === 'player' ? this.gameState.playerBullets : this.gameState.aiBullets;
      
      if (beforeBullets === afterBullets) {
        // Hit max bullets
        results.push(actor === 'player' ? `⚠️ Already at max bullets (${CONFIG.MAX_BULLETS})!` : `⚠️ AI already at max bullets!`);
      } else {
        this.audioManager.play('reload');
        results.push(actor === 'player' ? '🔄 Reloaded +1 bullet' : '🔄 AI reloaded +1 bullet');
      }
    } else if (move === 'block') {
      // Block doesn't do anything unless opponent shoots
      if (opponentMove !== 'shoot') {
        results.push(actor === 'player' ? '🛡️ You blocked (nothing happened)' : '🛡️ AI blocked (nothing happened)');
      }
    }
  }

  _formatAIMove(move) {
    const moveNames = {
      shoot: 'Shoot',
      reload: 'Reload',
      block: 'Block'
    };
    return moveNames[move] || move;
  }

  _checkGameOver() {
    const result = this.gameState.isGameOver();
    
    if (result === 'win') {
      this.gameState.aiLives = 0;
      this.audioManager.play('win');
      this.gameState.incrementWins();
      this.uiManager.updateScoreboard(
        this.gameState.winCount,
        this.gameState.lossCount,
        this.gameState.winCount >= CONFIG.ATEM_UNLOCK_WINS
      );
      this.uiManager.showGameOver('🎉 You Won!');
      this.uiManager.disableGameButtons();
    } else if (result === 'loss') {
      this.gameState.playerLives = 0;
      this.audioManager.play('lose');
      this.gameState.incrementLosses();
      this.uiManager.updateScoreboard(
        this.gameState.winCount,
        this.gameState.lossCount
      );
      this.uiManager.showGameOver('💀 You Lost!');
      this.uiManager.disableGameButtons();
    } else if (result === 'draw') {
      this.gameState.playerLives = 0;
      this.gameState.aiLives = 0;
      this.audioManager.play('lose');
      this.gameState.incrementLosses();
      this.uiManager.updateScoreboard(
        this.gameState.winCount,
        this.gameState.lossCount
      );
      this.uiManager.showGameOver('⚔️ Draw! Both Eliminated!');
      this.uiManager.disableGameButtons();
    }
  }

  obliterate() {
    this.gameState.aiLives = 0;
    this.uiManager.updateGameStats(this.gameState);
    this.audioManager.play('win');
    this.gameState.incrementWins();
    this.uiManager.updateScoreboard(
      this.gameState.winCount,
      this.gameState.lossCount,
      this.gameState.winCount >= CONFIG.ATEM_UNLOCK_WINS
    );
    this.uiManager.showGameOver('⚡ Obliterated! You Won!');
    this.uiManager.disableGameButtons();
  }

  restartGame() {
    this.gameState.reset();
    this.uiManager.hideCheatButton();
    this.uiManager.showCharacterSelect();
    this.uiManager.enableGameButtons();
    this.uiManager.updateStatus('Choose your move:');
    this.uiManager.updateGameStats(this.gameState);
  }
}

// ============================================================================
// GLOBAL GAME INSTANCE & EXPOSED FUNCTIONS
// ============================================================================

let game;

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}

function initGame() {
  game = new GameController();
}

// Expose functions to HTML onclick handlers
function selectCharacter(key) {
  if (game) game.selectCharacter(key);
}

function playerMove(move) {
  if (game) game.playerMove(move);
}

function obliterate() {
  if (game) game.obliterate();
}

function restartGame() {
  if (game) game.restartGame();
}
