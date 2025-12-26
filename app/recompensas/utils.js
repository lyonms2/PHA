/**
 * Funções utilitárias para Recompensas de PvP
 */

/**
 * Retorna o ícone correspondente à posição no ranking
 * Versão para recompensas (usa 👑 para 1º lugar)
 */
export function getTierIcon(posicao) {
  if (posicao === 1) return "👑";
  if (posicao === 2) return "🥈";
  if (posicao === 3) return "🥉";
  if (posicao <= 10) return "⭐";
  if (posicao <= 50) return "🏆";
  if (posicao <= 100) return "🎖️";
  return "📊";
}
