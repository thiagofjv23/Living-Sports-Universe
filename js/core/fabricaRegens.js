// =============================================================
// Núcleo (Core) — Fábrica de Regens
// Passo 1 do MVP: geração de entidades globais "Atleta".
//
// Este arquivo é AGNÓSTICO: não conhece regras de nenhum esporte.
// Apenas cria uma pessoa (atleta) com atributos base.
// =============================================================

// Pequenas listas para o sorteio de nomes.
const NOMES = ["Lucas", "Rafael", "Bruno", "Diego", "Mateus", "Gabriel"];
const SOBRENOMES = ["Silva", "Souza", "Oliveira", "Costa", "Pereira", "Almeida"];

// Sorteia um número inteiro entre min e max (ambos inclusos).
function sortearInteiro(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Sorteia um item qualquer de uma lista.
function sortearItem(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

// Gera e retorna um objeto que representa um atleta fictício.
function gerarAtleta() {
  return {
    id: crypto.randomUUID(),
    nome: `${sortearItem(NOMES)} ${sortearItem(SOBRENOMES)}`,
    idade: sortearInteiro(16, 35),
    habilidade: sortearInteiro(1, 100),
  };
}

// Teste rápido: roda a função e imprime o resultado no console do navegador.
console.log(gerarAtleta());
