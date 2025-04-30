export class ExplosionParticle {
  x: number
  y: number
  dx: number
  dy: number
  radius: number
  color: string
  lifespan: number
  maxLifespan: number

  constructor(x: number, y: number, color: string) {
    this.x = x
    this.y = y
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 3 + 1
    this.dx = Math.cos(angle) * speed
    this.dy = Math.sin(angle) * speed
    this.radius = Math.random() * 3 + 2
    this.color = color
    this.maxLifespan = 60 // Frames before disappearing
    this.lifespan = this.maxLifespan
  }

  update() {
    this.x += this.dx
    this.y += this.dy
    this.lifespan--
    // Slow down over time
    this.dx *= 0.98
    this.dy *= 0.98
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Fade out as lifespan decreases
    const alpha = this.lifespan / this.maxLifespan
    ctx.globalAlpha = alpha
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1.0
  }
}

export function createExplosion(x: number, y: number, count: number): ExplosionParticle[] {
  const particles: ExplosionParticle[] = []
  const colors = ["#ff0000", "#ff3300", "#ff6600", "#ff9900", "#ffcc00"] // Red to orange gradient

  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)]
    particles.push(new ExplosionParticle(x, y, color))
  }

  return particles
}
