// =============================================================
// Núcleo (Core) — Ouvinte de Envelhecimento (A Passagem do Tempo)
// Passo 26 (Fase 3): início do Ciclo de Vida dos atletas.
//
// Ouvinte PASSIVO: quando um ano vira (TEMPORADA_FINALIZADA), varre
// os atletas do mundo e incrementa a idade de cada um em +1 — de
// forma silenciosa, sem regras de perda de habilidade ou reforma
// (isso é papel de outros ouvintes) e sem tocar o DOM.
//
// Depende de eventBus.js, carregado antes deste arquivo.
// =============================================================

// Lista de atletas do mundo, fornecida no registro (o EventBus só
// entrega o payload; a lista vem por aqui — mesmo padrão dos demais).
let _atletasParaEnvelhecer = [];

// A Máquina do Tempo: todos os atletas ficam um ano mais velhos.
function envelhecerAtletas() {
  _atletasParaEnvelhecer.forEach((atleta) => {
    atleta.idade += 1;
  });
}

// Registra o ouvinte no barramento. Chamar uma vez, no Big Bang.
function iniciarOuvinteEnvelhecimento(atletas) {
  _atletasParaEnvelhecer = atletas;
  EventBus.on("TEMPORADA_FINALIZADA", envelhecerAtletas);
}

// Teste isolado do Passo 26 — roda SÓ no Node (silencioso no browser/worker).
if (typeof window === "undefined" && typeof importScripts === "undefined") {
  const atletas = [];
  for (let i = 0; i < 5; i++) atletas.push(gerarAtleta());
  const idadesAntes = atletas.map((a) => a.idade);

  iniciarOuvinteEnvelhecimento(atletas);
  EventBus.emit("TEMPORADA_FINALIZADA", { anoFinalizado: 2026, anoNovo: 2027 });
  EventBus.emit("TEMPORADA_FINALIZADA", { anoFinalizado: 2027, anoNovo: 2028 });

  const idadesDepois = atletas.map((a) => a.idade);
  const ok = idadesDepois.every((idade, i) => idade === idadesAntes[i] + 2);
  console.log("Idades antes :", idadesAntes.join(", "));
  console.log("Idades depois:", idadesDepois.join(", "), "(2 viradas de ano)");
  console.log("Todos envelheceram +2?", ok);
}
