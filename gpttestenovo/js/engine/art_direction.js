/** Original storybook art direction. Decoration never changes collision surfaces. */
class StorybookArt {
  constructor() {
    this.themes = [
      { name: 'O castelo silencioso', stone: '#697478', shade: '#28373e', rim: '#d6dbd6', leaf: '#a1ada4', light: '#f1efdf', garden: false },
      { name: 'A estrada dos girassóis', stone: '#ac8d65', shade: '#514639', rim: '#f0d9a0', leaf: '#80965a', light: '#ffe1a1', garden: true },
      { name: 'O ateliê de Matheus', stone: '#7699a4', shade: '#344e61', rim: '#cae8eb', leaf: '#83afb1', light: '#c7eaf9', garden: false },
      { name: 'As colinas da coragem', stone: '#a68475', shade: '#51444b', rim: '#ecd2b2', leaf: '#9b995e', light: '#ffe0c0', garden: true },
      { name: 'A cavalgada de Pedro', stone: '#ae8066', shade: '#563e40', rim: '#f3d4a2', leaf: '#a1a366', light: '#ffe5b9', garden: true },
      { name: 'A floresta encantada', stone: '#718f7e', shade: '#293f3d', rim: '#d0dec0', leaf: '#86b58b', light: '#cfeac5', garden: true },
      { name: 'O baile de Maria Rosa', stone: '#a38c9e', shade: '#534357', rim: '#f0d8db', leaf: '#b5a1bb', light: '#f8dce7', garden: false },
      { name: 'A família reunida', stone: '#a59372', shade: '#464757', rim: '#f3dfa8', leaf: '#9caf87', light: '#fff0c9', garden: true }
    ];
    this.backgroundCache = new Map();
  }

  theme(index) { return this.themes[Math.max(0, Math.min(7, index))]; }

  backgroundTile(img, index, progress) {
    if (!img?.complete || !img.naturalWidth) return null;
    // Only five tint states are cached for Matheus; never recolor 2M pixels per frame.
    const step = index === 2 ? Math.round(progress * 100) : 100;
    const key = `${index}:${step}`;
    if (this.backgroundCache.has(key)) return this.backgroundCache.get(key);
    const c = document.createElement('canvas');
    c.height = 1080;
    const paintedH = 972; // Preserve the established human scale of the illustrations.
    c.width = Math.round(paintedH * img.naturalWidth / img.naturalHeight);
    const ctx = c.getContext('2d');
    const theme = this.theme(index);
    ctx.fillStyle = theme.shade;
    ctx.fillRect(0, 0, c.width, c.height);
    if (index === 0) ctx.filter = 'grayscale(1)';
    else if (index === 2) ctx.filter = `grayscale(${1 - step / 100 * 0.62}) saturate(${0.42 + step / 100 * 0.58})`;
    ctx.drawImage(img, 0, 0, c.width, paintedH);
    const fade = ctx.createLinearGradient(0, paintedH - 250, 0, paintedH);
    fade.addColorStop(0, 'transparent');
    fade.addColorStop(1, theme.shade);
    ctx.fillStyle = fade;
    ctx.fillRect(0, paintedH - 250, c.width, 358);
    ctx.filter = 'none';
    this.backgroundCache.set(key, c);
    return c;
  }

  drawBackground(ctx, camera, renderer) {
    const regions = window.gameEngine?.levels?.regions;
    const idx = regions ? (camera.x >= regions[7].minX ? 7 : Math.max(0, regions.findIndex(r => camera.x >= r.minX && camera.x < r.maxX))) : 0;
    const region = regions?.[idx];
    const blend = region && idx < 7 ? Math.max(0, Math.min(1, (camera.x - (region.maxX - 900)) / 900)) : 0;
    const paint = (i, alpha) => {
      const tile = this.backgroundTile(renderer.bgImages[`bg${i + 1}`], i, renderer.matheusColorProgress);
      if (!tile) return;
      const scroll = camera.x * 0.12;
      const first = Math.floor(scroll / tile.width);
      ctx.save();
      ctx.globalAlpha = alpha;
      // Use absolute tile indices: no parity flip/pop when the camera crosses a seam.
      for (let n = first; n * tile.width - scroll < renderer.width; n++) {
        const x = n * tile.width - scroll;
        ctx.save();
        ctx.translate(x + ((n & 1) ? tile.width : 0), 0);
        ctx.scale((n & 1) ? -1 : 1, 1);
        ctx.drawImage(tile, 0, 0);
        ctx.restore();
      }
      ctx.restore();
    };
    paint(idx, 1);
    if (blend) paint(idx + 1, blend * blend * (3 - 2 * blend));
    // Very light ivory wash separates the painted scenery from the playable foreground.
    ctx.save();
    ctx.fillStyle = '#f7eddc';
    ctx.globalAlpha = 0.07;
    ctx.fillRect(0, 0, renderer.width, renderer.height);
    ctx.restore();
  }

  drawPlatforms(ctx, bounds, platforms) {
    const engine = window.gameEngine;
    for (const p of platforms) {
      if (p.x > bounds.right + 90 || p.x + p.width < bounds.left - 90 || p.y > bounds.bottom + 80 || p.y + Math.max(p.height, 90) < bounds.top) continue;
      const index = engine?.levels?.getRegionByX(Math.max(0, Math.min(54999, p.width > 10000 ? (bounds.left + bounds.right) / 2 : p.x))).index || 0;
      const t = this.theme(index);
      ctx.save();
      if (index === 0) ctx.filter = 'grayscale(1)';
      if (index === 2) ctx.filter = `grayscale(${1 - (engine?.renderer.matheusColorProgress || 0) * 0.62})`;
      const left = Math.max(p.x, bounds.left - 80);
      const right = Math.min(p.x + p.width, bounds.right + 80);
      const deep = p.height > 80;
      const h = deep ? p.height : Math.max(38, p.height);
      // Painted masonry with rounded lips and a dark underside, readable at handheld size.
      const stone = ctx.createLinearGradient(0, p.y, 0, p.y + Math.min(h, 200));
      stone.addColorStop(0, t.stone);
      stone.addColorStop(0.25, t.shade);
      stone.addColorStop(1, '#202e35');
      ctx.fillStyle = stone;
      ctx.beginPath();
      ctx.roundRect(left, p.y, right - left, h, deep ? 0 : [5, 5, 16, 16]);
      ctx.fill();
      ctx.fillStyle = t.rim;
      ctx.fillRect(left, p.y, right - left, 5);
      ctx.fillStyle = t.stone;
      ctx.fillRect(left + 2, p.y + 8, right - left - 4, 10);
      ctx.strokeStyle = 'rgba(255,244,218,0.22)';
      ctx.lineWidth = 1;
      for (let x = Math.ceil(left / 64) * 64; x < right; x += 64) {
        ctx.beginPath(); ctx.moveTo(x, p.y + 5); ctx.lineTo(x - 6, p.y + 25); ctx.stroke();
      }
      if (deep && t.garden && index !== 7) {
        // Layered earth and roots in the countryside; arcades stay inside the castle.
        ctx.fillStyle = t.leaf;
        ctx.fillRect(left, p.y + 4, right - left, 7);
        for (let layer = 0; layer < 5; layer++) {
          ctx.strokeStyle = layer % 2 ? t.stone : t.leaf;
          ctx.globalAlpha = layer % 2 ? 0.18 : 0.1;
          ctx.lineWidth = 6 + layer * 3;
          ctx.beginPath();
          for (let x = Math.floor(left / 45) * 45; x <= right + 45; x += 45) {
            const y = p.y + 48 + layer * 60 + Math.sin(x * 0.009 + layer * 2) * 13;
            if (x <= left) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.globalAlpha = 0.28; ctx.strokeStyle = t.rim; ctx.lineWidth = 2;
        for (let x = Math.ceil(left / 240) * 240; x < right; x += 240) {
          ctx.beginPath(); ctx.moveTo(x, p.y + 12);
          ctx.bezierCurveTo(x + 15, p.y + 48, x - 22, p.y + 55, x + 4, p.y + 102);
          ctx.moveTo(x + 1, p.y + 56); ctx.quadraticCurveTo(x + 30, p.y + 65, x + 35, p.y + 83); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      } else if (deep) {
        // Draw only visible arcade bays, not all 57,000 pixels of world architecture.
        for (let x = Math.floor(left / 220) * 220; x < right; x += 220) {
          ctx.fillStyle = '#18272e';
          ctx.beginPath();
          ctx.roundRect(x + 30, p.y + 45, 150, h, [75, 75, 0, 0]);
          ctx.fill();
          ctx.strokeStyle = t.stone; ctx.lineWidth = 5; ctx.globalAlpha = 0.45; ctx.stroke(); ctx.globalAlpha = 1;
          ctx.fillStyle = t.rim; ctx.globalAlpha = 0.2;
          ctx.fillRect(x + 12, p.y + 35, 12, h); ctx.globalAlpha = 1;
        }
      } else {
        ctx.fillStyle = t.shade;
        ctx.beginPath();
        ctx.moveTo(p.x + 12, p.y + h - 2);
        ctx.lineTo(p.x + p.width * 0.23, p.y + h + 16);
        ctx.lineTo(p.x + p.width * 0.48, p.y + h + 24);
        ctx.lineTo(p.x + p.width * 0.7, p.y + h + 11);
        ctx.lineTo(p.x + p.width - 12, p.y + h - 2); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = t.rim; ctx.globalAlpha = 0.32;
        ctx.beginPath(); ctx.moveTo(p.x + 18, p.y + h - 6); ctx.lineTo(p.x + p.width - 18, p.y + h - 6); ctx.stroke(); ctx.globalAlpha = 1;
        if (t.garden) {
          ctx.strokeStyle = t.leaf; ctx.lineWidth = 2;
          for (let v = 0; v < 3; v++) {
            const x = p.x + 20 + v * (p.width - 40) / 2;
            ctx.beginPath(); ctx.moveTo(x, p.y + h - 4); ctx.quadraticCurveTo(x - 12, p.y + h + 15, x + 2, p.y + h + 30); ctx.stroke();
            ctx.fillStyle = t.leaf;
            ctx.beginPath(); ctx.ellipse(x - 4, p.y + h + 10, 8, 3, -0.5, 0, Math.PI * 2); ctx.fill();
          }
        } else {
          ctx.fillStyle = t.rim; ctx.globalAlpha = 0.75;
          const x = p.x + p.width / 2;
          ctx.beginPath(); ctx.moveTo(x - 5, p.y + h); ctx.lineTo(x, p.y + h + 11); ctx.lineTo(x + 5, p.y + h); ctx.fill();
        }
      }
      // Small tufts grow at the edge, never across the character's landing area.
      if (t.garden) {
        ctx.strokeStyle = t.leaf; ctx.lineWidth = 2;
        for (let x = Math.ceil(left / 135) * 135 + 15; x < right - 10; x += 135) {
          ctx.beginPath(); ctx.moveTo(x - 5, p.y); ctx.quadraticCurveTo(x - 10, p.y - 14, x - 16, p.y - 15);
          ctx.moveTo(x, p.y); ctx.quadraticCurveTo(x + 1, p.y - 17, x + 9, p.y - 22); ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  drawAtmosphere(ctx, camera, time, index) {
    const t = this.theme(index);
    const monochrome = index === 0 || (index === 2 && !window.gameEngine?.renderer.matheusColorProgress);
    ctx.save();
    ctx.fillStyle = monochrome ? '#eeeae0' : t.light;
    // Deterministic drifting pollen; fixed count bounds the cost in every act.
    for (let i = 0; i < 30; i++) {
      const x = ((i * 317.31 - camera.x * 0.2 + time * (4 + i % 4)) % 2050 + 2050) % 2050 - 65;
      const y = 120 + ((i * 173.7 + Math.sin(time * 0.3 + i) * 24) % 690);
      ctx.globalAlpha = 0.12 + (Math.sin(time + i) + 1) * 0.12;
      ctx.beginPath(); ctx.ellipse(x, y, 1.5 + i % 3, 1.4, time * 0.1 + i, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    const vignette = ctx.createRadialGradient(960, 440, 400, 960, 500, 1120);
    vignette.addColorStop(0, 'transparent'); vignette.addColorStop(1, 'rgba(15,27,35,0.24)');
    ctx.fillStyle = vignette; ctx.fillRect(0, 0, 1920, 1080);
    ctx.restore();
  }
}
window.StorybookArt = StorybookArt;
