# 📋 Diário de Desenvolvimento — Living Sports Universe (LSU)

> Documento de controle do andamento do projeto. Registra **o que foi feito**,
> **quando**, e **quais decisões/regras** foram tomadas ao longo do caminho.
> Deve ser atualizado a cada novo passo concluído.
>
> Referência de regras do universo: [`LSU_DIRETRIZES.md`](./LSU_DIRETRIZES.md)

---

## ⚠️ Regras de Negócio Criadas (decisões minhas, fora do pedido original)

> Esta seção reúne, em destaque, toda regra que **não estava explícita** no
> pedido e que precisei definir para o código funcionar. Revise-as quando quiser
> — qualquer uma pode ser alterada.

| # | Regra | Onde | Motivo | Status |
|---|-------|------|--------|--------|
| R1 | **Desempate da partida:** se a `pontuacaoFinal` dos dois atletas for igual, vence quem tem maior `habilidade` base; se ainda assim empatar, o **Atleta A** vence. | `js/modulos-esportivos/moduloBasico.js` → `simularPartida()` | O pedido pedia `vencedor`/`perdedor`, mas não previa empate. Sem uma regra, esses campos ficariam indefinidos. | ✅ Ativa (aberta a revisão) |

---

## 🗂️ Estrutura de Arquivos Atual

```
Living-Sports-Universe/
├── index.html                          ← (vazio) raiz
├── LSU_DIRETRIZES.md                   ← Documento Mestre (regras do universo)
├── PROGRESSO.md                        ← este diário
├── css/
│   └── style.css                       ← (vazio)
└── js/
    ├── core/                           ← NÚCLEO (agnóstico: entidades + memória)
    │   ├── fabricaRegens.js            ← ✅ Passo 1 (implementado)
    │   ├── eventBus.js                 ← ✅ Passo 3 (implementado)
    │   ├── memoriaHistorica.js         ← ✅ Passo 3 (implementado)
    │   └── gameLoop.js                 ← ✅ Passo 3 (orquestrador/teste)
    ├── modulos-esportivos/             ← MATEMÁTICA (só cálculo → JSON)
    │   └── moduloBasico.js             ← ✅ Passo 2 (implementado)
    └── ui/                             ← TELA (CQRS: só lê os dados)
        └── renderizador.js             ← (vazio)
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

---

## 🔜 Próximos Passos Previstos
- **Renderizador** (`js/ui/renderizador.js`): lê a Memória Histórica e desenha a
  tela (CQRS — só leitura), sem nunca alterar os dados.
- **index.html / css:** amarrar os scripts na ordem correta e dar a primeira
  interface visual ao universo.
- **Nota técnica:** hoje os arquivos usam variáveis/funções globais (`EventBus`,
  `memoriaHistorica`, `gerarAtleta`, `simularPartida`) e dependem da ordem de
  carregamento dos `<script>`. Num momento futuro podemos migrar para ES Modules
  (`import`/`export`) para tornar as dependências explícitas.
