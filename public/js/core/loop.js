import { CONFIG } from '../config.js';

export function startLoop({ onTick, onRender, onAfterFrame, getTimeScale }) {
  const tickMs = 1000 / CONFIG.tick.rate;
  const maxDelta = CONFIG.tick.maxFrameDelta;

  let acc = 0;
  let last = performance.now();

  function frame(now) {
    const dt = Math.min(now - last, maxDelta);
    last = now;

    const scale = getTimeScale ? getTimeScale() : 1;
    acc += dt * scale;

    // Ограничиваем число тиков за кадр, чтобы при scale=10 не было спирали смерти.
    let ticksProcessed = 0;
    while (acc >= tickMs && ticksProcessed < 20) {
      onTick(tickMs / 1000);
      acc -= tickMs;
      ticksProcessed++;
    }
    
    // Если накопилось слишком много (был лаг), сбрасываем остаток.
    if (acc > tickMs * 20) acc = 0;

    onRender(now);
    if (onAfterFrame) onAfterFrame();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
