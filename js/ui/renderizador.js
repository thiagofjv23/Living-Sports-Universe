// =============================================================
// Interface (UI) — Renderizador
// Passo 4 do MVP: a primeira "página de Wikipédia".
//
// Princípio CQRS (Documento Mestre): este arquivo APENAS LÊ a
// memoriaHistorica para desenhar a tela. Ele NUNCA altera os
// dados e NUNCA emite eventos — a geração do mundo (lógica +
// emit) fica no gameLoop.js, no Núcleo.
//
// Depende de: gameLoop.js (gerarMundo), memoriaHistorica (leitura)
// e do DOM (index.html), carregados antes deste arquivo.
// =============================================================

// Referência de leitura para a lista de atletas do mundo atual.
// A UI guarda essa lista só para consultar Nome/Idade/Habilidade;
// a fonte da verdade dos FATOS continua sendo a memoriaHistorica.
let atletasDoMundo = [];

// Estado da INTERFACE: qual atleta o usuário está visualizando.
// null = nenhuma página aberta. É usado para "recarregar" a página
// quando o tempo avança (a mágica da reatividade).
let atletaSelecionadoId = null;

// Ponto de entrada: cria o mundo (delegando a lógica ao Núcleo),
// desenha o menu lateral, atualiza o relógio e liga o botão.
function iniciarMundo() {
  // --- LIMPEZA DE ESTADO: o universo nasce do zero absoluto. ---
  // Precisa vir ANTES de gerarMundo() para não misturar mundo antigo
  // com o novo. Usa .length = 0 (a memória é const: reesvazia o mesmo
  // array, preservando o ouvinte já registrado no EventBus).
  memoriaHistorica.length = 0; // zera a Memória Histórica
  rodadaAtual = 1; // reinicia o relógio do universo
  atletaSelecionadoId = null; // ninguém selecionado
  document.getElementById("lista-atletas").innerHTML = ""; // limpa o menu
  document.getElementById("pagina-principal").innerHTML = ""; // limpa a página
  // -------------------------------------------------------------

  // gerarMundo() (gameLoop.js) gera 6 atletas, simula 10 partidas e
  // publica tudo no EventBus -> a memoriaHistorica é populada.
  atletasDoMundo = gerarMundo(6, 10);
  desenharMenuLateral();
  atualizarDisplayRodada();

  // Liga o botão "Avançar 1 Rodada" ao ciclo de tempo.
  document.getElementById("btn-avancar").addEventListener("click", avancarTempo);
}

// Avança o tempo: pede ao Núcleo para simular uma nova rodada e,
// em seguida, sincroniza a interface com o novo estado do mundo.
function avancarTempo() {
  // Simulação da rodada (incrementa rodadaAtual, forma duplas,
  // simula e emite no EventBus) vive no Núcleo — sem DOM aqui.
  simularRodada(atletasDoMundo);

  // A tela precisa saber que o tempo passou:
  atualizarDisplayRodada();

  // A MÁGICA DA REATIVIDADE: se o usuário está vendo alguém, a
  // página "pisca" e recarrega com as partidas recém-geradas.
  if (atletaSelecionadoId) {
    abrirPaginaAtleta(atletaSelecionadoId);
  }
}

// Escreve a rodada atual no topo da página (leitura de rodadaAtual).
function atualizarDisplayRodada() {
  document.getElementById("rodada-atual").textContent = rodadaAtual;
}

// Desenha a lista clicável de atletas no menu lateral (esquerda).
function desenharMenuLateral() {
  const lista = document.getElementById("lista-atletas");
  lista.innerHTML = "";

  atletasDoMundo.forEach((atleta) => {
    const item = document.createElement("li");
    item.textContent = atleta.nome;
    item.addEventListener("click", () => abrirPaginaAtleta(atleta.id));
    lista.appendChild(item);
  });
}

// Abre a "página" de um atleta na área principal (direita).
// LÊ os dados do atleta e filtra a memoriaHistorica em busca das
// partidas em que ele participou, montando a Linha do Tempo.
function abrirPaginaAtleta(idAtleta) {
  const atleta = atletasDoMundo.find((a) => a.id === idAtleta);
  if (!atleta) return;

  // Guarda quem está sendo visto, para o re-render reativo ao avançar
  // o tempo saber qual página recarregar.
  atletaSelecionadoId = idAtleta;

  // A MÁGICA DA HISTÓRIA: leitura pura (filter) da memória — sem
  // alterar nada. Pega só as partidas onde este atleta jogou.
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
    </ul>
    <h3>Linha do Tempo (${partidasDoAtleta.length} partida(s))</h3>
    ${montarLinhaDoTempo(idAtleta, partidasDoAtleta)}
  `;

  // Reinicia a animação de "piscar" para dar o feedback de recarga.
  pagina.classList.remove("piscar");
  void pagina.offsetWidth; // força reflow para a animação rodar de novo
  pagina.classList.add("piscar");
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

// Dispara a montagem do mundo quando o HTML estiver pronto.
window.addEventListener("DOMContentLoaded", iniciarMundo);
