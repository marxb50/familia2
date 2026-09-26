/**
 * ==============================================================================
 * WORLD ARCHITECTURE & ENTITY DRAWING (Estilo Geométrico e Artístico de GRIS)
 * Colunas Neoclássicas, Arcos Mágicos, Mármore Ornamentado & Vitrais
 * ==============================================================================
 */
class WorldRenderer {
  constructor(puzzleManager) {
    this.puzzleManager = puzzleManager;
    this.platforms = [];
    this.character = null;

    this.tileStone = new Image();
    this.tileStone.src = 'assets/images/ui/tile_stone.png';
    this.tileGrass = new Image();
    this.tileGrass.src = 'assets/images/ui/tile_grass.png';

    this.stonePattern = null;
    this.grassPattern = null;

    this.tileStone.onload = () => {
      const c = document.createElement('canvas');
      c.width = this.tileStone.width;
      c.height = this.tileStone.height;
      const cx = c.getContext('2d');
      cx.drawImage(this.tileStone, 0, 0);
      this.stonePattern = cx.createPattern(c, 'repeat');
    };

    this.tileGrass.onload = () => {
      const c = document.createElement('canvas');
      c.width = this.tileGrass.width;
      c.height = this.tileGrass.height;
      const cx = c.getContext('2d');
      cx.drawImage(this.tileGrass, 0, 0);
      this.grassPattern = cx.createPattern(c, 'repeat');
    };
  }

  setPlatforms(platforms) {
    this.platforms = platforms;
  }

  setCharacter(char) {
    this.character = char;
  }

  draw(ctx, camBounds, pal, time) {
    // 1. Desenhar Plataformas e Arquitetura Monumental Texturizada
    this.drawArchitecture(ctx, camBounds, pal, time);

    // 2. Desenhar Personagem Ativo
    if (this.character) {
      this.character.draw(ctx, time);
    }
  }

  drawArchitecture(ctx, camBounds, pal, time) {
    ctx.save();

    for (const plat of this.platforms) {
      // Frustum culling
      if (
        plat.x + plat.width < camBounds.left - 80 ||
        plat.x > camBounds.right + 80 ||
        plat.y + plat.height < camBounds.top - 80 ||
        plat.y > camBounds.bottom + 80
      ) {
        continue;
      }

      if (plat.isOneWay) {
        // Plataforma suspensa esguia: mármore translúcido e filigrana de luz
        ctx.save();
        ctx.fillStyle = pal.accent;
        ctx.globalAlpha = 0.28;
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height || 18);

        ctx.globalAlpha = 0.90;
        ctx.strokeStyle = pal.archStroke;
        ctx.lineWidth = 1.8;
        ctx.strokeRect(plat.x, plat.y, plat.width, plat.height || 18);

        // Borda luminosa no topo
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(plat.x + 4, plat.y + 1);
        ctx.lineTo(plat.x + plat.width - 4, plat.y + 1);
        ctx.stroke();

        // Delicadas pontas ornamentais nas extremidades
        ctx.fillStyle = pal.accent;
        ctx.beginPath();
        ctx.arc(plat.x, plat.y + (plat.height || 18) / 2, 3, 0, Math.PI * 2);
        ctx.arc(plat.x + plat.width, plat.y + (plat.height || 18) / 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        // Passarela nobre e aquedutos de suporte em proporção humana (estilo Gris)
        ctx.save();

        const walkwayH = Math.min(32, plat.height);
        const foundationH = plat.height - walkwayH;
        const isLongFloor = plat.width > 10000;

        // 1. FUNDAÇÃO ARQUITETÔNICA COM ARCADA E NÉVOA (se altura > 40px)
        if (foundationH > 0) {
          // Gradiente etéreo que se dissolve suavemente no abismo de aquarela
          const abyssGrad = ctx.createLinearGradient(0, plat.y + walkwayH, 0, plat.y + plat.height);
          abyssGrad.addColorStop(0, pal.groundFill);
          abyssGrad.addColorStop(0.7, 'rgba(25, 20, 24, 0.75)');
          abyssGrad.addColorStop(1, 'rgba(15, 12, 18, 0.2)');

          ctx.fillStyle = abyssGrad;
          // A fundação continua sólida para a leitura do piso, mas deixa
          // respirar o cenário atrás dela; isso evita uma faixa cinza cortada
          // quando a câmera acompanha o personagem durante o pulo.
          ctx.globalAlpha = isLongFloor ? 0.82 : 1.0;
          ctx.fillRect(plat.x, plat.y + walkwayH, plat.width, foundationH);
          ctx.globalAlpha = 1.0;

          if (isLongFloor && this.stonePattern) {
            ctx.save();
            ctx.globalAlpha = 0.18;
            ctx.fillStyle = this.stonePattern;
            ctx.fillRect(plat.x, plat.y + walkwayH, plat.width, foundationH);
            ctx.restore();
          }

          // Colunas esguias neoclássicas e arcadas delicadas
          if (plat.width >= 160 && foundationH >= 40) {
            const colSpacing = 160;
            ctx.strokeStyle = pal.archStroke;
            ctx.lineWidth = 1.4;
            ctx.globalAlpha = 0.55;

            for (let cx = plat.x + 40; cx < plat.x + plat.width - 40; cx += colSpacing) {
              // Coluna esbelta (12px)
              ctx.fillStyle = pal.midRuins;
              ctx.fillRect(cx, plat.y + walkwayH, 12, foundationH);

              // Capitel superior fino
              ctx.fillStyle = pal.accent;
              ctx.fillRect(cx - 3, plat.y + walkwayH, 18, 5);

              // Arco conectando à próxima coluna
              if (cx + colSpacing < plat.x + plat.width) {
                ctx.beginPath();
                ctx.arc(cx + colSpacing / 2, plat.y + walkwayH + 36, colSpacing * 0.38, Math.PI, 0);
                ctx.stroke();

                // Rosácea / anel central
                ctx.beginPath();
                ctx.arc(cx + colSpacing / 2, plat.y + walkwayH + 18, 4, 0, Math.PI * 2);
                ctx.stroke();
              }
            }
            ctx.globalAlpha = 1.0;
          }
        }

        // 2. PASSARELA PRINCIPAL DE MÁRMORE NOBRE (superfície onde o personagem pisa)
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;

        if (this.stonePattern) {
          ctx.fillStyle = this.stonePattern;
          ctx.fillRect(plat.x, plat.y, plat.width, walkwayH);
          ctx.fillStyle = pal.groundFill;
          ctx.globalAlpha = 0.65;
          ctx.fillRect(plat.x, plat.y, plat.width, walkwayH);
          ctx.globalAlpha = 1.0;
        } else {
          ctx.fillStyle = pal.groundFill;
          ctx.fillRect(plat.x, plat.y, plat.width, walkwayH);
        }
        ctx.shadowColor = 'transparent';

        // Faixa de friso e cornija em relevo
        ctx.fillStyle = pal.accent;
        ctx.globalAlpha = isLongFloor ? 0.68 : 1.0;
        ctx.fillRect(plat.x, plat.y, plat.width, 6);
        ctx.globalAlpha = 1.0;

        // Fio dourado reflexivo no topo
        ctx.strokeStyle = '#fff8e7';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(plat.x, plat.y + 1);
        ctx.lineTo(plat.x + plat.width, plat.y + 1);
        ctx.stroke();

        // Contorno esbelto em nanquim
        ctx.strokeStyle = pal.archStroke;
        ctx.lineWidth = 2.0;
        ctx.strokeRect(plat.x, plat.y, plat.width, walkwayH);

        ctx.restore();
      }
    }

    ctx.restore();
  }
}

window.WorldRenderer = WorldRenderer;
