/**
 * Funções utilitárias para Histórico PvP
 */

/**
 * Retorna o gradiente de cor baseado no tier
 */
export function getTierColor(tier) {
  const colors = {
    'LENDARIO': 'from-orange-600 to-red-600',
    'DIAMANTE': 'from-cyan-600 to-blue-600',
    'PLATINA': 'from-teal-600 to-green-600',
    'OURO': 'from-yellow-600 to-amber-600',
    'PRATA': 'from-gray-400 to-gray-500',
    'BRONZE': 'from-orange-800 to-orange-900'
  };
  return colors[tier] || 'from-gray-600 to-gray-700';
}

/**
 * Retorna o ícone correspondente ao tier
 */
export function getTierIcon(tier) {
  const icons = {
    'LENDARIO': '👑',
    'DIAMANTE': '💎',
    'PLATINA': '🏆',
    'OURO': '🥇',
    'PRATA': '🥈',
    'BRONZE': '🥉'
  };
  return icons[tier] || '📊';
}

/**
 * Retorna o ícone correspondente à posição no ranking
 */
export function getPosicaoIcon(posicao) {
  if (posicao === 1) return "🥇";
  if (posicao === 2) return "🥈";
  if (posicao === 3) return "🥉";
  if (posicao <= 10) return "⭐";
  if (posicao <= 50) return "🏆";
  if (posicao <= 100) return "🎖️";
  return "📊";
}

/**
 * Calcula a taxa de vitórias (win rate)
 */
export function calcularWinRate(vitorias, derrotas) {
  const total = vitorias + derrotas;
  if (total === 0) return 0;
  return Math.round((vitorias / total) * 100);
}
