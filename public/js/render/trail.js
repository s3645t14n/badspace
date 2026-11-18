// Рисует трейл — след из последних позиций корабля.
// Точки в мировых координатах. Толщина и альфа постоянны на экране
// (делим на зум), цвет — бирюзовый, гаснет к «хвосту».
export function drawTrail(ctx, points) {
  if (!points || points.length < 2) return;

  const m = ctx.getTransform();
  const zoom = Math.max(Math.hypot(m.a, m.b), 1e-6);
  const lw = 2 / zoom;

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = lw;

  // Разбиваем на сегменты — каждый со своей альфой.
  // Чем ближе к «хвосту» (началу массива), тем прозрачнее.
  const n = points.length - 1;
  const CHUNK = 8;

  for (let start = 0; start < n; start += CHUNK) {
    const end = Math.min(start + CHUNK, n);
    const tMid = (start + end) / (2 * n);
    const alpha = 0.65 * tMid; // 0 у хвоста, 0.65 у носа

    ctx.strokeStyle = `rgba(127, 255, 212, ${alpha})`;
    ctx.beginPath();
    ctx.moveTo(points[start].x, points[start].y);
    for (let i = start + 1; i <= end; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  }

  ctx.restore();
}
