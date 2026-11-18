import { CONFIG } from '../config.js';
import { camState } from '../camera/cameraState.js';
import { state } from '../core/state.js';

export const dragInput = {
  active: false,
  startX: 0,
  startY: 0,
  mouseStartX: 0,
  mouseStartY: 0,
  main: 0,
  lateral: 0,
};

export function worldToScreen(wx, wy, vp) {
  const dx = wx - camState.x;
  const dy = wy - camState.y;
  const ca = Math.cos(-Math.PI / 2 - camState.angle);
  const sa = Math.sin(-Math.PI / 2 - camState.angle);
  const rx = dx * ca - dy * sa;
  const ry = dx * sa + dy * ca;
  return {
    x: vp.width / 2 + rx * camState.zoom,
    y: vp.height / 2 + ry * camState.zoom,
  };
}

export function bindDrag(canvasEl) {
  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    
    const vp = state.viewport;
    const shipScreen = worldToScreen(state.ship.x, state.ship.y, vp);

    dragInput.active = true;
    dragInput.startX = shipScreen.x;
    dragInput.startY = shipScreen.y;
    dragInput.mouseStartX = e.clientX;
    dragInput.mouseStartY = e.clientY;
    
    dragInput.main = 0;
    dragInput.lateral = 0;
  };

  const onMouseMove = (e) => {
    if (!dragInput.active) return;
    
    const dx = e.clientX - dragInput.mouseStartX;
    const dy = e.clientY - dragInput.mouseStartY;
    const maxDist = 300;

    const dist = Math.hypot(dx, dy);
    let scale = 1;
    if (dist > maxDist) {
      scale = maxDist / dist;
    }

    dragInput.lateral = Math.max(-1, Math.min(1, (dx * scale) / maxDist));
    dragInput.main = Math.max(-1, Math.min(1, (-dy * scale) / maxDist));
  };

  const onMouseUp = () => {
    dragInput.active = false;
    dragInput.main = 0;
    dragInput.lateral = 0;
  };

  canvasEl.addEventListener('contextmenu', (e) => e.preventDefault());
  canvasEl.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

export function drawDragGrid(ctx, ship, vp) {
  if (!dragInput.active) return;

  const cx = dragInput.startX;
  const cy = dragInput.startY;
  const maxDist = 300; 

  ctx.save();

  // Создаем РАДИАЛЬНЫЙ градиент, который будем использовать как маску для всех линий.
  // Чтобы линии не обрывались в случайных местах, мы будем рисовать их с этим градиентом.
  const gridMask = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxDist);
  gridMask.addColorStop(0, 'rgba(120, 200, 255, 0.4)');
  gridMask.addColorStop(0.85, 'rgba(120, 200, 255, 0.15)');
  gridMask.addColorStop(1, 'rgba(120, 200, 255, 0)'); // Плавно истаивает в ноль

  // 1. Сетка
  const step = maxDist * 0.1;
  ctx.strokeStyle = gridMask;
  ctx.lineWidth = 0.5;
  
  for (let i = -10; i <= 10; i++) {
    if (i === 0) continue;
    const offset = i * step;
    
    // Вертикальные линии
    ctx.beginPath();
    ctx.moveTo(cx + offset, cy - maxDist);
    ctx.lineTo(cx + offset, cy + maxDist);
    ctx.stroke();

    // Горизонтальные линии
    ctx.beginPath();
    ctx.moveTo(cx - maxDist, cy + offset);
    ctx.lineTo(cx + maxDist, cy + offset);
    ctx.stroke();
  }

  // 2. Главные оси (чуть ярче)
  const axisMask = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxDist);
  axisMask.addColorStop(0, 'rgba(120, 200, 255, 0.7)');
  axisMask.addColorStop(0.85, 'rgba(120, 200, 255, 0.2)');
  axisMask.addColorStop(1, 'rgba(120, 200, 255, 0)');

  ctx.strokeStyle = axisMask;
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(cx - maxDist, cy); ctx.lineTo(cx + maxDist, cy);
  ctx.moveTo(cx, cy - maxDist); ctx.lineTo(cx, cy + maxDist);
  ctx.stroke();

  // Круглая граница 100% (тоже использует радиальный градиент)
  ctx.strokeStyle = 'rgba(120, 200, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, maxDist, 0, Math.PI * 2);
  ctx.stroke();

  // 3. Вектор газа
  const dx = dragInput.lateral * maxDist;
  const dy = -dragInput.main * maxDist;

  ctx.strokeStyle = 'rgba(127, 255, 212, 0.9)';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + dx, cy + dy);
  ctx.stroke();

  // Точка газа
  ctx.beginPath();
  ctx.arc(cx + dx, cy + dy, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#7fffd4';
  ctx.shadowColor = '#7fffd4';
  ctx.shadowBlur = 12;
  ctx.fill();

  // Центральная точка
  ctx.beginPath();
  ctx.arc(cx, cy, 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fill();

  ctx.restore();
}
