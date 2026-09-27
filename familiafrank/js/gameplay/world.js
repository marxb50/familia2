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
    window.gameEngine?.renderer.art.drawFinalPortals(ctx, camBounds, time);

    // 2. Desenhar Personagem Ativo
    if (this.character) {
      this.character.draw(ctx, time);
    }
  }

  drawArchitecture(ctx, camBounds, pal, time) {
    window.gameEngine?.renderer.art.drawPlatforms(ctx, camBounds, this.platforms);
  }
}

window.WorldRenderer = WorldRenderer;
