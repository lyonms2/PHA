// ==================== CONSTANTES DO SISTEMA DE COMBATE ====================
// Arquivo modular com todas as constantes, caps e multiplicadores do jogo

/**
 * Caps (limites máximos) do sistema
 */
export const CAPS = {
  DODGE_PCT_MAX: 0.75,          // 75% esquiva máxima
  CRIT_PCT_MAX: 0.60,           // 60% crítico máximo
  MITIGATION_PCT_MAX: 0.70,     // 70% mitigação máxima
  ENERGY_MAX_HARD: 200,         // 200 energia máxima absoluta
  MERGE_MAX_LEVELS: 10,         // 10 níveis de merge máximo
  MERGE_MAX_TOTAL_PCT: 0.30,    // 30% boost total de merge
  BUFF_STACK_MAX_PCT: 0.25,     // 25% stack máximo de buffs
  ELEMENTAL_BONUS_MAX_PCT: 0.25 // 25% bônus elemental máximo
};

/**
 * Constantes base do sistema
 */
export const CONSTANTS = {
  BASE_HP: 1000,              // HP base de todos avatares
  HP_PER_RES: 12,             // HP ganho por ponto de RES
  BASE_ENERGY: 100,           // Energia inicial
  ENERGY_PER_FOC: 0.3,        // Energia por ponto de FOC
  BASE_ACCURACY_PCT: 0.80,    // 80% acurácia base
  BASE_TURN_BASE: 100         // Base de iniciativa
};

/**
 * Multiplicadores de nível e merge
 */
export const MULTIPLIERS = {
  LEVEL_MULT_PER_LEVEL: 0.005,  // +0.5% por nível (nível 100 = +50% = 1.5x)
  MERGE_BONUS_PER_LEVEL: 0.03   // +3% por nível de merge
};

/**
 * Multiplicadores elementais
 */
export const ELEMENTAL_MULTIPLIERS = {
  STRONG: 1.25,           // Super efetivo
  WEAK: 0.75,             // Pouco efetivo
  RESIST: 0.85,           // Resistência
  VOID_VS_AETHER: 1.4,    // Void vs Aether (especial)
  AETHER_VS_VOID: 1.4,    // Aether vs Void (especial)
  OPPOSITE: 2.0           // Opostos (Luz vs Sombra)
};

/**
 * Fórmulas derivadas (como referência - não use como código)
 * Implemente essas fórmulas nas suas funções de cálculo
 */
export const FORMULAS_REFERENCE = {
  HP: 'HP = BASE_HP + (RES * HP_PER_RES)',
  ENERGY_MAX: 'ENERGY_MAX = BASE_ENERGY + (FOC * ENERGY_PER_FOC)',
  DODGE_PCT: 'DODGE_PCT = clamp(AGI / (AGI + 150), 0, CAPS.DODGE_PCT_MAX)',
  CRIT_PCT: 'CRIT_PCT = clamp(AGI / (AGI + 300), 0, CAPS.CRIT_PCT_MAX)',
  SPEED: 'SPEED = BASE_TURN_BASE + (AGI * 0.5)',
  PHYSICAL_DEF: 'PHYSICAL_DEF = RES * 0.8',
  MAGIC_RES: 'MAGIC_RES = FOC * 0.6',
  MITIGATION_PCT: 'MITIGATION_PCT = clamp(RES / (RES + 400), 0, CAPS.MITIGATION_PCT_MAX)',
  LEVEL_MULT: 'LEVEL_MULT = 1 + (nivel * MULTIPLIERS.LEVEL_MULT_PER_LEVEL)',
  MERGE_BONUS: 'MERGE_BONUS = merge_level * MULTIPLIERS.MERGE_BONUS_PER_LEVEL'
};

/**
 * Sistema de energia
 */
export const ENERGY = {
  START: 100,               // Energia inicial
  REGEN_BASE_PER_TURN: 10,  // Regeneração base por turno
  REGEN_PER_FOCUS: 0.5,     // Regeneração adicional por FOC (FOC * 0.5)

  COSTS: {
    BASIC: 10,              // Ataque básico
    HEAVY: 35,              // Ataque pesado
    DEFENSE: 20,            // Habilidade defensiva
    SUPPORT: 15,            // Suporte básico
    SUPPORT_SPECIAL: 20     // Suporte especial
  },

  EXHAUSTED: {
    WHEN: 0,                        // Quando energia = 0
    ATTACK_NAME: 'Golpe Exausto',   // Nome do ataque de exaustão
    MULTIPLIER: 0.6                 // 60% do dano normal
  }
};

/**
 * Níveis e progressão
 */
export const PROGRESSION = {
  MIN_LEVEL: 1,
  MAX_LEVEL: 100,
  POINTS_PER_LEVEL: 10,      // Pontos de atributo por nível
  XP_PER_LEVEL: 100          // XP necessário por nível
};

/**
 * Status Effects (referência - implementar em statusEffects.js)
 */
export const STATUS_EFFECTS = {
  BURN: {
    damage_formula: 'FOC * 1.3',
    duration: [2, 3],
    type: 'dot',
    description: 'Dano mágico de fogo por turno'
  },
  BLEED: {
    damage_formula: 'FOR * 1.2',
    duration: [2, 3],
    type: 'dot',
    ignores_defense: true,
    description: 'Sangramento que ignora defesa'
  },
  PARALYSIS: {
    lose_turn_chance: 0.35,
    accuracy_penalty: -0.15,
    duration: [1, 2],
    type: 'debuff',
    description: '35% chance de perder turno + -15% acurácia'
  },
  VULNERABLE: {
    damage_increase: 0.20,
    duration: [1, 3],
    type: 'debuff',
    description: 'Alvo recebe +20% de dano'
  },
  SHIELD: {
    absorb_formula: 'RES * 4',
    type: 'buff',
    description: 'Escudo que absorve dano'
  },
  ATK_UP: {
    bonus: 0.15,
    stat: 'FOR',
    type: 'buff',
    description: '+15% Força'
  },
  SPD_UP: {
    bonus: 10,
    stat: 'AGI',
    type: 'buff',
    description: '+10 Agilidade'
  },
  DEF_DOWN: {
    penalty: -0.20,
    stat: 'RES',
    type: 'debuff',
    description: '-20% Resistência'
  }
};

/**
 * Regras de combate
 */
export const COMBAT_RULES = {
  CRIT_MULTIPLIER: 1.5,           // Crítico = 1.5x dano
  MIN_HIT_CHANCE: 0.02,           // 2% chance mínima de acerto
  MAX_HIT_CHANCE: 0.98,           // 98% chance máxima de acerto

  TURN_ORDER: {
    AETHER_BEFORE_VOID: true      // Aether sempre age antes de Void
  },

  VOID_SPECIAL: {
    DAMAGE_REDUCTION_PCT: 0.30,   // Void reduz 30% de dano de todos elementos (exceto Aether)
    EXCEPT: 'Aether'
  }
};

/**
 * Exportação default
 */
export default {
  CAPS,
  CONSTANTS,
  MULTIPLIERS,
  ELEMENTAL_MULTIPLIERS,
  FORMULAS_REFERENCE,
  ENERGY,
  PROGRESSION,
  STATUS_EFFECTS,
  COMBAT_RULES
};
