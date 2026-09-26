# Verificação da edição artística

Sirva a raiz do repositório com `python3 -m http.server 8766` e abra
`http://localhost:8766/tests/art-regression.html`.

O botão de regressão executa 45 verificações no motor real do navegador:
movimento, salto, pouso e cores dos oito atos; acompanhamento dos cinco membros
da família; pausa; quatro pincéis e restauração gradual de cor; sete transições;
encerramento e imobilidade após a conclusão. Os testes posicionam o personagem
para testar cada condição; não representam uma partida integral feita por uma pessoa.

A galeria renderiza os oito atos para inspeção visual. O iframe de 844 × 390
também permite conferir a interface portátil e os botões de toque.

Validação em 26/09/2026: 45 verificações passaram no Chrome local, sem erros de
JavaScript. Menu, pausa, paisagens dos oito atos e layout horizontal pequeno
inspecionados. Física, coordenadas de plataformas e requisitos de coleta foram
preservados. A pasta `teste` original não foi alterada nesta edição.
