import { createShip } from '../entities/ship.js';
import { createWorld } from '../world/world.js';
import { CONFIG } from '../config.js';

const world = createWorld();
const system = world.shipSystem;

if (!system || !system.star) {
  throw new Error("FATAL: Стартовая система не сгенерирована!");
}

const r = CONFIG.ship.startOrbit;
const GM = CONFIG.physics.G * system.star.mass;
const vCirc = Math.sqrt(GM / r);

const cx = system.cx;
const cy = system.cy;

const starVx = system.starVx;
const starVy = system.starVy;

console.log('[state] start vCirc =', vCirc, 'system:', system.col, system.row, 'cx:', cx, 'cy:', cy);

export const state = {
  ship: {
    ...createShip(), // Тут есть throttleMain и throttleLateral
    x: cx + r,
    y: cy,
    vx: starVx,
    vy: starVy + vCirc,
    angle: Math.PI / 2,
  },
  world,
  tickCount: 0,
  viewport: { width: 0, height: 0, dpr: 1 },
  trail: { points: [], maxPoints: 3000, sampleEvery: 4 },
  autopilot: { charge: 0, ready: false, active: false, planet: null },
};
