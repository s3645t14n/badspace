import { CONFIG } from '../config.js';
import { dominantBody } from '../entities/bodies.js';

export function updateImpulse(state, input, system, dtRealSeconds) {
  const ship = state.ship;
  const planet = dominantBody(system, ship.x, ship.y);
  const inHill = planet !== null;

  // 1. Зарядка форсажа в мини-сфере
  if (inHill) {
    const distToPlanet = Math.hypot(ship.x - planet.x, ship.y - planet.y);
    const miniR = planet.hill * CONFIG.autopilot.miniHillFraction;

    if (distToPlanet < miniR) {
      ship.impulse += CONFIG.boost.chargeRate * dtRealSeconds;
      if (ship.impulse >= 100) ship.impulse = 100;
    }
  }

  // 2. Расход форсажа при зажатых курках
  // input.thrust = правый курок (газ), input.reverse = левый курок (реверс)
  const boostActive = (input.thrust || input.reverse) && ship.impulse > 0;
  
  if (boostActive) {
    ship.impulse -= CONFIG.boost.drainRate * dtRealSeconds;
    if (ship.impulse < 0) ship.impulse = 0;
  }

  return boostActive;
}
