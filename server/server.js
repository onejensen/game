const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// Game state
let players = {};
let collectibles = [];
let gameState = {
  isRunning: false,
  isPaused: false,
  startTime: null,
  pauseTime: null,
  duration: 120, // Game duration in seconds
  timeRemaining: 120,
  scores: {},
  maxCollectibles: 10, // Maximum number of collectibles allowed at once
  minCollectibles: 3, // Minimum number of collectibles to maintain
  collectibleLifetime: 30000, // Maximum lifetime of a collectible in ms (30 seconds)
};

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, "../client")));

// Initialize Socket.io server
const io = new Server(server);

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Handle player joining
  socket.on("join", (playerName) => {
    // Check if name is already taken
    const nameExists = Object.values(players).some(
      (player) => player.name === playerName
    );

    if (nameExists) {
      socket.emit("joinResponse", {
        success: false,
        message: "Name already taken",
      });
      return;
    }

    // Add player to the game
    players[socket.id] = {
      id: socket.id,
      name: playerName,
      position: {
        x: Math.floor(Math.random() * 800),
        y: Math.floor(Math.random() * 500),
      },
      color: getRandomColor(),
      score: 0,
      isHost: Object.keys(players).length === 0, // First player is the host
    };

    // Initialize score for this player
    gameState.scores[socket.id] = 0;

    // Send success response to the player
    socket.emit("joinResponse", {
      success: true,
      playerId: socket.id,
      isHost: players[socket.id].isHost,
      players: players,
    });

    // Broadcast to all players that a new player has joined
    io.emit("playerJoined", {
      players: players,
      newPlayer: players[socket.id],
    });
  });

  // Handle player movement
  socket.on("playerMove", (data) => {
    if (players[socket.id] && gameState.isRunning && !gameState.isPaused) {
      players[socket.id].position = data.position;
      // Broadcast the player's new position to all other players
      socket.broadcast.emit("playerMoved", {
        id: socket.id,
        position: data.position,
      });
    }
  });

  // Handle game start
  socket.on("startGame", () => {
    if (players[socket.id] && players[socket.id].isHost) {
      gameState.isRunning = true;
      gameState.isPaused = false;
      gameState.startTime = Date.now();
      gameState.timeRemaining = gameState.duration;

      // Reset all scores
      Object.keys(players).forEach((id) => {
        gameState.scores[id] = 0;
        players[id].score = 0;
      });

      // Generate initial collectibles
      collectibles = generateCollectibles(5);

      // Broadcast game start to all players
      io.emit("gameStarted", {
        gameState: gameState,
        collectibles: collectibles,
      });

      // Start the game timer
      startGameTimer();
    }
  });

  // Handle score update
  socket.on("updateScore", (points) => {
    if (players[socket.id] && gameState.isRunning && !gameState.isPaused) {
      players[socket.id].score += points;
      gameState.scores[socket.id] += points;

      // Broadcast the updated scores
      io.emit("scoreUpdated", {
        id: socket.id,
        score: players[socket.id].score,
        scores: gameState.scores,
      });
    }
  });

  // Handle collectible collection
  socket.on("collectItem", (itemId) => {
    // Remove the collected item from our tracking array
    collectibles = collectibles.filter((item) => item.id !== itemId);

    // Broadcast that this item was collected
    io.emit("itemCollected", {
      itemId: itemId,
      playerId: socket.id,
    });

    // Only generate a new collectible if we're below the maximum limit
    if (collectibles.length < gameState.maxCollectibles) {
      // Generate a new collectible
      const newItem = {
        id: uuidv4(),
        position: {
          x: Math.floor(Math.random() * 800),
          y: Math.floor(Math.random() * 500),
        },
        value: Math.floor(Math.random() * 5) + 1,
        createdAt: Date.now(), // Track when this collectible was created
      };

      // Add to our tracking array
      collectibles.push(newItem);

      // If we're at the limit, remove the oldest collectible to maintain performance
      if (collectibles.length >= gameState.maxCollectibles) {
        const oldestCollectible = collectibles.reduce(
          (oldest, current) =>
            !oldest || current.createdAt < oldest.createdAt ? current : oldest,
          null
        );

        if (oldestCollectible) {
          // Remove the oldest collectible
          collectibles = collectibles.filter(
            (item) => item.id !== oldestCollectible.id
          );
          // Notify clients to remove it
          io.emit("itemRemoved", oldestCollectible.id);
        }
      }

      // Broadcast the new collectible
      io.emit("newItem", newItem);
    }
  });

  // Handle pause game
  socket.on("pauseGame", () => {
    if (gameState.isRunning && !gameState.isPaused) {
      gameState.isPaused = true;
      gameState.pauseTime = Date.now();

      // Broadcast pause to all players
      io.emit("gamePaused", {
        pausedBy: players[socket.id].name,
      });
    }
  });

  // Handle resume game
  socket.on("resumeGame", () => {
    if (gameState.isRunning && gameState.isPaused) {
      const pauseDuration = Date.now() - gameState.pauseTime;
      gameState.startTime += pauseDuration; // Adjust start time to account for pause duration
      gameState.isPaused = false;

      // Broadcast resume to all players
      io.emit("gameResumed", {
        resumedBy: players[socket.id].name,
      });
    }
  });

  // Handle quit game
  socket.on("quitGame", () => {
    // Broadcast quit to all players
    io.emit("gameQuit", {
      quitBy: players[socket.id].name,
    });

    // Reset game state
    resetGame();
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // If the host disconnects and there are other players, assign a new host
    if (
      players[socket.id] &&
      players[socket.id].isHost &&
      Object.keys(players).length > 1
    ) {
      const remainingPlayerIds = Object.keys(players).filter(
        (id) => id !== socket.id
      );
      const newHostId = remainingPlayerIds[0];
      players[newHostId].isHost = true;

      // Notify the new host
      io.to(newHostId).emit("hostAssigned", { isHost: true });
    }

    // Remove the player from the game
    if (players[socket.id]) {
      delete players[socket.id];
      delete gameState.scores[socket.id];

      // Broadcast player left to all remaining players
      io.emit("playerLeft", {
        id: socket.id,
        players: players,
      });

      // If no players left, reset the game
      if (Object.keys(players).length === 0) {
        resetGame();
      }
    }
  });
});

// Start the game timer
function startGameTimer() {
  const timerInterval = setInterval(() => {
    if (!gameState.isRunning) {
      clearInterval(timerInterval);
      return;
    }

    if (gameState.isPaused) {
      return; // Don't update timer while paused
    }

    const elapsedSeconds = Math.floor(
      (Date.now() - gameState.startTime) / 1000
    );
    gameState.timeRemaining = Math.max(0, gameState.duration - elapsedSeconds);

    // Broadcast the updated time
    io.emit("timerUpdate", {
      timeRemaining: gameState.timeRemaining,
    });

    // Periodically clean up old collectibles to maintain performance
    cleanupOldCollectibles();

    // Check if the game is over
    if (gameState.timeRemaining <= 0) {
      endGame();
      clearInterval(timerInterval);
    }
  }, 1000);
}

// End the game
function endGame() {
  gameState.isRunning = false;

  // Find the winner
  let winnerId = null;
  let highestScore = -1;

  Object.keys(gameState.scores).forEach((playerId) => {
    if (gameState.scores[playerId] > highestScore) {
      highestScore = gameState.scores[playerId];
      winnerId = playerId;
    }
  });

  // Broadcast game over to all players
  io.emit("gameOver", {
    winner: winnerId ? players[winnerId].name : "No winner",
    scores: gameState.scores,
  });
}

// Reset the game state
function resetGame() {
  gameState.isRunning = false;
  gameState.isPaused = false;
  gameState.startTime = null;
  gameState.pauseTime = null;
  gameState.timeRemaining = gameState.duration;
  gameState.scores = {};
  collectibles = [];
}

// Clean up old collectibles to maintain performance
function cleanupOldCollectibles() {
  const now = Date.now();
  const MAX_COLLECTIBLE_AGE = 30000; // 30 seconds max lifetime

  // Find collectibles that have been around too long
  const oldCollectibles = collectibles.filter(
    (item) => now - item.createdAt > MAX_COLLECTIBLE_AGE
  );

  // Remove old collectibles if we have more than the minimum desired number
  const MIN_COLLECTIBLES = 5; // Always keep at least this many collectibles

  if (collectibles.length > MIN_COLLECTIBLES && oldCollectibles.length > 0) {
    // Remove the oldest collectible
    const oldestCollectible = oldCollectibles.reduce(
      (oldest, current) =>
        !oldest || current.createdAt < oldest.createdAt ? current : oldest,
      null
    );

    if (oldestCollectible) {
      // Remove from our tracking array
      collectibles = collectibles.filter(
        (item) => item.id !== oldestCollectible.id
      );
      // Notify clients to remove it
      io.emit("itemRemoved", oldestCollectible.id);
    }
  }
}

// Generate random collectibles
function generateCollectibles(count) {
  const collectibles = [];

  // Ensure we don't exceed the maximum number of collectibles
  const actualCount = Math.min(count, gameState.maxCollectibles);

  for (let i = 0; i < actualCount; i++) {
    collectibles.push({
      id: uuidv4(),
      position: {
        x: Math.floor(Math.random() * 800),
        y: Math.floor(Math.random() * 500),
      },
      value: Math.floor(Math.random() * 5) + 1,
      createdAt: Date.now(), // Track when this collectible was created
    });
  }

  return collectibles;
}

// Generate a random color
function getRandomColor() {
  const colors = [
    "#FF5733",
    "#33FF57",
    "#3357FF",
    "#F3FF33",
    "#FF33F3",
    "#33FFF3",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
