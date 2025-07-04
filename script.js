let cheatCode = "";
window.addEventListener("keydown", function(e) {
  cheatCode += e.key;
  if (cheatCode.length > 3) {
    cheatCode = cheatCode.slice(-3); // keep last 3 keys only
  }
  if (cheatCode === "777") {
    activateCheat();
    cheatCode = ""; // reset after activation
  }
});
function activateCheat() {
  // Change header text
  document.querySelector("h1").textContent = "777 Game";

  // Show the obliterate button
  document.getElementById("obliterateBtn").style.display = "inline-block";

  // Optional: Show a cheat activated message
  document.getElementById("status").textContent = "Cheat code activated! Obliterate button unlocked.";
}

function obliterate() {
  aiLives = 0;
  // Update UI immediately
  document.getElementById("aiLives").textContent = aiLives;

  // Trigger win sequence (reuse your existing code)
  showGameOver("You Used Obliterate! You Won!");
  winsound.play();
  disableButtons();
  winCount++;
  localStorage.setItem("wins", winCount);
  updateScoreboard();
}


let winCount = Number(localStorage.getItem("wins")) || 0;
let lossCount = Number(localStorage.getItem("losses")) || 0;
function updateScoreboard() {
  document.getElementById("scoreboard").textContent = `Wins: ${winCount} | Losses: ${lossCount}`;
}
updateScoreboard();

const shootSound = new Audio("shoot.mp3")
const blockSound = new Audio("block.mp3")
const reloadSound = new Audio("reload.mp3")
const loseSound = new Audio("lose.mp3")
const winsound = new Audio("win.mp3")
const dryfireSound = new Audio("dryfire.mp3")

let playerBullets = 0;  // bullets player currently has
let aiBullets = 0;      // bullets AI currently has

let playerLives = 3;    // player starts with 3 lives
let aiLives = 3;        // AI starts with 3 lives

function getSmartAiMove() {
  const moves = ["shoot", "reload", "block"];

  const mistakeChance = 0.2; // 20% chance to mess up
  if (Math.random() < mistakeChance) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  if (aiBullets > 0 && playerBullets === 0) {
    return "shoot";
  }

  if (aiBullets === 0) {
    return "reload";
  }

  if (playerBullets > 0) {
    return "block";
  }

  if (aiBullets > 0) {
    return "shoot";
  }

  return "reload"; // fallback
}

function updateScoreboard() {
  document.getElementById("scoreboard").textContent = `Wins: ${winCount} | Losses: ${lossCount}`;
}
updateScoreboard();

function playerMove(move) {
  const aiMove = getSmartAiMove();

  let resultText = `You picked: ${move} | AI picked: ${aiMove}\n`;

  // Player Shoots
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

  // Player Reloads
  if (move === "reload") {
    reloadSound.play();
    playerBullets++;
    resultText += "You reloaded a bullet.\n";
  }

  // Player Blocks
  if (move === "block") {
    resultText += "You blocked.\n";
  }

  // AI Shoots
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

  // AI Reloads
  if (aiMove === "reload") {
    aiBullets++;
    resultText += "AI reloaded a bullet.\n";
  }

  // Update the status text on the screen
  document.getElementById("status").textContent = resultText;

  // Update bullets and lives on screen
  document.getElementById("playerBullets").textContent = playerBullets;
  document.getElementById("aiBullets").textContent = aiBullets;
  document.getElementById("playerLives").textContent = playerLives;
  document.getElementById("aiLives").textContent = aiLives;

  // Check for win/loss and update counters
  if (playerLives <= 0 && aiLives > 0) {
    playerLives = 0;
    loseSound.play()
    lossCount++;
    localStorage.setItem("losses", lossCount);
    showGameOver("You Lost!");
    loseSound.play();
    disableButtons();
    updateScoreboard();
    return;
  } else if (aiLives <= 0 && playerLives > 0) {
    aiLives = 0;
    winsound.play()
    winCount++;
    localStorage.setItem("wins", winCount);
    showGameOver("You Won!");
    winsound.play();
    disableButtons();
    updateScoreboard();
    return;
  }
}

function disableButtons() {
  document.getElementById("shootBtn").disabled = true;
  document.getElementById("reloadBtn").disabled = true;
  document.getElementById("blockBtn").disabled = true;
  document.getElementById("extraStuff").disabled = true;
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

  document.getElementById("status").textContent = "Choose your move:";
  document.getElementById("playerLives").textContent = playerLives;
  document.getElementById("aiLives").textContent = aiLives;
  document.getElementById("playerBullets").textContent = playerBullets;
  document.getElementById("aiBullets").textContent = aiBullets;

  document.getElementById("game").style.display = "block";
  document.getElementById("gameOver").style.display = "none";
  document.getElementById("extraStuff").style.display = "block";

  document.getElementById("shootBtn").disabled = false;
  document.getElementById("reloadBtn").disabled = false;
  document.getElementById("blockBtn").disabled = false;

  // **Hide the obliterate button when restarting**
  document.getElementById("obliterateBtn").style.display = "none";

  // **Reset the header text back to 007 Game**
  document.querySelector("h1").textContent = "007 Game";

  // Reset the cheatCode tracker in case of partial input leftover
  cheatCode = "";
}

