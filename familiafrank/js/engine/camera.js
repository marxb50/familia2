/**
 * ==============================================================================
 * CAMERA CINEMATOGRÁFICA MONUMENTAL (Estilo GRIS)
 * Suporte a Zoom Dinâmico, Lookahead Suave, Zonas Monumentais e Balanço
 * ==============================================================================
 */
class CinematicCamera {
  constructor(viewportWidth = 1920, viewportHeight = 1080) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;

    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;

    // Zoom dinâmico
    this.zoom = 1.0;
    this.targetZoom = 1.0;
    this.minZoom = 0.42; // Vista monumental ciclópica
    this.maxZoom = 1.50; // Modo íntimo em corredores

    // Damping / Amortecimento elástico
    this.lerpSpeed = 0.045;
    this.zoomLerpSpeed = 0.025;

    // Lookahead (olhar à frente na direção do movimento)
    this.lookaheadDist = 220;
    this.lookaheadX = 0;
    this.lookaheadY = 0;

    // Limites do mundo
    this.worldBounds = { x: 0, y: 0, width: 6000, height: 3500 };

    // Zonas de enquadramento (Camera Zones)
    this.zones = [];

    // Trauma / Tremor sutil em impactos
    this.shakeIntensity = 0;
    this.shakeDecay = 0.92;
  }

  setWorldBounds(x, y, width, height) {
    this.worldBounds = { x, y, width, height };
  }

  addZone(zone) {
    // zone: { x, y, width, height, targetZoom, offsetY, lookaheadMult }
    this.zones.push(zone);
  }

  triggerShake(intensity = 12) {
    this.shakeIntensity = Math.min(30, this.shakeIntensity + intensity);
  }

  update(target, dt) {
    if (!target) return;

    // 1. Calcular Lookahead com base na velocidade e direção
    const velX = target.vx || 0;
    const targetLookX = Math.sign(velX) * Math.min(Math.abs(velX) * 25, this.lookaheadDist);
    this.lookaheadX += (targetLookX - this.lookaheadX) * 0.04;

    const velY = target.vy || 0;
    const targetLookY = Math.sign(velY) * Math.min(Math.abs(velY) * 15, 120);
    this.lookaheadY += (targetLookY - this.lookaheadY) * 0.03;

    // 2. Verificar Zonas de Câmera Ativas
    let currentTargetZoom = 1.0;
    let extraOffsetY = -145; // More room for the painted landscape; feet in the lower third.

    const charCenterX = target.x + (target.width || 60) / 2;
    const charCenterY = target.y + (target.height || 100) / 2;

    for (const zone of this.zones) {
      if (
        charCenterX >= zone.x &&
        charCenterX <= zone.x + zone.width &&
        charCenterY >= zone.y &&
        charCenterY <= zone.y + zone.height
      ) {
        if (zone.targetZoom) currentTargetZoom = zone.targetZoom;
        if (zone.offsetY !== undefined) extraOffsetY = zone.offsetY;
        break;
      }
    }

    // Se estiver em queda rápida ou subindo alto, ajustar zoom contextualmente
    if (Math.abs(velY) > 600) {
      currentTargetZoom *= 0.88; // Afasta para dar visão vertical
    }

    this.targetZoom = currentTargetZoom;

    // Interpolação suave do Zoom
    this.zoom += (this.targetZoom - this.zoom) * this.zoomLerpSpeed;

    // 3. Posição Alvo da Câmera
    this.targetX = charCenterX + this.lookaheadX;
    this.targetY = charCenterY + this.lookaheadY + extraOffsetY;

    // Interpolação suave da Posição
    this.x += (this.targetX - this.x) * this.lerpSpeed;
    this.y += (this.targetY - this.y) * this.lerpSpeed;

    // 4. Aplicar Tremor de Impacto
    if (this.shakeIntensity > 0.1) {
      this.x += (Math.random() - 0.5) * this.shakeIntensity;
      this.y += (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= this.shakeDecay;
    } else {
      this.shakeIntensity = 0;
    }

    // 5. Clamping nos limites do mundo levando em consideração o Zoom
    const visibleHalfW = (this.viewportWidth / 2) / this.zoom;
    const visibleHalfH = (this.viewportHeight / 2) / this.zoom;

    const minX = this.worldBounds.x + visibleHalfW;
    const maxX = Math.max(minX, this.worldBounds.x + this.worldBounds.width - visibleHalfW);
    const minY = this.worldBounds.y + visibleHalfH;
    const maxY = Math.max(minY, this.worldBounds.y + this.worldBounds.height - visibleHalfH);

    this.x = Math.max(minX, Math.min(maxX, this.x));
    this.y = Math.max(minY, Math.min(maxY, this.y));
  }

  applyTransform(ctx) {
    ctx.save();
    // Centraliza o ponto de foco na tela
    ctx.translate(this.viewportWidth / 2, this.viewportHeight / 2);
    // Aplica o Zoom monumental
    ctx.scale(this.zoom, this.zoom);
    // Translação do mundo para focar na coordenada (x, y)
    ctx.translate(-this.x, -this.y);
  }

  restoreTransform(ctx) {
    ctx.restore();
  }

  worldToScreen(worldX, worldY) {
    return {
      x: (worldX - this.x) * this.zoom + this.viewportWidth / 2,
      y: (worldY - this.y) * this.zoom + this.viewportHeight / 2
    };
  }

  screenToWorld(screenX, screenY) {
    return {
      x: (screenX - this.viewportWidth / 2) / this.zoom + this.x,
      y: (screenY - this.viewportHeight / 2) / this.zoom + this.y
    };
  }

  getVisibleBounds() {
    const halfW = (this.viewportWidth / 2) / this.zoom;
    const halfH = (this.viewportHeight / 2) / this.zoom;
    return {
      left: this.x - halfW,
      right: this.x + halfW,
      top: this.y - halfH,
      bottom: this.y + halfH,
      width: halfW * 2,
      height: halfH * 2
    };
  }
}

window.CinematicCamera = CinematicCamera;
