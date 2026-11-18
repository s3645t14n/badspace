import { CONFIG } from '../config.js';
import { gamepadInput } from '../input/gamepad.js';

export function drawShip(ctx, ship, input) {
  const m = ctx.getTransform();
  const zoom = Math.max(Math.hypot(m.a, m.b), 1e-6);

  const worldPx = ship.radius * zoom;
  const s = Math.max(1, CONFIG.ship.minScreenRadius / worldPx);

  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  ctx.scale(s, s);

  const r = ship.radius;
  const tMain = ship.throttleMain;
  const tLat  = ship.throttleLateral;

  // Проверка форсажа: клавиатура (пробел/ctrl) или геймпад (курки)
  const boostPressed = input.boostForward || input.boostReverse || gamepadInput.thrust || gamepadInput.reverse;
  const isBoost = boostPressed && ship.fuel > 0;
  const boostMult = isBoost ? CONFIG.fuel.boostMultiplier : 1.0;

  if (Math.abs(tMain) > 0.03) {
    const flameLen = (14 + Math.random() * 6) * Math.abs(tMain) * boostMult;
    const grad = ctx.createLinearGradient(-r, 0, -r - flameLen, 0);
    
    if (tMain > 0) {
      if (isBoost) {
        grad.addColorStop(0,   'rgba(255, 255, 200, 1.0)');
        grad.addColorStop(0.4, 'rgba(120, 220, 255, 0.9)');
        grad.addColorStop(1,   'rgba(80, 160, 255, 0)');
      } else {
        grad.addColorStop(0,   'rgba(120, 220, 255, 0.95)');
        grad.addColorStop(0.5, 'rgba(80, 160, 255, 0.6)');
        grad.addColorStop(1,   'rgba(80, 160, 255, 0)');
      }
    } else {
      if (isBoost) {
        grad.addColorStop(0,   'rgba(255, 200, 200, 1.0)');
        grad.addColorStop(0.4, 'rgba(255, 120, 80, 0.9)');
        grad.addColorStop(1,   'rgba(255, 120, 80, 0)');
      } else {
        grad.addColorStop(0,   'rgba(255, 180, 120, 0.95)');
        grad.addColorStop(0.5, 'rgba(255, 120, 80, 0.6)');
        grad.addColorStop(1,   'rgba(255, 120, 80, 0)');
      }
    }
    
    const w = 4 * Math.abs(tMain) * (isBoost ? 1.5 : 1) + 1;
    ctx.beginPath();
    ctx.moveTo(-r + 2, -w);
    ctx.lineTo(-r - flameLen, 0);
    ctx.lineTo(-r + 2, w);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }

  if (Math.abs(tLat) > 0.03) {
    const flameLen = (10 + Math.random() * 6) * Math.abs(tLat);
    const side = tLat > 0 ? -1 : 1;
    const grad = ctx.createLinearGradient(0, side * r, 0, side * (r + flameLen));
    grad.addColorStop(0,   'rgba(255, 220, 120, 0.95)');
    grad.addColorStop(0.5, 'rgba(255, 180, 80, 0.6)');
    grad.addColorStop(1,   'rgba(255, 180, 80, 0)');

    const w = 3 * Math.abs(tLat) + 1;
    ctx.beginPath();
    ctx.moveTo(-w, side * (r - 1));
    ctx.lineTo(0,  side * (r + flameLen));
    ctx.lineTo(w,  side * (r - 1));
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }

  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(-r * 0.75, -r * 0.7);
  ctx.lineTo(-r * 0.4, 0);
  ctx.lineTo(-r * 0.75, r * 0.7);
  ctx.closePath();

  const bodyGrad = ctx.createLinearGradient(-r, 0, r, 0);
  bodyGrad.addColorStop(0, '#1e3a5f');
  bodyGrad.addColorStop(1, '#9fd9ff');
  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = '#cfefff';
  ctx.lineWidth = 1.5;
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(r * 0.15, 0, r * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = '#7fffd4';
  ctx.shadowColor = '#7fffd4';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore();
}
