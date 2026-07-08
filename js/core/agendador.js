// =============================================================
// Núcleo (Core) — Agendador de Partidas
// Apêndice (pré-Passo 31): a cada dia, "puxa" as competições que
// têm rodada naquela data específica e dispara a simulação delas.
//
// Ouvinte PASSIVO de DIA_AVANCOU. Não conhece a matemática da
// partida (delega a simularRodadaCompeticao) e não toca o DOM.
//
// Depende de eventBus.js, calendario.js e gameLoop.js
// (simularRodadaCompeticao), carregados antes deste arquivo.
// =============================================================

// Referências das listas globais, fornecidas no registro.
let _competicoesAgenda = [];
let _organizacoesAgenda = [];

// A cada dia, verifica quais competições jogam HOJE (mês/dia batem
// com alguma data do seu calendarioRodadas) e simula a rodada.
function verificarJogosDoDia(payload) {
  const hoje = payload.data;

  _competicoesAgenda.forEach((competicao) => {
    const temRodadaHoje =
      Array.isArray(competicao.calendarioRodadas) &&
      competicao.calendarioRodadas.some(
        (rodada) => rodada.mes === hoje.mes && rodada.dia === hoje.dia
      );

    if (temRodadaHoje) {
      simularRodadaCompeticao(competicao, _organizacoesAgenda);
    }
  });
}

// Registra o Agendador no barramento. Chamar uma vez, no Big Bang.
function iniciarAgendador(competicoes, organizacoes) {
  _competicoesAgenda = competicoes;
  _organizacoesAgenda = organizacoes;
  EventBus.on("DIA_AVANCOU", verificarJogosDoDia);
}
