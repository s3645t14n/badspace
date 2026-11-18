import { CONFIG } from '../config.js';
import { dominantBody } from '../entities/bodies.js';
import { camera } from '../input/wheel.js';
import {
  camState,
  setLastSystem, setLastHill, setZoomBeforeHill, getZoomBeforeHill,
  lastSystemRef, lastHillPlanet, autoZoomEnabled, setAutoZoom,
  lastGalaxyView, setGalaxyView, setZoomBeforeGalaxy, getZoomBeforeGalaxy
} from './cameraState.js';
import { state } from '../core/state.js';
import { input } from '../input/controls.js';

function getOuterOrbit(system) {
  let outer = 0;
  for (const p of system.planets) {
    if (p.orbit > outer) outer = p.orbit;
  }
  return outer || 1000;
}

export function computeCameraTarget(vp) {
  const ship = state.ship;
  const system = state.world.shipSystem;
  const planet = dominantBody(system, ship.x, ship.y);

  // --- Обработка режима галактики ---
  if (input.galaxyView !== lastGalaxyView) {
    if (input.galaxyView) {
      // Включили галактику
      setZoomBeforeGalaxy(camera.zoom);
      // Ставим зум, чтобы покрыть всё расстояние от центра (-30M) до 0.
      // Это ~30 000 000 единиц. При высоте экрана 1000px и желаемом охвате 60M, 
      // нужен зум ~ 1000 / 60 000 000 ≈ 0.000016.
      camera.zoom = 0.000016; 
      setAutoZoom(false); // Отключаем автозум, чтобы он не мешал
    } else {
      // Выключили
      camera.zoom = getZoomBeforeGalaxy();
      setAutoZoom(true); // Включаем автозум обратно
    }
    setGalaxyView(input.galaxyView);
  }

  // Если мы в режиме галактики, камера смотрит в центр (gcX, gcY) 
  // или на корабль. Лучше на центр галактики, чтобы видеть всё.
  if (input.galaxyView) {
    return {
      x: CONFIG.galaxy.centerX, // Смотрим в центр (-30M)
      y: CONFIG.galaxy.centerY,
      angle: 0, // Без вращения
    };
  }

  // --- Обычная логика камеры ---

  // 1. Смена системы
  if (system !== lastSystemRef) {
    if (!lastSystemRef && system) {
      const outer = getOuterOrbit(system);
      camera.zoom = (Math.min(vp.width, vp.height) * CONFIG.hill.fitFraction) / (2 * outer);
      setAutoZoom(true); 
    } 
    else if (lastSystemRef && !system) {
      camera.zoom = CONFIG.camera.zoomMin;
      setAutoZoom(true);
    } 
    else if (lastSystemRef && system && lastSystemRef !== system) {
      const outer = getOuterOrbit(system);
      camera.zoom = (Math.min(vp.width, vp.height) * CONFIG.hill.fitFraction) / (2 * outer);
      setAutoZoom(true);
    }
    setLastSystem(system);
    setLastHill(null);
  }

  // 2. Смена сферы Хилла
  if (planet !== lastHillPlanet) {
    if (planet && !lastHillPlanet) {
      setZoomBeforeHill(camera.zoom);
      camera.zoom = (Math.min(vp.width, vp.height) * CONFIG.hill.fitFraction) / (2 * planet.hill);
      setAutoZoom(true);
    } 
    else if (!planet && lastHillPlanet) {
      if (system) {
        const outer = getOuterOrbit(system);
        camera.zoom = (Math.min(vp.width, vp.height) * CONFIG.hill.fitFraction) / (2 * outer);
      } else {
        camera.zoom = CONFIG.camera.zoomMin;
        setAutoZoom(true);
      }
    }
    setLastHill(planet);
  }

  let targetX = ship.x;
  let targetY = ship.y;

  // Вне системы — корабль в нижней четверти экрана
  if (!system) {
    const offsetScreenY = vp.height * 0.25;
    const offsetWorld = offsetScreenY / camState.zoom;
    targetX += Math.cos(camState.angle) * offsetWorld;
    targetY += Math.sin(camState.angle) * offsetWorld;
  }

  return {
    x: targetX,
    y: targetY,
    angle: ship.angle,
  };
}
