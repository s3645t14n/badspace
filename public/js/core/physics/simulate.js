import { CONFIG } from '../../config.js';
import { gravityAt } from '../gravity.js';
import { allBodies, dominantBody } from '../../entities/bodies.js';
import { dragInput } from '../../input/dragInput.js';
import { gamepadInput } from '../../input/gamepad.js';

export function simulateTick(state, input, dtRealSeconds) {
  state.tickCount++;
  const ship = state.ship;
  const world = state.world;
  const system = world.shipSystem;
  const capture = world.captureSystem;
  const bodiesList = allBodies(system);
  const dt = 1;

  const { turnAccel, turnMax, turnDamping, throttleRate, accel, lateralAccel } = CONFIG.physics;

  if (!Number.isFinite(dtRealSeconds) || dtRealSeconds <= 0) dtRealSeconds = 0.016;
  if (!Number.isFinite(ship.throttleMain)) ship.throttleMain = 0;
  if (!Number.isFinite(ship.throttleLateral)) ship.throttleLateral = 0;
  if (!Number.isFinite(ship.angle)) ship.angle = 0;
  if (!Number.isFinite(ship.angularVel)) ship.angularVel = 0;
  if (!Number.isFinite(ship.fuel)) ship.fuel = CONFIG.fuel.max;

  const rate = throttleRate * dtRealSeconds;

  let targetMain = 0;
  let targetLat = 0;
  let boostActive = false;

  // --- Определяем управление ---
  if (dragInput.active) {
    targetMain = -dragInput.main; 
    targetLat = -dragInput.lateral;
  } 
  else if (gamepadInput.active) {
    targetMain = gamepadInput.main; 
    targetLat = gamepadInput.lateral; 
    
    if (gamepadInput.thrust) targetMain = 1;
    if (gamepadInput.reverse) targetMain = -1;
    
    boostActive = gamepadInput.thrust || gamepadInput.reverse;
  } 
  else {
    // Клавиатура: обычная тяга от W/S, форсаж от Space/Ctrl
    if (input.thrust) targetMain = 1;
    if (input.reverse) targetMain = -1;
    if (input.turnRight) targetLat = 1;
    if (input.turnLeft) targetLat = -1;
    
    if (input.boostForward) {
      targetMain = 1;
      boostActive = true;
    }
    if (input.boostReverse) {
      targetMain = -1;
      boostActive = true;
    }
  }

  // Если топлива нет, двигатели не работают
  if (ship.fuel <= 0) {
    targetMain = 0;
    targetLat = 0;
    boostActive = false;
  }

  // Плавно движемся к целевым значениям
  if (targetMain > ship.throttleMain) ship.throttleMain = Math.min(targetMain, ship.throttleMain + rate);
  else if (targetMain < ship.throttleMain) ship.throttleMain = Math.max(targetMain, ship.throttleMain - rate);

  if (targetLat > ship.throttleLateral) ship.throttleLateral = Math.min(targetLat, ship.throttleLateral + rate);
  else if (targetLat < ship.throttleLateral) ship.throttleLateral = Math.max(targetLat, ship.throttleLateral - rate);

  // === Зарядка топлива в мини-сфере ===
  const planet = dominantBody(system, ship.x, ship.y);
  if (planet) {
    const distToPlanet = Math.hypot(ship.x - planet.x, ship.y - planet.y);
    const miniR = planet.hill * CONFIG.autopilot.miniHillFraction;
    if (distToPlanet < miniR) {
      ship.fuel += 20.0 * dtRealSeconds;
      if (ship.fuel > CONFIG.fuel.max) ship.fuel = CONFIG.fuel.max;
    }
  }

  // === Расход топлива ===
  const boostMult = boostActive ? CONFIG.fuel.boostMultiplier : 1.0;
  
  const totalThrust = Math.abs(ship.throttleMain) * boostMult + Math.abs(ship.throttleLateral);
  
  if (totalThrust > 0.01) {
    let drain = CONFIG.fuel.baseDrainRate * totalThrust * dtRealSeconds;
    if (!Number.isFinite(drain)) drain = 0;
    
    ship.fuel -= drain;
    
    if (ship.fuel <= 0) {
      ship.fuel = 0;
      ship.throttleMain = 0;
      ship.throttleLateral = 0;
      boostActive = false;
    }
  }

  // --- Автопилот носа ---
  let targetAngle = ship.angle;
  if (planet) {
    const dx = ship.x - system.cx;
    const dy = ship.y - system.cy;
    if (dx !== 0 || dy !== 0) {
      const angleToShip = Math.atan2(dy, dx);
      const direction = planet.omega > 0 ? 1 : -1;
      targetAngle = angleToShip + direction * Math.PI / 2;
    }
  } else {
    const speed = Math.hypot(ship.vx, ship.vy);
    if (speed > 0.01) {
      targetAngle = Math.atan2(ship.vy, ship.vx);
    }
  }

  const diff = angleDiff(ship.angle, targetAngle);
  ship.angle += diff * 0.05;

  while (ship.angle > Math.PI) ship.angle -= Math.PI * 2;
  while (ship.angle < -Math.PI) ship.angle += Math.PI * 2;

  const ca = Math.cos(ship.angle);
  const sa = Math.sin(ship.angle);

  const fwd = accel * ship.throttleMain * boostMult; 
  const lat = lateralAccel * ship.throttleLateral; 

  const rx = -sa;
  const ry =  ca;

  const tx = ca * fwd + rx * lat;
  const ty = sa * fwd + ry * lat;

  const g1 = gravityAt(ship.x, ship.y, bodiesList);
  ship.vx += (g1.ax + tx) * 0.5 * dt;
  ship.vy += (g1.ay + ty) * 0.5 * dt;

  if (!system && capture) {
    const dx = capture.cx - ship.x;
    const dy = capture.cy - ship.y;
    const r = Math.hypot(dx, dy) || 1e-9;
    const t = 1 - Math.min(1, (r - capture.influenceRadius) / (capture.captureRadius - capture.influenceRadius));
    const strength = CONFIG.physics.G * capture.star.mass / (r * r) * t * 0.3;
    ship.vx += (dx / r) * strength * 0.5 * dt;
    ship.vy += (dy / r) * strength * 0.5 * dt;
  }

  ship.x += ship.vx * dt;
  ship.y += ship.vy * dt;

  const g2 = gravityAt(ship.x, ship.y, bodiesList);
  ship.vx += (g2.ax + tx) * 0.5 * dt;
  ship.vy += (g2.ay + ty) * 0.5 * dt;

  if (!system && capture) {
    const dx = capture.cx - ship.x;
    const dy = capture.cy - ship.y;
    const r = Math.hypot(dx, dy) || 1e-9;
    const t = 1 - Math.min(1, (r - capture.influenceRadius) / (capture.captureRadius - capture.influenceRadius));
    const strength = CONFIG.physics.G * capture.star.mass / (r * r) * t * 0.3;
    ship.vx += (dx / r) * strength * 0.5 * dt;
    ship.vy += (dy / r) * strength * 0.5 * dt;
  }

  if (!Number.isFinite(ship.x) || !Number.isFinite(ship.y) || !Number.isFinite(ship.vx) || !Number.isFinite(ship.vy)) {
    console.error('[physics] Force reset due to NaN!', { ship });
    if (system) {
      ship.x = system.cx + CONFIG.ship.startOrbit;
      ship.y = system.cy;
    } else {
      ship.x = 0;
      ship.y = 0;
    }
    ship.vx = 0;
    ship.vy = 0;
    ship.angle = 0;
    ship.angularVel = 0;
  }
}

function angleDiff(a, b) {
  let d = b - a;
  while (d >  Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
