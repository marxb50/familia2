# Franklândia — Caminho das Cores

Esta pasta agora usa a edição completa do jogo, restaurada a partir da versão que estava em `teste`. Ela tem oito atos, mundo contínuo, câmera cinematográfica, física com inércia, pulo duplo, pulo na parede, planagem, heavy slam, água e vento, personagens do livro, NPCs, puzzles, estrelas, partículas, narração e tela de vitória.

A jornada acompanha a dinâmica cromática de **O Castelo que Nasce do Coração / Franklândia**: começa no castelo sem cores e evolui até a celebração final. Os cenários e sprites completos estão em `assets/images/`, enquanto os frames separados do vídeo continuam preservados em `assets/characters/` e na pasta irmã `gpt fotos`.

Créditos: personagens extraídos e separados do vídeo `gemini_generated_video_280c85a8.mp4`; cenas, personagens e referências visuais baseadas no PDF `livro frank (com creditos).pdf`, fornecido pelo autor do projeto.

## Como abrir

No terminal, dentro desta pasta:

```bash
python3 -m http.server 8090
```

Depois abra `http://localhost:8090/`.

## Controles

- `A/D` ou `←/→`: mover
- `Espaço`, `W` ou `↑`: pular
- `R`: reiniciar a jornada
- `J`: pintar pontes com Matheus
- `K`: cantar para flores com Maria Rosa
- `C` ou `Tab`: trocar personagem
- `AUTO ON/OFF`: corrida e câmera automáticas ou controle manual

## Auditoria aplicada

- A versão reduzida foi substituída pelo motor completo de `teste`, mantendo os arquivos extraídos do vídeo.
- O mundo usa os oito atos e os cenários ilustrados do livro, com transições de cor e câmera com look-ahead.
- Os fundos agora são painéis panorâmicos com escala uniforme e cross-fade; não há repetição lateral nem alteração no tamanho dos personagens.
- O percurso conserva plataformas, NPCs, desafios e colecionáveis da edição completa.
- A interface mantém o acabamento contemplativo inspirado em GRIS, portátil e PS2, agora sem sacrificar conteúdo jogável.
