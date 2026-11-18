import { CONFIG } from '../config.js';

export function hashCoords(col, row, gseed) {
  let h = gseed | 0;
  h = (h ^ Math.imul(col, 374761393)) | 0;
  h = (h ^ Math.imul(row, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) | 0;
  return (h ^ (h >>> 16)) >>> 0;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randRange(rng, min, max) { return min + rng() * (max - min); }
function randInt(rng, min, max)   { return Math.floor(randRange(rng, min, max + 1)); }

function randColor(rng) {
  const h = Math.floor(rng() * 360);
  const s = 40 + Math.floor(rng() * 30);
  const l = 50 + Math.floor(rng() * 20);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function randStarColor(rng) {
  const pick = rng();
  let h;
  if (pick < 0.25) h = randRange(rng, 0, 20);
  else if (pick < 0.75) h = randRange(rng, 30, 60);
  else h = randRange(rng, 200, 240);
  const s = 55 + Math.floor(rng() * 25);
  const l = 60 + Math.floor(rng() * 20);
  return `hsl(${Math.round(h)}, ${s}%, ${l}%)`;
}

function buildSystem(seed, cx, cy) {
  const rng = mulberry32(seed);
  const G = CONFIG.physics.G;

  const starMass = randRange(rng, 8000, 20000);
  const starRadius = 40 + starMass / 200;
  const starColor = randStarColor(rng);

  const n = randInt(rng, 2, 7);
  
  // Уменьшенные орбиты (в 2 раза), чтобы v_planet было больше
  const innerOrbit = randRange(rng, 300, 600);
  const outerOrbit = randRange(rng, 4000, 8000);
  const ratio = Math.pow(outerOrbit / innerOrbit, 1 / Math.max(1, n - 1));

  const planets = [];
  for (let i = 0; i < n; i++) {
    const orbit = innerOrbit * Math.pow(ratio, i);
    
    // Увеличенные массы (в 5 раз)
    const mass = randRange(rng, 100, 1200);
    const radius = Math.max(6, Math.min(42, 4 + Math.cbrt(mass) * 3));
    
    const phase = rng() * Math.PI * 2;
    const omega = Math.sqrt((G * starMass) / (orbit ** 3));
    const hill = orbit * Math.cbrt(mass / (3 * starMass));

    const moonCount = Math.floor(rng() * 11);
    const moons = [];
    const maxMoonOrbit = Math.max(radius + 8, hill * 0.4);

    for (let j = 0; j < moonCount; j++) {
      const minOrbit = radius + 6;
      const t = rng();
      const moonOrbit = minOrbit + (maxMoonOrbit - minOrbit) * t;
      const moonMass = randRange(rng, 0.05, 1.0);
      const moonRadius = randRange(rng, 1, Math.min(4, radius * 0.3));
      const moonPhase = rng() * Math.PI * 2;
      const moonOmega = Math.sqrt((G * mass) / (moonOrbit ** 3));

      moons.push({
        name: `P${i + 1}M${j + 1}`,
        mass: moonMass, radius: moonRadius, orbit: moonOrbit, phase: moonPhase, omega: moonOmega,
        color: randColor(rng),
        x: 0, y: 0, vx: 0, vy: 0,
      });
    }

    planets.push({
      name: `P${i + 1}`, mass, radius, orbit, phase, omega,
      color: randColor(rng),
      x: 0, y: 0, vx: 0, vy: 0,
      hill, moons,
    });
  }

  const gcX = CONFIG.galaxy.centerX;
  const gcY = CONFIG.galaxy.centerY;
  const dxGC = cx - gcX;
  const dyGC = cy - gcY;
  const galR = Math.hypot(dxGC, dyGC);
  const galPhase = Math.atan2(dyGC, dxGC);
  const galOmega = CONFIG.galaxy.omega;

  const outerPlanetOrbit = innerOrbit * Math.pow(ratio, n - 1);
  const influenceRadius = Math.max(outerPlanetOrbit * 1.3, starRadius * 10);
  const captureRadius = influenceRadius * CONFIG.world.captureMultiplier;

  return {
    seed, cx: 0, cy: 0, starVx: 0, starVy: 0, baseX: cx, baseY: cy,
    galR, galPhase, galOmega,
    star: {
      name: `STAR_${seed}`, mass: starMass, radius: starRadius, color: starColor,
      x: 0, y: 0, vx: 0, vy: 0, isStar: true,
    },
    planets, influenceRadius, captureRadius, worldTime: 0,
  };
}

export function generateSystemsInCell(col, row, gseed) {
  const cell = CONFIG.world.cellSize;
  const isStart = (col === CONFIG.world.startCol && row === CONFIG.world.startRow);
  const result = [];

  for (let dcol = -1; dcol <= 1; dcol++) {
    for (let drow = -1; drow <= 1; drow++) {
      const nc = col + dcol;
      const nr = row + drow;
      const nseed = hashCoords(nc, nr, gseed);
      const rng = mulberry32(nseed);

      const count = Math.floor(rng() * 2);

      for (let i = 0; i < count; i++) {
        const x = nc * cell - cell * 0.5 + rng() * 2 * cell;
        const y = nr * cell - cell * 0.5 + rng() * 2 * cell;

        const cxCell = Math.floor(x / cell);
        const cyCell = Math.floor(y / cell);
        if (cxCell !== col || cyCell !== row) continue;

        const seed = hashCoords(nc, nr, gseed) + i * 100000;
        const sys = buildSystem(seed, x, y);
        result.push(sys);
      }
    }
  }

  if (isStart && result.length === 0) {
    const seed = hashCoords(col, row, gseed);
    const x = col * cell + cell / 2;
    const y = row * cell + cell / 2;
    const sys = buildSystem(seed, x, y);
    result.push(sys);
  }

  return result;
}
