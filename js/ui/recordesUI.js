// =============================================================
// Interface (UI) — Tela de Recordes (Hall da Fama)
// Passo 32: exibe o "livro de recordes" do universo — já semeado com
// os recordes da simulação pré-jogo (50 anos de história) e atualizado
// ao vivo conforme o usuário avança o calendário.
//
// CQRS: esta tela apenas LÊ `recordesGlobais` (mantido pelo Núcleo, no
// ouvinteRecordes) e desenha. Não calcula recordes nem altera dados.
//
// Depende de: ouvinteRecordes.js (recordesGlobais) e renderizador.js
// (globais/helpers de UI), carregados antes.
// =============================================================

// Abre a página de recordes na área principal.
function abrirPaginaRecordes() {
  // A tela se atualiza sozinha quando um recorde novo cai (ver o
  // ouvinte NOVO_RECORDE_QUEBRADO em finalizarBigBang).
  recarregarPaginaAtual = () => renderizarRecordes();

  const pagina = document.getElementById("pagina-principal");
  pagina.innerHTML = `
    <h2>🏆 Recordes do Universo</h2>
    <p class="subtitulo">Marcas de todas as épocas — desde a fundação (1976).</p>
    <div id="area-recordes"></div>
  `;
  renderizarRecordes();
  aplicarPiscada(pagina);
}

// Desenha os cartões de recorde (leitura pura do livro de recordes).
// No-op se a página de recordes não estiver aberta.
function renderizarRecordes() {
  const area = document.getElementById("area-recordes");
  if (!area) return;

  const cartoes = Object.keys(recordesGlobais).map((tipo) => {
    const recorde = recordesGlobais[tipo];
    const anoTexto = recorde.ano != null ? `Temporada ${recorde.ano}` : "—";

    // Detentor vira link para a página da equipe, se ela existe no mundo.
    const organizacao = organizacoesDoMundo.find(
      (o) => o.id === recorde.organizacaoId
    );
    const detentor = organizacao
      ? `<a href="#" class="link-interno" data-org-id="${organizacao.id}">${recorde.nomeEquipe}</a>`
      : recorde.nomeEquipe;

    return `
      <div class="card-recorde">
        <div class="recorde-rotulo">${recorde.rotulo}</div>
        <div class="recorde-valor">${recorde.valor}</div>
        <div class="recorde-detentor">${detentor} · ${anoTexto}</div>
      </div>`;
  });

  area.innerHTML = cartoes.join("");
  ligarLinksInternos(area); // religa os links de equipe (Wikipédia)
}
