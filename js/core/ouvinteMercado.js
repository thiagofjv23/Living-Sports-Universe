// =============================================================
// Núcleo (Core) — Ouvinte de Mercado (Janela de Transferências)
// Passo 30 (Fase 3): clubes preenchem vagas com os melhores agentes
// livres — necessidade + meritocracia, sem sistema financeiro ainda.
//
// Ouvinte PASSIVO: escuta NOVA_FORNADA_GERADA. Monta a "vitrine" de
// agentes livres (atletas ativos sem contrato ativo), ordena por
// habilidade e distribui os melhores nas vagas de cada organização.
// Sem DOM. Depende de eventBus.js e fabricaContratos.js.
// =============================================================

const LIMITE_ELENCO = 5; // número ideal de atletas por organização (por agora)

// Referências das listas globais, fornecidas no registro.
let _atletasMercado = [];
let _contratosMercado = [];
let _organizacoesMercado = [];

// A Janela de Transferências.
function realizarMercado() {
  // A VITRINE: agentes livres = atletas ativos (ativo !== false) que
  // NÃO possuem um contrato ativo. Ordenados por habilidade (desc).
  const temContratoAtivo = (atletaId) =>
    _contratosMercado.some((c) => c.pessoaId === atletaId && c.ativo);

  const agentesLivres = _atletasMercado
    .filter((atleta) => atleta.ativo !== false && !temContratoAtivo(atleta.id))
    .sort((a, b) => b.habilidade - a.habilidade);

  let contratosAssinados = 0;

  // A NECESSIDADE: cada organização preenche suas vagas com o topo.
  _organizacoesMercado.forEach((organizacao) => {
    const contratosAtivos = _contratosMercado.filter(
      (c) => c.organizacaoId === organizacao.id && c.ativo
    ).length;
    const vagas = LIMITE_ELENCO - contratosAtivos;

    for (let v = 0; v < vagas && agentesLivres.length > 0; v++) {
      const contratado = agentesLivres.shift(); // o melhor disponível
      const contrato = gerarContrato(contratado.id, organizacao.id, anoAtual);
      contrato.anoFim = anoAtual + 3; // duração fixa: ano atual + 3
      _contratosMercado.push(contrato);
      contratado.organizacaoId = organizacao.id; // passa a integrar o elenco
      contratosAssinados++;
    }
  });

  // Atletas que sobraram permanecem desempregados (nada a fazer).
  EventBus.emit("MERCADO_ENCERRADO", { contratosAssinados: contratosAssinados });
}

// Registra o ouvinte. Chamar uma vez, no Big Bang.
function iniciarOuvinteMercado(atletas, contratos, organizacoes) {
  _atletasMercado = atletas;
  _contratosMercado = contratos;
  _organizacoesMercado = organizacoes;
  EventBus.on("NOVA_FORNADA_GERADA", realizarMercado);
}

// Teste isolado do Passo 30 — roda SÓ no Node (silencioso no browser/worker).
if (typeof window === "undefined" && typeof importScripts === "undefined") {
  const orgs = [gerarOrganizacao(), gerarOrganizacao()]; // 2 clubes

  const atletas = [];
  const contratos = [];
  // 3 atletas já empregados no clube 0 (3 contratos ativos -> 2 vagas lá).
  for (let i = 0; i < 3; i++) {
    const a = gerarAtleta();
    a.organizacaoId = orgs[0].id;
    atletas.push(a);
    contratos.push(gerarContrato(a.id, orgs[0].id, anoAtual));
  }
  // 8 agentes livres com habilidades 10,20,...,80.
  for (let i = 0; i < 8; i++) {
    const a = gerarAtleta();
    a.habilidade = 10 + i * 10;
    atletas.push(a);
  }

  let evt = [];
  EventBus.on("MERCADO_ENCERRADO", (p) => evt.push(p));
  iniciarOuvinteMercado(atletas, contratos, orgs);
  EventBus.emit("NOVA_FORNADA_GERADA", { quantidade: 15 });

  // clube0: 3 ativos -> 2 vagas; clube1: 0 -> 5 vagas; 7 vagas, 8 livres -> 7.
  const assinados = contratos.filter((c) => c.anoFim === anoAtual + 3);
  const livresRestantes = atletas.filter(
    (a) => !contratos.some((c) => c.pessoaId === a.id && c.ativo)
  );
  console.log("MERCADO_ENCERRADO:", JSON.stringify(evt));
  console.log("Contratos assinados (deve ser 7):", assinados.length);
  console.log("Agentes livres restantes (deve ser 1, o de habilidade 10):",
    livresRestantes.length, "| hab:", livresRestantes.map((a) => a.habilidade).join(","));
  console.log("Todos com anoFim = anoAtual+3?", assinados.every((c) => c.anoFim === anoAtual + 3));
  console.log("Passo 30 OK?",
    evt.length === 1 && evt[0].contratosAssinados === 7 &&
    livresRestantes.length === 1 && livresRestantes[0].habilidade === 10);
}
