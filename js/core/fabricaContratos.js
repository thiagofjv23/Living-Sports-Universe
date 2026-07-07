// =============================================================
// Núcleo (Core) — Fábrica de Contratos
// Passo 18 (Fase 3): a entidade "Contrato", que formaliza o
// vínculo (com prazo e valor) entre uma Pessoa e uma Organização.
//
// Este arquivo é AGNÓSTICO: não conhece esporte nem interface.
// Guarda apenas IDs (normalização) + números/datas. O contrato é
// uma entidade PRÓPRIA — não um campo solto dentro do atleta.
// =============================================================

// Sorteia um número inteiro entre min e max (ambos inclusos).
function sortearInteiroContrato(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Gera e retorna um objeto que representa um contrato.
// Recebe apenas IDs + o ano atual (por isso o salário é um sorteio
// simples aqui; quando houver acesso ao objeto da pessoa, pode virar
// um cálculo baseado na habilidade).
function gerarContrato(pessoaId, organizacaoId, anoAtual) {
  const duracao = sortearInteiroContrato(1, 5); // 1 a 5 anos de vínculo

  return {
    id: crypto.randomUUID(),
    pessoaId: pessoaId, // ID do atleta (referência)
    organizacaoId: organizacaoId, // ID da equipe (referência)
    anoInicio: anoAtual, // ano em que o contrato é firmado
    anoFim: anoAtual + duracao, // ano em que o vínculo expira
    salario: sortearInteiroContrato(50, 500), // valor financeiro base
    ativo: true, // facilita checar contratos rescindidos/expirados
  };
}

// Teste rápido: cria um contrato com IDs fictícios e o ano atual, e
// imprime no console (arquivo ainda não ligado ao index.html).
console.log(gerarContrato("pessoa-ficticia-1", "organizacao-ficticia-9", 2026));
