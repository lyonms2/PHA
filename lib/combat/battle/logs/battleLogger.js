/**
 * Biblioteca centralizada de formatação de logs de batalha
 * Usada em TODO o jogo: Treino IA, PvP, Desafios, etc.
 */

/**
 * Formata log de ataque com todos os detalhes
 * @param {Object} log - Objeto de log do engine
 * @param {Object} detalhes - Detalhes do cálculo (opcional)
 * @returns {string} Log formatado para exibição
 */
export function formatAttackLog(log, detalhes) {
  const { jogador, alvo, errou, invisivel, esquivou, chanceAcerto, dano, critico, elemental, bloqueado } = log;

  // Erro/Esquiva
  if (errou) {
    return `${jogador} ERROU o ataque! ${invisivel ? '👻 Alvo INVISÍVEL!' : `💨 Esquivou! (Chance: ${Math.floor(chanceAcerto || 0)}%)`}`;
  }

  // Ataque acertou
  const criticoText = critico ? ' ⚡CRÍTICO!' : '';
  const elementalText = elemental && elemental !== 'normal' ? ` [${elemental}]` : '';
  const bloqueadoText = bloqueado ? ' 🛡️-50%' : '';

  let texto = `${jogador} atacou ${alvo}!\n💥 Dano: ${dano}${criticoText}${elementalText}${bloqueadoText}`;

  // Adicionar detalhes COMPLETOS de cálculo
  if (detalhes) {
    texto += `\n📊 Cálculo detalhado:`;

    // Mostrar COMO chegou no dano base
    if (detalhes.forca !== undefined) {
      texto += `\n  • Força: ${detalhes.forca}`;
      if (detalhes.random) texto += `\n  • Aleatório: +${detalhes.random}`;
      texto += `\n  = Base: ${detalhes.danoBase}`;
    } else if (detalhes.danoBase) {
      texto += `\n  • Base: ${detalhes.danoBase}`;
    }

    // Bônus e reduções
    if (detalhes.focoBonus) texto += `\n  • Foco: +${detalhes.focoBonus}`;
    if (detalhes.vinculoBonus) texto += `\n  • Vínculo: +${detalhes.vinculoBonus}`;
    if (detalhes.penalidadeExaustao) texto += `\n  • Exaustão: ${detalhes.penalidadeExaustao}`;
    if (detalhes.elementalMult && detalhes.elementalMult !== 1) texto += `\n  • Elemental: ×${detalhes.elementalMult}`;
    if (critico) texto += `\n  • Crítico: ×1.5`;
    if (bloqueado) texto += `\n  • Defendendo: ×0.5`;
    if (detalhes.reducaoDefesa) texto += `\n  • Resistência: -${detalhes.reducaoDefesa}`;
    texto += `\n  → Dano final: ${dano}`;
  }

  return texto;
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
 * @param {Object} detalhes - Detalhes do cálculo (opcional)
 * @returns {string} Log formatado
 */
export function formatAbilityLog(log, detalhes) {
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

    // Adicionar detalhes COMPLETOS de cálculo
    if (detalhes) {
      texto += `📊 Cálculo detalhado:\n`;

      // Mostrar COMO chegou no dano base
      if (detalhes.stat && detalhes.statValue !== undefined) {
        const danoBaseHab = detalhes.danoBaseHab || 15;
        const statBonus = Math.floor(detalhes.statValue * (detalhes.multiplicadorStat || 0.5));
        texto += `  • Dano habilidade: ${danoBaseHab}\n`;
        texto += `  • ${detalhes.stat.toUpperCase()}: ${detalhes.statValue} ×${(detalhes.multiplicadorStat || 0.5)} = +${statBonus}\n`;
        if (detalhes.random) texto += `  • Aleatório: +${detalhes.random}\n`;
        texto += `  = Base Total: ${detalhes.danoBase}\n`;
      } else {
        texto += `  • Base: ${detalhes.danoBase}\n`;
      }

      // Reduções e bônus
      if (detalhes.reducaoResistencia) texto += `  • Resistência oponente: -${detalhes.reducaoResistencia}\n`;
      if (detalhes.penalidadeExaustao) texto += `  • Exaustão: ${detalhes.penalidadeExaustao}\n`;
      if (detalhes.bonusVinculo) texto += `  • Vínculo: ${detalhes.bonusVinculo}\n`;
      if (detalhes.elementalMult && detalhes.elementalMult !== 1) texto += `  • Elemental: ×${detalhes.elementalMult}\n`;
      if (critico) texto += `  • Crítico: ×2.0\n`;
      if (bloqueado) texto += `  • Defendendo: ×0.5\n`;
      if (numGolpes > 1) texto += `  • Múltiplos golpes: ×${numGolpes}\n`;
      texto += `  → Dano final: ${dano}`;
    }
  }

  if (cura > 0) {
    texto += `\n💚 Cura: ${cura}`;
  }

  if (efeitos && efeitos.length > 0) {
    texto += `\n🎲 Efeitos aplicados: ${efeitos.join(', ')}`;
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

