import { CONFIG } from '../../config.js';
import { gravityAt } from '../gravity.js';
import { dominantBody } from '../../entities/bodies.js';

export function predictTrajectory(ship, world, horizonTicks, sampleEvery) {
  const dt = 1;
  const system = world.shipSystem;
  const capture = world.captureSystem;
  
  let body = null;
  let bodyVx = 0, bodyVy = 0;

  if (system) {
    const planet = dominantBody(system, ship.x, ship.y);
    if (planet) {
      body = { x: planet.x, y: planet.y, mass: planet.mass };
      bodyVx = planet.vx;
      bodyVy = planet.vy;
    } else {
      body = { x: system.star.x, y: system.star.y, mass: system.star.mass };
      bodyVx = system.starVx;
      bodyVy = system.starVy;
    }
  } else if (capture) {
    const gcX = CONFIG.galaxy.centerX;
    const gcY = CONFIG.galaxy.centerY;
    const galAngle = capture.galPhase + capture.galOmega * world.globalTime;
    const cx = gcX + Math.cos(galAngle) * capture.galR;
    const cy = gcY + Math.sin(galAngle) * capture.galR;
    
    body = { x: cx, y: cy, mass: capture.star.mass };
    bodyVx = -Math.sin(galAngle) * capture.galOmega * capture.galR;
    bodyVy =  Math.cos(galAngle) * capture.galOmega * capture.galR;
  }

  if (!body) {
    let { x, y, vx, vy } = ship;
    const points = [{ x, y }];
    const speeds = [Math.hypot(vx, vy)];
    
    for (let i = 0; i < horizonTicks; i++) {
      x += vx * dt;
      y += vy * dt;
      if (i % sampleEvery === 0) {
        points.push({ x, y });
        speeds.push(Math.hypot(vx, vy));
      }
    }
    return { points, speeds };
  }

  let x = ship.x - body.x;
  let y = ship.y - body.y;
  let vx = ship.vx - bodyVx;
  let vy = ship.vy - bodyVy;
  
  const points = [{ x: ship.x, y: ship.y }];
  const speeds = [Math.hypot(ship.vx, ship.vy)];

  for (let i = 0; i < horizonTicks; i++) {
    const g1 = gravityAt(x, y, [{ x: 0, y: 0, mass: body.mass }]);
    vx += g1.ax * 0.5 * dt;
    vy += g1.ay * 0.5 * dt;
    x += vx * dt;
    y += vy * dt;

    const g2 = gravityAt(x, y, [{ x: 0, y: 0, mass: body.mass }]);
    vx += g2.ax * 0.5 * dt;
    vy += g2.ay * 0.5 * dt;

    if (i % sampleEvery === 0) {
      points.push({ x: x + body.x, y: y + body.y });
      speeds.push(Math.hypot(vx + bodyVx, vy + bodyVy));
    }
  }

  return { points, speeds };
}
