// =============================================================
// Núcleo (Core) — Ouvinte de Classificação (A Tabela Viva)
// Passo 24 (Fase 3): projeta os resultados das partidas na tabela
// da temporada (regras 3/1/0) e avisa quando a tabela muda.
//
// Substitui/estende o ouvinteEstatisticas (Passo 14): além de
// pontos/vitórias/derrotas, cuida de jogos, empates e saldo, e emite
// TABELA_CLASSIFICACAO_ATUALIZADA. É um PROCESSADOR DE REGRAS DE
// NEGÓCIO — NÃO toca o DOM (separação CQRS rígida). Depende de
// eventBus.js, carregado antes.
// =============================================================

// Temporada atual cuja tabela este ouvinte mantém (dada no registro).
let _temporadaClassificacao = null;

// Aplica o resultado de UMA partida na tabela e avisa a UI (via evento).
function avaliarClassificacao(payload) {
  if (!_temporadaClassificacao) return;

  const resultado = payload.resultado;
  const classificacao = _temporadaClassificacao.classificacao;

  const linhaVencedor = classificacao.find(
    (linha) => linha.organizacaoId === resultado.vencedorId
  );
  const linhaPerdedor = classificacao.find(
    (linha) => linha.organizacaoId === resultado.perdedorId
  );
  if (!linhaVencedor || !linhaPerdedor) return;

  // Jogos disputados (ambas as equipes).
  linhaVencedor.jogos += 1;
  linhaPerdedor.jogos += 1;

  if (resultado.empate) {
    // EMPATE (defensivo): 1 ponto para cada; saldo não muda (diferença 0).
    // Hoje o Módulo Esportivo sempre desempata, então este ramo é inerte.
    linhaVencedor.pontos += 1;
    linhaVencedor.empates += 1;
    linhaPerdedor.pontos += 1;
    linhaPerdedor.empates += 1;
  } else {
    // VITÓRIA (3) x DERROTA (0). Saldo = diferença de pontos da partida.
    const diferenca = resultado.pontuacaoVencedor - resultado.pontuacaoPerdedor;
    linhaVencedor.pontos += 3;
    linhaVencedor.vitorias += 1;
    linhaVencedor.saldoPontos += diferenca;
    linhaPerdedor.derrotas += 1;
    linhaPerdedor.saldoPontos -= diferenca;
  }

  // DISPARO DE ATUALIZAÇÃO: avisa que a tabela mudou (sem tocar a tela).
  // No próximo passo, a UI escutará isto e se redesenhará sozinha.
  EventBus.emit("TABELA_CLASSIFICACAO_ATUALIZADA", {
    temporadaId: _temporadaClassificacao.id,
    competicaoId: _temporadaClassificacao.competicaoId,
    ano: payload.ano,
  });
}

// Controle de registro único: chamadas repetidas (ex.: a cada nova
// temporada) apenas RE-APONTAM a temporada, sem duplicar o ouvinte no
// bus (o que dobraria a contagem de pontos).
let _classificacaoRegistrada = false;

// Registra o ouvinte, guardando a temporada atual (via parâmetro para
// não depender do estado da interface).
function iniciarOuvinteClassificacao(temporada) {
  _temporadaClassificacao = temporada;
  if (!_classificacaoRegistrada) {
    EventBus.on("PARTIDA_EQUIPES_FINALIZADA", avaliarClassificacao);
    _classificacaoRegistrada = true;
  }
}

// Teste isolado do Passo 24 — roda SÓ no Node (silencioso no browser/worker).
if (typeof window === "undefined" && typeof importScripts === "undefined") {
  const orgs = [gerarOrganizacao(), gerarOrganizacao()];
  const competicao = gerarCompeticao();
  inscreverEquipesNaCompeticao(orgs, competicao);
  const temporada = gerarTemporada(competicao.id, 2026);
  iniciarClassificacaoTemporada(temporada, competicao);

  let atualizacoes = 0;
  EventBus.on("TABELA_CLASSIFICACAO_ATUALIZADA", () => atualizacoes++);
  iniciarOuvinteClassificacao(temporada);

  for (let k = 0; k < 10; k++) {
    const r = simularPartidaEquipes(orgs[0], orgs[1]);
    r.ano = 2026;
    EventBus.emit("PARTIDA_EQUIPES_FINALIZADA", r);
  }

  const somaJogos = temporada.classificacao.reduce((a, l) => a + l.jogos, 0);
  const somaPontos = temporada.classificacao.reduce((a, l) => a + l.pontos, 0);
  const somaSaldo = temporada.classificacao.reduce((a, l) => a + l.saldoPontos, 0);
  console.log("10 partidas -> TABELA_CLASSIFICACAO_ATUALIZADA emitido:", atualizacoes);
  console.log("Soma jogos (deve ser 20):", somaJogos, "| soma pontos (deve ser 30):", somaPontos);
  console.log("Soma dos saldos (zero-soma, deve ser 0):", somaSaldo);
  console.log("Linha exemplo:", temporada.classificacao[0]);
}
