// =============================================================
// Núcleo (Core) — Ouvinte de Reforma (O Fim de uma Era)
// Passo 28 (Fase 3): fecha o Ciclo de Vida — atletas sem condições
// físicas saem de cena.
//
// Ouvinte PASSIVO: na virada do ano (TEMPORADA_FINALIZADA), APÓS o
// envelhecimento e o declínio (ordem de registro), avalia quem para:
//   - idade > 35 E habilidade < 30  → o corpo não acompanha mais; OU
//   - idade > 40                    → limite absoluto.
// Marca o atleta como reformado (ativo:false) e emite ATLETA_REFORMADO.
// Sem DOM. Depende de eventBus.js, carregado antes.
// =============================================================

const IDADE_REFORMA_CONDICIONAL = 35; // acima disso, depende da habilidade
const HABILIDADE_MINIMA_VETERANO = 30; // abaixo disso, veterano para
const IDADE_REFORMA_ABSOLUTA = 40; // acima disso, para incondicionalmente

// Lista de atletas do mundo, fornecida no registro.
let _atletasParaReforma = [];

// A Lógica da Despedida: avalia cada atleta ATIVO na virada do ano.
function avaliarReformas(payload) {
  _atletasParaReforma.forEach((atleta) => {
    if (atleta.status === "reformado") {
      return; // já pendurou as chuteiras
    }

    const semCondicoes =
      atleta.idade > IDADE_REFORMA_CONDICIONAL &&
      atleta.habilidade < HABILIDADE_MINIMA_VETERANO;
    const limiteAbsoluto = atleta.idade > IDADE_REFORMA_ABSOLUTA;

    if (semCondicoes || limiteAbsoluto) {
      atleta.status = "reformado";
      atleta.ativo = false;

      // O DISPARO DRAMÁTICO: um novo fato no universo.
      EventBus.emit("ATLETA_REFORMADO", {
        id: crypto.randomUUID(),
        tipoEvento: "ATLETA_REFORMADO",
        atletaId: atleta.id,
        idade: atleta.idade,
        organizacaoId: atleta.organizacaoId,
        ano: payload.anoFinalizado,
      });
    }
  });
}

// Registra o ouvinte. Chamar uma vez, no Big Bang, DEPOIS do
// envelhecimento e do declínio (a reforma avalia o estado já atualizado).
function iniciarOuvinteReforma(atletas) {
  _atletasParaReforma = atletas;
  EventBus.on("TEMPORADA_FINALIZADA", avaliarReformas);
}

// Teste isolado do Passo 28 — roda SÓ no Node (silencioso no browser/worker).
if (typeof window === "undefined" && typeof importScripts === "undefined") {
  const atletas = [
    { id: "a1", nome: "Jovem", idade: 25, habilidade: 20, organizacaoId: "org1" },
    { id: "a2", nome: "VeteranoFraco", idade: 37, habilidade: 15, organizacaoId: "org1" },
    { id: "a3", nome: "VeteranoForte", idade: 37, habilidade: 80, organizacaoId: "org1" },
    { id: "a4", nome: "Idoso", idade: 41, habilidade: 90, organizacaoId: "org2" },
  ];

  const reformados = [];
  EventBus.on("ATLETA_REFORMADO", (f) => reformados.push(f.atletaId));
  iniciarOuvinteReforma(atletas);

  EventBus.emit("TEMPORADA_FINALIZADA", { anoFinalizado: 2026, anoNovo: 2027 });
  // 2ª virada: quem já reformou não deve reformar de novo.
  EventBus.emit("TEMPORADA_FINALIZADA", { anoFinalizado: 2027, anoNovo: 2028 });

  console.log("Reformados (esperado: a2 e a4, uma vez cada):", reformados);
  console.log("Jovem ativo?", atletas[0].status !== "reformado");
  console.log("VeteranoForte ativo?", atletas[2].status !== "reformado");
  const arquivados = memoriaHistorica.filter((f) => f.tipoEvento === "ATLETA_REFORMADO");
  console.log("Arquivados na memória:", arquivados.length, "| exemplo:", arquivados[0]);
  const ok =
    reformados.length === 2 &&
    reformados.includes("a2") &&
    reformados.includes("a4") &&
    atletas[0].status !== "reformado" &&
    atletas[2].status !== "reformado" &&
    arquivados.length === 2;
  console.log("Passo 28 OK?", ok);
}
