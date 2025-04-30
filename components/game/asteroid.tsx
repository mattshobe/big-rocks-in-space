export class Asteroid {
  x: number
  y: number
  size: number
  radius: number
  dx: number
  dy: number
  vertices: number
  offsets: number[]

  constructor(x: number, y: number, size: number, dx: number, dy: number, level = 1) {
    this.x = x
    this.y = y
    this.size = size // 3 = large, 2 = medium, 1 = small
    this.radius = this.size * 20

    // Speed increases with level
    const speedMultiplier = 1 + (level - 1) * 0.2
    this.dx = dx * speedMultiplier
    this.dy = dy * speedMultiplier

    // Create irregular shape
    this.vertices = Math.floor(Math.random() * 3) + 7 // 7-10 vertices
    this.offsets = []

    for (let i = 0; i < this.vertices; i++) {
      this.offsets.push(Math.random() * 0.4 + 0.8) // 0.8-1.2
    }
  }

  update(canvasWidth: number, canvasHeight: number) {
    // Update position
    this.x += this.dx
    this.y += this.dy

    // Screen wrapping
    if (this.x < -this.radius) this.x = canvasWidth + this.radius
    if (this.x > canvasWidth + this.radius) this.x = -this.radius
    if (this.y < -this.radius) this.y = canvasHeight + this.radius
    if (this.y > canvasHeight + this.radius) this.y = -this.radius
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.translate(this.x, this.y)

    // Draw asteroid
    ctx.strokeStyle = "white"
    ctx.lineWidth = 2
    ctx.beginPath()

    for (let i = 0; i < this.vertices; i++) {
      const angle = (i * 2 * Math.PI) / this.vertices
      const r = this.radius * this.offsets[i]
      const x = r * Math.cos(angle)
      const y = r * Math.sin(angle)

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }

    ctx.closePath()
    ctx.stroke()
    ctx.restore()
  }
}
