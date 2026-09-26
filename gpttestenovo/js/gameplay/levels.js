/**
 * ==============================================================================
 * MUNDO CONTÍNUO METROIDVANIA (O Castelo que Nasce do Coração)
 * - Zero cortes, zero telas de carregamento, zero teletransporte!
 * - Toda a jornada do Reino de Franklândia em um mapa horizontal contínuo (0 a 36.500px).
 * - O jogador caminha suavemente de um bioma/ato para o próximo:
 *   Castelo -> Estrada dos Girassóis -> Vilarejo -> Ateliê -> Colinas -> Pradaria -> Floresta -> Baile -> Pátio da Adoção.
 * ==============================================================================
 */

class LevelDesignManager {
  constructor() {
    this.currentRegionIndex = 0;

    // Definição das 8 Regiões Narrativas Contínuas (Expandidas em 50%: 6.750px cada)
    this.regions = [
      {
        id: 1,
        minX: 0,
        maxX: 6750,
        title: "Ato I • O Castelo Silencioso & O Mago",
        subtitle: "O castelo não tem cores... Procure o bondoso Mago no jardim real para pedir a bênção de um filho.",
        characterType: "couple",
        colorKey: "gray",
        bgKey: "bg1",
        playerStartX: 250,
        narrationAudio: "assets/audio/cutscene_1.mp3",
        cutsceneText: "Era uma vez, em um reino distante, um rei e uma rainha que moravam em um lindo castelo. Tudo parecia perfeito, mas eles sentiam que faltava algo especial. Aquele castelo não tinha cores, pois não havia crianças no lugar. Em uma noite de luar, o Mago notou a tristeza e resolveu ajudar. Caminhem juntos pelo castelo cinzento e encontrem o Mago para pedir a bênção de um filho."
      },
      {
        id: 2,
        minX: 6750,
        maxX: 13500,
        title: "Ato II • A Estrada dos Girassóis & O Vilarejo",
        subtitle: "A carta mágica do Mago chegou! Percorra a estrada na Carruagem Real até o vilarejo para acolher Matheus bebê.",
        characterType: "carriage",
        colorKey: "gold",
        bgKey: "bg2",
        playerStartX: 7000,
        narrationAudio: "assets/audio/cutscene_2.mp3",
        cutsceneText: "O bondoso Mago enviou uma carta mágica para o castelo: um príncipe teria nascido e precisava de uma família! O rei e a rainha não pensaram duas vezes e pediram para aprontar a carruagem para uma longa viagem. Avancem pela estrada florida até encontrar o bebê Matheus, que significa Presente de Deus!"
      },
      {
        id: 3,
        minX: 13500,
        maxX: 20250,
        title: "Ato III • Os Pincéis Mágicos de Matheus",
        subtitle: "Matheus cresceu e trouxe cores ao castelo! Salte com pulo duplo e pinte pontes de tinta (tecla J) até seus pais.",
        characterType: "matheus",
        colorKey: "blue",
        bgKey: "bg3",
        playerStartX: 13750,
        narrationAudio: "assets/audio/cutscene_3.mp3",
        cutsceneText: "O pequeno Matheus cresceu e trouxe as primeiras cores e brincadeiras ao castelo! Com sua criatividade e alegria, ele descobriu pincéis encantados e potes de tinta azul real. Agora é a vez de Matheus! Salte pelo ateliê e jardins do castelo recolhendo os pincéis mágicos para pintar o reino ao vivo com a cor da confiança e da segurança!"
      },
      {
        id: 4,
        minX: 20250,
        maxX: 27000,
        title: "Ato IV • As Colinas da Coragem & O Cavalo Branco",
        subtitle: "Nova carta do Mago! Caminhem pelas colinas da coragem para encontrar Pedro em seu cavalo branco.",
        characterType: "couple",
        colorKey: "red",
        bgKey: "bg4",
        playerStartX: 20500,
        narrationAudio: "assets/audio/cutscene_4.mp3",
        cutsceneText: "Anos depois, o príncipe Matheus perguntava ao pai quando novas cores chegariam. E em uma manhã de sol quente, outra carta do Mago anunciou que um príncipe teria nascido e estava em seu cavalo à procura de um lar feliz. Todas as tardes a família esperava na torre. Caminhem pelas colinas da coragem para avistar o cavalo branco!"
      },
      {
        id: 5,
        minX: 27000,
        maxX: 33750,
        title: "Ato V • A Cavalgada Real de Pedro",
        subtitle: "Pedro galopa com seu cavalo e espada! Cavalgue pelas pradarias até reencontrar seu irmão Matheus e seus pais.",
        characterType: "pedro_horse",
        colorKey: "red",
        bgKey: "bg5",
        playerStartX: 27250,
        narrationAudio: "assets/audio/cutscene_5.mp3",
        cutsceneText: "Pedro chegou trazendo consigo a força, a resistência e a espada da coragem! O pequeno príncipe ama cavalgar velozmente em seu cavalo branco pelas pradarias do reino. Agora é a sua vez com Pedro! Cavalgue velozmente, salte cercas e desfiladeiros, brandindo a espada para espalhar a cor vermelha da bravura por todo o castelo!"
      },
      {
        id: 6,
        minX: 33750,
        maxX: 40500,
        title: "Ato VI • A Floresta Encantada & O Trem",
        subtitle: "Siga os trilhos iluminados por lanternas em busca da jovem princesa que viajava de trem!",
        characterType: "couple",
        colorKey: "green",
        bgKey: "bg6",
        playerStartX: 34000,
        narrationAudio: "assets/audio/cutscene_6.mp3",
        cutsceneText: "O castelo agora brilhava com as brincadeiras dos dois príncipes, mas faltava o brilho especial que apenas uma princesa poderia trazer. Histórias corriam de que uma jovenzinha misteriosa viajava de trem em busca de amor e se perdera na floresta encantada. O rei decretou uma grande busca. Atravessem o bosque encantado para resgatar a bela princesa!"
      },
      {
        id: 7,
        minX: 40500,
        maxX: 47250,
        title: "Ato VII • O Grande Baile Real de Maria Rosa",
        subtitle: "Maria Rosa desce as escadarias imperiais! Dance pelo salão nobre, plane com seu vestido e cante para as flores desabrocharem (K).",
        characterType: "maria_rosa",
        colorKey: "green",
        bgKey: "bg7",
        playerStartX: 40750,
        narrationAudio: "assets/audio/cutscene_7.mp3",
        cutsceneText: "Após meses de busca, Maria Rosa foi encontrada: uma moça de radiante beleza, com a coroa mais linda do reino e um anel com seu nome cravado! O rei e a rainha decretaram uma semana de festas. Agora é a vez de Maria Rosa! Desça a escadaria do Grande Baile Real, dance pelo salão com seus passos de valsa e piruetas, sendo conduzida por seus irmãos Matheus e Pedro!"
      },
      {
        id: 8,
        minX: 47250,
        maxX: 55000,
        title: "Ato VIII • A Sagrada Família: O Poder da Adoção",
        subtitle: "Cinco corações, dois destinos. Atravesse o arco-íris do jardim ou suba até o arco das nuvens com toda a família!",
        characterType: "family_swap",
        colorKey: "gold",
        bgKey: "bg8",
        playerStartX: 47500,
        narrationAudio: "assets/audio/cutscene_8.mp3",
        victoryAudio: "assets/audio/victory_narration.mp3",
        cutsceneText: "Toda a família está unida pelo amor! Cada cor agora brilha em sua plenitude: o verde do equilíbrio, o amarelo da esperança, o azul da confiança, o vermelho da coragem e o rosa da ternura. Uma verdadeira família nasce do amor, do carinho e do afeto... porque filhos não nascem só da barriga, mas também nascem no coração. Esse é o poder da adoção! Vamos celebrar no pátio real a vitória da nossa família!"
      }
    ];

    // Limites Globais do Mundo Contínuo Expandido (56.000px)
    this.worldBounds = { x: 0, y: 0, width: 56000, height: 2600 };
    // Shared coordinates for rendering, physical arrival and the ending scene.
    this.finalPortals = [
      { route: 'garden', x: 54380, floorY: 2050, label: 'O jardim do amanhã' },
      { route: 'sky', x: 54380, floorY: 1350, label: 'Além do arco-íris' }
    ];

    // Todas as Plataformas do Mundo Integradas em Piso Contínuo
    this.platforms = this.generateContinuousPlatforms();
  }

  generateContinuousPlatforms() {
    const list = [
      // 1. SOLO PRINCIPAL 100% ININTERRUPTO DE PONTA A PONTA (NUNCA CAI NO VAZIO!)
      { x: -500, y: 2050, width: 57000, height: 450 },

      // REGIÃO 1: CASTELO & MAGO (0 a 6750)
      { x: 900, y: 1910, width: 320, height: 28, isOneWay: true },
      { x: 1320, y: 1840, width: 220, height: 24, isOneWay: true },
      { x: 1650, y: 1780, width: 420, height: 32 },
      { x: 2200, y: 1820, width: 220, height: 24, isOneWay: true },
      { x: 2550, y: 1890, width: 360, height: 28, isOneWay: true },
      { x: 3070, y: 1800, width: 220, height: 24, isOneWay: true },
      { x: 3450, y: 1760, width: 440, height: 32 },
      { x: 4100, y: 1830, width: 240, height: 24, isOneWay: true },
      { x: 4500, y: 1880, width: 380, height: 28, isOneWay: true },

      // REGIÃO 2: ESTRADA DOS GIRASSÓIS & VILAREJO (6750 a 13500)
      { x: 7650, y: 1910, width: 320, height: 28, isOneWay: true },
      { x: 8150, y: 1840, width: 220, height: 24, isOneWay: true },
      { x: 8475, y: 1770, width: 420, height: 32 },
      { x: 9060, y: 1810, width: 220, height: 24, isOneWay: true },
      { x: 9450, y: 1890, width: 360, height: 28, isOneWay: true },
      { x: 9870, y: 1810, width: 220, height: 24, isOneWay: true },
      { x: 10350, y: 1750, width: 440, height: 32 },
      { x: 10880, y: 1820, width: 240, height: 24, isOneWay: true },
      { x: 11325, y: 1880, width: 380, height: 28, isOneWay: true },

      // REGIÃO 3: ATELIÊ DE MATHEUS & PONTES DE TINTA (13500 a 20250)
      { x: 14400, y: 1890, width: 300, height: 28, isOneWay: true },
      { x: 14900, y: 1810, width: 220, height: 24, isOneWay: true },
      { x: 15225, y: 1740, width: 420, height: 32 },
      { x: 15800, y: 1810, width: 240, height: 24, isOneWay: true },
      { x: 16200, y: 1860, width: 360, height: 28, isOneWay: true },
      { x: 16680, y: 1790, width: 240, height: 24, isOneWay: true },
      { x: 17100, y: 1720, width: 440, height: 34 },
      { x: 17650, y: 1790, width: 240, height: 24, isOneWay: true },
      { x: 18075, y: 1860, width: 360, height: 28, isOneWay: true },

      // REGIÃO 4: COLINAS DA CORAGEM & PEDRO (20250 a 27000)
      { x: 21150, y: 1910, width: 320, height: 28, isOneWay: true },
      { x: 21650, y: 1840, width: 220, height: 24, isOneWay: true },
      { x: 21975, y: 1780, width: 420, height: 32 },
      { x: 22550, y: 1810, width: 220, height: 24, isOneWay: true },
      { x: 22950, y: 1890, width: 360, height: 28, isOneWay: true },
      { x: 23450, y: 1800, width: 220, height: 24, isOneWay: true },
      { x: 23850, y: 1750, width: 440, height: 34 },
      { x: 24350, y: 1810, width: 240, height: 24, isOneWay: true },
      { x: 24825, y: 1880, width: 380, height: 28, isOneWay: true },

      // REGIÃO 5: CAVALGADA DE PEDRO (27000 a 33750)
      { x: 27900, y: 1900, width: 380, height: 28, isOneWay: true },
      { x: 28400, y: 1830, width: 240, height: 24, isOneWay: true },
      { x: 28800, y: 1760, width: 460, height: 34 },
      { x: 29350, y: 1810, width: 240, height: 24, isOneWay: true },
      { x: 29850, y: 1890, width: 400, height: 28, isOneWay: true },
      { x: 30350, y: 1800, width: 240, height: 24, isOneWay: true },
      { x: 30825, y: 1740, width: 480, height: 34 },
      { x: 31350, y: 1810, width: 240, height: 24, isOneWay: true },
      { x: 31725, y: 1880, width: 380, height: 28, isOneWay: true },

      // REGIÃO 6: FLORESTA ENCANTADA & TRILHOS (33750 a 40500)
      { x: 34650, y: 1900, width: 340, height: 28, isOneWay: true },
      { x: 35150, y: 1830, width: 220, height: 24, isOneWay: true },
      { x: 35475, y: 1760, width: 440, height: 32 },
      { x: 36000, y: 1810, width: 230, height: 24, isOneWay: true },
      { x: 36450, y: 1880, width: 360, height: 28, isOneWay: true },
      { x: 36900, y: 1800, width: 230, height: 24, isOneWay: true },
      { x: 37350, y: 1740, width: 460, height: 34 },
      { x: 37850, y: 1810, width: 240, height: 24, isOneWay: true },
      { x: 38325, y: 1870, width: 380, height: 28, isOneWay: true },

      // REGIÃO 7: GRANDE BAILE REAL DE MARIA ROSA (40500 a 47250)
      { x: 41400, y: 1890, width: 360, height: 28, isOneWay: true },
      { x: 41900, y: 1820, width: 230, height: 24, isOneWay: true },
      { x: 42300, y: 1750, width: 460, height: 34 },
      { x: 42850, y: 1800, width: 230, height: 24, isOneWay: true },
      { x: 43275, y: 1870, width: 380, height: 28, isOneWay: true },
      { x: 43700, y: 1790, width: 230, height: 24, isOneWay: true },
      { x: 44175, y: 1730, width: 480, height: 34 },
      { x: 44650, y: 1790, width: 240, height: 24, isOneWay: true },
      { x: 45150, y: 1860, width: 380, height: 28, isOneWay: true },

      // REGIÃO 8: PÁTIO IMPERIAL DA SAGRADA FAMÍLIA (47250 a 55000)
      { x: 48150, y: 1820, width: 520, height: 32 },
      { x: 48750, y: 1760, width: 260, height: 24, isOneWay: true },
      { x: 49200, y: 1950, width: 220, height: 20, isOneWay: true },
      { x: 49450, y: 1810, width: 220, height: 24, isOneWay: true },
      { x: 49800, y: 1650, width: 600, height: 32 },
      { x: 50500, y: 1730, width: 250, height: 24, isOneWay: true },
      { x: 51000, y: 1780, width: 240, height: 20, isOneWay: true },
      { x: 51300, y: 1630, width: 240, height: 24, isOneWay: true },
      { x: 51600, y: 1500, width: 680, height: 34 },
      { x: 52400, y: 1430, width: 260, height: 24, isOneWay: true },
      // An open, raised terrace, not a wall: both endings remain accessible.
      { x: 52800, y: 1350, width: 2200, height: 32, isOneWay: true }
    ];
    return list;
  }

  setupWorldNPCs(npcMgr) {
    npcMgr.clear();
    // Região 1: Sábio Mago
    npcMgr.addNPC('mago', 5400, 1875, 110, 145, 'O Sábio Mago 🔮');
    // The mage is the only stationary encounter; the other family members
    // appear through the playable story rather than as end-of-act NPCs.
  }

  setupWorldPuzzles(puzzleMgr) {
    puzzleMgr.reset();

    // Estrelas de Memória ao longo de toda a jornada expandida
    const stars = [
      { x: 1800, y: 1720, id: 'star1_1' },
      { x: 3600, y: 1700, id: 'star1_2' },
      { x: 8625, y: 1710, id: 'star2_1' },
      { x: 10500, y: 1690, id: 'star2_2' },
      { x: 22125, y: 1720, id: 'star4_1' },
      { x: 24000, y: 1690, id: 'star4_2' },
      { x: 28950, y: 1700, id: 'star5_1' },
      { x: 30975, y: 1680, id: 'star5_2' },
      { x: 35625, y: 1700, id: 'star6_1' },
      { x: 37500, y: 1680, id: 'star6_2' },
      { x: 42450, y: 1690, id: 'star7_1' },
      { x: 44325, y: 1670, id: 'star7_2' },
      { x: 48375, y: 1770, id: 'star8_1' },
      { x: 50025, y: 1600, id: 'star8_2' },
      { x: 51825, y: 1450, id: 'star8_3' }
    ];
    stars.forEach(s => puzzleMgr.addMemoryStar(s.x, s.y, s.id));

    // A generous trail of small, easy-to-reach lights runs through every act.
    // These are regular memory stars and never advance Matheus's brush colors.
    const bonusStarOffsets = [950, 2750, 4450, 5700];
    this.regions.forEach((region, regionIndex) => {
      bonusStarOffsets.forEach((offset, pointIndex) => {
        puzzleMgr.addMemoryStar(region.minX + offset, 1970, `trail${regionIndex + 1}_${pointIndex + 1}`);
      });
    });

    // Tinta azul e quatro pincéis mágicos do Matheus (Ato 3).
    // Os antigos pontos brilhantes desta região foram substituídos por estes
    // itens; cada coleta revela uma pequena parte, deixando o fim mais vivo.
    const matheusPaints = [
      { poolX: 14520, poolY: 1560, brushX: 14610, brushY: 1680, id: 'brush3_1' },
      { poolX: 15300, poolY: 1510, brushX: 15400, brushY: 1630, id: 'brush3_2' },
      { poolX: 16620, poolY: 1530, brushX: 16720, brushY: 1650, id: 'brush3_3' },
      { poolX: 17400, poolY: 1490, brushX: 17500, brushY: 1610, id: 'brush3_4' }
    ];
    matheusPaints.forEach((paint) => {
      puzzleMgr.addPaintPool(paint.poolX, paint.poolY, 360, 320, `${paint.id}_pool`);
      puzzleMgr.addPaintBrush(paint.brushX, paint.brushY, paint.id, 0.22);
    });

    // Flores que Desabrocham (Ato 7 e 8)
    puzzleMgr.addBloomingFlower(42450, 1720, 180, 'fl7_1');
    puzzleMgr.addBloomingFlower(44400, 1700, 190, 'fl7_2');
    puzzleMgr.addBloomingFlower(49950, 1610, 180, 'fl8_1');

    // Cogumelos e Correntes de Vento na Subida Final (Ato 8)
    puzzleMgr.addBouncyMushroom(48000, 2030, 180, -840, 'mush8_1');
    puzzleMgr.addBouncyMushroom(50700, 2030, 180, -860, 'mush8_2');
    puzzleMgr.addWindUpdraft(51150, 1100, 300, 1200, 500, 360);

    // Beacons de Despertar de Cor ao final de cada ato expandido
    puzzleMgr.addColorBeacon(5850, 1950, 'gray', 'A Bênção do Sábio Mago');
    puzzleMgr.addColorBeacon(12600, 1950, 'gold', 'O Acolhimento do Primeiro Filho: Matheus');
    puzzleMgr.addColorBeacon(19275, 1910, 'blue', 'A Confiança e Imaginação do Príncipe Matheus');
    puzzleMgr.addColorBeacon(26100, 1950, 'red', 'A Chegada do Príncipe da Bravura: Pedro');
    puzzleMgr.addColorBeacon(32850, 1950, 'red', 'A Bravura que Une os Irmãos');
    puzzleMgr.addColorBeacon(39600, 1950, 'green', 'O Resgate da Princesa Maria Rosa');
    puzzleMgr.addColorBeacon(46350, 1950, 'gold', 'A Ternura do Grande Baile Real');
    puzzleMgr.addColorBeacon(53400, 1280, 'gold', 'O Amor que Floresce no Coração: Adoção Plena');
  }

  getRegionByX(worldX) {
    for (let i = 0; i < this.regions.length; i++) {
      const reg = this.regions[i];
      if (worldX >= reg.minX && worldX < reg.maxX) {
        return { index: i, region: reg };
      }
    }
    return { index: 7, region: this.regions[7] };
  }

  getRegion(index) {
    return this.regions[Math.max(0, Math.min(this.regions.length - 1, index))];
  }

  getCurrentChapter() {
    return this.regions[this.currentRegionIndex];
  }
}

window.LevelDesignManager = LevelDesignManager;
