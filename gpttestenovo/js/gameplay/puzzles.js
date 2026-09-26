/**
 * ==============================================================================
 * GRIS INTERACTIVE PUZZLES & MECHANISMS (Mecânicas Poéticas do Mundo)
 * Constelações, Mármores Quebradiços, Pontes de Aquarela, Vento & Flores
 * ==============================================================================
 */
class InteractivePuzzleManager {
  constructor() {
    this.memoryStars = [];
    this.paintBrushes = [];       // Colecionáveis exclusivos do Ato III de Matheus
    this.followingStars = [];      // Estrelas que orbitam o jogador como constelação viva
    this.crackedFloors = [];
    this.temporaryBridges = [];
    this.windUpdrafts = [];
    this.bloomingFlowers = [];
    this.pressurePlates = [];
    this.colorBeacons = [];
    this.constellationLinks = [];
    this.constellationChasms = [];

    // Novas Mecânicas Centrais de GRIS
    this.bouncyMushrooms = [];     // Cogumelos elásticos e copas de árvores flexíveis (Verde)
    this.waterVolumes = [];        // Canais de água suspensa que desafiam a gravidade (Azul)
    this.gravityPortals = [];      // Portais de espelho com inversão de gravidade (Dourado)
    this.peacefulCreatures = [];   // Criaturas de pedra e folhas que interagem (Verde)

    // Sistema de Tempestade de Vento Carmim (Vermelho)
    this.hasWindStorm = false;
    this.windCycleTimer = 0;
    this.isWindBlowing = false;
    this.windForce = -380;

    this.collectedStarsCount = 0;
    this.paintBrushesCollected = 0;
    this.totalStarsInLevel = 0;

    this.paintBrushImage = new Image();
    this.paintBrushImage.src = 'assets/images/ui/item_brush_blue.png?v=16.0';
  }

  reset() {
    this.memoryStars = [];
    this.paintBrushes = [];
    this.followingStars = [];
    this.crackedFloors = [];
    this.temporaryBridges = [];
    this.windUpdrafts = [];
    this.bloomingFlowers = [];
    this.pressurePlates = [];
    this.colorBeacons = [];
    this.constellationLinks = [];
    this.constellationChasms = [];
    this.bouncyMushrooms = [];
    this.waterVolumes = [];
    this.gravityPortals = [];
    this.peacefulCreatures = [];
    this.hasWindStorm = false;
    this.isWindBlowing = false;
    this.windCycleTimer = 0;
    this.collectedStarsCount = 0;
    this.paintBrushesCollected = 0;
    this.totalStarsInLevel = 0;
  }

  // 1. Estrela de Memória Cósmica (vira estrela seguidora ao coletar)
  addMemoryStar(x, y, id) {
    this.memoryStars.push({
      id: id || Math.random(),
      x, y,
      baseY: y,
      radius: 12,
      collected: false,
      pulseTimer: Math.random() * 5
    });
    this.totalStarsInLevel++;
  }

  // Pincéis mágicos: substituem as estrelas brilhantes apenas no Ato III.
  addPaintBrush(x, y, id, colorAmount = 0.18) {
    this.paintBrushes.push({
      id: id || Math.random(),
      x, y,
      baseY: y,
      radius: 26,
      collected: false,
      pulseTimer: Math.random() * 5,
      colorAmount
    });
    // Continua sendo um item coletável para o contador do HUD, sem virar
    // uma estrela seguidora nem criar degraus de constelação.
    this.totalStarsInLevel++;
  }

  // 2. Piso de Mármore Quebradiço (Esmagável por Pedro com Heavy Slam)
  addCrackedFloor(x, y, width, height, id) {
    this.crackedFloors.push({
      id: id || Math.random(),
      x, y, width, height,
      broken: false,
      isCracked: true,
      crackLines: [
        { x1: 0.2, y1: 0, x2: 0.4, y2: 1 },
        { x1: 0.5, y1: 0, x2: 0.6, y2: 0.8 },
        { x1: 0.7, y1: 0.2, x2: 0.85, y2: 1 }
      ]
    });
  }

  // 3. Corrente de Vento Térmica Ascendente (impulsiona para o alto)
  addWindUpdraft(x, y, width, height, force = 950, maxAscent = 750) {
    this.windUpdrafts.push({
      x, y, width, height,
      force,
      maxAscent,
      particleTimer: 0
    });
  }

  // 4. Flor Mágica que Desabrocha sob Canção (Maria Rosa)
  addBloomingFlower(x, y, width = 140, id) {
    this.bloomingFlowers.push({
      id: id || Math.random(),
      x, y, width, height: 25,
      isOneWay: true,
      bloomed: false,
      petalScale: 0.1,
      targetScale: 0.1,
      glowTimer: 0
    });
  }

  // 5. Cogumelo Elástico / Copa Flexível de Origami (Verde / Gris)
  addBouncyMushroom(x, y, width = 140, bounceForce = -880, id) {
    this.bouncyMushrooms.push({
      id: id || Math.random(),
      x, y, width, height: 26,
      bounceForce,
      squish: 0,
      glowTimer: 0
    });
  }

  // 6. Canal de Água Suspensa no Ar (Azul / Gris)
  addWaterVolume(x, y, width, height, kind = 'water') {
    this.waterVolumes.push({ x, y, width, height, wavePhase: 0, kind });
  }

  // Poças de tinta azul que guardam os pincéis do Ato III.
  addPaintPool(x, y, width, height, id) {
    this.waterVolumes.push({ x, y, width, height, wavePhase: 0, kind: 'paint', id });
  }

  // 7. Portal de Espelho com Inversão de Gravidade (Dourado / Gris)
  addGravityPortal(x, y, width = 50, height = 120, targetFlipped = true) {
    this.gravityPortals.push({
      x, y, width, height,
      targetFlipped,
      cooldown: 0
    });
  }

  // 8. Tempestade de Vento Carmim do Deserto (Vermelho / Gris)
  setWindStorm(enabled = true, windForce = -380) {
    this.hasWindStorm = enabled;
    this.windForce = windForce;
  }

  // 9. Abismo de Constelação (onde as estrelas seguidoras formam a ponte)
  addConstellationChasm(triggerX, bridgeX, bridgeY, bridgeWidth) {
    this.constellationChasms.push({
      triggerX,
      bridgeX,
      bridgeY,
      bridgeWidth,
      activated: false
    });
  }

  // 10. Placa de Pressão Ancestral
  addPressurePlate(x, y, width = 120, height = 20, targetDoorId) {
    this.pressurePlates.push({
      x, y, width, height,
      isPressurePlate: true,
      depressed: false,
      targetDoorId,
      currentY: y
    });
  }

  // 11. Altar Sagrado de Despertar de Cor
  addColorBeacon(x, y, colorKey, title) {
    this.colorBeacons.push({
      x, y,
      width: 80, height: 160,
      colorKey,
      title,
      activated: false,
      floatTimer: 0
    });
  }

  // 12. Ponte Temporária de Tinta (Pintada por Matheus)
  addPaintBridge(x, y, width, height, color = '#3a86ff') {
    this.temporaryBridges.push({
      x, y, width, height,
      color,
      isOneWay: true,
      life: 7.5,
      maxLife: 7.5,
      alpha: 1.0
    });
  }

  // Quebrar Piso de Mármore
  breakPlatform(platform) {
    for (const f of this.crackedFloors) {
      if (f.x === platform.x && f.y === platform.y && !f.broken) {
        f.broken = true;
        break;
      }
    }
  }

  // Acionar Placa de Pressão
  activatePressurePlate(platform, wasSlamming) {
    for (const p of this.pressurePlates) {
      if (p.x === platform.x && !p.depressed) {
        p.depressed = true;
        p.currentY = p.y + 10;
        window.gameEngine?.audio.playHeavySlamSound();
        window.gameEngine?.camera.triggerShake(14);
        window.gameEngine?.onPuzzleSolved?.(p.targetDoorId);
        break;
      }
    }
  }

  // Despertar Flores Próximas via Canto
  awakenNearbyFlowers(sourceX, sourceY, radius = 380) {
    for (const f of this.bloomingFlowers) {
      const dist = Math.hypot((f.x + f.width / 2) - sourceX, f.y - sourceY);
      if (dist <= radius && !f.bloomed) {
        f.bloomed = true;
        f.targetScale = 1.0;
        window.gameEngine?.particles.spawnPetals(f.x + f.width / 2, f.y, 14, '#ff70a6');
      }
    }
  }

  update(character, particles, audio, dt) {
    const charCenterX = character.x + character.width / 2;
    const charCenterY = character.y + character.height / 2;

    // 1. Atualizar Estrelas de Memória e Coleta
    for (const star of this.memoryStars) {
      if (star.collected) continue;
      star.pulseTimer += dt * 3;
      star.y = star.baseY + Math.sin(star.pulseTimer) * 8;

      const dist = Math.hypot(charCenterX - star.x, charCenterY - star.y);
      if (dist < star.radius + 35) {
        star.collected = true;
        this.collectedStarsCount++;
        particles.spawnMemoryStars(star.x, star.y, 25, '#ffd166');
        audio.playMemoryStarSound(1.0 + (this.collectedStarsCount * 0.12));

        // Registrar ponto na constelação
        this.constellationLinks.push({ x: star.x, y: star.y });

        // Adicionar à constelação viva de estrelas seguidoras (como em GRIS)
        this.followingStars.push({
          currentX: star.x,
          currentY: star.y,
          angleOffset: this.followingStars.length * 1.5,
          distOffset: 45 + (this.followingStars.length % 3) * 15
        });

        // Criar degrau de constelação estelar permanente
        this.temporaryBridges.push({
          x: star.x - 70,
          y: star.y + 20,
          width: 140,
          height: 14,
          isConstellation: true,
          color: '#ffd166',
          isOneWay: true,
          life: 9999,
          maxLife: 9999,
          alpha: 0.95
        });
      }
    }

    // Pincéis mágicos do Matheus: esta interação só existe enquanto o
    // protagonista ativo é Matheus, portanto os demais atos não são afetados.
    if (character.mode === 'matheus') {
      for (const brush of this.paintBrushes) {
        if (brush.collected) continue;
        brush.pulseTimer += dt * 3;
        brush.y = brush.baseY + Math.sin(brush.pulseTimer) * 8;

        const dist = Math.hypot(charCenterX - brush.x, charCenterY - brush.y);
        if (dist < brush.radius + 35) {
          brush.collected = true;
          this.collectedStarsCount++;
          this.paintBrushesCollected++;
          particles.spawnWatercolorBlobs(brush.x, brush.y, '#3a86ff', 22);
          audio.playMemoryStarSound(1.15 + (this.paintBrushesCollected * 0.12));
          window.gameEngine?.onMatheusBrushCollected?.(brush.colorAmount, brush.x, brush.y);
        }
      }
    }

    // 2. Atualizar Estrelas Seguidoras (Constelação viva que segue o jogador)
    for (let i = 0; i < this.followingStars.length; i++) {
      const fs = this.followingStars[i];
      const targetAngle = (window.performance.now() * 0.002) + fs.angleOffset;
      const targetX = charCenterX + Math.cos(targetAngle) * fs.distOffset - (character.facing * 30);
      const targetY = charCenterY + Math.sin(targetAngle) * (fs.distOffset * 0.6) - 40;

      fs.currentX += (targetX - fs.currentX) * 0.12;
      fs.currentY += (targetY - fs.currentY) * 0.12;
    }

    // 2.1 Verificar Abismos de Constelação (Estrelas esticam formando ponte estelar)
    for (const chasm of this.constellationChasms) {
      if (!chasm.activated && Math.abs(charCenterX - chasm.triggerX) < 180 && this.followingStars.length >= 2) {
        chasm.activated = true;
        this.temporaryBridges.push({
          x: chasm.bridgeX,
          y: chasm.bridgeY,
          width: chasm.bridgeWidth,
          height: 16,
          isConstellation: true,
          color: '#ffd166',
          isOneWay: true,
          life: 9999,
          maxLife: 9999,
          alpha: 0.95
        });
        audio.playColorAwakeningChord?.('gold');
        particles.spawnMemoryStars(chasm.bridgeX + chasm.bridgeWidth / 2, chasm.bridgeY, 30, '#ffd166');
      }
    }

    // 3. Atualizar Tempestade de Vento Carmim (Vermelho)
    if (this.hasWindStorm) {
      this.windCycleTimer += dt;
      // Ciclo: 4 segundos de calma, 3.2 segundos de vendaval
      const inCycle = this.windCycleTimer % 7.2;
      this.isWindBlowing = inCycle < 3.2;

      if (this.isWindBlowing) {
        if (Math.random() > 0.4) {
          particles.spawnWindGusts(charCenterX + 700, charCenterY - 400, 200, 800, 4);
        }
      }
    } else {
      this.isWindBlowing = false;
    }

    // 4. Atualizar Cogumelos Elásticos (Verde)
    for (const m of this.bouncyMushrooms) {
      if (m.squish > 0) {
        m.squish = Math.max(0, m.squish - dt * 3.5);
      }
      m.glowTimer = (m.glowTimer || 0) + dt * 2.5;
    }

    // 5. Atualizar Portais de Espelho Dourado (Passagem Sagrada sem inversão descontrolada)
    for (const p of this.gravityPortals) {
      if (p.cooldown > 0) p.cooldown = Math.max(0, p.cooldown - dt);

      if (p.cooldown <= 0) {
        if (
          charCenterX >= p.x && charCenterX <= p.x + p.width &&
          charCenterY >= p.y && charCenterY <= p.y + p.height
        ) {
          p.cooldown = 1.2;
          audio.playMemoryStarSound(1.6);
          particles.spawnWatercolorBlobs(charCenterX, charCenterY, '#ffd166', 18);
        }
      }
    }

    // 6. Atualizar Pontes de Tinta Temporárias
    for (let i = this.temporaryBridges.length - 1; i >= 0; i--) {
      const b = this.temporaryBridges[i];
      if (b.isConstellation) continue;
      b.life -= dt;
      b.alpha = Math.min(1.0, b.life / 1.5);
      if (b.life <= 0) {
        particles.spawnWatercolorBlobs(b.x + b.width / 2, b.y, b.color, 8);
        this.temporaryBridges.splice(i, 1);
      }
    }

    // 7. Atualizar Flores que Desabrocham
    for (const f of this.bloomingFlowers) {
      f.petalScale += (f.targetScale - f.petalScale) * 0.1;
      if (f.bloomed) {
        f.glowTimer += dt * 4;
      }
    }

    // 8. Atualizar Correntes de Vento
    for (const w of this.windUpdrafts) {
      w.particleTimer += dt;
      if (w.particleTimer > 0.08) {
        w.particleTimer = 0;
        particles.spawnWindGusts(w.x, w.y, w.width, w.height, 2);
      }
    }

    // 9. Verificar Altares de Despertar de Cor
    for (const beacon of this.colorBeacons) {
      if (beacon.activated) continue;
      beacon.floatTimer += dt * 2;

      const dist = Math.hypot(charCenterX - beacon.x, charCenterY - beacon.y);
      if (dist < 90) {
        beacon.activated = true;
        window.gameEngine?.awakenColorChapter(beacon.colorKey, beacon.title, beacon.x, beacon.y);
      }
    }
  }

  // Retorna plataformas ativas para colisão
  getActivePlatforms() {
    const plats = [];

    // Pisos de mármore não quebrados
    for (const f of this.crackedFloors) {
      if (!f.broken) plats.push(f);
    }

    // Flores desabrochadas
    for (const f of this.bloomingFlowers) {
      if (f.petalScale > 0.6) {
        plats.push({
          x: f.x,
          y: f.y,
          width: f.width * f.petalScale,
          height: f.height,
          isOneWay: true
        });
      }
    }

    // Cogumelos elásticos e copas flexíveis (Verde)
    for (const m of this.bouncyMushrooms) {
      plats.push({
        x: m.x,
        y: m.y + (m.squish * 10),
        width: m.width,
        height: m.height,
        isBouncy: true,
        bounceForce: m.bounceForce,
        isOneWay: true
      });
    }

    // Pontes temporárias / constelações
    for (const b of this.temporaryBridges) {
      if (b.alpha > 0.2) plats.push(b);
    }

    // Placas de pressão
    for (const p of this.pressurePlates) {
      plats.push({
        x: p.x,
        y: p.currentY,
        width: p.width,
        height: p.height,
        isPressurePlate: true
      });
    }

    return plats;
  }

  draw(ctx, camBounds, pal, time) {
    // 0. Desenhar Canais de Água / Luz Suspensa no Ar (Azul)
    for (const w of this.waterVolumes) {
      ctx.save();
      const isPaint = w.kind === 'paint';
      ctx.fillStyle = isPaint ? 'rgba(58, 134, 255, 0.28)' : 'rgba(72, 202, 228, 0.22)';
      ctx.strokeStyle = isPaint ? 'rgba(128, 191, 255, 0.92)' : 'rgba(144, 224, 239, 0.75)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(w.x, w.y, w.width, w.height, 16);
      ctx.fill();
      ctx.stroke();

      // Ondas causticas de luz no topo da água / pinceladas na tinta azul
      ctx.strokeStyle = isPaint ? 'rgba(224, 241, 255, 0.95)' : '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = w.x; x < w.x + w.width; x += 30) {
        const wy = w.y + Math.sin(time * 3 + x * 0.05) * 5;
        if (x === w.x) ctx.moveTo(x, wy);
        else ctx.lineTo(x, wy);
      }
      ctx.stroke();

      if (isPaint) {
        ctx.fillStyle = 'rgba(157, 207, 255, 0.82)';
        for (let i = 0; i < 5; i++) {
          const dabX = w.x + 28 + i * ((w.width - 56) / 4);
          const dabY = w.y + 42 + Math.sin(time * 2 + i * 1.7) * 7;
          ctx.beginPath();
          ctx.ellipse(dabX, dabY, 9, 4, -0.2 + i * 0.08, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // 0.1 Desenhar Cogumelos Elásticos de Origami (Verde)
    for (const m of this.bouncyMushrooms) {
      ctx.save();
      ctx.translate(m.x + m.width / 2, m.y + m.height);
      const squishY = 1.0 - (m.squish || 0) * 0.45;
      const squishX = 1.0 + (m.squish || 0) * 0.35;
      ctx.scale(squishX, squishY);

      // Caule de origami
      ctx.fillStyle = '#2d6a4f';
      ctx.fillRect(-12, -m.height, 24, m.height);

      // Chapéu elástico arredondado
      ctx.fillStyle = '#52b788';
      ctx.strokeStyle = '#d8f3dc';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, -m.height, m.width / 2, 22, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Halo sutil de impulsão
      ctx.fillStyle = 'rgba(149, 213, 178, 0.4)';
      ctx.beginPath();
      ctx.arc(0, -m.height - 4, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 0.2 Desenhar Portais de Espelho com Inversão de Gravidade (Dourado)
    for (const p of this.gravityPortals) {
      ctx.save();
      ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
      const pulse = Math.sin(time * 3) * 6;

      // Moldura de cristal dourado
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 3.5;
      ctx.strokeRect(-p.width / 2, -p.height / 2, p.width, p.height);

      // Superfície de vidro espelhado
      const grad = ctx.createLinearGradient(0, -p.height / 2, 0, p.height / 2);
      grad.addColorStop(0, 'rgba(255, 209, 102, 0.4)');
      grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.65)');
      grad.addColorStop(1, 'rgba(255, 209, 102, 0.4)');
      ctx.fillStyle = grad;
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      ctx.restore();
    }

    // 0.3 Desenhar Estrelas Seguidoras (Constelação viva que acompanha o personagem)
    for (const fs of this.followingStars) {
      ctx.save();
      ctx.translate(fs.currentX, fs.currentY);
      const starGlow = 14 + Math.sin(time * 5 + fs.angleOffset) * 4;

      const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, starGlow);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, 'rgba(255, 220, 120, 0.8)');
      grad.addColorStop(1, 'rgba(255, 209, 102, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, starGlow, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // 1. Desenhar Linhas de Constelação Conectadas no Céu
    if (this.constellationLinks.length > 1) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 209, 102, 0.45)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(this.constellationLinks[0].x, this.constellationLinks[0].y);
      for (let i = 1; i < this.constellationLinks.length; i++) {
        ctx.lineTo(this.constellationLinks[i].x, this.constellationLinks[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 2. Desenhar Estrelas de Memória
    for (const star of this.memoryStars) {
      if (star.collected) continue;
      ctx.save();
      ctx.translate(star.x, star.y);

      // Halo de luz dourada
      const halo = 24 + Math.sin(star.pulseTimer * 1.5) * 6;
      const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, halo);
      grad.addColorStop(0, 'rgba(255, 240, 180, 0.8)');
      grad.addColorStop(0.6, 'rgba(255, 209, 102, 0.3)');
      grad.addColorStop(1, 'rgba(255, 209, 102, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, halo, 0, Math.PI * 2);
      ctx.fill();

      // Diamante de cristal central
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 10);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // Pincéis flutuantes sobre as poças azuis: não usam o diamante branco das
    // estrelas e permanecem coloridos mesmo quando o cenário está sem cor.
    for (const brush of this.paintBrushes) {
      if (brush.collected) continue;
      ctx.save();
      ctx.translate(brush.x, brush.y);

      const halo = 30 + Math.sin(brush.pulseTimer * 1.5) * 7;
      const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, halo);
      grad.addColorStop(0, 'rgba(92, 166, 255, 0.72)');
      grad.addColorStop(0.65, 'rgba(58, 134, 255, 0.24)');
      grad.addColorStop(1, 'rgba(58, 134, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, halo, 0, Math.PI * 2);
      ctx.fill();

      if (this.paintBrushImage.complete && this.paintBrushImage.naturalWidth > 0) {
        ctx.rotate(Math.sin(brush.pulseTimer * 0.7) * 0.08 - 0.18);
        ctx.drawImage(this.paintBrushImage, -45, -45, 90, 90);
      } else {
        // Fallback vetorial caso a imagem ainda esteja carregando.
        ctx.rotate(-0.18);
        ctx.strokeStyle = '#8b5e34';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-22, 22);
        ctx.lineTo(17, -17);
        ctx.stroke();
        ctx.fillStyle = '#3a86ff';
        ctx.beginPath();
        ctx.ellipse(21, -20, 13, 7, -0.7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 3. Desenhar Pisos de Mármore Quebradiços
    for (const f of this.crackedFloors) {
      if (f.broken) continue;
      ctx.save();
      ctx.fillStyle = pal.groundFill;
      ctx.strokeStyle = pal.archStroke;
      ctx.lineWidth = 2.5;

      ctx.fillRect(f.x, f.y, f.width, f.height);
      ctx.strokeRect(f.x, f.y, f.width, f.height);

      // Rachaduras rúnicas em vermelho carmim sutil
      ctx.strokeStyle = '#e63946';
      ctx.lineWidth = 2;
      for (const crack of f.crackLines) {
        ctx.beginPath();
        ctx.moveTo(f.x + f.width * crack.x1, f.y + f.height * crack.y1);
        ctx.lineTo(f.x + f.width * crack.x2, f.y + f.height * crack.y2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. Desenhar Pontes de Tinta e Degraus de Constelação
    for (const b of this.temporaryBridges) {
      ctx.save();
      ctx.globalAlpha = b.alpha;

      if (b.isConstellation) {
        // Degrau celestial com bordas brilhantes
        ctx.fillStyle = 'rgba(255, 209, 102, 0.35)';
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.width, b.height, 6);
        ctx.fill();
        ctx.stroke();
      } else {
        // Traço fluido de pincelada de aquarela
        ctx.fillStyle = b.color;
        ctx.strokeStyle = '#80bfff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.width, b.height, 8);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    // 5. Desenhar Flores que Desabrocham
    for (const f of this.bloomingFlowers) {
      ctx.save();
      ctx.translate(f.x + f.width / 2, f.y + 12);
      ctx.scale(f.petalScale, f.petalScale);

      // Pétalas abertas em formato de lótus
      const petalColors = ['#ff758f', '#ff85a2', '#fbb1bd'];
      for (let p = -2; p <= 2; p++) {
        ctx.save();
        ctx.rotate((p * 22) * (Math.PI / 180));
        ctx.fillStyle = petalColors[Math.abs(p)];
        ctx.beginPath();
        ctx.ellipse(0, -25, 18, 38, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Núcleo brilhante
      ctx.fillStyle = '#fff0f3';
      ctx.beginPath();
      ctx.arc(0, -5, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 6. Desenhar Correntes de Vento (Túnel Etéreo)
    for (const w of this.windUpdrafts) {
      ctx.save();
      const grad = ctx.createLinearGradient(w.x, 0, w.x + w.width, 0);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(w.x, w.y, w.width, w.height);
      ctx.restore();
    }

    // 7. Desenhar Altares de Despertar de Cor
    for (const b of this.colorBeacons) {
      ctx.save();
      ctx.translate(b.x, b.y);

      // Pilar de Altar
      ctx.fillStyle = pal.midRuins;
      ctx.strokeStyle = pal.archStroke;
      ctx.lineWidth = 2.5;
      ctx.fillRect(-25, 0, 50, 160);
      ctx.strokeRect(-25, 0, 50, 160);

      // Orbe de Cor Flutuante
      const orbY = -35 + Math.sin(b.floatTimer) * 10;
      const orbColor = {
        red: '#e63946',
        blue: '#3a86ff',
        pink: '#ff70a6',
        gold: '#ffd166'
      }[b.colorKey] || '#dfc382';

      ctx.save();
      const glowGrad = ctx.createRadialGradient(0, orbY, 6, 0, orbY, 45);
      glowGrad.addColorStop(0, orbColor);
      glowGrad.addColorStop(0.7, 'rgba(255,255,255,0.4)');
      glowGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, orbY, 45, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, orbY, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore();
    }
  }
}

window.InteractivePuzzleManager = InteractivePuzzleManager;
