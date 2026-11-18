import { CONFIG } from '../config.js';

export function drawAutopilotUI(ctx, vp, state, now) {
  const ap = state.autopilot;
  const cx = vp.width / 2;
  const cy = vp.height / 2;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (ap.charge > 0 && !ap.ready) {
    const left = CONFIG.autopilot.chargeTime - ap.charge;
    ctx.font = 'bold 64px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(120, 200, 255, 0.9)';
    ctx.shadowColor = 'rgba(120, 200, 255, 0.9)';
    ctx.shadowBlur = 20;
    ctx.fillText(left.toFixed(3) + ' с', cx, cy - 100);
    ctx.shadowBlur = 0;
    ctx.font = '16px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(180, 220, 255, 0.7)';
    ctx.fillText('ЗАРЯДКА АВТОПИЛОТА', cx, cy - 60);
  }

  if (ap.ready && !ap.active) {
    const pulse = 0.6 + 0.4 * Math.sin(now / 200);
    ctx.font = 'bold 28px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = `rgba(255, 220, 80, ${pulse})`;
    ctx.shadowColor = 'rgba(255, 220, 80, 0.9)';
    ctx.shadowBlur = 15;
    ctx.fillText('[ ПРОБЕЛ — АВТОПАРКОВКА ]', cx, cy - 100);
    ctx.shadowBlur = 0;
  }

  if (ap.active) {
    const blink = 0.5 + 0.5 * Math.sin(now / 180);
    ctx.font = 'bold 56px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = `rgba(120, 255, 160, ${0.4 + 0.6 * blink})`;
    ctx.shadowColor = 'rgba(120, 255, 160, 1)';
    ctx.shadowBlur = 25;
    ctx.fillText('АВТОПАРКОВКА', cx, cy - 100);
    ctx.shadowBlur = 0;
    ctx.font = '16px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(180, 255, 200, 0.8)';
    ctx.fillText('отпустите ПРОБЕЛ для выхода', cx, cy - 60);
  }

  ctx.restore();
}
