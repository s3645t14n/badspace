import { CONFIG } from '../config.js';

export function drawDistantSystems(ctx, world, camX, camY, viewport, nearestSys) {
  const m = ctx.getTransform();
  const zoom = Math.max(Math.hypot(m.a, m.b), 1e-6);
  const halfW = (viewport.width / 2) / zoom;
  const halfH = (viewport.height / 2) / zoom;

  // Галактическая орбита — ТОЛЬКО для ближайшей системы.
  if (nearestSys) {
    const gcX = CONFIG.galaxy.centerX;
    const gcY = CONFIG.galaxy.centerY;
    const R = nearestSys.galR;
    const offset = 2.0 / zoom;

    ctx.save();
    // Внешняя (синяя)
    ctx.strokeStyle = 'rgba(60, 140, 255, 0.4)';
    ctx.lineWidth = 1.5 / zoom;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(gcX, gcY, R + offset, 0, Math.PI * 2);
    ctx.stroke();

    // Внутренняя (красная)
    ctx.strokeStyle = 'rgba(255, 60, 60, 0.4)';
    ctx.beginPath();
    ctx.arc(gcX, gcY, R - offset, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Все остальные системы.
  for (const sys of world.systems.values()) {
    if (!sys) continue;
    if (sys === world.shipSystem) continue;

    const dx = sys.cx - camX;
    const dy = sys.cy - camY;
    if (Math.abs(dx) > halfW + sys.influenceRadius) continue;
    if (Math.abs(dy) > halfH + sys.influenceRadius) continue;

    ctx.save();
    ctx.strokeStyle = 'rgba(140, 180, 255, 0.06)';
    ctx.lineWidth = 1 / zoom;
    for (const p of sys.planets) {
      ctx.beginPath();
      ctx.arc(sys.cx, sys.cy, p.orbit, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    drawStarDot(ctx, sys.star, zoom);

    for (const p of sys.planets) {
      const px = p.x - camX;
      const py = p.y - camY;
      if (Math.abs(px) > halfW + p.radius) continue;
      if (Math.abs(py) > halfH + p.radius) continue;
      const r = Math.max(p.radius, 1.5 / zoom);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();

      for (const moon of p.moons) {
        const mx = moon.x - camX;
        const my = moon.y - camY;
        if (Math.abs(mx) > halfW + moon.radius) continue;
        if (Math.abs(my) > halfH + moon.radius) continue;
        const mr = Math.max(moon.radius, 0.8 / zoom);
        ctx.fillStyle = moon.color;
        ctx.beginPath();
        ctx.arc(moon.x, moon.y, mr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawStarDot(ctx, s, zoom) {
  const glowR = Math.max(s.radius * 2, 10 / zoom);
  const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowR);
  grad.addColorStop(0, s.color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(s.x, s.y, glowR, 0, Math.PI * 2);
  ctx.fill();
  const coreR = Math.max(s.radius, 2 / zoom);
  ctx.fillStyle = s.color;
  ctx.beginPath();
  ctx.arc(s.x, s.y, coreR, 0, Math.PI * 2);
  ctx.fill();
}
