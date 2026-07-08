// =============================================================
// Interface (UI) — Ouvinte de Notícias ("O Jornalista")
// Passo 22 (Fase 3): a ponte entre os eventos dramáticos do Núcleo
// e o feed visual efêmero.
//
// Vive na camada de UI (não no Núcleo) porque TRADUZ fatos técnicos
// em texto e dispara atualização de DOM (via adicionarNoticiaUI) —
// respeitando a diretriz de não misturar EventBus/DOM no Núcleo.
//
// O Jornalista é PASSIVO e "read-only": ele apenas escuta, LÊ os
// nomes nas listas globais e narra. NÃO altera dados, NÃO emite
// eventos e NÃO interfere no esporte.
//
// Depende de: eventBus.js, renderizador.js (adicionarNoticiaUI /
// renderizarFeedNoticias e as listas globais), carregados antes.
// =============================================================

// Resolve o nome real de um atleta pelo ID (leitura da lista global).
function buscarNomeAtleta(atletaId) {
  const atleta = atletasDoMundo.find((a) => a.id === atletaId);
  return atleta ? atleta.nome : "Atleta desconhecido";
}

// Resolve o nome real de uma organização pelo ID.
function buscarNomeOrganizacao(organizacaoId) {
  const organizacao = organizacoesDoMundo.find((o) => o.id === organizacaoId);
  return organizacao ? organizacao.nome : "equipe desconhecida";
}

// Registra o Jornalista no EventBus para escutar os dramas do universo
// e transformá-los em manchetes no feed. Chamar uma vez, no Big Bang.
function iniciarOuvinteNoticias() {
  // Drama 1: uma lesão grave.
  EventBus.on("ATLETA_LESIONADO_GRAVEMENTE", (payload) => {
    const nomeAtleta = buscarNomeAtleta(payload.atletaId);
    const nomeEquipe = buscarNomeOrganizacao(payload.organizacaoId);
    const manchete = `Plantão Médico: ${nomeAtleta} sofre lesão grave jogando pelo ${nomeEquipe}!`;
    adicionarNoticiaUI(manchete);
    renderizarFeedNoticias();
  });

  // Drama 2: uma rescisão de contrato.
  EventBus.on("CONTRATO_RESCINDIDO", (payload) => {
    const nomeAtleta = buscarNomeAtleta(payload.atletaId);
    const nomeEquipe = buscarNomeOrganizacao(payload.organizacaoId);
    const manchete = `BOMBA: ${nomeEquipe} rescinde o contrato de ${nomeAtleta} após grave lesão!`;
    adicionarNoticiaUI(manchete);
    renderizarFeedNoticias();
  });

  // Drama 3: um recorde histórico foi batido (o nome já vem no payload).
  EventBus.on("NOVO_RECORDE_QUEBRADO", (payload) => {
    let detalhe;
    if (payload.tipo === "MAIOR_PONTUACAO") {
      detalhe = `a maior pontuação de todos os tempos (${payload.valor})`;
    } else if (payload.tipo === "MAIOR_DIFERENCA") {
      detalhe = `a maior diferença de pontos da história (${payload.valor})`;
    } else if (payload.tipo === "MAIOR_SEQUENCIA") {
      detalhe = `a maior sequência de vitórias da história (${payload.valor} seguidas)`;
    } else if (payload.tipo === "MAIS_TITULOS") {
      detalhe = `o recorde de títulos (${payload.valor} conquistas)`;
    } else {
      detalhe = `um novo recorde (${payload.valor})`;
    }
    const manchete = `HISTÓRICO! ${payload.nomeEquipe} acaba de bater ${detalhe}!`;
    adicionarNoticiaUI(manchete);
    renderizarFeedNoticias();
  });

  // Drama 4: um veterano pendura as chuteiras.
  EventBus.on("ATLETA_REFORMADO", (payload) => {
    const nomeAtleta = buscarNomeAtleta(payload.atletaId);
    const manchete = `FIM DE UMA ERA! Aos ${payload.idade} anos, o veterano ${nomeAtleta} pendura as chuteiras!`;
    adicionarNoticiaUI(manchete);
    renderizarFeedNoticias();
  });

  // Drama 5: a nova geração chega ao mundo do esporte.
  EventBus.on("NOVA_FORNADA_GERADA", (payload) => {
    const manchete = `A nova geração chegou! ${payload.quantidade} jovens promessas entram no mundo do esporte.`;
    adicionarNoticiaUI(manchete);
    renderizarFeedNoticias();
  });

  // Drama 6: a janela de transferências fechou.
  EventBus.on("MERCADO_ENCERRADO", (payload) => {
    const manchete = `O Mercado Fechou! ${payload.contratosAssinados} novos contratos foram assinados pelos clubes.`;
    adicionarNoticiaUI(manchete);
    renderizarFeedNoticias();
  });
}
