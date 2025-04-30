export function checkCollision(obj1: any, obj2: any) {
  // Return false if either object is undefined or null
  if (!obj1 || !obj2) return false

  const dx = obj1.x - obj2.x
  const dy = obj1.y - obj2.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  return distance < obj1.radius + obj2.radius
}
