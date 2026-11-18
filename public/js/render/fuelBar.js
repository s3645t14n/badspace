import { CONFIG } from '../config.js';

export function drawFuelBar(ctx, ship, screenX, screenY) {
  const fuel = ship.fuel;
  
  const H = 120;
  const W = 8;
  const x = screenX - 40;
  const y = screenY - H / 2;

  ctx.save();

  ctx.fillStyle = 'rgba(20, 30, 50, 0.7)';
  ctx.fillRect(x - 1, y - 1, W + 2, H + 2);

  const filled = (fuel / CONFIG.fuel.max) * H;
  
  if (fuel > 20) {
    ctx.fillStyle = '#7fffd4';
  } else if (fuel > 0) {
    ctx.fillStyle = '#ffb08a';
  } else {
    ctx.fillStyle = 'rgba(255, 60, 60, 0.8)';
  }
  
  ctx.fillRect(x, y + H - filled, W, filled);

  ctx.strokeStyle = 'rgba(120, 200, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, W - 1, H - 1);

  ctx.fillStyle = 'rgba(200, 220, 255, 0.7)';
  ctx.font = '10px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('FUEL', x + W / 2, y - 4);

  ctx.restore();
}
