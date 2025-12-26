/**
 * Funções utilitárias para Títulos de PvP
 */

/**
 * Retorna o gradiente de cor baseado no tipo de título
 */
export function getTituloColor(titulo) {
  if (titulo.titulo_nome.includes('Campeão')) return 'from-yellow-600 to-orange-600';
  if (titulo.titulo_nome.includes('Vice')) return 'from-gray-400 to-gray-500';
  if (titulo.titulo_nome.includes('3º')) return 'from-orange-800 to-orange-700';
  if (titulo.titulo_nome.includes('Top 10')) return 'from-purple-600 to-pink-600';
  return 'from-blue-600 to-cyan-600';
}
