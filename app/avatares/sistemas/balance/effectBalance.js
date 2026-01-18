// ==================== BALANCEAMENTO DE EFEITOS ====================
// Arquivo: /app/avatares/sistemas/balance/effectBalance.js
//
// Define intensidade de todos os efeitos de status
// Usado por: Treino IA, PVP, Missões
//
// IMPORTANTE: Este arquivo resolve problemas de:
// - Buffs muito fortes (Sobrecarga +60% era OP!)
// - Debuffs muito fracos
// - DoTs inúteis
// ================================================================

/**
 * FILOSOFIA DE EFEITOS:
 *
 * BUFFS:
 * - FRACO: +20-30% (uso frequente, cooldown baixo)
 * - MEDIO: +30-40% (uso moderado, cooldown médio) ← Sobrecarga
 * - FORTE: +50%+ (uso raro, cooldown alto)
 *
 * DEBUFFS:
 * - Sempre MENORES que buffs (tem chance de falhar)
 * - FRACO: -15-20%
 * - MEDIO: -25-30%
 * - FORTE: -40-50%
 *
 * DOTs (Dano contínuo):
 * - Deve acumular dano significativo ao longo dos turnos
 * - FRACO: 5% HP/turno × 2 turnos = 10% HP total
 * - MEDIO: 8% HP/turno × 3 turnos = 24% HP total
 * - FORTE: 12% HP/turno × 4 turnos = 48% HP total
 */
export const EFFECT_BALANCE = {

  // ==================== BUFFS DE STAT (aplicados em si mesmo) ====================

  /**
   * BUFF FRACO: +20-30%
   * Exemplos: Precisão aumentada, foco menor
   * Cooldown: 2-3 | Duração: 1-2 turnos
   */
  BUFF_STAT_FRACO: 0.25,         // +25%

  /**
   * BUFF MÉDIO: +30-40%
   * Exemplos: SOBRECARGA (+35% foco), força aumentada
   * Cooldown: 3 | Duração: 2 turnos
   */
  BUFF_STAT_MEDIO: 0.35,         // +35% (antes era 60%!)

  /**
   * BUFF FORTE: +50%
   * Exemplos: Benção divina, transformação
   * Cooldown: 4 | Duração: 2-3 turnos
   */
  BUFF_STAT_FORTE: 0.50,         // +50%

  /**
   * BUFF TODOS STATS: +15-20%
   * Afeta TODOS os stats ao mesmo tempo (muito forte!)
   * Cooldown: 4 | Duração: 2 turnos
   */
  BUFF_TODOS_STATS: 0.20,        // +20% em tudo


  // ==================== DEBUFFS DE STAT (aplicados no inimigo) ====================

  /**
   * DEBUFF FRACO: -15-20%
   * Exemplos: Lentidão, fraqueza leve
   * Cooldown: 2 | Duração: 1-2 turnos
   */
  DEBUFF_STAT_FRACO: 0.20,       // -20%

  /**
   * DEBUFF MÉDIO: -25-30%
   * Exemplos: Enfraquecimento, redução de resistência
   * Cooldown: 3 | Duração: 2 turnos
   */
  DEBUFF_STAT_MEDIO: 0.30,       // -30%

  /**
   * DEBUFF FORTE: -40-50%
   * Exemplos: Maldição, debilitação severa
   * Cooldown: 4 | Duração: 2-3 turnos
   */
  DEBUFF_STAT_FORTE: 0.45,       // -45%

  /**
   * DEBUFF TODOS STATS: -15%
   * Afeta TODOS os stats (muito forte!)
   * Cooldown: 4 | Duração: 2 turnos
   */
  DEBUFF_TODOS_STATS: 0.15,      // -15% em tudo


  // ==================== DANO CONTÍNUO (DoT) ====================

  /**
   * DoT FRACO: 5% HP máximo por turno
   * Exemplos: Queimadura leve, veneno fraco
   * Duração: 2 turnos → Total: 10% HP
   */
  DOT_FRACO: 0.05,               // 5% HP/turno

  /**
   * DoT MÉDIO: 8% HP máximo por turno
   * Exemplos: Queimadura, veneno, sangramento
   * Duração: 3 turnos → Total: 24% HP
   */
  DOT_MEDIO: 0.08,               // 8% HP/turno

  /**
   * DoT FORTE: 12% HP máximo por turno
   * Exemplos: Queimadura intensa, eletrocução
   * Duração: 4 turnos → Total: 48% HP (quase metade!)
   */
  DOT_FORTE: 0.12,               // 12% HP/turno


  // ==================== CURA CONTÍNUA (HoT) ====================

  /**
   * HoT FRACO: 5% HP máximo por turno
   * Exemplos: Regeneração leve
   * Duração: 2 turnos → Total: 10% HP
   */
  HOT_FRACO: 0.05,               // 5% HP/turno

  /**
   * HoT MÉDIO: 8% HP máximo por turno
   * Exemplos: Regeneração, auto-cura
   * Duração: 3 turnos → Total: 24% HP
   */
  HOT_MEDIO: 0.08,               // 8% HP/turno


  // ==================== EFEITOS ESPECIAIS ====================

  /**
   * ROUBO DE VIDA
   * Percentual do dano causado que vira cura
   */
  ROUBO_VIDA_FRACO: 0.25,        // 25% do dano vira cura
  ROUBO_VIDA_MEDIO: 0.40,        // 40% do dano vira cura
  ROUBO_VIDA_FORTE: 0.50,        // 50% do dano vira cura

  /**
   * ESCUDO
   * Absorve X% do HP máximo em dano
   */
  ESCUDO_FRACO: 0.15,            // Absorve 15% HP max
  ESCUDO_MEDIO: 0.25,            // Absorve 25% HP max
  ESCUDO_FORTE: 0.40,            // Absorve 40% HP max

  /**
   * REFLEXÃO DE DANO
   * Reflete X% do dano recebido de volta
   */
  REFLEXAO_DANO_FRACA: 0.20,     // Reflete 20% do dano
  REFLEXAO_DANO_MEDIA: 0.35,     // Reflete 35% do dano
  REFLEXAO_DANO_FORTE: 0.50,     // Reflete 50% do dano


  // ==================== CHANCES DE APLICAR EFEITOS ====================

  /**
   * Chance de aplicar efeito de status
   * Usado quando habilidade tem chance < 100% de aplicar
   */
  CHANCE_EFEITO_ALTA: 0.80,      // 80% (quase sempre aplica)
  CHANCE_EFEITO_MEDIA: 0.60,     // 60% (meio a meio)
  CHANCE_EFEITO_BAIXA: 0.40,     // 40% (arriscado)

  /**
   * Chance de efeito de CONTROLE (paralisia, stun)
   * Sempre menor porque são muito fortes
   */
  CHANCE_CONTROLE_ALTA: 0.70,    // 70% de paralisar
  CHANCE_CONTROLE_MEDIA: 0.50,   // 50% de paralisar
  CHANCE_CONTROLE_BAIXA: 0.30,   // 30% de paralisar


  // ==================== AUMENTOS DE EVASÃO/ACERTO ====================

  /**
   * Buff de EVASÃO
   * Aumenta chance de esquivar
   */
  EVASAO_AUMENTADA_FRACA: 0.15,  // +15% esquiva
  EVASAO_AUMENTADA_MEDIA: 0.25,  // +25% esquiva
  EVASAO_AUMENTADA_FORTE: 0.40,  // +40% esquiva
  EVASAO_TOTAL: 1.0,             // 100% esquiva (invisibilidade)

  /**
   * Buff de PRECISÃO
   * Aumenta chance de acerto
   */
  PRECISAO_AUMENTADA_FRACA: 0.15,  // +15% acerto
  PRECISAO_AUMENTADA_MEDIA: 0.25,  // +25% acerto
  PRECISAO_AUMENTADA_FORTE: 0.40,  // +40% acerto
};

/**
 * Obtém valor de buff baseado na intensidade
 * @param {string} intensidade - 'FRACO', 'MEDIO', 'FORTE', 'TODOS'
 * @returns {number} Multiplicador do buff (0.25 = +25%)
 */
export function getBuffValue(intensidade = 'MEDIO') {
  const valores = {
    FRACO: EFFECT_BALANCE.BUFF_STAT_FRACO,
    MEDIO: EFFECT_BALANCE.BUFF_STAT_MEDIO,
    FORTE: EFFECT_BALANCE.BUFF_STAT_FORTE,
    TODOS: EFFECT_BALANCE.BUFF_TODOS_STATS
  };
  return valores[intensidade] || valores.MEDIO;
}

/**
 * Obtém valor de debuff baseado na intensidade
 * @param {string} intensidade - 'FRACO', 'MEDIO', 'FORTE', 'TODOS'
 * @returns {number} Multiplicador do debuff (0.20 = -20%)
 */
export function getDebuffValue(intensidade = 'MEDIO') {
  const valores = {
    FRACO: EFFECT_BALANCE.DEBUFF_STAT_FRACO,
    MEDIO: EFFECT_BALANCE.DEBUFF_STAT_MEDIO,
    FORTE: EFFECT_BALANCE.DEBUFF_STAT_FORTE,
    TODOS: EFFECT_BALANCE.DEBUFF_TODOS_STATS
  };
  return valores[intensidade] || valores.MEDIO;
}

/**
 * Obtém valor de DoT baseado na intensidade
 * @param {string} intensidade - 'FRACO', 'MEDIO', 'FORTE'
 * @returns {number} Percentual de HP perdido por turno
 */
export function getDotValue(intensidade = 'MEDIO') {
  const valores = {
    FRACO: EFFECT_BALANCE.DOT_FRACO,
    MEDIO: EFFECT_BALANCE.DOT_MEDIO,
    FORTE: EFFECT_BALANCE.DOT_FORTE
  };
  return valores[intensidade] || valores.MEDIO;
}

/**
 * Obtém valor de HoT baseado na intensidade
 * @param {string} intensidade - 'FRACO', 'MEDIO'
 * @returns {number} Percentual de HP curado por turno
 */
export function getHotValue(intensidade = 'MEDIO') {
  const valores = {
    FRACO: EFFECT_BALANCE.HOT_FRACO,
    MEDIO: EFFECT_BALANCE.HOT_MEDIO
  };
  return valores[intensidade] || valores.MEDIO;
}

/**
 * Obtém chance de aplicar efeito
 * @param {string} tipo - 'CONTROLE' ou 'NORMAL'
 * @param {string} intensidade - 'ALTA', 'MEDIA', 'BAIXA'
 * @returns {number} Chance de 0 a 1 (0.80 = 80%)
 */
export function getChanceEfeito(tipo = 'NORMAL', intensidade = 'MEDIA') {
  if (tipo === 'CONTROLE') {
    const valores = {
      ALTA: EFFECT_BALANCE.CHANCE_CONTROLE_ALTA,
      MEDIA: EFFECT_BALANCE.CHANCE_CONTROLE_MEDIA,
      BAIXA: EFFECT_BALANCE.CHANCE_CONTROLE_BAIXA
    };
    return valores[intensidade] || valores.MEDIA;
  }

  const valores = {
    ALTA: EFFECT_BALANCE.CHANCE_EFEITO_ALTA,
    MEDIA: EFFECT_BALANCE.CHANCE_EFEITO_MEDIA,
    BAIXA: EFFECT_BALANCE.CHANCE_EFEITO_BAIXA
  };
  return valores[intensidade] || valores.MEDIA;
}
