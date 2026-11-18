import { CONFIG } from '../config.js';

export function createShip() {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    angle: CONFIG.ship.startAngle,
    angularVel: 0,
    radius: CONFIG.ship.radius,
    fuel: CONFIG.fuel.max,
    timeWarpActive: false,
    timeWarpScale: 1.0,
    throttleMain: 0,
    throttleLateral: 0,
    _wasSpace: false,
  };
}
