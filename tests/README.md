# Verificação da edição artística

Sirva a raiz do repositório com `python3 -m http.server 8766` e abra
`http://localhost:8766/tests/art-regression.html`.

O botão de regressão executa 65 verificações no motor real do navegador:
movimento, salto, pouso e cores dos oito atos; acompanhamento dos cinco membros
da família; pausa; quatro pincéis e restauração gradual de cor; sete transições;
velocidade 30% maior nos sete tipos; salto com tempo 20% mais rápido e altura
preservada; percurso inferior inteiro e subida pelas dez plataformas superiores
do ato VIII; chegada física a cada arco, travessia dos cinco personagens, dois
encerramentos distintos e imobilidade após a conclusão. Parte dos testes
posiciona o personagem para isolar condições; os percursos do ato VIII usam as
entradas e a física reais. Não representam uma partida integral de oito atos
feita por uma pessoa.

A galeria renderiza os oito atos para inspeção visual. O iframe de 844 × 390
também permite conferir a interface portátil e os botões de toque.

Validação em 26/09/2026: 65 verificações passaram no Chrome local. Sem erros de
JavaScript do jogo (uma extensão MetaMask do navegador registrou falha própria).
Menu, pausa, paisagens dos oito atos e layout horizontal pequeno inspecionados.
Nesta revisão, a locomoção e o ritmo dos saltos foram acelerados e o bloco
vertical final foi convertido em terraço atravessável por baixo. As demais
plataformas, tamanhos dos personagens, requisitos de coleta e ordem das cores
foram preservados. A pasta `teste` original não foi alterada.
