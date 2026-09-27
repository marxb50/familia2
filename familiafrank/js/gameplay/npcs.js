/**
 * ==============================================================================
 * GRIS NPC & NARRATIVE ENCOUNTERS
 * Mago, Matheus Bebê, Pedro a Cavalo, Maria Rosa e Pais Reais
 * Animações Fluidas, Auras de Aquarela e Gatilhos de Encontro Contemplativos
 * ==============================================================================
 */

class GrisNPC {
  constructor(type, x, y, width = 110, height = 145, customName = null) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.customName = customName;
    this.timer = Math.random() * Math.PI * 2;
    this.frameTimer = 0;
    this.frames = [];
    this.isBW = false;
    this.triggered = false;

    this.loadSprites();
  }

  loadSprites() {
    let framePaths = [];

    if (this.type === 'mago') {
      framePaths = [
        'assets/images/characters/mago_idle.png?v=8.1',
        'assets/images/characters/mago_magic.png?v=8.1'
      ];
    } else if (this.type === 'matheus_baby' || this.type === 'matheus_stand') {
      framePaths = [
        'assets/images/characters/matheus_stand.png?v=8.1',
        'assets/images/characters/matheus_idle.png?v=8.1',
        'assets/images/characters/matheus_cheer1.png?v=8.1',
        'assets/images/characters/matheus_cheer2.png?v=8.1'
      ];
    } else if (this.type === 'pedro_horse') {
      framePaths = [
        'assets/images/characters/pedro_horse_idle.png?v=8.1',
        'assets/images/characters/pedro_horse_gallop1.png?v=8.1',
        'assets/images/characters/pedro_horse_gallop2.png?v=8.1'
      ];
    } else if (this.type === 'pedro_stand') {
      framePaths = [
        'assets/images/characters/pedro_stand.png?v=8.1',
        'assets/images/characters/pedro_idle.png?v=8.1'
      ];
    } else if (this.type === 'maria_rosa_stand') {
      framePaths = [
        'assets/images/characters/maria_rosa_stand.png?v=8.1',
        'assets/images/characters/maria_rosa_curtsy.png?v=8.1',
        'assets/images/characters/maria_rosa_wave.png?v=8.1'
      ];
    } else if (this.type === 'king_stand') {
      framePaths = [
        'assets/images/characters/king_idle.png?v=8.1'
      ];
    } else if (this.type === 'queen_stand') {
      framePaths = [
        'assets/images/characters/queen_idle.png?v=8.1'
      ];
    } else {
      framePaths = ['assets/images/characters/children_trio.png?v=8.1'];
    }

    this.frames = framePaths.map(p => {
      const img = new Image();
      img.src = p;
      return img;
    });
  }

  update(dt) {
    this.timer += dt * 3.0;
    this.frameTimer += dt * 2.8;
  }

  checkEncounter(player) {
    if (this.triggered || !player) return false;
    const playerCenterX = player.x + player.width / 2;
    const npcCenterX = this.x + this.width / 2;
    const dist = Math.abs(playerCenterX - npcCenterX);
    const vertDist = Math.abs((player.y + player.height) - (this.y + this.height));

    if (dist < 110 && vertDist < 160) {
      this.triggered = true;
      return true;
    }
    return false;
  }

  draw(ctx, time, paletteKey) {
    ctx.save();
    const floatY = Math.sin(this.timer) * 4;
    const drawX = Math.round(this.x);
    const drawY = Math.round(this.y + floatY);
    // Aumenta somente a arte; área de encontro e posição lógica não mudam.
    const visualScale = 1.6;
    const visualW = Math.round(this.width * visualScale);
    const visualH = Math.round(this.height * visualScale);
    const visualX = drawX - Math.round((visualW - this.width) / 2);
    const visualY = drawY - (visualH - this.height);

    // Halo sagrado de aquarela suave ao redor do personagem
    const centerX = visualX + visualW / 2;
    const centerY = visualY + visualH / 2;
    const grad = ctx.createRadialGradient(
      centerX, centerY, 15,
      centerX, centerY, this.width * 0.95
    );

    const isGray = paletteKey === 'gray';
    grad.addColorStop(0, isGray ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 235, 160, 0.55)');
    grad.addColorStop(0.7, isGray ? 'rgba(180, 180, 180, 0.2)' : 'rgba(255, 215, 120, 0.25)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.width * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Selecionar frame de animação ativo
    let activeImg = null;
    if (this.frames && this.frames.length > 0) {
      const idx = Math.floor(this.frameTimer) % this.frames.length;
      if (this.frames[idx] && this.frames[idx].complete && this.frames[idx].naturalWidth > 0) {
        activeImg = this.frames[idx];
      }
    }

    if (activeImg) {
      if (isGray) {
        ctx.filter = 'grayscale(100%) brightness(0.95) contrast(1.1)';
      }
      ctx.drawImage(activeImg, visualX, visualY, visualW, visualH);
      ctx.filter = 'none';
    } else {
      // Fallback
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(visualX, visualY, visualW, visualH);
    }

    // Título poético estilizado sobre a cabeça
    const names = {
      'mago': 'O Sábio Mago 🔮',
      'matheus_baby': 'Príncipe Matheus Bebê 👶💙',
      'matheus_stand': 'Príncipe Matheus 💙',
      'pedro_horse': 'Príncipe Pedro & Cavalo Branco ⚔️',
      'pedro_stand': 'Príncipe Pedro ⚔️',
      'maria_rosa_stand': 'Princesa Maria Rosa 🌸👑',
      'king_stand': 'O Rei 👑',
      'queen_stand': 'A Rainha 👑'
    };

    const title = this.customName || names[this.type] || 'Personagem Real';
    ctx.font = 'bold 15px "Cinzel", serif';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1a140e';
    ctx.lineWidth = 3.5;
    ctx.textAlign = 'center';
    ctx.strokeText(title, centerX, visualY - 14);
    ctx.fillText(title, centerX, visualY - 14);

    // Indicador sutil de interação quando próximo
    ctx.font = 'italic 12px "Cormorant Garamond", serif';
    ctx.fillStyle = '#ffeaa7';
    ctx.strokeText('Aproxime-se para encontrar ✨', centerX, visualY - 32);
    ctx.fillText('Aproxime-se para encontrar ✨', centerX, visualY - 32);

    ctx.restore();
  }
}

class NPCManager {
  constructor() {
    this.npcs = [];
  }

  clear() {
    this.npcs = [];
  }

  addNPC(type, x, y, width = 110, height = 145, customName = null) {
    const npc = new GrisNPC(type, x, y, width, height, customName);
    this.npcs.push(npc);
    return npc;
  }

  update(dt, player, onEncounter) {
    for (const npc of this.npcs) {
      npc.update(dt);
      if (npc.checkEncounter(player)) {
        onEncounter?.(npc);
      }
    }
  }

  draw(ctx, camBounds, time, paletteKey) {
    for (const npc of this.npcs) {
      // Frustum culling
      if (
        npc.x + npc.width < camBounds.left - 100 ||
        npc.x > camBounds.right + 100 ||
        npc.y + npc.height < camBounds.top - 100 ||
        npc.y > camBounds.bottom + 100
      ) {
        continue;
      }
      npc.draw(ctx, time, paletteKey);
    }
  }
}

window.GrisNPC = GrisNPC;
window.NPCManager = NPCManager;
