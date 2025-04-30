export class AsteroidFragment {
  x: number
  y: number
  dx: number
  dy: number
  angle: number
  rotationSpeed: number
  length: number
  lifespan: number
  maxLifespan: number
  color: string

  constructor(x: number, y: number, length: number, angle: number, dx: number, dy: number) {
    this.x = x
    this.y = y
    this.length = length
    this.angle = angle

    // Add some randomness to the movement
    const speed = Math.random() * 1.5 + 0.5
    this.dx = dx + (Math.random() - 0.5) * 2
    this.dy = dy + (Math.random() - 0.5) * 2

    // Add rotation
    this.rotationSpeed = (Math.random() - 0.5) * 0.2

    // Set lifespan
    this.maxLifespan = 60 // Frames before disappearing
    this.lifespan = this.maxLifespan

    // Color (white with slight variations)
    const brightness = Math.floor(Math.random() * 55) + 200 // 200-255
    this.color = `rgb(${brightness}, ${brightness}, ${brightness})`
  }

  update() {
    // Update position
    this.x += this.dx
    this.y += this.dy

    // Update rotation
    this.angle += this.rotationSpeed

    // Slow down over time
    this.dx *= 0.98
    this.dy *= 0.98

    // Decrease lifespan
    this.lifespan--
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.lifespan <= 0) return

    // Calculate alpha based on remaining lifespan
    const alpha = this.lifespan / this.maxLifespan

    // Calculate endpoints of the line segment
    const halfLength = this.length / 2
    const x1 = this.x + Math.cos(this.angle) * halfLength
    const y1 = this.y + Math.sin(this.angle) * halfLength
    const x2 = this.x - Math.cos(this.angle) * halfLength
    const y2 = this.y - Math.sin(this.angle) * halfLength

    // Draw the line segment
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.strokeStyle = this.color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
    ctx.restore()
  }
}

export function createAsteroidFragments(
  x: number,
  y: number,
  radius: number,
  vertices: number,
  offsets: number[],
  dx: number,
  dy: number,
): AsteroidFragment[] {
  const fragments: AsteroidFragment[] = []

  // Create fragments from each edge of the asteroid
  for (let i = 0; i < vertices; i++) {
    const angle1 = (i * 2 * Math.PI) / vertices
    const angle2 = ((i + 1) * 2 * Math.PI) / vertices

    const r1 = radius * offsets[i]
    const r2 = radius * offsets[(i + 1) % vertices]

    const x1 = x + r1 * Math.cos(angle1)
    const y1 = y + r1 * Math.sin(angle1)
    const x2 = x + r2 * Math.cos(angle2)
    const y2 = y + r2 * Math.sin(angle2)

    // Calculate length and angle of this edge
    const edgeLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
    const edgeAngle = Math.atan2(y2 - y1, x2 - x1)

    // Create a fragment at the midpoint of the edge
    const midX = (x1 + x2) / 2
    const midY = (y1 + y2) / 2

    fragments.push(new AsteroidFragment(midX, midY, edgeLength, edgeAngle, dx, dy))
  }

  return fragments
}
