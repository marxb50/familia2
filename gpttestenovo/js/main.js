/**
 * ==============================================================================
 * MAIN GAME COORDINATOR (O Castelo que Nasce do Coração: Metroid Contínuo)
 * - Zero cortes, zero telas de carregamento, zero teletransporte!
 * - Toda a jornada do Reino de Franklândia em um mapa horizontal contínuo (0 a 36.500px).
 * - O Rei e a Rainha caminham juntos sem cair do cenário e com tethering seguro.
 * - Transições fluidas ao cruzar cada fronteira sem interrupção de gameplay.
 * ==============================================================================
 */

class GrisGameEngine {
  constructor() {
    this.canvas = document.getElementById('viewport-canvas');
    this.lastTime = 0;
    this.running = false;
    this.paused = false;
    this.menuOpen = true;
    this.loadingArt = true;
    this.hudTimer = 0;

    // Inicialização dos Módulos Principais
    this.input = new InputManager();
    this.camera = new CinematicCamera(1920, 1080);
    this.physics = new PhysicsEngine();
    this.particles = new ParticleSystem();
    this.audio = new GrisAudioEngine();
    this.renderer = new WatercolorRenderer(this.canvas);
    this.puzzles = new InteractivePuzzleManager();
    this.levels = new LevelDesignManager();
    this.npcs = new NPCManager();
    this.world = new WorldRenderer(this.puzzles);

    // Personagem e Grupo Ativo
    this.character = null;

    // Estado da Narrativa
    this.isCutsceneActive = false;
    this.isAwakeningColor = false;
    this.finalSequenceStarted = false;

    // Cores Virtuosas Desbloqueadas (Livro Página 37)
    this.unlockedColors = {
      gray: true,
      blue: false,
      red: false,
      green: false,
      pink: false,
      gold: false
    };

    this.setupEventListeners();
  }

  init() {
    window.addEventListener('error', (e) => {
      console.error('GAME UNCAUGHT ERROR:', e.message, e.filename, e.lineno);
    });

    // 1. Configurar Limites Globais do Mundo Contínuo Metroid (36.500px)
    this.camera.setWorldBounds(
      this.levels.worldBounds.x,
      this.levels.worldBounds.y,
      this.levels.worldBounds.width,
      this.levels.worldBounds.height
    );

    // 2. Configurar Todas as Plataformas do Mundo Contínuo
    this.world.setPlatforms(this.levels.platforms);

    // 3. Configurar Todos os NPCs e Puzzles do Mundo
    this.levels.setupWorldNPCs(this.npcs);
    this.levels.setupWorldPuzzles(this.puzzles);

    // 4. Inicializar Personagem no Início do Castelo
    this.character = new GrisCharacter('couple', 250, 1930);
    this.world.setCharacter(this.character);

    // 5. Suporte a Parâmetro de URL (?act=X ou ?chapter=X)
    const urlParams = new URLSearchParams(window.location.search);
    const startChapter = urlParams.get('chapter') || urlParams.get('act');
    const startIdx = Math.max(0, Math.min(7, (parseInt(startChapter, 10) || 1) - 1));
    this.menuOpen = !startChapter;
    if (startChapter) {
      document.getElementById('start-overlay')?.classList.add('hidden');
    }

    this.loadChapter(startIdx);
    const party = this.character.mode === 'couple' ? [this.character.king, this.character.queen]
      : this.character.mode === 'family_swap' ? this.character.familyParty : [this.character.active];
    const firstImages = [this.renderer.bgImages[`bg${startIdx + 1}`], ...party.map(c => c.sprites.color.idle), ...party.map(c => c.sprites.bw.idle)];
    Promise.all(firstImages.map(img => img.decode().catch(() => {}))).then(() => {
      this.loadingArt = false;
      document.getElementById('loading-art').hidden = true;
      if (!this.menuOpen) {
        this.showChapterTitle(this.levels.getCurrentChapter());
        this.showStoryNarration(this.levels.getCurrentChapter());
      }
    });

    this.running = true;
    requestAnimationFrame((t) => this.loop(t));
  }

  // Carregar / Saltar para uma região específica (usado no início ou via URL)
  loadChapter(chapterIndex) {
    const region = this.levels.getRegion(chapterIndex);
    if (!region) return;
    this.finalSequenceStarted = false;
    document.getElementById('ending-screen')?.classList.remove('visible');
    this.finalRoute = null;
    this.finalElapsed = 0;
    this.finalComplete = false;

    this.levels.currentRegionIndex = chapterIndex;

    // Posicionar Personagem no ponto de início da região
    const startX = region.playerStartX || 250;
    const startY = 1930;

    this.character.setMode(region.characterType, startX, startY);
    this.character.x = startX;
    this.character.y = startY;
    this.character.vx = 0;
    this.character.vy = 0;
    this.character.lastSafeX = startX;
    this.character.lastSafeY = startY;

    // Enquadramento inicial da câmera
    this.camera.x = startX + this.character.width / 2;
    this.camera.y = startY + this.character.height / 2 - 145;
    this.camera.targetX = this.camera.x;
    this.camera.targetY = this.camera.y;

    // Paleta de Cores e Trilha Sonora
    this.renderer.setPalette(region.colorKey);
    this.renderer.setMatheusColorProgress(region.id === 3 ? 0 : 1);
    this.audio.setChapterTheme(region.colorKey);
    this.updateChapterColorUnlocks(region.id);

    // Exibir Título Poético
    this.showChapterTitle(region);

    // Atualizar HUD
    this.updateHUD();

    // Iniciar Narração Oficial com Legendas no rodapé (sem bloquear)
    if (!this.loadingArt) this.showStoryNarration(region);
  }

  // Verificação de Progressão Contínua (Estilo Metroid: sem corte, sem teleporte)
  checkRegionProgression() {
    const { index, region } = this.levels.getRegionByX(this.character.x);

    if (index !== this.levels.currentRegionIndex) {
      this.levels.currentRegionIndex = index;

      // Transição suave de paleta e música ambiente
      this.renderer.setPalette(region.colorKey);
      this.renderer.setMatheusColorProgress(region.id === 3 ? 0 : 1);
      this.audio.setChapterTheme(region.colorKey);
      this.updateChapterColorUnlocks(region.id);

      // Se a nova região requer um protagonista específico (Matheus, Pedro, Maria Rosa ou Família)
      if (this.character.mode !== region.characterType) {
        const curX = this.character.x;
        const curY = this.character.y;
        this.character.setMode(region.characterType, curX, curY);

        this.particles.spawnWatercolorBlobs(curX + 30, curY + 40, this.character.getThemeColor(), 24);
        this.particles.spawnPetals(curX + 30, curY + 40, 18, '#ffd166');
      }

      // Exibir título e iniciar narração da nova área
      this.showChapterTitle(region);
      this.showStoryNarration(region);
      this.updateHUD();
    }
  }

  showChapterTitle(region) {
    const screen = document.getElementById('chapter-title-screen');
    const tag = document.getElementById('chapter-tag');
    const title = document.getElementById('chapter-title');
    const sub = document.getElementById('chapter-subtitle');

    if (screen && tag && title && sub) {
      tag.textContent = `Ato ${region.id} de 8`;
      title.textContent = region.title;
      sub.textContent = region.subtitle;

      screen.classList.add('visible');
      setTimeout(() => {
        screen.classList.remove('visible');
      }, 4200);
    }
  }

  // As cinco virtudes entram na ordem narrativa do livro, mantendo os cinco
  // pontos do prisma sempre presentes no HUD.
  updateChapterColorUnlocks(chapterId) {
    const unlockActs = {
      blue: 3,
      red: 5,
      green: 6,
      pink: 7,
      gold: 8
    };

    for (const [color, act] of Object.entries(unlockActs)) {
      this.unlockedColors[color] = chapterId >= act;
    }
  }

  setPaused(value) {
    if (this.menuOpen || this.finalSequenceStarted) return;
    this.paused = value;
    document.getElementById('pause-screen').hidden = !value;
    this.input.keys = {};
    this.input.axisX = 0;
    this.input.jumpPressed = this.input.jumpHeld = false;
    this.input.jumpBufferTimer = 0;
    const narrator = this.audio.currentNarrator;
    if (value) { narrator?.pause(); this.audio.ctx?.suspend(); }
    else { narrator?.play().catch(() => {}); this.audio.resume(); }
    if (value) document.getElementById('btn-resume').focus();
    else document.getElementById('btn-resume').blur();
  }

  showStoryNarration(region) {
    if (this.menuOpen) return;
    this.subtitlePages = (region.cutsceneText || '').match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
    this.subtitleElapsed = 0;
    this.subtitleIndex = -1;
    this.subtitleDuration = Math.max(12, (region.cutsceneText || '').length / 17);
    this.isCutsceneActive = false;
    if (region.narrationAudio) this.audio.playNarration(region.narrationAudio, () => {
      this.subtitlePages = [];
      document.getElementById('cinematic-subtitles-container').classList.add('hidden');
    });
    this.updateSubtitles(0);
  }

  updateSubtitles(dt) {
    if (!this.subtitlePages?.length) return;
    this.subtitleElapsed += dt;
    const audio = this.audio.currentNarrator;
    const hasAudioTime = audio && !audio.paused && Number.isFinite(audio.duration) && audio.duration > 0;
    const progress = hasAudioTime ? audio.currentTime / audio.duration : this.subtitleElapsed / this.subtitleDuration;
    const bar = document.getElementById('cinematic-subtitles-container');
    if (progress >= 1) { bar.classList.add('hidden'); return; }
    const total = this.subtitlePages.reduce((n, s) => n + s.length, 0);
    let end = 0;
    const index = this.subtitlePages.findIndex(s => { end += s.length; return progress < end / total; });
    if (index !== this.subtitleIndex && index >= 0) {
      this.subtitleIndex = index;
      document.getElementById('subtitles-text').textContent = this.subtitlePages[index].trim();
      bar.style.opacity = '1';
      bar.classList.remove('hidden');
    }
  }

  // Encontro com o NPC ao longo do caminho contínuo (sem corte)
  handleNPCEncounter(npc) {
    // Efeitos Mágicos e Celebração do Encontro
    this.particles.spawnWatercolorBlobs(
      npc.x + npc.width / 2,
      npc.y + npc.height / 2,
      '#ffd166',
      30
    );
    this.particles.spawnPetals(
      this.character.x + this.character.width / 2,
      this.character.y + this.character.height / 2,
      20,
      '#ff70a6'
    );
    this.audio.playMemoryStarSound(1.5);
    this.camera.triggerShake(10);

  }

  startFinalSequence(portal) {
    if (this.finalSequenceStarted) return;
    this.finalSequenceStarted = true;
    this.finalPortal = portal;
    this.finalRoute = portal.route;
    this.finalElapsed = 0;
    this.finalComplete = false;
    this.finalSparkTimer = 0;
    this.subtitlePages = [];
    document.getElementById('cinematic-subtitles-container')?.classList.add('hidden');
    document.getElementById('chapter-title-screen')?.classList.remove('visible');
    this.input.keys = {};
    this.input.axisX = 0;
    this.input.jumpBufferTimer = 0;
    this.audio.stopNarration();
    for (const member of this.character.familyParty) {
      member.portalEntryTime = 0;
      member.entryAlpha = 1;
      member.vy = 0;
      member.isJumping = false;
      member.isGliding = false;
    }
    const sky = portal.route === 'sky';
    const screen = document.getElementById('ending-screen');
    screen.dataset.route = portal.route;
    document.getElementById('ending-kicker').textContent = sky ? 'FINAL II • O CAMINHO DAS NUVENS' : 'FINAL I • O CAMINHO DO JARDIM';
    document.getElementById('ending-title').textContent = portal.label;
    document.getElementById('ending-text').textContent = sky
      ? 'Juntos, os cinco atravessaram o arco-íris e levaram as cores de Franklândia para além das nuvens. Onde havia silêncio, nasceram novas histórias. Nenhum sonho é alto demais quando se tem uma família ao lado.'
      : 'Juntos, os cinco atravessaram o arco-íris e encontraram um jardim cheio de vida. Matheus pintou novos sonhos, Pedro abriu caminhos e Maria Rosa fez as flores cantarem. O rei e a rainha descobriram seu verdadeiro castelo: a família.';
    this.renderer.triggerColorBloom(portal.x, portal.floorY - 160, sky ? '#b8dcff' : '#ffd166');
  }

  updateFinalSequence(dt) {
    this.particles.update(dt);
    if (this.finalComplete) return;
    this.finalElapsed += dt;
    const p = this.finalPortal;
    // Every family member walks into the same arch, then dissolves into its light.
    for (const member of this.character.familyParty) {
      const targetX = p.x + 24 - member.width / 2;
      const remaining = targetX - member.x;
      member.vx = remaining > 1 ? this.character.maxSpeed * 0.9 : 0;
      member.x += Math.min(Math.max(0, remaining), member.vx * dt);
      member.y += (p.floorY - member.height - member.y) * (1 - Math.exp(-9 * dt));
      member.onGround = true;
      member.facing = 1;
      if (member.x + member.width / 2 >= p.x - 12) {
        member.portalEntryTime += dt;
        member.entryAlpha = Math.max(0, 1 - member.portalEntryTime / 0.65);
      }
      member.update(dt, this.particles, this.audio);
    }
    const blend = 1 - Math.exp(-3 * dt);
    this.camera.x += (p.x - 180 - this.camera.x) * blend;
    this.camera.y += (p.floorY - 250 - this.camera.y) * blend;
    this.camera.zoom += (1 - this.camera.zoom) * blend;
    this.finalSparkTimer += dt;
    if (this.finalSparkTimer >= 0.14) {
      this.finalSparkTimer = 0;
      const colors = ['#3a86ff', '#e63946', '#2a9d8f', '#ff70a6', '#ffd166'];
      const color = colors[Math.floor(this.finalElapsed * 7) % colors.length];
      this.particles.spawnPetals(p.x, p.floorY - 180, 3, color);
    }
    if (this.finalElapsed >= 4.2 && this.character.familyParty.every(m => m.entryAlpha === 0)) {
      this.finalComplete = true;
      for (const member of this.character.familyParty) member.vx = 0;
      document.getElementById('ending-screen')?.classList.add('visible');
      this.audio.playNarration('assets/audio/victory_narration.mp3');
      this.updateHUD();
    }
  }

  // Despertar de Cor (Beacons Mágicos - Sem Corte! O jogador continua andando)
  awakenColorChapter(colorKey, title, beaconX, beaconY) {
    if (this.isAwakeningColor) return;
    this.isAwakeningColor = true;

    const bloomColor = {
      red: '#e63946',
      green: '#2a9d8f',
      blue: '#3a86ff',
      pink: '#ff70a6',
      gold: '#ffd166'
    }[colorKey] || '#dfc382';

    // Onda de choque de aquarela no local do beacon
    this.renderer.triggerColorBloom(beaconX, beaconY, bloomColor);
    this.audio.playColorAwakeningChord(colorKey);
    this.camera.triggerShake(18);

    this.updateChapterColorUnlocks(this.levels.regions[this.levels.currentRegionIndex]?.id || 1);
    this.renderer.setPalette(colorKey);
    this.updateHUD();

    // Em 2 segundos libera o estado de despertar para o jogador continuar sua exploração livremente
    setTimeout(() => {
      this.isAwakeningColor = false;
    }, 2000);
  }

  // Pequena restauração cromática exclusiva dos pincéis do Matheus.
  onMatheusBrushCollected(colorAmount = 0.18, x, y) {
    if (this.levels.currentRegionIndex !== 2 || this.character?.mode !== 'matheus') return;

    const nextProgress = this.renderer.matheusColorProgress + colorAmount;
    this.renderer.setMatheusColorProgress(nextProgress);
    this.particles.spawnWatercolorBlobs(x, y, '#3a86ff', 14);
    this.camera.triggerShake(4);
    this.updateHUD();
  }

  // Alternar o líder do casal (Rei e Rainha) ou membro da família no Ato 8
  swapCharacter() {
    if (!this.character) return;
    const changed = this.character.swap();
    if (changed) {
      this.updateHUD();
    }
  }

  updateHUD() {
    const region = this.levels.getCurrentChapter();
    const index = this.levels.currentRegionIndex;
    document.getElementById('journey-act').textContent = `ATO ${index + 1} / VIII`;
    document.getElementById('journey-name').textContent = this.renderer.art.theme(index).name;
    const progress = this.finalComplete ? 1 : Math.max(0, Math.min(1, (this.character.x - region.minX) / (region.maxX - region.minX)));
    document.getElementById('journey-progress').style.transform = `scaleX(${progress})`;
    // Estrelas de memória coletadas
    const countEl = document.getElementById('hud-stars-count');
    if (countEl) {
      countEl.textContent = `${this.puzzles.collectedStarsCount} / ${this.puzzles.totalStarsInLevel || 17}`;
    }

    // Prisma de Cores do Coração
    const prismColors = ['blue', 'red', 'green', 'pink', 'gold'];
    for (const color of prismColors) {
      const prism = document.getElementById(`prism-${color}`);
      prism?.classList.toggle(`unlocked-${color}`, this.unlockedColors[color]);
    }

    // Dica de Personagem Ativo
    const charType = this.character?.type;
    const hintEl = document.getElementById('hud-ability-text');
    const avatarEl = document.getElementById('hud-ability-avatar');

    if (hintEl && avatarEl) {
      if (this.character.mode === 'family_swap') {
        hintEl.textContent = 'A família corre junta • Dois arcos-íris: jardim embaixo, nuvens em cima';
        avatarEl.src = 'assets/images/characters/children_trio.png';
      } else if (charType === 'carriage') {
        hintEl.textContent = 'Rei & Rainha na Carruagem Real • Rumo ao Vilarejo para Acolher Matheus Bebê!';
        avatarEl.src = 'assets/images/characters/royal_carriage.png';
      } else if (this.character.mode === 'couple') {
        const isKing = this.character.leaderType === 'king';
        hintEl.textContent = isKing
          ? 'Rei liderando • Pressione C para passar a liderança à Rainha | Caminhando Juntos pelo Amor'
          : 'Rainha liderando • Pressione C para passar a liderança ao Rei | Caminhando Juntos pelo Amor';
        avatarEl.src = isKing ? 'assets/images/characters/king_idle.png' : 'assets/images/characters/queen_idle.png';
      } else if (charType === 'matheus') {
        hintEl.textContent = 'Príncipe Matheus • Salto Duplo | Nadar em Bolhas | Pintar Pontes de Tinta (J)';
        avatarEl.src = 'assets/images/characters/matheus_brush_idle.png';
      } else if (charType === 'pedro' || charType === 'pedro_horse') {
        hintEl.textContent = 'Príncipe Pedro • Cavalgada Veloz no Cavalo Branco | Espada da Bravura';
        avatarEl.src = 'assets/images/characters/pedro_horse_idle.png';
      } else if (charType === 'maria_rosa') {
        hintEl.textContent = 'Princesa Maria Rosa • Planar no Vestido (Espaço) | Florescer Flores com Canto (K)';
        avatarEl.src = 'assets/images/characters/maria_rosa_idle.png';
      } else {
        hintEl.textContent = 'Sagrada Família • Pressione C para alternar entre qualquer membro da família';
        avatarEl.src = 'assets/images/characters/children_trio.png';
      }
    }
  }

  setupEventListeners() {
    // Iniciar Jornada no Menu Inicial
    document.getElementById('btn-start-game')?.addEventListener('click', () => {
      this.audio.init();
      this.menuOpen = false;
      document.getElementById('start-overlay')?.classList.add('hidden');
      this.showChapterTitle(this.levels.getCurrentChapter());
      this.showStoryNarration(this.levels.getCurrentChapter());
    });
    document.getElementById('btn-pause')?.addEventListener('click', () => this.setPaused(true));
    document.getElementById('btn-resume')?.addEventListener('click', () => this.setPaused(false));
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && !e.repeat && !this.menuOpen && !this.finalSequenceStarted) this.setPaused(!this.paused);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && !this.menuOpen && !this.finalSequenceStarted) this.setPaused(true);
    });

    // Botão de Alternar Shader de Aquarela
    document.getElementById('btn-toggle-shader')?.addEventListener('click', () => {
      this.toggleShader();
    });

    // Botão de Áudio
    document.getElementById('btn-toggle-sound')?.addEventListener('click', () => {
      const isMuted = this.audio.toggleMute();
      document.getElementById('sound-icon').textContent = isMuted ? '🔇' : '🔊';
    });

    // Botão de Tela Cheia
    document.getElementById('btn-toggle-fullscreen')?.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
  }

  toggleShader() {
    if (this.renderer?.postProcessor) {
      const active = this.renderer.postProcessor.toggle();
      const btn = document.getElementById('btn-toggle-shader');
      const icon = document.getElementById('shader-icon');
      if (btn) {
        btn.classList.toggle('active', active);
        btn.title = `Shader de Aquarela Gris: ${active ? 'LIGADO' : 'DESLIGADO'} (Tecla P)`;
      }
      if (icon) {
        icon.textContent = active ? '🎨' : '🖌️';
      }
      // Ajustar opacidade do overlay DOM para harmonizar perfeitamente
      const paperOverlay = document.getElementById('paper-overlay');
      if (paperOverlay) {
        paperOverlay.style.opacity = active ? '0.12' : '0.38';
      }
    }
  }

  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min((timestamp - this.lastTime) * 0.001, 0.05);
    this.lastTime = timestamp;

    this.update(dt);
    this.render(timestamp);

    if (this.running) {
      requestAnimationFrame((t) => this.loop(t));
    }
  }

  update(dt) {
    if (this.menuOpen || this.paused || this.loadingArt) return;
    if (this.finalSequenceStarted) {
      this.updateFinalSequence(dt);
      return;
    }
    this.updateSubtitles(dt);
    // 1. Atualizar Entradas
    this.input.update(dt);

    if (this.input.consumeSwitch()) {
      this.swapCharacter();
    }

    if (this.input.consumeAction1() && this.character?.canPaintBridge) {
      this.character.paintBridge(this.puzzles);
    }

    if (this.input.consumeAction2() && this.character?.canSing) {
      this.character.sing(this.puzzles);
    }

    // 2. Atualizar Elementos Interativos do Mundo
    this.puzzles.update(this.character, this.particles, this.audio, dt);

    // 3. Atualizar NPCs e Encontros
    this.npcs.update(dt, this.character, (npc) => this.handleNPCEncounter(npc));

    // 4. Atualizar Física do Personagem
    const activePlats = [
      ...this.puzzles.getActivePlatforms(),
      ...this.levels.platforms
    ];
    this.physics.updateEntity(this.character, this.input, activePlats, this.puzzles, dt, this.levels.worldBounds);

    // 5. Atualizar Animação e Companheiro do Casal (Rei & Rainha)
    this.character.update(dt, this.particles, this.audio, activePlats);

    // 6. Verificar Progressão Contínua de Região (Estilo Metroid)
    this.checkRegionProgression();

    // Ending choice is physical: arrive on the ground or on the upper terrace.
    if (this.levels.currentRegionIndex === 7 && this.character.onGround) {
      const centerX = this.character.x + this.character.width / 2;
      const footY = this.character.y + this.character.height;
      const portal = this.levels.finalPortals.find(p => centerX >= p.x - 150 && centerX <= p.x + 130 && Math.abs(footY - p.floorY) < 18);
      if (portal) { this.startFinalSequence(portal); return; }
    }

    // 7. Atualizar Sistema Global de Partículas
    this.particles.update(dt);

    // 8. Atualizar Câmera Cinematográfica
    this.camera.update(this.character, dt);

    // 9. Atualizar HUD
    this.hudTimer += dt;
    if (this.hudTimer >= 0.1) { this.updateHUD(); this.hudTimer = 0; }
  }

  render(timestamp) {
    this.renderer.render(this.camera, this.world, this.puzzles, this.particles, timestamp);
  }
}

// Inicializar quando a janela carregar
const launchGame = () => {
  if (!window.gameEngine) {
    window.gameEngine = new GrisGameEngine();
    window.gameEngine.init();
  }
};

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', launchGame);
} else {
  launchGame();
}
