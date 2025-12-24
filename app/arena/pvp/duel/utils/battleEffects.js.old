/**
 * Utilitários para efeitos visuais e processamento de batalha no duelo PvP
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
    'Terra': '🪨',
    'Vento': '🌪️',
    'Eletricidade': '⚡',
    'Luz': '✨',
    'Sombra': '🌑'
  };
  return emojis[elemento] || '⚪';
}

/**
 * Retorna emoji correspondente ao efeito de status
 * @param {string} tipo - Tipo do efeito
 * @returns {string} Emoji
 */
export function getEfeitoEmoji(tipo) {
  const emojis = {
    // Dano contínuo
    'queimadura': '🔥', 'queimadura_intensa': '🔥🔥', 'veneno': '💀', 'sangramento': '🩸',
    'eletrocutado': '⚡', 'eletrocucao': '⚡', 'afogamento': '💧', 'erosão': '🌪️',
    'maldito': '💀', 'maldição': '💀',
    // Buffs
    'defesa_aumentada': '🛡️', 'velocidade': '💨', 'velocidade_aumentada': '⚡💨',
    'evasao_aumentada': '👻', 'foco_aumentado': '🎯',
    'forca_aumentada': '💪', 'regeneração': '💚', 'regeneracao': '💚', 'escudo': '🛡️',
    'bencao': '✨', 'benção': '✨', 'sobrecarga': '⚡🔴', 'precisao_aumentada': '🎯',
    'invisivel': '👻', 'auto_cura': '💚',
    // Debuffs
    'lentidão': '🐌', 'lentidao': '🐌', 'fraqueza': '⬇️', 'confusão': '🌀',
    'medo': '😱', 'cegueira': '🌑', 'silêncio': '🔇',
    'enfraquecido': '⬇️', 'terror': '😱💀', 'desorientado': '🌀',
    // Controle
    'congelado': '❄️', 'atordoado': '💫', 'paralisado': '⚡⚡', 'paralisia': '⚡⚡',
    'paralisia_intensa': '⚡⚡⚡', 'imobilizado': '🔒', 'sono': '😴',
    // Especiais
    'fantasma': '👻', 'drenar': '🗡️',
    'queimadura_contra_ataque': '🔥🛡️', 'roubo_vida': '🩸', 'roubo_vida_intenso': '🩸🩸',
    'roubo_vida_massivo': '🩸🩸🩸', 'perfuracao': '🗡️', 'execucao': '💀⚔️',
    'fissuras_explosivas': '💥🌍', 'vendaval_cortante': '💨⚔️',
    'limpar_debuffs': '✨🧹', 'dano_massivo_inimigos': '💥'
  };
  return emojis[tipo] || '✨';
}

/**
 * Verifica se um efeito é um buff (positivo) ou debuff (negativo)
 * @param {string} tipo - Tipo do efeito
 * @returns {boolean} true se for buff, false se for debuff
 */
export function ehBuff(tipo) {
  const buffsPositivos = [
    'defesa_aumentada', 'velocidade', 'velocidade_aumentada', 'foco_aumentado', 'forca_aumentada',
    'regeneração', 'regeneracao', 'escudo', 'evasao_aumentada',
    'invisivel', 'sobrecarga', 'benção', 'bencao', 'queimadura_contra_ataque',
    'precisao_aumentada', 'auto_cura', 'limpar_debuffs'
  ];
  return buffsPositivos.includes(tipo);
}

/**
 * Retorna nome da sala baseado no poder máximo permitido
 * @param {number} maxPower - Poder máximo da sala
 * @returns {string} Nome da sala com emoji
 */
export function getNomeSala(maxPower) {
  if (maxPower <= 39) return '🌱 Sala Iniciante';
  if (maxPower <= 60) return '⚡ Sala Intermediário';
  if (maxPower <= 90) return '🔥 Sala Avançado';
  return '👑 Sala Elite';
}
