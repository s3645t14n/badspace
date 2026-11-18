import { CONFIG } from '../config.js';
import { generateSystemsInCell } from '../entities/systemGenerator.js';

export function createWorld() {
  const seed = (typeof CONFIG.world.seed === 'number')
    ? CONFIG.world.seed
    : (Math.floor(Math.random() * 0xFFFFFFFF) | 0);

  console.log('[world] seed =', seed, '(', seed.toString(16), ')');

  const world = {
    seed,
    globalTime: 0,
    systems: new Map(),
    loadedCells: new Set(),
    shipSystem: null,
    captureSystem: null,
    lastGenPos: { x: -1e12, y: -1e12 },
  };

  const startCol = CONFIG.world.startCol;
  const startRow = CONFIG.world.startRow;
  loadCell(world, startCol, startRow);
  
  const startKey = findStartKey(world, startCol, startRow);
  if (!startKey) {
    console.error("[world] FATAL: Нет стартовой системы!");
    const dummySys = generateSystemsInCell(startCol, startRow, world.seed)[0];
    if (dummySys) {
      updateSystemPositions(dummySys, world.globalTime);
      world.systems.set(startCol + ',' + startRow + ',0', dummySys);
      world.shipSystem = dummySys;
      world.captureSystem = dummySys;
    }
  } else {
    world.shipSystem = world.systems.get(startKey);
    world.captureSystem = world.shipSystem;
  }

  return world;
}

function findStartKey(world, col, row) {
  for (const k of world.systems.keys()) {
    if (k.startsWith(`${col},${row},`)) return k;
  }
  return null;
}

export function loadCell(world, col, row) {
  const cellKey = col + ',' + row;
  if (world.loadedCells.has(cellKey)) return;
  world.loadedCells.add(cellKey);

  const systems = generateSystemsInCell(col, row, world.seed);
  for (let i = 0; i < systems.length; i++) {
    const sys = systems[i];
    updateSystemPositions(sys, world.globalTime);
    world.systems.set(`${col},${row},${i}`, sys);
  }
}

export function updateSystemPositions(sys, globalTime) {
  if (!sys || !sys.star) return;
  
  const t = globalTime;
  sys.worldTime = t;

  const gcX = CONFIG.galaxy.centerX;
  const gcY = CONFIG.galaxy.centerY;

  const galAngle = sys.galPhase + sys.galOmega * t;
  sys.cx = gcX + Math.cos(galAngle) * sys.galR;
  sys.cy = gcY + Math.sin(galAngle) * sys.galR;

  sys.starVx = -Math.sin(galAngle) * sys.galOmega * sys.galR;
  sys.starVy =  Math.cos(galAngle) * sys.galOmega * sys.galR;

  sys.star.x = sys.cx;
  sys.star.y = sys.cy;
  sys.star.vx = sys.starVx;
  sys.star.vy = sys.starVy;

  for (const p of sys.planets) {
    const angle = p.phase + p.omega * t;
    p.x = sys.cx + Math.cos(angle) * p.orbit;
    p.y = sys.cy + Math.sin(angle) * p.orbit;
    p.vx = sys.starVx + (-Math.sin(angle) * p.omega * p.orbit);
    p.vy = sys.starVy + ( Math.cos(angle) * p.omega * p.orbit);

    for (const m of p.moons) {
      const mA = m.phase + m.omega * t;
      m.x = p.x + Math.cos(mA) * m.orbit;
      m.y = p.y + Math.sin(mA) * m.orbit;
      m.vx = p.vx + (-Math.sin(mA) * m.omega * m.orbit);
      m.vy = p.vy + ( Math.cos(mA) * m.omega * m.orbit);
    }
  }
}

export function advanceWorld(world) {
  world.globalTime += 1;
  for (const sys of world.systems.values()) {
    updateSystemPositions(sys, world.globalTime);
  }
}

export function updateWorldGeneration(world, shipX, shipY) {
  const R2 = CONFIG.world.R_gen * CONFIG.world.R_gen;
  const dx = shipX - world.lastGenPos.x;
  const dy = shipY - world.lastGenPos.y;
  const halfCell = CONFIG.world.cellSize / 2;
  if (dx * dx + dy * dy < halfCell * halfCell) return;

  world.lastGenPos.x = shipX;
  world.lastGenPos.y = shipY;

  const cell = CONFIG.world.cellSize;
  const colMin = Math.floor((shipX - CONFIG.world.R_gen) / cell);
  const colMax = Math.floor((shipX + CONFIG.world.R_gen) / cell);
  const rowMin = Math.floor((shipY - CONFIG.world.R_gen) / cell);
  const rowMax = Math.floor((shipY + CONFIG.world.R_gen) / cell);

  for (let col = colMin; col <= colMax; col++) {
    for (let row = rowMin; row <= rowMax; row++) {
      loadCell(world, col, row);
    }
  }
}

export function updateShipSystem(world, shipX, shipY) {
  let inInfluence = null;
  let inCapture = null;
  let bestCaptureDist = Infinity;

  for (const sys of world.systems.values()) {
    if (!sys) continue;
    const d = Math.hypot(shipX - sys.cx, shipY - sys.cy);
    if (d < sys.influenceRadius) {
      inInfluence = sys;
      break;
    }
    if (d < sys.captureRadius && d < bestCaptureDist) {
      inCapture = sys;
      bestCaptureDist = d;
    }
  }

  world.shipSystem = inInfluence;
  world.captureSystem = inCapture;
}
