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

- [ ] 🟡 **`registrarOuvinteEstatisticas` re-registra ao reiniciar o mundo**
  - **Arquivos:** `js/ui/renderizador.js` (`iniciarMundo`) + `eventBus.js`.
  - **Problema:** `iniciarMundo()` chama `registrarOuvinteEstatisticas(temporada)`,
    que faz `EventBus.on(...)`. A limpeza de estado zera a `memoriaHistorica`, mas
    **não** limpa `EventBus.ouvintes`. Hoje é seguro (roda 1x no load), mas se
    `iniciarMundo()` rodar de novo (botão "Reiniciar"), o ouvinte de estatísticas
    seria registrado 2x (pontos dobrados) e ainda apontaria para a temporada antiga.
  - **O que fazer:** ao reiniciar, resetar o `EventBus` (ex.: `EventBus.ouvintes = {}`
    e re-registrar os ouvintes) ou registrar os ouvintes fora de `iniciarMundo()`.

- [x] 🟢 **Integrar simulação de partidas de EQUIPE ao Game Loop ("Avançar")**
  ✅ **Feito no Passo 15.5:** `simularRodadaCompeticao(competicao, organizacoes)`
  no `gameLoop.js` (emite `PARTIDA_EQUIPES_FINALIZADA` sem DOM), chamada pelo
  `avancarTempo`. A tabela agora enche ao clicar "Avançar".
  - ✅ **Pendência menor resolvida no Passo 15.6:** o pacote de fatos ganhou `id`
    e o ouvinte faz `temporada.jogos.push(payload.id)`. O array já registra os
    jogos ocorridos. (Falta só a interface de calendário, quando fizer sentido.)
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

- [ ] 🟢 **Lógica da história duplicada (worker + fallback)**
  - **Arquivos:** `js/core/workerSimulacao.js` e `js/core/gameLoop.js`
    (`simularHistoriaPrevia`).
  - **Contexto:** o laço de round-robin existe nos dois (o worker posta progresso;
    o fallback síncrono roda no main thread quando não há Worker, ex.: `file://`).
  - **O que fazer (talvez):** extrair o laço para um arquivo puro compartilhado
    via `importScripts` no worker e `<script>` no fallback, se a duplicação
    incomodar. Hoje é pequena e aceitável.

- [ ] 🟢 **`ouvinteEstatisticas.js` foi aposentado (Passo 24)**
  - **Contexto:** o `ouvinteClassificacao.js` (Passo 24) substituiu o
    `ouvinteEstatisticas.js` (Passo 14) — faz tudo o que ele fazia e mais (jogos,
    empates, saldo, evento `TABELA_CLASSIFICACAO_ATUALIZADA`). O antigo **não é
    mais registrado**, mas ainda é carregado no `index.html` (inerte).
  - **O que fazer:** remover `ouvinteEstatisticas.js` do `index.html` (e o arquivo)
    quando tiver certeza de que não será reaproveitado.

## Decisões de Design em Aberto

- [ ] 🟡 **Regra de desempate da partida (R1)**
  - **Arquivo:** `js/modulos-esportivos/moduloBasico.js` → `simularPartida()`.
  - **Contexto:** hoje, empate na pontuação final é resolvido pela maior
    `habilidade`; persistindo, vence o Atleta A. Foi uma decisão minha.
  - **O que decidir:** manter assim, ou trocar por revanche/prorrogação/empate
    explícito no Pacote de Fatos.

- [x] 🟢 **`dataSimulada` fixa** ✅ **Resolvido no Apêndice do Calendário:**
  os jogos do PRESENTE agora carimbam a data real (`simularRodadaCompeticao` usa
  `dataParaISO(dataAtual)`).
  - **Pendência menor:** os fatos HISTÓRICOS (worker) mantêm a `dataSimulada`
    padrão do módulo (o worker não usa o calendário) — cosmético, o `ano` é o que
    importa. Se quiser, o worker pode carimbar uma data plausível por ano.

- [x] 🟡 **UI do Calendário** ✅ **Feito no Passo 31** (`js/ui/calendarioUI.js`):
  grade mensal com quadrados, ⚽ nos dias de jogo, navegação de mês e pop-up
  "simular até a data" (para na véspera). Resolve o tédio dos ~30 cliques.
  - **Pendências/ideias restantes:**
    - 🟢 A grade não alinha por dia da semana (o calendário do jogo é simplificado,
      365 dias sem dias da semana). Se quiser semanas reais, adotar dia-da-semana.
    - 🟢 "Simular até" muito longe (muitos anos) roda milhares de `avancarUmDia`
      síncronos e trava a UI durante o loop — avaliar Web Worker / feedback de
      progresso para saltos grandes (hoje há um teto de segurança de 100000 dias).
    - 🟢 Marcar visualmente no calendário os dias com jogos de OUTRAS competições
      quando houver mais de uma (hoje mostra o nome; com muitas, pode lotar).

## Integrações Pendentes (entidades criadas, ainda não ligadas ao mundo)

- [x] 🟡 **Integrar Contratos ao mundo (Passo 18)** ✅ **Feito no Passo 22:**
  `iniciarMundo` gera um `gerarContrato()` por atleta em `contratosGlobais`.
  - **Pendência restante:** exibir a carreira/contrato na interface; usar
    `anoFim`/`ativo` para expiração e mercado de transferências; e, após rescisão,
    reorganizar o elenco (hoje o atleta rescindido continua no elenco da org).

- [x] 🟡 **Ligar o Ouvinte de Saúde ao app (Passo 19)** ✅ **Feito no Passo 22:**
  carregado no `index.html` e registrado no `finalizarBigBang`. Lesões ocorrem
  nas partidas do presente.
  - **Pendência restante:** exibir as lesões na Linha do Tempo / departamento médico.

- [x] 🟡 **Ligar o Ouvinte de Contratos ao app (Passo 20)** ✅ **Feito no Passo 22:**
  carregado e registrado; o efeito dominó lesão → rescisão está vivo no presente.
  - **Pendência restante:** exibir as rescisões na carreira do atleta.

## Ciclo de Vida — próximos tijolos naturais (pós Passos 26–28)

- [x] 🟡 **Gerar "regens" para repor os reformados** ✅ **Feito no Passo 29**
  (`ouvinteReposicao.js`: 15 jovens de 16–18 anos por virada de ano).
  - **Pendências restantes (por ordem de impacto):**
    - 🟡 Os novatos entram **sem organização nem contrato** (agentes livres) —
      criar a lógica de recrutamento/draft para as equipes preencherem vagas.
    - 🟡 O **menu lateral não redesenha** ao chegar a fornada — os novatos só
      aparecem na lista de Atletas após reiniciar. Redesenhar o menu (ou seção
      "Agentes Livres") ao ouvir `NOVA_FORNADA_GERADA`.
    - 🟢 Crescimento populacional: +15/ano com ~poucas reformas/ano → o array
      cresce sem limite no longo prazo. Avaliar equilíbrio (fornada menor,
      reformas mais agressivas, ou "sumidouro" de atletas sem clube).

- [ ] 🟢 **Mercado só preenche, não dispensa (Passo 30)**
  - **Arquivo:** `js/core/ouvinteMercado.js`.
  - **Contexto:** `LIMITE_ELENCO = 5` só computa vagas; uma org que já tem >5
    (ex.: distribuição inicial 3/6/3) fica acima do ideal até jogadores saírem.
  - **O que fazer (talvez):** lógica de dispensa dos piores quando o elenco excede
    o limite, e/ou equilibrar a distribuição inicial dos atletas (Passo 7).
- [ ] 🟢 **Reforma/expiração deveriam liberar a vaga no mercado (Passo 30):**
  contrato de reformado continua `ativo:true` e ocupa slot no `contratosAtivos`
  da org — reduz vagas fantasma. Ligar reforma → encerrar contrato (já no TODO do
  ciclo de vida) resolve isto também.
- [ ] 🟡 **Exibir o ciclo de vida na interface:** status "Reformado" na página do
  atleta e no elenco (hoje o reformado aparece igual aos ativos); aposentadoria e
  lesões na Linha do Tempo (os fatos já estão na memória).
- [ ] 🟢 **Encerrar contratos na reforma:** o contrato do reformado continua
  `ativo: true`; o ouvinte de reforma (ou o de contratos) deveria encerrá-lo
  (`ativo: false`, `anoFim = ano da reforma`).
- [ ] 🟢 **Expiração natural de contratos por `anoFim`:** na virada do ano,
  desativar contratos vencidos (hoje só a rescisão por lesão desativa).
- [ ] 🟢 **Curva de crescimento dos jovens:** além do declínio dos 32+, jovens
  poderiam ganhar habilidade até um pico (ex.: 27 anos), criando arcos de carreira.

## Ideias / Melhorias Futuras (não urgentes)

- [ ] 🟢 **Oponentes clicáveis na Linha do Tempo** (navegação estilo Wikipédia):
  clicar no nome do oponente abre a página dele.
- [ ] 🟢 **Ranking/classificação** que também reage ao avançar do tempo.
- [ ] 🟢 **Página vazia sem seleção:** hoje, após a limpeza de estado, a Página
  Principal fica em branco até o usuário clicar em alguém. Avaliar reexibir uma
  dica ("← Selecione um atleta").
