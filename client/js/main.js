// Initialize socket connection
const socket = io();

// Game state variables
let playerId = null;
let isHost = false;
let players = {};
let gameRunning = false;
let gamePaused = false;
let collectibles = [];

// DOM elements
const joinScreen = document.getElementById("join-screen");
const gameScreen = document.getElementById("game-screen");
const gameOverScreen = document.getElementById("game-over");
const gameMenu = document.getElementById("game-menu");
const notification = document.getElementById("notification");

// Join screen elements
const playerNameInput = document.getElementById("player-name");
const joinButton = document.getElementById("join-button");
const joinError = document.getElementById("join-error");
const lobbyPlayersList = document.getElementById("lobby-players");
const hostControls = document.getElementById("host-controls");
const startButton = document.getElementById("start-button");

// Game screen elements
const gameArea = document.getElementById("game-area");
const timeValue = document.getElementById("time-value");
const scoreList = document.getElementById("score-list");
const menuButton = document.getElementById("menu-button");

// Menu elements
const resumeButton = document.getElementById("resume-button");
const pauseButton = document.getElementById("pause-button");
const quitButton = document.getElementById("quit-button");

// Game over elements
const winnerDisplay = document.getElementById("winner-display");
const finalScoreList = document.getElementById("final-score-list");
const returnLobbyButton = document.getElementById("return-lobby");

// Initialize audio
initAudio();

// Event listeners
joinButton.addEventListener("click", joinGame);
startButton.addEventListener("click", startGame);
menuButton.addEventListener("click", toggleMenu);
resumeButton.addEventListener("click", resumeGame);
pauseButton.addEventListener("click", pauseGame);
quitButton.addEventListener("click", quitGame);
returnLobbyButton.addEventListener("click", returnToLobby);

// Socket event listeners
socket.on("joinResponse", handleJoinResponse);
socket.on("playerJoined", handlePlayerJoined);
socket.on("playerLeft", handlePlayerLeft);
socket.on("hostAssigned", handleHostAssigned);
socket.on("gameStarted", handleGameStarted);
socket.on("playerMoved", handlePlayerMoved);
socket.on("scoreUpdated", handleScoreUpdated);
socket.on("timerUpdate", handleTimerUpdate);
socket.on("itemCollected", handleItemCollected);
socket.on("newItem", handleNewItem);
socket.on("gamePaused", handleGamePaused);
socket.on("gameResumed", handleGameResumed);
socket.on("gameQuit", handleGameQuit);
socket.on("gameOver", handleGameOver);

// Join the game
function joinGame() {
  const playerName = playerNameInput.value.trim();

  if (playerName.length < 2) {
    joinError.textContent = "Name must be at least 2 characters";
    return;
  }

  socket.emit("join", playerName);
}

// Handle join response from server
function handleJoinResponse(data) {
  if (data.success) {
    playerId = data.playerId;
    isHost = data.isHost;
    players = data.players;

    // Update UI based on host status
    if (isHost) {
      hostControls.classList.remove("hidden");
    } else {
      hostControls.classList.add("hidden");
    }

    // Clear any previous error
    joinError.textContent = "";

    // Update the lobby players list
    updateLobbyPlayers();

    // Play join sound
    playSound("join");
  } else {
    joinError.textContent = data.message;
  }
}

// Handle new player joined
function handlePlayerJoined(data) {
  players = data.players;
  updateLobbyPlayers();

  // Show notification if we're already in the game
  if (gameRunning) {
    showNotification(`${data.newPlayer.name} joined the game`);
  }

  // Play join sound
  playSound("join");
}

// Handle player left
function handlePlayerLeft(data) {
  players = data.players;

  // Update lobby if we're in the lobby
  if (!gameRunning) {
    updateLobbyPlayers();
  } else {
    // Remove player element from game area
    const playerElement = document.getElementById(`player-${data.id}`);
    if (playerElement) {
      playerElement.remove();
    }

    // Update scores
    updateScores();

    // Show notification
    const playerName = playerElement
      ? playerElement.getAttribute("data-name")
      : "A player";
    showNotification(`${playerName} left the game`);
  }
}

// Update the lobby players list
function updateLobbyPlayers() {
  lobbyPlayersList.innerHTML = "";

  Object.values(players).forEach((player) => {
    const li = document.createElement("li");
    li.textContent = player.name + (player.isHost ? " (Host)" : "");
    lobbyPlayersList.appendChild(li);
  });
}

// Handle host assigned
function handleHostAssigned(data) {
  isHost = data.isHost;

  if (isHost) {
    hostControls.classList.remove("hidden");
    showNotification("You are now the host");
  }
}

// Start the game (host only)
function startGame() {
  if (isHost) {
    socket.emit("startGame");
  }
}

// Handle game started
function handleGameStarted(data) {
  gameRunning = true;
  gamePaused = false;

  // Hide join screen, show game screen
  joinScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  // Initialize game state
  Game.init(gameArea, playerId, players, socket);

  // Add collectibles
  collectibles = data.collectibles;
  collectibles.forEach((item) => {
    Collectible.create(item);
  });

  // Update scores
  updateScores();

  // Start game loop
  Game.start();

  // Play game start sound
  playSound("gameStart");

  // Show notification
  showNotification("Game Started!");
}

// Handle player moved
function handlePlayerMoved(data) {
  if (players[data.id]) {
    players[data.id].position = data.position;
    Player.updatePosition(data.id, data.position);
  }
}

// Handle score updated
function handleScoreUpdated(data) {
  if (players[data.id]) {
    players[data.id].score = data.score;
  }

  updateScores();
}

// Update scores display
function updateScores() {
  scoreList.innerHTML = "";

  // Sort players by score
  const sortedPlayers = Object.values(players).sort(
    (a, b) => b.score - a.score
  );

  sortedPlayers.forEach((player) => {
    const li = document.createElement("li");
    li.textContent = `${player.name}: ${player.score}`;

    // Highlight current player
    if (player.id === playerId) {
      li.style.fontWeight = "bold";
    }

    scoreList.appendChild(li);
  });
}

// Handle timer update
function handleTimerUpdate(data) {
  timeValue.textContent = data.timeRemaining;
}

// Handle item collected
function handleItemCollected(data) {
  // Remove the collected item
  Collectible.remove(data.itemId);

  // Play collect sound
  playSound("collect");

  // If current player collected it, update score locally
  if (data.playerId === playerId) {
    // Visual feedback for player
    Player.showCollectEffect();
  }
}

// Handle server removing old collectibles (for performance)
socket.on("itemRemoved", (itemId) => {
  Collectible.remove(itemId);
});

// Handle new item
function handleNewItem(item) {
  collectibles.push(item);
  Collectible.create(item);
}

// Toggle game menu
function toggleMenu() {
  gameMenu.classList.toggle("hidden");
}

// Pause game
function pauseGame() {
  if (gameRunning && !gamePaused) {
    socket.emit("pauseGame");
    gameMenu.classList.add("hidden");
  }
}

// Handle game paused
function handleGamePaused(data) {
  gamePaused = true;
  Game.pause();
  showNotification(`Game paused by ${data.pausedBy}`);
  playSound("pause");
}

// Resume game
function resumeGame() {
  if (gameRunning && gamePaused) {
    socket.emit("resumeGame");
    gameMenu.classList.add("hidden");
  }
}

// Handle game resumed
function handleGameResumed(data) {
  gamePaused = false;
  Game.resume();
  showNotification(`Game resumed by ${data.resumedBy}`);
  playSound("resume");
}

// Quit game
function quitGame() {
  socket.emit("quitGame");
  gameMenu.classList.add("hidden");
}

// Handle game quit
function handleGameQuit(data) {
  showNotification(`Game quit by ${data.quitBy}`);
  resetGameState();
  playSound("gameOver");
}

// Handle game over
function handleGameOver(data) {
  gameRunning = false;
  Game.stop();

  // Show game over screen
  gameScreen.classList.add("hidden");
  gameOverScreen.classList.remove("hidden");

  // Display winner
  winnerDisplay.textContent = `Winner: ${data.winner}`;

  // Display final scores
  finalScoreList.innerHTML = "";

  // Get player names from our local players object
  const playerNames = {};
  Object.values(players).forEach((player) => {
    playerNames[player.id] = player.name;
  });

  // Sort scores and display
  const sortedScores = Object.entries(data.scores).sort((a, b) => b[1] - a[1]);

  sortedScores.forEach(([id, score]) => {
    const li = document.createElement("li");
    const name = playerNames[id] || "Unknown Player";
    li.textContent = `${name}: ${score}`;

    // Highlight winner
    if (name === data.winner) {
      li.style.color = "gold";
      li.style.fontWeight = "bold";
    }

    // Highlight current player
    if (id === playerId) {
      li.style.textDecoration = "underline";
    }

    finalScoreList.appendChild(li);
  });

  // Play game over sound
  playSound("gameOver");
}

// Return to lobby
function returnToLobby() {
  gameOverScreen.classList.add("hidden");
  joinScreen.classList.remove("hidden");

  // Clear game area
  gameArea.innerHTML = "";

  // Update lobby players
  updateLobbyPlayers();
}

// Reset game state
function resetGameState() {
  gameRunning = false;
  gamePaused = false;

  // Hide game screen, show join screen
  gameScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  joinScreen.classList.remove("hidden");

  // Clear game area
  gameArea.innerHTML = "";

  // Update lobby players
  updateLobbyPlayers();
}

// Show notification
function showNotification(message) {
  notification.textContent = message;
  notification.classList.remove("hidden");

  // Hide notification after 3 seconds
  setTimeout(() => {
    notification.classList.add("hidden");
  }, 3000);
}
