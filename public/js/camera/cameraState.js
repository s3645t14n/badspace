import { CONFIG } from '../config.js';
import { state } from '../core/state.js';
import { camera } from '../input/wheel.js';

export const camState = {
  x: state.ship.x,
  y: state.ship.y,
  angle: state.ship.angle,
  zoom: CONFIG.camera.startZoom,
};

export let lastSystemRef = null;
export let lastHillPlanet = null;
export let zoomBeforeHill = CONFIG.camera.startZoom;

// Флаг, включающий автозум в пустоте.
export let autoZoomEnabled = true;

// Для режима галактики
export let lastGalaxyView = false;
export let zoomBeforeGalaxy = CONFIG.camera.startZoom;

export function setLastSystem(ref) { lastSystemRef = ref; }
export function setLastHill(planet) { lastHillPlanet = planet; }
export function setZoomBeforeHill(zoom) { zoomBeforeHill = zoom; }
export function getZoomBeforeHill() { return zoomBeforeHill; }
export function setAutoZoom(val) { autoZoomEnabled = val; }

export function setGalaxyView(active) {
  lastGalaxyView = active;
}
export function setZoomBeforeGalaxy(z) { zoomBeforeGalaxy = z; }
export function getZoomBeforeGalaxy() { return zoomBeforeGalaxy; }
