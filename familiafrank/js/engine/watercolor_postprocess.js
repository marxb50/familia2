/**
 * ==============================================================================
 * WATERCOLOR POST-PROCESSING SHADER SYSTEM (Estilo Gris & cinight)
 * Inspirado no repositório: cinight/Minimalist-Flat-Stylized-WaterColor-Post-Processing
 *
 * Características principais:
 * 1. Simulação de Papel Prensado a Frio (Cold-Pressed 300g/m² Cotton Paper)
 * 2. Vazamento e Sangramento de Tinta Orgânico (Wet-on-Wet Diffusion & Bleed)
 * 3. Escurecimento de Bordas / Concentração de Pigmento (Sobel Coffee-Ring Effect)
 * 4. Granulação Mineral Sutil (Sedimentação de Pigmentos Naturais)
 * 5. Reação Dinâmica às Cores e Ondas de Despertar (Color Awakening Blooms)
 * ==============================================================================
 */

class WatercolorPostProcessor {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;

    // Configurações do Shader de Aquarela
    this.enabled = true;
    this.bleedStrength = 2.8;       // Intensidade da difusão de tinta nas bordas
    this.edgeDarken = 0.60;          // Escurecimento da borda (acúmulo de pigmento)
    this.edgeSensitivity = 1.7;      // Sensibilidade do detector de bordas Sobel
    this.paperIntensity = 0.32;      // Profundidade do relevo das fibras do papel
    this.granulation = 0.10;         // Granulação mineral (stippling de pigmento)
    this.wetDiffusion = 0.28;        // Difusão úmido-sobre-úmido (wet-on-wet)
    this.bloomIntensity = 0.0;       // Reação a ondas de choque de cor

    this.gl = null;
    this.program = null;
    this.quadBuffer = null;

    // Texturas WebGL
    this.sceneTexture = null;
    this.paperTexture = null;
    this.noiseTexture = null;

    // Uniform Locations Cache
    this.uniforms = {};

    this.isSupported = false;
    this.initWebGL();

    if (this.isSupported) {
      console.log('🎨 [Watercolor Shader] Inicializado com sucesso! Simulação de aquarela ativa.');
    } else {
      console.warn('⚠️ [Watercolor Shader] WebGL não disponível. Operando em modo de compatibilidade 2D.');
    }
  }

  initWebGL() {
    try {
      const gl = this.canvas.getContext('webgl', {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: true,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance'
      }) || this.canvas.getContext('experimental-webgl');

      if (!gl) {
        this.isSupported = false;
        return;
      }

      this.gl = gl;

      // 1. Compilar Shaders
      const vsSource = `
        attribute vec2 a_position;
        varying vec2 v_uv;

        void main() {
          // Mapeia coordenadas [-1, 1] para [0, 1]
          v_uv = (a_position + 1.0) * 0.5;
          // Inverter Y para sincronizar orientação de textura 2D do Canvas
          v_uv.y = 1.0 - v_uv.y;
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `;

      const fsSource = `
        precision mediump float;

        varying vec2 v_uv;

        uniform sampler2D u_sceneTexture;
        uniform sampler2D u_paperTexture;
        uniform sampler2D u_noiseTexture;

        uniform vec2 u_resolution;
        uniform float u_time;
        uniform float u_enabled;
        uniform float u_bleedStrength;
        uniform float u_edgeDarken;
        uniform float u_edgeSensitivity;
        uniform float u_paperIntensity;
        uniform float u_granulation;
        uniform float u_wetDiffusion;
        uniform float u_bloomIntensity;

        // Cálculo de Luminância perceptiva
        float getLuminance(vec3 color) {
          return dot(color, vec3(0.299, 0.587, 0.114));
        }

        void main() {
          vec2 texel = 1.0 / u_resolution;

          // Se o shader estiver desativado pelo jogador, passa a imagem crua sem alteração
          if (u_enabled < 0.5) {
            gl_FragColor = texture2D(u_sceneTexture, v_uv);
            return;
          }

          // 1. PAPEL E VAZAMENTO DE TINTA (Cold-pressed tooth & flow noise)
          vec2 paperUV = v_uv * (u_resolution / 512.0);
          vec4 paperSample = texture2D(u_paperTexture, paperUV);
          float paperHeight = dot(paperSample.rgb, vec3(0.333));

          // Vetor de fluxo orgânico baseado em ruído contínuo
          vec2 flowUV = v_uv * 2.8 + vec2(sin(u_time * 0.035) * 0.02, cos(u_time * 0.028) * 0.02);
          vec4 noiseSample = texture2D(u_noiseTexture, flowUV);
          vec2 flowOffset = (noiseSample.rg - 0.5) * 2.0;

          // Difusão capilar ao longo das fibras do papel
          vec2 bleedOffset = (flowOffset * 0.6 + (paperSample.rg - 0.5) * 0.5) * u_bleedStrength * texel * (1.0 + u_bloomIntensity * 1.5);
          vec2 perturbedUV = clamp(v_uv + bleedOffset, 0.001, 0.999);

          // 2. DIFUSÃO ÚMIDO-SOBRE-ÚMIDO (Wet-on-wet paint bleed)
          vec4 centerColor = texture2D(u_sceneTexture, perturbedUV);

          // Amostragem em cruz nas fibras de papel
          vec4 tapN = texture2D(u_sceneTexture, clamp(perturbedUV + vec2(0.0, texel.y * 1.5), 0.001, 0.999));
          vec4 tapS = texture2D(u_sceneTexture, clamp(perturbedUV - vec2(0.0, texel.y * 1.5), 0.001, 0.999));
          vec4 tapE = texture2D(u_sceneTexture, clamp(perturbedUV + vec2(texel.x * 1.5, 0.0), 0.001, 0.999));
          vec4 tapW = texture2D(u_sceneTexture, clamp(perturbedUV - vec2(texel.x * 1.5, 0.0), 0.001, 0.999));

          vec4 diffuseColor = (centerColor * 2.0 + tapN + tapS + tapE + tapW) / 6.0;
          vec4 wetColor = mix(centerColor, diffuseColor, u_wetDiffusion);

          // 3. DETECTOR DE BORDAS SOBEL 3x3 (Pigment Edge Darkening / Anel de Café de Aquarela)
          float s00 = getLuminance(texture2D(u_sceneTexture, clamp(v_uv + vec2(-texel.x, -texel.y) * 1.4, 0.001, 0.999)).rgb);
          float s01 = getLuminance(texture2D(u_sceneTexture, clamp(v_uv + vec2(0.0, -texel.y) * 1.4, 0.001, 0.999)).rgb);
          float s02 = getLuminance(texture2D(u_sceneTexture, clamp(v_uv + vec2(texel.x, -texel.y) * 1.4, 0.001, 0.999)).rgb);

          float s10 = getLuminance(texture2D(u_sceneTexture, clamp(v_uv + vec2(-texel.x, 0.0) * 1.4, 0.001, 0.999)).rgb);
          float s12 = getLuminance(texture2D(u_sceneTexture, clamp(v_uv + vec2(texel.x, 0.0) * 1.4, 0.001, 0.999)).rgb);

          float s20 = getLuminance(texture2D(u_sceneTexture, clamp(v_uv + vec2(-texel.x, texel.y) * 1.4, 0.001, 0.999)).rgb);
          float s21 = getLuminance(texture2D(u_sceneTexture, clamp(v_uv + vec2(0.0, texel.y) * 1.4, 0.001, 0.999)).rgb);
          float s22 = getLuminance(texture2D(u_sceneTexture, clamp(v_uv + vec2(texel.x, texel.y) * 1.4, 0.001, 0.999)).rgb);

          float sobelX = (-s00 + s02) + (-2.0 * s10 + 2.0 * s12) + (-s20 + s22);
          float sobelY = (-s00 - 2.0 * s01 - s02) + (s20 + 2.0 * s21 + s22);
          float edgeMag = length(vec2(sobelX, sobelY));

          // Fator de borda modulado pela densidade do papel
          float edgeFactor = clamp(edgeMag * u_edgeSensitivity * (0.85 + paperHeight * 0.3), 0.0, 1.0);
          edgeFactor = pow(edgeFactor, 1.35);

          // Escurecer o pigmento ao longo do contorno (concentração da secagem de aquarela)
          vec3 darkenedPigment = wetColor.rgb * (1.0 - edgeFactor * u_edgeDarken);

          // 4. ABSORÇÃO DO PAPEL PRENSADO A FRIO (Paper Tooth)
          float lum = getLuminance(darkenedPigment);
          vec3 paperTinted = darkenedPigment * mix(vec3(1.0), paperSample.rgb * 1.08, u_paperIntensity * (1.0 - lum * 0.35));

          // 5. GRANULAÇÃO MINERAL (Stippling orgânico)
          float grainNoise = noiseSample.b;
          float granFactor = (grainNoise - 0.5) * 1.5 * u_granulation * (1.0 - lum);
          vec3 finalColor = clamp(paperTinted + granFactor, 0.0, 1.0);

          // 6. VINHETA SUAVE DE PAPEL ARTÍSTICO
          vec2 vignetteCoord = (v_uv - 0.5) * 2.0;
          float vignette = 1.0 - dot(vignetteCoord, vignetteCoord) * 0.06;
          finalColor *= clamp(vignette, 0.92, 1.0);

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `;

      this.program = this.createProgram(gl, vsSource, fsSource);
      if (!this.program) {
        this.isSupported = false;
        return;
      }

      // 2. Criar Geometria Fullscreen Quad
      this.quadBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
      const vertices = new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0
      ]);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      // 3. Cache de Uniforms
      gl.useProgram(this.program);
      const uniformNames = [
        'u_sceneTexture', 'u_paperTexture', 'u_noiseTexture',
        'u_resolution', 'u_time', 'u_enabled',
        'u_bleedStrength', 'u_edgeDarken', 'u_edgeSensitivity',
        'u_paperIntensity', 'u_granulation', 'u_wetDiffusion', 'u_bloomIntensity'
      ];
      for (const name of uniformNames) {
        this.uniforms[name] = gl.getUniformLocation(this.program, name);
      }

      // 4. Criar Textura da Cena (1920x1080 - NPOT -> CLAMP_TO_EDGE)
      this.sceneTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.sceneTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      // 5. Criar Texturas de Papel e Ruído (Potência de 2: 512x512 e 256x256 -> gl.REPEAT)
      this.paperTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.paperTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      this.generateDefaultPaperTexture();

      this.noiseTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      this.generateNoiseTexture();

      // Carregar Textura de Papel Real
      this.loadPaperTexture('assets/images/paper_texture.png');

      this.isSupported = true;
    } catch (err) {
      console.error('Falha ao inicializar WebGL Watercolor Shader:', err);
      this.isSupported = false;
    }
  }

  createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Erro de compilação de shader:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  createProgram(gl, vsSource, fsSource) {
    const vs = this.createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = this.createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return null;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Erro de link do programa WebGL:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    return program;
  }

  // Gera textura procedural imediata de papel 512x512 para o shader nunca ficar em branco
  generateDefaultPaperTexture() {
    if (!this.gl) return;
    const size = 512;
    const data = new Uint8Array(size * size * 4);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;

        // Fibras de algodão prensado a frio
        const n1 = Math.sin(x * 0.12) * Math.cos(y * 0.14) * 12;
        const n2 = Math.sin(x * 0.35 + y * 0.28) * 8;
        const grain = (Math.random() - 0.5) * 18;

        const baseVal = Math.min(255, Math.max(0, 238 + n1 + n2 + grain));

        data[i]     = baseVal;       // R: relevo / dente
        data[i + 1] = baseVal - 3;   // G
        data[i + 2] = baseVal - 8;   // B (tom quente de papel algodão)
        data[i + 3] = 255;
      }
    }

    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.paperTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  }

  loadPaperTexture(url) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!this.gl) return;
      const gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, this.paperTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      console.log('📄 [Watercolor Shader] Textura de papel de algodão 512x512 vinculada com sucesso.');
    };
    img.src = url;
  }

  // Gera mapa de ruído multi-oitava (256x256 RGBA) diretamente na memória
  generateNoiseTexture() {
    if (!this.gl) return;
    const size = 256;
    const data = new Uint8Array(size * size * 4);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;

        // Ruído orgânico multi-frequência (R e G = vetores de fluxo, B = grão mineral)
        const nx = x / size * 8;
        const ny = y / size * 8;

        const valR = Math.sin(nx * 1.5) * Math.cos(ny * 1.5) * 0.5 + 0.5;
        const valG = Math.sin(nx * 2.3 + 1.2) * Math.cos(ny * 2.1 + 0.7) * 0.5 + 0.5;
        const grain = (Math.random() * 0.6 + Math.sin(x * 12.3 + y * 7.4) * 0.2 + 0.2);

        data[i] = Math.floor(valR * 255);
        data[i + 1] = Math.floor(valG * 255);
        data[i + 2] = Math.floor(Math.min(1, Math.max(0, grain)) * 255);
        data[i + 3] = 255;
      }
    }

    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  }

  toggle() {
    this.enabled = !this.enabled;
    console.log(`🎨 [Watercolor Shader] ${this.enabled ? 'ATIVADO' : 'DESATIVADO'}`);
    return this.enabled;
  }

  render(sceneCanvas, timestamp, bloomIntensity = 0.0) {
    if (!this.isSupported || !this.gl || !this.program) {
      return false; // Fallback para renderização direta
    }

    const gl = this.gl;
    const time = timestamp * 0.001;

    gl.viewport(0, 0, this.width, this.height);
    gl.useProgram(this.program);

    // 1. Atualizar Textura da Cena do Canvas 2D
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sceneTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sceneCanvas);
    gl.uniform1i(this.uniforms.u_sceneTexture, 0);

    // 2. Vincular Textura de Papel
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.paperTexture);
    gl.uniform1i(this.uniforms.u_paperTexture, 1);

    // 3. Vincular Textura de Ruído Orgânico
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
    gl.uniform1i(this.uniforms.u_noiseTexture, 2);

    // 4. Passar Uniforms de Simulação
    gl.uniform2f(this.uniforms.u_resolution, this.width, this.height);
    gl.uniform1f(this.uniforms.u_time, time);
    gl.uniform1f(this.uniforms.u_enabled, this.enabled ? 1.0 : 0.0);
    gl.uniform1f(this.uniforms.u_bleedStrength, this.bleedStrength);
    gl.uniform1f(this.uniforms.u_edgeDarken, this.edgeDarken);
    gl.uniform1f(this.uniforms.u_edgeSensitivity, this.edgeSensitivity);
    gl.uniform1f(this.uniforms.u_paperIntensity, this.paperIntensity);
    gl.uniform1f(this.uniforms.u_granulation, this.granulation);
    gl.uniform1f(this.uniforms.u_wetDiffusion, this.wetDiffusion);
    gl.uniform1f(this.uniforms.u_bloomIntensity, bloomIntensity);

    // 5. Configurar Vértices e Renderizar Quad
    const aPos = gl.getAttribLocation(this.program, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    return true;
  }
}

window.WatercolorPostProcessor = WatercolorPostProcessor;
