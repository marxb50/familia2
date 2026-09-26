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

    // Cores Virtuosas Desbloqueadas (Livro Página 37)
    this.unlockedColors = {
      gray: true,
      blue: false,
      red: false,
      green: false,
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
    const startIdx = startChapter ? Math.max(0, Math.min(7, parseInt(startChapter) - 1)) : 0;
    if (startChapter) {
      document.getElementById('start-overlay')?.classList.add('hidden');
    }

    this.loadChapter(startIdx);

    this.running = true;
    requestAnimationFrame((t) => this.loop(t));
  }

  // Carregar / Saltar para uma região específica (usado no início ou via URL)
  loadChapter(chapterIndex) {
    const region = this.levels.getRegion(chapterIndex);
    if (!region) return;

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
    this.camera.y = startY + this.character.height / 2 - 40;
    this.camera.targetX = this.camera.x;
    this.camera.targetY = this.camera.y;

    // Paleta de Cores e Trilha Sonora
    this.renderer.setPalette(region.colorKey);
    this.renderer.setMatheusColorProgress(region.id === 3 ? 0 : 1);
    this.audio.setChapterTheme(region.colorKey);
    this.unlockedColors[region.colorKey] = true;

    // Exibir Título Poético
    this.showChapterTitle(region);

    // Atualizar HUD
    this.updateHUD();

    // Iniciar Narração Oficial com Legendas no rodapé (sem bloquear)
    this.showStoryNarration(region);
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
      this.unlockedColors[region.colorKey] = true;

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

  showStoryNarration(region) {
    const subContainer = document.getElementById('cinematic-subtitles-container');
    const subText = document.getElementById('subtitles-text');

    this.isCutsceneActive = false; // O jogador NUNCA é congelado!

    if (subContainer && subText && region.cutsceneText) {
      subText.textContent = region.cutsceneText;
      subContainer.classList.remove('hidden');
      subContainer.style.opacity = '1';
    }

    // Tocar áudio oficial com narração de Thalita Neural
    if (region.narrationAudio) {
      this.audio.playNarration(region.narrationAudio, () => {
        // Ao concluir a fala, esmaecer a barra de legendas com gentileza
        if (subContainer) {
          subContainer.style.opacity = '0';
          setTimeout(() => {
            subContainer.classList.add('hidden');
          }, 800);
        }
      });
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

    // Se for o encontro final no Ato 8, tocar narração de vitória
    if (this.levels.currentRegionIndex === 7 && this.character.x > 51750) {
      this.audio.playNarration('assets/audio/victory_narration.mp3');
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
      gold: '#ffd166'
    }[colorKey] || '#dfc382';

    // Onda de choque de aquarela no local do beacon
    this.renderer.triggerColorBloom(beaconX, beaconY, bloomColor);
    this.audio.playColorAwakeningChord(colorKey);
    this.camera.triggerShake(18);

    this.unlockedColors[colorKey] = true;
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
    // Estrelas de memória coletadas
    const countEl = document.getElementById('hud-stars-count');
    if (countEl) {
      countEl.textContent = `${this.puzzles.collectedStarsCount} / ${this.puzzles.totalStarsInLevel || 17}`;
    }

    // Prisma de Cores do Coração
    const activeColor = this.levels.regions[this.levels.currentRegionIndex]?.colorKey;
    const prismColors = ['blue', 'red', 'green', 'gold'];
    for (const color of prismColors) {
      const prism = document.getElementById(`prism-${color}`);
      prism?.classList.toggle(`unlocked-${color}`, this.unlockedColors[color]);
      prism?.classList.toggle('active-prism', activeColor === color && this.unlockedColors[color]);
    }

    // Dica de Personagem Ativo
    const charType = this.character?.type;
    const hintEl = document.getElementById('hud-ability-text');
    const avatarEl = document.getElementById('hud-ability-avatar');

    if (hintEl && avatarEl) {
      if (charType === 'carriage') {
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
      document.getElementById('start-overlay')?.classList.add('hidden');
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

    // 7. Atualizar Sistema Global de Partículas
    this.particles.update(dt);

    // 8. Atualizar Câmera Cinematográfica
    this.camera.update(this.character, dt);

    // 9. Atualizar HUD
    this.updateHUD();
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
