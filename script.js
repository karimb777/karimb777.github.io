const shootSound = new Audio("shoot.mp3")
const blockSound = new Audio("block.mp3")
const reloadSound = new Audio("reload.mp3")
const loseSound = new Audio("lose.mp3")
const winsound = new Audio("win.mp3")
let playerBullets = 0;  // bullets player currently has
let aiBullets = 0;      // bullets AI currently has

let playerLives = 3;    // player starts with 3 lives
let aiLives = 3;        // AI starts with 3 lives


function playerMove(move) {
  // Make the AI pick randomly
  const choices = ["shoot", "reload", "block"];
  const aiMove = choices[Math.floor(Math.random() * choices.length)];

  let resultText = `You picked: ${move} | AI picked: ${aiMove}\n`;

  // Apply game rules

  // Player Shoots
  if (move === "shoot") {
    if (playerBullets > 0) {
      shootSound.play();
      playerBullets--;
      if (aiMove !== "block") {
        aiLives--;
        console.log("AI lives:", aiLives);

        resultText += "You hit the AI!\n";
      } else {
        resultText += "AI blocked your shot!\n";
      }
    } else {
      resultText += "You tried to shoot but had no bullets!\n";
    }
  }

  // Player Reloads
  if (move === "reload") {
    reloadSound.play()
    playerBullets++;
    resultText += "You reloaded a bullet.\n";
  }

  // Player Blocks — nothing else to do
  if (move === "block") {
    resultText += "You blocked.\n";
  }

  // AI Shoots
  if (aiMove === "shoot") {
    if (aiBullets > 0) {
      aiBullets--;
      if (move !== "block") {
        playerLives--;
        console.log("Player lives:", playerLives);

        resultText += "AI hit you!\n";
      } else {
        blockSound.play()
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

  // AI Blocks — already handled above

  // Update the status text on the screen
  document.getElementById("status").textContent = resultText;

  // Update bullets and lives on screen
  document.getElementById("playerBullets").textContent = playerBullets;
  document.getElementById("aiBullets").textContent = aiBullets;
  document.getElementById("playerLives").textContent = playerLives;
  document.getElementById("aiLives").textContent = aiLives;

  // Check for win/loss
  console.log("Checking lives: Player =", playerLives, "AI =", aiLives);

if (playerLives <= 0 && aiLives > 0) {
  playerLives = 0;
  showGameOver("You Lost!");
  loseSound.play()
} else if (aiLives <= 0 && playerLives > 0) {
  aiLives = 0;
  showGameOver("You Won!");
  winsound.play()
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
  // Reset game state
  playerBullets = 0;
  aiBullets = 0;
  playerLives = 3;
  aiLives = 3;

  // Reset text
  document.getElementById("status").textContent = "Choose your move:";
  document.getElementById("playerLives").textContent = playerLives;
  document.getElementById("aiLives").textContent = aiLives;
  document.getElementById("playerBullets").textContent = playerBullets;
  document.getElementById("aiBullets").textContent = aiBullets;

  // Show main game, hide game over screen, bring back the extra text
  document.getElementById("game").style.display = "block";
  document.getElementById("gameOver").style.display = "none";
  document.getElementById("extraStuff").style.display = "block";

  // Enable buttons
  document.getElementById("shootBtn").disabled = false;
  document.getElementById("reloadBtn").disabled = false;
  document.getElementById("blockBtn").disabled = false;
}
