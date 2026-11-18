import { CONFIG } from '../config.js';

// Рисует гравитационный колодец у звезды.
// Звезда статична, поэтому "праща" тут работает как изменение направления.
// Главное - показать, что если пролететь близко, можно сильно изменить траекторию.
export function drawStarGravityWell(ctx, star, ship, zoom) {
  const starRadius = star.radius;
  const hill = starRadius * 10; // Условная зона влияния

  // --- 1. Концентрические кольца (колодец) ---
  const rings = [1.5, 2.5, 4.0, 6.0, 8.0];
  ctx.save();
  
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = starRadius * rings[i];
    const alpha = 0.03 + 0.08 * (1 - i / rings.length);
    
    ctx.beginPath();
    ctx.arc(star.x, star.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 220, 160, ${alpha})`;
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([4 / zoom, 8 / zoom]);
    ctx.stroke();
  }
  ctx.restore();

  // --- 2. Оптимальные линии захода (квадратичные кривые) ---
  // У звезды нет направления движения, поэтому мы рисуем линии, которые 
  // показывают, как гравитация "закручивает" траекторию вокруг неё.
  // Мы используем текущую скорость корабля, чтобы понять, откуда он летит.
  
  const shipDir = Math.atan2(ship.vy, ship.vx);
  
  // Рисуем пучок траекторий, которые огибают звезду.
  // Центральная линия - та, что проходит через текущий вектор скорости.
  const numLines = 7;
  ctx.save();

  for (let i = 0; i < numLines; i++) {
    const angleOffset = (i - (numLines - 1) / 2) * 0.3; // Сдвиг угла
    const inAngle = shipDir + Math.PI + angleOffset; // Откуда летим
    const outAngle = shipDir + angleOffset; // Куда вылетим (примерно)

    const trailLen = starRadius * 8;

    // Точка входа
    const startX = star.x + Math.cos(inAngle) * trailLen;
    const startY = star.y + Math.sin(inAngle) * trailLen;
    
    // Точка выхода
    const endX = star.x + Math.cos(outAngle) * trailLen;
    const endY = star.y + Math.sin(outAngle) * trailLen;

    // Контрольная точка (сбоку, чтобы имитировать огибание)
    const ctrlDist = starRadius * 2.5;
    const ctrlAngle = inAngle + (angleOffset > 0 ? -Math.PI / 2 : Math.PI / 2);
    const ctrlX = star.x + Math.cos(ctrlAngle) * ctrlDist;
    const ctrlY = star.y + Math.sin(ctrlAngle) * ctrlDist;

    const isOptimal = (i === Math.floor(numLines / 2));

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);

    if (isOptimal) {
      ctx.strokeStyle = 'rgba(255, 220, 80, 0.5)';
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = 'rgba(255, 200, 100, 0.15)';
      ctx.lineWidth = 1 / zoom;
      ctx.setLineDash([2 / zoom, 6 / zoom]);
    }
    ctx.stroke();
  }

  ctx.restore();
}
