// ==================== SISTEMA DE COOLDOWN ====================
// Arquivo: /lib/combat/cooldownSystem.js
//
// Sistema unificado de cooldown para habilidades
// Usado por: Treino IA e PVP

/**
 * Decrementa cooldowns no início do turno
 * Remove habilidades que ficaram prontas (cooldown = 0)
 *
 * @param {Object} cooldowns - Objeto { nomeHabilidade: turnosRestantes }
 * @param {string} jogador - Nome do jogador (para logs)
 * @param {string} modo - 'TREINO' ou 'PVP' (para logs diferenciados)
 * @returns {Object} Novos cooldowns sem as habilidades que ficaram prontas
 */
export function decrementarCooldowns(cooldowns, jogador, modo = 'TREINO') {
  const novosCooldowns = {};
  let decrementados = [];

  for (const [habilidade, turnos] of Object.entries(cooldowns)) {
    const novosTurnos = turnos - 1;
    if (novosTurnos > 0) {
      novosCooldowns[habilidade] = novosTurnos;
      decrementados.push(`${habilidade}:${novosTurnos}`);
    } else {
      console.log(`✅ [COOLDOWN ${modo}] ${habilidade} de ${jogador} disponível novamente!`);
    }
  }

  if (decrementados.length > 0) {
    console.log(`⏱️ [COOLDOWN ${modo}] Cooldowns de ${jogador}: ${decrementados.join(', ')}`);
  }

  return novosCooldowns;
}

/**
 * Verifica se uma habilidade está em cooldown
 *
 * @param {Object} cooldowns - Objeto { nomeHabilidade: turnosRestantes }
 * @param {string} nomeHabilidade - Nome da habilidade a verificar
 * @returns {number} Turnos restantes (0 se disponível)
 */
export function getCooldownRestante(cooldowns, nomeHabilidade) {
  return (cooldowns || {})[nomeHabilidade] || 0;
}

/**
 * Ativa cooldown de uma habilidade após uso
 *
 * @param {Object} cooldowns - Cooldowns atuais
 * @param {string} nomeHabilidade - Nome da habilidade
 * @param {number} turnos - Número de turnos de cooldown
 * @param {string} jogador - Nome do jogador (para logs)
 * @param {string} modo - 'TREINO' ou 'PVP' (para logs)
 * @returns {Object} Cooldowns atualizados
 */
export function ativarCooldown(cooldowns, nomeHabilidade, turnos, jogador, modo = 'TREINO') {
  if (turnos <= 0) return cooldowns;

  const novosCooldowns = { ...cooldowns };
  novosCooldowns[nomeHabilidade] = turnos;

  console.log(`⏱️ [COOLDOWN ${modo}] ${nomeHabilidade} de ${jogador} em cooldown por ${turnos} turno(s)`);

  return novosCooldowns;
}
