// ==================== BALANCEAMENTO DE COMBATE ====================
// Arquivo: /app/avatares/sistemas/balance/combatBalance.js
//
// Define todos os valores base de combate do jogo
// Usado por: Treino IA, PVP, Missões
//
// IMPORTANTE: Alterar estes valores afeta TODO o jogo
// ================================================================

/**
 * VALORES BASE DE COMBATE
 *
 * FILOSOFIA DE DESIGN:
 * - Batalhas devem durar 5-10 turnos (nem muito rápido, nem muito lento)
 * - Habilidades devem ser MELHORES que ataque básico (recompensa estratégia)
 * - Energia deve permitir 3-4 habilidades por batalha
 * - Defender deve ser viável, mas não obrigatório todo turno
 */
export const COMBAT_BALANCE = {

  // ==================== ENERGIA ====================

  /**
   * Energia máxima ao iniciar batalha
   * Permite usar 2-3 habilidades fortes (40 energia cada)
   */
  ENERGIA_MAXIMA: 100,

  /**
   * Custo de energia do ataque básico
   * Baixo para permitir uso frequente
   */
  ENERGIA_ATAQUE_BASICO: 10,

  /**
   * Energia recuperada ao defender
   * Defender = sacrifica 1 turno para recuperar energia para habilidade
   * 30 energia = suficiente para usar habilidade média após defender
   */
  ENERGIA_DEFENDER_RECUPERA: 30,

  /**
   * Faixas de custo de energia para habilidades
   * - Fraca (15): Pode usar 6-7x por batalha
   * - Média (25): Pode usar 4x por batalha
   * - Forte (35): Pode usar 2-3x por batalha
   */
  ENERGIA_HABILIDADE_FRACA: 15,
  ENERGIA_HABILIDADE_MEDIA: 25,
  ENERGIA_HABILIDADE_FORTE: 35,


  // ==================== DANO - ATAQUE BÁSICO ====================

  /**
   * Dano base mínimo do ataque básico
   * Com stats baixos (forca ~5), causa ~15 de dano
   * Com HP médio de 150, mata em ~10 ataques básicos
   */
  DANO_ATAQUE_BASICO_BASE: 10,

  /**
   * Multiplicador do stat para ataque básico
   * Forca 5: 10 + (5 × 1.0) = 15 de dano
   * Forca 10: 10 + (10 × 1.0) = 20 de dano
   */
  MULTIPLICADOR_ATAQUE_BASICO: 1.0,


  // ==================== DANO - HABILIDADES ====================

  /**
   * Multiplicadores de stat para habilidades
   *
   * HABILIDADE FRACA (custo 20):
   *   - Foco 5: 5 × 2.5 = 12 dano (pouco melhor que básico)
   *   - Foco 10: 10 × 2.5 = 25 dano
   *
   * HABILIDADE MÉDIA (custo 30):
   *   - Foco 5: 5 × 3.5 = 17 dano (melhor que básico)
   *   - Foco 10: 10 × 3.5 = 35 dano (forte!)
   *
   * HABILIDADE FORTE (custo 40):
   *   - Foco 5: 5 × 4.5 = 22 dano (muito melhor!)
   *   - Foco 10: 10 × 4.5 = 45 dano (devastador!)
   */
  MULTIPLICADOR_HABILIDADE_FRACA: 2.5,
  MULTIPLICADOR_HABILIDADE_MEDIA: 3.5,
  MULTIPLICADOR_HABILIDADE_FORTE: 4.5,

  /**
   * Dano base adicional para habilidades (opcional)
   * Garante dano mínimo mesmo com stat baixo
   * Habilidade média: 5 + (stat × mult) = nunca faz menos que 5
   */
  DANO_BASE_HABILIDADE_FRACA: 0,
  DANO_BASE_HABILIDADE_MEDIA: 5,
  DANO_BASE_HABILIDADE_FORTE: 10,


  // ==================== DEFESA ====================

  /**
   * Redução de dano ao defender
   * 0.50 = 50% de redução
   *
   * Exemplo: Recebe ataque de 30 dano
   * - Sem defender: 30 dano
   * - Defendendo: 15 dano (50% reduzido)
   */
  DEFESA_REDUCAO_DANO: 0.50,

  /**
   * Efeito de defesa fica ativo por 1 turno
   * Aplica no turno que defendeu, expira no próximo
   */
  DEFESA_DURACAO: 1,


  // ==================== CURA ====================

  /**
   * Cura baseada em percentual do HP máximo
   * 0.25 = 25% do HP máximo
   *
   * HP máximo 150: cura 37 HP
   * HP máximo 200: cura 50 HP
   *
   * IMPORTANTE: Cura não pode exceder HP máximo
   */
  CURA_PERCENTUAL_HP_MAX: 0.25,

  /**
   * Cura fixa mínima (se não usar percentual)
   * Garante cura útil mesmo em níveis baixos
   */
  CURA_FIXA_MIN: 20,
  CURA_FIXA_MAX: 35,


  // ==================== HP MÁXIMO ====================

  /**
   * HP base por nível (simplificado)
   * Nível 1: ~100 HP
   * Nível 10: ~150 HP
   * Nível 20: ~200 HP
   *
   * Fórmula completa em statsCalculator.js
   */
  HP_BASE_NIVEL_1: 100,
  HP_GANHO_POR_NIVEL: 5,


  // ==================== CRÍTICO ====================

  /**
   * Chance base de crítico (antes de modificadores)
   * 0.15 = 15% de chance
   *
   * Pode aumentar com:
   * - Stats de agilidade
   * - Buffs (precisão_aumentada)
   * - Sinergias
   */
  CHANCE_CRITICO_BASE: 0.15,

  /**
   * Multiplicador de dano crítico
   * 1.5 = 150% do dano (50% a mais)
   *
   * Dano normal 30 → Crítico 45
   */
  MULTIPLICADOR_CRITICO: 1.5,


  // ==================== ACERTO / ESQUIVA ====================

  /**
   * Chance base de acerto
   * 0.85 = 85% de chance de acertar
   *
   * Modificado por:
   * - Agilidade do atacante (aumenta acerto)
   * - Agilidade do defensor (aumenta esquiva)
   * - Buffs (precisao_aumentada, evasao_aumentada)
   */
  CHANCE_ACERTO_BASE: 0.85,

  /**
   * Influência de agilidade no acerto/esquiva
   * Cada ponto de diferença = 2% de chance
   *
   * Atacante Agi 10 vs Defensor Agi 5:
   * - Diferença: +5
   * - Bonus acerto: +10% (5 × 0.02)
   * - Chance final: 85% + 10% = 95%
   */
  AGILIDADE_INFLUENCIA_ACERTO: 0.02,
};

/**
 * Calcula dano de ataque básico
 * @param {number} forca - Stat de força do atacante
 * @returns {number} Dano calculado
 */
export function calcularDanoAtaqueBasico(forca) {
  return Math.floor(
    COMBAT_BALANCE.DANO_ATAQUE_BASICO_BASE +
    (forca * COMBAT_BALANCE.MULTIPLICADOR_ATAQUE_BASICO)
  );
}

/**
 * Calcula dano de habilidade
 * @param {string} tier - 'FRACA', 'MEDIA', ou 'FORTE'
 * @param {number} statValue - Valor do stat usado
 * @returns {number} Dano calculado
 */
export function calcularDanoHabilidade(tier, statValue) {
  const multiplicadores = {
    FRACA: COMBAT_BALANCE.MULTIPLICADOR_HABILIDADE_FRACA,
    MEDIA: COMBAT_BALANCE.MULTIPLICADOR_HABILIDADE_MEDIA,
    FORTE: COMBAT_BALANCE.MULTIPLICADOR_HABILIDADE_FORTE
  };

  const danosBase = {
    FRACA: COMBAT_BALANCE.DANO_BASE_HABILIDADE_FRACA,
    MEDIA: COMBAT_BALANCE.DANO_BASE_HABILIDADE_MEDIA,
    FORTE: COMBAT_BALANCE.DANO_BASE_HABILIDADE_FORTE
  };

  const mult = multiplicadores[tier] || multiplicadores.MEDIA;
  const base = danosBase[tier] || danosBase.MEDIA;

  return Math.floor(base + (statValue * mult));
}

/**
 * Calcula custo de energia da habilidade
 * @param {string} tier - 'FRACA', 'MEDIA', ou 'FORTE'
 * @returns {number} Custo de energia
 */
export function getCustoEnergia(tier) {
  const custos = {
    FRACA: COMBAT_BALANCE.ENERGIA_HABILIDADE_FRACA,
    MEDIA: COMBAT_BALANCE.ENERGIA_HABILIDADE_MEDIA,
    FORTE: COMBAT_BALANCE.ENERGIA_HABILIDADE_FORTE
  };

  return custos[tier] || custos.MEDIA;
}

/**
 * Calcula cura
 * @param {number} hpMax - HP máximo do alvo
 * @returns {number} HP curado
 */
export function calcularCura(hpMax) {
  return Math.floor(hpMax * COMBAT_BALANCE.CURA_PERCENTUAL_HP_MAX);
}
