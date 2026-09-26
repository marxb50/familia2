class NPC {
  constructor(type, x, y, width = 110, height = 145, isBW = false, name = null) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.isBW = isBW;
    this.customName = name;
    this.timer = Math.random() * Math.PI * 2;
    this.frameTimer = Math.random() * 4;
    this.frames = [];
    this.sprite = new Image();
    this.loadSprites();
  }

  loadSprites() {
    let framePaths = [];

    if (this.type.startsWith('matheus')) {
      framePaths = [
        'assets/images/characters/matheus_walk1.png?v=8.0',
        'assets/images/characters/matheus_walk2.png?v=8.0',
        'assets/images/characters/matheus_walk3.png?v=8.0',
        'assets/images/characters/matheus_walk4.png?v=8.0',
        'assets/images/characters/matheus_walk5.png?v=8.0',
        'assets/images/characters/matheus_walk6.png?v=8.0',
        'assets/images/characters/matheus_walk7.png?v=8.0',
        'assets/images/characters/matheus_walk8.png?v=8.0'
      ];
    } else if (this.type === 'pedro_stand') {
      framePaths = [
        'assets/images/characters/pedro_walk1.png?v=8.0',
        'assets/images/characters/pedro_walk2.png?v=8.0',
        'assets/images/characters/pedro_walk3.png?v=8.0',
        'assets/images/characters/pedro_walk4.png?v=8.0',
        'assets/images/characters/pedro_walk5.png?v=8.0',
        'assets/images/characters/pedro_walk6.png?v=8.0',
        'assets/images/characters/pedro_walk7.png?v=8.0',
        'assets/images/characters/pedro_walk8.png?v=8.0'
      ];
    } else if (this.type === 'pedro' || this.type === 'pedro_horse') {
      framePaths = [
        'assets/images/characters/pedro_horse_gallop1.png?v=8.0',
        'assets/images/characters/pedro_horse_gallop2.png?v=8.0',
        'assets/images/characters/pedro_horse_gallop3.png?v=8.0',
        'assets/images/characters/pedro_horse_gallop4.png?v=8.0'
      ];
    } else if (this.type.startsWith('maria_rosa')) {
      framePaths = [
        'assets/images/characters/maria_rosa_walk1.png?v=8.0',
        'assets/images/characters/maria_rosa_walk2.png?v=8.0',
        'assets/images/characters/maria_rosa_walk3.png?v=8.0',
        'assets/images/characters/maria_rosa_walk4.png?v=8.0',
        'assets/images/characters/maria_rosa_walk5.png?v=8.0',
        'assets/images/characters/maria_rosa_walk6.png?v=8.0',
        'assets/images/characters/maria_rosa_walk7.png?v=8.0',
        'assets/images/characters/maria_rosa_walk8.png?v=8.0'
      ];
    } else if (this.type === 'mago') {
      const p1 = this.isBW ? 'assets/images/characters/mago_magic_bw.png?v=8.0' : 'assets/images/characters/mago_magic.png?v=8.0';
      const p2 = this.isBW ? 'assets/images/characters/mago_magic_bw.png?v=8.0' : 'assets/images/characters/mago_idle.png?v=8.0';
      framePaths = [p1, p2];
    } else if (this.type === 'king_stand') {
      framePaths = [
        'assets/images/characters/king_walk1.png?v=8.0',
        'assets/images/characters/king_walk2.png?v=8.0',
        'assets/images/characters/king_walk3.png?v=8.0',
        'assets/images/characters/king_walk4.png?v=8.0',
        'assets/images/characters/king_walk5.png?v=8.0',
        'assets/images/characters/king_walk6.png?v=8.0',
        'assets/images/characters/king_walk7.png?v=8.0',
        'assets/images/characters/king_walk8.png?v=8.0'
      ];
    } else if (this.type === 'queen_stand') {
      framePaths = [
        'assets/images/characters/queen_walk1.png?v=8.0',
        'assets/images/characters/queen_walk2.png?v=8.0',
        'assets/images/characters/queen_walk3.png?v=8.0',
        'assets/images/characters/queen_walk4.png?v=8.0',
        'assets/images/characters/queen_walk5.png?v=8.0',
        'assets/images/characters/queen_walk6.png?v=8.0',
        'assets/images/characters/queen_walk7.png?v=8.0',
        'assets/images/characters/queen_walk8.png?v=8.0'
      ];
    } else {
      framePaths = ['assets/images/characters/children_trio.png?v=8.0'];
    }

    this.frames = framePaths.map(p => {
      const img = new Image();
      img.src = p;
      return img;
    });

    if (this.frames.length > 0) {
      this.sprite = this.frames[0];
    }
  }

  update() {
    this.timer += 0.05;
    this.frameTimer += 0.13;
  }

  draw(ctx) {
    ctx.save();
    const floatY = Math.sin(this.timer) * 3;
    const drawX = Math.round(this.x);
    const drawY = Math.round(this.y + floatY);

    // Glowing aura
    const grad = ctx.createRadialGradient(
      drawX + this.width / 2, drawY + this.height / 2, 10,
      drawX + this.width / 2, drawY + this.height / 2, this.width
    );
    grad.addColorStop(0, this.isBW ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 235, 150, 0.55)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(drawX + this.width / 2, drawY + this.height / 2, this.width * 0.85, 0, Math.PI * 2);
    ctx.fill();

    // Select active animation frame
    let activeImg = this.sprite;
    if (this.frames && this.frames.length > 0) {
      const idx = Math.floor(this.frameTimer) % this.frames.length;
      if (this.frames[idx] && this.frames[idx].complete && this.frames[idx].naturalWidth > 0) {
        activeImg = this.frames[idx];
      }
    }

    if (activeImg && activeImg.complete && activeImg.naturalWidth > 0) {
      ctx.drawImage(activeImg, drawX, drawY, this.width, this.height);
    } else {
      ctx.fillStyle = '#9c27b0';
      ctx.fillRect(drawX, drawY, this.width, this.height);
    }

    // Name badge
    ctx.font = 'bold 15px Comfortaa, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#2b1b17';
    ctx.lineWidth = 3.5;
    ctx.textAlign = 'center';
    const names = {
      'mago': 'O Sábio Mago ✨',
      'matheus': 'Príncipe Matheus 💙',
      'matheus_stand': 'Príncipe Matheus 💙',
      'pedro': 'Príncipe Pedro ⚔️',
      'pedro_stand': 'Príncipe Pedro ⚔️',
      'pedro_horse': 'Príncipe Pedro ⚔️',
      'maria_rosa': 'Princesa Maria Rosa 🌸',
      'maria_rosa_stand': 'Princesa Maria Rosa 🌸',
      'children_trio': '✨ Todos os Filhos do Coração! 💖',
      'family': '✨ Todos os Filhos do Coração! 💖'
    };
    const title = this.customName || names[this.type] || 'Amigo Real';
    ctx.strokeText(title, drawX + this.width / 2, drawY - 14);
    ctx.fillText(title, drawX + this.width / 2, drawY - 14);

    ctx.restore();
  }
}
window.NPC = NPC;
