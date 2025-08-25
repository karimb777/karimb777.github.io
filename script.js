const characters = {
  averageGuy: {
    name: "James",
    moves: {
      shoot: "Shoot",
      reload: "Reload",
      block: "Block"
    }
  },
  neo: {
    name: "Neo",
    moves: {
      shoot: "Bullet Time",
      reload: "Code Up",
      block: "Matrix Dodge"
    }
  },
  goku: {
    name: "Goku",
    moves: {
      shoot: "Kamehameha",
      reload: "Charge ki",
      block: "Instant Transmission"
    }
  },
  yourPick: {
    name: "Gem holder",
    moves: {
      shoot: "Shatter Pulse",
      reload: "Core Charge",
      block: "Null Guard"
    }
  },
  Atem: {
    name: "Atem",
    moves: {
      shoot: "Dark Magic Attack",
      reload: "Draw Power",
      block: "Defence mode"
    },
    perk: {
      name: "Heart of the Cards",
      used: false,
      description: "When Atem has 1 life left, a random spell activates: Monster Reborn (heal 1) or Pot of Greed (get 2 bullets)."
    }
  }
};

let currentCharacter = characters.averageGuy;
let winCount = Number(localStorage.getItem("wins")) || 0;
let lossCount = Number(localStorage.getItem("losses")) || 0;

let playerBullets = 0;
let aiBullets = 0;
let playerLives = 3;
let aiLives = 3;

let cheatCode = "";

// 🎵 Sound effects
const shootSound = new Audio("shoot.mp3");
const blockSound = new Audio("block.mp3");
const reloadSound = new Audio("reload.mp3");
const loseSound = new Audio("lose.mp3");
const winsound = new Audio("win.mp3");
const dryfireSound = new Audio("dryfire.mp3");

function updateScoreboard() {
  document.getElementById("scoreboard").textContent = `Wins: ${winCount} | Losses: ${lossCount}`;
  if (winCount >= 20) {
    const atemBtn = document.getElementById("atemBtn");
    if (atemBtn) atemBtn.style.display = "inline-block";
  }
}

function getSmartAiMove() {
  const moves = ["shoot", "reload", "block"];
  const mistakeChance = 0.2;

  if (Math.random() < mistakeChance) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  if (aiBullets > 0 && playerBullets === 0) return "shoot";
  if (aiBullets === 0) return "reload";
  if (playerBullets > 0) return "block";
  return "reload";
}

function playerMove(move) {
  const aiMove = getSmartAiMove();
  let resultText = `You used: ${currentCharacter.moves[move]} | AI picked: ${aiMove}\n`;

  // 🃏 Atem perk
  if (
    currentCharacter.name === "Atem" &&
    !currentCharacter.perk.used &&
    playerLives === 1
  ) {
    currentCharacter.perk.used = true;
    const rng = Math.random();
    if (rng < 0.5) {
      playerBullets += 2;
      resultText += "\n✨ Atem activated *Pot of Greed*! +2 bullets!";
    } else {
      playerLives += 1;
      resultText += "\n✨ Atem activated *Monster Reborn*! +1 life!";
    }
  }

  if (move === "shoot") {
    if (playerBullets > 0) {
      shootSound.play();
      playerBullets--;
      if (aiMove !== "block") {
        aiLives--;
        resultText += "You hit the AI!\n";
      } else {
        resultText += "AI blocked your shot!\n";
      }
    } else {
      dryfireSound.play();
      resultText += "You tried to shoot but had no bullets!\n";
    }
  }

  if (move === "reload") {
    reloadSound.play();
    playerBullets++;
    resultText += "You reloaded a bullet.\n";
  }

  if (move === "block") {
    resultText += "You blocked.\n";
  }

  if (aiMove === "shoot") {
    if (aiBullets > 0) {
      aiBullets--;
      if (move !== "block") {
        playerLives--;
        resultText += "AI hit you!\n";
      } else {
        blockSound.play();
        resultText += "You blocked the AI's shot!\n";
      }
    } else {
      resultText += "AI tried to shoot but had no bullets!\n";
    }
  }

  if (aiMove === "reload") {
    aiBullets++;
    resultText += "AI reloaded a bullet.\n";
  }

  document.getElementById("status").textContent = resultText;
  document.getElementById("playerBullets").textContent = playerBullets;
  document.getElementById("aiBullets").textContent = aiBullets;
  document.getElementById("playerLives").textContent = playerLives;
  document.getElementById("aiLives").textContent = aiLives;

  if (playerLives <= 0 && aiLives > 0) {
    playerLives = 0;
    loseSound.play();
    lossCount++;
    localStorage.setItem("losses", lossCount);
    showGameOver("You Lost!");
    disableButtons();
    updateScoreboard();
  } else if (aiLives <= 0 && playerLives > 0) {
    aiLives = 0;
    winsound.play();
    winCount++;
    localStorage.setItem("wins", winCount);
    showGameOver("You Won!");
    disableButtons();
    updateScoreboard();
  }
}

function disableButtons() {
  ["shootBtn", "reloadBtn", "blockBtn", "extraStuff"].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = true;
  });
}

function showGameOver(message) {
  document.getElementById("game").style.display = "none";
  document.getElementById("gameOver").style.display = "block";
  document.getElementById("gameOverMessage").textContent = message;
  document.getElementById("extraStuff").style.display = "none";
}

function restartGame() {
  playerBullets = 0;
  aiBullets = 0;
  playerLives = 3;
  aiLives = 3;

  if (currentCharacter.perk) {
    currentCharacter.perk.used = false;
  }

  document.getElementById("status").textContent = "Choose your move:";
  document.getElementById("playerLives").textContent = playerLives;
  document.getElementById("aiLives").textContent = aiLives;
  document.getElementById("playerBullets").textContent = playerBullets;
  document.getElementById("aiBullets").textContent = aiBullets;

  document.getElementById("game").style.display = "block";
  document.getElementById("gameOver").style.display = "none";
  document.getElementById("extraStuff").style.display = "block";

  ["shootBtn", "reloadBtn", "blockBtn"].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = false;
  });

  document.getElementById("obliterateBtn").style.display = "none";
  document.querySelector("h1").textContent = "007 Game";
  cheatCode = "";
}

function selectCharacter(key) {
  currentCharacter = characters[key];
  document.getElementById("characterSelect").style.display = "none";
  document.getElementById("game").style.display = "block";
  document.getElementById("status").textContent = `Agent Selected: ${currentCharacter.name}`;

  document.getElementById("shootBtn").textContent = "🔫 " + currentCharacter.moves.shoot;
  document.getElementById("reloadBtn").textContent = "🔄 " + currentCharacter.moves.reload;
  document.getElementById("blockBtn").textContent = "🛡️ " + currentCharacter.moves.block;
}

// Cheat Code: "777"
window.addEventListener("keydown", function (e) {
  cheatCode += e.key;
  if (cheatCode.length > 3) cheatCode = cheatCode.slice(-3);
  if (cheatCode === "777") {
    activateCheat();
    cheatCode = "";
  }
});

function activateCheat() {
  document.querySelector("h1").textContent = "777 Game";
  document.getElementById("obliterateBtn").style.display = "inline-block";
  document.getElementById("status").textContent = "Cheat code activated! Obliterate button unlocked.";
}

function obliterate() {
  aiLives = 0;
  document.getElementById("aiLives").textContent = aiLives;
  showGameOver("You Used Obliterate! You Won!");
  winsound.play();
  disableButtons();
  winCount++;
  localStorage.setItem("wins", winCount);
  updateScoreboard();
}

updateScoreboard();
