/**
 * ==============================================================================
 * GRIS CHARACTER & COMPANION PARTY SYSTEM
 * - Comportamento Autêntico do Rei e Rainha: NÃO ficam grudados, caminham em par
 * - Seguidor inteligente com espaçamento suave e saltos sincronizados
 * - Alternância fluida de líder (tecla C / TAB / Touch)
 * - Suporte completo a Matheus (Pincéis / Salto Duplo), Pedro (Cavalo / Espada)
 *   e Maria Rosa (Valência / Flores / Planar)
 * ==============================================================================
 */

class GrisIndividualCharacter {
  constructor(type, x, y) {
    this.type = type; // 'king', 'queen', 'matheus', 'pedro', 'pedro_horse', 'maria_rosa'
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;

    // Dimensões do Collider
    this.width = 64;
    this.height = 110;

    // Estados Físicos
    this.onGround = false;
    this.facing = 1; // 1 = direita, -1 = esquerda
    this.coyoteTimer = 0;
    this.hasDoubleJump = true;
    this.isJumping = false;
    this.isGliding = false;
    this.isSlamming = false;
    this.isStoneAnchor = false;
    this.isWallSliding = false;
    this.touchingWall = 0;
    this.wallContactTimer = 0;
    this.wallJumpControlLockout = 0;
    this.isSinging = false;
    this.singTimer = 0;
    this.inWater = false;
    this.gravityFlipped = false;
    this.jumpCooldown = 0;

    // Habilidades por Personagem
    this.canHeavySlam = false;
    this.canDoubleJump = false;
    this.canGlide = false;
    this.canSing = false;
    this.canPaintBridge = false;

    // Velocidades
    this.maxSpeed = 310;

    // Animação & Sprites
    this.animTimer = 0;
    this.walkFrame = 1;
    this.sprites = { color: {}, bw: {} };
    this.trailPoints = [];

    this.configureAttributes();
    this.loadSprites();
  }

  configureAttributes() {
    if (this.type === 'carriage') {
      this.width = 270;
      this.height = 130;
      this.maxSpeed = 380; // Trote fluído da Carruagem Real
    } else if (this.type === 'pedro_horse') {
      this.width = 110;
      this.height = 120;
      this.maxSpeed = 390; // Cavalgada veloz
      this.canHeavySlam = true;
    } else if (this.type === 'pedro') {
      this.width = 68;
      this.height = 115;
      this.maxSpeed = 360;
      this.canHeavySlam = true;
    } else if (this.type === 'matheus') {
      this.width = 64;
      this.height = 110;
      this.maxSpeed = 340;
      this.canDoubleJump = true;
      this.canPaintBridge = true;
    } else if (this.type === 'maria_rosa') {
      this.width = 64;
      this.height = 115;
      this.maxSpeed = 310;
      this.canGlide = true;
      this.canSing = true;
    } else if (this.type === 'king') {
      this.width = 76;
      this.height = 125;
      this.maxSpeed = 310;
    } else if (this.type === 'queen') {
      this.width = 74;
      this.height = 122;
      this.maxSpeed = 310;
    }
  }

  loadSprites() {
    const load = (src) => {
      const img = new Image();
      img.src = src;
      return img;
    };

    const loadSeq = (baseDir, prefix, count, suffix = '') => {
      const frames = [];
      for (let i = 0; i < count; i++) {
        const pad = i < 10 ? '0' + i : '' + i;
        frames.push(load(`${baseDir}/${prefix}_${pad}${suffix}.png?v=20.0`));
      }
      return frames;
    };

    const t = this.type;
    if (t === 'carriage') {
      this.sprites.color.walks = [];
      for (let i = 0; i < 29; i++) {
        const pad = i < 10 ? '0' + i : '' + i;
        this.sprites.color.walks.push(load(`assets/images/characters/carriage/carriage_${pad}.png?v=14.0`));
      }
      this.sprites.color.idle = this.sprites.color.walks[0];
      this.sprites.color.jump = this.sprites.color.walks[6];
      this.sprites.bw.idle = this.sprites.color.idle;
      this.sprites.bw.jump = this.sprites.color.jump;
      this.sprites.bw.walks = this.sprites.color.walks;
    } else if (t === 'pedro_horse') {
      this.sprites.color.idle = load('assets/images/characters/pedro_horse_idle.png?v=14.0');
      this.sprites.color.jump = load('assets/images/characters/pedro_horse_jump.png?v=14.0');
      this.sprites.color.walks = [
        load('assets/images/characters/pedro_horse_gallop1.png?v=14.0'),
        load('assets/images/characters/pedro_horse_gallop2.png?v=14.0'),
        load('assets/images/characters/pedro_horse_gallop3.png?v=14.0'),
        load('assets/images/characters/pedro_horse_gallop4.png?v=14.0')
      ];
      this.sprites.bw.idle = this.sprites.color.idle;
      this.sprites.bw.jump = this.sprites.color.jump;
      this.sprites.bw.walks = this.sprites.color.walks;
    } else {
      // Todos os 5 personagens principais: king, queen, matheus, pedro, maria_rosa
      this.sprites.color.walks = loadSeq(`assets/images/characters/${t}/walk`, 'walk', 8);
      // Os PNGs de corrida do Rei têm a capa cortada na borda e os do Pedro
      // carregam uma faixa da capa do pai. A caminhada é usada em alta
      // velocidade para preservar o ciclo de passos sem os artefatos.
      const safeRunFrames = t === 'king' || t === 'pedro'
        ? this.sprites.color.walks
        : loadSeq(`assets/images/characters/${t}/run`, 'run', 8);
      this.sprites.color.runs  = safeRunFrames;
      this.sprites.color.idle  = load(`assets/images/characters/${t}/idle.png?v=20.0`);
      this.sprites.color.jump  = load(`assets/images/characters/${t}/jump/jump_apex.png?v=20.0`);
      this.sprites.color.jumps = {
        rise: load(`assets/images/characters/${t}/jump/jump_rise.png?v=20.0`),
        apex: load(`assets/images/characters/${t}/jump/jump_apex.png?v=20.0`),
        fall: load(`assets/images/characters/${t}/jump/jump_fall.png?v=20.0`)
      };

      this.sprites.bw.walks = loadSeq(`assets/images/characters/${t}/walk`, 'walk', 8, '_bw');
      const safeRunFramesBW = t === 'king' || t === 'pedro'
        ? this.sprites.bw.walks
        : loadSeq(`assets/images/characters/${t}/run`, 'run', 8, '_bw');
      this.sprites.bw.runs  = safeRunFramesBW;
      this.sprites.bw.idle  = load(`assets/images/characters/${t}/idle_bw.png?v=20.0`);
      this.sprites.bw.jump  = load(`assets/images/characters/${t}/jump/jump_apex_bw.png?v=20.0`);
      this.sprites.bw.jumps = {
        rise: load(`assets/images/characters/${t}/jump/jump_rise_bw.png?v=20.0`),
        apex: load(`assets/images/characters/${t}/jump/jump_apex_bw.png?v=20.0`),
        fall: load(`assets/images/characters/${t}/jump/jump_fall_bw.png?v=20.0`)
      };
    }
  }

  getThemeColor() {
    switch (this.type) {
      case 'matheus': return '#3a86ff';
      case 'pedro':
      case 'pedro_horse': return '#e63946';
      case 'maria_rosa': return '#ff70a6';
      case 'king': return '#52b788';
      case 'queen': return '#ffd166';
      default: return '#dfc382';
    }
  }

  update(dt, particles, audio) {
    if (this.jumpCooldown > 0) {
      this.jumpCooldown = Math.max(0, this.jumpCooldown - dt);
    }

    // Atualizar animação de passos / corrida / galope / trote e giro das rodas
    const absVx = Math.abs(this.vx);
    if (absVx > 15 && this.onGround) {
      if (this.type === 'carriage') {
        // 29 quadros do vídeo da carruagem (~380 px/s)
        this.animTimer += dt * (absVx * 0.08);
      } else if (absVx > 220) {
        // Corrida ágil (ciclo de 8 frames acelerado proporcional à velocidade de solo)
        this.animTimer += dt * (absVx * 0.045 + 3.0);
      } else {
        // Caminhada fluida (ciclo de 8 frames sincronizado perfeitamente com o chão)
        this.animTimer += dt * (absVx * 0.038 + 1.8);
      }
    } else {
      this.animTimer = 0; // Parada estática quando imóvel (fica na pose idle)
    }

    // Canto
    if (this.isSinging) {
      this.singTimer -= dt;
      if (this.singTimer <= 0) this.isSinging = false;
    }

    // Rastro de aquarela suave ao mover-se
    if (Math.abs(this.vx) > 60 || !this.onGround) {
      this.trailPoints.unshift({
        x: this.x + this.width / 2,
        y: this.y + this.height - 20,
        alpha: 0.38
      });
      if (this.trailPoints.length > 14) this.trailPoints.pop();
    }
    for (let pt of this.trailPoints) {
      pt.alpha -= dt * 0.85;
    }
    this.trailPoints = this.trailPoints.filter(p => p.alpha > 0.02);
  }

  draw(ctx, time, isBW = false) {
    ctx.save();
    const drawX = Math.round(this.x);
    const drawY = Math.round(this.y);
    const centerX = drawX + this.width / 2;
    const baseY = drawY + this.height;

    // Rastro de aquarela
    if (this.trailPoints.length > 2) {
      ctx.save();
      ctx.strokeStyle = this.getThemeColor();
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(this.trailPoints[0].x, this.trailPoints[0].y);
      for (let i = 1; i < this.trailPoints.length; i++) {
        ctx.lineTo(this.trailPoints[i].x, this.trailPoints[i].y);
      }
      ctx.globalAlpha = 0.22;
      ctx.stroke();
      ctx.restore();
    }

    // Aura ao planar ou cantar
    if (this.isSinging || this.isGliding) {
      ctx.save();
      const haloRadius = 55 + Math.sin(time * 6) * 10;
      const grad = ctx.createRadialGradient(centerX, drawY + this.height / 2, 8, centerX, drawY + this.height / 2, haloRadius);
      grad.addColorStop(0, 'rgba(255, 235, 180, 0.45)');
      grad.addColorStop(0.7, 'rgba(255, 112, 166, 0.22)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(centerX, drawY + this.height / 2, haloRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Bloco de pedra (Pedro Slam)
    if (this.isSlamming || this.isStoneAnchor) {
      ctx.save();
      ctx.translate(centerX, drawY + this.height / 2);
      ctx.fillStyle = '#4a151b';
      ctx.strokeStyle = '#e63946';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.rect(-30, -45, 60, 90);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.restore();
      return;
    }

    // Desenhar Sprite em pé
    ctx.translate(centerX, baseY);
    ctx.scale(this.facing, 1);

    const dict = (isBW && this.sprites.bw.idle) ? this.sprites.bw : this.sprites.color;
    let activeImg = dict.idle;

    if (!this.onGround) {
      if (dict.jumps) {
        if (this.vy < -80) {
          activeImg = dict.jumps.rise || dict.jump || dict.idle;
        } else if (this.vy > 100) {
          activeImg = dict.jumps.fall || dict.jump || dict.idle;
        } else {
          activeImg = dict.jumps.apex || dict.jump || dict.idle;
        }
      } else {
        activeImg = dict.jump || dict.idle;
      }
    } else if (Math.abs(this.vx) > 220 && dict.runs && dict.runs.length > 0) {
      const idx = Math.floor(this.animTimer) % dict.runs.length;
      activeImg = dict.runs[idx] || dict.idle;
    } else if (Math.abs(this.vx) > 15 && dict.walks && dict.walks.length > 0) {
      const idx = Math.floor(this.animTimer) % dict.walks.length;
      activeImg = dict.walks[idx] || dict.idle;
    }

    let spriteW = this.type === 'pedro_horse' ? 140 : (this.width + 24);
    let spriteH = this.type === 'pedro_horse' ? 135 : (this.height + 15);
    let trotY = 0;

    if (this.type === 'carriage') {
      spriteW = 310;
      spriteH = 151;
      trotY = 0; // A animação dos 29 quadros extraídos do vídeo já possui o balanço autêntico da suspensão!
    } else if (activeImg && activeImg.naturalWidth > 0 && activeImg.naturalHeight > 0) {
      spriteH = this.height + 18;
      spriteW = Math.round(spriteH * (activeImg.naturalWidth / activeImg.naturalHeight));
    }

    // Escala visual: personagens mais legíveis sem mudar a jogabilidade.
    // O collider, a física, a posição dos pés e a jogabilidade permanecem iguais.
    const visualScale = 1.6;
    spriteW = Math.round(spriteW * visualScale);
    spriteH = Math.round(spriteH * visualScale);
    const offsetY = -spriteH;

    if (activeImg && activeImg.complete && activeImg.naturalWidth > 0) {
      ctx.drawImage(activeImg, -spriteW / 2, offsetY + trotY, spriteW, spriteH);
    } else {
      ctx.fillStyle = this.getThemeColor();
      ctx.beginPath();
      ctx.ellipse(0, -spriteH / 2, spriteW / 3, spriteH / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Efeito de vestido aberto ao planar (Maria Rosa)
    if (this.isGliding) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 112, 166, 0.4)';
      ctx.beginPath();
      ctx.ellipse(0, -35, 52, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }
}

/**
 * GRIS PARTY CONTROLLER
 * Unifica o líder e o companheiro (Rei & Rainha) com comportamento natural,
 * ou o personagem único nos atos individuais dos filhos.
 */
class GrisCharacter {
  constructor(mode = 'couple', startX = 200, startY = 800) {
    this.mode = mode; // 'couple', 'matheus', 'pedro', 'pedro_horse', 'maria_rosa', 'family_swap'
    this.leaderType = 'king';
    this.familyList = ['matheus', 'pedro', 'maria_rosa', 'king', 'queen'];
    this.familyIdx = 0;
    this.familyParty = [];

    this.king = new GrisIndividualCharacter('king', startX, startY);
    this.queen = new GrisIndividualCharacter('queen', startX - 70, startY);
    this.singleChar = null;

    this.lastSafeX = startX;
    this.lastSafeY = startY;

    this.setMode(mode, startX, startY);
  }

  setMode(mode, startX, startY) {
    this.mode = mode;

    if (mode === 'couple') {
      this.leaderType = 'king';
      this.king.x = startX;
      this.king.y = startY;
      this.king.vx = 0;
      this.king.vy = 0;

      this.queen.x = startX - 70;
      this.queen.y = startY;
      this.queen.vx = 0;
      this.queen.vy = 0;
      this.queen.facing = 1;
      this.singleChar = null;
    } else if (mode === 'family_swap') {
      // No ato final a família inteira atravessa o pátio junta. Matheus lidera
      // e os demais correm em formação atrás dele, sem virar personagens
      // separados nem exigir troca manual para acompanhar a cena.
      this.familyIdx = 0;
      this.familyParty = this.familyList.map((type, index) => {
        const member = new GrisIndividualCharacter(type, startX - index * 76, startY);
        member.facing = 1;
        member.vx = 0;
        member.vy = 0;
        return member;
      });
      this.singleChar = this.familyParty[0];
    } else {
      this.familyParty = [];
      this.singleChar = new GrisIndividualCharacter(mode, startX, startY);
    }
  }

  get active() {
    if (this.mode === 'couple') {
      return this.leaderType === 'king' ? this.king : this.queen;
    }
    return this.singleChar;
  }

  get companion() {
    if (this.mode === 'couple') {
      return this.leaderType === 'king' ? this.queen : this.king;
    }
    return null;
  }

  // Delegadores de propriedades físicas transparentes para o PhysicsEngine
  get type() { return this.active.type; }
  get x() { return this.active.x; }
  set x(val) { this.active.x = val; }
  get y() { return this.active.y; }
  set y(val) { this.active.y = val; }
  get vx() { return this.active.vx; }
  set vx(val) { this.active.vx = val; }
  get vy() { return this.active.vy; }
  set vy(val) { this.active.vy = val; }
  get width() { return this.active.width; }
  get height() { return this.active.height; }
  get onGround() { return this.active.onGround; }
  set onGround(val) { this.active.onGround = val; }
  get isGrounded() { return this.active.onGround; }
  set isGrounded(val) { this.active.onGround = val; }
  get facing() { return this.active.facing; }
  set facing(val) { this.active.facing = val; }
  get coyoteTimer() { return this.active.coyoteTimer; }
  set coyoteTimer(val) { this.active.coyoteTimer = val; }
  get hasDoubleJump() { return this.active.hasDoubleJump; }
  set hasDoubleJump(val) { this.active.hasDoubleJump = val; }
  get isJumping() { return this.active.isJumping; }
  set isJumping(val) { this.active.isJumping = val; }
  get isGliding() { return this.active.isGliding; }
  set isGliding(val) { this.active.isGliding = val; }
  get isSlamming() { return this.active.isSlamming; }
  set isSlamming(val) { this.active.isSlamming = val; }
  get isStoneAnchor() { return this.active.isStoneAnchor; }
  set isStoneAnchor(val) { this.active.isStoneAnchor = val; }
  get isWallSliding() { return this.active.isWallSliding; }
  set isWallSliding(val) { this.active.isWallSliding = val; }
  get touchingWall() { return this.active.touchingWall; }
  set touchingWall(val) { this.active.touchingWall = val; }
  get wallContactTimer() { return this.active.wallContactTimer; }
  set wallContactTimer(val) { this.active.wallContactTimer = val; }
  get wallJumpControlLockout() { return this.active.wallJumpControlLockout; }
  set wallJumpControlLockout(val) { this.active.wallJumpControlLockout = val; }
  get isSinging() { return this.active.isSinging; }
  set isSinging(val) { this.active.isSinging = val; }
  get inWater() { return this.active.inWater; }
  set inWater(val) { this.active.inWater = val; }
  get gravityFlipped() { return false; }
  set gravityFlipped(val) { this.active.gravityFlipped = false; }
  get maxSpeed() { return this.active.maxSpeed; }

  get canHeavySlam() { return this.active.canHeavySlam; }
  get canDoubleJump() { return this.active.canDoubleJump; }
  get canGlide() { return this.active.canGlide; }
  get canSing() { return this.active.canSing; }
  get canPaintBridge() { return this.active.canPaintBridge; }

  getThemeColor() { return this.active.getThemeColor(); }

  // Alternar o líder do casal com 'C' ou alternar na família
  swap() {
    if (this.mode === 'couple') {
      this.leaderType = this.leaderType === 'king' ? 'queen' : 'king';
      if (this.active.y > 2050 - this.active.height) {
        this.active.y = 2050 - this.active.height;
        this.active.vy = 0;
        this.active.onGround = true;
      }
      window.gameEngine?.particles?.spawnWatercolorBlobs(
        this.active.x + this.active.width / 2,
        this.active.y + this.active.height / 2,
        this.active.getThemeColor(),
        14
      );
      window.gameEngine?.audio?.playMemoryStarSound(1.3);
      return true;
    } else if (this.mode === 'family_swap') {
      // O encerramento é uma corrida coletiva: C não desmonta a formação.
      return false;
    }
    return false;
  }

  // Ação de Pintar Ponte (Matheus)
  paintBridge(interactiveElements) {
    if (!this.canPaintBridge || !interactiveElements) return;
    const bridgeX = this.facing === 1 ? (this.x + this.width + 10) : (this.x - 220 - 10);
    const bridgeY = this.y + this.height - 10;

    interactiveElements.addPaintBridge(bridgeX, bridgeY, 220, 20, '#3a86ff');
    window.gameEngine?.particles.spawnWatercolorBlobs(bridgeX + 110, bridgeY, '#48cae4', 18);
    window.gameEngine?.audio.playMemoryStarSound(0.9);
  }

  // Ação de Cantar (Maria Rosa)
  sing(interactiveElements) {
    if (!this.canSing || !interactiveElements) return;
    this.active.isSinging = true;
    this.active.singTimer = 1.2;

    window.gameEngine?.particles.spawnPetals(this.x + this.width / 2, this.y + this.height / 2, 22, '#ff70a6');
    window.gameEngine?.audio.playFloralBloomSound();
    interactiveElements.awakenNearbyFlowers(this.x + this.width / 2, this.y + this.height / 2, 380);
  }

  update(dt, particles, audio, platforms = []) {
    // 1. Atualizar Líder
    this.active.update(dt, particles, audio);

    // 2. Atualizar acompanhantes: casal nos atos iniciais ou a família
    // inteira no Ato VIII.
    if (this.mode === 'couple' || this.mode === 'family_swap') {
      const leader = this.active;
      const followers = this.mode === 'couple'
        ? [this.companion]
        : this.familyParty.filter((member) => member !== leader);

      followers.forEach((comp, followerIndex) => {
        const gap = this.mode === 'family_swap' ? 112 : 68;
        const targetOffset = leader.facing === 1
          ? -(gap * (followerIndex + 1))
          : gap * (followerIndex + 1);
        const targetX = leader.x + targetOffset;
        const dx = targetX - comp.x;

        if (Math.abs(dx) > 10) {
          comp.vx = Math.sign(dx) * Math.min(comp.maxSpeed * 0.98, Math.abs(dx) * 4.2);
          comp.facing = dx > 0 ? 1 : -1;
        } else {
          comp.vx *= 0.65;
          comp.facing = leader.facing;
        }

        const prevCompY = comp.y;
        comp.vy += 1450 * dt;
        comp.vy = Math.min(950, comp.vy);

        if (leader.isJumping && comp.onGround && leader.vy < -250 && comp.jumpCooldown <= 0) {
          comp.vy = -720;
          comp.onGround = false;
          comp.isJumping = true;
          comp.jumpCooldown = 0.35;
        }

        comp.x += comp.vx * dt;
        comp.y += comp.vy * dt;
        comp.onGround = false;
        const compFootPrev = prevCompY + comp.height;
        const compFootNow = comp.y + comp.height;

        for (const plat of platforms) {
          if (comp.x + comp.width * 0.75 > plat.x && comp.x + comp.width * 0.25 < plat.x + plat.width) {
            if (comp.vy >= 0 && compFootPrev <= plat.y + 16 && compFootNow >= plat.y) {
              comp.y = plat.y - comp.height;
              comp.vy = 0;
              comp.onGround = true;
              comp.isJumping = false;
              break;
            }
          }
        }

        const floorLimit = 2050 - comp.height;
        if (comp.y > floorLimit) {
          comp.y = floorLimit;
          comp.vy = 0;
          comp.onGround = true;
          comp.isJumping = false;
        }

        const maxGroupDistance = this.mode === 'family_swap'
          ? 360 + followerIndex * 84
          : 320;
        const distToLeaderX = Math.abs(comp.x - leader.x);
        const distToLeaderY = comp.y - leader.y;
        if (distToLeaderX > maxGroupDistance || distToLeaderY > 80) {
          comp.x = targetX;
          comp.y = leader.y;
          comp.vx = leader.vx;
          comp.vy = 0;
          comp.onGround = leader.onGround;
          comp.isJumping = false;
        }

        comp.update(dt, particles, audio);
      });
    }
  }

  draw(ctx, time) {
    const isBW = window.gameEngine?.levels?.getCurrentChapter()?.colorKey === 'gray';

    if (this.mode === 'couple') {
      // Desenha o companheiro primeiro (ligeiramente atrás no plano)
      this.companion.draw(ctx, time, isBW);
      // Desenha o líder em destaque na frente
      this.active.draw(ctx, time, isBW);
    } else if (this.mode === 'family_swap') {
      // Todos os cinco personagens aparecem correndo juntos no encerramento.
      for (let i = this.familyParty.length - 1; i >= 0; i--) {
        this.familyParty[i].draw(ctx, time, isBW);
      }
    } else {
      this.active.draw(ctx, time, isBW);
    }
  }
}

window.GrisIndividualCharacter = GrisIndividualCharacter;
window.GrisCharacter = GrisCharacter;
