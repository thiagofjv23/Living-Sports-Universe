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

// Ponto de entrada: cria o mundo (delegando a lógica ao Núcleo) e
// desenha o menu lateral.
function iniciarMundo() {
  // gerarMundo() (gameLoop.js) gera 6 atletas, simula 10 partidas e
  // publica tudo no EventBus -> a memoriaHistorica é populada.
  atletasDoMundo = gerarMundo(6, 10);
  desenharMenuLateral();
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
          ${rotulo} contra <strong>${oponente.nome}</strong>
          — placar ${placar}
          <small>(${partida.dataSimulada})</small>
        </li>`;
    })
    .join("");

  return `<ul class="linha-do-tempo">${itens}</ul>`;
}

// Dispara a montagem do mundo quando o HTML estiver pronto.
window.addEventListener("DOMContentLoaded", iniciarMundo);
