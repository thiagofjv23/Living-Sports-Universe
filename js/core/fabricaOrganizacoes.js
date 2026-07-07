// =============================================================
// Núcleo (Core) — Fábrica de Organizações
// Passo 6 (Fase 2): geração da entidade global "Organização".
//
// Este arquivo é AGNÓSTICO: não conhece regras de nenhum esporte
// e (por ora) não tem qualquer ligação com atletas. Apenas cria
// uma instituição com atributos base, no mesmo espírito da
// Fábrica de Regens.
// =============================================================

// Listas curtas para sortear combinações de nome da organização.
const PREFIXOS_ORG = ["Clube", "Equipe", "Associação"];
const NOMES_ORG = ["Alpha", "Sparta", "Global", "Nacional"];

// Sorteia um número inteiro entre min e max (ambos inclusos).
function sortearInteiroOrg(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Sorteia um item qualquer de uma lista.
function sortearItemOrg(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

// Gera e retorna um objeto que representa uma organização fictícia.
function gerarOrganizacao() {
  return {
    id: crypto.randomUUID(),
    nome: `${sortearItemOrg(PREFIXOS_ORG)} ${sortearItemOrg(NOMES_ORG)}`,
    reputacao: sortearInteiroOrg(1, 100),
  };
}
