/**
 * ==============================================================================
 * WATERCOLOR PARALLAX RENDERER (Estilo Gris: 5 Planos de Profundidade & Aquarela)
 * Suporte a Linework Minimalista, Arcos Monumentais e Color Blooms
 * ==============================================================================
 */
class WatercolorRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = canvas.width = 1920;
    this.height = canvas.height = 1080;

    // Renderização Cartoonesca 2D Direta em Alta Resolução (Cores vivas do Livro)
    this.postProcessor = null;
    this.sceneCanvas = this.canvas;
    this.ctx = this.canvas.getContext('2d');

    // Paletas Cartoonescas Vivas e Alegres por Capítulo
    this.palettes = {
      gray: {
        skyTop: '#3a3d40', skyBottom: '#5c646b',
        farRuins: '#6c757d', midRuins: '#868e96',
        archStroke: '#adb5bd', groundFill: '#343a40',
        accent: '#e9ecef',
        filter: null
      },
      red: {
        skyTop: '#6b1d24', skyBottom: '#99222c',
        farRuins: '#b8323e', midRuins: '#d94050',
        archStroke: '#ff6b7b', groundFill: '#4a151b',
        accent: '#ffb3ba',
        filter: null
      },
      green: {
        skyTop: '#1b4d3e', skyBottom: '#2d6a4f',
        farRuins: '#40916c', midRuins: '#52b788',
        archStroke: '#74c69d', groundFill: '#1b432a',
        accent: '#b7e4c7',
        filter: null
      },
      blue: {
        skyTop: '#1a365d', skyBottom: '#2b6cb0',
        farRuins: '#3182ce', midRuins: '#4299e1',
        archStroke: '#63b3ed', groundFill: '#1a365d',
        accent: '#bee3f8',
        filter: null
      },
      gold: {
        skyTop: '#4a284e', skyBottom: '#7b3f74',
        farRuins: '#9d4edd', midRuins: '#c77dff',
        archStroke: '#ffd166', groundFill: '#38143d',
        accent: '#ffe494',
        filter: null
      }
    };

    this.currentPaletteKey = 'gray';

    // Carregar Ilustrações de Fundo do Livro Franklândia
    this.bgImages = {};
    this.loadBackgroundImages();

    // Efeito de Color Bloom (onda colossal de aquarela)
    this.bloomWaves = [];

    // Monumentos e Arcos Distantes
    this.distantStatues = [];
    this.initDistantMonuments();
  }

  loadBackgroundImages() {
    for (let i = 1; i <= 8; i++) {
      const img = new Image();
      img.src = `assets/images/backgrounds/bg_level${i}.png`;
      this.bgImages[`bg${i}`] = img;
    }
  }

  setPalette(key) {
    if (this.palettes[key]) {
      this.currentPaletteKey = key;
    }
  }

  initDistantMonuments() {
    this.floatingRings = [
      { x: 1600, y: 350, r: 180, rotSpeed: 0.12 },
      { x: 3400, y: 280, r: 240, rotSpeed: -0.09 },
      { x: 5100, y: 320, r: 210, rotSpeed: 0.15 }
    ];
    this.distantStatues = [
      { x: 1200, y: 550, scale: 2.2, type: 'queen' },
      { x: 3200, y: 650, scale: 2.5, type: 'king' },
      { x: 4800, y: 480, scale: 2.8, type: 'children' }
    ];
  }

  triggerColorBloom(x, y, color) {
    this.bloomWaves.push({
      x, y,
      radius: 20,
      maxRadius: 3200,
      speed: 2100,
      color: color,
      alpha: 0.95
    });
  }

  render(camera, world, puzzles, particles, timestamp) {
    const ctx = this.ctx;
    const time = timestamp * 0.001;
    const pal = this.palettes[this.currentPaletteKey];
    const camBounds = camera.getVisibleBounds();

    // 1. LIMPAR E DESENHAR CÉU DE AQUARELA LÍQUIDA (Layer 0)
    ctx.save();
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, pal.skyTop);
    skyGrad.addColorStop(0.55, pal.skyBottom);
    skyGrad.addColorStop(1, pal.groundFill);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Grade celeste de constelações poéticas
    this.drawCelestialGrid(ctx, camera, time);
    ctx.restore();

    // 2. PARALLAX CAMADA 1: PINTURA DO LIVRO EM PARALLAX PROFUNDO (0.18x)
    this.drawBookIllustrationParallax(ctx, camera, pal, time);

    // 3. PARALLAX CAMADA 3: FEIXES DE LUZ VOLUMÉTRICOS (GOD RAYS) E NÉVOA
    ctx.save();
    this.drawAtmosphericLightShafts(ctx, pal, time);
    ctx.restore();

    // 5. CAMADA PRINCIPAL: MUNDO JOGÁVEL (Transformada Total 1.0x)
    camera.applyTransform(ctx);

    // 5.1 Plataformas e Arquitetura Texturizada do Nível
    world.draw(ctx, camBounds, pal, time);

    // 5.2 Elementos Interativos e Puzzles
    puzzles?.draw(ctx, camBounds, pal, time);

    // 5.25 NPCs e Encontros Narrativos do Livro
    window.gameEngine?.npcs?.draw(ctx, camBounds, time, this.currentPaletteKey);

    // 5.3 Partículas de Aquarela, Pétalas e Estrelas
    particles.draw(ctx, camBounds);

    camera.restoreTransform(ctx);

    // 7. ONDAS DE CHOQUE DE AQUARELA (Color Blooms)
    this.drawBloomWaves(ctx, camera);

    // 8. PÓS-PROCESSAMENTO DE AQUARELA (Shader WebGL com sangramento, bordas e grão estilo cinight / GRIS)
    if (this.postProcessor && this.postProcessor.isSupported) {
      let maxBloom = 0.0;
      for (const w of this.bloomWaves) {
        if (w.alpha > maxBloom) maxBloom = w.alpha;
      }
      this.postProcessor.render(this.sceneCanvas, timestamp, maxBloom);
    }
  }

  // Desenhar as pinturas do livro em uma faixa ampla, sem transformar o
  // cenário em um "zoom" gigante em relação aos personagens.
  drawBookIllustrationParallax(ctx, camera, pal, time) {
    const regionSize = 6750;
    const curRegionIdx = Math.max(0, Math.min(7, Math.floor(camera.x / regionSize)));
    const nextRegionIdx = Math.min(7, curRegionIdx + 1);
    const progress = (camera.x % regionSize) / regionSize;

    const imgA = this.bgImages[`bg${curRegionIdx + 1}`] || this.bgImages.bg1;
    const imgB = this.bgImages[`bg${nextRegionIdx + 1}`] || imgA;

    // Nos últimos 25% do ato, mistura a próxima pintura sem cortar o jogo.
    const blendFactor = progress > 0.75 ? (progress - 0.75) / 0.25 : 0;

    const drawAmbient = (img, alpha) => {
      if (!img || !img.complete || img.naturalWidth <= 0 || alpha <= 0) return;

      // Extensão atmosférica desfocada: preenche as laterais, sem definir a
      // escala percebida dos elementos nítidos do cenário.
      const scale = Math.max(
        this.width / img.naturalWidth,
        (this.height * 0.80) / img.naturalHeight
      );
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;

      ctx.save();
      ctx.globalAlpha = 0.22 * alpha;
      ctx.filter = 'blur(24px) saturate(0.82)';
      ctx.drawImage(img, (this.width - w) * 0.5, 0, w, h);
      ctx.filter = 'none';
      ctx.restore();
    };

    const drawMirroredTiles = (img, alpha) => {
      if (!img || !img.complete || img.naturalWidth <= 0 || alpha <= 0) return;

      // Altura próxima à composição original: o rei, a rainha e as crianças
      // continuam proporcionais ao cenário. A largura cresce pela repetição
      // espelhada, nunca por um zoom desproporcional.
      // A pintura desce quase até o rodapé; isso evita que o pulo revele
      // uma faixa vazia antes do piso, sem fazer o cenário ocupar o tamanho
      // exagerado da primeira tentativa panorâmica.
      const tileH = this.height * 0.90;
      const tileW = tileH * (img.naturalWidth / img.naturalHeight);
      const phase = ((camera.x * 0.12) % tileW + tileW) % tileW;
      const start = -phase - tileW;
      const tileIndex = Math.floor((camera.x * 0.12) / tileW);
      const y = 0;

      ctx.save();
      ctx.globalAlpha = 0.96 * alpha;
      for (let i = -1; i <= 3; i++) {
        const x = start + i * tileW;
        const mirror = ((tileIndex + i) & 1) !== 0;

        ctx.save();
        if (mirror) {
          ctx.translate(x + tileW, y);
          ctx.scale(-1, 1);
          ctx.drawImage(img, 0, 0, tileW, tileH);
        } else {
          ctx.drawImage(img, x, y, tileW, tileH);
        }
        ctx.restore();
      }
      ctx.restore();
    };

    // A extensão suave fica atrás; os painéis nítidos preservam o tamanho
    // original e se encontram por espelhamento, sem uma costura abrupta.
    drawAmbient(imgA, 1 - blendFactor);
    drawMirroredTiles(imgA, 1 - blendFactor);

    // A troca de ato também é cruzada para que a faixa continue sem corte.
    if (blendFactor > 0) {
      drawAmbient(imgB, blendFactor);
      drawMirroredTiles(imgB, blendFactor);
    }

    // Véu inferior integra a pintura ao piso e evita uma linha dura no horizonte.
    ctx.save();
    const lowerFade = ctx.createLinearGradient(0, this.height * 0.62, 0, this.height);
    lowerFade.addColorStop(0, 'rgba(13, 12, 10, 0)');
    lowerFade.addColorStop(1, 'rgba(13, 12, 10, 0.40)');
    ctx.fillStyle = lowerFade;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
  }

  drawMidgroundArchitecture(ctx, pal, time) {
    // Arcos aramados removidos para manter o céu limpo e destacar as pinturas do livro
  }

  // Grade de Constelações Etéreas no Céu
  drawCelestialGrid(ctx, camera, time) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 245, 220, 0.08)';
    ctx.lineWidth = 1;

    const offsetX = (camera.x * 0.03) % 200;
    const offsetY = (camera.y * 0.03) % 200;

    for (let x = -200 + offsetX; x < this.width + 200; x += 180) {
      for (let y = -200 + offsetY; y < this.height + 200; y += 180) {
        // Estrela cintilante
        const twinkle = Math.sin(time * 2 + x * 0.01 + y * 0.02);
        if (twinkle > 0.4) {
          ctx.fillStyle = `rgba(255, 235, 180, ${0.12 + twinkle * 0.15})`;
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  // Estátuas Colossais no Fundo Distante
  drawDistantStatuesAndRings(ctx, pal, time) {
    ctx.save();
    ctx.fillStyle = pal.farRuins;
    ctx.strokeStyle = pal.archStroke;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.55;

    // Desenhar Anéis Flutuantes Giratórios
    for (const ring of this.floatingRings) {
      ctx.save();
      ctx.translate(ring.x, ring.y);
      ctx.rotate(time * ring.rotSpeed);

      // Anel Externo Fino
      ctx.beginPath();
      ctx.arc(0, 0, ring.r, 0, Math.PI * 2);
      ctx.stroke();

      // Linhas Diagonais Estilo Armilar
      ctx.beginPath();
      ctx.ellipse(0, 0, ring.r, ring.r * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    // Desenhar Silhueta de Grande Estátua Partida (Mãe / Rainha Guardiã como em Gris)
    for (const st of this.distantStatues) {
      ctx.save();
      ctx.translate(st.x, st.y);
      ctx.scale(st.scale, st.scale);

      // Busto monumental adormecido
      ctx.beginPath();
      ctx.moveTo(-120, 200);
      ctx.bezierCurveTo(-140, 80, -90, -40, -40, -80);
      ctx.bezierCurveTo(-20, -110, 30, -110, 60, -70);
      ctx.bezierCurveTo(110, -20, 130, 80, 120, 200);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Rosto delicado em perfil esculpido
      ctx.beginPath();
      ctx.arc(10, -40, 45, -Math.PI * 0.3, Math.PI * 0.6);
      ctx.stroke();

      // Mão gigante esculpida que serve de pilar cósmico
      ctx.beginPath();
      ctx.moveTo(-160, 200);
      ctx.lineTo(-180, 60);
      ctx.quadraticCurveTo(-150, 40, -120, 60);
      ctx.lineTo(-120, 200);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  }

  // Aquedutos e Colunas de Média Distância
  drawMidgroundArches(ctx, pal, time) {
    ctx.save();
    ctx.strokeStyle = pal.archStroke;
    ctx.fillStyle = pal.midRuins;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.65;

    for (const arch of this.distantArches) {
      // Pilar Esquerdo
      ctx.fillRect(arch.x, arch.y, 40, arch.height);
      // Pilar Direito
      ctx.fillRect(arch.x + arch.width - 40, arch.y, 40, arch.height);

      // Arco Neoclássico Superior
      ctx.beginPath();
      ctx.arc(arch.x + arch.width / 2, arch.y + arch.radius, arch.radius, Math.PI, 0);
      ctx.stroke();

      // Linha do Aqueduto no Topo
      ctx.beginPath();
      ctx.moveTo(arch.x - 50, arch.y);
      ctx.lineTo(arch.x + arch.width + 50, arch.y);
      ctx.stroke();

      // Detalhes Geométricos e Rosáceas no meio do arco
      ctx.beginPath();
      ctx.arc(arch.x + arch.width / 2, arch.y + arch.radius * 0.6, 28, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Feixes de Luz Volumétricos Suaves (God Rays)
  drawAtmosphericLightShafts(ctx, pal, time) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    const count = 4;
    for (let i = 0; i < count; i++) {
      const x = (i * 500 + Math.sin(time * 0.2 + i) * 60) % (this.width + 600) - 300;
      const grad = ctx.createLinearGradient(x, 0, x + 400, this.height);
      const alpha = 0.05 + Math.sin(time * 0.3 + i * 1.5) * 0.025;

      grad.addColorStop(0, `rgba(255, 245, 220, ${alpha * 1.5})`);
      grad.addColorStop(0.5, `rgba(255, 235, 190, ${alpha})`);
      grad.addColorStop(1, 'rgba(255, 235, 190, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(x, -50);
      ctx.lineTo(x + 180, -50);
      ctx.lineTo(x + 580, this.height + 50);
      ctx.lineTo(x + 320, this.height + 50);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  drawForegroundSilhouettes(ctx, pal, time) {
    // Silhuetas circulares removidas
  }

  // Ondas de Expansão de Cor (Color Blooms)
  drawBloomWaves(ctx, camera) {
    if (this.bloomWaves.length === 0) return;

    for (let i = this.bloomWaves.length - 1; i >= 0; i--) {
      const wave = this.bloomWaves[i];
      wave.radius += wave.speed * (1 / 60);
      wave.alpha = Math.max(0, 1 - wave.radius / wave.maxRadius);

      if (wave.alpha <= 0 || wave.radius >= wave.maxRadius) {
        this.bloomWaves.splice(i, 1);
        continue;
      }

      const scr = camera.worldToScreen(wave.x, wave.y);

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = wave.alpha * 0.45;

      const grad = ctx.createRadialGradient(
        scr.x, scr.y, wave.radius * 0.8,
        scr.x, scr.y, wave.radius
      );
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.85, wave.color);
      grad.addColorStop(1, 'rgba(255,255,255,0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(scr.x, scr.y, wave.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

window.WatercolorRenderer = WatercolorRenderer;
