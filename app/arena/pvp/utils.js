/**
 * Funções utilitárias para o sistema PvP
 */

/**
 * Retorna informações do tier baseado na fama
 */
export function getTierInfo(fama) {
  if (fama >= 5000) return { nome: 'Lendário', cor: 'text-red-400', icone: '👑', bg: 'from-red-900/30' };
  if (fama >= 4000) return { nome: 'Diamante', cor: 'text-cyan-300', icone: '💎', bg: 'from-cyan-900/30' };
  if (fama >= 3000) return { nome: 'Platina', cor: 'text-purple-300', icone: '🔮', bg: 'from-purple-900/30' };
  if (fama >= 2000) return { nome: 'Ouro', cor: 'text-yellow-400', icone: '🥇', bg: 'from-yellow-900/30' };
  if (fama >= 1000) return { nome: 'Prata', cor: 'text-gray-300', icone: '🥈', bg: 'from-gray-700/30' };
  return { nome: 'Bronze', cor: 'text-orange-400', icone: '🥉', bg: 'from-orange-900/30' };
}

/**
 * Retorna a classe CSS de cor para um elemento
 */
export function getElementoColor(elemento) {
  const cores = {
    'Fogo': 'text-red-400',
    'Água': 'text-blue-400',
    'Terra': 'text-amber-600',
    'Vento': 'text-cyan-300',
    'Luz': 'text-yellow-300',
    'Sombra': 'text-purple-400',
    'Eletricidade': 'text-yellow-400'
  };
  return cores[elemento] || 'text-gray-400';
}

/**
 * Retorna a classe CSS de cor para uma raridade
 */
export function getRaridadeColor(raridade) {
  const cores = {
    'Comum': 'text-gray-400',
    'Incomum': 'text-green-400',
    'Raro': 'text-blue-400',
    'Épico': 'text-purple-400',
    'Lendário': 'text-orange-400',
    'Mítico': 'text-red-400'
  };
  return cores[raridade] || 'text-gray-400';
}

/**
 * Retorna o emoji correspondente ao elemento
 */
export function getElementoEmoji(elemento) {
  const emojis = {
    'Fogo': '🔥',
    'Água': '💧',
    'Terra': '🪨',
    'Vento': '💨',
    'Eletricidade': '⚡',
    'Luz': '✨',
    'Sombra': '🌑'
  };
  return emojis[elemento] || '🛡️';
}

/**
 * Formata o tempo em segundos para mm:ss
 */
export function formatarTempo(segundos) {
  const min = Math.floor(segundos / 60);
  const sec = segundos % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}
