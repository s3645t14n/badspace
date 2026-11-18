// Профайлер кадра: замер времени каждой фазы + скользящее среднее.

const SMOOTH = 30;
const SMOOTH_TICK = 60;

const averages = {
  render: {},
  frame: 0,
};

const _starts = {};
const _fpsWindow = [];

// Фиксированный порядок пунктов — чтобы панель не дёргалась.
const RENDER_ORDER = [
  'updateCharge',
  'camTarget',
  'bg',
  'stars',
  'distantSystems',
  'currentSystem',
  'trail',
  'predCalc',
  'predDraw',
  'orbitHints',
  'gravityLines',
  'ship',
  'autopilotUI',
  'profiler',
];

const TICK_ORDER = [
  'gen',
  'shipSys',
  'phys',
  'advance',
  'trail',
];

export function beginFrame(now) {
  _frameStart = now;
}
let _frameStart = 0;

export function addTick(name, durationMs) {
  const key = `tick.${name}`;
  const cur = averages.render[key];
  averages.render[key] = cur === undefined
    ? durationMs
    : cur + (durationMs - cur) / SMOOTH_TICK;
}

export function addToAverage(name, durationMs) {
  const cur = averages.render[name];
  averages.render[name] = cur === undefined
    ? durationMs
    : cur + (durationMs - cur) / SMOOTH;
}

export function tStart(name) {
  _starts[name] = performance.now();
}

export function tEnd(name) {
  const s = _starts[name];
  if (s === undefined) return 0;
  const d = performance.now() - s;
  addToAverage(name, d);
  return d;
}

export function endFrame(now) {
  const d = now - _frameStart;
  averages.frame = averages.frame ? averages.frame + (d - averages.frame) / SMOOTH : d;
  _fpsWindow.push(now);
  while (_fpsWindow.length > 60) _fpsWindow.shift();
}

export function getStats() {
  const w = _fpsWindow;
  let fps = 0;
  if (w.length >= 2) {
    const dt = (w[w.length - 1] - w[0]) / (w.length - 1);
    fps = dt > 0 ? 1000 / dt : 0;
  }
  return {
    fps,
    frameMs: averages.frame,
    render: { ...averages.render },
  };
}

export function drawProfiler(ctx, vp) {
  const stats = getStats();

  const lines = [];
  lines.push({ text: `FPS: ${stats.fps.toFixed(1)}`, color: '#fff' });
  lines.push({ text: `Frame: ${stats.frameMs.toFixed(2)} ms`, color: '#fff' });

  lines.push({ text: `--- render ---`, color: '#8af' });
  for (const name of RENDER_ORDER) {
    const ms = stats.render[name];
    if (ms === undefined) continue;
    const color = ms > 2 ? '#faa' : '#aaa';
    lines.push({ text: `  ${name}: ${ms.toFixed(2)}`, color });
  }

  lines.push({ text: `--- tick ---`, color: '#8af' });
  for (const name of TICK_ORDER) {
    const ms = stats.render[`tick.${name}`];
    if (ms === undefined) continue;
    const color = ms > 2 ? '#faa' : '#aaa';
    lines.push({ text: `  ${name}: ${ms.toFixed(2)}`, color });
  }

  const lineHeight = 12;
  const pad = 10;
  const boxW = 220;
  const boxH = lines.length * lineHeight + pad * 2;
  const x = vp.width - boxW - 12;
  const y = vp.height - boxH - 12;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(x, y, boxW, boxH);
  ctx.strokeStyle = 'rgba(120, 200, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, boxW - 1, boxH - 1);

  ctx.font = '11px "Consolas", "Courier New", monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  let ty = y + pad;
  for (const { text, color } of lines) {
    ctx.fillStyle = color;
    ctx.fillText(text, x + pad, ty);
    ty += lineHeight;
  }
  ctx.restore();
}
