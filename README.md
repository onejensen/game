# Multiplayer Game Project

A real-time multiplayer browser game built with JavaScript, WebSockets, and DOM manipulation.

## Features

- Real-time multiplayer gameplay for 2-4 players
- WebSocket-based communication
- DOM-based rendering (no canvas)
- Smooth animations with RequestAnimationFrame
- In-game menu (pause, resume, quit)
- Real-time scoring system
- Game timer
- Keyboard controls
- Sound effects

## Project Structure

```
/
├── client/             # Client-side code
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript files
│   ├── audio/          # Sound effects
│   └── index.html      # Main HTML file
├── server/             # Server-side code
│   ├── server.js       # WebSocket server
│   └── game.js         # Game logic
├── package.json        # Project dependencies
└── README.md           # Project documentation
```

## Setup and Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the server: `npm start`
4. Open your browser and navigate to `http://localhost:3000`

## How to Play

1. Enter your name on the join screen
2. Wait for the host to start the game
3. Use arrow keys or WASD to control your character
4. Collect items and avoid obstacles
5. The player with the highest score when the timer ends wins

## Technologies Used

- JavaScript (ES6+)
- Node.js
- Express
- WebSockets (Socket.io)
- HTML5
- CSS3
