import { CONFIG } from '../config.js';
import { state } from '../core/state.js';
import { camera } from './wheel.js';
import { camState, setAutoZoom } from '../camera/cameraState.js';

export const gamepadInput = {
  connected: false,
  active: false,
  main: 0,
  lateral: 0,
  thrust: false,
  reverse: false,
  firePressed: false,
  slowTime: false,
  fastTime: false,
  camY: 0,
  resetPressed: false,
};

export function bindGamepad() {
  let gpIndex = null;
  let lastVibrationTime = 0;

  window.addEventListener("gamepadconnected", (e) => {
    gamepadInput.connected = true;
    gpIndex = e.gamepad.index;
  });

  window.addEventListener("gamepaddisconnected", (e) => {
    gamepadInput.connected = false;
    gpIndex = null;
    gamepadInput.active = false;
    gamepadInput.main = 0;
    gamepadInput.lateral = 0;
    gamepadInput.thrust = false;
    gamepadInput.reverse = false;
    gamepadInput.firePressed = false;
    gamepadInput.slowTime = false;
    gamepadInput.fastTime = false;
  });

  gamepadInput.poll = (dtReal) => {
    if (!gamepadInput.connected || gpIndex === null) return;
    
    const gps = navigator.getGamepads();
    const gp = gps[gpIndex];
    if (!gp) return;

    const deadzone = 0.15;

    // 1. Левый стик (X, Y)
    let lx = gp.axes[0]; 
    let ly = gp.axes[1]; 

    if (Math.abs(lx) < deadzone) lx = 0;
    if (Math.abs(ly) < deadzone) ly = 0;

    const magnitude = Math.hypot(lx, ly);
    if (magnitude > 1.0) {
      lx /= magnitude;
      ly /= magnitude;
    }

    gamepadInput.main = -ly;    
    gamepadInput.lateral = lx;  

    // 2. Курки (RT/LT) - форсаж
    const rtVal = gp.buttons[7] ? (typeof gp.buttons[7].value === 'number' ? gp.buttons[7].value : (gp.buttons[7].pressed ? 1 : 0)) : 0;
    const ltVal = gp.buttons[6] ? (typeof gp.buttons[6].value === 'number' ? gp.buttons[6].value : (gp.buttons[6].pressed ? 1 : 0)) : 0;

    const hasFuel = state.ship.fuel > 0.01;
    
    gamepadInput.thrust = hasFuel && rtVal > 0.2;
    gamepadInput.reverse = hasFuel && ltVal > 0.2;

    // 3. Бамперы (LB=4, RB=5) - управление временем
    gamepadInput.slowTime = gp.buttons[4] ? gp.buttons[4].pressed : false;
    gamepadInput.fastTime = gp.buttons[5] ? gp.buttons[5].pressed : false;

    // 4. Активность
    if (Math.abs(gamepadInput.main) > 0.1 || Math.abs(gamepadInput.lateral) > 0.1 || gamepadInput.thrust || gamepadInput.reverse) {
      gamepadInput.active = true;
    } else {
      gamepadInput.active = false;
    }

    // 5. Правый стик (зум)
    let ry = gp.axes[3]; 
    if (Math.abs(ry) < deadzone) ry = 0;

    const btnR3 = gp.buttons[11];
    if (btnR3 && btnR3.pressed) {
      setAutoZoom(true);
      camera.zoom = CONFIG.camera.startZoom; 
    }

    if (Math.abs(ry) > 0) {
      setAutoZoom(false);
      const zoomSpeed = 1.0 * dtReal; 
      const factor = Math.pow(1.15, -ry * (zoomSpeed * 60)); 
      camera.zoom = Math.min(CONFIG.camera.zoomMax, Math.max(CONFIG.camera.zoomMin, camera.zoom * factor));
    }

    // 6. Вибрация
    const now = performance.now();
    if (gp.vibrationActuator && now - lastVibrationTime > 50) {
      lastVibrationTime = now;

      const supportsTrigger = gp.vibrationActuator.effects && gp.vibrationActuator.effects.includes('trigger-rumble');
      
      let played = false;

      if (supportsTrigger && hasFuel && (rtVal > 0.1 || ltVal > 0.1)) {
        gp.vibrationActuator.playEffect('trigger-rumble', {
          duration: 200,
          startDelay: 0,
          strongMagnitude: 0,
          weakMagnitude: 0,
          rightTrigger: rtVal * 0.5,
          leftTrigger: ltVal * 0.5
        });
        played = true;
      }

      if (!played) {
        const tMain = Math.abs(state.ship.throttleMain || 0);
        const tLat = Math.abs(state.ship.throttleLateral || 0);
        const totalLoad = (tMain + tLat) / 2;
        
        if (totalLoad > 0.05) {
          const intensity = Math.min(1.0, totalLoad) * 0.6;
          
          gp.vibrationActuator.playEffect('dual-rumble', {
            startDelay: 0,
            duration: 200,
            strongMagnitude: intensity,
            weakMagnitude: intensity
          });
          played = true;
        }
      }

      if (!played) {
        gp.vibrationActuator.playEffect('dual-rumble', {
          startDelay: 0,
          duration: 50,
          strongMagnitude: 0,
          weakMagnitude: 0
        });
      }
    }
  };
}
