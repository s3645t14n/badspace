import { CONFIG } from '../config.js';
import { setAutoZoom } from '../camera/cameraState.js';

export const camera = { zoom: 1 };

export function bindWheel(canvasEl) {
  const { zoomMin, zoomMax, zoomStep } = CONFIG.camera;

  canvasEl.addEventListener('wheel', (e) => {
    e.preventDefault();

    const factor = e.deltaY < 0 ? zoomStep : 1 / zoomStep;
    camera.zoom = Math.min(zoomMax, Math.max(zoomMin, camera.zoom * factor));
    
    // Пользователь изменил зум вручную - отключаем автозум.
    setAutoZoom(false);
  }, { passive: false });
}
