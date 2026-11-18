import { CONFIG } from '../config.js';

// Ускорение от всех тел в точке (px, py). Мягкий потенциал гасит
// сингулярность в центре: r² заменяется на r² + ε².
export function gravityAt(px, py, bodiesList) {
  const { G, softening } = CONFIG.physics;
  const eps2 = softening * softening;

  let ax = 0;
  let ay = 0;

  for (const b of bodiesList) {
    const dx = b.x - px;
    const dy = b.y - py;
    const r2 = dx * dx + dy * dy + eps2;
    const invR = 1 / Math.sqrt(r2);
    const invR3 = invR * invR * invR;
    const k = G * b.mass * invR3;
    ax += dx * k;
    ay += dy * k;
  }

  return { ax, ay };
}

// Velocity Verlet для одной частицы под действием гравитации + внешней тяги.
// Возвращает новое состояние {x,y,vx,vy}.
export function verletStep(x, y, vx, vy, ax, ay, thrustX, thrustY, dt) {
  const halfDt = 0.5 * dt;
  // Полушаг по скорости с текущим ускорением.
  const vxHalf = vx + (ax + thrustX) * halfDt;
  const vyHalf = vy + (ay + thrustY) * halfDt;
  // Полный шаг по позиции.
  const nx = x + vxHalf * dt;
  const ny = y + vyHalf * dt;
  return { x: nx, y: ny, vx: vxHalf, vy: vyHalf };
}
