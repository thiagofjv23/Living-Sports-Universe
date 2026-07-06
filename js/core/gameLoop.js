// =============================================================
// Núcleo (Core) — Game Loop (Orquestrador)
// Passo 3 do MVP: junta as peças e roda o fluxo do universo.
//
// O gameLoop é o maestro: ele GERA entidades, pede ao módulo
// esportivo para simular, e PUBLICA os fatos no EventBus. Ele
// NÃO grava na memória diretamente — isso é responsabilidade do
// ouvinteHistorico, acionado pelo próprio EventBus.
//
// Depende (nesta ordem de carregamento) de:
//   fabricaRegens.js -> moduloBasico.js -> eventBus.js -> memoriaHistorica.js
// =============================================================

// 1) Gera 4 atletas (entidades globais).
const atletas = [gerarAtleta(), gerarAtleta(), gerarAtleta(), gerarAtleta()];

// 2) Define 3 confrontos diferentes entre os atletas gerados.
const confrontos = [
  [atletas[0], atletas[1]],
  [atletas[2], atletas[3]],
  [atletas[0], atletas[2]],
];

// 3) Simula cada partida e PUBLICA o resultado no EventBus.
//    Repare: o gameLoop nunca faz push na memoriaHistorica.
//    Tudo passa pelo barramento -> o ouvinteHistorico arquiva.
confrontos.forEach(([atletaA, atletaB]) => {
  const resultadoDaPartida = simularPartida(atletaA, atletaB);
  EventBus.emit("PARTIDA_FINALIZADA", resultadoDaPartida);
});

// 4) Confere o Event Store depois que os eventos foram processados.
console.log(memoriaHistorica);
