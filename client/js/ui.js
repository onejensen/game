// UI module - handles user interface interactions and updates
const UI = (() => {
  // Update the timer display
  function updateTimer(timeRemaining) {
    const timeValue = document.getElementById("time-value");
    if (timeValue) {
      timeValue.textContent = timeRemaining;

      // Add visual effect when time is running low
      if (timeRemaining <= 10) {
        timeValue.classList.add("time-low");
      } else {
        timeValue.classList.remove("time-low");
      }
    }
  }

  // Show a notification message
  function showNotification(message, duration = 3000) {
    const notification = document.getElementById("notification");
    if (notification) {
      notification.textContent = message;
      notification.classList.remove("hidden");

      // Hide notification after duration
      setTimeout(() => {
        notification.classList.add("hidden");
      }, duration);
    }
  }

  // Update the scores display
  function updateScores(players, currentPlayerId) {
    const scoreList = document.getElementById("score-list");
    if (!scoreList) return;

    scoreList.innerHTML = "";

    // Sort players by score
    const sortedPlayers = Object.values(players).sort(
      (a, b) => b.score - a.score
    );

    sortedPlayers.forEach((player) => {
      const li = document.createElement("li");
      li.textContent = `${player.name}: ${player.score}`;

      // Highlight current player
      if (player.id === currentPlayerId) {
        li.style.fontWeight = "bold";
      }

      scoreList.appendChild(li);
    });
  }

  // Update the lobby players list
  function updateLobbyPlayers(players, isHost) {
    const lobbyPlayersList = document.getElementById("lobby-players");
    const hostControls = document.getElementById("host-controls");

    if (lobbyPlayersList) {
      lobbyPlayersList.innerHTML = "";

      Object.values(players).forEach((player) => {
        const li = document.createElement("li");
        li.textContent = player.name + (player.isHost ? " (Host)" : "");
        lobbyPlayersList.appendChild(li);
      });
    }

    // Show/hide host controls
    if (hostControls) {
      if (isHost) {
        hostControls.classList.remove("hidden");
      } else {
        hostControls.classList.add("hidden");
      }
    }
  }

  // Show game over screen
  function showGameOver(winner, scores, players, currentPlayerId) {
    const gameScreen = document.getElementById("game-screen");
    const gameOverScreen = document.getElementById("game-over");
    const winnerDisplay = document.getElementById("winner-display");
    const finalScoreList = document.getElementById("final-score-list");

    // Hide game screen, show game over screen
    if (gameScreen && gameOverScreen) {
      gameScreen.classList.add("hidden");
      gameOverScreen.classList.remove("hidden");
    }

    // Display winner
    if (winnerDisplay) {
      winnerDisplay.textContent = `Winner: ${winner}`;
    }

    // Display final scores
    if (finalScoreList) {
      finalScoreList.innerHTML = "";

      // Get player names from our local players object
      const playerNames = {};
      Object.values(players).forEach((player) => {
        playerNames[player.id] = player.name;
      });

      // Sort scores and display
      const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);

      sortedScores.forEach(([id, score]) => {
        const li = document.createElement("li");
        const name = playerNames[id] || "Unknown Player";
        li.textContent = `${name}: ${score}`;

        // Highlight winner
        if (name === winner) {
          li.style.color = "gold";
          li.style.fontWeight = "bold";
        }

        // Highlight current player
        if (id === currentPlayerId) {
          li.style.textDecoration = "underline";
        }

        finalScoreList.appendChild(li);
      });
    }
  }

  // Toggle game menu
  function toggleMenu() {
    const gameMenu = document.getElementById("game-menu");
    if (gameMenu) {
      gameMenu.classList.toggle("hidden");
    }
  }

  // Switch to game screen
  function showGameScreen() {
    const joinScreen = document.getElementById("join-screen");
    const gameScreen = document.getElementById("game-screen");
    const gameOverScreen = document.getElementById("game-over");

    if (joinScreen) joinScreen.classList.add("hidden");
    if (gameOverScreen) gameOverScreen.classList.add("hidden");
    if (gameScreen) gameScreen.classList.remove("hidden");
  }

  // Switch to join screen
  function showJoinScreen() {
    const joinScreen = document.getElementById("join-screen");
    const gameScreen = document.getElementById("game-screen");
    const gameOverScreen = document.getElementById("game-over");

    if (gameScreen) gameScreen.classList.add("hidden");
    if (gameOverScreen) gameOverScreen.classList.add("hidden");
    if (joinScreen) joinScreen.classList.remove("hidden");
  }

  // Public API
  return {
    updateTimer,
    showNotification,
    updateScores,
    updateLobbyPlayers,
    showGameOver,
    toggleMenu,
    showGameScreen,
    showJoinScreen,
  };
})();
