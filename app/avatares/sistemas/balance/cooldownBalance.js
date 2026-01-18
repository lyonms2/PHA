// ==================== BALANCEAMENTO DE COOLDOWNS E DURAÇÕES ====================
// Arquivo: /app/avatares/sistemas/balance/cooldownBalance.js
//
// Define todos os cooldowns de habilidades e durações de efeitos
// Usado por: Treino IA, PVP, Missões
//
// IMPORTANTE: Este arquivo resolve problemas de:
// - Cooldowns inconsistentes
// - Durações de efeitos confusas
// - Bug do +1 em efeitos self
// ================================================================

/**
 * FILOSOFIA DE COOLDOWNS:
 *
 * - Habilidades FORTES devem ter cooldown ALTO (evita spam)
 * - Habilidades FRACAS podem ter cooldown BAIXO (uso mais frequente)
 * - Cooldown = número de turnos que deve ESPERAR antes de usar novamente
 *
 * EXEMPLO:
 * - Cooldown 1: Usa turno 1 → Espera turno 2 → Pode usar turno 3
 * - Cooldown 2: Usa turno 1 → Espera turnos 2,3 → Pode usar turno 4
 * - Cooldown 3: Usa turno 1 → Espera turnos 2,3,4 → Pode usar turno 5
 */
export const COOLDOWN_BALANCE = {

  // ==================== COOLDOWNS POR TIPO DE HABILIDADE ====================

  /**
   * HABILIDADES DE DANO
   * Quanto mais forte, maior o cooldown
   */
  COOLDOWN_DANO_FRACO: 1,        // Pode usar quase todo turno
  COOLDOWN_DANO_MEDIO: 2,        // Usa a cada 2-3 turnos
  COOLDOWN_DANO_FORTE: 3,        // Usa a cada 3-4 turnos (ultimate)

  /**
   * HABILIDADES DE CURA
   * Cooldown alto para evitar spam (cura é muito forte)
   */
  COOLDOWN_CURA_PEQUENA: 3,      // Cura 25% HP
  COOLDOWN_CURA_GRANDE: 4,       // Cura 50% HP (se existir)

  /**
   * HABILIDADES DE BUFF (aplicadas em si mesmo)
   * Cooldown médio-alto (buffs são muito fortes)
   */
  COOLDOWN_BUFF_FRACO: 2,        // +20% stat
  COOLDOWN_BUFF_MEDIO: 3,        // +30% stat (Sobrecarga)
  COOLDOWN_BUFF_FORTE: 4,        // +50% stat

  /**
   * HABILIDADES DE DEBUFF (aplicadas no inimigo)
   * Cooldown médio (debuffs têm chance de falhar)
   */
  COOLDOWN_DEBUFF_FRACO: 2,      // -20% stat
  COOLDOWN_DEBUFF_MEDIO: 3,      // -30% stat
  COOLDOWN_DEBUFF_FORTE: 4,      // -50% stat

  /**
   * HABILIDADES DE CONTROLE (stun, paralisia, etc)
   * Cooldown MUITO alto (controle é extremamente forte)
   */
  COOLDOWN_CONTROLE_FRACO: 3,    // 30% chance de paralisar
  COOLDOWN_CONTROLE_MEDIO: 4,    // 70% chance de paralisar
  COOLDOWN_CONTROLE_FORTE: 5,    // 100% chance de paralisar

  /**
   * HABILIDADES DE SUPORTE ESPECIAL (invisibilidade, escudo, etc)
   * Cooldown alto (efeitos únicos são fortes)
   */
  COOLDOWN_SUPORTE_ESPECIAL: 4,


  // ==================== DURAÇÕES DE EFEITOS ====================

  /**
   * IMPORTANTE: Entendendo as Durações
   *
   * Os efeitos são DECREMENTADOS no INÍCIO de cada turno.
   * Por isso, valores parecem "estranhos":
   *
   * EFEITO APLICADO NO INIMIGO:
   * - duracao: 2
   * - Turno 1: Aplica (turnosRestantes: 2)
   * - Turno 2 início: Decrementa (turnosRestantes: 1) ✅ ATIVO
   * - Turno 3 início: Decrementa (turnosRestantes: 0) ❌ EXPIRA
   * - Resultado: Ativo por 1 turno completo ✅
   *
   * EFEITO APLICADO EM SI MESMO (SELF):
   * - duracao: 2
   * - Turno 1: Aplica (turnosRestantes: 2)
   * - Turno 1 MESMO: Não pode usar buff ainda (turno já usado)
   * - Turno 2 início: Decrementa (turnosRestantes: 1) ✅ ATIVO
   * - Turno 3 início: Decrementa (turnosRestantes: 0) ❌ EXPIRA
   * - Resultado: Ativo por 1 turno completo ✅
   *
   * Para buff durar 2 turnos COMPLETOS em SELF, precisa duracao: 3!
   */

  /**
   * BUFFS APLICADOS EM SI MESMO (alvo: 'self')
   * +1 porque decrementa antes de poder usar
   *
   * FRACO: Ativo por 1 turno completo
   * MEDIO: Ativo por 2 turnos completos (Sobrecarga)
   * FORTE: Ativo por 3 turnos completos
   */
  DURACAO_BUFF_SELF_FRACO: 2,    // 2 → 1 turno ativo
  DURACAO_BUFF_SELF_MEDIO: 3,    // 3 → 2 turnos ativos ✅
  DURACAO_BUFF_SELF_FORTE: 4,    // 4 → 3 turnos ativos

  /**
   * BUFFS APLICADOS EM ALIADO
   * Sem +1 porque aliado pode usar no mesmo turno
   */
  DURACAO_BUFF_ALIADO: 2,

  /**
   * DEBUFFS APLICADOS NO INIMIGO
   * Sem +1 porque inimigo sofre efeito imediatamente
   *
   * FRACO: 1 turno ativo
   * MEDIO: 2 turnos ativos
   * FORTE: 3 turnos ativos
   */
  DURACAO_DEBUFF_FRACO: 2,       // 2 → 1 turno ativo
  DURACAO_DEBUFF_MEDIO: 3,       // 3 → 2 turnos ativos
  DURACAO_DEBUFF_FORTE: 4,       // 4 → 3 turnos ativos

  /**
   * EFEITOS DE CONTROLE (paralisia, stun, atordoado)
   * Duração CURTA porque são muito fortes
   * Impede o inimigo de agir
   */
  DURACAO_CONTROLE_FRACO: 1,     // 1 → 0 turnos (chance baixa, sem duração)
  DURACAO_CONTROLE_MEDIO: 2,     // 2 → 1 turno sem agir
  DURACAO_CONTROLE_FORTE: 3,     // 3 → 2 turnos sem agir (muito forte!)

  /**
   * DANO/CURA CONTÍNUA (DoT/HoT)
   * Duração MÉDIA para acumular efeito
   *
   * Exemplo queimadura (5% HP/turno por 3 turnos):
   * - Total: 15% HP perdido
   */
  DURACAO_DOT_FRACO: 2,          // 2 turnos de dano
  DURACAO_DOT_MEDIO: 3,          // 3 turnos de dano
  DURACAO_DOT_FORTE: 4,          // 4 turnos de dano

  DURACAO_HOT_FRACO: 2,          // 2 turnos de cura
  DURACAO_HOT_MEDIO: 3,          // 3 turnos de cura

  /**
   * EFEITOS ESPECIAIS (invisibilidade, escudo, etc)
   * Duração baseada na força do efeito
   */
  DURACAO_ESPECIAL_CURTA: 2,     // 1 turno ativo
  DURACAO_ESPECIAL_MEDIA: 3,     // 2 turnos ativos
  DURACAO_ESPECIAL_LONGA: 4,     // 3 turnos ativos
};

/**
 * Obtém cooldown baseado no tipo de habilidade
 * @param {string} tipo - Tipo da habilidade
 * @param {string} intensidade - 'FRACO', 'MEDIO', 'FORTE'
 * @returns {number} Cooldown em turnos
 */
export function getCooldown(tipo, intensidade = 'MEDIO') {
  const mapa = {
    'DANO': {
      FRACO: COOLDOWN_BALANCE.COOLDOWN_DANO_FRACO,
      MEDIO: COOLDOWN_BALANCE.COOLDOWN_DANO_MEDIO,
      FORTE: COOLDOWN_BALANCE.COOLDOWN_DANO_FORTE
    },
    'CURA': {
      FRACO: COOLDOWN_BALANCE.COOLDOWN_CURA_PEQUENA,
      MEDIO: COOLDOWN_BALANCE.COOLDOWN_CURA_PEQUENA,
      FORTE: COOLDOWN_BALANCE.COOLDOWN_CURA_GRANDE
    },
    'BUFF': {
      FRACO: COOLDOWN_BALANCE.COOLDOWN_BUFF_FRACO,
      MEDIO: COOLDOWN_BALANCE.COOLDOWN_BUFF_MEDIO,
      FORTE: COOLDOWN_BALANCE.COOLDOWN_BUFF_FORTE
    },
    'DEBUFF': {
      FRACO: COOLDOWN_BALANCE.COOLDOWN_DEBUFF_FRACO,
      MEDIO: COOLDOWN_BALANCE.COOLDOWN_DEBUFF_MEDIO,
      FORTE: COOLDOWN_BALANCE.COOLDOWN_DEBUFF_FORTE
    },
    'CONTROLE': {
      FRACO: COOLDOWN_BALANCE.COOLDOWN_CONTROLE_FRACO,
      MEDIO: COOLDOWN_BALANCE.COOLDOWN_CONTROLE_MEDIO,
      FORTE: COOLDOWN_BALANCE.COOLDOWN_CONTROLE_FORTE
    },
    'SUPORTE': {
      FRACO: COOLDOWN_BALANCE.COOLDOWN_SUPORTE_ESPECIAL,
      MEDIO: COOLDOWN_BALANCE.COOLDOWN_SUPORTE_ESPECIAL,
      FORTE: COOLDOWN_BALANCE.COOLDOWN_SUPORTE_ESPECIAL
    }
  };

  return mapa[tipo]?.[intensidade] || 2;
}

/**
 * Obtém duração baseada no tipo de efeito e alvo
 * @param {string} tipo - Tipo do efeito ('BUFF', 'DEBUFF', 'DOT', etc)
 * @param {string} alvo - 'self', 'inimigo', 'aliado'
 * @param {string} intensidade - 'FRACO', 'MEDIO', 'FORTE'
 * @returns {number} Duração em turnos
 */
export function getDuracao(tipo, alvo, intensidade = 'MEDIO') {
  // BUFFS
  if (tipo === 'BUFF') {
    if (alvo === 'self' || alvo === 'proprio') {
      return {
        FRACO: COOLDOWN_BALANCE.DURACAO_BUFF_SELF_FRACO,
        MEDIO: COOLDOWN_BALANCE.DURACAO_BUFF_SELF_MEDIO,
        FORTE: COOLDOWN_BALANCE.DURACAO_BUFF_SELF_FORTE
      }[intensidade] || COOLDOWN_BALANCE.DURACAO_BUFF_SELF_MEDIO;
    }
    return COOLDOWN_BALANCE.DURACAO_BUFF_ALIADO;
  }

  // DEBUFFS
  if (tipo === 'DEBUFF') {
    return {
      FRACO: COOLDOWN_BALANCE.DURACAO_DEBUFF_FRACO,
      MEDIO: COOLDOWN_BALANCE.DURACAO_DEBUFF_MEDIO,
      FORTE: COOLDOWN_BALANCE.DURACAO_DEBUFF_FORTE
    }[intensidade] || COOLDOWN_BALANCE.DURACAO_DEBUFF_MEDIO;
  }

  // CONTROLE
  if (tipo === 'CONTROLE') {
    return {
      FRACO: COOLDOWN_BALANCE.DURACAO_CONTROLE_FRACO,
      MEDIO: COOLDOWN_BALANCE.DURACAO_CONTROLE_MEDIO,
      FORTE: COOLDOWN_BALANCE.DURACAO_CONTROLE_FORTE
    }[intensidade] || COOLDOWN_BALANCE.DURACAO_CONTROLE_MEDIO;
  }

  // DOT (Dano contínuo)
  if (tipo === 'DOT') {
    return {
      FRACO: COOLDOWN_BALANCE.DURACAO_DOT_FRACO,
      MEDIO: COOLDOWN_BALANCE.DURACAO_DOT_MEDIO,
      FORTE: COOLDOWN_BALANCE.DURACAO_DOT_FORTE
    }[intensidade] || COOLDOWN_BALANCE.DURACAO_DOT_MEDIO;
  }

  // HOT (Cura contínua)
  if (tipo === 'HOT') {
    return {
      FRACO: COOLDOWN_BALANCE.DURACAO_HOT_FRACO,
      MEDIO: COOLDOWN_BALANCE.DURACAO_HOT_MEDIO,
      FORTE: COOLDOWN_BALANCE.DURACAO_HOT_MEDIO
    }[intensidade] || COOLDOWN_BALANCE.DURACAO_HOT_MEDIO;
  }

  // ESPECIAL
  return COOLDOWN_BALANCE.DURACAO_ESPECIAL_MEDIA;
}
