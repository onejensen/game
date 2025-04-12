// Game module - handles core game mechanics
const Game = (() => {
  // Private variables
  let gameArea;
  let currentPlayerId;
  let players;
  let socket;
  let animationFrameId;
  let lastTimestamp = 0;
  let isPaused = false;
  let keys = {};

  // Player movement speed (pixels per second)
  const PLAYER_SPEED = 200;

  // Initialize the game
  function init(area, playerId, playersList, socketConnection) {
    gameArea = area;
    currentPlayerId = playerId;
    players = playersList;
    socket = socketConnection;

    // Create player elements
    Object.values(players).forEach((player) => {
      Player.create(player);
    });

    // Set up keyboard event listeners
    setupControls();
  }

  // Start the game loop
  function start() {
    isPaused = false;
    lastTimestamp = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  // Game loop
  function gameLoop(timestamp) {
    if (isPaused) {
      return;
    }

    // Calculate delta time in seconds
    const deltaTime = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    // Update player position based on input
    updatePlayerPosition(deltaTime);

    // Check for collisions with collectibles
    checkCollisions();

    // Request next frame
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  // Update player position based on keyboard input
  function updatePlayerPosition(deltaTime) {
    if (!players[currentPlayerId]) return;

    const currentPlayer = players[currentPlayerId];
    let moved = false;
    let newX = currentPlayer.position.x;
    let newY = currentPlayer.position.y;

    // Calculate movement based on keys pressed
    if (keys["ArrowUp"] || keys["w"] || keys["W"]) {
      newY -= PLAYER_SPEED * deltaTime;
      moved = true;
    }
    if (keys["ArrowDown"] || keys["s"] || keys["S"]) {
      newY += PLAYER_SPEED * deltaTime;
      moved = true;
    }
    if (keys["ArrowLeft"] || keys["a"] || keys["A"]) {
      newX -= PLAYER_SPEED * deltaTime;
      moved = true;
    }
    if (keys["ArrowRight"] || keys["d"] || keys["D"]) {
      newX += PLAYER_SPEED * deltaTime;
      moved = true;
    }

    // Apply boundary constraints
    const bounds = gameArea.getBoundingClientRect();
    newX = Math.max(20, Math.min(bounds.width - 20, newX));
    newY = Math.max(20, Math.min(bounds.height - 20, newY));

    // Update position if moved
    if (moved) {
      currentPlayer.position.x = newX;
      currentPlayer.position.y = newY;

      // Update player element position
      Player.updatePosition(currentPlayerId, currentPlayer.position);

      // Send position update to server
      socket.emit("playerMove", {
        position: currentPlayer.position,
      });
    }
  }

  // Check for collisions with collectibles
  function checkCollisions() {
    if (!players[currentPlayerId]) return;

    const playerElement = document.getElementById(`player-${currentPlayerId}`);
    if (!playerElement) return;

    const playerRect = playerElement.getBoundingClientRect();
    const collectibleElements = document.querySelectorAll(".collectible");

    collectibleElements.forEach((element) => {
      const collectibleRect = element.getBoundingClientRect();

      // Check for collision (simple circle collision)
      const dx =
        playerRect.left +
        playerRect.width / 2 -
        (collectibleRect.left + collectibleRect.width / 2);
      const dy =
        playerRect.top +
        playerRect.height / 2 -
        (collectibleRect.top + collectibleRect.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);

      // If collision detected
      if (distance < playerRect.width / 2 + collectibleRect.width / 2) {
        const itemId = element.getAttribute("data-id");
        const itemValue = parseInt(element.getAttribute("data-value") || 1);

        // Notify server about collection
        socket.emit("collectItem", itemId);

        // Update score
        socket.emit("updateScore", itemValue);
      }
    });
  }

  // Set up keyboard controls
  function setupControls() {
    // Key down event
    window.addEventListener("keydown", (e) => {
      // Prevent default behavior for arrow keys
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
      ) {
        e.preventDefault();
      }

      keys[e.key] = true;
    });

    // Key up event
    window.addEventListener("keyup", (e) => {
      keys[e.key] = false;
    });

    // Prevent losing focus when clicking game area
    gameArea.addEventListener("click", (e) => {
      e.preventDefault();
    });
  }

  // Pause the game
  function pause() {
    isPaused = true;
    cancelAnimationFrame(animationFrameId);
  }

  // Resume the game
  function resume() {
    if (isPaused) {
      isPaused = false;
      lastTimestamp = performance.now();
      animationFrameId = requestAnimationFrame(gameLoop);
    }
  }

  // Stop the game
  function stop() {
    isPaused = true;
    cancelAnimationFrame(animationFrameId);

    // Remove keyboard event listeners
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
  }

  // Public API
  return {
    init,
    start,
    pause,
    resume,
    stop,
  };
})();
