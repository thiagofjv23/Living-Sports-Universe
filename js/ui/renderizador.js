// =============================================================
// Interface (UI) — Renderizador
// Passo 8 (Fase 2): a "Wikipédia Relacional".
//
// Princípio CQRS (Documento Mestre): este arquivo APENAS LÊ as
// listas do mundo e a memoriaHistorica para desenhar a tela. Ele
// NUNCA altera os dados e NUNCA emite eventos — a geração do mundo
// (lógica + emit) fica no gameLoop.js, no Núcleo.
//
// Depende de: gameLoop.js (gerarMundo/distribuir...), fabricaRegens,
// fabricaOrganizacoes, memoriaHistorica (leitura) e do DOM.
// =============================================================

// Listas de leitura do mundo atual (a UI só consulta; a verdade dos
// FATOS continua na memoriaHistorica).
let atletasDoMundo = [];
let organizacoesDoMundo = [];
let competicoesGlobais = [];
let temporadasGlobais = [];
let contratosGlobais = [];

// Feed de notícias EFÊMERAS (só exibição; NÃO é a Memória Histórica).
// Guarda no máximo as 10 manchetes mais recentes.
let noticiasEfemerias = [];

// Estado da INTERFACE: uma função que sabe redesenhar a página que
// está aberta agora. Cada abrirPaginaX() a define. Assim, ao avançar
// o tempo, recarregamos a tela atual (seja ela de atleta, organização
// ou competição) para refletir os novos dados. null = nada aberto.
let recarregarPaginaAtual = null;

// Ponto de entrada: cria as entidades, dispara a história pesada em
// background (Web Worker) mostrando progresso, e só desenha a
// Wikipédia quando a simulação termina.
function iniciarMundo() {
  // --- LIMPEZA DE ESTADO: o universo nasce do zero absoluto. ---
  memoriaHistorica.length = 0; // zera a Memória Histórica
  reiniciarCalendario(); // relógio volta a 01/01 do ano presente
  recarregarPaginaAtual = null; // nenhuma página aberta
  contratosGlobais = []; // zera a base de contratos
  noticiasEfemerias = []; // zera o feed de notícias
  renderizarFeedNoticias(); // limpa o painel na tela
  document.getElementById("lista-competicoes").innerHTML = "";
  document.getElementById("lista-atletas").innerHTML = "";
  document.getElementById("lista-organizacoes").innerHTML = "";
  document.getElementById("pagina-principal").innerHTML = "";
  // -------------------------------------------------------------

  // Gera 3 organizações e 12 atletas (funções do Núcleo).
  organizacoesDoMundo = [];
  for (let i = 0; i < 3; i++) {
    organizacoesDoMundo.push(gerarOrganizacao());
  }

  atletasDoMundo = [];
  for (let i = 0; i < 12; i++) {
    atletasDoMundo.push(gerarAtleta());
  }

  // Conecta cada atleta a uma organização (grava só o organizacaoId).
  distribuirAtletasNasOrganizacoes(atletasDoMundo, organizacoesDoMundo);

  // Formaliza o vínculo de cada atleta com sua organização num Contrato
  // (Passo 18 integrado). Guarda a base para o ouvinte de contratos.
  contratosGlobais = atletasDoMundo.map((atleta) =>
    gerarContrato(atleta.id, atleta.organizacaoId, anoAtual)
  );

  // Gera 1 competição e inscreve TODAS as organizações nela
  // (guarda só os IDs das equipes em competicao.participantes).
  const competicao = gerarCompeticao();
  inscreverEquipesNaCompeticao(organizacoesDoMundo, competicao);
  // Define em quais dias do ano esta competição tem rodada.
  competicao.calendarioRodadas = gerarCalendarioRodadas(RODADAS_POR_TEMPORADA);
  competicoesGlobais = [competicao];

  // Mostra a tela de carregamento enquanto a história é simulada.
  mostrarCarregando("Construindo o universo...");

  // A REGRA DO ANO 50, agora FORA da main thread (Web Worker): simula
  // as temporadas passadas (1976..2025) com feedback de progresso.
  // Quando terminar, monta a temporada atual e desenha — uma única vez.
  const anoInicialHistoria = ANO_PRESENTE - ANOS_DE_HISTORIA; // 1976
  simularHistoriaEmBackground(
    competicao,
    organizacoesDoMundo,
    ANOS_DE_HISTORIA,
    anoInicialHistoria,
    () => finalizarBigBang(competicao)
  );
}

// Dispara a simulação pesada em background. Tenta usar um Web Worker
// (main thread livre + progresso); se o Worker não estiver disponível
// (ex.: abrir o arquivo via file://), cai num fallback SÍNCRONO para o
// app nunca ficar preso na tela de loading.
function simularHistoriaEmBackground(competicao, organizacoes, totalAnos, anoInicial, aoConcluir) {
  let worker = null;
  try {
    worker = new Worker("js/core/workerSimulacao.js?v=" + versaoAssets());
  } catch (erro) {
    worker = null;
  }

  // Fallback: sem Worker, roda a versão síncrona do Núcleo e conclui.
  if (!worker) {
    atualizarCarregando("Construindo o universo... (modo simples)");
    simularHistoriaPrevia(totalAnos, competicao, organizacoes, anoInicial);
    aoConcluir();
    return;
  }

  worker.onmessage = (evento) => {
    const mensagem = evento.data;
    if (mensagem.tipo === "progresso") {
      atualizarCarregando(
        `Construindo o universo... Temporada ${mensagem.anoSimulado} (${mensagem.indice}/${mensagem.total})`
      );
    } else if (mensagem.tipo === "concluido") {
      // Traz os fatos gerados no worker para a Memória Histórica local.
      mensagem.dados.forEach((fato) => memoriaHistorica.push(fato));
      worker.terminate();
      aoConcluir();
    }
  };

  // Se o worker falhar em tempo de execução, também cai no fallback.
  worker.onerror = () => {
    worker.terminate();
    simularHistoriaPrevia(totalAnos, competicao, organizacoes, anoInicial);
    aoConcluir();
  };

  worker.postMessage({ competicao, organizacoes, totalAnos, anoInicial });
}

// Finaliza o "Big Bang": cria a temporada atual, registra o ouvinte de
// estatísticas, remove o loading e desenha a Wikipédia (render único).
function finalizarBigBang(competicao) {
  // Temporada ATUAL (presente = ANO_PRESENTE) com tabela zerada. O
  // ouvinte é registrado só agora, depois da história, para o passado
  // não somar pontos no presente.
  const temporada = gerarTemporada(competicao.id, anoAtual);
  iniciarClassificacaoTemporada(temporada, competicao);
  temporadasGlobais = [temporada];

  // Registra os ouvintes do PRESENTE (reagem aos jogos do "Avançar").
  // Ordem não importa: todos escutam o mesmo barramento de forma
  // independente (Pub/Sub).
  iniciarOuvinteClassificacao(temporada); // tabela viva 3/1/0 (Passo 24)
  registrarOuvinteSaude(atletasDoMundo); // lesões graves (Passo 19)
  registrarOuvinteContratos(contratosGlobais); // rescisões (Passo 20)
  iniciarOuvinteRecordes(); // recordes históricos (Passo 23) — semeia da história
  iniciarOuvinteEnvelhecimento(atletasDoMundo); // idade +1 a cada ano (Passo 26)
  iniciarOuvinteDeclinio(atletasDoMundo); // 32+ perde habilidade (Passo 27)
  iniciarOuvinteReforma(atletasDoMundo); // aposentadorias (Passo 28)
  iniciarOuvinteReposicao(atletasDoMundo); // fornada anual de jovens (Passo 29)
  iniciarOuvinteMercado(atletasDoMundo, contratosGlobais, organizacoesDoMundo); // janela de transferências (Passo 30)
  iniciarOuvinteNoticias(); // manchetes na tela (Passo 22)

  // CALENDÁRIO: o Agendador escuta cada dia e simula as competições
  // que têm rodada naquela data. O tempo avança dia a dia (avancarUmDia).
  iniciarAgendador(competicoesGlobais, organizacoesDoMundo);

  // VIRADA DE TEMPORADA: quando o calendário anuncia TEMPORADA_FINALIZADA,
  // a UI cria a temporada do ano novo (tabela zerada), re-aponta o
  // ouvinte de classificação e atualiza o que estiver na tela.
  EventBus.on("TEMPORADA_FINALIZADA", (payload) => {
    const comp = competicoesGlobais[0];
    if (!comp) return;
    const novaTemporada = gerarTemporada(comp.id, anoAtual);
    iniciarClassificacaoTemporada(novaTemporada, comp);
    iniciarOuvinteClassificacao(novaTemporada); // re-aponta (registro único)
    temporadasGlobais = [novaTemporada];
    atualizarDisplayTempo();
    adicionarNoticiaUI(
      `Temporada ${payload.anoFinalizado} encerrada! Começa a temporada ${payload.anoNovo}.`
    );
    // Se a página da competição estiver aberta, redesenha com o novo ano.
    if (document.getElementById("area-classificacao")) {
      abrirPaginaCompeticao(comp.id);
    }
  });

  // ELO REATIVO (Passo 25): quando o Núcleo avisa que a tabela mudou,
  // a UI apenas OBEDECE e redesenha (só se a página estiver aberta).
  EventBus.on("TABELA_CLASSIFICACAO_ATUALIZADA", (payload) => {
    const temporadaDoEvento = temporadasGlobais.find(
      (t) => t.id === payload.temporadaId
    );
    renderizarTabelaClassificacao(temporadaDoEvento);
  });

  desenharMenuLateral();
  atualizarDisplayTempo();
  atualizarBadgeMetadados();
  document.getElementById("btn-avancar").addEventListener("click", avancarTempo);

  // Remove o loading e mostra a dica inicial.
  document.getElementById("pagina-principal").innerHTML =
    '<p class="dica">← Selecione um item no menu para explorar o universo.</p>';
}

// Insere uma manchete no TOPO do feed efêmero e mantém no máximo 10
// (descarta a mais antiga com .pop()). Redesenha o painel em seguida.
function adicionarNoticiaUI(mensagem) {
  noticiasEfemerias.unshift(mensagem);
  if (noticiasEfemerias.length > 10) {
    noticiasEfemerias.pop();
  }
  renderizarFeedNoticias();
}

// Desenha o painel de notícias (leitura pura do array efêmero).
function renderizarFeedNoticias() {
  const painel = document.getElementById("feed-noticias");
  if (!painel) return;

  if (noticiasEfemerias.length === 0) {
    painel.innerHTML = "";
    return;
  }

  const itens = noticiasEfemerias
    .map((mensagem) => `<li>${mensagem}</li>`)
    .join("");
  painel.innerHTML = `
    <h2>📰 Últimas Notícias</h2>
    <ul class="lista-noticias">${itens}</ul>
  `;
}

// Badge discreto no menu: cronologia do universo + volume de fatos.
function atualizarBadgeMetadados() {
  const anoInicioHistoria = ANO_PRESENTE - ANOS_DE_HISTORIA; // 1976
  document.getElementById("badge-metadados").textContent =
    `🏛️ Universo Ativo: História simulada desde ${anoInicioHistoria} (${memoriaHistorica.length} fatos arquivados)`;
}

// Mostra a tela de carregamento (texto central) na área principal.
function mostrarCarregando(texto) {
  document.getElementById("pagina-principal").innerHTML =
    `<div id="tela-carregando"><p>${texto}</p></div>`;
}

// Atualiza dinamicamente o texto de carregamento (feedback de progresso).
function atualizarCarregando(texto) {
  const alvo = document.querySelector("#tela-carregando p");
  if (alvo) {
    alvo.textContent = texto;
  } else {
    mostrarCarregando(texto);
  }
}

// Lê a versão (?v=) do próprio bundle a partir da tag <script> do
// renderizador, para o Worker e seus importScripts herdarem a mesma
// trava de cache sem precisar duplicar o número em vários lugares.
function versaoAssets() {
  const script = document.querySelector('script[src*="renderizador.js"]');
  const encontrado = script && script.src.match(/[?&]v=([^&]+)/);
  return encontrado ? encontrado[1] : "";
}

// Avança o tempo em UM DIA. A simulação (jogos do dia) e a virada de
// ano acontecem no Núcleo, via calendário -> agendador -> ouvintes.
// Aqui a UI só dispara o avanço e sincroniza a tela.
function avancarTempo() {
  avancarUmDia(); // calendário emite DIA_AVANCOU (e TEMPORADA_FINALIZADA no fim do ano)

  atualizarDisplayTempo();
  atualizarBadgeMetadados(); // o volume de fatos cresce quando há jogos

  // A MÁGICA DA REATIVIDADE: recarrega a tela atual (qualquer que
  // seja) para refletir os novos dados — ex.: a tabela do campeonato.
  if (recarregarPaginaAtual) {
    recarregarPaginaAtual();
  }
}

// Escreve a DATA atual do universo no topo da página (dia a dia).
function atualizarDisplayTempo() {
  document.getElementById("data-atual").textContent = dataParaTextoBR(dataAtual);
}

// Desenha as seções clicáveis do menu: Competições, Atletas e Organizações.
function desenharMenuLateral() {
  const listaCompeticoes = document.getElementById("lista-competicoes");
  listaCompeticoes.innerHTML = "";
  competicoesGlobais.forEach((competicao) => {
    const item = document.createElement("li");
    item.textContent = competicao.nome;
    item.addEventListener("click", () => abrirPaginaCompeticao(competicao.id));
    listaCompeticoes.appendChild(item);
  });

  const listaAtletas = document.getElementById("lista-atletas");
  listaAtletas.innerHTML = "";
  atletasDoMundo.forEach((atleta) => {
    const item = document.createElement("li");
    item.textContent = atleta.nome;
    item.addEventListener("click", () => abrirPaginaAtleta(atleta.id));
    listaAtletas.appendChild(item);
  });

  const listaOrgs = document.getElementById("lista-organizacoes");
  listaOrgs.innerHTML = "";
  organizacoesDoMundo.forEach((organizacao) => {
    const item = document.createElement("li");
    item.textContent = organizacao.nome;
    item.addEventListener("click", () => abrirPaginaOrganizacao(organizacao.id));
    listaOrgs.appendChild(item);
  });
}

// Abre a "página" de um atleta na área principal (direita).
function abrirPaginaAtleta(idAtleta) {
  const atleta = atletasDoMundo.find((a) => a.id === idAtleta);
  if (!atleta) return;

  // Registra como recarregar ESTA página (re-render reativo do tempo).
  recarregarPaginaAtual = () => abrirPaginaAtleta(idAtleta);

  // Relação por ID: acha a organização do atleta pelo organizacaoId.
  const organizacao = organizacoesDoMundo.find(
    (o) => o.id === atleta.organizacaoId
  );
  const nomeOrg = organizacao ? organizacao.nome : "Sem organização";

  // A MÁGICA DA HISTÓRIA: leitura pura (filter) da memória.
  const partidasDoAtleta = memoriaHistorica.filter(
    (partida) =>
      partida.competidores.atletaA.id === idAtleta ||
      partida.competidores.atletaB.id === idAtleta
  );

  const pagina = document.getElementById("pagina-principal");
  pagina.innerHTML = `
    <h2>${atleta.nome}</h2>
    <ul class="ficha">
      <li><strong>Idade:</strong> ${atleta.idade} anos</li>
      <li><strong>Habilidade:</strong> ${atleta.habilidade} / 100</li>
      <li><strong>Organização:</strong>
        <a href="#" class="link-interno" data-org-id="${atleta.organizacaoId}">${nomeOrg}</a>
      </li>
    </ul>
    <h3>Linha do Tempo (${partidasDoAtleta.length} partida(s))</h3>
    ${montarLinhaDoTempo(idAtleta, partidasDoAtleta)}
  `;

  ligarLinksInternos(pagina);
  aplicarPiscada(pagina);
}

// Abre a "página" de uma organização, com sua ficha e o Elenco.
function abrirPaginaOrganizacao(idOrganizacao) {
  const organizacao = organizacoesDoMundo.find((o) => o.id === idOrganizacao);
  if (!organizacao) return;

  // Registra como recarregar ESTA página no re-render reativo.
  recarregarPaginaAtual = () => abrirPaginaOrganizacao(idOrganizacao);

  // A MÁGICA RELACIONAL: o Elenco é a leitura pura (filter) dos
  // atletas cujo organizacaoId aponta para esta organização.
  const elenco = atletasDoMundo.filter(
    (a) => a.organizacaoId === idOrganizacao
  );

  const pagina = document.getElementById("pagina-principal");
  pagina.innerHTML = `
    <h2>${organizacao.nome}</h2>
    <ul class="ficha">
      <li><strong>Reputação:</strong> ${organizacao.reputacao} / 100</li>
    </ul>
    <h3>Elenco (${elenco.length} atleta(s))</h3>
    ${montarElenco(elenco)}
  `;

  ligarLinksInternos(pagina);
  aplicarPiscada(pagina);
}

// Abre a "página" de uma competição, com ficha e Equipes Participantes.
function abrirPaginaCompeticao(idCompeticao) {
  const competicao = competicoesGlobais.find((c) => c.id === idCompeticao);
  if (!competicao) return;

  // A tabela se atualiza de forma REATIVA (via TABELA_CLASSIFICACAO_ATUALIZADA),
  // então a página da competição NÃO precisa de re-render completo ao avançar.
  recarregarPaginaAtual = null;

  // Acha a temporada ativa uma vez, para exibir o ANO real na página.
  const temporada = temporadasGlobais.find(
    (t) => t.competicaoId === competicao.id
  );
  const anoTexto = temporada ? temporada.ano : "—";

  const pagina = document.getElementById("pagina-principal");
  pagina.innerHTML = `
    <h2>${competicao.nome}</h2>
    <p class="subtitulo">Temporada ${anoTexto}</p>
    <ul class="ficha">
      <li><strong>Reputação:</strong> ${competicao.reputacao} / 100</li>
    </ul>
    <h3>Equipes Participantes (${competicao.participantes.length})</h3>
    ${montarParticipantes(competicao.participantes)}
    <h3>Classificação — Temporada ${anoTexto}</h3>
    <div id="area-classificacao"></div>
  `;

  ligarLinksInternos(pagina);
  renderizarTabelaClassificacao(temporada); // desenho inicial da tabela
  aplicarPiscada(pagina);
}

// Desenha a tabela de classificação DENTRO de #area-classificacao.
// É a "UI estúpida": só LÊ os dados (já calculados pelo Núcleo no
// Passo 24), ordena (Pontos > Vitórias > Saldo) e constrói o DOM.
// No-op se a página da competição não estiver aberta (container ausente).
function renderizarTabelaClassificacao(temporadaAtiva) {
  const container = document.getElementById("area-classificacao");
  if (!container) return;

  if (!temporadaAtiva || temporadaAtiva.classificacao.length === 0) {
    container.innerHTML = "<p><em>Sem classificação para esta temporada.</em></p>";
    return;
  }

  // Ordena uma CÓPIA (sem mutar): pontos > vitórias > saldo (todos desc).
  const ordenada = [...temporadaAtiva.classificacao].sort((a, b) => {
    if (b.pontos !== a.pontos) return b.pontos - a.pontos;
    if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
    return b.saldoPontos - a.saldoPontos;
  });

  const linhas = ordenada
    .map((linha, indice) => {
      const organizacao = organizacoesDoMundo.find(
        (o) => o.id === linha.organizacaoId
      );
      const nomeOrg = organizacao ? organizacao.nome : "Equipe desconhecida";
      return `
        <tr>
          <td>${indice + 1}</td>
          <td><a href="#" class="link-interno" data-org-id="${linha.organizacaoId}">${nomeOrg}</a></td>
          <td>${linha.pontos}</td>
          <td>${linha.jogos}</td>
          <td>${linha.vitorias}</td>
          <td>${linha.empates}</td>
          <td>${linha.derrotas}</td>
          <td>${linha.saldoPontos}</td>
        </tr>`;
    })
    .join("");

  container.innerHTML = `
    <table class="tabela-classificacao">
      <thead>
        <tr>
          <th>Pos</th><th>Equipe</th><th>P</th><th>J</th>
          <th>V</th><th>E</th><th>D</th><th>Saldo</th>
        </tr>
      </thead>
      <tbody>${linhas}</tbody>
    </table>`;

  // Religa os links das equipes (recriados no innerHTML).
  ligarLinksInternos(container);
}

// Monta o HTML das Equipes Participantes de uma competição. Recebe
// uma lista de IDs de organização e, para cada um, busca a org na
// lista global (navegação profunda por referência — sem duplicar).
function montarParticipantes(idsOrganizacoes) {
  if (idsOrganizacoes.length === 0) {
    return "<p><em>Nenhuma equipe inscrita ainda.</em></p>";
  }

  const itens = idsOrganizacoes
    .map((idOrg) => {
      const organizacao = organizacoesDoMundo.find((o) => o.id === idOrg);
      const nomeOrg = organizacao ? organizacao.nome : "Equipe desconhecida";
      return `
        <li>
          <a href="#" class="link-interno" data-org-id="${idOrg}">${nomeOrg}</a>
        </li>`;
    })
    .join("");

  return `<ul class="elenco">${itens}</ul>`;
}

// Monta o HTML do Elenco (lista de atletas clicáveis) de uma org.
function montarElenco(elenco) {
  if (elenco.length === 0) {
    return "<p><em>Nenhum atleta nesta organização.</em></p>";
  }

  const itens = elenco
    .map(
      (atleta) => `
        <li>
          <a href="#" class="link-interno" data-atleta-id="${atleta.id}">${atleta.nome}</a>
        </li>`
    )
    .join("");

  return `<ul class="elenco">${itens}</ul>`;
}

// Monta o HTML da Linha do Tempo a partir das partidas filtradas.
function montarLinhaDoTempo(idAtleta, partidas) {
  if (partidas.length === 0) {
    return "<p><em>Este atleta ainda não disputou nenhuma partida.</em></p>";
  }

  const itens = partidas
    .map((partida) => {
      const venceu = partida.resultado.vencedor.id === idAtleta;
      const oponente = venceu
        ? partida.resultado.perdedor
        : partida.resultado.vencedor;

      const rotulo = venceu
        ? '<span class="resultado-venceu">Venceu</span>'
        : '<span class="resultado-perdeu">Perdeu</span>';

      const placar = `${partida.resultado.vencedor.pontuacaoFinal} x ${partida.resultado.perdedor.pontuacaoFinal}`;

      return `
        <li class="${venceu ? "venceu" : "perdeu"}">
          <small>Rodada ${partida.rodada}</small><br />
          ${rotulo} contra <strong>${oponente.nome}</strong>
          — placar ${placar}
        </li>`;
    })
    .join("");

  return `<ul class="linha-do-tempo">${itens}</ul>`;
}

// --- Helpers de UI (reutilizados pelas duas páginas) ---

// Liga os links internos "vai e vem" gerados via innerHTML, usando
// os data-attributes para saber qual página abrir (navegação por ID).
function ligarLinksInternos(container) {
  container.querySelectorAll("[data-org-id]").forEach((el) => {
    el.addEventListener("click", (evento) => {
      evento.preventDefault();
      abrirPaginaOrganizacao(el.dataset.orgId);
    });
  });
  container.querySelectorAll("[data-atleta-id]").forEach((el) => {
    el.addEventListener("click", (evento) => {
      evento.preventDefault();
      abrirPaginaAtleta(el.dataset.atletaId);
    });
  });
}

// Reinicia a animação de "piscar" para dar o feedback de recarga.
function aplicarPiscada(elemento) {
  elemento.classList.remove("piscar");
  void elemento.offsetWidth; // força reflow para a animação rodar de novo
  elemento.classList.add("piscar");
}

// Dispara a montagem do mundo quando o HTML estiver pronto.
window.addEventListener("DOMContentLoaded", iniciarMundo);
