/* Franklândia — Caminho das Cores
   Pequeno motor 2D sem dependências externas: câmera suave, corrida automática opcional,
   plataformas próximas, parallax e sprites extraídos do vídeo enviado. */

const W = 1280;
const H = 720;
const FLOOR_Y = 602;
const WORLD_W = 12800;
const FRAME_COUNT = 8;

const ROLES = [
  { id: 'princesa_rosa', name: 'Princesa Rosa', color: '#ff83b6', tip: 'planar e atravessar jardins' },
  { id: 'princesa_amarela', name: 'Princesa Amarela', color: '#ffd66b', tip: 'manter o ritmo da jornada' },
  { id: 'menino_azul', name: 'Menino Azul', color: '#63c7ff', tip: 'salto veloz entre ruínas' },
  { id: 'menino_vermelho', name: 'Menino Vermelho', color: '#ff6b65', tip: 'coragem para os vãos maiores' },
  { id: 'rei', name: 'Rei', color: '#79ddff', tip: 'liderar a travessia real' }
];

// A progressão cromática segue a dramaturgia visual do livro: o castelo começa
// sem cor e recebe verde, dourado, azul, vermelho, rosa e o arco-íris da família.
const ACTS = [
  { title: 'CASTELO SEM CORES', tint: 'rgba(20, 25, 42, .34)', accent: '#d7e4ff' },
  { title: 'JARDIM DA ESPERANÇA', tint: 'rgba(37, 112, 77, .12)', accent: '#86e0a7' },
  { title: 'A CHEGADA DE MATHEUS', tint: 'rgba(40, 104, 170, .12)', accent: '#72cbff' },
  { title: 'O LAÇO DA IMAGINAÇÃO', tint: 'rgba(45, 86, 168, .14)', accent: '#84b9ff' },
  { title: 'A CORAGEM DE PEDRO', tint: 'rgba(158, 43, 51, .13)', accent: '#ff8e83' },
  { title: 'A FAMÍLIA CRESCE', tint: 'rgba(226, 116, 131, .12)', accent: '#ffb2c5' },
  { title: 'O BAILE DE MARIA ROSA', tint: 'rgba(191, 93, 177, .14)', accent: '#ffb8e8' },
  { title: 'O AMOR GANHA TODAS AS CORES', tint: 'rgba(246, 177, 65, .14)', accent: '#ffe27f' }
];

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = true;

const state = {
  started: false,
  paused: false,
  auto: true,
  muted: false,
  time: 0,
  last: 0,
  roleIndex: 4,
  stars: 0,
  nextCheckpoint: 0,
  lastAct: 0,
  finished: false,
  autoJumpTimer: 0,
  autoBestX: 220,
  autoRescueTimer: 0,
  toastTimer: 0,
  cameraX: 0,
  cameraTarget: 0,
  player: { x: 220, y: FLOOR_Y - 122, w: 58, h: 122, vx: 0, vy: 0, onGround: false, dir: 1, safeX: 220 }
};

const input = { left: false, right: false, jump: false, jumpPressed: false, swapPressed: false };
const assets = { background: new Image(), bookScenes: [], sprites: {} };
let world = { platforms: [], stars: [], beacons: [] };
let audioContext = null;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadBackgroundAssets() {
  assets.background = await loadImage('assets/backgrounds/kingdom_dusk.png');
  // A primeira cena entra rápido; as demais continuam em paralelo para evitar
  // uma tela vazia enquanto as imagens grandes do livro chegam do Pages.
  assets.bookScenes[0] = await loadImage('assets/backgrounds/book/bg_level1.png');
  for (let i = 1; i < 8; i += 1) {
    loadImage(`assets/backgrounds/book/bg_level${i + 1}.png`)
      .then((image) => { assets.bookScenes[i] = image; })
      .catch((error) => console.warn(`Cena ${i + 1} indisponível`, error));
  }
}

async function loadSpriteAssets() {
  const jobs = [];
  for (const role of ROLES) {
    assets.sprites[role.id] = { idle: [], walk: [] };
    for (const animation of ['idle', 'walk']) {
      for (let i = 1; i <= FRAME_COUNT; i += 1) {
        const frameIndex = i - 1;
        jobs.push(loadImage(`assets/characters/${role.id}/${animation}/frame_${String(i).padStart(2, '0')}.png`)
          .then((image) => { assets.sprites[role.id][animation][frameIndex] = image; }));
      }
    }
  }
  await Promise.all(jobs);
}

function buildWorld() {
  const platforms = [
    { x: -500, y: FLOOR_Y, w: 1700, h: 220, kind: 'ground' },
    { x: 980, y: 540, w: 280, h: 26, kind: 'float' },
    { x: 1210, y: 485, w: 230, h: 26, kind: 'float' }
  ];
  const stars = [];
  let x = 1430;
  let index = 0;
  while (x < WORLD_W - 850) {
    const yPattern = [520, 448, 500, 405, 474, 430][index % 6];
    const width = [230, 205, 255, 220][index % 4];
    platforms.push({ x, y: yPattern, w: width, h: 26, kind: index % 3 === 0 ? 'rune' : 'float' });
    stars.push({ x: x + width * 0.5, y: yPattern - 44, taken: false, phase: index * 1.37 });

    // Bloco auxiliar próximo: os vãos são legíveis e atravessáveis no modo AUTO.
    if (index % 2 === 1) {
      platforms.push({ x: x + width + 42, y: yPattern + 64, w: 150, h: 24, kind: 'small' });
    }
    if (index % 5 === 4) {
      platforms.push({ x: x + 65, y: 565, w: 190, h: 22, kind: 'bridge' });
    }
    x += 286 + (index % 3) * 26;
    index += 1;
  }
  platforms.push({ x: WORLD_W - 1040, y: 530, w: 320, h: 26, kind: 'float' });
  platforms.push({ x: WORLD_W - 760, y: 450, w: 290, h: 26, kind: 'rune' });
  platforms.push({ x: WORLD_W - 540, y: FLOOR_Y, w: 1100, h: 220, kind: 'ground' });
  for (let i = 0; i < 12; i += 1) {
    const p = platforms[3 + i * 2] || platforms[2];
    stars.push({ x: p.x + p.w * .5, y: p.y - 45, taken: false, phase: i * .93 });
  }
  const beacons = [2200, 4850, 7600, 10400].map((x, i) => ({ x, y: 350 + (i % 2) * 70, lit: false }));
  world = { platforms, stars: stars.slice(0, 12), beacons };
}

function role() { return ROLES[state.roleIndex]; }

function actInfo() {
  const progress = Math.max(0, Math.min(.9999, state.player.x / (WORLD_W - 500)));
  const position = progress * (ACTS.length - 1);
  const index = Math.floor(position);
  return { index, blend: position - index, act: ACTS[index], progress };
}

function setToast(text) {
  const toast = document.getElementById('toast');
  toast.textContent = text;
  toast.classList.add('show');
  state.toastTimer = 2.3;
}

function ensureAudio() {
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === 'suspended') audioContext.resume();
}

function ping(note = 540, duration = .12) {
  if (state.muted) return;
  ensureAudio();
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = 'sine'; osc.frequency.value = note;
  gain.gain.setValueAtTime(.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.07, audioContext.currentTime + .015);
  gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
  osc.connect(gain).connect(audioContext.destination); osc.start(); osc.stop(audioContext.currentTime + duration + .02);
}

function updateHUD() {
  const current = role();
  const act = actInfo();
  document.getElementById('role-name').textContent = current.name;
  document.getElementById('role-tip').textContent = current.tip;
  document.getElementById('role-orb').style.borderColor = current.color;
  document.getElementById('role-orb').style.boxShadow = `0 0 18px ${current.color}66`;
  document.getElementById('star-count').textContent = String(state.stars);
  document.getElementById('chapter-label').textContent = act.act.title;
  document.getElementById('chapter-label').style.color = act.act.accent;
  document.getElementById('progress-label').textContent = `${Math.min(100, Math.floor((state.player.x / (WORLD_W - 500)) * 100))}%`;
  const button = document.getElementById('auto-button');
  button.classList.toggle('active', state.auto);
  button.innerHTML = `AUTO <b>${state.auto ? 'ON' : 'OFF'}</b>`;
}

function changeRole() {
  state.roleIndex = (state.roleIndex + 1) % ROLES.length;
  ping(700, .08);
  setToast(`${role().name} assumiu a liderança`);
  updateHUD();
}

function resetGame() {
  state.time = 0; state.stars = 0; state.nextCheckpoint = 0; state.lastAct = 0; state.finished = false; state.cameraX = 0; state.cameraTarget = 0; state.autoJumpTimer = 0; state.autoBestX = 220; state.autoRescueTimer = 0;
  state.player = { x: 220, y: FLOOR_Y - 122, w: 58, h: 122, vx: 0, vy: 0, onGround: false, dir: 1, safeX: 220 };
  world.stars.forEach(s => { s.taken = false; }); world.beacons.forEach(b => { b.lit = false; });
  updateHUD();
}

function nextPlatform() {
  const p = state.player;
  return world.platforms.filter(platform => platform.x > p.x + p.w - 12).sort((a, b) => a.x - b.x)[0];
}

function update(dt) {
  const p = state.player;
  const pad = navigator.getGamepads?.()[0];
  const padAxis = pad ? pad.axes[0] || 0 : 0;
  const left = input.left || padAxis < -.18;
  const right = input.right || padAxis > .18;
  const manualAxis = (right ? 1 : 0) - (left ? 1 : 0);
  const wantsJump = input.jumpPressed || Boolean(pad?.buttons?.[0]?.pressed);

  if (input.swapPressed) { changeRole(); input.swapPressed = false; }
  state.autoJumpTimer += dt;

  const liveAct = actInfo().index;
  if (liveAct !== state.lastAct) {
    state.lastAct = liveAct;
    ping(380 + liveAct * 55, .14);
    setToast(ACTS[liveAct].title);
  }

  let axis = manualAxis;
  if (state.auto && axis === 0) axis = 1;
  const targetSpeed = state.auto ? 165 : 310;
  p.vx += (axis * targetSpeed - p.vx) * Math.min(1, dt * 8);
  if (Math.abs(p.vx) > 10) p.dir = Math.sign(p.vx);

  const upcoming = nextPlatform();
  const autoShouldJump = state.auto && p.onGround && upcoming && upcoming.x - (p.x + p.w) < 285 && upcoming.y < p.y + p.h - 18;
  if ((wantsJump || autoShouldJump || (state.auto && p.onGround && state.autoJumpTimer > 2.4)) && p.onGround) {
    p.vy = -730; p.onGround = false; state.autoJumpTimer = 0; ping(420, .07);
  }
  input.jumpPressed = false;

  const previousBottom = p.y + p.h;
  p.vy += 1900 * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.x = Math.max(0, Math.min(WORLD_W - p.w, p.x));
  p.onGround = false;

  for (const platform of world.platforms) {
    const horizontal = p.x + p.w - 9 > platform.x && p.x + 9 < platform.x + platform.w;
    const crossing = previousBottom <= platform.y + 12 && p.y + p.h >= platform.y;
    if (horizontal && crossing && p.vy >= 0) {
      p.y = platform.y - p.h; p.vy = 0; p.onGround = true;
      if (platform.kind !== 'ground') p.safeX = p.x;
      break;
    }
  }

  if (p.y > H + 260) {
    const futurePlatforms = state.auto
      ? world.platforms.filter((platform) => platform.x > Math.max(p.x, p.safeX) + 90).sort((a, b) => a.x - b.x)
      : [];
    const rescue = futurePlatforms.find((platform) => platform.kind !== 'ground') || futurePlatforms[0];
    if (rescue) {
      // O AUTO sempre reencontra um bloco próximo, evitando um ciclo de queda
      // quando o navegador perde um frame ou a conexão carrega uma cena.
      p.x = rescue.x + Math.min(30, rescue.w - 20); p.y = rescue.y - p.h; p.vy = 0; p.vx = 0; p.onGround = true; p.safeX = rescue.x;
    } else {
      p.x = Math.max(200, p.safeX - 60); p.y = FLOOR_Y - p.h - 40; p.vy = -250; p.vx = 40;
    }
    setToast('A névoa devolveu você ao último bloco seguro');
  }
  if (p.x > state.nextCheckpoint) {
    const checkpoint = world.beacons.find(b => !b.lit && p.x > b.x - 100);
    if (checkpoint) { checkpoint.lit = true; state.nextCheckpoint = checkpoint.x; ping(760, .16); setToast('Memória do reino ativada'); }
  }
  if (state.auto) {
    if (p.x > state.autoBestX + 12) {
      state.autoBestX = p.x;
      state.autoRescueTimer = 0;
    } else {
      state.autoRescueTimer += dt;
    }
    if (state.autoRescueTimer > 3.2) {
      const futurePlatforms = world.platforms
        .filter((platform) => platform.x > Math.max(state.autoBestX, p.x) + 260)
        .sort((a, b) => a.x - b.x);
      const route = futurePlatforms.find((platform) => platform.kind !== 'ground') || futurePlatforms[0];
      if (route) {
        p.x = route.x + Math.min(30, route.w - 20); p.y = route.y - p.h; p.vy = 0; p.vx = 0; p.onGround = true; p.safeX = route.x;
        state.autoBestX = p.x; state.autoRescueTimer = 0;
        setToast('AUTO encontrou um novo bloco');
      }
    }
  }
  if (!state.finished && p.x >= WORLD_W - 620) {
    state.finished = true;
    ping(980, .28);
    setToast('A família chegou ao castelo — todas as cores estão vivas');
  }
  for (const star of world.stars) {
    if (!star.taken && Math.abs((p.x + p.w / 2) - star.x) < 44 && Math.abs((p.y + p.h / 2) - star.y) < 90) {
      star.taken = true; state.stars += 1; ping(880 + state.stars * 22, .18); setToast(`Memória encontrada • ${state.stars}/12`); updateHUD();
    }
  }

  const desired = p.x - (state.auto ? 345 : 420);
  state.cameraTarget = Math.max(0, Math.min(WORLD_W - W, desired));
  state.cameraX += (state.cameraTarget - state.cameraX) * Math.min(1, dt * (state.auto ? 3.8 : 6));
  if (state.toastTimer > 0) { state.toastTimer -= dt; if (state.toastTimer <= 0) document.getElementById('toast').classList.remove('show'); }
  updateHUD();
}

function roundedRect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

function drawBackground() {
  const c = ctx;
  c.save();
  const info = actInfo();
  const sceneA = assets.bookScenes[info.index];
  const sceneB = assets.bookScenes[Math.min(ACTS.length - 1, info.index + 1)];
  if (sceneA?.complete && sceneA.naturalWidth) {
    c.drawImage(sceneA, 0, 0, W, H);
    if (sceneB?.complete && info.blend > 0.001) { c.globalAlpha = info.blend; c.drawImage(sceneB, 0, 0, W, H); c.globalAlpha = 1; }
  } else if (assets.background.complete && assets.background.naturalWidth) c.drawImage(assets.background, 0, 0, W, H);
  else { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#302653'); g.addColorStop(1, '#0b1830'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  c.fillStyle = info.act.tint; c.fillRect(0, 0, W, H);
  const haze = c.createLinearGradient(0, 270, 0, H); haze.addColorStop(0, 'rgba(16,29,67,.03)'); haze.addColorStop(1, 'rgba(4,8,22,.58)'); c.fillStyle = haze; c.fillRect(0, 0, W, H);
  // Uma camada independente de nuvens e partículas evita a sensação de foto recortada.
  c.save(); c.translate(-state.cameraX * .055, 0); c.globalAlpha = .16; c.fillStyle = '#bfe8ff';
  for (let i = -1; i < 10; i += 1) { const x = i * 230 + Math.sin(state.time * .08 + i) * 35; const y = 108 + (i % 3) * 62; c.beginPath(); c.ellipse(x, y, 100, 18, 0, 0, Math.PI * 2); c.ellipse(x + 75, y + 7, 75, 14, 0, 0, Math.PI * 2); c.fill(); }
  c.restore();
  c.restore();
}

function drawPlatform(platform) {
  const c = ctx; const x = platform.x - state.cameraX; const y = platform.y;
  if (x + platform.w < -80 || x > W + 80) return;
  c.save();
  c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 18; c.shadowOffsetY = 13;
  roundedRect(c, x, y, platform.w, platform.h, 7); c.fillStyle = platform.kind === 'rune' ? '#35406c' : '#293451'; c.fill(); c.shadowColor = 'transparent';
  c.strokeStyle = platform.kind === 'rune' ? '#8fd9ff' : '#90a7cc'; c.lineWidth = 2; c.stroke();
  c.fillStyle = platform.kind === 'rune' ? '#d5edff' : '#b6c8de'; roundedRect(c, x + 3, y + 2, platform.w - 6, 5, 2); c.fill();
  c.fillStyle = 'rgba(10,17,36,.7)';
  for (let sx = x + 18; sx < x + platform.w - 14; sx += 34) { c.fillRect(sx, y + 12, 19, 3); c.fillRect(sx + 8, y + 18, 12, 3); }
  if (platform.kind === 'rune') { c.strokeStyle = 'rgba(121,221,255,.65)'; c.lineWidth = 1; c.beginPath(); c.arc(x + platform.w / 2, y + 14, 9, 0, Math.PI * 2); c.stroke(); }
  c.restore();
}

function drawWorld() {
  for (const platform of world.platforms) drawPlatform(platform);
  const c = ctx;
  for (const beacon of world.beacons) {
    const x = beacon.x - state.cameraX; if (x < -70 || x > W + 70) continue;
    c.save(); c.globalAlpha = beacon.lit ? .85 : .45 + Math.sin(state.time * 3 + beacon.x) * .08;
    c.strokeStyle = '#ffd66b'; c.lineWidth = 3; c.beginPath(); c.arc(x, beacon.y, 18 + Math.sin(state.time * 2) * 2, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#ffe9a3'; c.shadowColor = '#ffd66b'; c.shadowBlur = 22; c.beginPath(); c.arc(x, beacon.y, beacon.lit ? 8 : 5, 0, Math.PI * 2); c.fill(); c.restore();
  }
  for (const star of world.stars) {
    if (star.taken) continue; const x = star.x - state.cameraX; if (x < -50 || x > W + 50) continue;
    const y = star.y + Math.sin(state.time * 2.5 + star.phase) * 7; c.save(); c.translate(x, y); c.rotate(state.time * .8); c.fillStyle = '#ffe08a'; c.shadowColor = '#ffd166'; c.shadowBlur = 20; c.beginPath();
    for (let i = 0; i < 10; i += 1) { const a = -Math.PI / 2 + i * Math.PI / 5; const r = i % 2 ? 6 : 15; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.restore();
  }
}

function drawPlayer() {
  const p = state.player; const current = role(); const moving = Math.abs(p.vx) > 28 || !p.onGround; const animation = moving ? 'walk' : 'idle';
  const frames = assets.sprites[current.id]?.[animation] || []; const img = frames[Math.floor(state.time * (moving ? 12 : 6)) % Math.max(1, frames.length)];
  if (!img || !img.naturalWidth) return;
  const scale = 205 / img.height; const w = img.width * scale; const h = img.height * scale; const sx = p.x + p.w / 2 - state.cameraX;
  ctx.save(); ctx.translate(Math.round(sx), Math.round(p.y + p.h)); if (p.dir < 0) ctx.scale(-1, 1); ctx.globalAlpha = .22; ctx.fillStyle = '#02040b'; ctx.beginPath(); ctx.ellipse(0, 5, Math.max(29, w * .26), 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; ctx.drawImage(img, -w / 2, -h, w, h); ctx.restore();
}

function drawForeground() {
  const c = ctx; c.save(); c.globalAlpha = .18; c.fillStyle = '#b3d7e6';
  for (let i = 0; i < 22; i += 1) { const x = (i * 79 + state.time * (4 + i % 3) - state.cameraX * .2) % (W + 80); const y = 120 + ((i * 83) % 510); c.beginPath(); c.arc(x < -20 ? x + W + 80 : x, y, 1 + (i % 3), 0, Math.PI * 2); c.fill(); }
  c.restore();
}

function render() {
  ctx.clearRect(0, 0, W, H); drawBackground(); drawWorld(); drawPlayer(); drawForeground();
}

function loop(timestamp) {
  const dt = Math.min(.033, (timestamp - state.last) / 1000 || .016); state.last = timestamp;
  if (state.started && !state.paused) { state.time += dt; update(dt); }
  render(); requestAnimationFrame(loop);
}

function bindInput() {
  addEventListener('keydown', (event) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space', 'Tab'].includes(event.code)) event.preventDefault();
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') input.left = true;
    if (event.code === 'ArrowRight' || event.code === 'KeyD') input.right = true;
    if (event.code === 'ArrowUp' || event.code === 'KeyW' || event.code === 'Space') { if (!input.jump) input.jumpPressed = true; input.jump = true; }
    if ((event.code === 'KeyC' || event.code === 'Tab') && !event.repeat) input.swapPressed = true;
    if (event.code === 'KeyR' && !event.repeat) resetGame();
  });
  addEventListener('keyup', (event) => {
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') input.left = false;
    if (event.code === 'ArrowRight' || event.code === 'KeyD') input.right = false;
    if (event.code === 'ArrowUp' || event.code === 'KeyW' || event.code === 'Space') input.jump = false;
  });
  document.getElementById('auto-button').addEventListener('click', () => { state.auto = !state.auto; setToast(state.auto ? 'Modo AUTO: câmera e corrida suaves' : 'Modo MANUAL: você controla o percurso'); updateHUD(); });
  document.getElementById('sound-button').addEventListener('click', () => { state.muted = !state.muted; document.getElementById('sound-button').textContent = state.muted ? '×' : '♪'; if (!state.muted) ping(); });
  document.getElementById('fullscreen-button').addEventListener('click', () => { document.getElementById('game-shell').requestFullscreen?.(); });
  document.getElementById('start-button').addEventListener('click', () => { ensureAudio(); state.started = true; document.getElementById('start-screen').classList.add('hidden'); setToast('A travessia começou'); });
}

async function boot() {
  buildWorld(); bindInput(); updateHUD();
  requestAnimationFrame(loop);
  try {
    await loadBackgroundAssets();
    loadSpriteAssets().catch((error) => { setToast('Alguns sprites ainda estão carregando'); console.error(error); });
  } catch (error) {
    setToast('Algumas imagens não carregaram; recarregue a página');
    console.error(error);
  }
}

boot();
