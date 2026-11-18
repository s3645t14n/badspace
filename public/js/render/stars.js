import { CONFIG } from '../config.js';

// Фоновые звёзды с параллаксом. Рисуются в ЧИСТО экранных координатах
// (без учёта camera.zoom) — иначе при сильном отдалении звёздный слой
// сжимался бы в маленькое окошко вокруг центра.
export function createStarField() {
  const layers = CONFIG.stars.layers.map((cfg) => ({
    ...cfg,
    stars: [],
    worldW: 0,
    worldH: 0,
  }));

  function init(width, height) {
    const mult = CONFIG.stars.worldMultiplier;
    const worldW = width * mult;
    const worldH = height * mult;

    for (const layer of layers) {
      layer.worldW = worldW;
      layer.worldH = worldH;
      layer.stars.length = 0;
      for (let i = 0; i < layer.count; i++) {
        layer.stars.push({
          x: Math.random() * worldW,
          y: Math.random() * worldH,
          size: layer.size[0] + Math.random() * (layer.size[1] - layer.size[0]),
          twinkle: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.005 + Math.random() * 0.02,
          hue: 200 + Math.random() * 60,
        });
      }
    }
  }

  function draw(ctx, { width, height }, camX, camY) {
    for (const layer of layers) {
      const offX = -camX * layer.depth;
      const offY = -camY * layer.depth;

      for (const s of layer.stars) {
        let sx = (s.x + offX) % layer.worldW;
        let sy = (s.y + offY) % layer.worldH;
        if (sx < 0) sx += layer.worldW;
        if (sy < 0) sy += layer.worldH;

        s.twinkle += s.twinkleSpeed;
        const a = layer.alpha * (0.65 + 0.35 * Math.sin(s.twinkle));

        for (let tx = -1; tx <= 1; tx++) {
          for (let ty = -1; ty <= 1; ty++) {
            const px = sx + tx * layer.worldW;
            const py = sy + ty * layer.worldH;
            if (px < -20 || px > width + 20 || py < -20 || py > height + 20) continue;

            ctx.beginPath();
            ctx.fillStyle = `hsla(${s.hue}, 60%, 88%, ${a})`;
            if (layer.glow) {
              ctx.shadowColor = `hsla(${s.hue}, 80%, 80%, ${a})`;
              ctx.shadowBlur = 8;
            }
            ctx.arc(px, py, s.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }
    }
  }

  return { init, draw };
}
