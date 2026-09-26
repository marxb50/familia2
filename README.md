# 👑 O Castelo que Nasce do Coração — O Jogo Oficial

> *"E assim descobriram que uma verdadeira família nasce do AMOR, nasce do cuidado e do afeto... que o ABRAÇO vai ser sempre uma porta aberta para a felicidade, que filhos não precisam nascer só da barriga e que também podem nascer no coração. Esse é o poder da adoção!"*

Jogo interativo 2D de plataforma e narrativa infantil, inspirado no conto de fadas sobre adoção, família e superação no reino encantado de Franklândia.

---

## 🎮 Como Jogar

O jogo está disponível diretamente no navegador com suporte multiplataforma:
- **🌐 Portal Oficial & Seletor de Fases**: `https://marxb50.github.io/familia2/`
- **📱 Edição Celular (Touch)**: `https://marxb50.github.io/familia2/celular/`
- **💻 Edição Computador (Teclado)**: `https://marxb50.github.io/familia2/PC/`
- **✨ Novo modo artístico**: `https://marxb50.github.io/familia2/gpttestenovo/`

### 🌈 Franklândia — Caminho das Cores (`gpttestenovo/`)
Uma jornada paralela criada com os personagens separados do vídeo enviado. A câmera 16:9, os blocos flutuantes próximos e o modo AUTO recebem acabamento inspirado em PS Vita/PS2. O fundo muda por atos conforme a dinâmica cromática do livro: castelo sem cores, esperança, Matheus, Pedro, crescimento da família, Maria Rosa e a celebração final.

Créditos: livro **O Castelo que Nasce do Coração / Franklândia**, PDF fornecido no projeto; personagens separados do vídeo `gemini_generated_video_280c85a8.mp4`.

---

## ✨ Funcionalidades Principais

### 📱 1. Edição Mobile Dedicada (`celular/`)
Inspirada na arquitetura e ergonomia de [`marxb50/jogo-cajulim`](https://marxb50.github.io/jogo-cajulim/):
- **Controles Touch Virtuais Táteis**:
  - **Polegar Esquerdo**: Botões direcionais `◀` e `▶` com iluminação ativa e feedback de toque.
  - **Polegar Direito**: Botão principal `⬆ PULAR` (destaque dourado) e botão `⇄ TROCAR` (alterna controle entre o Rei e a Rainha).
  - Suporte **Multi-Touch** total com Pointer Events independentes (segurar direção e saltar simultaneamente).
- **Barra Superior Flutuante**:
  - `🏠 Menu`: Retorna ao portal e ao seletor de fases.
  - `🎮 PS1`: Ativa/desativa o Modo Retrô 32-bit PS1 com scanlines e saturação de época.
  - `🔊 Som`: Ligar ou desligar áudio e efeitos sonoros.
  - `⛶ Tela Cheia`: Expansão imersiva total.
- **Auto-Fullscreen**: Ativa automaticamente o modo tela cheia ao girar o aparelho para paisagem (Landscape).
- **Proteção Touch**: Bloqueio de pinça/zoom acidental (`gesturestart`) e rolagem da página (`touchmove`).

### 💻 2. Edição Computador (`PC/`)
- Gabinete arcade 16:9 em alta definição (1280x720).
- Controles por Teclado:
  - `←` `→` ou `A` `D`: Mover
  - `Espaço` ou `W` / `↑`: Pular
  - `C`: Alternar líder (Rei / Rainha)
  - `P`: Alternar Modo Retrô PS1
  - `M`: Ligar/Desligar Som
  - `F`: Tela Cheia
  - `R`: Reiniciar Fase

### 🗺️ 3. Portal Oficial com 8 Capítulos Interativos (`index.html`)
- **Fase 1**: 🏰 *O Castelo Sem Cores* — O Rei e a Rainha iniciam sua jornada no reino cinzento.
- **Fase 2**: 🌿 *A Floresta da Esperança* — O encontro mágico com o Sábio Mago e a semente verde.
- **Fase 3**: 🎨 *O Pincel Encantado de Matheus* — Matheus coleta pincéis e devolve as cores vivas ao castelo!
- **Fase 4**: 🌊 *O Encontro das Almas* — O laço profundo de união e confiança entre os irmãos.
- **Fase 5**: 🐎 *O Galope da Coragem com Pedro* — Pedro galopa em seu nobre cavalo branco pelas pradarias.
- **Fase 6**: 💖 *O Laço da Proteção* — A chegada da pequena princesa Maria Rosa e a ternura familiar.
- **Fase 7**: 🌸 *O Baile Real de Maria Rosa* — Dança mágica no salão imperial entre pétalas de rosa e notas musicais.
- **Fase 8**: 👑 *A Grande Celebração do Amor* — A apoteose com o Rei, a Rainha e os três filhos caminhando juntos e animados sob as luzes reais.

---

## 🎙️ Áudios e Locuções
- Locução completa em voz neural suave para cada um dos capítulos do livro.
- Trilha sonora orquestral mágica de conto de fadas e efeitos sonoros de sintetizador Web Audio.

---

## 🚀 Publicação no GitHub Pages
1. O repositório desta versão é `familia2`: `https://github.com/marxb50/familia2`
2. Envie os arquivos da branch `main`:
   ```bash
   git push -u origin main
   ```
3. No GitHub, acesse **Settings > Pages** e selecione o branch `main` (pasta `/ (root)`).
4. O jogo estará disponível globalmente em:
   **`https://marxb50.github.io/familia2`**
