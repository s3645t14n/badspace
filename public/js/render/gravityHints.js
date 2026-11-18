import { CONFIG } from '../config.js';

// Рисует индикаторы гравитационного маневра рядом с планетами.
export function drawGravityHints(ctx, assists, camX, camY, zoom) {
  if (!assists) return;

  for (const a of assists) {
    const p = a.planet;
    
    // Проверяем, видна ли планета на экране
    const dx = p.x - camX;
    const dy = p.y - camY;
    if (Math.abs(dx) > (window.innerWidth / 2) / zoom + 50) continue;
    if (Math.abs(dy) > (window.innerHeight / 2) / zoom + 50) continue;
    
    // Размер иконки в мировых единицах (чтобы был виден при любом зуме)
    const iconSize = 12 / zoom;
    const x = p.x + p.radius + 8 / zoom; // справа от планеты
    const y = p.y - p.radius;

    // Цвет от серого к зелёному (по score)
    const s = a.score;
    const r = Math.floor(100 + (0 - 100) * s);
    const g = Math.floor(100 + (255 - 100) * s);
    const b = Math.floor(100 + (0 - 100) * s);
    
    ctx.save();
    
    // Фон иконки (полупрозрачный круг)
    ctx.beginPath();
    ctx.arc(x, y, iconSize, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.2)`;
    ctx.fill();
    
    // Обводка
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
    ctx.lineWidth = 1.5 / zoom;
    ctx.stroke();
    
    // Стрелка (направление манёвра)
    if (s > 0.1) {
      ctx.beginPath();
      ctx.moveTo(x - iconSize * 0.4, y);
      ctx.lineTo(x + iconSize * 0.4, y);
      ctx.lineTo(x + iconSize * 0.1, y - iconSize * 0.3);
      ctx.moveTo(x + iconSize * 0.4, y);
      ctx.lineTo(x + iconSize * 0.1, y + iconSize * 0.3);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.9)`;
      ctx.lineWidth = 1.5 / zoom;
      ctx.stroke();
    }
    
    // Текст (просто число dvEst)
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.9)`;
    ctx.font = `${10 / zoom}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(a.dvEst.toFixed(1), x, y + iconSize * 1.8);
    
    ctx.restore();
  }
}
