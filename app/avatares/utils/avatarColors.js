/**
 * Funções auxiliares para cores e estilos de avatares
 */

/**
 * Retorna classes Tailwind de gradiente baseado na raridade
 * @param {string} raridade - Raridade do avatar
 * @returns {string} Classes CSS de gradiente
 */
export function getCorRaridade(raridade) {
  switch (raridade) {
    case 'Lendário': return 'from-amber-500 to-yellow-500';
    case 'Raro': return 'from-purple-500 to-pink-500';
    default: return 'from-slate-600 to-slate-700';
  }
}

/**
 * Retorna classe Tailwind de borda baseado na raridade
 * @param {string} raridade - Raridade do avatar
 * @returns {string} Classe CSS de borda
 */
export function getCorBorda(raridade) {
  switch (raridade) {
    case 'Lendário': return 'border-amber-500/50';
    case 'Raro': return 'border-purple-500/50';
    default: return 'border-slate-700/50';
  }
}

/**
 * Retorna classe Tailwind de cor de texto baseado no elemento
 * @param {string} elemento - Elemento do avatar
 * @returns {string} Classe CSS de cor
 */
export function getCorElemento(elemento) {
  const cores = {
    'Fogo': 'text-orange-400',
    'Água': 'text-blue-400',
    'Terra': 'text-amber-600',
    'Vento': 'text-cyan-400',
    'Eletricidade': 'text-yellow-400',
    'Sombra': 'text-purple-400',
    'Luz': 'text-yellow-200'
  };
  return cores[elemento] || 'text-gray-400';
}

/**
 * Retorna emoji correspondente ao elemento
 * @param {string} elemento - Elemento do avatar
 * @returns {string} Emoji
 */
export function getEmojiElemento(elemento) {
  const emojis = {
    'Fogo': '🔥',
    'Água': '💧',
    'Terra': '🪨',
    'Vento': '💨',
    'Eletricidade': '⚡',
    'Sombra': '🌑',
    'Luz': '✨'
  };
  return emojis[elemento] || '⭐';
}

/**
 * Retorna informações sobre nível de exaustão
 * @param {number} exaustao - Nível de exaustão (0-100)
 * @returns {Object} { label: string, cor: string }
 */
export function getNivelExaustao(exaustao) {
  if (exaustao === 0) return { label: 'Descansado', cor: 'text-green-400' };
  if (exaustao < 20) return { label: 'Alerta', cor: 'text-cyan-400' };
  if (exaustao < 40) return { label: 'Cansado', cor: 'text-yellow-400' };
  if (exaustao < 60) return { label: 'Exausto', cor: 'text-orange-400' };
  if (exaustao < 80) return { label: 'Colapso Iminente', cor: 'text-red-400' };
  return { label: 'Colapsado', cor: 'text-red-600' };
}
