// =============================================================
// Núcleo (Core) — Memória Histórica (Event Store)
// Passo 3 do MVP: o "banco de dados" imutável do universo.
//
// A Memória Histórica é a única fonte da verdade sobre o que
// aconteceu. Ela NÃO calcula nada e NÃO desenha nada: apenas
// arquiva os fatos que chegam pelo EventBus (Event Sourcing).
//
// Depende de eventBus.js, carregado antes deste arquivo.
// =============================================================

// O Event Store: começa vazio e vai acumulando os fatos do universo.
// Só cresce por meio de eventos — nunca por escrita direta de fora.
const memoriaHistorica = [];

// Ouvinte: recebe o payload de uma partida e o arquiva na memória.
// É o ÚNICO ponto autorizado a escrever na memoriaHistorica.
function ouvinteHistorico(payload) {
  memoriaHistorica.push(payload);
}

// Registra o ouvinte no barramento para arquivar os fatos. A Memória
// é o Event Store UNIVERSAL: guarda tanto partidas de atletas quanto
// de equipes (todo fato do universo passa por aqui).
EventBus.on("PARTIDA_FINALIZADA", ouvinteHistorico);
EventBus.on("PARTIDA_EQUIPES_FINALIZADA", ouvinteHistorico);
EventBus.on("ATLETA_LESIONADO_GRAVEMENTE", ouvinteHistorico);
