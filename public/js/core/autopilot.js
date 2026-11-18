import { CONFIG } from '../config.js';
import { dominantBody } from '../entities/bodies.js';

export function updateCharge(state, dtRealSeconds) {
  const ap = state.autopilot;
  const ship = state.ship;
  const system = state.world.shipSystem;
  const planet = dominantBody(system, ship.x, ship.y);

  let inMini = false;
  if (planet) {
    const miniR = planet.hill * CONFIG.autopilot.miniHillFraction;
    const d = Math.hypot(ship.x - planet.x, ship.y - planet.y);
    if (d < miniR) inMini = true;
  }

  if (inMini && planet) {
    ap.charge = Math.min(CONFIG.autopilot.chargeTime, ap.charge + dtRealSeconds);
    ap.planet = planet;
  } else {
    ap.charge = 0;
    ap.planet = null;
  }

  ap.ready = ap.charge >= CONFIG.autopilot.chargeTime;
}

export function autopilotControl(state, input) {
  const ap = state.autopilot;
  ap.active = !!(input.space && ap.ready && ap.planet);

  if (!ap.active) {
    return { ax: 0, ay: 0, targetAngle: null, parked: false };
  }

  const ship = state.ship;
  const planet = ap.planet;
  const {
    lockRadiusFactor, lockRadiusOffset, kPos, kVel, maxAccelFactor,
    deadRadius, deadSpeed,
  } = CONFIG.autopilot;

  const rLock = planet.radius * lockRadiusFactor + lockRadiusOffset;

  const rx = ship.x - planet.x;
  const ry = ship.y - planet.y;
  const r = Math.hypot(rx, ry) || 1e-9;
  const ux = rx / r;
  const uy = ry / r;

  const rvx = ship.vx - planet.vx;
  const rvy = ship.vy - planet.vy;

  const rvLen = Math.hypot(rvx, rvy);
  const dr = Math.abs(r - rLock);

  if (dr < deadRadius && rvLen < deadSpeed) {
    return { ax: 0, ay: 0, targetAngle: null, parked: true };
  }

  const vRef = 0.1;
  const vRadTarget = (rLock - r) * kPos * vRef / 0.01;
  const targetVx = ux * vRadTarget;
  const targetVy = uy * vRadTarget;

  let ax = (targetVx - rvx) * kVel;
  let ay = (targetVy - rvy) * kVel;

  const aMax = CONFIG.physics.accel * maxAccelFactor;
  const aLen = Math.hypot(ax, ay);
  if (aLen > aMax) {
    ax = (ax / aLen) * aMax;
    ay = (ay / aLen) * aMax;
  }

  const targetAngle = Math.atan2(-ry, -rx);

  return { ax, ay, targetAngle, parked: false };
}
