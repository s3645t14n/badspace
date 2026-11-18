export const input = {
  thrust: false,
  reverse: false,
  turnLeft: false,
  turnRight: false,
  boostForward: false,
  boostReverse: false,
  slowTime: false, // Z
  fastTime: false, // X
};

export function bindControls({ btnThrust, btnReverse, btnLeft, btnRight }) {
  const set = (key, value, btn) => {
    input[key] = value;
    if (btn) btn.classList.toggle('active', value);
  };

  const bindButton = (btn, key) => {
    if (!btn) return;
    const on  = (e) => { e.preventDefault(); set(key, true, btn); };
    const off = (e) => { if (e) e.preventDefault(); set(key, false, btn); };

    btn.addEventListener('mousedown', on);
    btn.addEventListener('mouseup', off);
    btn.addEventListener('mouseleave', off);
    btn.addEventListener('touchstart', on, { passive: false });
    btn.addEventListener('touchend', off, { passive: false });
    btn.addEventListener('touchcancel', off, { passive: false });
  };

  bindButton(btnThrust, 'thrust');
  bindButton(btnReverse, 'reverse');
  bindButton(btnLeft, 'turnLeft');
  bindButton(btnRight, 'turnRight');

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp')    set('thrust',    true,  btnThrust);
    if (e.code === 'KeyS' || e.code === 'ArrowDown')  set('reverse',   true,  btnReverse);
    if (e.code === 'KeyA' || e.code === 'ArrowLeft')  set('turnLeft',  true,  btnLeft);
    if (e.code === 'KeyD' || e.code === 'ArrowRight') set('turnRight', true,  btnRight);
    
    if (e.code === 'Space') {
      e.preventDefault();
      input.boostForward = true;
    }
    if (e.code === 'ControlLeft' || e.code === 'ControlRight') {
      e.preventDefault();
      input.boostReverse = true;
    }
    
    if (e.code === 'KeyZ') {
      e.preventDefault();
      input.slowTime = true;
    }
    if (e.code === 'KeyX') {
      e.preventDefault();
      input.fastTime = true;
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp')    set('thrust',    false, btnThrust);
    if (e.code === 'KeyS' || e.code === 'ArrowDown')  set('reverse',   false, btnReverse);
    if (e.code === 'KeyA' || e.code === 'ArrowLeft')  set('turnLeft',  false, btnLeft);
    if (e.code === 'KeyD' || e.code === 'ArrowRight') set('turnRight', false, btnRight);
    
    if (e.code === 'Space') {
      e.preventDefault();
      input.boostForward = false;
    }
    if (e.code === 'ControlLeft' || e.code === 'ControlRight') {
      e.preventDefault();
      input.boostReverse = false;
    }
    
    if (e.code === 'KeyZ') {
      e.preventDefault();
      input.slowTime = false;
    }
    if (e.code === 'KeyX') {
      e.preventDefault();
      input.fastTime = false;
    }
  });
}
