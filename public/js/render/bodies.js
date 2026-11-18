import { CONFIG } from '../config.js';

export function drawBodies(ctx, system, camX, camY, viewport) {
  if (!system) return;

  const m = ctx.getTransform();
  const zoom = Math.max(Math.hypot(m.a, m.b), 1e-6);
  const halfW = (viewport.width / 2) / zoom;
  const halfH = (viewport.height / 2) / zoom;

  const visible = (b, margin) =>
    Math.abs(b.x - camX) < halfW + margin &&
    Math.abs(b.y - camY) < halfH + margin;

  drawOrbits(ctx, system, halfW, halfH, camX, camY);

  if (visible(system.star, system.star.radius * 8)) {
    drawStar(ctx, system.star);
  }

  for (const p of system.planets) {
    if (visible(p, p.hill)) {
      drawHill(ctx, p);
      drawMiniHill(ctx, p);
      drawPlanet(ctx, p);

      for (const moon of p.moons) {
        const px = moon.x - camX;
        const py = moon.y - camY;
        if (Math.abs(px) > halfW + moon.radius) continue;
        if (Math.abs(py) > halfH + moon.radius) continue;
        const r = Math.max(moon.radius, 1 / zoom);
        ctx.fillStyle = moon.color;
        ctx.beginPath();
        ctx.arc(moon.x, moon.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawOrbits(ctx, system, halfW, halfH, camX, camY) {
  ctx.save();
  ctx.strokeStyle = 'rgba(140, 180, 255, 0.12)';
  ctx.lineWidth = 1 / Math.max(
    Math.hypot(ctx.getTransform().a, ctx.getTransform().b), 1e-6
  );
  const diag = Math.hypot(halfW, halfH);
  const dcx = camX - system.cx;
  const dcy = camY - system.cy;
  const d = Math.hypot(dcx, dcy);

  for (const p of system.planets) {
    if (p.orbit + diag < d) continue;
    if (d < p.orbit - diag) continue;
    if (Math.abs(d - p.orbit) > diag) continue;
    ctx.beginPath();
    ctx.arc(system.cx, system.cy, p.orbit, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHill(ctx, p) {
  ctx.save();
  ctx.strokeStyle = 'rgba(120, 200, 255, 0.18)';
  ctx.setLineDash([4, 6]);
  ctx.lineWidth = 1 / Math.max(
    Math.hypot(ctx.getTransform().a, ctx.getTransform().b), 1e-6
  );
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.hill, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawMiniHill(ctx, p) {
  const miniR = p.hill * CONFIG.autopilot.miniHillFraction;
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 220, 80, 0.25)';
  ctx.setLineDash([3, 5]);
  ctx.lineWidth = 1 / Math.max(
    Math.hypot(ctx.getTransform().a, ctx.getTransform().b), 1e-6
  );
  ctx.beginPath();
  ctx.arc(p.x, p.y, miniR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawStar(ctx, s) {
  const grad = ctx.createRadialGradient(s.x, s.y, s.radius * 0.4, s.x, s.y, s.radius * 8);
  grad.addColorStop(0, 'rgba(255, 220, 160, 0.9)');
  grad.addColorStop(0.4, 'rgba(255, 180, 100, 0.35)');
  grad.addColorStop(1, 'rgba(255, 180, 100, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(s.x, s.y, s.radius * 8, 0, Math.PI * 2);
  ctx.fill();

  const core = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius);
  core.addColorStop(0, '#fffbe8');
  core.addColorStop(0.6, s.color);
  core.addColorStop(1, s.color);
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlanet(ctx, p) {
  const dx = p.x;
  const dy = p.y;
  const dist = Math.hypot(dx, dy) || 1;
  const lx = -dx / dist;
  const ly = -dy / dist;

  const base = ctx.createRadialGradient(
    p.x + lx * p.radius, p.y + ly * p.radius, p.radius * 0.1,
    p.x, p.y, p.radius
  );
  base.addColorStop(0, lighten(p.color, 0.35));
  base.addColorStop(1, darken(p.color, 0.55));
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.fill();
}

function parseHsl(str) {
  const m = /hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/.exec(str);
  if (!m) return { h: 200, s: 60, l: 60 };
  return { h: parseFloat(m[1]), s: parseFloat(m[2]), l: parseFloat(m[3]) };
}

function lighten(hsl, k) {
  const { h, s, l } = parseHsl(hsl);
  const nl = Math.min(95, l + (95 - l) * k);
  return `hsl(${h}, ${s}%, ${nl}%)`;
}

function darken(hsl, k) {
  const { h, s, l } = parseHsl(hsl);
  const nl = Math.max(5, l - l * k);
  return `hsl(${h}, ${s}%, ${nl}%)`;
}
