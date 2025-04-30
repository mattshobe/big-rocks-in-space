export class Ship {
  x: number
  y: number
  radius: number
  angle: number
  dx: number
  dy: number
  thrusting: boolean
  thrustPower: number
  friction: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    this.radius = 15
    this.angle = -Math.PI / 2 // Point up by default
    this.dx = 0
    this.dy = 0
    this.thrusting = false
    this.thrustPower = 0.1
    this.friction = 0.98
  }

  rotate(angle: number) {
    this.angle += angle
  }

  thrust() {
    this.thrusting = true
    this.dx += Math.cos(this.angle) * this.thrustPower
    this.dy += Math.sin(this.angle) * this.thrustPower
  }

  stopThrust() {
    this.thrusting = false
  }

  update(canvasWidth: number, canvasHeight: number) {
    // Apply friction
    this.dx *= this.friction
    this.dy *= this.friction

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
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)

    // Draw ship
    ctx.strokeStyle = "white"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(this.radius, 0)
    ctx.lineTo(-this.radius, -this.radius / 2)
    ctx.lineTo(-this.radius / 2, 0)
    ctx.lineTo(-this.radius, this.radius / 2)
    ctx.lineTo(this.radius, 0)
    ctx.stroke()
    ctx.closePath()

    // Draw thrust
    if (this.thrusting) {
      ctx.beginPath()
      ctx.moveTo(-this.radius, 0)
      ctx.lineTo(-this.radius - 5, 0)
      ctx.lineTo(-this.radius - Math.random() * 10, Math.random() * 5 - 2.5)
      ctx.lineTo(-this.radius - 5, 0)
      ctx.strokeStyle = "orange"
      ctx.stroke()
      ctx.closePath()
    }

    ctx.restore()
  }
}
