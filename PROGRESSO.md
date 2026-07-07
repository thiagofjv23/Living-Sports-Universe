# 📋 Diário de Desenvolvimento — Living Sports Universe (LSU)

> Documento de controle do andamento do projeto. Registra **o que foi feito**,
> **quando**, e **quais decisões/regras** foram tomadas ao longo do caminho.
> Deve ser atualizado a cada novo passo concluído.
>
> Referência de regras do universo: [`LSU_DIRETRIZES.md`](./LSU_DIRETRIZES.md)
> · Pendências a revisar: [`TODO.md`](./TODO.md)

---

## ⚠️ Regras de Negócio Criadas (decisões minhas, fora do pedido original)

> Esta seção reúne, em destaque, toda regra que **não estava explícita** no
> pedido e que precisei definir para o código funcionar. Revise-as quando quiser
> — qualquer uma pode ser alterada.

| # | Regra | Onde | Motivo | Status |
|---|-------|------|--------|--------|
| R1 | **Desempate da partida:** se a `pontuacaoFinal` dos dois atletas for igual, vence quem tem maior `habilidade` base; se ainda assim empatar, o **Atleta A** vence. | `js/modulos-esportivos/moduloBasico.js` → `simularPartida()` | O pedido pedia `vencedor`/`perdedor`, mas não previa empate. Sem uma regra, esses campos ficariam indefinidos. | ✅ Ativa (aberta a revisão) |
| R2 | **Trava de cache (`?v=N`):** todos os `<script>` e o CSS em `index.html` levam um sufixo de versão. **Sempre que um desses arquivos mudar, incrementar o `N`** (versão atual: **v12**), para o navegador (inclusive no celular) baixar a versão nova em vez da cópia em cache. | `index.html` | Sem DevTools/hard-refresh (ex.: Android), o navegador servia o JS antigo e mascarava mudanças já feitas. | ✅ Ativa |

---

## 🗂️ Estrutura de Arquivos Atual

```
Living-Sports-Universe/
├── index.html                          ← ✅ Passo 4 (interface de 2 colunas)
├── LSU_DIRETRIZES.md                   ← Documento Mestre (regras do universo)
├── PROGRESSO.md                        ← este diário
├── css/
│   └── style.css                       ← ✅ Passo 4 (layout 2 colunas)
└── js/
    ├── core/                           ← NÚCLEO (agnóstico: entidades + memória)
    │   ├── fabricaRegens.js            ← ✅ Passo 1 (implementado)
    │   ├── fabricaOrganizacoes.js      ← ✅ Passo 6 (ligado ao app no Passo 8)
    │   ├── fabricaCompeticoes.js       ← ✅ Passo 9 (ligado ao app no Passo 10)
    │   ├── fabricaTemporadas.js        ← ✅ Passo 11 (só lógica, não ligado ao app)
    │   ├── ouvinteEstatisticas.js      ← ✅ Passo 14 (só lógica, não ligado ao app)
    │   ├── eventBus.js                 ← ✅ Passo 3 (implementado)
    │   ├── memoriaHistorica.js         ← ✅ Passo 3 (implementado)
    │   └── gameLoop.js                 ← ✅ Passo 3 (orquestrador/teste)
    ├── modulos-esportivos/             ← MATEMÁTICA (só cálculo → JSON)
    │   └── moduloBasico.js             ← ✅ Passo 2 (implementado)
    └── ui/                             ← TELA (CQRS: só lê os dados)
        └── renderizador.js             ← ✅ Passo 4 (implementado)
```

---

## 📆 Registro de Progresso (changelog)

### ✅ Setup — Diretrizes e Estrutura
- Consolidado o `LSU_DIRETRIZES.md` como documento canônico de referência
  (limpeza de caracteres invisíveis + estruturação em Markdown).
- Criada a estrutura modular de pastas/arquivos **vazios**, respeitando a
  separação Núcleo / Módulos Esportivos / UI exigida pelo Documento Mestre.

### ✅ Passo 1 — Fábrica de Regens
- **Arquivo:** `js/core/fabricaRegens.js`
- **O que faz:** função `gerarAtleta()` que cria e retorna um objeto "atleta"
  fictício.
- **Objeto gerado:**
  - `id` → `crypto.randomUUID()` (único)
  - `nome` → sorteado de duas listas (`NOMES` + `SOBRENOMES`)
  - `idade` → inteiro aleatório de **16 a 35**
  - `habilidade` → inteiro aleatório de **1 a 100**
- **Funções auxiliares:** `sortearInteiro(min, max)` e `sortearItem(lista)`.
- **Teste:** `console.log(gerarAtleta())` no fim do arquivo (inspeção no console).
- **Arquitetura:** 100% agnóstico — não conhece nenhuma regra de esporte.

### ✅ Passo 2 — Módulo Esportivo Básico ("A Competição Fantasma")
- **Arquivo:** `js/modulos-esportivos/moduloBasico.js`
- **O que faz:** função `simularPartida(atletaA, atletaB)` que simula um duelo
  1x1 e devolve um **"Pacote de Fatos" (JSON)** — não retorna apenas o vencedor.
- **Lógica matemática:**
  - Cada atleta rola um "dado" de sorte de **1 a 20** (`rolarDado`).
  - `Pontuação Final = habilidade + sorte`.
  - A habilidade (1–100) pesa mais que a sorte (1–20), então o mais habilidoso
    tende a vencer, mas há espaço para zebras quando as habilidades são próximas.
- **Formato do Pacote de Fatos retornado:**
  - `tipoEvento`: `"PARTIDA_FINALIZADA"`
  - `dataSimulada`: `"2026-01-01"`
  - `competidores`: id + nome de A e B
  - `resultado`: `vencedor` e `perdedor` (cada um com id, nome e `pontuacaoFinal`)
- **Regra criada:** ver **R1 (desempate)** na seção destacada acima.
- **Teste:** gera 2 atletas com `gerarAtleta()`, chama `simularPartida()` e faz
  `console.log()` do resultado.
- **Arquitetura:** só roda matemática e devolve JSON — não persiste nem desenha.

### ✅ Passo 3 — Event Bus + Memória Histórica (Arquitetura Orientada a Eventos)
- **Arquivos:** `js/core/eventBus.js`, `js/core/memoriaHistorica.js`,
  `js/core/gameLoop.js`.
- **`EventBus`** (Pub/Sub): objeto com `ouvintes` (mapa evento → callbacks),
  `on(evento, callback)` para **assinar** e `emit(evento, payload)` para
  **publicar** o fato a todos os inscritos. Desacopla produtor de consumidor.
- **`memoriaHistorica`** (Event Store): array que começa vazio e só cresce por
  eventos — é a fonte única da verdade (Event Sourcing).
- **`ouvinteHistorico(payload)`**: único ponto autorizado a dar `push()` na
  memória; registrado no bus via `EventBus.on("PARTIDA_FINALIZADA", ...)`.
- **`gameLoop.js`** (orquestrador/teste): gera **4 atletas**, monta **3
  confrontos**, simula cada um com `simularPartida()` e faz
  `EventBus.emit("PARTIDA_FINALIZADA", resultado)`. Ao final,
  `console.log(memoriaHistorica)`. **O gameLoop nunca escreve na memória
  diretamente** — tudo passa pelo barramento.
- **Teste validado:** 3 partidas → 3 registros arquivados na memória via bus.
- **Limpeza (cumprindo nota técnica anterior):** removidos os `console.log` de
  teste avulsos de `fabricaRegens.js` e `moduloBasico.js`; eles agora são
  "bibliotecas" puras, e a orquestração/saída vive só no `gameLoop.js`.
- **Ordem de carregamento (importante):** `fabricaRegens.js` → `moduloBasico.js`
  → `eventBus.js` → `memoriaHistorica.js` → `gameLoop.js`. A Memória Histórica
  precisa do `EventBus` já definido para registrar seu ouvinte.

### ✅ Passo 14 (Fase 2) — Ouvinte de Estatísticas (projeção da classificação)
- **Arquivo:** `js/core/ouvinteEstatisticas.js` (novo, no Núcleo).
- **Função pura:** `atualizarClassificacaoTemporada(payload, temporada)` — se o
  `payload.tipoEvento === "PARTIDA_EQUIPES_FINALIZADA"`, extrai `vencedorId`/
  `perdedorId`, faz `find` das linhas na `temporada.classificacao` e atualiza:
  vencedor **+3 pontos / +1 vitória**, perdedor **+1 derrota**.
- **Ligação ao EventBus:** `registrarOuvinteEstatisticas(temporada)` assina o
  evento no barramento "amarrando" a temporada via **closure** (o EventBus só
  entrega o payload; a closure fornece qual tabela atualizar).
- **Arquitetura:** é uma **projeção** (read model) do Event Sourcing — escuta o
  fato imutável e atualiza o resumo derivado. Não calcula partida nem desenha.
- **Sem interface:** nenhuma alteração de HTML/CSS/renderizador (CQRS); arquivo
  **não** ligado ao `index.html` (por isso o `?v=` não mudou).
- **Teste (guardado, Node-only):** inscreve 2 equipes, gera temporada, zera a
  tabela, registra o ouvinte, simula e emite → tabela atualiza sozinha.
- **Teste validado:** vencedor `{pontos:3, vitorias:1}`, perdedor `{derrotas:1}`.

### ✅ Passo 13 (Fase 2) — Módulo Esportivo para duelos de Equipes
- **Arquivo:** `js/modulos-esportivos/moduloBasico.js`.
- **Função nova:** `simularPartidaEquipes(equipeA, equipeB)` — mesma matemática
  dos atletas, mas usando a `reputacao` da organização.
  - `Pontuação Final = reputacao + dado(1..20)`.
  - Desempate: maior `reputacao` base; persistindo, vence a Equipe A.
- **Pacote de Fatos devolvido:**
  - `tipoEvento`: `"PARTIDA_EQUIPES_FINALIZADA"`
  - `dataSimulada`: `"2026-03-01"`
  - `competidores`: `equipeA`/`equipeB` (id + nome)
  - `resultado`: `vencedorId`, `perdedorId`, `pontuacaoVencedor`,
    `pontuacaoPerdedor`
- **Agnóstico/cego para a tela:** só calcula e devolve JSON; nenhuma alteração de
  HTML/CSS/renderizador.
- **Teste (guardado, Node-only):** bloco `if (typeof window === "undefined")` no
  fim do arquivo cria duas equipes fictícias e faz `console.log`. Silencioso no
  navegador (o arquivo é carregado no app).
- **Teste validado:** pacote correto; app no browser sem erros.
- Cache: `?v=11` → `?v=12` (R2, pois `moduloBasico.js` mudou).

### ✅ Passo 12 (Fase 2) — Inicialização da Tabela de Classificação
- **Arquivo:** `js/core/gameLoop.js` (Núcleo).
- **Função nova:** `iniciarClassificacaoTemporada(temporada, competicao)` —
  percorre `competicao.participantes` (IDs) e, para cada equipe, dá `push` de uma
  **linha de estatísticas zerada** em `temporada.classificacao`:
  `{ organizacaoId, pontos: 0, vitorias: 0, derrotas: 0 }`.
- **Normalização:** guarda só o `organizacaoId` + números, nunca o objeto da org.
- **Sem interface:** nenhuma alteração de HTML/CSS/renderizador (CQRS mantido).
- **Teste (guardado, Node-only):** novo bloco `if (typeof window === "undefined")`
  no `gameLoop.js` — inscreve 3 orgs numa competição, gera a temporada, inicializa
  a classificação e faz `console.log`. Silencioso no navegador.
- **Teste validado:** 3 participantes → 3 linhas zeradas; app no browser sem erros.
- Cache: `?v=10` → `?v=11` (R2, pois `gameLoop.js` mudou).

### ✅ Passo 11 (Fase 2) — Fábrica de Temporadas
- **Arquivo:** `js/core/fabricaTemporadas.js` (novo, no Núcleo).
- **O que faz:** `gerarTemporada(competicaoId, ano)` cria a edição anual de um
  torneio (o "caderno de registros" isolado de um ano).
- **Objeto gerado:**
  - `id` → `crypto.randomUUID()`
  - `competicaoId` → ID da competição-mãe (referência, por parâmetro)
  - `ano` → ano da edição (por parâmetro, ex.: 2024)
  - `rodadaAtual` → inteiro iniciando em **1** (propriedade do objeto temporada,
    não confundir com o `rodadaAtual` global do `gameLoop.js`)
  - `jogos` → `[]` (IDs dos jogos/fatos do ano)
  - `classificacao` → `[]` (tabela de pontos das equipes)
- **Isolamento (Um Tijolo por Vez):** agnóstica a modalidades, **sem** HTML/CSS,
  **sem** renderizador, **não** ligada ao `index.html` (por isso o `?v=` não
  mudou). Testável isolada via `console.log`.

### ✅ Passo 10 (Fase 2) — Inscrição + Wikipédia das Competições
- **Arquivos:** `index.html`, `css/style.css`, `js/core/gameLoop.js`,
  `js/ui/renderizador.js` (+ `fabricaCompeticoes.js` ligada ao `index.html`).
- **Núcleo:** `inscreverEquipesNaCompeticao(listaOrganizacoes, competicao)` — dá
  `push` apenas dos **IDs** das organizações em `competicao.participantes`.
- **`iniciarMundo()`:** além de orgs+atletas, gera **1 competição**, inscreve
  todas as organizações e guarda em `competicoesGlobais = [competicao]`.
- **Menu:** nova seção **Competições** no topo (`#lista-competicoes`), clicável.
- **Página da competição (nova):** `abrirPaginaCompeticao(id)` mostra nome +
  reputação e **Equipes Participantes** — loop pelos IDs de `participantes`,
  busca cada organização e a exibe como link → `abrirPaginaOrganizacao(id)`.
- **Navegação profunda:** Competição → Equipe → Atleta, tudo por referência (IDs).
- **CQRS:** só leitura/`find`; nada é duplicado nem alterado.
- **Teste validado (headless):** 1 comp / 12 atletas / 3 orgs; navegação completa;
  `participantes` guarda 3 IDs-string válidos; atleta final pertence à equipe
  aberta; sem erros.
- Cache: `?v=9` → `?v=10` (R2).

### ✅ Passo 9 (Fase 2) — Fábrica de Competições
- **Arquivo:** `js/core/fabricaCompeticoes.js` (novo, no Núcleo).
- **O que faz:** função `gerarCompeticao()` que cria e retorna a entidade
  "competição".
- **Objeto gerado:**
  - `id` → `crypto.randomUUID()`
  - `nome` → `PREFIXOS_COMP` (Copa/Liga/Campeonato) + `SUFIXOS_COMP`
    (Nacional/Global/Suprema)
  - `reputacao` → inteiro **1 a 100** (prestígio do torneio)
  - `participantes` → `[]` (guardará **IDs** de orgs/pessoas — normalização)
  - `historicoTemporadas` → `[]` (guardará edições anuais depois)
- **Isolamento (Um Tijolo por Vez):** agnóstica a modalidades, **sem** HTML/CSS,
  **sem** alterar o renderizador, e **não** ligada ao `index.html` (por isso o
  `?v=` não mudou). Testável isolada via `console.log`.
- **Nota:** helpers `sortearInteiroComp`/`sortearItemComp` (sufixados) para o
  arquivo ser autossuficiente e evitar colisão de nomes com as outras fábricas.

### ✅ Passo 8 (Fase 2) — Wikipédia Relacional (Interface)
- **Arquivos:** `index.html`, `css/style.css`, `js/ui/renderizador.js`
  (+ `fabricaOrganizacoes.js` finalmente ligado ao `index.html`).
- **`iniciarMundo()`:** agora gera **3 organizações** + **12 atletas**, chama
  `distribuirAtletasNasOrganizacoes()` e guarda `atletasDoMundo` e
  `organizacoesDoMundo` como globais de leitura. Mantém a limpeza de estado.
- **Menu lateral:** duas seções clicáveis — **Atletas** (`#lista-atletas`) e
  **Organizações** (`#lista-organizacoes`).
- **Página do atleta:** nova linha **Organização**, achada pelo `organizacaoId`,
  como link clicável → `abrirPaginaOrganizacao(id)`.
- **Página da organização (nova):** `abrirPaginaOrganizacao(idOrganizacao)` mostra
  nome + reputação e o **Elenco** = `atletasDoMundo.filter(a => a.organizacaoId
  === id)`; cada atleta do elenco é link → `abrirPaginaAtleta(id)`.
- **Helpers novos:** `ligarLinksInternos()` (liga os links "vai e vem" por
  data-attributes) e `aplicarPiscada()` (animação, antes duplicada).
- **CQRS:** tudo é leitura/`filter`; a UI não altera dados nem emite eventos.
- **Decisão:** ao abrir uma organização, `atletaSelecionadoId = null` para o
  "Avançar" não pular de volta a um atleta enquanto a org está aberta.
- **Mudança de comportamento:** `iniciarMundo()` **não simula mais partidas
  iniciais** (seguindo a especificação do passo). As linhas do tempo começam
  vazias e crescem ao clicar em "Avançar 1 Rodada". (Fácil reverter se quiser
  jogos já no load — ver observação na conversa.)
- **Teste validado (headless):** 12 atletas / 3 orgs; navegação atleta→org→
  elenco→atleta; soma dos elencos = 12 (integridade); sem erros.
- Cache: `?v=8` → `?v=9` (R2).

### ✅ Passo 7 (Fase 2) — Lógica Relacional (Atleta ↔ Organização)
- **Arquivo:** `js/core/gameLoop.js` (Núcleo).
- **Função nova:** `distribuirAtletasNasOrganizacoes(listaAtletas, listaOrganizacoes)`
  — itera os atletas e, para cada um, sorteia uma organização e grava
  `atleta.organizacaoId = organizacao.id`.
- **Normalização (importante):** o atleta guarda **apenas o `organizacaoId`**
  (a "chave estrangeira"), nunca o objeto inteiro da organização. Os dados da
  organização continuam em um único lugar (a lista de organizações).
- **Sem interface:** nenhuma alteração de HTML/CSS de comportamento; o vínculo é
  só de dados no Núcleo.
- **Teste (guardado):** bloco no fim do `gameLoop.js` sob
  `if (typeof window === "undefined")` — roda no **Node** (gera 2 orgs + 6 atletas,
  distribui e faz `console.log` dos atletas), mas fica **silencioso no navegador**
  para não poluir/quebrar o app (as fábricas de org ainda não estão ligadas ao
  `index.html`).
- **Teste validado:** cada atleta recebeu `organizacaoId`; só aparecem os 2 ids
  das 2 organizações; app no navegador segue sem erros.
- Cache: `?v=7` → `?v=8` (regra R2, pois `gameLoop.js` mudou).

### ✅ Passo 6 (Fase 2) — Fábrica de Organizações
- **Arquivo:** `js/core/fabricaOrganizacoes.js` (novo, no Núcleo).
- **O que faz:** função `gerarOrganizacao()` que cria e retorna um objeto
  "organização" fictícia.
- **Objeto gerado:**
  - `id` → `crypto.randomUUID()` (único)
  - `nome` → sorteado de duas listas (`PREFIXOS_ORG` + `NOMES_ORG`)
  - `reputacao` → inteiro aleatório de **1 a 100** (prestígio da instituição)
- **Isolamento (Um Tijolo por Vez):** entidade **agnóstica** a esportes, **sem
  ligação com atletas** e **sem** alteração de HTML/CSS. Arquivo ainda **não**
  ligado ao `index.html` (por isso o `?v=` não mudou).
- **Teste:** `console.log(gerarOrganizacao())` no fim do arquivo (inspeção).
- **Nota:** helpers batizados `sortearInteiroOrg`/`sortearItemOrg` para manter o
  arquivo autossuficiente e evitar colisão com os da Fábrica de Regens quando um
  dia forem carregados juntos.

### ✅ Correção — Limpeza de estado na inicialização
- **Arquivo:** `js/ui/renderizador.js` (função `iniciarMundo`).
- **Bug:** ao reiniciar o mundo sem recarregar a página, resultados antigos se
  misturavam com os novos atletas.
- **Fix cirúrgico:** logo na 1ª linha de `iniciarMundo()`, um bloco de reset:
  `memoriaHistorica.length = 0`, `rodadaAtual = 1`, `atletaSelecionadoId = null`,
  e limpeza do HTML da lista de atletas e da página principal — **antes** de
  `gerarMundo()`, para o universo nascer do zero.
- **Detalhes:** usa `.length = 0` (a memória é `const`, então não pode ser
  reatribuída) e limpa `#lista-atletas` (não o `#menu-lateral` inteiro, para não
  apagar o botão "Avançar").
- **Teste validado (headless):** antes do reinício 19 partidas/rodada 4 → depois
  10 partidas/rodada 1, sem seleção, 6 atletas, página vazia, sem erros.
- Cache: `?v=6` → `?v=7` (regra R2).

### ✅ Passo 5 — Ciclo de Tempo (Botão "Avançar 1 Rodada")
- **Arquivos:** `index.html`, `css/style.css`, `js/core/gameLoop.js`,
  `js/ui/renderizador.js`.
- **Tempo (Núcleo):** variável global `rodadaAtual` (inicia em 1) em
  `gameLoop.js`. Nova função `simularRodada(atletas)`: incrementa a rodada,
  embaralha os atletas em **duplas aleatórias** (Fisher–Yates) e simula cada
  confronto, publicando no EventBus.
- **Carimbo de tempo:** o Núcleo agora estampa `rodada` em cada Pacote de Fatos
  (via `simularConfronto`) antes de emitir — o módulo esportivo continua agnóstico
  quanto ao conceito de tempo.
- **Reatividade (UI):** `renderizador.js` ganhou:
  - `atletaSelecionadoId` (estado da interface: quem está sendo visto).
  - `avancarTempo()`: handler do botão — chama `simularRodada()` no Núcleo,
    atualiza o display da rodada e, se há atleta selecionado, chama
    `abrirPaginaAtleta()` de novo para a tela "piscar" e recarregar.
  - `atualizarDisplayRodada()`: escreve `rodadaAtual` no topo (leitura pura).
- **HTML/CSS:** botão grande `#btn-avancar` no topo do menu; indicador
  "Rodada Atual: N" no topo; animação `piscar` ao recarregar a página.
- **Teste validado (headless):** 2 cliques → rodada 1→3; timeline do atleta
  cresce e passa a exibir "Rodada 1/2/3"; sem erros no console.

### ✅ Passo 4 — Interface Visual (primeira "página de Wikipédia")
- **Arquivos:** `index.html`, `css/style.css`, `js/ui/renderizador.js` (e ajuste
  no `js/core/gameLoop.js`).
- **`index.html`:** layout de 2 colunas — **Menu Lateral** (`#lista-atletas`) à
  esquerda e **Página Principal** (`#pagina-principal`) à direita. Carrega os
  scripts na ordem de dependência correta.
- **`css/style.css`:** estilo simples inspirado na Wikipédia, só o suficiente
  para separar menu e conteúdo; cores para vitória (verde) e derrota (vermelho).
- **`renderizador.js` (CQRS — só leitura):**
  - `iniciarMundo()`: chama `gerarMundo(6, 10)` (no Núcleo) e desenha o menu.
  - `desenharMenuLateral()`: cria os `<li>` clicáveis com os nomes dos atletas.
  - `abrirPaginaAtleta(idAtleta)`: monta a ficha (Nome/Idade/Habilidade) e a
    **Linha do Tempo**, obtida por `memoriaHistorica.filter(...)` das partidas em
    que o atleta jogou — indicando "Venceu/Perdeu", oponente e placar.
  - A UI **nunca** altera a memória nem emite eventos — apenas lê.
- **Decisão de arquitetura (CQRS/diretriz):** a geração do mundo (lógica +
  `EventBus.emit`) foi movida para `gameLoop.js` (`gerarMundo`), mantendo o
  `renderizador.js` livre de emissão de eventos — apenas leitura + DOM. Isso
  cumpre a diretriz "Event Bus/Memória não misturados com o código de DOM".
- **`gameLoop.js`:** deixou de rodar teste no carregamento; agora expõe a função
  reutilizável `gerarMundo(quantidadeAtletas, quantidadePartidas)` (sem DOM, sem
  `console.log`).
- **Teste validado (navegador headless):** 6 atletas no menu, clique abre a
  página com ficha + linha do tempo, sem erros no console.

---

## 🔜 Próximos Passos Previstos
- **Links navegáveis entre páginas** (estilo Wikipédia): clicar no nome do
  oponente dentro da Linha do Tempo para abrir a página dele.
- **Mais tipos de evento/esporte** e páginas para outras entidades
  (Organizações, Competições).
- **Nota técnica:** hoje os arquivos usam variáveis/funções globais (`EventBus`,
  `memoriaHistorica`, `gerarAtleta`, `simularPartida`, `gerarMundo`) e dependem
  da ordem de carregamento dos `<script>`. Num momento futuro podemos migrar para
  ES Modules (`import`/`export`) para tornar as dependências explícitas.
