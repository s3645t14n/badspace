import { CONFIG } from '../../config.js';

export function predictSideTrajectories(ship, world, stopDistance) {
  const dt = 1;
  const system = world.shipSystem;
  
  if (system) return null;

  const ca = Math.cos(ship.angle);
  const sa = Math.sin(ship.angle);
  const rx = -sa, ry = ca;

  const maxLat = CONFIG.physics.lateralAccel;
  
  // Считаем, сколько тиков нужно, чтобы пройти stopDistance с текущей скоростью.
  // Скорость = расстояние / время -> время = расстояние / скорость.
  const speed = Math.hypot(ship.vx, ship.vy) || 0.1;
  const timeToTravel = stopDistance / speed;
  
  // Берем с запасом в 2 раза (чтобы учесть боковое ускорение, которое замедляет продвижение вперед)
  // и ограничиваем максимум 30000 тиков, чтобы не фризить при бесконечно малой скорости.
  const maxTicks = Math.min(30000, Math.ceil(timeToTravel * 2) + 100);

  const makePath = (latDir) => {
    let x = ship.x, y = ship.y, vx = ship.vx, vy = ship.vy;
    const tx = rx * maxLat * latDir; 
    const ty = ry * maxLat * latDir;
    
    const pts = [];
    for (let i = 0; i < maxTicks; i++) {
      vx += tx * dt;
      vy += ty * dt;
      x += vx * dt;
      y += vy * dt;
      
      if (i % 20 === 0) pts.push({ x, y });
      
      if (Math.hypot(x - ship.x, y - ship.y) >= stopDistance) {
        pts.push({ x, y });
        break;
      }
    }
    
    // Если цикл закончился, но мы не дошли до дистанции (например, лимит итераций), 
    // добавляем последнюю точку.
    if (pts.length > 0 && pts[pts.length - 1].x !== x) {
      pts.push({ x, y });
    }
    
    return pts;
  };

  return [ makePath(1), makePath(-1) ];
}
