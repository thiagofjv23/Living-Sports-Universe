// =============================================================
// Núcleo (Core) — Ouvinte de Saúde (Lesões Graves)
// Passo 19 (Fase 3): introduz o "caos matemático" das lesões.
//
// Ouvinte PASSIVO: só reage ao apito final (PARTIDA_EQUIPES_FINALIZADA).
// Rola um dado e, com baixa probabilidade, sorteia uma vítima entre os
// elencos das duas equipes e emite ATLETA_LESIONADO_GRAVEMENTE.
//
// O Módulo Esportivo continua LIMPO: ele nem sabe o que é uma lesão.
// Depende de eventBus.js, carregado antes deste arquivo.
// =============================================================

// Lista de atletas do mundo, fornecida no registro (o EventBus só
// entrega o payload; a lista de elenco vem por aqui).
let _atletasParaSaude = [];

// Função pura/passiva: avalia a saúde após UMA partida de equipes.
function avaliarSaudePosJogo(payload) {
  // O DADO DA COLISÃO: 1 a 100. Lesão grave só se cair entre 1 e 3 (3%).
  const dado = Math.floor(Math.random() * 100) + 1;
  if (dado > 3) {
    return; // partida sem fatalidades
  }

  // Elenco combinado das DUAS equipes que jogaram (filtro por org).
  const idEquipeA = payload.competidores.equipeA.id;
  const idEquipeB = payload.competidores.equipeB.id;
  const elenco = _atletasParaSaude.filter(
    (atleta) =>
      atleta.organizacaoId === idEquipeA || atleta.organizacaoId === idEquipeB
  );
  if (elenco.length === 0) {
    return; // sem atletas cadastrados nessas equipes, nada a fazer
  }

  // Sorteia a vítima aleatoriamente entre os dois elencos.
  const vitima = elenco[Math.floor(Math.random() * elenco.length)];

  // O DISPARO: novo fato no universo. Inclui tipoEvento/id para o fato
  // ser autodescritivo na memória (como os demais), além dos campos
  // pedidos (atletaId, organizacaoId, tempoRecuperacao, dataSimulada).
  const lesao = {
    id: crypto.randomUUID(),
    tipoEvento: "ATLETA_LESIONADO_GRAVEMENTE",
    atletaId: vitima.id,
    organizacaoId: vitima.organizacaoId,
    tempoRecuperacao: Math.floor(Math.random() * 7) + 6, // 6 a 12 meses
    dataSimulada: payload.dataSimulada,
    ano: payload.ano, // herda o ano do jogo (rastro temporal)
  };
  EventBus.emit("ATLETA_LESIONADO_GRAVEMENTE", lesao);
}

// Registra o ouvinte no barramento, guardando a lista de atletas para
// consultar os elencos. Chamar uma vez, com a lista do mundo.
function registrarOuvinteSaude(atletas) {
  _atletasParaSaude = atletas;
  EventBus.on("PARTIDA_EQUIPES_FINALIZADA", avaliarSaudePosJogo);
}

// Teste isolado do Passo 19 — roda SÓ no Node (silencioso no browser/worker).
if (typeof window === "undefined" && typeof importScripts === "undefined") {
  // 2 equipes + 10 atletas distribuídos entre elas.
  const orgs = [gerarOrganizacao(), gerarOrganizacao()];
  const atletas = [];
  for (let i = 0; i < 10; i++) {
    const a = gerarAtleta();
    a.organizacaoId = orgs[i % 2].id;
    atletas.push(a);
  }

  registrarOuvinteSaude(atletas);

  // Emite muitas partidas para a probabilidade baixa se manifestar.
  let disparadas = 0;
  EventBus.on("ATLETA_LESIONADO_GRAVEMENTE", () => disparadas++);
  for (let k = 0; k < 2000; k++) {
    EventBus.emit("PARTIDA_EQUIPES_FINALIZADA", simularPartidaEquipes(orgs[0], orgs[1]));
  }

  const arquivadas = memoriaHistorica.filter(
    (f) => f.tipoEvento === "ATLETA_LESIONADO_GRAVEMENTE"
  );
  console.log("Partidas emitidas: 2000 | lesões disparadas:", disparadas, "(~3% esperado)");
  console.log("Lesões arquivadas na memória:", arquivadas.length);
  console.log("Exemplo de lesão:", arquivadas[0]);
}
