export function drawThrottleIndicator(ctx, ship, vp) {
  const x = 60;
  const y = vp.height - 60;
  const size = 40; // Половина размера крестовины

  ctx.save();

  // Фон
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(x - size - 10, y - size - 10, size * 2 + 20, size * 2 + 20);

  // Оси
  ctx.strokeStyle = 'rgba(120, 200, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - size, y); ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size); ctx.lineTo(x, y + size);
  ctx.stroke();

  // Текущая точка (throttleLateral по X, throttleMain по Y)
  const px = x + ship.throttleLateral * size;
  const py = y - ship.throttleMain * size;

  // Линии от центра до точки
  ctx.strokeStyle = 'rgba(127, 255, 212, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(px, py);
  ctx.stroke();

  // Точка
  ctx.beginPath();
  ctx.arc(px, py, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#7fffd4';
  ctx.shadowColor = '#7fffd4';
  ctx.shadowBlur = 10;
  ctx.fill();

  ctx.restore();
}
