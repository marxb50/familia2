/**
 * ==============================================================================
 * PHYSICS ENGINE (Física Poética de Inércia, Gliding & Heavy Slam)
 * Inspirada na Fluidez e Leveza de GRIS
 * ==============================================================================
 */
class PhysicsEngine {
  constructor() {
    // 20% faster jump tempo: scale velocity by 1.2 and gravity by 1.2².
    // This shortens the flight without shrinking the established jump height.
    this.jumpTempo = 1.2;
    this.gravity = 1450 * this.jumpTempo ** 2;
    this.glideGravity = 280 * this.jumpTempo ** 2;
    this.maxFallSpeed = 950 * this.jumpTempo;
    this.maxGlideSpeed = 220 * this.jumpTempo;
    this.slamSpeed = 1600 * this.jumpTempo;
    this.groundFriction = 0.82;       // Fricção natural ao parar
    this.airDrag = 0.94;              // Resistência no ar

    this.jumpForce = -780 * this.jumpTempo;
    this.doubleJumpForce = -680 * this.jumpTempo;

    this.coyoteTimeMax = 0.18;        // 180ms generosos de tolerância após sair da plataforma
  }

  updateEntity(entity, input, platforms, interactiveElements, dt, worldBounds = null) {
    // 1. Atualizar Temporizadores e Checkpoint de Segurança
    if (entity.onGround) {
      entity.coyoteTimer = this.coyoteTimeMax;
      entity.hasDoubleJump = true;
      entity.isGliding = false;
      entity.isSlamming = false;
      entity.wallContactTimer = 0;
      entity.touchingWall = 0;
      entity.wallJumpControlLockout = 0;

      // Gravar ponto seguro de solo
      if (!entity.gravityFlipped) {
        entity.lastSafeX = entity.x;
        entity.lastSafeY = entity.y;
      }
    } else {
      entity.coyoteTimer = Math.max(0, entity.coyoteTimer - dt);
      entity.wallContactTimer = Math.max(0, (entity.wallContactTimer || 0) - dt);
    }

    // 2. Movimentação Horizontal com Resposta Imediata e Fluida
    const maxSpeed = entity.maxSpeed || 340;
    const moveAxis = input.axisX;

    if (entity.wallJumpControlLockout > 0) {
      entity.wallJumpControlLockout -= dt;
      // Mantém impulso lateral para afastar da parede de forma agradável
      entity.vx *= 0.97;
    } else if (Math.abs(moveAxis) > 0.05) {
      const targetVx = moveAxis * maxSpeed;
      const lerp = entity.onGround ? 0.38 : 0.22;
      entity.vx += (targetVx - entity.vx) * lerp;
      entity.facing = Math.sign(moveAxis);
    } else {
      const friction = entity.onGround ? this.groundFriction : this.airDrag;
      entity.vx *= friction;
      if (Math.abs(entity.vx) < 5) entity.vx = 0;
    }

    // 3. Mecânica de Pulo, Salto Duplo & Pulo na Parede (Wall Jump)
    const jumpRequested = input.consumeJump();
    const baseJump = entity.jumpForceOverride ? entity.jumpForceOverride * this.jumpTempo : this.jumpForce;
    const activeJumpForce = -Math.abs(baseJump);

    if (jumpRequested) {
      if (entity.coyoteTimer > 0) {
        // Pulo do solo
        entity.vy = activeJumpForce;
        entity.onGround = false;
        entity.coyoteTimer = 0;
        entity.isJumping = true;
        entity.onJumpStart?.();
      } else if (!entity.onGround && ((entity.touchingWall && entity.touchingWall !== 0) || (entity.wallContactTimer > 0))) {
        // PULO NA PAREDE (Wall Jump: bate na parede, aperta pulo e pula de novo)
        const wallDir = (entity.touchingWall && entity.touchingWall !== 0) ? entity.touchingWall : (entity.lastWallDir || 1);
        
        // Impulso vertical forte e controlado
        entity.vy = -Math.abs(baseJump) * 0.95;
        
        // Impulso horizontal para afastar da parede e permitir encadear pulos entre paredes
        entity.vx = -wallDir * 320;
        entity.facing = -wallDir;
        
        // Trava de controle para o pulo não ser anulado se o jogador mantiver a seta pressionada contra a parede
        entity.wallJumpControlLockout = 0.16;
        
        entity.touchingWall = 0;
        entity.wallContactTimer = 0;
        entity.onGround = false;
        entity.isJumping = true;
        entity.isGliding = false;
        entity.isSlamming = false;
        
        entity.onWallJump?.(wallDir);
      } else if (entity.canDoubleJump && entity.hasDoubleJump && !entity.onGround) {
        // Salto duplo aquarela (Matheus)
        entity.vy = -Math.abs(this.doubleJumpForce);
        entity.hasDoubleJump = false;
        entity.isGliding = false;
        entity.onDoubleJump?.();
      }
    }

    // Corte de pulo suave (apenas quando o jogador solta o botão de pulo voluntariamente)
    if (input.consumeJumpRelease()) {
      if (entity.vy < -250 * this.jumpTempo) {
        entity.vy *= 0.52;
      }
    }

    // 4. Mecânica de Heavy Slam (Pedro)
    const slamRequested = input.consumeSlam();
    if (slamRequested && !entity.onGround && entity.canHeavySlam && !entity.isSlamming) {
      entity.isSlamming = true;
      entity.isGliding = false;
      entity.vx = 0;
      entity.vy = this.slamSpeed;
      entity.onSlamStart?.();
    }

    // 5. Mecânica de Dress Glide (Maria Rosa)
    if (entity.canGlide && !entity.onGround && input.jumpHeld && entity.vy > 40 && !entity.isSlamming) {
      entity.isGliding = true;
    } else {
      entity.isGliding = false;
    }

    // 6. Rajadas Violentas de Vento do Deserto (Vermelho / Carmim)
    if (interactiveElements?.isWindBlowing) {
      const isStoneAnchor = entity.canHeavySlam && entity.onGround && input.axisY > 0.5;
      entity.isStoneAnchor = isStoneAnchor;

      if (!isStoneAnchor) {
        // Vento sopra e empurra para a esquerda (a menos que esteja na forma de pedra)
        const windPush = interactiveElements.windForce || -360;
        entity.vx += windPush * dt;
      } else {
        // Ancorado como bloco pesado de pedra no chão
        entity.vx = 0;
      }
    } else {
      entity.isStoneAnchor = false;
    }

    // 7. Canais de Água e Luz Suspensa (Azul / Ruínas Submersas)
    entity.inWater = false;
    if (interactiveElements?.waterVolumes) {
      const centerX = entity.x + entity.width / 2;
      const centerY = entity.y + entity.height / 2;

      for (const water of interactiveElements.waterVolumes) {
        if (
          centerX >= water.x && centerX <= water.x + water.width &&
          centerY >= water.y && centerY <= water.y + water.height
        ) {
          entity.inWater = true;
          break;
        }
      }
    }

    // 8. Aplicação de Gravidade Normal e Flutuação
    entity.gravityFlipped = false;
    let activeGravity = this.gravity;
    let terminalVel = this.maxFallSpeed;

    const isWallSliding = !entity.onGround && entity.touchingWall !== 0 && !entity.isSlamming && entity.vy > 0;
    entity.isWallSliding = isWallSliding;

    if (entity.inWater) {
      // Física aquática de Gris: nado livre, leve e flutuante
      activeGravity = 120;
      terminalVel = 260;
      entity.vx *= 0.90;
      entity.vy *= 0.90;
      if (input.axisY !== 0) entity.vy = input.axisY * 280;
      if (input.jumpHeld) entity.vy = -300;
    } else if (entity.isSlamming) {
      activeGravity = this.gravity * 2.2;
      terminalVel = this.slamSpeed;
    } else if (isWallSliding) {
      // Deslize suave pela parede (Wall Slide poético de Gris/Celeste)
      activeGravity = this.gravity * 0.35;
      terminalVel = 180; // Desce suavemente pela parede
    } else if (entity.isGliding) {
      activeGravity = this.glideGravity;
      terminalVel = this.maxGlideSpeed;
    } else if (Math.abs(entity.vy) < 80 * this.jumpTempo && !entity.onGround) {
      // Ápice do pulo: leveza poética
      activeGravity = this.gravity * 0.45;
    }

    entity.vy += activeGravity * dt;
    entity.vy = Math.min(terminalVel, entity.vy);

    // 9. Interação com Correntes de Vento Ascendentes (Wind Updrafts Controlados)
    if (interactiveElements?.windUpdrafts) {
      const centerX = entity.x + entity.width / 2;
      const centerY = entity.y + entity.height / 2;

      for (const wind of interactiveElements.windUpdrafts) {
        if (
          centerX >= wind.x &&
          centerX <= wind.x + wind.width &&
          centerY >= wind.y &&
          centerY <= wind.y + wind.height
        ) {
          const liftPower = entity.isGliding ? Math.min(600, wind.force * 1.1) : Math.min(420, wind.force * 0.8);
          const maxAscent = Math.min(380, wind.maxAscent || 380);
          entity.vy = Math.max(-maxAscent, entity.vy - liftPower * dt);
          entity.inWindStream = true;
          entity.onWindContact?.();
          break;
        } else {
          entity.inWindStream = false;
        }
      }
    }

    // 10. Integração de Movimento & Colisão com Plataformas
    this.resolveCollisions(entity, platforms, interactiveElements, dt);

    // 11. Limites do Mundo & Proteção contra o Vazio (Gris: Sem Morte / Sem Queda Infinita)
    if (worldBounds) {
      // Limites laterais
      const minX = worldBounds.x + 5;
      const maxX = worldBounds.x + worldBounds.width - entity.width - 5;
      if (entity.x < minX) {
        entity.x = minX;
        if (entity.vx < 0) entity.vx = 0;
      } else if (entity.x > maxX) {
        entity.x = maxX;
        if (entity.vx > 0) entity.vx = 0;
      }

      // TETO MÁXIMO DO MUNDO: IMPEDE O PERSONAGEM DE SAIR VOANDO ALÉM DO CÉU!
      const minY = worldBounds.y + 40;
      if (entity.y < minY) {
        entity.y = minY;
        if (entity.vy < 0) entity.vy = 0;
      }

      // PISO MÁXIMO DO MUNDO: IMPEDE O PERSONAGEM DE CAIR DO CENÁRIO!
      const maxGroundY = 2050 - entity.height;
      if (entity.y > maxGroundY) {
        entity.y = maxGroundY;
        if (entity.vy > 0) entity.vy = 0;
        entity.onGround = true;
        entity.isJumping = false;
        entity.isSlamming = false;
      }

      // Detecção de Abismo: se o jogador cair além da área jogável do nível
      const abyssThreshold = worldBounds.y + worldBounds.height - 120;
      if (entity.y > abyssThreshold) {
        this.recoverFromAbyss(entity, worldBounds);
      }
    }
  }

  recoverFromAbyss(entity, worldBounds) {
    entity.gravityFlipped = false;
    const safeX = (entity.lastSafeX !== undefined && entity.lastSafeX >= worldBounds.x) ? entity.lastSafeX : (worldBounds.x + 200);
    const safeY = (entity.lastSafeY !== undefined && entity.lastSafeY >= worldBounds.y) ? entity.lastSafeY : (worldBounds.y + worldBounds.height - 500);

    entity.x = safeX;
    entity.y = safeY - 30;
    entity.vx = 0;
    entity.vy = 0; // Pouso suave sem impulso excessivo
    entity.onGround = false;
    entity.isSlamming = false;
    entity.isGliding = false;

    if (window.gameEngine) {
      window.gameEngine.particles?.spawnPetals(safeX + entity.width / 2, safeY, 35, '#ffd166');
      window.gameEngine.particles?.spawnWatercolorBlobs(safeX + entity.width / 2, safeY, '#48cae4', 16);
      window.gameEngine.audio?.playMemoryStarSound?.(0.9);

      if (window.gameEngine.camera) {
        window.gameEngine.camera.targetX = safeX + entity.width / 2;
        window.gameEngine.camera.targetY = safeY - 40;
        window.gameEngine.camera.x = window.gameEngine.camera.targetX;
        window.gameEngine.camera.y = window.gameEngine.camera.targetY;
      }
    }
  }

  resolveCollisions(entity, platforms, interactiveElements, dt) {
    const steps = entity.isSlamming ? 3 : 1;
    const stepDt = dt / steps;

    for (let s = 0; s < steps; s++) {
      // Eixo X
      entity.x += entity.vx * stepDt;
      this.checkHorizontalCollisions(entity, platforms);

      // Eixo Y
      const prevY = entity.y;
      entity.y += entity.vy * stepDt;
      this.checkVerticalCollisions(entity, platforms, prevY, interactiveElements);
    }

    // Atualizar sensores de parede para Wall Jump e Wall Slide
    this.updateWallSensors(entity, platforms);
  }

  updateWallSensors(entity, platforms) {
    if (entity.onGround) {
      entity.touchingWall = 0;
      return;
    }

    const sensorMargin = 4;
    const sensorY = entity.y + 12;
    const sensorH = Math.max(16, entity.height - 24);

    const rightSensor = {
      x: entity.x + entity.width,
      y: sensorY,
      width: sensorMargin,
      height: sensorH
    };

    const leftSensor = {
      x: entity.x - sensorMargin,
      y: sensorY,
      width: sensorMargin,
      height: sensorH
    };

    let wallDetected = 0;
    for (const plat of platforms) {
      if (plat.isOneWay || plat.isBouncy) continue;

      if (this.intersects(rightSensor, plat)) {
        wallDetected = 1;
        break;
      }
      if (this.intersects(leftSensor, plat)) {
        wallDetected = -1;
        break;
      }
    }

    entity.touchingWall = wallDetected;
    if (wallDetected !== 0) {
      entity.lastWallDir = wallDetected;
      entity.wallContactTimer = 0.18;
    }
  }

  checkHorizontalCollisions(entity, platforms) {
    for (const plat of platforms) {
      if (plat.isOneWay || plat.isBouncy) continue;

      if (this.intersects(entity, plat)) {
        // Assistência de Degrau (Step-up Assist): sobe degraus baixos (<= 18px) automaticamente
        const feetY = entity.y + entity.height;
        const stepDiff = feetY - plat.y;
        if (stepDiff > 0 && stepDiff <= 18 && entity.vy >= -50) {
          entity.y = plat.y - entity.height;
          entity.onGround = true;
          entity.vy = 0;
          continue;
        }

        // Colisão padrão de parede
        if (entity.vx > 0) {
          entity.x = plat.x - entity.width;
          entity.vx = 0;
          entity.touchingWall = 1;
          entity.lastWallDir = 1;
          entity.wallContactTimer = 0.18;
        } else if (entity.vx < 0) {
          entity.x = plat.x + plat.width;
          entity.vx = 0;
          entity.touchingWall = -1;
          entity.lastWallDir = -1;
          entity.wallContactTimer = 0.18;
        }
      }
    }
  }

  checkVerticalCollisions(entity, platforms, prevY, interactiveElements) {
    entity.onGround = false;
    const allPlats = platforms;

    for (const plat of allPlats) {
      if (!this.intersects(entity, plat)) continue;

      // 1. Cogumelo Elástico / Impulso Elástico (Bounce Pad: ativa ao pisar ou colidir)
      if (plat.isBouncy) {
        if (entity.vy >= -120) {
          entity.y = plat.y - entity.height;
          this.handleLanding(entity, plat, interactiveElements);
          return;
        }
      }

      // 2. Plataformas One-Way
      if (plat.isOneWay) {
        // One-way: colide ao cair ou pisar de cima da plataforma
        const prevBottom = prevY + entity.height;
        const currentBottom = entity.y + entity.height;
        if (prevBottom <= plat.y + 24 && currentBottom >= plat.y && entity.vy >= 0) {
          entity.y = plat.y - entity.height;
          this.handleLanding(entity, plat, interactiveElements);
          return;
        }
      } else {
        // Plataforma totalmente sólida
        if (entity.vy > 0) {
          entity.y = plat.y - entity.height;
          this.handleLanding(entity, plat, interactiveElements);
          return;
        } else if (entity.vy < 0) {
          // Correção de Canto na Cabeça (Corner Correction / Head Assist)
          const leftOverlap = (entity.x + entity.width) - plat.x;
          const rightOverlap = (plat.x + plat.width) - entity.x;

          if (leftOverlap > 0 && leftOverlap <= 14) {
            entity.x = plat.x - entity.width;
            continue;
          } else if (rightOverlap > 0 && rightOverlap <= 14) {
            entity.x = plat.x + plat.width;
            continue;
          }

          entity.y = plat.y + plat.height;
          entity.vy = 0;
        }
      }
    }
  }

  handleLanding(entity, platform, interactiveElements) {
    // 1. Cogumelo Elástico / Copa de Árvore Flexível (Verde / Gris)
    if (platform.isBouncy) {
      const rawForce = platform.bounceForce || -840;
      const bForce = -Math.min(880, Math.max(700, Math.abs(rawForce))) * this.jumpTempo;
      entity.vy = bForce;
      entity.onGround = false;
      entity.isJumping = true;
      entity.isGliding = false;
      entity.isSlamming = false;
      platform.squish = 1.0;
      window.gameEngine?.audio?.playBounceSound?.();
      window.gameEngine?.particles?.spawnPetals(entity.x + entity.width / 2, platform.y, 10, '#52b788');
      return;
    }

    const wasSlamming = entity.isSlamming;
    const impactSpeed = entity.vy;

    entity.vy = 0;
    entity.onGround = true;
    entity.isJumping = false;
    entity.isGliding = false;
    entity.isSlamming = false;

    // Disparar evento de aterrissagem
    entity.onLanding?.(impactSpeed, wasSlamming, platform);

    // Se aterrissou com Heavy Slam em piso quebradiço
    if (wasSlamming && platform.isCracked && interactiveElements) {
      interactiveElements.breakPlatform?.(platform);
    }

    // Se aterrissou em placa de pressão
    if (platform.isPressurePlate && interactiveElements) {
      interactiveElements.activatePressurePlate?.(platform, wasSlamming);
    }
  }

  intersects(r1, r2) {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }
}

window.PhysicsEngine = PhysicsEngine;
