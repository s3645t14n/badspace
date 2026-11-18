import { CONFIG } from '../config.js';

export function drawImpulseBar(ctx, ship, screenX, screenY) {
  const impulse = ship.impulse;
  if (impulse <= 0) return;

  const isFull = impulse >= CONFIG.impulse.maxCharge - 0.01;

  const H = 120;
  const W = 8;
  const x = screenX - 40;
  const y = screenY - H / 2;

  ctx.save();

  ctx.fillStyle = 'rgba(20, 30, 50, 0.7)';
  ctx.fillRect(x - 1, y - 1, W + 2, H + 2);

  const filled = (impulse / CONFIG.impulse.maxCharge) * H;
  
  if (isFull) {
    const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 150);
    ctx.fillStyle = `rgba(255, 200, 60, ${pulse})`;
    ctx.shadowColor = 'rgba(255, 200, 60, 0.8)';
    ctx.shadowBlur = 10;
  } else {
    ctx.fillStyle = impulse > 0 ? '#7fffd4' : 'rgba(120, 160, 200, 0.2)';
    ctx.shadowBlur = 0;
  }
  
  ctx.fillRect(x, y + H - filled, W, filled);
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(120, 200, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, W - 1, H - 1);

  ctx.fillStyle = isFull ? '#ffd25a' : 'rgba(200, 220, 255, 0.7)';
  ctx.font = '10px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('BOOST', x + W / 2, y - 4);

  ctx.restore();
}
