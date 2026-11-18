export function allBodies(system) {
  if (!system) return [];
  const arr = [system.star];
  for (const p of system.planets) {
    arr.push(p);
    for (const m of p.moons) arr.push(m);
  }
  return arr;
}

export function dominantBody(system, x, y) {
  if (!system) return null;
  let best = null;
  let bestDist = Infinity;
  for (const p of system.planets) {
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < p.hill && d < bestDist) {
      best = p;
      bestDist = d;
    }
  }
  return best;
}
