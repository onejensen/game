// Collectible module - handles collectible items in the game
const Collectible = (() => {
  // Create a new collectible element
  function create(item) {
    // Check if collectible already exists
    if (document.getElementById(`collectible-${item.id}`)) {
      return;
    }

    // Create collectible element
    const collectibleElement = document.createElement("div");
    collectibleElement.id = `collectible-${item.id}`;
    collectibleElement.className = "collectible";
    collectibleElement.setAttribute("data-id", item.id);
    collectibleElement.setAttribute("data-value", item.value);

    // Set position
    collectibleElement.style.left = `${item.position.x}px`;
    collectibleElement.style.top = `${item.position.y}px`;

    // Set color based on value
    const hue = 50 + item.value * 20; // Gold to red-gold based on value
    collectibleElement.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;
    collectibleElement.style.boxShadow = `0 0 10px hsl(${hue}, 100%, 70%)`;

    // Set size based on value
    const size = 15 + item.value * 2;
    collectibleElement.style.width = `${size}px`;
    collectibleElement.style.height = `${size}px`;

    // Add to game area
    document.getElementById("game-area").appendChild(collectibleElement);
  }

  // Remove a collectible
  function remove(itemId) {
    const collectibleElement = document.getElementById(`collectible-${itemId}`);
    if (collectibleElement) {
      // Add collection animation
      collectibleElement.style.animation = "collect 0.3s forwards";

      // Remove after animation completes
      setTimeout(() => {
        collectibleElement.remove();
      }, 300);
    }
  }

  // Public API
  return {
    create,
    remove,
  };
})();

// Add collect animation to stylesheet
const style = document.createElement("style");
style.textContent = `
@keyframes collect {
    0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
}

@keyframes collectPulse {
    0% { transform: scale(0.8); opacity: 0.8; }
    50% { transform: scale(1.2); opacity: 0.5; }
    100% { transform: scale(1.5); opacity: 0; }
}
`;
document.head.appendChild(style);
