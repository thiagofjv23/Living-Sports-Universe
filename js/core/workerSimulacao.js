// =============================================================
// Núcleo (Core) — Web Worker de Simulação
// Passo 17 (Fase 3): roda a história pré-simulada FORA da main
// thread, para o navegador não travar, e envia o progresso ano a
// ano de volta à interface.
//
// Um Worker tem seu próprio escopo global (não vê o DOM nem as
// variáveis da página). Por isso ele importa as dependências puras
// via importScripts. A versão (?v=) é herdada da URL do worker para
// respeitar a trava de cache (R2).
// =============================================================

const _params = new URLSearchParams(self.location.search);
const _v = _params.get("v");
const _q = _v ? "?v=" + _v : "";

// Ordem importa: EventBus antes da Memória (que registra ouvinte nele).
importScripts(
  "eventBus.js" + _q,
  "memoriaHistorica.js" + _q,
  "../modulos-esportivos/moduloBasico.js" + _q
);

// Recebe as entidades da main thread e roda a simulação pesada.
self.onmessage = function (evento) {
  const { competicao, organizacoes, totalAnos } = evento.data;

  // Resolve os IDs dos participantes -> objetos de organização.
  const equipes = competicao.participantes
    .map((id) => organizacoes.find((org) => org.id === id))
    .filter((org) => org);

  for (let ano = 1; ano <= totalAnos; ano++) {
    // Round-robin (todos contra todos) para "fechar" a temporada.
    for (let i = 0; i < equipes.length; i++) {
      for (let j = i + 1; j < equipes.length; j++) {
        const resultado = simularPartidaEquipes(equipes[i], equipes[j]);
        // Passa pelo EventBus do worker -> arquiva na memoriaHistorica.
        EventBus.emit("PARTIDA_EQUIPES_FINALIZADA", resultado);
      }
    }

    // O RÁDIO: avisa a main thread do progresso a cada ano concluído.
    self.postMessage({ tipo: "progresso", anoAtual: ano, totalAnos: totalAnos });
  }

  // Pacote final: entrega todos os fatos arquivados à main thread.
  self.postMessage({ tipo: "concluido", dados: memoriaHistorica });
};
