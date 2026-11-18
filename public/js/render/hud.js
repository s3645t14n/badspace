import { CONFIG } from '../config.js';
import { circularSpeed } from './orbitHints.js';

const MONTH_NAMES = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];
const DAY_NAMES = [
  'вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'
];

const TICKS_PER_DAY = (100000 / 120) / 30.4375;

export function createHud() {
  const elFuel    = document.getElementById('fuel');
  const elSpeed   = document.getElementById('speed');
  const elTick    = document.getElementById('tick');
  const elPosX    = document.getElementById('posX');
  const elPosY    = document.getElementById('posY');
  const elZoom    = document.getElementById('zoom');
  const elSphere  = document.getElementById('sphere');
  const elOrbital = document.getElementById('orbital');
  const elAge     = document.getElementById('age');
  const elTimeRate= document.getElementById('timerate');
  const elDate    = document.getElementById('date');

  function update(ship, tickCount, zoom, system, planet, timeScale) {
    if (elFuel) elFuel.textContent = ship.fuel.toFixed(1);
    if (elSpeed) elSpeed.textContent = Math.hypot(ship.vx, ship.vy).toFixed(2);
    if (elTick) elTick.textContent = tickCount;
    if (elPosX) elPosX.textContent = ship.x.toFixed(0);
    if (elPosY) elPosY.textContent = ship.y.toFixed(0);
    if (elZoom) elZoom.textContent = zoom.toFixed(3);
    if (elSphere) elSphere.textContent = planet ? planet.name : '—';

    // Время: старт 5027 г, 1 апреля.
    if (elDate) {
      const totalDays = Math.floor(tickCount / TICKS_PER_DAY);
      
      let year = 5027;
      let monthIdx = 3; // апрель
      let day = 1 + totalDays;
      
      const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      
      while (true) {
        const dim = daysInMonths[monthIdx];
        if (day <= dim) break;
        day -= dim;
        monthIdx++;
        if (monthIdx >= 12) { monthIdx = 0; year++; }
      }

      const dow = (2 + totalDays) % 7;
      
      elDate.textContent = `${day} ${MONTH_NAMES[monthIdx]} ${year}, ${DAY_NAMES[dow]}`;
    }

    // Возраст в годах и месяцах.
    if (elAge) {
      const totalYears = 20 + (tickCount / 100000) * 10;
      const years = Math.floor(totalYears);
      const months = Math.floor((totalYears - years) * 12);
      elAge.textContent = `${years} г. ${months} мес.`;
    }
    
    // Темп времени.
    if (elTimeRate) {
      elTimeRate.textContent = `x${timeScale.toFixed(2)}`;
      elTimeRate.style.color = timeScale < 0.9 ? '#ffb08a' : '#7fffd4';
    }

    if (!elOrbital) return;
    if (!planet) {
      elOrbital.textContent = '—';
      elOrbital.style.color = '';
      return;
    }

    const rx = ship.x - planet.x;
    const ry = ship.y - planet.y;
    const r = Math.hypot(rx, ry) || 1e-9;
    const ux = rx / r;
    const uy = ry / r;
    const rvx = ship.vx - planet.vx;
    const rvy = ship.vy - planet.vy;

    const vRad  = rvx * ux + rvy * uy;
    const vTan  = rvx * (-uy) + rvy * ux;
    const vCirc = circularSpeed(planet.mass, r);

    const tol = vCirc * 0.01;
    const ok = Math.abs(vRad) < tol && Math.abs(Math.abs(vTan) - vCirc) < tol;

    elOrbital.textContent =
      `rad ${vRad.toFixed(3)}  tan ${vTan.toFixed(3)}  circ ${vCirc.toFixed(3)}`;
    elOrbital.style.color = ok ? '#7dffa8' : '#ffb08a';
  }

  return { update };
}
