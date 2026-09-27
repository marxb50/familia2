/**
 * ==============================================================================
 * GENERATIVE AMBIENT AUDIO ENGINE (Estilo Gris: Piano, Cordas & Vento)
 * Utiliza Web Audio API com Efeitos Dinâmicos e Reverb Sintético
 * ==============================================================================
 */
class GrisAudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.isInitialized = false;

    // Nós de Áudio Principais
    this.masterGain = null;
    this.reverbNode = null;
    this.ambientGain = null;

    // Camadas de Ambiente Procedural
    this.windSource = null;
    this.ambientInterval = null;
    this.currentNarrator = null;

    // Escalas Musicais Contemplativas (Acordes Lídios e Menores Poéticos)
    // Frequências em Hz (A4 = 440)
    this.scales = {
      // Capítulo 1: Vazio e Melancolia (Lá menor com 9ª aberta)
      gray: [220.00, 261.63, 329.63, 392.00, 493.88, 523.25, 659.25],
      // Capítulo 2: Carmim / Coragem (Ré menor forte e heróico)
      red: [146.83, 220.00, 293.66, 349.23, 440.00, 523.25, 587.33],
      // Capítulo 3: Azul / Imaginação (Fá Maior 7M / Céu fluido)
      blue: [174.61, 261.63, 329.63, 392.00, 440.00, 523.25, 659.25, 783.99],
      // Capítulo 4: Verde & Rosa / Natureza e Ternura
      green: [196.00, 246.94, 293.66, 370.00, 440.00, 587.33, 659.25],
      pink: [220.00, 277.18, 329.63, 440.00, 554.37, 659.25, 880.00],
      // Capítulo 5: Plenitude / Harmonia Dourada (Dó Lídio Ascendente)
      gold: [261.63, 329.63, 392.00, 493.88, 523.25, 659.25, 783.99, 1046.50]
    };

    this.currentScale = this.scales.gray;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Criar Reverb Sintético (Impulso Convolucional Estilo Catedral)
      this.createCathedralReverb();

      // Iniciar Ambientes
      this.startWindAtmosphere();
      this.startGenerativePiano();

      this.isInitialized = true;
      console.log('🎵 Gris Audio Engine inicializado com sucesso!');
    } catch (e) {
      console.warn('Web Audio initialization error:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Criar Reverb de Longa Duração para Estética Etérea
  createCathedralReverb() {
    if (!this.ctx) return;
    const rate = this.ctx.sampleRate;
    const length = rate * 3.2; // 3.2 segundos de cauda de reverb
    const decay = 2.4;
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = (length - i) / length;
      const t = Math.pow(n, decay);
      left[i] = (Math.random() * 2 - 1) * t;
      right[i] = (Math.random() * 2 - 1) * t;
    }

    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = impulse;

    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.setValueAtTime(0.42, this.ctx.currentTime);

    this.reverbNode.connect(this.reverbGain);
    this.reverbGain.connect(this.masterGain);
  }

  // Atmosfera de Vento Suave (Ruído Branco Filtrado em Filtro Passa-Faixa Dinâmico)
  startWindAtmosphere() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filtro Passa-Faixa Suave (Simula brisa passando por arcos de ruínas)
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(320, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(1.8, this.ctx.currentTime);

    // Oscilação lenta da frequência do vento
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime); // Ciclo de 12 segundos
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(120, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(bandpass.frequency);
    lfo.start();

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    whiteNoise.connect(bandpass);
    bandpass.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    whiteNoise.start();
  }

  // Gerador Procedural de Piano Contemplativo
  startGenerativePiano() {
    if (this.ambientInterval) clearInterval(this.ambientInterval);

    this.ambientInterval = setInterval(() => {
      if (this.muted || !this.ctx || Math.random() > 0.65) return;
      this.playContemplativeNote();
    }, 2800);
  }

  // Tocar uma nota solta de piano com envelope delicado
  playContemplativeNote(freq = null, gainMult = 1.0) {
    if (!this.ctx || this.muted) return;
    this.resume();

    const noteFreq = freq || this.currentScale[Math.floor(Math.random() * this.currentScale.length)];
    const now = this.ctx.currentTime;

    // Oscilador Principal (Onda Triangular harmônica)
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(noteFreq, now);

    // Sub-Harmônico Senoidal para calor e profundidade
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(noteFreq * 0.5, now);

    // Envelope de Ganho (Ataque ultra suave, sustentação mágica e cauda longa)
    const noteGain = this.ctx.createGain();
    const peakGain = 0.09 * gainMult;
    noteGain.gain.setValueAtTime(0.0001, now);
    noteGain.gain.linearRampToValueAtTime(peakGain, now + 0.08);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

    osc.connect(noteGain);
    subOsc.connect(noteGain);

    // Conectar ao Master e ao Reverb de Catedral
    noteGain.connect(this.masterGain);
    if (this.reverbNode) {
      noteGain.connect(this.reverbNode);
    }

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + 4.0);
    subOsc.stop(now + 4.0);
  }

  // Mudar escala musical conforme o capítulo desperta
  setChapterTheme(colorKey) {
    if (this.scales[colorKey]) {
      this.currentScale = this.scales[colorKey];
      // Tocar acorde orquestral de transição de cor
      this.playColorAwakeningChord(colorKey);
    }
  }

  // Acorde monumental de despertar de cor
  playColorAwakeningChord(colorKey) {
    if (!this.ctx || this.muted) return;
    this.resume();

    const chordFreqs = this.scales[colorKey] || this.scales.gold;
    chordFreqs.slice(0, 5).forEach((f, idx) => {
      setTimeout(() => {
        this.playContemplativeNote(f, 1.4);
      }, idx * 180);
    });
  }

  // Efeito Sonoro: Heavy Slam (Impacto profundo de rocha)
  playHeavySlamSound() {
    if (!this.ctx || this.muted) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.45);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  // Efeito Sonoro: Salto e Gliding (Sopro de seda)
  playGlideSound() {
    if (!this.ctx || this.muted) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.35);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain);
    if (this.reverbNode) gain.connect(this.reverbNode);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  // Efeito Sonoro: Pulo na Parede (Wall Jump poético e ágil)
  playWallJumpSound() {
    if (!this.ctx || this.muted) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(740, now + 0.12);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);
    if (this.reverbNode) gain.connect(this.reverbNode);

    osc.start(now);
    osc.stop(now + 0.38);
  }

  // Efeito Sonoro: Cogumelo Elástico / Impulso Bouce
  playBounceSound() {
    if (!this.ctx || this.muted) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(820, now + 0.22);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.masterGain);
    if (this.reverbNode) gain.connect(this.reverbNode);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  // Efeito Sonoro: Estrela de Memória Coletada (Sinos de Cristal)
  playMemoryStarSound(pitchFactor = 1.0) {
    if (!this.ctx || this.muted) return;
    this.resume();
    const now = this.ctx.currentTime;

    const baseFreq = 880 * pitchFactor;
    [baseFreq, baseFreq * 1.25, baseFreq * 1.5].forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.04);

      gain.gain.setValueAtTime(0.12, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.85);

      osc.connect(gain);
      gain.connect(this.masterGain);
      if (this.reverbNode) gain.connect(this.reverbNode);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.9);
    });
  }

  // Efeito Sonoro: Flor Desabrochando / Canto de Maria Rosa
  playFloralBloomSound() {
    if (!this.ctx || this.muted) return;
    this.resume();
    const now = this.ctx.currentTime;

    const freqs = [440, 554.37, 659.25, 880, 1108.73];
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.07);

      gain.gain.setValueAtTime(0.1, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 1.2);

      osc.connect(gain);
      gain.connect(this.masterGain);
      if (this.reverbNode) gain.connect(this.reverbNode);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 1.3);
    });
  }

  // Tocar Narração do Livro (Voz de Thalita Neural - Estritamente Single-Stream)
  playNarration(audioSrc, onEnd) {
    this.stopNarration();
    try {
      const audio = new Audio(audioSrc);
      audio.volume = this.muted ? 0 : 0.95;
      this.currentNarrator = audio;
      audio.onended = () => {
        this.currentNarrator = null;
        if (onEnd) onEnd();
      };
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => console.log('Audio autoplay prevented:', e));
      }
    } catch (e) {
      console.warn('Audio play exception:', e);
    }
  }

  stopNarration() {
    if (this.currentNarrator) {
      try {
        this.currentNarrator.onended = null;
        this.currentNarrator.pause();
        this.currentNarrator.currentTime = 0;
        this.currentNarrator.src = '';
      } catch (_) {}
      this.currentNarrator = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.7, this.ctx.currentTime);
    }
    if (this.currentNarrator) {
      this.currentNarrator.volume = this.muted ? 0 : 0.95;
    }
    return this.muted;
  }
}

window.GrisAudioEngine = GrisAudioEngine;
