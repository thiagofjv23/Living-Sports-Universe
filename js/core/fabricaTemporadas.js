// =============================================================
// Núcleo (Core) — Fábrica de Temporadas
// Passo 11 (Fase 2): a entidade "Temporada" (edição anual de um
// torneio).
//
// Este arquivo é AGNÓSTICO: não conhece regras de nenhuma
// modalidade. Cria o "caderno de registros" de UM ano de uma
// competição — vínculos por ID (competicaoId) e arrays vazios que
// serão preenchidos com IDs de jogos e a tabela de classificação.
// =============================================================

// Gera e devolve o objeto que representa uma edição anual de um
// torneio. A competição-mãe e o ano vêm por parâmetro.
function gerarTemporada(competicaoId, ano) {
  return {
    id: crypto.randomUUID(),
    competicaoId: competicaoId, // ID da competição-mãe (referência)
    ano: ano, // ano desta edição (ex.: 2024)
    rodadaAtual: 1, // em que rodada esta temporada está
    jogos: [], // IDs dos jogos/fatos ocorridos neste ano
    classificacao: [], // tabela de pontos das equipes participantes
  };
}
