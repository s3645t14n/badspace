import { CONFIG } from '../../config.js';
import { gravityAt } from '../gravity.js';
import { allBodies } from '../../entities/bodies.js';

export function predictStopPoint(ship, world, dtRealSeconds) {
  const dt = 1;
  const system = world.shipSystem;
  if (system) return null; // Считаем только вне систем

  const capture = world.captureSystem;
  const bodiesList = allBodies(system);

  let { x, y, vx, vy } = ship;
  let stopX = null, stopY = null;

  for (let i = 0; i < 30000; i++) {
    const ca = Math.cos(ship.angle);
    const sa = Math.sin(ship.angle);
    
    const fwd = -CONFIG.physics.accel;
    const tx = ca * fwd;
    const ty = sa * fwd;

    const g1 = gravityAt(x, y, bodiesList);
    vx += (g1.ax + tx) * 0.5 * dt;
    vy += (g1.ay + ty) * 0.5 * dt;
    
    if (!system && capture) {
      const dx = capture.cx - x;
      const dy = capture.cy - y;
      const r = Math.hypot(dx, dy) || 1e-9;
      const t = 1 - Math.min(1, (r - capture.influenceRadius) / (capture.captureRadius - capture.influenceRadius));
      const strength = CONFIG.physics.G * capture.star.mass / (r * r) * t * 0.3;
      vx += (dx / r) * strength * 0.5 * dt;
      vy += (dy / r) * strength * 0.5 * dt;
    }

    x += vx * dt;
    y += vy * dt;

    const g2 = gravityAt(x, y, bodiesList);
    vx += (g2.ax + tx) * 0.5 * dt;
    vy += (g2.ay + ty) * 0.5 * dt;

    if (!system && capture) {
      const dx = capture.cx - x;
      const dy = capture.cy - y;
      const r = Math.hypot(dx, dy) || 1e-9;
      const t = 1 - Math.min(1, (r - capture.influenceRadius) / (capture.captureRadius - capture.influenceRadius));
      const strength = CONFIG.physics.G * capture.star.mass / (r * r) * t * 0.3;
      vx += (dx / r) * strength * 0.5 * dt;
      vy += (dy / r) * strength * 0.5 * dt;
    }

    const speed = Math.hypot(vx, vy);
    if (speed < 0.05) {
      stopX = x;
      stopY = y;
      break;
    }
  }

  return stopX !== null ? { x: stopX, y: stopY } : null;
}
