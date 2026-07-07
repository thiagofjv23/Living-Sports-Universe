// =============================================================
// Núcleo (Core) — Ouvinte de Recordes (O Historiador)
// Passo 23 (Fase 3): identifica ativamente quando a história é feita.
//
// Ouvinte PASSIVO e DERIVADO: escuta o fim das partidas de equipes,
// compara com os recordes conhecidos e, se um for superado, emite
// NOVO_RECORDE_QUEBRADO. Ele NÃO altera a simulação nem a matemática
// da partida — só observa e deriva uma informação nova.
//
// Fica em js/core/ por ser lógica pura (não toca DOM). Depende de
// eventBus.js e da memoriaHistorica, carregados antes.
// =============================================================

// Registro interno dos recordes (o "livro de recordes" do universo).
let _recordeMaiorPontuacao = 0; // maior pontuação de uma equipe numa partida
let _recordeMaiorDiferenca = 0; // maior diferença de pontos numa vitória

// Avalia uma partida recém-terminada contra os recordes vigentes.
function avaliarRecordes(payload) {
  const resultado = payload.resultado;
  const vencedorId = resultado.vencedorId;

  // O nome do vencedor já vem no próprio payload (competidores).
  const nomeVencedor =
    payload.competidores.equipeA.id === vencedorId
      ? payload.competidores.equipeA.nome
      : payload.competidores.equipeB.nome;

  // Recorde 1 — Maior Pontuação já Alcançada por uma Equipe.
  if (resultado.pontuacaoVencedor > _recordeMaiorPontuacao) {
    _recordeMaiorPontuacao = resultado.pontuacaoVencedor;
    EventBus.emit("NOVO_RECORDE_QUEBRADO", {
      id: crypto.randomUUID(),
      tipoEvento: "NOVO_RECORDE_QUEBRADO",
      tipo: "MAIOR_PONTUACAO",
      organizacaoId: vencedorId,
      nomeEquipe: nomeVencedor,
      valor: resultado.pontuacaoVencedor,
      ano: payload.ano,
    });
  }

  // Recorde 2 — Vitória com Maior Diferença de Pontos.
  const diferenca = resultado.pontuacaoVencedor - resultado.pontuacaoPerdedor;
  if (diferenca > _recordeMaiorDiferenca) {
    _recordeMaiorDiferenca = diferenca;
    EventBus.emit("NOVO_RECORDE_QUEBRADO", {
      id: crypto.randomUUID(),
      tipoEvento: "NOVO_RECORDE_QUEBRADO",
      tipo: "MAIOR_DIFERENCA",
      organizacaoId: vencedorId,
      nomeEquipe: nomeVencedor,
      valor: diferenca,
      ano: payload.ano,
    });
  }
}

// Registra o Historiador. Antes de vigiar o futuro, SEMEIA os recordes
// a partir da história já arquivada (senão a 1ª partida do presente
// "quebraria" tudo partindo de zero).
function iniciarOuvinteRecordes() {
  _recordeMaiorPontuacao = 0;
  _recordeMaiorDiferenca = 0;

  memoriaHistorica
    .filter((fato) => fato.tipoEvento === "PARTIDA_EQUIPES_FINALIZADA")
    .forEach((fato) => {
      const r = fato.resultado;
      _recordeMaiorPontuacao = Math.max(_recordeMaiorPontuacao, r.pontuacaoVencedor);
      _recordeMaiorDiferenca = Math.max(
        _recordeMaiorDiferenca,
        r.pontuacaoVencedor - r.pontuacaoPerdedor
      );
    });

  EventBus.on("PARTIDA_EQUIPES_FINALIZADA", avaliarRecordes);
}

// Teste isolado do Passo 23 — roda SÓ no Node (silencioso no browser/worker).
if (typeof window === "undefined" && typeof importScripts === "undefined") {
  const orgs = [gerarOrganizacao(), gerarOrganizacao()];

  let recordes = 0;
  EventBus.on("NOVO_RECORDE_QUEBRADO", () => recordes++);

  iniciarOuvinteRecordes(); // semeia de uma memória vazia (recordes = 0)

  // 100 partidas: recordes devem ser quebrados POUCAS vezes (decrescente),
  // não a cada jogo — provando que o registro interno funciona.
  for (let k = 0; k < 100; k++) {
    EventBus.emit(
      "PARTIDA_EQUIPES_FINALIZADA",
      simularPartidaEquipes(orgs[0], orgs[1])
    );
  }
  console.log("100 partidas -> eventos NOVO_RECORDE_QUEBRADO:", recordes, "(deve ser baixo)");
}
