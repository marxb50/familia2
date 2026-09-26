/**
 * ==============================================================================
 * INPUT MANAGER (Suporte Teclado, Gamepad & Touch com Inércia Fluida)
 * ==============================================================================
 */
class InputManager {
  constructor() {
    this.keys = {};
    this.axisX = 0;        // -1 (esquerda) a +1 (direita)
    this.axisY = 0;        // -1 (cima) a +1 (baixo)
    this.jumpPressed = false;
    this.jumpHeld = false;
    this.slamPressed = false;
    this.action1Pressed = false; // Pedro: Golpe / Matheus: Pincelada
    this.action2Pressed = false; // Maria Rosa: Canção Floral / Giro
    this.switchPressed = false;

    // Buffer de pulo generoso para resposta perfeita (220ms)
    this.jumpBufferTimer = 0;
    this.jumpBufferMax = 0.22;
    this.jumpReleased = false;

    this.setupKeyboard();
    this.setupGamepad();
    this.setupTouch();
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        if (!this.jumpHeld) {
          this.jumpPressed = true;
          this.jumpBufferTimer = this.jumpBufferMax;
        }
        this.jumpHeld = true;
        this.jumpReleased = false;
        e.preventDefault();
      }

      if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        this.slamPressed = true;
        e.preventDefault();
      }

      if (e.code === 'KeyJ' || e.code === 'KeyZ') {
        this.action1Pressed = true;
      }

      if (e.code === 'KeyK' || e.code === 'KeyX') {
        this.action2Pressed = true;
      }

      if (e.code === 'KeyC' || e.code === 'Tab') {
        this.switchPressed = true;
        e.preventDefault();
      }

      if (e.code === 'KeyP') {
        if (window.gameEngine) {
          window.gameEngine.toggleShader();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;

      if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        this.jumpHeld = false;
        this.jumpReleased = true;
      }
    });
  }

  setupGamepad() {
    this.gamepadIndex = null;
    window.addEventListener('gamepadconnected', (e) => {
      this.gamepadIndex = e.gamepad.index;
      console.log('🎮 Gamepad conectado:', e.gamepad.id);
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      if (this.gamepadIndex === e.gamepad.index) {
        this.gamepadIndex = null;
      }
    });
  }

  setupTouch() {
    const bindBtn = (id, onDown, onUp) => {
      const el = document.getElementById(id);
      if (!el) return;
      const start = (e) => { e.preventDefault(); onDown(); el.classList.add('active'); };
      const end = (e) => { e.preventDefault(); onUp(); el.classList.remove('active'); };
      el.addEventListener('touchstart', start, { passive: false });
      el.addEventListener('touchend', end, { passive: false });
      el.addEventListener('mousedown', start);
      el.addEventListener('mouseup', end);
    };

    bindBtn('touch-left', () => { this.keys['TouchLeft'] = true; }, () => { this.keys['TouchLeft'] = false; });
    bindBtn('touch-right', () => { this.keys['TouchRight'] = true; }, () => { this.keys['TouchRight'] = false; });
    bindBtn('touch-jump', () => {
      this.jumpPressed = true;
      this.jumpHeld = true;
      this.jumpReleased = false;
      this.jumpBufferTimer = this.jumpBufferMax;
    }, () => {
      this.jumpHeld = false;
      this.jumpReleased = true;
    });
    bindBtn('touch-action', () => {
      this.action1Pressed = true;
      this.slamPressed = true;
    }, () => {});
    bindBtn('touch-sing', () => {
      this.action2Pressed = true;
    }, () => {});
    bindBtn('touch-swap', () => {
      this.switchPressed = true;
    }, () => {});
  }

  update(dt) {
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
      if (this.jumpBufferTimer <= 0) {
        this.jumpPressed = false;
      }
    }

    // Leitura Teclado + Touch (Instantânea, sem delay artificial)
    let targetAxisX = 0;
    if (this.keys['KeyA'] || this.keys['ArrowLeft'] || this.keys['TouchLeft']) targetAxisX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight'] || this.keys['TouchRight']) targetAxisX += 1;

    let targetAxisY = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) targetAxisY -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) targetAxisY += 1;

    // Leitura Gamepad (se conectado)
    if (this.gamepadIndex !== null) {
      const gp = navigator.getGamepads()[this.gamepadIndex];
      if (gp) {
        const deadzone = 0.2;
        if (Math.abs(gp.axes[0]) > deadzone) targetAxisX = gp.axes[0];
        if (Math.abs(gp.axes[1]) > deadzone) targetAxisY = gp.axes[1];

        if (gp.buttons[14]?.pressed) targetAxisX = -1;
        if (gp.buttons[15]?.pressed) targetAxisX = 1;

        if (gp.buttons[0]?.pressed) {
          if (!this.jumpHeld) {
            this.jumpPressed = true;
            this.jumpBufferTimer = this.jumpBufferMax;
          }
          this.jumpHeld = true;
          this.jumpReleased = false;
        } else if (this.jumpHeld) {
          this.jumpHeld = false;
          this.jumpReleased = true;
        }

        if (gp.buttons[1]?.pressed) this.slamPressed = true;
        if (gp.buttons[2]?.pressed) this.action1Pressed = true;
        if (gp.buttons[3]?.pressed) this.action2Pressed = true;
        if (gp.buttons[4]?.pressed || gp.buttons[5]?.pressed) this.switchPressed = true;
      }
    }

    // Resposta direta nos eixos: zero latência
    this.axisX = targetAxisX;
    this.axisY = targetAxisY;
  }

  hasJumpBuffered() {
    return this.jumpPressed || this.jumpBufferTimer > 0;
  }

  consumeJump() {
    if (this.jumpPressed || this.jumpBufferTimer > 0) {
      this.jumpPressed = false;
      this.jumpBufferTimer = 0;
      return true;
    }
    return false;
  }

  consumeJumpRelease() {
    const r = this.jumpReleased;
    this.jumpReleased = false;
    return r;
  }

  consumeSlam() {
    const s = this.slamPressed;
    this.slamPressed = false;
    return s;
  }

  consumeAction1() {
    const a = this.action1Pressed;
    this.action1Pressed = false;
    return a;
  }

  consumeAction2() {
    const a = this.action2Pressed;
    this.action2Pressed = false;
    return a;
  }

  consumeSwitch() {
    const s = this.switchPressed;
    this.switchPressed = false;
    return s;
  }
}

window.InputManager = InputManager;
