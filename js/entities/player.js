class Character {
  constructor(type, x, y) {
    this.type = type; // 'king', 'queen', 'matheus_brush', 'pedro_horse', 'maria_rosa'
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.isGrounded = false;
    this.facing = 'right';
    this.state = 'idle'; // 'idle', 'walk', 'jump'
    
    // Character-specific physics and dimensions
    if (this.type === 'pedro_horse') {
      this.width = 155;
      this.height = 145;
      this.speed = 7.4; // Galloping speed
      this.jumpForce = -17.2; // High horse jump
    } else if (this.type === 'matheus_brush' || this.type === 'matheus') {
      this.width = 80;
      this.height = 135;
      this.speed = 5.2;
      this.jumpForce = -15.2;
    } else if (this.type === 'maria_rosa') {
      this.width = 80;
      this.height = 135;
      this.speed = 4.9;
      this.jumpForce = -15.4; // Floaty jump
    } else if (this.type === 'pedro') {
      this.width = 80;
      this.height = 135;
      this.speed = 5.2;
      this.jumpForce = -15.4;
    } else {
      // King & Queen
      this.width = 97;
      this.height = 149;
      this.speed = 5.2;
      this.jumpForce = -15.4;
    }

    // Coyote time & jump buffer for 100% reliable jumping
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;

    // Animation frame timing
    this.animTimer = 0;
    this.walkFrame = 1;
    this.isBW = false;
    
    // Sprites dictionaries
    this.spritesColor = {};
    this.spritesBW = {};
    this.loadSprites();
  }

  loadSprites() {
    const prefix = this.type;
    let spriteNames = ['idle', 'walk1', 'walk2', 'walk3', 'walk4', 'walk5', 'walk6', 'walk7', 'walk8', 'jump'];

    if (prefix === 'pedro_horse') {
      spriteNames = ['idle', 'gallop1', 'gallop2', 'gallop3', 'gallop4', 'jump'];
    } else if (prefix === 'maria_rosa') {
      spriteNames = [
        'ball_idle',
        'dance1', 'dance2', 'dance3', 'dance4', 'dance5', 'dance6', 'dance7', 'dance8',
        'walk1', 'walk2', 'walk3', 'walk4', 'walk5', 'walk6', 'walk7', 'walk8',
        'jump', 'idle'
      ];
    }

    spriteNames.forEach(name => {
      // Color sprites
      const imgColor = new Image();
      imgColor.src = `assets/images/characters/${prefix}_${name}.png?v=8.0`;
      this.spritesColor[name] = imgColor;

      // Dedicated B&W sprites
      const imgBW = new Image();
      imgBW.src = `assets/images/characters/${prefix}_${name}_bw.png?v=8.0`;
      this.spritesBW[name] = imgBW;
    });

  }

  setBWMode(isBW) {
    this.isBW = isBW;
  }

  update(isLeader, input, companionTarget) {
    // Update coyote and jump buffer timers
    if (this.isGrounded) {
      this.coyoteTimer = 8; // Can jump up to 8 frames after walking off platform
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - 1);
    }
    this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - 1);

    if (isLeader) {
      this.handleInput(input);
    } else if (companionTarget) {
      this.followTarget(companionTarget);
    }

    // Apply physics
    const gravity = this.type === 'maria_rosa' && this.vy > 0 ? Physics.GRAVITY * 0.85 : Physics.GRAVITY;
    this.vy += gravity;
    if (this.vy > Physics.MAX_FALL_SPEED) {
      this.vy = Physics.MAX_FALL_SPEED;
    }

    this.vx *= Physics.FRICTION;
    if (Math.abs(this.vx) < 0.15) this.vx = 0;

    this.x += this.vx;
    this.y += this.vy;

    // Update animation state & walking leg movement
    if (!this.isGrounded) {
      this.state = 'jump';
    } else if (Math.abs(this.vx) > 0.25) {
      this.state = 'walk';
      this.animTimer++;
      const maxFrames = this.type === 'pedro_horse' ? 4 : 8;
      const frameSpeed = this.type === 'pedro_horse' ? 4 : 4;
      if (this.animTimer >= frameSpeed) {
        this.animTimer = 0;
        this.walkFrame = (this.walkFrame % maxFrames) + 1;
      }
    } else {
      this.state = 'idle';
      this.animTimer = 0;
      this.walkFrame = 1;
    }
  }

  handleInput(input) {
    if (input.left) {
      this.vx = -this.speed;
      this.facing = 'left';
    }
    if (input.right) {
      this.vx = this.speed;
      this.facing = 'right';
    }

    if (input.jumpPressed) {
      this.jumpBufferTimer = 6;
    }

    const wantsToJump = input.jump || this.jumpBufferTimer > 0;
    const canJump = this.isGrounded || this.coyoteTimer > 0;

    if (wantsToJump && canJump) {
      this.vy = this.jumpForce;
      this.isGrounded = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;

      if (window.game && window.game.audio) {
        window.game.audio.playJump();
      }
    }
  }

  followTarget(leader) {
    const targetX = leader.facing === 'right' ? leader.x - 62 : leader.x + 62;
    const dx = targetX - this.x;
    if (Math.abs(dx) > 12) {
      this.vx = Math.sign(dx) * Math.min(this.speed * 0.98, Math.abs(dx) * 0.18);
      this.facing = dx > 0 ? 'right' : 'left';
    } else {
      this.facing = leader.facing;
    }

    if (leader.vy < -2 && this.coyoteTimer > 0 && Math.random() < 0.92) {
      this.vy = this.jumpForce;
      this.isGrounded = false;
      this.coyoteTimer = 0;
    }
  }

  draw(ctx) {
    const spriteDict = this.isBW ? this.spritesBW : this.spritesColor;
    let currentSprite = spriteDict.idle;

    if (this.type === 'pedro_horse') {
      if (this.state === 'jump') {
        currentSprite = spriteDict.jump || spriteDict.idle;
      } else if (this.state === 'walk') {
        currentSprite = spriteDict[`gallop${this.walkFrame}`] || spriteDict.idle;
      } else {
        currentSprite = spriteDict.idle;
      }
    } else if (this.type === 'maria_rosa') {
      if (this.state === 'jump') {
        currentSprite = spriteDict.jump || spriteDict.ball_idle || spriteDict.idle;
      } else if (this.state === 'walk') {
        currentSprite = spriteDict[`walk${this.walkFrame}`] || spriteDict[`dance${this.walkFrame}`] || spriteDict.ball_idle || spriteDict.idle;
      } else {
        currentSprite = spriteDict.ball_idle || spriteDict.idle;
      }
    } else {
      if (this.state === 'jump') {
        currentSprite = spriteDict.jump || spriteDict.idle;
      } else if (this.state === 'walk') {
        currentSprite = spriteDict[`walk${this.walkFrame}`] || spriteDict.idle;
      } else {
        currentSprite = spriteDict.idle;
      }
    }

    ctx.save();
    const drawX = Math.round(this.x);
    const drawY = Math.round(this.y);

    if (this.facing === 'left') {
      ctx.translate(drawX + this.width, drawY);
      ctx.scale(-1, 1);
      if (currentSprite && currentSprite.complete && currentSprite.naturalWidth > 0) {
        ctx.drawImage(currentSprite, 0, 0, this.width, this.height);
      } else {
        this.drawFallback(ctx);
      }
    } else {
      ctx.translate(drawX, drawY);
      if (currentSprite && currentSprite.complete && currentSprite.naturalWidth > 0) {
        ctx.drawImage(currentSprite, 0, 0, this.width, this.height);
      } else {
        this.drawFallback(ctx);
      }
    }
    ctx.restore();
  }

  drawFallback(ctx) {
    const colors = {
      'king': '#2e7d32',
      'queen': '#fbc02d',
      'matheus_brush': '#1976d2',
      'pedro_horse': '#d32f2f',
      'maria_rosa': '#e91e63'
    };
    ctx.fillStyle = colors[this.type] || '#888';
    ctx.fillRect(0, 0, this.width, this.height);
  }
}

class PlayerParty {
  constructor(mode = 'couple', initialLeader = 'king', startX = 100, startY = 420) {
    this.mode = mode; // 'couple', 'matheus_brush', 'pedro_horse', 'maria_rosa'
    this.leaderType = initialLeader;
    this.startX = startX;
    this.startY = startY;
    this.setMode(mode, initialLeader, startX, startY);
  }

  setMode(mode, initialLeader = 'king', startX = 100, startY = 420) {
    this.mode = mode;
    this.startX = startX;
    this.startY = startY;

    if (mode === 'couple') {
      this.isSingle = false;
      this.leaderType = initialLeader || 'king';
      this.king = new Character('king', startX, startY);
      this.queen = new Character('queen', startX - 62, startY);
      this.singleChar = null;
    } else {
      this.isSingle = true;
      this.leaderType = mode;
      this.singleChar = new Character(mode, startX, startY);
      this.king = null;
      this.queen = null;
    }
  }

  get leader() {
    if (this.isSingle) return this.singleChar;
    return this.leaderType === 'king' ? this.king : this.queen;
  }

  get companion() {
    if (this.isSingle) return null;
    return this.leaderType === 'king' ? this.queen : this.king;
  }

  setBWMode(isBW) {
    if (this.isSingle) {
      if (this.singleChar) this.singleChar.setBWMode(isBW);
    } else {
      if (this.king) this.king.setBWMode(isBW);
      if (this.queen) this.queen.setBWMode(isBW);
    }
  }

  switchLeader() {
    if (this.isSingle) return;
    this.leaderType = this.leaderType === 'king' ? 'queen' : 'king';
    if (window.game && window.game.audio) {
      window.game.audio.playSwitch();
    }
  }

  update(input, platforms) {
    this.leader.update(true, input, null);
    if (this.companion) {
      this.companion.update(false, input, this.leader);
    }

    this.leader.isGrounded = false;
    if (this.companion) {
      this.companion.isGrounded = false;
    }

    platforms.forEach(p => {
      Physics.resolvePlatformCollision(this.leader, p);
      if (this.companion) {
        Physics.resolvePlatformCollision(this.companion, p);
      }
    });
  }

  draw(ctx) {
    if (this.companion) {
      this.companion.draw(ctx);
    }
    this.leader.draw(ctx);
  }
}

window.Character = Character;
window.PlayerParty = PlayerParty;
window.RoyalCouple = PlayerParty; // Full backward compatibility
