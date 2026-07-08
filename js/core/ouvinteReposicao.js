// =============================================================
// Núcleo (Core) — Ouvinte de Reposição (Sangue Novo)
// Passo 29 (Fase 3): a cada virada de ano, uma nova fornada de
// 15 jovens (16 a 18 anos) entra no mundo do esporte.
//
// Ouvinte PASSIVO: escuta TEMPORADA_FINALIZADA, gera os atletas via
// Fábrica de Regens e os insere no array global. Sem DOM e sem
// lógicas adicionais (vínculos/contratos ficam para outro passo).
//
// Depende de eventBus.js e fabricaRegens.js, carregados antes.
// =============================================================

const TAMANHO_FORNADA = 15; // jovens gerados por ano
const IDADE_MINIMA_FORNADA = 16;
const IDADE_MAXIMA_FORNADA = 18;

// Lista de atletas do mundo, fornecida no registro (mesma referência
// usada pelos demais ouvintes — os novos entram no ciclo de vida).
let _atletasParaReposicao = [];

// A Base: gera a fornada anual de jovens promessas.
function gerarNovaFornada() {
  for (let i = 0; i < TAMANHO_FORNADA; i++) {
    const novato = gerarAtleta();
    // Sobrescreve a idade: toda a fornada tem entre 16 e 18 anos.
    novato.idade =
      Math.floor(
        Math.random() * (IDADE_MAXIMA_FORNADA - IDADE_MINIMA_FORNADA + 1)
      ) + IDADE_MINIMA_FORNADA;
    _atletasParaReposicao.push(novato);
  }

  // O DISPARO: anuncia a chegada da nova geração.
  EventBus.emit("NOVA_FORNADA_GERADA", { quantidade: TAMANHO_FORNADA });
}

// Registra o ouvinte no barramento. Chamar uma vez, no Big Bang.
function iniciarOuvinteReposicao(atletas) {
  _atletasParaReposicao = atletas;
  EventBus.on("TEMPORADA_FINALIZADA", gerarNovaFornada);
}

// Teste isolado do Passo 29 — roda SÓ no Node (silencioso no browser/worker).
if (typeof window === "undefined" && typeof importScripts === "undefined") {
  const atletas = [gerarAtleta(), gerarAtleta()]; // mundo com 2 veteranos

  let fornadas = [];
  EventBus.on("NOVA_FORNADA_GERADA", (p) => fornadas.push(p));
  iniciarOuvinteReposicao(atletas);

  EventBus.emit("TEMPORADA_FINALIZADA", { anoFinalizado: 2026, anoNovo: 2027 });

  const novatos = atletas.slice(2);
  const idadesOk = novatos.every((a) => a.idade >= 16 && a.idade <= 18);
  console.log("Atletas no mundo: 2 ->", atletas.length, "(deve ser 17)");
  console.log("Idades da fornada:", novatos.map((a) => a.idade).join(", "));
  console.log("Todas entre 16 e 18?", idadesOk);
  console.log("Evento NOVA_FORNADA_GERADA:", JSON.stringify(fornadas));
  console.log(
    "Passo 29 OK?",
    atletas.length === 17 && idadesOk && fornadas.length === 1 && fornadas[0].quantidade === 15
  );
}
