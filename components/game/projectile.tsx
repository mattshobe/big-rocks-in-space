export class Projectile {
  x: number
  y: number
  dx: number
  dy: number
  radius: number
  lifespan: number

  constructor(x: number, y: number, dx: number, dy: number) {
    this.x = x
    this.y = y
    this.dx = dx
    this.dy = dy
    this.radius = 2
    this.lifespan = 100 // Frames before disappearing
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
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "white"
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fill()
  }
}
