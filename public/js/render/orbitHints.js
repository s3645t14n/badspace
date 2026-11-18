import { CONFIG } from '../config.js';

export function circularSpeed(planetMass, r) {
  const G = CONFIG.physics.G;
  const soft2 = CONFIG.physics.softening ** 2;
  const r2 = r * r;
  return Math.sqrt((G * planetMass * r2) / Math.pow(r2 + soft2, 1.5));
}

export function drawOrbitHints(ctx, ship, planet, system) {
  const m = ctx.getTransform();
  const zoom = Math.max(Math.hypot(m.a, m.b), 1e-6);

  // Нормаль к орбите (белая пунктирная)
  const angleToShip = Math.atan2(ship.y - system.cy, ship.x - system.cx);
  const targetX = system.cx + Math.cos(angleToShip) * planet.orbit;
  const targetY = system.cy + Math.sin(angleToShip) * planet.orbit;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y);
  ctx.lineTo(targetX, targetY);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1.5 / zoom;
  ctx.setLineDash([4 / zoom, 4 / zoom]);
  ctx.stroke();
  ctx.restore();

  // Остальная логика стрелок
  const rx = ship.x - planet.x;
  const ry = ship.y - planet.y;
  const r = Math.hypot(rx, ry) || 1e-9;
  const ux = rx / r;
  const uy = ry / r;

  const rvx = ship.vx - planet.vx;
  const rvy = ship.vy - planet.vy;

  const vCirc = circularSpeed(planet.mass, r);

  const vTanProj = rvx * (-uy) + rvy * ux;
  const sign = vTanProj >= 0 ? 1 : -1;
  const tvx = -uy * sign;
  const tvy =  ux * sign;

  const cvx = tvx * vCirc;
  const cvy = tvy * vCirc;
  const dvx = cvx - rvx;
  const dvy = cvy - rvy;

  const pixelLen = 60 / zoom;
  const scale = vCirc > 1e-9 ? pixelLen / vCirc : 0;
  const minLenPx = 18 / zoom;

  drawArrow(ctx, ship.x, ship.y, rvx, rvy, scale, minLenPx, 'rgba(255, 90, 90, 0.95)', zoom);
  drawArrow(ctx, ship.x, ship.y, cvx, cvy, scale, minLenPx, 'rgba(90, 255, 130, 0.95)', zoom);
  drawArrow(ctx, ship.x, ship.y, dvx, dvy, scale, minLenPx, 'rgba(255, 220, 80, 0.95)', zoom);
}

function drawArrow(ctx, x0, y0, vx, vy, scale, minLen, color, zoom) {
  let dx = vx * scale;
  let dy = vy * scale;
  let len = Math.hypot(dx, dy);

  const vLen = Math.hypot(vx, vy);
  if (vLen < 1e-9) return;

  if (len < minLen) {
    const ux = dx / len;
    const uy = dy / len;
    dx = ux * minLen;
    dy = uy * minLen;
    len = minLen;
  }

  const ux = dx / len;
  const uy = dy / len;
  const x1 = x0 + dx;
  const y1 = y0 + dy;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5 / zoom;
  ctx.lineCap = 'round';

  ctx.setLineDash([6 / zoom, 4 / zoom]);
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.setLineDash([]);

  const headLen = 10 / zoom;
  const headW = 6 / zoom;
  const bx = x1 - ux * headLen;
  const by = y1 - uy * headLen;
  const px = -uy * headW;
  const py =  ux * headW;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(bx + px, by + py);
  ctx.lineTo(bx - px, by - py);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
