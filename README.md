# Asteroids

A modern remake of the classic Asteroids arcade game built with Next.js, React, and TypeScript. Navigate through space, destroy asteroids, and survive increasingly challenging levels while battling hostile alien ships.

![Asteroids Game](https://img.shields.io/badge/Next.js-15.2.4-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)

## Game Description

This is a browser-based implementation of the classic 1979 arcade game Asteroids. Control your spaceship in a 2D space environment, destroying asteroids and alien ships while avoiding collisions. The game features progressive difficulty levels, where each new level introduces more asteroids moving at faster speeds.

**Features:**
- Classic vector-style graphics rendered on HTML5 Canvas
- Progressive difficulty system with unlimited levels
- Lives system (3 lives to start)
- Smart alien ships that aim at your position
- Particle effects for explosions and asteroid destruction
- Score tracking with points for asteroids and alien ships
- Responsive keyboard controls

## How to Play

### Controls

| Key | Action |
|-----|--------|
| **A** or **←** (Left Arrow) | Rotate ship left |
| **D** or **→** (Right Arrow) | Rotate ship right |
| **W** or **↑** (Up Arrow) | Thrust forward |
| **Spacebar** | Fire projectile |

### Gameplay

1. **Destroy Asteroids**: Shoot asteroids to break them into smaller pieces. Large asteroids split into medium ones, medium into small, and small asteroids are destroyed completely.

2. **Scoring**:
   - Small asteroid: 150 points
   - Medium asteroid: 100 points
   - Large asteroid: 50 points
   - Alien ship: 200 points

3. **Alien Ships**: Every 20 seconds, a hostile alien ship appears and fires projectiles aimed at your position. Destroy it for bonus points!

4. **Lives**: You start with 3 lives. Losing all lives ends the game.

5. **Level Progression**: Clear all asteroids to advance to the next level. Each level adds more asteroids and increases their speed.

6. **Avoid Collisions**: Your ship is destroyed if it collides with asteroids, alien ships, or alien projectiles.

## Installation and Setup

### Prerequisites

- **Node.js** 18.x or higher
- **npm**, **yarn**, or **pnpm** package manager

### Install Dependencies

```bash
# Using npm
npm install

# Using yarn
yarn install

# Using pnpm
pnpm install
```

### Run the Development Server

```bash
# Using npm
npm run dev

# Using yarn
yarn dev

# Using pnpm
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to play the game.

### Build for Production

```bash
# Using npm
npm run build
npm start

# Using yarn
yarn build
yarn start

# Using pnpm
pnpm build
pnpm start
```

## Technology Stack

- **Framework**: Next.js 15.2.4
- **UI Library**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Rendering**: HTML5 Canvas API

## Contributing

Contributions are welcome! Here are some ideas for enhancements:

### Feature Ideas for Contributors

#### Gameplay Enhancements
- **Power-ups**: Add collectible power-ups (shields, rapid fire, multi-shot, speed boost)
- **Multiple Weapon Types**: Implement different weapons (lasers, missiles, spread shot)
- **Boss Battles**: Add boss enemies at certain level milestones (every 5 or 10 levels)
- **Hyperspace Jump**: Classic asteroids feature to teleport to random location (risky escape)
- **Shield System**: Temporary shield that absorbs one hit before breaking
- **Difficulty Modes**: Easy, Normal, Hard modes with different parameters
- **Combo System**: Reward consecutive hits with multipliers

#### Visual & Audio
- **Sound Effects**: Add audio for shooting, explosions, thrust, and background music
- **Particle Systems**: Enhanced explosion effects, engine trails, debris
- **Screen Shake**: Camera shake on impacts and explosions
- **Starfield Background**: Animated parallax star field
- **Color Schemes**: Multiple visual themes (classic green vector, neon, retro CRT)
- **Animation Polish**: Smooth transitions, screen wrap effects, visual feedback

#### Progression & Persistence
- **High Score Table**: Local storage or database-backed leaderboard
- **Achievements System**: Unlock achievements for various milestones
- **Save/Continue**: Save game state and resume later
- **Statistics Tracking**: Track stats like accuracy, survival time, asteroids destroyed
- **Unlockables**: Unlock new ship designs or color schemes

#### Multiplayer & Social
- **Local Co-op**: Two-player simultaneous play
- **Online Leaderboard**: Global high score competition
- **Daily Challenges**: Special daily game modes with unique rules
- **Ghost Replay**: Save and replay best runs

#### Technical Improvements
- **Mobile Support**: Touch controls for mobile devices
- **Gamepad Support**: Xbox/PlayStation controller compatibility
- **Configurable Controls**: Let players remap keys
- **Pause Menu**: Pause game with settings and options
- **Accessibility**: Color-blind modes, customizable contrast
- **Performance Optimization**: WebGL renderer for smoother animations
- **Screen Scaling**: Responsive canvas that adapts to different screen sizes

#### Game Modes
- **Survival Mode**: Endless mode with increasing difficulty
- **Time Attack**: Score as many points as possible in limited time
- **No Lives Mode**: One hit and you're done
- **Asteroid Defense**: Protect a space station from asteroids
- **Zen Mode**: No enemies, just destroy asteroids peacefully

## Project Structure

```
v0-asteroids/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/
│   ├── asteroids-game.tsx # Main game component
│   └── game/              # Game entity components
│       ├── ship.tsx       # Player ship
│       ├── asteroid.tsx   # Asteroid entities
│       ├── projectile.tsx # Bullets
│       ├── alien-ship.tsx # Enemy ship
│       ├── explosion.tsx  # Particle effects
│       ├── collision.tsx  # Collision detection
│       └── ui.tsx         # Game UI rendering
├── styles/                # Global styles
└── public/                # Static assets
```

## License

This project is open source and available for modification and distribution.

## Acknowledgments

Based on the classic Asteroids arcade game originally developed by Atari in 1979.

---

**Enjoy the game!** Feel free to fork this repository and create your own enhancements.
