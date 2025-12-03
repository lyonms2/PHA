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
    'Sombra': '🌑'
  };
  return emojis[elemento] || '⚪';
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
