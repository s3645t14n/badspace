import { CONFIG } from '../config.js';

// Оценивает эффективность гравитационного маневра для каждой планеты.
// Возвращает массив { planet, score, dvEst }.
export function analyzeGravityAssists(ship, system) {
  if (!system) return [];
  
  const assists = [];
  const G = CONFIG.physics.G;
  const starMass = system.star.mass;

  for (const p of system.planets) {
    // 1. Орбитальная скорость планеты (v_orbit)
    // В нашей модели планета движется по кругу, v = omega * orbit
    const vOrbit = p.omega * p.orbit;
    
    // 2. Относительная скорость корабля и планеты
    const rvx = ship.vx - p.vx;
    const rvy = ship.vy - p.vy;
    const vRel = Math.hypot(rvx, rvy);
    
    // 3. Оценка прироста скорости (максимум - 2 * v_orbit)
    // Идеальный манёвр: влететь так, чтобы вылететь по направлению планеты.
    // Прирост зависит от угла отклонения. Если vRel мала, прирост большой,
    // если vRel огромная, прирост маленький.
    
    // Грубая формула: эффективность = vOrbit / vRel (чем медленнее летишь относительно планеты, тем лучше)
    // Но если vRel -> 0, ты просто падаешь на планету. Нужна средняя скорость.
    
    // Возьмем прицельный параметр = 0.5 * hill
    const b = p.hill * 0.5;
    const mu = G * p.mass;
    
    // Угол отклонения (упрощенно для гиперболы):
    // sin(delta/2) = 1 / sqrt(1 + (b * vRel^2 / mu)^2)
    // Но это работает для малых масс.
    
    // Упростим: чем больше mu / (b * vRel^2), тем сильнее поворот.
    const deflectionParam = mu / (b * vRel * vRel + 1e-9);
    const delta = 2 * Math.asin(Math.min(1, 1 / Math.sqrt(1 + deflectionParam * deflectionParam)));
    
    // Прирост скорости (в системе звезды)
    // dv = 2 * vRel * sin(delta/2)
    // Но это в системе планеты. В системе звезды нужно добавить vOrbit.
    
    // Оценка прироста в системе звезды (очень грубо):
    const dvEst = 2 * vRel * Math.sin(delta / 2) * (vOrbit / (vRel + 1e-9));
    
    // Нормируем в 0..1 для отображения (например, dvEst от 0 до 5)
    const score = Math.min(1, dvEst / 5.0);
    
    assists.push({
      planet: p,
      score: score,
      dvEst: dvEst,
    });
  }
  
  return assists;
}
