# ✅ TO DO — Pontos a Revisar (Living Sports Universe)

> Lista viva de dívidas técnicas, decisões em aberto e melhorias que **não são
> bugs urgentes**, mas que devem ser revisitadas antes de crescerem. Cada item
> tem prioridade, contexto e o que fazer. Marcar `[x]` quando resolvido.
>
> Relacionados: [`PROGRESSO.md`](./PROGRESSO.md) (changelog) ·
> [`LSU_DIRETRIZES.md`](./LSU_DIRETRIZES.md) (regras do universo)

Legenda de prioridade: 🔴 alta · 🟡 média · 🟢 baixa

---

## Dívidas Técnicas

- [ ] 🟡 **`addEventListener` do botão dentro de `iniciarMundo()`**
  - **Arquivo:** `js/ui/renderizador.js` → `iniciarMundo()`.
  - **Problema:** o `document.getElementById("btn-avancar").addEventListener(...)`
    está dentro de `iniciarMundo()`. Hoje é seguro porque a função só roda uma
    vez (no `DOMContentLoaded`). Mas se no futuro criarmos um botão "Reiniciar
    Mundo" que chame `iniciarMundo()` de novo, o listener seria registrado
    **várias vezes** (cada clique em "Avançar" simularia N rodadas de uma vez).
  - **O que fazer:** mover a ligação do botão para fora de `iniciarMundo()`
    (ex.: um `configurarEventos()` chamado uma única vez no `DOMContentLoaded`).
  - **Origem:** correção de limpeza de estado (não alterado por ser fora do
    escopo "apenas limpeza").

- [ ] 🟢 **Dependência de ordem de `<script>` / variáveis globais**
  - **Arquivos:** todos os `js/**` + `index.html`.
  - **Problema:** os módulos se comunicam por variáveis globais (`EventBus`,
    `memoriaHistorica`, `gerarAtleta`, `simularPartida`, `gerarMundo`,
    `rodadaAtual`) e dependem da ordem exata de carregamento dos scripts.
  - **O que fazer:** avaliar migração para **ES Modules** (`import`/`export`)
    para tornar as dependências explícitas e remover o acoplamento por ordem.

- [ ] 🟢 **Manutenção manual da trava de cache (`?v=N`)**
  - **Arquivo:** `index.html` (regra **R2** no PROGRESSO).
  - **Problema:** o número de versão é incrementado à mão a cada alteração de
    JS/CSS; fácil de esquecer.
  - **O que fazer:** quando houver build/deploy, automatizar o versionamento
    (hash do arquivo) em vez do `?v=N` manual.

## Decisões de Design em Aberto

- [ ] 🟡 **Regra de desempate da partida (R1)**
  - **Arquivo:** `js/modulos-esportivos/moduloBasico.js` → `simularPartida()`.
  - **Contexto:** hoje, empate na pontuação final é resolvido pela maior
    `habilidade`; persistindo, vence o Atleta A. Foi uma decisão minha.
  - **O que decidir:** manter assim, ou trocar por revanche/prorrogação/empate
    explícito no Pacote de Fatos.

- [ ] 🟢 **`dataSimulada` fixa em `"2026-01-01"`**
  - **Arquivo:** `js/modulos-esportivos/moduloBasico.js`.
  - **Problema:** toda partida nasce com a mesma data fictícia; hoje o tempo é
    representado pela `rodada`. A data não evolui.
  - **O que fazer:** decidir se a data deve avançar junto com as rodadas (um
    calendário do universo) ou se removemos o campo em favor de `rodada`.

## Ideias / Melhorias Futuras (não urgentes)

- [ ] 🟢 **Oponentes clicáveis na Linha do Tempo** (navegação estilo Wikipédia):
  clicar no nome do oponente abre a página dele.
- [ ] 🟢 **Ranking/classificação** que também reage ao avançar do tempo.
- [ ] 🟢 **Página vazia sem seleção:** hoje, após a limpeza de estado, a Página
  Principal fica em branco até o usuário clicar em alguém. Avaliar reexibir uma
  dica ("← Selecione um atleta").
