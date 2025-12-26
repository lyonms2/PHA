/**
 * Funções utilitárias para o Leaderboard PvP
 */

/**
 * Retorna informações de premiação baseado na posição
 */
export function getPremiacaoTier(posicao) {
  if (posicao === 1) return { tier: 'Ouro', cor: 'text-yellow-400', premio: '1000 Moedas + Título Lendário' };
  if (posicao === 2) return { tier: 'Prata', cor: 'text-gray-300', premio: '500 Moedas + Título Épico' };
  if (posicao === 3) return { tier: 'Bronze', cor: 'text-orange-600', premio: '250 Moedas + Título Raro' };
  if (posicao <= 10) return { tier: 'Top 10', cor: 'text-purple-400', premio: '100 Moedas' };
  if (posicao <= 50) return { tier: 'Top 50', cor: 'text-blue-400', premio: '50 Moedas' };
  return { tier: 'Participante', cor: 'text-gray-400', premio: '10 Moedas' };
}

/**
 * Retorna o ícone/emoji de rank baseado na posição
 */
export function getRankIcon(posicao) {
  if (posicao === 1) return '🥇';
  if (posicao === 2) return '🥈';
  if (posicao === 3) return '🥉';
  return `#${posicao}`;
}

/**
 * Retorna a classe de cor do texto baseado na posição
 */
export function getPosicaoColor(posicao) {
  if (posicao === 1) return 'text-yellow-400';
  if (posicao === 2) return 'text-gray-300';
  if (posicao === 3) return 'text-orange-600';
  return 'text-gray-500';
}
