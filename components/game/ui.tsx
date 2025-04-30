export function drawScore(ctx: CanvasRenderingContext2D, score: number, x: number, y: number) {
  ctx.fillStyle = "white"
  ctx.font = "20px Arial"
  ctx.fillText(`${score}`, x, y)
}

export function drawLives(ctx: CanvasRenderingContext2D, lives: number, x: number, y: number) {
  // Draw small ship icons
  const shipSize = 15
  const spacing = 25

  for (let i = 0; i < lives; i++) {
    const shipX = x + 70 + i * spacing
    const shipY = y - 5

    // Draw a small ship icon
    ctx.save()
    ctx.translate(shipX, shipY)
    ctx.rotate(-Math.PI / 2) // Point up

    // Draw ship
    ctx.strokeStyle = "white"
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(shipSize / 2, 0)
    ctx.lineTo(-shipSize / 2, -shipSize / 4)
    ctx.lineTo(-shipSize / 4, 0)
    ctx.lineTo(-shipSize / 2, shipSize / 4)
    ctx.lineTo(shipSize / 2, 0)
    ctx.stroke()
    ctx.closePath()

    ctx.restore()
  }
}

export function drawGameOver(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, score: number) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.75)"
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  ctx.fillStyle = "white"
  ctx.font = "36px Arial"
  ctx.textAlign = "center"
  ctx.fillText("GAME OVER", canvasWidth / 2, canvasHeight / 2 - 40)

  ctx.font = "24px Arial"
  ctx.fillText(`Final Score: ${score}`, canvasWidth / 2, canvasHeight / 2 + 10)
}

export function drawLevelComplete(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  level: number,
) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.75)"
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  ctx.fillStyle = "white"
  ctx.font = "36px Arial"
  ctx.textAlign = "center"
  ctx.fillText(`LEVEL ${level} COMPLETE`, canvasWidth / 2, canvasHeight / 2 - 20)

  ctx.font = "24px Arial"
  ctx.fillText(`Prepare for Level ${level + 1}`, canvasWidth / 2, canvasHeight / 2 + 20)
}
