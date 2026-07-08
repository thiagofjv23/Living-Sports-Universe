// =============================================================
// Núcleo (Core) — Ouvinte de Recordes (O Historiador)
// Passo 23/32/33 (Fase 3): mantém o "livro de recordes" do universo
// (valor + detentor + ano), semeado da história pré-jogo e atualizado
// ao vivo. Todos os recordes são DERIVADOS dos fatos (Event Sourcing).
//
// Recordes atuais:
//   - MAIOR_PONTUACAO  : maior pontuação numa partida (por fato)
//   - MAIOR_DIFERENCA  : maior goleada (por fato)
//   - MAIOR_SEQUENCIA  : mais vitórias seguidas (estado por equipe)
//   - MAIS_TITULOS     : mais campeonatos (campeão por ano, dos fatos)
//
// Ouvinte PASSIVO: não altera a simulação nem toca o DOM. O livro
// (recordesGlobais) é LIDO pela tela de recordes (CQRS).
// =============================================================

// O LIVRO DE RECORDES (estado legível pela UI). A tela itera este
// objeto, então NOVOS recordes aparecem sozinhos ao serem adicionados.
const recordesGlobais = {
  MAIOR_PONTUACAO: {
    rotulo: "Maior Pontuação numa Partida",
    valor: 0, nomeEquipe: "—", organizacaoId: null, ano: null,
  },
  MAIOR_DIFERENCA: {
    rotulo: "Maior Diferença de Pontos (goleada)",
    valor: 0, nomeEquipe: "—", organizacaoId: null, ano: null,
  },
  MAIOR_SEQUENCIA: {
    rotulo: "Maior Sequência de Vitórias",
    valor: 0, nomeEquipe: "—", organizacaoId: null, ano: null,
  },
  MAIS_TITULOS: {
    rotulo: "Mais Títulos (campeão da temporada)",
    valor: 0, nomeEquipe: "—", organizacaoId: null, ano: null,
  },
};

// Estados auxiliares (mantidos entre a semeadura e o tempo real).
let _sequenciaPorEquipe = {}; // organizacaoId -> vitórias seguidas atuais
let _titulosPorEquipe = {}; // organizacaoId -> nº de títulos

// Extrai do Pacote de Fatos os números e os competidores.
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
    perdedorId: resultado.perdedorId,
    ano: payload.ano,
  };
}

// Grava um novo recorde no livro e (se `emitir`) anuncia o evento.
function _registrarNovoRecorde(tipo, valor, nomeEquipe, organizacaoId, ano, emitir) {
  recordesGlobais[tipo].valor = valor;
  recordesGlobais[tipo].nomeEquipe = nomeEquipe;
  recordesGlobais[tipo].organizacaoId = organizacaoId;
  recordesGlobais[tipo].ano = ano;

  if (emitir) {
    EventBus.emit("NOVO_RECORDE_QUEBRADO", {
      id: crypto.randomUUID(),
      tipoEvento: "NOVO_RECORDE_QUEBRADO",
      tipo: tipo,
      organizacaoId: organizacaoId,
      nomeEquipe: nomeEquipe,
      valor: valor,
      ano: ano,
    });
  }
}

// Recordes de valor simples (por partida): pontuação e diferença.
function _atualizarRecordeValor(tipo, valor, dados, emitir) {
  if (valor > recordesGlobais[tipo].valor) {
    _registrarNovoRecorde(tipo, valor, dados.nomeVencedor, dados.vencedorId, dados.ano, emitir);
  }
}

// Sequência de vitórias: estado incremental por equipe. O vencedor
// soma +1; o perdedor zera; um "bye" não altera (não jogou).
function _processarSequencia(dados, emitir) {
  _sequenciaPorEquipe[dados.vencedorId] =
    (_sequenciaPorEquipe[dados.vencedorId] || 0) + 1;
  _sequenciaPorEquipe[dados.perdedorId] = 0;

  const sequencia = _sequenciaPorEquipe[dados.vencedorId];
  if (sequencia > recordesGlobais.MAIOR_SEQUENCIA.valor) {
    _registrarNovoRecorde(
      "MAIOR_SEQUENCIA", sequencia, dados.nomeVencedor, dados.vencedorId, dados.ano, emitir
    );
  }
}

// Avalia UMA partida contra os recordes por-partida e a sequência.
function avaliarRecordes(payload) {
  const dados = _extrairDadosPartida(payload);
  _atualizarRecordeValor("MAIOR_PONTUACAO", dados.pontuacao, dados, true);
  _atualizarRecordeValor("MAIOR_DIFERENCA", dados.diferenca, dados, true);
  _processarSequencia(dados, true);
}

// Descobre o CAMPEÃO de um ano lendo os fatos daquele ano (3 pts por
// vitória). Derivação pura do histórico — não depende da UI.
function _campeaoDoAno(ano) {
  const pontos = {};
  const nomes = {};

  memoriaHistorica.forEach((fato) => {
    if (fato.tipoEvento !== "PARTIDA_EQUIPES_FINALIZADA" || fato.ano !== ano) {
      return;
    }
    const vId = fato.resultado.vencedorId;
    const pId = fato.resultado.perdedorId;
    pontos[vId] = (pontos[vId] || 0) + 3;
    if (pontos[pId] === undefined) pontos[pId] = 0;
    nomes[fato.competidores.equipeA.id] = fato.competidores.equipeA.nome;
    nomes[fato.competidores.equipeB.id] = fato.competidores.equipeB.nome;
  });

  let campeaoId = null;
  let maior = -1;
  Object.keys(pontos).forEach((id) => {
    if (pontos[id] > maior) {
      maior = pontos[id];
      campeaoId = id;
    }
  });

  return campeaoId ? { id: campeaoId, nome: nomes[campeaoId] } : null;
}

// Contabiliza um título e verifica o recorde de mais títulos.
function _registrarTitulo(campeaoId, nome, ano, emitir) {
  _titulosPorEquipe[campeaoId] = (_titulosPorEquipe[campeaoId] || 0) + 1;
  const total = _titulosPorEquipe[campeaoId];
  if (total > recordesGlobais.MAIS_TITULOS.valor) {
    _registrarNovoRecorde("MAIS_TITULOS", total, nome, campeaoId, ano, emitir);
  }
}

// No fim de cada temporada, o campeão do ano encerrado ganha um título.
function avaliarTitulos(payload) {
  const campeao = _campeaoDoAno(payload.anoFinalizado);
  if (campeao) {
    _registrarTitulo(campeao.id, campeao.nome, payload.anoFinalizado, true);
  }
}

// Registra o Historiador e SEMEIA o livro a partir da história pré-jogo
// (sem emitir eventos — não queremos centenas de manchetes "HISTÓRICO!").
function iniciarOuvinteRecordes() {
  // Zera o livro e os estados auxiliares (importante ao reiniciar).
  Object.keys(recordesGlobais).forEach((tipo) => {
    recordesGlobais[tipo].valor = 0;
    recordesGlobais[tipo].nomeEquipe = "—";
    recordesGlobais[tipo].organizacaoId = null;
    recordesGlobais[tipo].ano = null;
  });
  _sequenciaPorEquipe = {};
  _titulosPorEquipe = {};

  // Semeia recordes por-partida + sequência (fatos em ordem cronológica).
  memoriaHistorica
    .filter((fato) => fato.tipoEvento === "PARTIDA_EQUIPES_FINALIZADA")
    .forEach((fato) => {
      const dados = _extrairDadosPartida(fato);
      _atualizarRecordeValor("MAIOR_PONTUACAO", dados.pontuacao, dados, false);
      _atualizarRecordeValor("MAIOR_DIFERENCA", dados.diferenca, dados, false);
      _processarSequencia(dados, false);
    });

  // Semeia títulos: campeão de cada ano da história.
  const anos = [
    ...new Set(
      memoriaHistorica
        .filter((f) => f.tipoEvento === "PARTIDA_EQUIPES_FINALIZADA")
        .map((f) => f.ano)
    ),
  ].sort((a, b) => a - b);
  anos.forEach((ano) => {
    const campeao = _campeaoDoAno(ano);
    if (campeao) _registrarTitulo(campeao.id, campeao.nome, ano, false);
  });

  EventBus.on("PARTIDA_EQUIPES_FINALIZADA", avaliarRecordes);
  EventBus.on("TEMPORADA_FINALIZADA", avaliarTitulos);
}

// Teste isolado — roda SÓ no Node (silencioso no browser/worker).
if (typeof window === "undefined" && typeof importScripts === "undefined") {
  const orgs = [gerarOrganizacao(), gerarOrganizacao()];
  iniciarOuvinteRecordes();
  for (let k = 0; k < 100; k++) {
    const r = simularPartidaEquipes(orgs[0], orgs[1]);
    r.ano = 2000;
    EventBus.emit("PARTIDA_EQUIPES_FINALIZADA", r);
  }
  EventBus.emit("TEMPORADA_FINALIZADA", { anoFinalizado: 2000, anoNovo: 2001 });
  console.log("Livro de recordes (4 categorias):");
  Object.keys(recordesGlobais).forEach((t) =>
    console.log(`  ${t}: ${recordesGlobais[t].valor} (${recordesGlobais[t].nomeEquipe})`)
  );
}
