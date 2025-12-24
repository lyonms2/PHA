/**
 * Utilitários para batalha de treinamento contra IA
 */

/**
 * Retorna emoji correspondente ao elemento
 * @param {string} elemento - Elemento do avatar
 * @returns {string} Emoji
 */
export function getElementoEmoji(elemento) {
  const emojis = {
    'Fogo': '🔥',
    'Água': '💧',
    'Terra': '🌍',
    'Vento': '💨',
    'Eletricidade': '⚡',
    'Luz': '✨',
    'Sombra': '🌑',
    'Void': '🕳️',
    'Aether': '✨'
  };
  return emojis[elemento] || '⚪';
}

/**
 * Retorna cor correspondente ao elemento
 * @param {string} elemento - Elemento do avatar
 * @returns {string} Classe Tailwind de cor
 */
export function getElementoCor(elemento) {
  const cores = {
    'Fogo': 'text-red-400',
    'Água': 'text-blue-400',
    'Terra': 'text-amber-600',
    'Vento': 'text-cyan-300',
    'Eletricidade': 'text-yellow-400',
    'Luz': 'text-yellow-300',
    'Sombra': 'text-purple-400',
    'Void': 'text-purple-900',
    'Aether': 'text-cyan-200'
  };
  return cores[elemento] || 'text-gray-400';
}

/**
 * Verifica se um efeito é um buff (positivo) ou debuff (negativo)
 * @param {string} tipoEfeito - Tipo do efeito
 * @returns {boolean} true se for buff, false se for debuff
 */
export function ehBuff(tipoEfeito) {
  const buffs = ['Regeneração', 'Escudo', 'Aumento de Força', 'Aumento de Agilidade', 'Invisível', 'Fortificado'];
  return buffs.includes(tipoEfeito);
}

/**
 * Retorna emoji correspondente ao efeito de status
 * @param {string} tipoEfeito - Tipo do efeito
 * @returns {string} Emoji
 */
export function getEfeitoEmoji(tipoEfeito) {
  const emojis = {
    'Queimadura': '🔥',
    'Sangramento': '🩸',
    'Envenenado': '☠️',
    'Atordoado': '💫',
    'Congelado': '❄️',
    'Paralisado': '⚡',
    'Regeneração': '💚',
    'Escudo': '🛡️',
    'Aumento de Força': '💪',
    'Aumento de Agilidade': '⚡',
    'Invisível': '👻',
    'Fortificado': '🗿'
  };
  return emojis[tipoEfeito] || '✨';
}
