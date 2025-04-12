// Player module - handles player creation and updates
const Player = (() => {
  // Create a new player element
  function create(player) {
    // Check if player element already exists
    if (document.getElementById(`player-${player.id}`)) {
      return;
    }

    // Create player element
    const playerElement = document.createElement("div");
    playerElement.id = `player-${player.id}`;
    playerElement.className = "player";
    playerElement.style.backgroundColor = player.color;
    playerElement.setAttribute("data-name", player.name);

    // Set initial position
    playerElement.style.left = `${player.position.x}px`;
    playerElement.style.top = `${player.position.y}px`;

    // Add player name
    const nameElement = document.createElement("div");
    nameElement.className = "player-name";
    nameElement.textContent = player.name;
    playerElement.appendChild(nameElement);

    // Add to game area
    document.getElementById("game-area").appendChild(playerElement);
  }

  // Update player position
  function updatePosition(playerId, position) {
    const playerElement = document.getElementById(`player-${playerId}`);
    if (playerElement) {
      playerElement.style.left = `${position.x}px`;
      playerElement.style.top = `${position.y}px`;
    }
  }

  // Remove player
  function remove(playerId) {
    const playerElement = document.getElementById(`player-${playerId}`);
    if (playerElement) {
      playerElement.remove();
    }
  }

  // Show collect effect
  function showCollectEffect() {
    // Get current player element
    const playerElement = document.querySelector(
      '.player[data-current="true"]'
    );
    if (!playerElement) return;

    // Create and add a pulse effect
    const effect = document.createElement("div");
    effect.className = "collect-effect";
    effect.style.position = "absolute";
    effect.style.width = "100%";
    effect.style.height = "100%";
    effect.style.borderRadius = "50%";
    effect.style.backgroundColor = "rgba(255, 255, 255, 0.7)";
    effect.style.animation = "collectPulse 0.5s forwards";

    // Add the effect to the player element
    playerElement.appendChild(effect);

    // Remove the effect after animation completes
    setTimeout(() => {
      effect.remove();
    }, 500);
  }

  // Set current player
  function setCurrentPlayer(playerId) {
    // Remove current player marker from all players
    document.querySelectorAll(".player").forEach((el) => {
      el.setAttribute("data-current", "false");
    });

    // Set current player marker
    const playerElement = document.getElementById(`player-${playerId}`);
    if (playerElement) {
      playerElement.setAttribute("data-current", "true");
    }
  }

  // Public API
  return {
    create,
    updatePosition,
    remove,
    showCollectEffect,
    setCurrentPlayer,
  };
})();
