import { CONFIG } from './config.js';
import { state } from './core/state.js';
import { simulateTick, predictTrajectory, predictStopPoint, predictSideTrajectories } from './core/physics.js';
import { advanceWorld, updateWorldGeneration, updateShipSystem } from './world/world.js';
import { startLoop } from './core/loop.js';
import { input, bindControls } from './input/controls.js';
import { camera, bindWheel } from './input/wheel.js';
import { bindDrag, drawDragGrid } from './input/dragInput.js';
import { bindGamepad, gamepadInput } from './input/gamepad.js';
import { createCanvas } from './render/canvas.js';
import { createStarField } from './render/stars.js';
import { drawShip } from './render/ship.js';
import { drawBodies } from './render/bodies.js';
import { drawPrediction } from './render/prediction.js';
import { drawTrail } from './render/trail.js';
import { drawOrbitHints } from './render/orbitHints.js';
import { drawDistantSystems } from './render/worldOverlay.js';
import { drawStarGravityWell } from './render/gravityWell.js';
import { drawFuelBar } from './render/fuelBar.js';
import { drawThrottleIndicator } from './render/throttleIndicator.js';
import { createHud } from './render/hud.js';
import { dominantBody } from './entities/bodies.js';
import { camState, autoZoomEnabled, setAutoZoom } from './camera/cameraState.js';
import { computeCameraTarget } from './camera/computeTarget.js';
import {
  beginFrame, endFrame, addTick,
  tStart, tEnd, drawProfiler,
} from './core/profiler.js';

const canvasEl = document.getElementById('space');
const canvas = createCanvas(canvasEl);
const stars = createStarField();
const hud = createHud();

camera.zoom = CONFIG.camera.startZoom;

let lastFrameTime = performance.now();

function resize() {
  const vp = canvas.resize();
  state.viewport = vp;
  stars.init(vp.width, vp.height);
}
window.addEventListener('resize', resize);
resize();

bindControls({
  btnThrust:  document.getElementById('thrust'),
  btnReverse: document.getElementById('reverse'),
  btnLeft:    document.getElementById('left'),
  btnRight:   document.getElementById('right'),
});
bindWheel(canvasEl);
bindDrag(canvasEl);
bindGamepad();

function onTick(dtReal) {
  tStart('gen');
  updateWorldGeneration(state.world, state.ship.x, state.ship.y);
  addTick('gen', tEnd('gen'));

  tStart('shipSys');
  updateShipSystem(state.world, state.ship.x, state.ship.y);
  addTick('shipSys', tEnd('shipSys'));

  tStart('phys');
  const safeDt = Math.min(0.1, Math.max(0, dtReal));
  simulateTick(state, input, safeDt);
  addTick('phys', tEnd('phys'));

  tStart('advance');
  advanceWorld(state.world);
  addTick('advance', tEnd('advance'));

  tStart('trail');
  advanceTrail();
  addTick('trail', tEnd('trail'));
}

function advanceTrail() {
  const t = state.trail;
  if (state.tickCount % t.sampleEvery !== 0) return;
  t.points.push({ x: state.ship.x, y: state.ship.y });
  if (t.points.length > t.maxPoints) t.points.shift();
}

function getNearestSystem(world, x, y) {
  let best = null;
  let bestDist = Infinity;
  for (const sys of world.systems.values()) {
    if (!sys) continue;
    const d = Math.hypot(x - sys.cx, y - sys.cy);
    if (d < bestDist) {
      best = sys;
      bestDist = d;
    }
  }
  return best;
}

function onRender(now) {
  beginFrame(now);
  
  const vp = state.viewport;
  const ctx = canvas.ctx;
  const ship = state.ship;
  const system = state.world.shipSystem;
  const dtReal = Math.min(0.1, (now - lastFrameTime) / 1000);
  lastFrameTime = now;

  gamepadInput.poll(dtReal);

  tStart('camTarget');
  const target = computeCameraTarget(vp);
  
  camState.x = target.x;
  camState.y = target.y;
  camState.angle = target.angle;
  camState.zoom *= Math.pow(camera.zoom / camState.zoom, CONFIG.camera.smooth);
  tEnd('camTarget');

  tStart('bg');
  canvas.drawBackground(vp);
  tEnd('bg');

  tStart('stars');
  stars.draw(ctx, vp, camState.x, camState.y);
  tEnd('stars');

  const nearestSys = getNearestSystem(state.world, ship.x, ship.y);

  ctx.save();
  ctx.translate(vp.width / 2, vp.height / 2);
  ctx.scale(camState.zoom, camState.zoom);
  ctx.rotate(-Math.PI / 2 - camState.angle);
  ctx.translate(-camState.x, -camState.y);

  tStart('distantSystems');
  drawDistantSystems(ctx, state.world, camState.x, camState.y, vp, nearestSys);
  tEnd('distantSystems');

  if (system) {
    tStart('currentSystem');
    drawBodies(ctx, system, camState.x, camState.y, vp);
    tEnd('currentSystem');
  }

  tStart('trail');
  drawTrail(ctx, state.trail.points);
  tEnd('trail');

  const { horizon, sampleEvery } = CONFIG.prediction;
  const { points, speeds } = predictTrajectory(ship, state.world, horizon, sampleEvery);
  
  const activePlanet = dominantBody(system, ship.x, ship.y);
  const inHill = activePlanet !== null;

  let stopPoint = null;
  let sidePaths = null;
  let stopDist = 0; 

  if (!system) {
    stopPoint = predictStopPoint(ship, state.world, dtReal);
    if (stopPoint) {
      const dx = stopPoint.x - ship.x;
      const dy = stopPoint.y - ship.y;
      stopDist = Math.hypot(dx, dy);
    } else {
      stopDist = Math.max(10000, Math.hypot(ship.vx, ship.vy) * 500);
    }

    if (autoZoomEnabled && stopDist > 0) {
      const fitRadius = stopDist * 1.1; 
      const targetZoom = (vp.height * 0.5) / fitRadius; 
      camera.zoom = targetZoom;
    }
    
    sidePaths = predictSideTrajectories(ship, state.world, stopDist);
  }

  tStart('predDraw');
  drawPrediction(ctx, points, state.tickCount, input.thrust || input.reverse || gamepadInput.thrust || gamepadInput.reverse || input.boostForward || input.boostReverse, camState.angle, stopPoint, inHill, sidePaths, stopDist, !system, speeds);
  tEnd('predDraw');

  if (activePlanet) {
    tStart('orbitHints');
    drawOrbitHints(ctx, ship, activePlanet, system);
    tEnd('orbitHints');
  }

  if (system) {
    tStart('gravityWell');
    const dx = system.star.x - camState.x;
    const dy = system.star.y - camState.y;
    if (Math.abs(dx) < (vp.width / 2) / camState.zoom + 5000 && 
        Math.abs(dy) < (vp.height / 2) / camState.zoom + 5000) {
      drawStarGravityWell(ctx, system.star, ship, camState.zoom);
    }
    tEnd('gravityWell');
  }

  tStart('ship');
  drawShip(ctx, ship, input);
  tEnd('ship');

  ctx.restore();

  if (ship.fuel > 0) {
    const dx = ship.x - camState.x;
    const dy = ship.y - camState.y;
    const ca = Math.cos(-Math.PI / 2 - camState.angle);
    const sa = Math.sin(-Math.PI / 2 - camState.angle);
    const rx = dx * ca - dy * sa;
    const ry = dx * sa + dy * ca;
    const screenX = vp.width / 2 + rx * camState.zoom;
    const screenY = vp.height / 2 + ry * camState.zoom;
    
    drawFuelBar(ctx, ship, screenX, screenY);
  }

  drawThrottleIndicator(ctx, ship, vp);
  drawDragGrid(ctx, ship, vp);

  endFrame(now);

  tStart('profiler');
  drawProfiler(ctx, vp);
  tEnd('profiler');
}

function onAfterFrame() {
  const system = state.world.shipSystem;
  const planet = dominantBody(system, state.ship.x, state.ship.y);
  
  let timeScale = planet ? CONFIG.hill.timeScale : 1;

  const slow = input.slowTime || gamepadInput.slowTime;
  const fast = input.fastTime || gamepadInput.fastTime;
  
  if (slow && !fast) timeScale *= 0.33;
  if (fast && !slow) timeScale *= 3.0;

  hud.update(state.ship, state.tickCount, camState.zoom, system, planet, timeScale);
}

function getTimeScale() {
  const system = state.world.shipSystem;
  const planet = dominantBody(system, state.ship.x, state.ship.y);
  
  let baseScale = planet ? CONFIG.hill.timeScale : 1;
  
  const slow = input.slowTime || gamepadInput.slowTime;
  const fast = input.fastTime || gamepadInput.fastTime;
  
  if (slow && !fast) baseScale *= 0.33;
  if (fast && !slow) baseScale *= 3.0;
  
  return baseScale;
}

startLoop({ onTick, onRender, onAfterFrame, getTimeScale });
console.log('[space] v88 config', CONFIG);
