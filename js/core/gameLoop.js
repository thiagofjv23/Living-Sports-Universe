// =============================================================
// Núcleo (Core) — Game Loop (Orquestrador) + Ciclo de Tempo
// Passos 3/4/5 do MVP: junta as peças de LÓGICA e faz o universo
// evoluir no tempo.
//
// O gameLoop é o maestro: controla o TEMPO (rodadaAtual), GERA
// entidades, pede ao módulo esportivo para simular, carimba a
// rodada no fato e PUBLICA no EventBus. Ele NÃO grava na memória
// diretamente (isso é do ouvinteHistorico) e NÃO desenha nada na
// tela (isso é do renderizador). Aqui não há DOM.
//
// Depende (nesta ordem de carregamento) de:
//   fabricaRegens.js -> moduloBasico.js -> eventBus.js -> memoriaHistorica.js
// =============================================================

// Relógio do universo: em que rodada o mundo está agora.
let rodadaAtual = 1;

// Sorteia um atleta qualquer de uma lista.
function sortearAtleta(atletas) {
  return atletas[Math.floor(Math.random() * atletas.length)];
}

// Simula UM confronto e publica o fato no EventBus.
// O módulo esportivo (agnóstico) devolve o Pacote de Fatos; aqui o
// Núcleo carimba a rodada atual (o "quando" do universo) antes de
// emitir. Ponto único por onde as partidas entram na história.
function simularConfronto(atletaA, atletaB) {
  const resultadoDaPartida = simularPartida(atletaA, atletaB);
  resultadoDaPartida.rodada = rodadaAtual;
  EventBus.emit("PARTIDA_FINALIZADA", resultadoDaPartida);
}

// Gera o "mundo" inicial: cria N atletas e simula M partidas
// aleatórias entre eles (todas na rodada 1). Devolve a lista de
// atletas para a interface apenas LÊ-la ao montar o menu.
function gerarMundo(quantidadeAtletas, quantidadePartidas) {
  const atletas = [];
  for (let i = 0; i < quantidadeAtletas; i++) {
    atletas.push(gerarAtleta());
  }

  for (let i = 0; i < quantidadePartidas; i++) {
    const atletaA = sortearAtleta(atletas);
    let atletaB = sortearAtleta(atletas);
    while (atletaB === atletaA) {
      atletaB = sortearAtleta(atletas);
    }
    simularConfronto(atletaA, atletaB);
  }

  return atletas;
}

// Avança o tempo em uma rodada: embaralha os atletas em duplas
// aleatórias e simula cada confronto. Cada partida é publicada no
// EventBus (que alimenta a memoriaHistorica). Se o número de
// atletas for ímpar, um deles folga na rodada (bye).
function simularRodada(atletas) {
  rodadaAtual++;

  // Cópia embaralhada (Fisher–Yates) para não alterar a lista original.
  const embaralhados = [...atletas];
  for (let i = embaralhados.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [embaralhados[i], embaralhados[j]] = [embaralhados[j], embaralhados[i]];
  }

  // Forma duplas com atletas consecutivos e simula cada confronto.
  for (let i = 0; i + 1 < embaralhados.length; i += 2) {
    simularConfronto(embaralhados[i], embaralhados[i + 1]);
  }
}
