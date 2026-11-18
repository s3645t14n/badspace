import { CONFIG } from '../config.js';

const MONTH_NAMES_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'мая', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'
];
const TICKS_PER_MONTH = 100000 / 120;

// Цвет от синего к красному по скорости
function speedToColor(t) {
  t = Math.max(0, Math.min(1, t));
  const r = Math.floor(0 + (255 - 0) * t);
  const g = Math.floor(100 + (60 - 100) * t);
  const b = Math.floor(255 + (60 - 255) * t);
  return { r, g, b };
}

export function drawPrediction(ctx, points, currentTick, thrusting, camAngle, stopPoint, inHill, sidePaths, stopDist, showStopCircle, speeds) {
  if (!points || points.length < 3) return;

  const maxPts = CONFIG.prediction.maxPoints;
  const step = Math.max(1, Math.ceil(points.length / maxPts));
  const pts = [];
  const spd = [];
  for (let i = 0; i < points.length; i += step) {
    pts.push(points[i]);
    if (speeds) spd.push(speeds[i]);
  }
  if (pts[pts.length - 1] !== points[points.length - 1]) {
    pts.push(points[points.length - 1]);
    if (speeds) spd.push(speeds[points.length - 1]);
  }
  if (pts.length < 3) return;

  const first = pts[0];
  const last = pts[pts.length - 1];

  if (!Number.isFinite(first.x) || !Number.isFinite(first.y) || 
      !Number.isFinite(last.x) || !Number.isFinite(last.y)) {
    return;
  }

  const m = ctx.getTransform();
  const zoom = Math.max(Math.hypot(m.a, m.b), 1e-6);

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Боковые траектории
  if (sidePaths) {
    for (const path of sidePaths) {
      if (!path || path.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.strokeStyle = 'rgba(255, 150, 150, 0.4)';
      ctx.lineWidth = 1.5 / zoom;
      ctx.setLineDash([4 / zoom, 4 / zoom]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Основная линия (сегментами с градиентом)
  const speedMin = CONFIG.prediction.speedMin || 0.5;
  const speedMax = CONFIG.prediction.speedMax || 8.0;
  const total = pts.length - 1;

  ctx.lineWidth = 3.5 / zoom;

  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    
    const s = spd ? (spd[i] + spd[i - 1]) / 2 : speedMin;
    const t = (s - speedMin) / (speedMax - speedMin);
    const col = speedToColor(t);
    
    // Градиентное истаивание: альфа падает к концу линии.
    const progress = i / total;
    const alpha = (thrusting ? 0.95 : 0.8) * (1 - progress * progress);
    
    ctx.strokeStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${alpha})`;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
  }

  // Засечки месяцев (только не в сфере Хилла)
  if (!inHill) {
    const ticksAhead = CONFIG.prediction.horizon;
    const firstNextMonthTick = Math.ceil((currentTick + 1) / TICKS_PER_MONTH) * TICKS_PER_MONTH;
    const startMonthIndex = 3;
    const startYear = 5027;

    ctx.font = `${12 / zoom}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let tick = firstNextMonthTick; tick <= currentTick + ticksAhead; tick += TICKS_PER_MONTH) {
      const progress = (tick - currentTick) / ticksAhead;
      const ptIndex = progress * (pts.length - 1);
      const i0 = Math.floor(ptIndex);
      const i1 = Math.min(i0 + 1, pts.length - 1);
      if (i0 < 0 || i0 >= pts.length - 1) continue;
      
      const k = ptIndex - i0;
      const px = pts[i0].x + (pts[i1].x - pts[i0].x) * k;
      const py = pts[i0].y + (pts[i1].y - pts[i0].y) * k;
      
      const dx = pts[i1].x - pts[i0].x;
      const dy = pts[i1].y - pts[i0].y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      
      const tickSize = 6 / zoom;
      
      ctx.beginPath();
      ctx.moveTo(px - nx * tickSize, py - ny * tickSize);
      ctx.lineTo(px + nx * tickSize, py + ny * tickSize);
      ctx.strokeStyle = `rgba(255, 100, 100, ${0.5 * (1 - progress)})`;
      ctx.lineWidth = 2 / zoom;
      ctx.stroke();

      const monthsTotal = Math.floor(tick / TICKS_PER_MONTH);
      const mIndex = (startMonthIndex + monthsTotal) % 12;
      const year = startYear + Math.floor((startMonthIndex + monthsTotal) / 12);
      
      const monthStr = MONTH_NAMES_SHORT[mIndex];
      const yearStr = String(year).slice(-2);
      const label = `${monthStr} ${yearStr}`;
      
      ctx.save();
      ctx.translate(px + (12 / zoom), py);
      ctx.rotate(Math.PI / 2 + camAngle);
      ctx.fillStyle = `rgba(255, 180, 180, ${0.6 * (1 - progress)})`;
      ctx.fillText(label, 0, 0);
      ctx.restore();
    }
  }

  // Окружность остановки (STOP) — только если showStopCircle
  if (showStopCircle) {
    const radius = stopPoint ? Math.hypot(stopPoint.x - first.x, stopPoint.y - first.y) : stopDist;

    if (radius > 0.1 && Number.isFinite(radius)) {
      ctx.beginPath();
      ctx.arc(first.x, first.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 80, 80, 0.4)';
      ctx.lineWidth = 1.5 / zoom;
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 80, 80, 0.7)';
      ctx.font = `bold ${10 / zoom}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const numLabels = 12;
      for (let i = 0; i < numLabels; i++) {
        const angle = (i / numLabels) * Math.PI * 2;
        const tx = first.x + Math.cos(angle) * radius;
        const ty = first.y + Math.sin(angle) * radius;
        
        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(Math.PI / 2 + camAngle); 
        ctx.fillText('STOP', 0, 0);
        ctx.restore();
      }
    }
  }

  // Стоп-точка — отображается ВСЕГДА (в системе и в пустоте), если не в сфере Хилла и есть stopPoint.
  if (stopPoint && !inHill) {
    ctx.beginPath();
    ctx.arc(stopPoint.x, stopPoint.y, 5 / zoom, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 80, 80, 0.9)';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2 / zoom;
    ctx.stroke();
  }

  ctx.restore();
}
