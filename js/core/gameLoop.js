// =============================================================
// Núcleo (Core) — Game Loop (Orquestrador) + Ciclo de Tempo
// Passos 3/4/5 do MVP: junta as peças de LÓGICA e faz o universo
// evoluir no tempo.
//
// O gameLoop é o maestro: controla o TEMPO (rodadaAtual), GERA
// entidades, pede ao módulo esportivo para simular, carimba a
// rodada no fato e PUBLICA no EventBus. Ele NÃO grava na memória
// diretamente (isso é do ouvinteHistorico) e NÃO desenha nada na
// tela (isso é do renderizador). Aqui não há DOM.
//
// Depende (nesta ordem de carregamento) de:
//   fabricaRegens.js -> moduloBasico.js -> eventBus.js -> memoriaHistorica.js
// =============================================================

// Relógio do universo: em que rodada o mundo está agora.
let rodadaAtual = 1;

// Sorteia um atleta qualquer de uma lista.
function sortearAtleta(atletas) {
  return atletas[Math.floor(Math.random() * atletas.length)];
}

// Simula UM confronto e publica o fato no EventBus.
// O módulo esportivo (agnóstico) devolve o Pacote de Fatos; aqui o
// Núcleo carimba a rodada atual (o "quando" do universo) antes de
// emitir. Ponto único por onde as partidas entram na história.
function simularConfronto(atletaA, atletaB) {
  const resultadoDaPartida = simularPartida(atletaA, atletaB);
  resultadoDaPartida.rodada = rodadaAtual;
  EventBus.emit("PARTIDA_FINALIZADA", resultadoDaPartida);
}

// Gera o "mundo" inicial: cria N atletas e simula M partidas
// aleatórias entre eles (todas na rodada 1). Devolve a lista de
// atletas para a interface apenas LÊ-la ao montar o menu.
function gerarMundo(quantidadeAtletas, quantidadePartidas) {
  const atletas = [];
  for (let i = 0; i < quantidadeAtletas; i++) {
    atletas.push(gerarAtleta());
  }

  for (let i = 0; i < quantidadePartidas; i++) {
    const atletaA = sortearAtleta(atletas);
    let atletaB = sortearAtleta(atletas);
    while (atletaB === atletaA) {
      atletaB = sortearAtleta(atletas);
    }
    simularConfronto(atletaA, atletaB);
  }

  return atletas;
}

// Avança o tempo em uma rodada: embaralha os atletas em duplas
// aleatórias e simula cada confronto. Cada partida é publicada no
// EventBus (que alimenta a memoriaHistorica). Se o número de
// atletas for ímpar, um deles folga na rodada (bye).
function simularRodada(atletas) {
  rodadaAtual++;

  // Cópia embaralhada (Fisher–Yates) para não alterar a lista original.
  const embaralhados = [...atletas];
  for (let i = embaralhados.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [embaralhados[i], embaralhados[j]] = [embaralhados[j], embaralhados[i]];
  }

  // Forma duplas com atletas consecutivos e simula cada confronto.
  for (let i = 0; i + 1 < embaralhados.length; i += 2) {
    simularConfronto(embaralhados[i], embaralhados[i + 1]);
  }
}

// Passo 7 — Lógica relacional: vincula cada atleta a uma organização.
// NORMALIZAÇÃO: grava apenas o `organizacaoId` (o id da organização
// sorteada), NUNCA o objeto inteiro da organização dentro do atleta.
// Assim o atleta guarda só a "chave estrangeira", e os dados da
// organização vivem em um único lugar (a lista de organizações).
function distribuirAtletasNasOrganizacoes(listaAtletas, listaOrganizacoes) {
  listaAtletas.forEach((atleta) => {
    const organizacaoSorteada =
      listaOrganizacoes[Math.floor(Math.random() * listaOrganizacoes.length)];
    atleta.organizacaoId = organizacaoSorteada.id;
  });
  return listaAtletas;
}

// Passo 15.5 — Simula UMA rodada da competição: forma duplas
// aleatórias entre as EQUIPES participantes e emite o resultado de
// cada confronto no EventBus (o ouvinte de estatísticas projeta na
// classificação). Sem DOM aqui. Incrementa o relógio do universo.
// Se o número de equipes for ímpar, uma folga na rodada (bye).
function simularRodadaCompeticao(competicao, organizacoes) {
  rodadaAtual++;

  // Resolve os IDs dos participantes -> objetos de organização.
  const equipes = competicao.participantes
    .map((id) => organizacoes.find((org) => org.id === id))
    .filter((org) => org);

  // Cópia embaralhada (Fisher–Yates) para formar duplas aleatórias.
  const embaralhadas = [...equipes];
  for (let i = embaralhadas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [embaralhadas[i], embaralhadas[j]] = [embaralhadas[j], embaralhadas[i]];
  }

  // Forma duplas consecutivas, simula e publica cada confronto.
  for (let i = 0; i + 1 < embaralhadas.length; i += 2) {
    const resultado = simularPartidaEquipes(embaralhadas[i], embaralhadas[i + 1]);
    EventBus.emit("PARTIDA_EQUIPES_FINALIZADA", resultado);
  }
}

// Passo 10 — Inscrição: registra organizações numa competição.
// NORMALIZAÇÃO: empurra apenas os IDs das organizações para dentro
// de competicao.participantes, nunca os objetos inteiros.
function inscreverEquipesNaCompeticao(listaOrganizacoes, competicao) {
  listaOrganizacoes.forEach((organizacao) => {
    competicao.participantes.push(organizacao.id);
  });
  return competicao;
}

// Passo 12 — Inicializa a tabela de classificação de uma temporada.
// Percorre os IDs em competicao.participantes e, para cada um, cria
// uma LINHA de estatísticas zerada na classificacao da temporada.
// NORMALIZAÇÃO: guarda só o organizacaoId + os números, nunca o
// objeto completo da organização.
function iniciarClassificacaoTemporada(temporada, competicao) {
  competicao.participantes.forEach((organizacaoId) => {
    temporada.classificacao.push({
      organizacaoId: organizacaoId,
      pontos: 0,
      vitorias: 0,
      derrotas: 0,
    });
  });
  return temporada.classificacao;
}

// Teste isolado do Passo 7 — roda SÓ fora do navegador (ex.: Node).
// No browser, `window` existe, então o bloco é ignorado: nada polui
// o console do app nem quebra se as fábricas não estiverem ligadas.
if (typeof window === "undefined") {
  const organizacoesTeste = [gerarOrganizacao(), gerarOrganizacao()];

  const atletasTeste = [];
  for (let i = 0; i < 6; i++) {
    atletasTeste.push(gerarAtleta());
  }

  distribuirAtletasNasOrganizacoes(atletasTeste, organizacoesTeste);
  console.log(atletasTeste);
}

// Teste isolado do Passo 12 — também Node-only (silencioso no browser).
if (typeof window === "undefined") {
  // 1) Organizações inscritas em uma competição (Passo 10).
  const orgsClassif = [gerarOrganizacao(), gerarOrganizacao(), gerarOrganizacao()];
  const competicaoClassif = gerarCompeticao();
  inscreverEquipesNaCompeticao(orgsClassif, competicaoClassif);

  // 2) Temporada ligada a essa competição (Passo 11).
  const temporadaClassif = gerarTemporada(competicaoClassif.id, 2024);

  // 3) Inicializa a tabela de classificação (Passo 12).
  iniciarClassificacaoTemporada(temporadaClassif, competicaoClassif);

  console.log("Classificação inicial da temporada:");
  console.log(temporadaClassif.classificacao);
}
