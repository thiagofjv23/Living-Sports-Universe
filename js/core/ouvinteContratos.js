// =============================================================
// Núcleo (Core) — Ouvinte de Contratos (Rescisões por Lesão)
// Passo 20 (Fase 3): o EFEITO DOMINÓ do Pub/Sub.
//
// Ouvinte PASSIVO: reage a ATLETA_LESIONADO_GRAVEMENTE (emitido pelo
// ouvinteSaude) e, com certa probabilidade, rescinde o contrato do
// atleta — emitindo um NOVO evento (CONTRATO_RESCINDIDO).
//
// Ele não sabe COMO a lesão aconteceu; só reage ao fato. Depende de
// eventBus.js, carregado antes deste arquivo.
// =============================================================

// Lista de contratos do mundo, fornecida no registro (o EventBus só
// entrega o payload; a base de contratos vem por aqui).
let _contratosParaRescisao = [];

// Função pura/passiva: avalia a rescisão após uma lesão grave.
function avaliarRescisaoPorLesao(payload) {
  const { atletaId, organizacaoId } = payload;

  // Busca o contrato ATIVO daquele atleta com aquela organização.
  const contrato = _contratosParaRescisao.find(
    (c) =>
      c.pessoaId === atletaId &&
      c.organizacaoId === organizacaoId &&
      c.ativo
  );
  if (!contrato) {
    return; // sem contrato ativo, não há o que rescindir
  }

  // O DADO DA DECISÃO: 1 a 100. 30% de chance de a equipe rescindir.
  const dado = Math.floor(Math.random() * 100) + 1;
  if (dado > 30) {
    return; // a equipe decide manter o jogador afastado
  }

  // Rescisão: desativa o contrato e encerra no ano atual (o da lesão).
  contrato.ativo = false;
  contrato.anoFim = payload.ano;

  // O DISPARO EM CADEIA: um fato gera outro fato.
  EventBus.emit("CONTRATO_RESCINDIDO", {
    id: crypto.randomUUID(),
    tipoEvento: "CONTRATO_RESCINDIDO",
    atletaId: atletaId,
    organizacaoId: organizacaoId,
    motivo: "lesao_grave",
    ano: payload.ano,
  });
}

// Registra o ouvinte no barramento, guardando a base de contratos.
function registrarOuvinteContratos(contratos) {
  _contratosParaRescisao = contratos;
  EventBus.on("ATLETA_LESIONADO_GRAVEMENTE", avaliarRescisaoPorLesao);
}

// Teste isolado do Passo 20 — roda SÓ no Node (silencioso no browser/worker).
if (typeof window === "undefined" && typeof importScripts === "undefined") {
  const org = gerarOrganizacao();

  // 200 atletas do clube, cada um com um contrato ATIVO.
  const contratos = [];
  const atletas = [];
  for (let i = 0; i < 200; i++) {
    const atleta = gerarAtleta();
    atleta.organizacaoId = org.id;
    atletas.push(atleta);
    contratos.push(gerarContrato(atleta.id, org.id, 2026));
  }

  registrarOuvinteContratos(contratos);

  // Dispara uma lesão grave para CADA atleta e conta as rescisões.
  let rescisoes = 0;
  EventBus.on("CONTRATO_RESCINDIDO", () => rescisoes++);
  atletas.forEach((atleta) => {
    EventBus.emit("ATLETA_LESIONADO_GRAVEMENTE", {
      tipoEvento: "ATLETA_LESIONADO_GRAVEMENTE",
      atletaId: atleta.id,
      organizacaoId: org.id,
      ano: 2026,
    });
  });

  const inativos = contratos.filter((c) => !c.ativo);
  const arquivadas = memoriaHistorica.filter(
    (f) => f.tipoEvento === "CONTRATO_RESCINDIDO"
  );
  console.log("Lesões disparadas: 200 | rescisões:", rescisoes, "(~30% esperado)");
  console.log("Contratos inativados:", inativos.length, "| arquivados na memória:", arquivadas.length);
  console.log("Exemplo de rescisão:", arquivadas[0]);
  console.log("Contrato inativado (anoFim == 2026?):", inativos[0] && inativos[0].anoFim);
}
