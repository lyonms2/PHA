/**
 * Biblioteca centralizada de formatação de logs de batalha
 * Usada em TODO o jogo: Treino IA, PvP, Desafios, etc.
 */

/**
 * Formata log de ataque com todos os detalhes
 * @param {Object} log - Objeto de log do engine
 * @returns {string} Log formatado para exibição
 */
export function formatAttackLog(log) {
  const { jogador, alvo, errou, invisivel, esquivou, chanceAcerto, dano, critico, elemental, bloqueado } = log;

  // Erro/Esquiva
  if (errou) {
    return `${jogador} ERROU o ataque! ${invisivel ? '👻 Alvo INVISÍVEL!' : `💨 Esquivou! (Chance: ${Math.floor(chanceAcerto || 0)}%)`}`;
  }

  // Ataque acertou
  const criticoText = critico ? ' ⚡CRÍTICO!' : '';
  const elementalText = elemental && elemental !== 'normal' ? ` [${elemental}]` : '';
  const bloqueadoText = bloqueado ? ' 🛡️-50%' : '';

  return `${jogador} atacou ${alvo}!
💥 Dano: ${dano}${criticoText}${elementalText}${bloqueadoText}`;
}

/**
 * Formata log de defesa
 * @param {Object} log - Objeto de log do engine
 * @param {number} newEnergy - Nova energia após defesa
 * @returns {string} Log formatado
 */
export function formatDefendLog(log, newEnergy) {
  const { jogador, energiaRecuperada } = log;

  return `${jogador} defendeu!
🛡️ Redução de dano: -50% no próximo ataque
⚡ Energia: +${energiaRecuperada || 20} (Total: ${newEnergy || 100})`;
}

/**
 * Formata log de habilidade
 * @param {Object} log - Objeto de log do engine
 * @returns {string} Log formatado
 */
export function formatAbilityLog(log) {
  const { jogador, alvo, habilidade, errou, invisivel, esquivou, dano, cura, critico, elemental, bloqueado, numGolpes, efeitos } = log;

  // Erro/Esquiva
  if (errou) {
    return `${jogador} usou ${habilidade} mas ERROU! ${invisivel ? '👻 Alvo INVISÍVEL!' : '💨 Esquivou!'}`;
  }

  // Habilidade acertou
  let texto = `${jogador} usou ${habilidade}!\n`;

  if (dano > 0) {
    const criticoText = critico ? ' ⚡CRÍTICO!' : '';
    const elementalText = elemental && elemental !== 'normal' ? ` [${elemental}]` : '';
    const bloqueadoText = bloqueado ? ' 🛡️-50%' : '';
    const golpesText = numGolpes > 1 ? ` (${numGolpes}× golpes)` : '';
    texto += `✨ Dano: ${dano}${golpesText}${criticoText}${elementalText}${bloqueadoText}\n`;
  }

  if (cura > 0) {
    texto += `💚 Cura: ${cura}\n`;
  }

  if (efeitos && efeitos.length > 0) {
    texto += `🎲 Efeitos: ${efeitos.join(', ')}`;
  }

  return texto.trim();
}

/**
 * Formata log de efeitos (DoT, HoT, etc)
 * @param {Array} efeitosProcessados - Array de efeitos processados
 * @param {string} targetName - Nome de quem sofreu os efeitos
 * @returns {Array<string>} Array de logs formatados
 */
export function formatEffectsLogs(efeitosProcessados, targetName) {
  const logs = [];

  for (const efeito of efeitosProcessados) {
    if (efeito.acao === 'dano') {
      const emoji = getEfeitoEmoji(efeito.tipo);
      logs.push(`${emoji} ${targetName} sofreu ${efeito.valor} de dano de ${efeito.tipo}!`);
    } else if (efeito.acao === 'cura') {
      const emoji = getEfeitoEmoji(efeito.tipo);
      logs.push(`${emoji} ${targetName} curou ${efeito.valor} HP de ${efeito.tipo}!`);
    } else if (efeito.acao === 'expirou') {
      logs.push(`⏱️ Efeito ${efeito.tipo} de ${targetName} expirou!`);
    }
  }

  return logs;
}

/**
 * Retorna emoji para um efeito
 * @param {string} tipoEfeito - Tipo do efeito
 * @returns {string} Emoji
 */
function getEfeitoEmoji(tipoEfeito) {
  const emojis = {
    'queimadura': '🔥',
    'queimadura_intensa': '🔥',
    'veneno': '🧪',
    'sangramento': '🩸',
    'eletrocutado': '⚡',
    'eletrocucao': '⚡',
    'regeneração': '💚',
    'regeneracao': '💚',
    'auto_cura': '💚',
    'escudo': '🛡️',
    'invisivel': '👻',
    'atordoado': '💫',
    'congelado': '❄️',
    'enraizado': '🌿'
  };

  return emojis[tipoEfeito] || '✨';
}

