// =============================================================
// Módulo Esportivo Básico — "A Competição Fantasma"
// Passo 2 do MVP: um duelo 1 contra 1.
//
// Regra de ouro (Documento Mestre): este arquivo APENAS roda
// cálculos matemáticos e devolve um "Pacote de Fatos" (JSON).
// Ele NÃO conhece a interface, NÃO manipula DOM e NÃO persiste
// nada. Quem guarda o resultado é a Memória Histórica (Passo
// seguinte). Depende de gerarAtleta() (js/core/fabricaRegens.js),
// carregado antes deste arquivo.
// =============================================================

// Sorteia um número inteiro entre min e max (ambos inclusos).
// Usado como "fator de sorte" (o dado rolando).
function rolarDado(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Simula uma partida 1x1 e devolve o Pacote de Fatos do evento.
function simularPartida(atletaA, atletaB) {
  // Fator de sorte: um "dado" de 1 a 20 para cada competidor.
  const sorteA = rolarDado(1, 20);
  const sorteB = rolarDado(1, 20);

  // Pontuação Final = habilidade base + sorte do dia.
  const pontuacaoA = atletaA.habilidade + sorteA;
  const pontuacaoB = atletaB.habilidade + sorteB;

  // Determina vencedor e perdedor.
  // Empate na pontuação final é desempatado pela maior habilidade
  // base; persistindo o empate, o Atleta A leva a melhor.
  let vencedor;
  let perdedor;
  if (
    pontuacaoA > pontuacaoB ||
    (pontuacaoA === pontuacaoB && atletaA.habilidade >= atletaB.habilidade)
  ) {
    vencedor = { atleta: atletaA, pontuacao: pontuacaoA };
    perdedor = { atleta: atletaB, pontuacao: pontuacaoB };
  } else {
    vencedor = { atleta: atletaB, pontuacao: pontuacaoB };
    perdedor = { atleta: atletaA, pontuacao: pontuacaoA };
  }

  // Pacote de Fatos (JSON) — a única saída do módulo.
  return {
    tipoEvento: "PARTIDA_FINALIZADA",
    dataSimulada: "2026-01-01",
    competidores: {
      atletaA: { id: atletaA.id, nome: atletaA.nome },
      atletaB: { id: atletaB.id, nome: atletaB.nome },
    },
    resultado: {
      vencedor: {
        id: vencedor.atleta.id,
        nome: vencedor.atleta.nome,
        pontuacaoFinal: vencedor.pontuacao,
      },
      perdedor: {
        id: perdedor.atleta.id,
        nome: perdedor.atleta.nome,
        pontuacaoFinal: perdedor.pontuacao,
      },
    },
  };
}
