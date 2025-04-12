// Audio module - handles game sound effects
const AudioManager = (() => {
  // Audio files
  const sounds = {
    join: null,
    gameStart: null,
    collect: null,
    pause: null,
    resume: null,
    gameOver: null,
  };

  // Initialize audio
  function init() {
    // Create audio elements
    sounds.join = createAudio("join", "audio/join.mp3");
    sounds.gameStart = createAudio("gameStart", "audio/game-start.mp3");
    sounds.collect = createAudio("collect", "audio/collect.mp3");
    sounds.pause = createAudio("pause", "audio/pause.mp3");
    sounds.resume = createAudio("resume", "audio/resume.mp3");
    sounds.gameOver = createAudio("gameOver", "audio/game-over.mp3");

    // Preload sounds
    Object.values(sounds).forEach((sound) => {
      if (sound) sound.load();
    });
  }

  // Create an audio element
  function createAudio(id, src) {
    const audio = document.createElement("audio");
    audio.id = `sound-${id}`;
    audio.src = src;
    audio.preload = "auto";
    return audio;
  }

  // Play a sound
  function play(soundName) {
    const sound = sounds[soundName];
    if (sound) {
      // Reset the sound to the beginning if it's already playing
      sound.currentTime = 0;
      sound.play().catch((error) => {
        console.warn(`Error playing sound ${soundName}:`, error);
      });
    }
  }

  // Public API
  return {
    init,
    play,
  };
})();

// Initialize audio when the document is loaded
function initAudio() {
  AudioManager.init();
}

// Play a sound
function playSound(soundName) {
  AudioManager.play(soundName);
}
