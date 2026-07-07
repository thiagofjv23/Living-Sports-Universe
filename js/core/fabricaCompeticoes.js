// =============================================================
// Núcleo (Core) — Fábrica de Competições
// Passo 9 (Fase 2): geração da entidade global "Competição".
//
// Este arquivo é AGNÓSTICO: não conhece regras de nenhuma
// modalidade. Apenas cria um torneio "casca" com atributos base e
// arrays vazios que serão preenchidos por IDs futuramente (mesma
// filosofia de normalização das outras entidades).
// =============================================================

// Listas curtas para sortear combinações de nome da competição.
const PREFIXOS_COMP = ["Copa", "Liga", "Campeonato"];
const SUFIXOS_COMP = ["Nacional", "Global", "Suprema"];

// Sorteia um número inteiro entre min e max (ambos inclusos).
function sortearInteiroComp(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Sorteia um item qualquer de uma lista.
function sortearItemComp(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

// Gera e retorna um objeto que representa uma competição fictícia.
function gerarCompeticao() {
  return {
    id: crypto.randomUUID(),
    nome: `${sortearItemComp(PREFIXOS_COMP)} ${sortearItemComp(SUFIXOS_COMP)}`,
    reputacao: sortearInteiroComp(1, 100),
    participantes: [], // IDs de organizações/pessoas que disputarão o torneio
    historicoTemporadas: [], // IDs/edições anuais, conectados depois
  };
}

// Teste rápido: roda a função e imprime a competição gerada no
// console (arquivo ainda não ligado ao index.html).
console.log(gerarCompeticao());
