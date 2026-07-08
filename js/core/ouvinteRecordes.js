// =============================================================
// Núcleo (Core) — Ouvinte de Recordes (O Historiador)
// Passo 23/32 (Fase 3): identifica quando a história é feita e mantém
// o "livro de recordes" do universo (valor + detentor + ano).
//
// Ouvinte PASSIVO e DERIVADO: escuta o fim das partidas de equipes,
// compara com os recordes vigentes e, se um for superado, ATUALIZA o
// livro e emite NOVO_RECORDE_QUEBRADO. Não altera a simulação nem toca
// o DOM. O livro (recordesGlobais) é LIDO pela tela de recordes (CQRS).
//
// Depende de eventBus.js e da memoriaHistorica, carregados antes.
// =============================================================

// O LIVRO DE RECORDES (estado legível pela UI). Cada entrada guarda o
// rótulo, o valor recorde, quem o detém (id + nome) e o ano.
const recordesGlobais = {
  MAIOR_PONTUACAO: {
    rotulo: "Maior Pontuação numa Partida",
    valor: 0,
    nomeEquipe: "—",
    organizacaoId: null,
    ano: null,
  },
  MAIOR_DIFERENCA: {
    rotulo: "Maior Diferença de Pontos (goleada)",
    valor: 0,
    nomeEquipe: "—",
    organizacaoId: null,
    ano: null,
  },
};

// Extrai do Pacote de Fatos os números e o vencedor (nome já vem no
// payload, em competidores).
function _extrairDadosPartida(payload) {
  const resultado = payload.resultado;
  const vencedorId = resultado.vencedorId;
  const nomeVencedor =
    payload.competidores.equipeA.id === vencedorId
      ? payload.competidores.equipeA.nome
      : payload.competidores.equipeB.nome;

  return {
    pontuacao: resultado.pontuacaoVencedor,
    diferenca: resultado.pontuacaoVencedor - resultado.pontuacaoPerdedor,
    nomeVencedor: nomeVencedor,
    vencedorId: vencedorId,
    ano: payload.ano,
  };
}

// Se `valor` supera o recorde do `tipo`, atualiza o livro e (se
// `emitir`) anuncia NOVO_RECORDE_QUEBRADO. Devolve true se quebrou.
function _atualizarRecorde(tipo, valor, dados, emitir) {
  if (valor <= recordesGlobais[tipo].valor) {
    return false;
  }
  recordesGlobais[tipo].valor = valor;
  recordesGlobais[tipo].nomeEquipe = dados.nomeVencedor;
  recordesGlobais[tipo].organizacaoId = dados.vencedorId;
  recordesGlobais[tipo].ano = dados.ano;

  if (emitir) {
    EventBus.emit("NOVO_RECORDE_QUEBRADO", {
      id: crypto.randomUUID(),
      tipoEvento: "NOVO_RECORDE_QUEBRADO",
      tipo: tipo,
      organizacaoId: dados.vencedorId,
      nomeEquipe: dados.nomeVencedor,
      valor: valor,
      ano: dados.ano,
    });
  }
  return true;
}

// Avalia uma partida recém-terminada contra os recordes vigentes.
function avaliarRecordes(payload) {
  const dados = _extrairDadosPartida(payload);
  _atualizarRecorde("MAIOR_PONTUACAO", dados.pontuacao, dados, true);
  _atualizarRecorde("MAIOR_DIFERENCA", dados.diferenca, dados, true);
}

// Registra o Historiador. Antes de vigiar o futuro, SEMEIA o livro a
// partir da história já arquivada (pré-jogo) — sem emitir eventos (não
// queremos 150 manchetes "HISTÓRICO!"). Assim a tela já abre com os
// recordes de todas as épocas.
function iniciarOuvinteRecordes() {
  // Zera o livro (importante ao reiniciar o mundo).
  recordesGlobais.MAIOR_PONTUACAO.valor = 0;
  recordesGlobais.MAIOR_PONTUACAO.nomeEquipe = "—";
  recordesGlobais.MAIOR_PONTUACAO.organizacaoId = null;
  recordesGlobais.MAIOR_PONTUACAO.ano = null;
  recordesGlobais.MAIOR_DIFERENCA.valor = 0;
  recordesGlobais.MAIOR_DIFERENCA.nomeEquipe = "—";
  recordesGlobais.MAIOR_DIFERENCA.organizacaoId = null;
  recordesGlobais.MAIOR_DIFERENCA.ano = null;

  memoriaHistorica
    .filter((fato) => fato.tipoEvento === "PARTIDA_EQUIPES_FINALIZADA")
    .forEach((fato) => {
      const dados = _extrairDadosPartida(fato);
      _atualizarRecorde("MAIOR_PONTUACAO", dados.pontuacao, dados, false);
      _atualizarRecorde("MAIOR_DIFERENCA", dados.diferenca, dados, false);
    });

  EventBus.on("PARTIDA_EQUIPES_FINALIZADA", avaliarRecordes);
}

// Teste isolado do Passo 23/32 — roda SÓ no Node (silencioso no browser/worker).
if (typeof window === "undefined" && typeof importScripts === "undefined") {
  const orgs = [gerarOrganizacao(), gerarOrganizacao()];

  let recordes = 0;
  EventBus.on("NOVO_RECORDE_QUEBRADO", () => recordes++);

  iniciarOuvinteRecordes(); // semeia de uma memória vazia (recordes = 0)

  for (let k = 0; k < 100; k++) {
    EventBus.emit(
      "PARTIDA_EQUIPES_FINALIZADA",
      simularPartidaEquipes(orgs[0], orgs[1])
    );
  }
  console.log("100 partidas -> eventos NOVO_RECORDE_QUEBRADO:", recordes, "(deve ser baixo)");
  console.log("Livro de recordes:", JSON.stringify(recordesGlobais, null, 2));
}
