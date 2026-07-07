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

// Estado da INTERFACE: qual atleta o usuário está visualizando.
// null = nenhuma página de atleta aberta (usado no re-render reativo).
let atletaSelecionadoId = null;

// Ponto de entrada: cria o mundo (chamando o Núcleo), conecta as
// entidades e desenha o menu lateral.
function iniciarMundo() {
  // --- LIMPEZA DE ESTADO: o universo nasce do zero absoluto. ---
  memoriaHistorica.length = 0; // zera a Memória Histórica
  rodadaAtual = 1; // reinicia o relógio do universo
  atletaSelecionadoId = null; // ninguém selecionado
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

  desenharMenuLateral();
  atualizarDisplayRodada();

  // Liga o botão "Avançar 1 Rodada" ao ciclo de tempo.
  document.getElementById("btn-avancar").addEventListener("click", avancarTempo);
}

// Avança o tempo: pede ao Núcleo para simular uma nova rodada e,
// em seguida, sincroniza a interface com o novo estado do mundo.
function avancarTempo() {
  simularRodada(atletasDoMundo);
  atualizarDisplayRodada();

  // A MÁGICA DA REATIVIDADE: se há um atleta aberto, recarrega a
  // página dele com as partidas recém-geradas.
  if (atletaSelecionadoId) {
    abrirPaginaAtleta(atletaSelecionadoId);
  }
}

// Escreve a rodada atual no topo da página (leitura de rodadaAtual).
function atualizarDisplayRodada() {
  document.getElementById("rodada-atual").textContent = rodadaAtual;
}

// Desenha as duas seções clicáveis do menu: Atletas e Organizações.
function desenharMenuLateral() {
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

  // Guarda quem está sendo visto (para o re-render reativo do tempo).
  atletaSelecionadoId = idAtleta;

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

  // Saímos da página de um atleta: zera a seleção para o avançar do
  // tempo não "pular" de volta para um atleta enquanto vemos a org.
  atletaSelecionadoId = null;

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
