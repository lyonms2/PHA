/**
 * Funções utilitárias para Títulos de PvP
 */

/**
 * Retorna o gradiente de cor baseado no tipo de título
 */
export function getTituloColor(titulo) {
  if (titulo.titulo_nome?.includes('Campeão') || titulo.nome?.includes('Campeão')) return 'from-yellow-600 to-orange-600';
  if (titulo.titulo_nome?.includes('Vice') || titulo.nome?.includes('Vice')) return 'from-gray-400 to-gray-500';
  if (titulo.titulo_nome?.includes('3º') || titulo.nome?.includes('3º')) return 'from-orange-800 to-orange-700';
  if (titulo.titulo_nome?.includes('Top 10') || titulo.nome?.includes('Top 10')) return 'from-purple-600 to-pink-600';
  if (titulo.titulo_nome?.includes('Top 50') || titulo.nome?.includes('Top 50')) return 'from-blue-600 to-indigo-600';
  if (titulo.titulo_nome?.includes('Top 100') || titulo.nome?.includes('Top 100')) return 'from-cyan-600 to-blue-600';
  return 'from-blue-600 to-cyan-600';
}

/**
 * Lista de todos os títulos disponíveis no jogo
 * Com informações de como conquistá-los
 */
export const TITULOS_DISPONIVEIS = [
  {
    id: 'campeao',
    nome: 'Campeão da Temporada',
    icone: '👑',
    raridade: 'Lendário',
    requisito: '1º Lugar',
    descricao: 'Termine uma temporada em 1º lugar no ranking PvP',
    posicao_necessaria: 1,
    prestigio: 5
  },
  {
    id: 'vice',
    nome: 'Vice-Campeão',
    icone: '🥈',
    raridade: 'Épico',
    requisito: '2º Lugar',
    descricao: 'Termine uma temporada em 2º lugar no ranking PvP',
    posicao_necessaria: 2,
    prestigio: 4
  },
  {
    id: 'terceiro',
    nome: '3º Lugar',
    icone: '🥉',
    raridade: 'Épico',
    requisito: '3º Lugar',
    descricao: 'Termine uma temporada em 3º lugar no ranking PvP',
    posicao_necessaria: 3,
    prestigio: 4
  },
  {
    id: 'top10',
    nome: 'Elite Top 10',
    icone: '⭐',
    raridade: 'Raro',
    requisito: '4º - 10º Lugar',
    descricao: 'Termine uma temporada entre o 4º e 10º lugar',
    posicao_necessaria: 10,
    prestigio: 3
  },
  {
    id: 'top50',
    nome: 'Combatente Top 50',
    icone: '🏆',
    raridade: 'Incomum',
    requisito: '11º - 50º Lugar',
    descricao: 'Termine uma temporada entre o 11º e 50º lugar',
    posicao_necessaria: 50,
    prestigio: 2
  },
  {
    id: 'top100',
    nome: 'Guerreiro Top 100',
    icone: '🎖️',
    raridade: 'Comum',
    requisito: '51º - 100º Lugar',
    descricao: 'Termine uma temporada entre o 51º e 100º lugar',
    posicao_necessaria: 100,
    prestigio: 1
  }
];

/**
 * Retorna a cor da raridade
 */
export function getRaridadeColor(raridade) {
  const cores = {
    'Lendário': 'text-orange-400',
    'Épico': 'text-purple-400',
    'Raro': 'text-blue-400',
    'Incomum': 'text-green-400',
    'Comum': 'text-gray-400'
  };
  return cores[raridade] || 'text-gray-400';
}
