import { CONFIG } from '../config.js';

// Управление canvas: размер с учётом DPR, ресайз, контекст.
export function createCanvas(canvasEl) {
  const ctx = canvasEl.getContext('2d');

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;

    canvasEl.width  = Math.floor(w * dpr);
    canvasEl.height = Math.floor(h * dpr);
    canvasEl.style.width  = w + 'px';
    canvasEl.style.height = h + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width: w, height: h, dpr };
  }

  function clear() {
    const { width, height } = ctx.canvas;
    ctx.clearRect(0, 0, width, height);
  }

  function drawBackground({ width, height }) {
    ctx.fillStyle = CONFIG.bg.base;
    ctx.fillRect(0, 0, width, height);

    const r = Math.max(width, height) * 0.75;
    const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, r);
    grad.addColorStop(0, CONFIG.bg.glowInner);
    grad.addColorStop(1, CONFIG.bg.glowOuter);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  return { ctx, resize, clear, drawBackground };
}
