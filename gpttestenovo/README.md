# Franklândia — Caminho das Cores

Nova versão jogável criada a partir dos personagens extraídos do vídeo. O jogo usa um canvas 16:9, câmera horizontal suave, corrida automática opcional, modo manual, cinco personagens, 12 memórias e uma sequência de blocos flutuantes com vãos curtos.

A travessia acompanha a dinâmica cromática do livro **O Castelo que Nasce do Coração / Franklândia**: começa no castelo sem cores e passa por esperança, Matheus, Pedro, o crescimento da família, Maria Rosa e a celebração final. As oito cenas de fundo foram preservadas em `assets/backgrounds/book/` e entram em transições suaves durante a corrida.

Créditos: personagens extraídos e separados do vídeo `gemini_generated_video_280c85a8.mp4`; cenas e referências visuais baseadas no PDF `livro frank (com creditos).pdf`, fornecido pelo autor do projeto.

## Como abrir

No terminal, dentro desta pasta:

```bash
python3 -m http.server 8090
```

Depois abra `http://localhost:8090/`.

## Controles

- `A/D` ou `←/→`: mover
- `Espaço`, `W` ou `↑`: pular
- `C` ou `Tab`: trocar personagem
- `R`: reiniciar a jornada
- `AUTO ON/OFF`: corrida e câmera automáticas ou controle manual

## Auditoria aplicada

- O fundo é uma única composição 16:9, escalada para preencher a viewport; não é repetido em ladrilhos.
- As camadas de névoa, nuvens e partículas se movem separadamente para dar profundidade sem cortar a imagem.
- Os blocos foram aproximados, com blocos auxiliares e plataformas de segurança para a progressão automática.
- Os frames dos cinco personagens estão em PNG com transparência, separados por `idle` e `walk`.
- As oito cenas do livro foram auditadas e associadas a atos de cor para que a jornada revele a história gradualmente.
- A interface recebeu HUD compacto, vinheta, scanlines discretas, brilho e acabamento de aventura de console portátil/PS2.
