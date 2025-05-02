export class AlienShip {
  x: number
  y: number
  radius: number
  dx: number
  dy: number
  changeDirectionCounter: number

  constructor(x: number, y: number, level = 1) {
    this.x = x
    this.y = y
    this.radius = 20

    // Speed increases with level
    const speedMultiplier = 1 + (level - 1) * 0.2
    this.dx = (Math.random() * 2 - 1) * speedMultiplier
    this.dy = (Math.random() * 2 - 1) * speedMultiplier
    this.changeDirectionCounter = 0
  }

  update(canvasWidth: number, canvasHeight: number) {
    // Update position
    this.x += this.dx
    this.y += this.dy

    // Screen wrapping
    if (this.x < 0) this.x = canvasWidth
    if (this.x > canvasWidth) this.x = 0
    if (this.y < 0) this.y = canvasHeight
    if (this.y > canvasHeight) this.y = 0

    // Change direction occasionally
    this.changeDirectionCounter++
    if (this.changeDirectionCounter > 100) {
      this.dx = Math.random() * 2 - 1
      this.dy = Math.random() * 2 - 1
      this.changeDirectionCounter = 0
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.translate(this.x, this.y)

    // Draw flying saucer in profile view
    ctx.strokeStyle = "white"
    ctx.lineWidth = 2

    // Main saucer body - elongated ellipse
    ctx.beginPath()
    ctx.ellipse(0, 0, this.radius * 1.5, this.radius * 0.4, 0, 0, Math.PI * 2)
    ctx.stroke()

    // Top dome/cockpit
    ctx.beginPath()
    ctx.ellipse(0, -this.radius * 0.2, this.radius * 0.5, this.radius * 0.3, 0, Math.PI, 0)
    ctx.stroke()

    // Bottom details
    ctx.beginPath()
    ctx.ellipse(0, this.radius * 0.2, this.radius * 0.7, this.radius * 0.15, 0, 0, Math.PI)
    ctx.stroke()

    // Windows/lights
    ctx.beginPath()
    for (let i = -2; i <= 2; i++) {
      if (i === 0) continue // Skip center
      const x = i * this.radius * 0.3
      ctx.moveTo(x, -this.radius * 0.05)
      ctx.lineTo(x, this.radius * 0.05)
    }
    ctx.stroke()

    // Glow effect
    ctx.beginPath()
    const gradient = ctx.createRadialGradient(0, this.radius * 0.4, 0, 0, this.radius * 0.4, this.radius * 0.8)
    gradient.addColorStop(0, "rgba(100, 200, 255, 0.5)")
    gradient.addColorStop(1, "rgba(100, 200, 255, 0)")
    ctx.fillStyle = gradient
    ctx.ellipse(0, this.radius * 0.4, this.radius * 0.8, this.radius * 0.2, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  // Method to calculate firing angle towards player ship
  calculateFiringAngle(shipX: number, shipY: number): number {
    // Calculate direction to player
    const dx = shipX - this.x
    const dy = shipY - this.y

    // Base angle towards player
    const baseAngle = Math.atan2(dy, dx)

    // Add some randomness to make it challenging
    // The higher the level, the more accurate the shots
    const randomFactor = Math.PI / 4 // 45 degrees of potential randomness
    const randomAngle = (Math.random() - 0.5) * randomFactor

    return baseAngle + randomAngle
  }
}
