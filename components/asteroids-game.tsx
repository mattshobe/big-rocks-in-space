"use client"

import { useEffect, useRef, useState } from "react"
import { Ship } from "./game/ship"
import { Asteroid } from "./game/asteroid"
import { Projectile } from "./game/projectile"
import { AlienShip } from "./game/alien-ship"
import { type ExplosionParticle, createExplosion } from "./game/explosion"
import { type AsteroidFragment, createAsteroidFragments } from "./game/asteroid-fragment"
import { checkCollision } from "./game/collision"
import { drawGameOver, drawLevelComplete, drawLives, drawScore } from "./game/ui"

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 500
const MAX_PROJECTILES = 5
const INITIAL_LIVES = 3
const ALIEN_SHIP_POINTS = 200
const ALIEN_SHIP_INTERVAL = 20000 // 20 seconds

export default function AsteroidsGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [lives, setLives] = useState(INITIAL_LIVES)

  useEffect(() => {
    if (!gameStarted) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Game state
    let ship = new Ship(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
    let shipDestroyed = false // Track if ship is currently being destroyed
    let asteroids: Asteroid[] = []
    const projectiles: Projectile[] = []
    let alienShip: AlienShip | null = null
    const alienProjectiles: Projectile[] = []
    let explosionParticles: ExplosionParticle[] = []
    let asteroidFragments: AsteroidFragment[] = []
    let alienShipTimer: NodeJS.Timeout | null = null
    let levelCompleteTimer: NodeJS.Timeout | null = null
    let levelComplete = false
    let currentLives = lives // Track lives locally to handle game over timing

    // Initialize asteroids
    const initAsteroids = () => {
      asteroids = []
      const numAsteroids = level + 2
      for (let i = 0; i < numAsteroids; i++) {
        // Ensure asteroids don't spawn too close to the ship
        let x, y
        do {
          x = Math.random() * CANVAS_WIDTH
          y = Math.random() * CANVAS_HEIGHT
        } while (Math.sqrt(Math.pow(x - ship.x, 2) + Math.pow(y - ship.y, 2)) < 100)

        asteroids.push(
          new Asteroid(
            x,
            y,
            3, // Start with large asteroids
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            level, // Speed increases with level
          ),
        )
      }
    }

    // Initialize game
    initAsteroids()

    // Schedule alien ship appearance
    const scheduleAlienShip = () => {
      alienShipTimer = setTimeout(() => {
        alienShip = new AlienShip(Math.random() < 0.5 ? 0 : CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT, level)
      }, ALIEN_SHIP_INTERVAL)
    }

    scheduleAlienShip()

    // Key state
    const keys: { [key: string]: boolean } = {}

    // Event listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true

      // Fire projectile with spacebar
      if (e.code === "Space" && projectiles.length < MAX_PROJECTILES && !shipDestroyed) {
        const angle = ship.angle
        projectiles.push(new Projectile(ship.x, ship.y, Math.cos(angle) * 5, Math.sin(angle) * 5))
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    // Function to handle ship destruction
    const destroyShip = () => {
      if (shipDestroyed) return // Prevent multiple destructions

      shipDestroyed = true

      // Decrement lives
      currentLives--
      setLives(currentLives)

      // Create explosion particles for the ship
      const shipExplosion = createExplosion(ship.x, ship.y, 20)
      explosionParticles = [...explosionParticles, ...shipExplosion]

      // Check if game over
      if (currentLives <= 0) {
        // Wait for explosion animation to finish before showing game over
        setTimeout(() => {
          setGameOver(true)
        }, 1000)
        return
      }

      // Reset ship position after a delay
      setTimeout(() => {
        ship = new Ship(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
        shipDestroyed = false
      }, 1000)
    }

    // Game loop
    let lastTime = 0
    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastTime
      lastTime = timestamp

      // Clear canvas
      ctx.fillStyle = "black"
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      if (levelComplete) {
        drawLevelComplete(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, level)
        return requestAnimationFrame(gameLoop)
      }

      // Only update ship if it's not destroyed
      if (!shipDestroyed) {
        // Update ship
        if (keys["a"] || keys["arrowleft"]) {
          ship.rotate(-0.1)
        }
        if (keys["d"] || keys["arrowright"]) {
          ship.rotate(0.1)
        }
        if (keys["w"] || keys["arrowup"]) {
          ship.thrust()
        } else {
          ship.stopThrust()
        }

        ship.update(CANVAS_WIDTH, CANVAS_HEIGHT)
        ship.draw(ctx)
      }

      // Create a new array for projectiles to avoid modification during iteration
      const projectilesToRemove = new Set<number>()
      const asteroidsToRemove = new Set<number>()

      // Update projectiles
      for (let i = 0; i < projectiles.length; i++) {
        if (!projectiles[i]) continue

        projectiles[i].update(CANVAS_WIDTH, CANVAS_HEIGHT)
        projectiles[i].draw(ctx)

        // Remove projectiles that have traveled too far
        projectiles[i].lifespan--
        if (projectiles[i].lifespan <= 0) {
          projectilesToRemove.add(i)
          continue
        }

        // Check for collisions with asteroids
        let hitAsteroid = false
        for (let j = 0; j < asteroids.length; j++) {
          if (!asteroids[j] || asteroidsToRemove.has(j)) continue

          if (checkCollision(projectiles[i], asteroids[j])) {
            // Get asteroid data before splitting or removing
            const asteroid = asteroids[j]

            // Create asteroid fragments
            if (asteroid) {
              const newFragments = createAsteroidFragments(
                asteroid.x,
                asteroid.y,
                asteroid.radius,
                asteroid.vertices,
                asteroid.offsets,
                asteroid.dx,
                asteroid.dy,
              )
              asteroidFragments = [...asteroidFragments, ...newFragments]
            }

            // Split asteroid or remove if too small
            if (asteroid && typeof asteroid.size === "number" && asteroid.size > 1) {
              const newSize = asteroid.size - 1
              const numFragments = 2
              for (let k = 0; k < numFragments; k++) {
                asteroids.push(
                  new Asteroid(asteroid.x, asteroid.y, newSize, Math.random() * 2 - 1, Math.random() * 2 - 1, level),
                )
              }
            }

            // Add points based on asteroid size
            if (asteroid && typeof asteroid.size === "number") {
              setScore((prev) => prev + (4 - asteroid.size) * 50)
            }

            // Mark asteroid and projectile for removal
            asteroidsToRemove.add(j)
            projectilesToRemove.add(i)
            hitAsteroid = true
            break
          }
        }

        if (hitAsteroid) continue

        // Check for collision with alien ship
        if (alienShip && checkCollision(projectiles[i], alienShip)) {
          setScore((prev) => prev + ALIEN_SHIP_POINTS)

          // Create explosion particles when alien ship is destroyed
          const newParticles = createExplosion(alienShip.x, alienShip.y, 30)
          explosionParticles = [...explosionParticles, ...newParticles]

          alienShip = null
          projectilesToRemove.add(i)
          scheduleAlienShip()
        }
      }

      // Remove marked projectiles (in reverse order to avoid index issues)
      const projectileIndices = Array.from(projectilesToRemove).sort((a, b) => b - a)
      for (const index of projectileIndices) {
        projectiles.splice(index, 1)
      }

      // Remove marked asteroids (in reverse order to avoid index issues)
      const asteroidIndices = Array.from(asteroidsToRemove).sort((a, b) => b - a)
      for (const index of asteroidIndices) {
        asteroids.splice(index, 1)
      }

      // Update asteroid fragments
      for (let i = asteroidFragments.length - 1; i >= 0; i--) {
        asteroidFragments[i].update()
        asteroidFragments[i].draw(ctx)

        // Remove fragments that have expired
        if (asteroidFragments[i].lifespan <= 0) {
          asteroidFragments.splice(i, 1)
        }
      }

      // Update explosion particles
      for (let i = explosionParticles.length - 1; i >= 0; i--) {
        explosionParticles[i].update()
        explosionParticles[i].draw(ctx)

        // Remove particles that have expired
        if (explosionParticles[i].lifespan <= 0) {
          explosionParticles.splice(i, 1)
        }
      }

      // Update alien projectiles
      const alienProjectilesToRemove = []
      for (let i = 0; i < alienProjectiles.length; i++) {
        if (!alienProjectiles[i]) continue

        alienProjectiles[i].update(CANVAS_WIDTH, CANVAS_HEIGHT)
        alienProjectiles[i].draw(ctx)

        // Remove projectiles that have traveled too far
        alienProjectiles[i].lifespan--
        if (alienProjectiles[i].lifespan <= 0) {
          alienProjectilesToRemove.push(i)
          continue
        }

        // Check for collision with ship
        if (!shipDestroyed && ship && checkCollision(alienProjectiles[i], ship)) {
          // Destroy ship
          destroyShip()
          alienProjectilesToRemove.push(i)
          break
        }
      }

      // Remove marked alien projectiles (in reverse order)
      for (let i = alienProjectilesToRemove.length - 1; i >= 0; i--) {
        alienProjectiles.splice(alienProjectilesToRemove[i], 1)
      }

      // Update asteroids
      for (let i = 0; i < asteroids.length; i++) {
        if (!asteroids[i]) continue

        asteroids[i].update(CANVAS_WIDTH, CANVAS_HEIGHT)
        asteroids[i].draw(ctx)

        // Check for collision with ship - FIXED: Ship is destroyed on contact with any asteroid
        if (!shipDestroyed && ship && checkCollision(ship, asteroids[i])) {
          // Create asteroid fragments
          const asteroid = asteroids[i]
          if (asteroid) {
            const newFragments = createAsteroidFragments(
              asteroid.x,
              asteroid.y,
              asteroid.radius,
              asteroid.vertices,
              asteroid.offsets,
              asteroid.dx,
              asteroid.dy,
            )
            asteroidFragments = [...asteroidFragments, ...newFragments]
          }

          // Destroy ship
          destroyShip()
          break
        }
      }

      // Update alien ship
      if (alienShip) {
        alienShip.update(CANVAS_WIDTH, CANVAS_HEIGHT)
        alienShip.draw(ctx)

        // Alien ship fires randomly
        if (Math.random() < 0.01) {
          const angle = Math.random() * Math.PI * 2
          alienProjectiles.push(new Projectile(alienShip.x, alienShip.y, Math.cos(angle) * 3, Math.sin(angle) * 3))
        }

        // Check for collision with ship
        if (!shipDestroyed && ship && checkCollision(ship, alienShip)) {
          // Destroy ship
          destroyShip()

          // Create explosion particles when alien ship is destroyed
          const newParticles = createExplosion(alienShip.x, alienShip.y, 30)
          explosionParticles = [...explosionParticles, ...newParticles]

          alienShip = null
          scheduleAlienShip()
        }
      }

      // Check if level is complete
      if (asteroids.length === 0 && !levelComplete) {
        levelComplete = true
        levelCompleteTimer = setTimeout(() => {
          setLevel((prev) => prev + 1)
          levelComplete = false
          ship = new Ship(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
          shipDestroyed = false
          initAsteroids()
        }, 3000)
      }

      // Draw UI
      drawScore(ctx, score, 20, 30)
      drawLives(ctx, currentLives, CANVAS_WIDTH - 200, 30)

      // Check for game over
      if (gameOver) {
        drawGameOver(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, score)
        return
      }

      requestAnimationFrame(gameLoop)
    }

    const animationId = requestAnimationFrame(gameLoop)

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      cancelAnimationFrame(animationId)
      if (alienShipTimer) clearTimeout(alienShipTimer)
      if (levelCompleteTimer) clearTimeout(levelCompleteTimer)
    }
  }, [gameStarted, level])

  useEffect(() => {
    if (!gameStarted && !gameOver && buttonRef.current) {
      buttonRef.current.focus()
    }
  }, [gameStarted, gameOver])

  // Reset game
  const resetGame = () => {
    setScore(0)
    setLevel(1)
    setLives(INITIAL_LIVES)
    setGameOver(false)
    setGameStarted(true)
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="border border-gray-700" />

        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80">
            <h2 className="mb-4 text-2xl font-bold text-white">ASTEROIDS</h2>
            <p className="mb-2 text-white">Controls:</p>
            <ul className="mb-4 text-white">
              <li>A/D or ←/→ - Rotate ship</li>
              <li>W or ↑ - Thrust</li>
              <li>Spacebar - Fire</li>
            </ul>
            <button
              ref={buttonRef}
              onClick={() => setGameStarted(true)}
              className="rounded bg-white px-4 py-2 font-bold text-black hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            >
              START GAME
            </button>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80">
            <h2 className="mb-4 text-2xl font-bold text-white">GAME OVER</h2>
            <p className="mb-4 text-xl text-white">Final Score: {score}</p>
            <button onClick={resetGame} className="rounded bg-white px-4 py-2 font-bold text-black hover:bg-gray-200">
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 text-white">
        <p>Use A/D or ←/→ to rotate, W or ↑ for thrust, and SPACEBAR to fire</p>
      </div>
    </div>
  )
}
