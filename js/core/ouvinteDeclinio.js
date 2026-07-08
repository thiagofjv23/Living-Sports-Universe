// =============================================================
// Núcleo (Core) — Ouvinte de Declínio Físico (O Peso do Tempo)
// Passo 27 (Fase 3): a idade impacta a matemática da simulação.
//
// Ouvinte PASSIVO: na virada do ano (TEMPORADA_FINALIZADA), varre os
// atletas e, para quem tem 32+ anos, reduz a habilidade num valor
// sorteado (1 a 3), nunca abaixo de 1. Sem regras de reforma (próximo
// passo) e sem DOM — altera puramente o dado na memória.
//
// Depende de eventBus.js, carregado antes deste arquivo.
// =============================================================

// Marco inicial do declínio físico e perda anual sorteada.
const IDADE_INICIO_DECLINIO = 32;
const HABILIDADE_MINIMA = 1;

// Lista de atletas do mundo, fornecida no registro.
let _atletasParaDeclinio = [];

// A Lei da Natureza: veteranos perdem habilidade a cada ano.
function aplicarDeclinioFisico() {
  _atletasParaDeclinio.forEach((atleta) => {
    if (atleta.idade >= IDADE_INICIO_DECLINIO) {
      const perda = Math.floor(Math.random() * 3) + 1; // 1 a 3 pontos
      atleta.habilidade = Math.max(HABILIDADE_MINIMA, atleta.habilidade - perda);
    }
  });
}

// Registra o ouvinte no barramento. Chamar uma vez, no Big Bang,
// DEPOIS do ouvinte de envelhecimento (ordem de registro = ordem de
// execução no mesmo evento: primeiro envelhece, depois declina).
function iniciarOuvinteDeclinio(atletas) {
  _atletasParaDeclinio = atletas;
  EventBus.on("TEMPORADA_FINALIZADA", aplicarDeclinioFisico);
}

// Teste isolado do Passo 27 — roda SÓ no Node (silencioso no browser/worker).
if (typeof window === "undefined" && typeof importScripts === "undefined") {
  const atletas = [
    { id: "a1", nome: "Jovem", idade: 22, habilidade: 80 },
    { id: "a2", nome: "Veterano", idade: 33, habilidade: 70 },
    { id: "a3", nome: "Piso", idade: 38, habilidade: 2 },
  ];

  iniciarOuvinteDeclinio(atletas);
  EventBus.emit("TEMPORADA_FINALIZADA", { anoFinalizado: 2026, anoNovo: 2027 });

  console.log("Jovem (22): 80 ->", atletas[0].habilidade, "(deve ficar 80)");
  console.log("Veterano (33): 70 ->", atletas[1].habilidade, "(deve cair 1-3)");
  console.log("Piso (38): 2 ->", atletas[2].habilidade, "(nunca abaixo de 1)");

  const ok =
    atletas[0].habilidade === 80 &&
    atletas[1].habilidade >= 67 && atletas[1].habilidade <= 69 &&
    atletas[2].habilidade >= 1;
  console.log("Passo 27 OK?", ok);
}
