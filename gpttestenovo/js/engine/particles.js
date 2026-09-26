/**
 * ==============================================================================
 * WATERCOLOR PARTICLE SYSTEM (Efeitos Orgânicos de Tinta, Pétalas & Estrelas)
 * ==============================================================================
 */
class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Dinâmica personalizada por tipo
      if (p.type === 'petal') {
        p.angle += p.rotSpeed * dt;
        p.vx += Math.sin(p.life * 4) * 15 * dt;
        p.vy = Math.min(80, p.vy + 30 * dt); // Flutuação lenta
      } else if (p.type === 'watercolor') {
        p.radius += p.expandSpeed * dt;
        p.alpha = (p.life / p.maxLife) * p.initialAlpha;
      } else if (p.type === 'star') {
        p.twinkleTimer = (p.twinkleTimer || 0) + dt * 5;
        p.currentRadius = p.baseRadius * (1 + Math.sin(p.twinkleTimer) * 0.3);
      } else if (p.type === 'shockwave') {
        p.radius += p.speed * dt;
        p.alpha = Math.pow(p.life / p.maxLife, 1.5) * p.initialAlpha;
      } else if (p.type === 'wind') {
        p.y -= p.speed * dt;
        p.x += Math.sin(p.life * 6) * 20 * dt;
      }
    }
  }

  draw(ctx, cameraBounds) {
    for (const p of this.particles) {
      // Frustum culling para performance
      if (
        p.x < cameraBounds.left - 100 ||
        p.x > cameraBounds.right + 100 ||
        p.y < cameraBounds.top - 100 ||
        p.y > cameraBounds.bottom + 100
      ) {
        continue;
      }

      ctx.save();
      if (p.type === 'watercolor') {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'petal') {
        ctx.globalAlpha = (p.life / p.maxLife) * 0.9;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color || '#ff85a2';
        ctx.beginPath();
        // Desenha formato de pétala oval curvada
        ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'star') {
        const a = (p.life / p.maxLife) * (p.alpha || 1);
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color || '#fff4cc';
        ctx.shadowColor = p.glowColor || '#ffd166';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.currentRadius || p.baseRadius, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'shockwave') {
        ctx.globalAlpha = p.alpha;
        ctx.strokeStyle = p.color || '#e63946';
        ctx.lineWidth = p.lineWidth || 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'wind') {
        ctx.globalAlpha = (p.life / p.maxLife) * 0.6;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius || 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // Criar respingo de aquarela (watercolor bloom)
  spawnWatercolorBlobs(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      const life = 0.8 + Math.random() * 0.8;
      this.particles.push({
        type: 'watercolor',
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 6 + Math.random() * 14,
        expandSpeed: 18 + Math.random() * 25,
        color: color,
        initialAlpha: 0.55 + Math.random() * 0.25,
        alpha: 0.7,
        life: life,
        maxLife: life
      });
    }
  }

  // Criar pétalas de rosa ao flutuar ou dançar
  spawnPetals(x, y, count = 6, color = '#ff758f') {
    for (let i = 0; i < count; i++) {
      const life = 1.6 + Math.random() * 1.4;
      this.particles.push({
        type: 'petal',
        x: x + (Math.random() - 0.5) * 35,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 60,
        vy: 10 + Math.random() * 40,
        size: 5 + Math.random() * 5,
        angle: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 4,
        color: color,
        life: life,
        maxLife: life
      });
    }
  }

  // Criar onda de choque no Heavy Slam
  spawnSlamImpact(x, y, color = '#e63946') {
    // 2 anéis concêntricos de choque
    this.particles.push({
      type: 'shockwave',
      x, y, vx: 0, vy: 0,
      radius: 10,
      speed: 450,
      lineWidth: 5,
      color: color,
      initialAlpha: 0.85,
      alpha: 0.85,
      life: 0.45,
      maxLife: 0.45
    });
    this.particles.push({
      type: 'shockwave',
      x, y, vx: 0, vy: 0,
      radius: 5,
      speed: 280,
      lineWidth: 3,
      color: '#fff',
      initialAlpha: 0.95,
      alpha: 0.95,
      life: 0.35,
      maxLife: 0.35
    });

    // Pedaços de poeira e mármore
    for (let i = 0; i < 20; i++) {
      const angle = -Math.PI * (0.1 + Math.random() * 0.8); // Para cima
      const speed = 120 + Math.random() * 280;
      this.particles.push({
        type: 'watercolor',
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 4 + Math.random() * 8,
        expandSpeed: 10,
        color: Math.random() > 0.4 ? color : '#e0d6c8',
        initialAlpha: 0.8,
        alpha: 0.8,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.9
      });
    }
  }

  // Estrelas de memória coletadas
  spawnMemoryStars(x, y, count = 15, color = '#ffd166') {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 70 + Math.random() * 140;
      const life = 1.0 + Math.random() * 0.8;
      this.particles.push({
        type: 'star',
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        baseRadius: 3 + Math.random() * 3,
        twinkleTimer: Math.random() * 10,
        color: color,
        glowColor: '#fff',
        alpha: 1,
        life: life,
        maxLife: life
      });
    }
  }

  // Gotas de ar ascendente em túneis de vento
  spawnWindGusts(x, y, width, height, count = 3) {
    for (let i = 0; i < count; i++) {
      const life = 1.2 + Math.random() * 0.8;
      this.particles.push({
        type: 'wind',
        x: x + Math.random() * width,
        y: y + height - Math.random() * 30,
        vx: (Math.random() - 0.5) * 15,
        vy: -20,
        speed: 150 + Math.random() * 200,
        radius: 1.5 + Math.random() * 2.5,
        life: life,
        maxLife: life
      });
    }
  }
}

window.ParticleSystem = ParticleSystem;
