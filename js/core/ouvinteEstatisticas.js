// =============================================================
// Núcleo (Core) — Ouvinte de Estatísticas
// Passo 14 (Fase 2): projeta o resultado das partidas de equipes
// na tabela de classificação da temporada (Event Sourcing / CQRS).
//
// Este ouvinte é uma PROJEÇÃO: ele escuta o fato imutável
// (PARTIDA_EQUIPES_FINALIZADA) e atualiza um "resumo" derivado
// (a classificacao). Ele NÃO calcula partidas (isso é do Módulo
// Esportivo) e NÃO desenha nada (isso é do renderizador).
//
// Depende de eventBus.js, carregado antes deste arquivo.
// =============================================================

// Função pura: aplica o resultado de UMA partida na classificação.
// Só age se o payload for do tipo esperado; caso contrário, ignora.
function atualizarClassificacaoTemporada(payload, temporada) {
  if (payload.tipoEvento !== "PARTIDA_EQUIPES_FINALIZADA") {
    return temporada.classificacao;
  }

  // Registra o rastro da partida na temporada: guarda apenas o ID do
  // jogo (normalização) — o fato completo vive na Memória Histórica.
  temporada.jogos.push(payload.id);

  const { vencedorId, perdedorId } = payload.resultado;

  // Encontra as linhas da tabela pelos IDs (mesma chave que usamos
  // ao inicializar a classificação no Passo 12).
  const linhaVencedor = temporada.classificacao.find(
    (linha) => linha.organizacaoId === vencedorId
  );
  const linhaPerdedor = temporada.classificacao.find(
    (linha) => linha.organizacaoId === perdedorId
  );

  // Atualiza os números (vitória vale 3 pontos; derrota não pontua).
  if (linhaVencedor) {
    linhaVencedor.pontos += 3;
    linhaVencedor.vitorias += 1;
  }
  if (linhaPerdedor) {
    linhaPerdedor.derrotas += 1;
  }

  return temporada.classificacao;
}

// Registra o ouvinte no EventBus, "amarrando" a temporada via closure.
// Assim o barramento entrega só o payload, mas o ouvinte sabe qual
// tabela deve atualizar. Chamar uma vez por temporada ativa.
function registrarOuvinteEstatisticas(temporada) {
  EventBus.on("PARTIDA_EQUIPES_FINALIZADA", (payload) =>
    atualizarClassificacaoTemporada(payload, temporada)
  );
}

// Teste isolado do Passo 14 — roda SÓ fora do navegador (ex.: Node).
if (typeof window === "undefined") {
  // 1) 2 equipes inscritas numa competição + temporada com tabela zerada.
  const orgs = [gerarOrganizacao(), gerarOrganizacao()];
  const competicao = gerarCompeticao();
  inscreverEquipesNaCompeticao(orgs, competicao);
  const temporada = gerarTemporada(competicao.id, 2024);
  iniciarClassificacaoTemporada(temporada, competicao);

  // 2) Liga o ouvinte ao EventBus (amarrado a esta temporada).
  registrarOuvinteEstatisticas(temporada);

  // 3) Simula a partida e dispara o resultado no EventBus.
  //    O ouvinte escuta e atualiza a tabela sozinho.
  const resultado = simularPartidaEquipes(orgs[0], orgs[1]);
  EventBus.emit("PARTIDA_EQUIPES_FINALIZADA", resultado);

  console.log("Classificação após 1 partida:");
  console.log(temporada.classificacao);
}
