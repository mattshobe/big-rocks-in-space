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

    // Draw football-shaped alien ship
    ctx.strokeStyle = "white"
    ctx.lineWidth = 2

    // Main football-shaped body
    ctx.beginPath()
    ctx.ellipse(0, 0, this.radius, this.radius / 2, 0, 0, Math.PI * 2)
    ctx.stroke()

    // Glass canopy bulge on one side
    ctx.beginPath()
    ctx.ellipse(this.radius / 2, 0, this.radius / 3, this.radius / 4, 0, 0, Math.PI * 2)
    ctx.strokeStyle = "#8af"
    ctx.stroke()

    // Canopy reflection
    ctx.beginPath()
    ctx.ellipse(this.radius / 2, -this.radius / 8, this.radius / 6, this.radius / 10, 0, 0, Math.PI)
    ctx.strokeStyle = "white"
    ctx.stroke()

    // Bottom details
    ctx.beginPath()
    ctx.moveTo(-this.radius + 5, this.radius / 3)
    ctx.lineTo(this.radius - 5, this.radius / 3)
    ctx.stroke()

    ctx.restore()
  }
}
