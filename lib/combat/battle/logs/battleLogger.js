/**
 * Biblioteca de formatação de logs de batalha
 * Usada tanto no backend quanto no frontend para garantir consistência
 */

/**
 * Formata log de ataque para exibição
 * @param {Object} result - Resultado da ação do engine
 * @param {string} attackerName - Nome de quem atacou
 * @param {string} defenderName - Nome de quem recebeu o ataque
 * @returns {string} Log formatado
 */
export function formatAttackLog(result, attackerName, defenderName) {
  if (!result || !result.log) return '';

  // Se já tem detalhes formatados, usar direto
  if (result.log.detalhes) {
    return result.log.detalhes;
  }

  // Fallback: construir log a partir dos dados
  const { log } = result;

  if (log.errou) {
    return `${attackerName} ERROU o ataque! ${log.invisivel ? '👻 Alvo INVISÍVEL!' : `💨 Esquivou! (Chance: ${Math.floor(log.chanceAcerto || 0)}%)`}`;
  }

  const dano = log.dano || 0;
  const critico = log.critico ? ' ⚡CRÍTICO!' : '';
  const elemental = log.elemental && log.elemental !== 'normal' ? ` [${log.elemental}]` : '';
  const bloqueado = log.bloqueado ? ' 🛡️-50%' : '';

  return `${attackerName} atacou ${defenderName}!
💥 Dano: ${dano}${critico}${elemental}${bloqueado}`;
}

/**
 * Formata log de defesa para exibição
 * @param {Object} result - Resultado da ação do engine
 * @param {string} defenderName - Nome de quem defendeu
 * @returns {string} Log formatado
 */
export function formatDefendLog(result, defenderName) {
  if (!result || !result.log) return '';

  // Se já tem detalhes formatados, usar direto
  if (result.log.detalhes) {
    return result.log.detalhes;
  }

  // Fallback: construir log a partir dos dados
  const energiaRecuperada = result.energiaRecuperada || 20;
  const newEnergy = result.attacker?.energy || 100;

  return `${defenderName} defendeu!
🛡️ Redução de dano: -50% no próximo ataque
⚡ Energia: +${energiaRecuperada} (Total: ${newEnergy})`;
}

/**
 * Formata log de habilidade para exibição
 * @param {Object} result - Resultado da ação do engine
 * @param {string} attackerName - Nome de quem usou
 * @param {string} defenderName - Nome do alvo
 * @param {string} habilidadeNome - Nome da habilidade
 * @returns {string} Log formatado
 */
export function formatAbilityLog(result, attackerName, defenderName, habilidadeNome) {
  if (!result || !result.log) return '';

  // Se já tem detalhes formatados, usar direto
  if (result.log.detalhes) {
    return result.log.detalhes;
  }

  // Fallback: construir log a partir dos dados
  const { log } = result;

  if (log.errou) {
    return `${attackerName} usou ${habilidadeNome} mas ERROU! ${log.invisivel ? '👻 Alvo INVISÍVEL!' : '💨 Esquivou!'}`;
  }

  let texto = `${attackerName} usou ${habilidadeNome}!\n`;

  if (log.dano > 0) {
    const critico = log.critico ? ' ⚡CRÍTICO!' : '';
    const elemental = log.elemental && log.elemental !== 'normal' ? ` [${log.elemental}]` : '';
    const bloqueado = log.bloqueado ? ' 🛡️-50%' : '';
    const golpes = log.numGolpes > 1 ? ` (${log.numGolpes}× golpes)` : '';
    texto += `✨ Dano: ${log.dano}${golpes}${critico}${elemental}${bloqueado}\n`;
  }

  if (log.cura > 0) {
    texto += `💚 Cura: ${log.cura}\n`;
  }

  if (log.efeitos && log.efeitos.length > 0) {
    texto += `🎲 Efeitos: ${log.efeitos.join(', ')}`;
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
