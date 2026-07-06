// =============================================================
// Núcleo (Core) — Game Loop (Orquestrador)
// Passo 3/4 do MVP: junta as peças de LÓGICA e roda a simulação.
//
// O gameLoop é o maestro: GERA entidades, pede ao módulo esportivo
// para simular, e PUBLICA os fatos no EventBus. Ele NÃO grava na
// memória diretamente (isso é do ouvinteHistorico) e NÃO desenha
// nada na tela (isso é do renderizador). Aqui não há DOM.
//
// Depende (nesta ordem de carregamento) de:
//   fabricaRegens.js -> moduloBasico.js -> eventBus.js -> memoriaHistorica.js
// =============================================================

// Sorteia um atleta qualquer de uma lista.
function sortearAtleta(atletas) {
  return atletas[Math.floor(Math.random() * atletas.length)];
}

// Gera um "mundo": cria N atletas, simula M partidas aleatórias
// entre eles e publica cada resultado no EventBus (que alimenta a
// Memória Histórica). Devolve a lista de atletas criados para que a
// camada de interface possa apenas LÊ-la ao montar o menu.
function gerarMundo(quantidadeAtletas, quantidadePartidas) {
  const atletas = [];
  for (let i = 0; i < quantidadeAtletas; i++) {
    atletas.push(gerarAtleta());
  }

  for (let i = 0; i < quantidadePartidas; i++) {
    const atletaA = sortearAtleta(atletas);
    // Garante um oponente diferente do primeiro sorteado.
    let atletaB = sortearAtleta(atletas);
    while (atletaB === atletaA) {
      atletaB = sortearAtleta(atletas);
    }

    const resultadoDaPartida = simularPartida(atletaA, atletaB);
    EventBus.emit("PARTIDA_FINALIZADA", resultadoDaPartida);
  }

  return atletas;
}
