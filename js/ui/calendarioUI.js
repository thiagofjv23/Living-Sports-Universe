// =============================================================
// Interface (UI) — Tela de Calendário
// Passo 31: a agenda navegável do universo.
//
// CQRS: esta tela apenas LÊ a data atual e o calendarioRodadas das
// competições para desenhar a grade. Ao confirmar "simular até uma
// data", ela só DISPARA `avancarUmDia()` do Núcleo (igual ao botão
// "Avançar 1 Dia") — nunca calcula resultados nem altera dados.
//
// Depende de: calendario.js (data/helpers/avancarUmDia) e
// renderizador.js (globais e helpers de UI), carregados antes.
// =============================================================

const NOMES_MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// Mês/ano que a grade está exibindo (navegação independe da data atual).
let mesVisivel = null;
let anoVisivel = null;

// Abre a página do calendário (começa no mês da data atual).
function abrirPaginaCalendario() {
  mesVisivel = dataAtual.mes;
  anoVisivel = dataAtual.ano;

  // Ao avançar o tempo com o calendário aberto, só a grade é redesenhada.
  recarregarPaginaAtual = () => renderizarGradeCalendario();

  const pagina = document.getElementById("pagina-principal");
  pagina.innerHTML = `
    <h2>📅 Calendário</h2>
    <div id="nav-calendario">
      <button id="cal-anterior">◀</button>
      <strong id="cal-titulo"></strong>
      <button id="cal-proximo">▶</button>
    </div>
    <div id="grade-calendario"></div>
    <p class="dica">Clique em um dia futuro (⚽ = há competição) para simular até ele.</p>
  `;

  document
    .getElementById("cal-anterior")
    .addEventListener("click", () => navegarMes(-1));
  document
    .getElementById("cal-proximo")
    .addEventListener("click", () => navegarMes(1));

  renderizarGradeCalendario();
  aplicarPiscada(pagina);
}

// Navega para o mês anterior/seguinte.
function navegarMes(passo) {
  mesVisivel += passo;
  if (mesVisivel > 12) {
    mesVisivel = 1;
    anoVisivel++;
  } else if (mesVisivel < 1) {
    mesVisivel = 12;
    anoVisivel--;
  }
  renderizarGradeCalendario();
}

// Quais competições têm rodada em determinado mês/dia (leitura pura).
function competicoesComRodada(mes, dia) {
  return competicoesGlobais.filter(
    (competicao) =>
      Array.isArray(competicao.calendarioRodadas) &&
      competicao.calendarioRodadas.some((r) => r.mes === mes && r.dia === dia)
  );
}

// Desenha a grade de quadrados do mês visível.
function renderizarGradeCalendario() {
  const grade = document.getElementById("grade-calendario");
  if (!grade) return; // calendário não está aberto

  document.getElementById("cal-titulo").textContent =
    `${NOMES_MESES[mesVisivel - 1]} de ${anoVisivel}`;

  const diasNoMes = DIAS_POR_MES[mesVisivel - 1];
  const quadrados = [];

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const dataQuadrado = { ano: anoVisivel, mes: mesVisivel, dia: dia };
    const comparacao = dataComparar(dataQuadrado, dataAtual);
    const ehHoje = comparacao === 0;
    const ehFuturo = comparacao > 0;

    const competicoes = competicoesComRodada(mesVisivel, dia);
    const temJogo = competicoes.length > 0;

    let classe = "dia-calendario";
    if (ehHoje) classe += " hoje";
    if (comparacao < 0) classe += " passado";
    if (ehFuturo) classe += " clicavel"; // só dias futuros são simuláveis
    if (temJogo) classe += " com-jogo";

    const marcador = temJogo
      ? `<span class="marcador-jogo">⚽ ${competicoes.map((c) => c.nome).join(", ")}</span>`
      : "";

    quadrados.push(`
      <div class="${classe}" data-ano="${anoVisivel}" data-mes="${mesVisivel}" data-dia="${dia}">
        <span class="numero-dia">${dia}</span>
        ${marcador}
      </div>`);
  }

  grade.innerHTML = quadrados.join("");

  // Liga o clique apenas nos dias futuros.
  grade.querySelectorAll(".dia-calendario.clicavel").forEach((elemento) => {
    elemento.addEventListener("click", () => {
      abrirPopupSimular({
        ano: Number(elemento.dataset.ano),
        mes: Number(elemento.dataset.mes),
        dia: Number(elemento.dataset.dia),
      });
    });
  });
}

// Pop-up perguntando se deseja simular até a data escolhida.
function abrirPopupSimular(dataEscolhida) {
  fecharPopup(); // garante que não há dois

  const overlay = document.createElement("div");
  overlay.id = "modal-overlay";
  overlay.innerHTML = `
    <div id="modal-caixa">
      <p>Deseja simular até <strong>${dataParaTextoBR(dataEscolhida)}</strong>?</p>
      <p class="modal-sub">Todos os dias até essa data serão simulados
        (a data escolhida ainda não será jogada).</p>
      <div id="modal-botoes">
        <button id="modal-sim">Sim</button>
        <button id="modal-nao">Não</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  document.getElementById("modal-sim").addEventListener("click", () => {
    fecharPopup();
    simularAteData(dataEscolhida);
  });
  document.getElementById("modal-nao").addEventListener("click", fecharPopup);
  // Clicar fora da caixa também cancela (volta ao calendário).
  overlay.addEventListener("click", (evento) => {
    if (evento.target === overlay) fecharPopup();
  });
}

function fecharPopup() {
  const overlay = document.getElementById("modal-overlay");
  if (overlay) overlay.remove();
}

// Simula dia a dia ATÉ a véspera da data escolhida (para antes dela).
// Só dispara o avanço do Núcleo; os ouvintes reagem sozinhos.
function simularAteData(dataEscolhida) {
  let seguranca = 0;
  while (
    dataComparar(proximoDia(dataAtual), dataEscolhida) < 0 &&
    seguranca < 100000
  ) {
    avancarUmDia();
    seguranca++;
  }

  // Reposiciona a visão onde o tempo parou e sincroniza a interface.
  mesVisivel = dataAtual.mes;
  anoVisivel = dataAtual.ano;
  atualizarDisplayTempo();
  atualizarBadgeMetadados();
  renderizarGradeCalendario();
}
