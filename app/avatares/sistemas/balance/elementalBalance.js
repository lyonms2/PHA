// ==================== BALANCEAMENTO ELEMENTAL ====================
// Arquivo: /app/avatares/sistemas/balance/elementalBalance.js
//
// Define sistema de vantagens e fraquezas elementais
// Usado por: Treino IA, PVP, Missões
//
// IMPORTANTE: Sistema baseado em "pedra, papel, tesoura" expandido
// Cada elemento tem vantagens E desvantagens
// ================================================================

/**
 * FILOSOFIA ELEMENTAL:
 *
 * VANTAGEM: +15% de dano
 * - Fogo vs Gelo = Fogo causa 115% de dano
 *
 * DESVANTAGEM: -10% de dano
 * - Gelo vs Fogo = Gelo causa 90% de dano
 *
 * NEUTRO: 100% de dano
 * - Fogo vs Água = 100% (nem vantagem nem desvantagem)
 *
 * BALANCEAMENTO:
 * - Cada elemento tem 2-3 vantagens
 * - Cada elemento tem 2-3 desvantagens (vantagens de outros elementos)
 * - Nenhum elemento é dominante
 * - Vantagens moderadas permitem vitória através de skill e estratégia
 */
export const ELEMENTAL_BALANCE = {

  // ==================== MULTIPLICADORES ====================

  /**
   * Multiplicador de vantagem elemental
   * 1.15 = +15% de dano (balanceado para competição justa)
   */
  VANTAGEM_MULTIPLICADOR: 1.15,

  /**
   * Multiplicador de desvantagem elemental
   * 0.90 = -10% de dano (penalidade moderada)
   */
  DESVANTAGEM_MULTIPLICADOR: 0.90,

  /**
   * Multiplicador neutro
   * 1.0 = sem modificação
   */
  NEUTRO_MULTIPLICADOR: 1.0,


  // ==================== TABELA DE VANTAGENS ====================

  /**
   * Define quais elementos cada um é forte contra
   * "Fogo é forte contra Gelo" = Fogo causa +30% dano em Gelo
   */
  VANTAGENS: {
    // === ELEMENTOS CLÁSSICOS ===

    /**
     * FOGO: Calor, combustão, energia
     * Forte contra: Gelo (derrete), Terra (queima), Vento (alimenta chamas)
     */
    Fogo: ['Gelo', 'Terra', 'Vento'],

    /**
     * ÁGUA: Fluidez, adaptação
     * Forte contra: Fogo (apaga), Terra (erode)
     */
    Água: ['Fogo', 'Terra'],

    /**
     * TERRA: Solidez, resistência
     * Forte contra: Eletricidade (isola), Vento (bloqueia)
     */
    Terra: ['Eletricidade', 'Vento'],

    /**
     * VENTO: Movimento, velocidade
     * Forte contra: Água (dispersa)
     */
    Vento: ['Água'],

    /**
     * ELETRICIDADE: Energia, velocidade
     * Forte contra: Água (conduz), Vento (ioniza)
     */
    Eletricidade: ['Água', 'Vento'],

    /**
     * GELO: Frio, imobilização
     * Forte contra: Água (congela), Terra (permafrost)
     */
    Gelo: ['Água', 'Terra'],


    // === ELEMENTOS EXÓTICOS ===

    /**
     * LUZ: Pureza, revelação
     * Forte contra: Sombra (dissipa), Void (ilumina)
     */
    Luz: ['Sombra', 'Void'],

    /**
     * SOMBRA: Ocultação, mistério
     * Forte contra: Luz (obscurece)
     */
    Sombra: ['Luz'],

    /**
     * VOID: Vazio, anulação
     * Forte contra: Aether (absorve), Luz (consome)
     */
    Void: ['Aether', 'Luz'],

    /**
     * AETHER: Energia pura, transcendência
     * Forte contra: Void (preenche), Sombra (purifica)
     */
    Aether: ['Void', 'Sombra']
  },


  // ==================== IMUNIDADES (futuro) ====================

  /**
   * Elementos imunes a certos efeitos
   * Exemplo: Fogo não pode ser queimado
   *
   * NÃO IMPLEMENTADO AINDA - placeholder para futuro
   */
  IMUNIDADES: {
    // Fogo: ['queimadura', 'queimadura_intensa'],
    // Gelo: ['congelado'],
    // Eletricidade: ['paralisia', 'eletrocutado'],
    // Terra: ['sangramento'],
  }
};


/**
 * Calcula multiplicador elemental baseado nos elementos
 * @param {string} elementoAtacante - Elemento de quem ataca
 * @param {string} elementoDefensor - Elemento de quem defende
 * @returns {number} Multiplicador (0.75, 1.0, ou 1.30)
 */
export function getElementalMultiplier(elementoAtacante, elementoDefensor) {
  // Sem elemento ou mesmo elemento = neutro
  if (!elementoAtacante || !elementoDefensor || elementoAtacante === elementoDefensor) {
    return ELEMENTAL_BALANCE.NEUTRO_MULTIPLICADOR;
  }

  // Verificar VANTAGEM: atacante é forte contra defensor?
  const vantagens = ELEMENTAL_BALANCE.VANTAGENS[elementoAtacante] || [];
  if (vantagens.includes(elementoDefensor)) {
    console.log(`⚡ [ELEMENTAL] ${elementoAtacante} é FORTE contra ${elementoDefensor} (+15% dano)`);
    return ELEMENTAL_BALANCE.VANTAGEM_MULTIPLICADOR;
  }

  // Verificar DESVANTAGEM: defensor é forte contra atacante?
  const desvantagens = ELEMENTAL_BALANCE.VANTAGENS[elementoDefensor] || [];
  if (desvantagens.includes(elementoAtacante)) {
    console.log(`💨 [ELEMENTAL] ${elementoAtacante} é FRACO contra ${elementoDefensor} (-10% dano)`);
    return ELEMENTAL_BALANCE.DESVANTAGEM_MULTIPLICADOR;
  }

  // Nenhuma relação especial = neutro
  return ELEMENTAL_BALANCE.NEUTRO_MULTIPLICADOR;
}


/**
 * Retorna informações sobre a relação elemental
 * @param {string} elementoAtacante - Elemento de quem ataca
 * @param {string} elementoDefensor - Elemento de quem defende
 * @returns {Object} { tipo, icone, texto, multiplicador }
 */
export function getElementalRelation(elementoAtacante, elementoDefensor) {
  const multiplicador = getElementalMultiplier(elementoAtacante, elementoDefensor);

  if (multiplicador > 1.0) {
    return {
      tipo: 'vantagem',
      icone: '🔥',
      texto: 'SUPER EFETIVO!',
      multiplicador
    };
  }

  if (multiplicador < 1.0) {
    return {
      tipo: 'desvantagem',
      icone: '💨',
      texto: 'Pouco efetivo...',
      multiplicador
    };
  }

  return {
    tipo: 'neutro',
    icone: '',
    texto: '',
    multiplicador
  };
}


/**
 * Verifica se elemento é imune a um efeito (futuro)
 * @param {string} elemento - Elemento a verificar
 * @param {string} efeito - Nome do efeito
 * @returns {boolean} true se imune
 */
export function isImune(elemento, efeito) {
  const imunidades = ELEMENTAL_BALANCE.IMUNIDADES[elemento] || [];
  return imunidades.includes(efeito);
}


/**
 * Retorna emoji do elemento
 * @param {string} elemento - Nome do elemento
 * @returns {string} Emoji
 */
export function getElementoEmoji(elemento) {
  const emojis = {
    Fogo: '🔥',
    Água: '💧',
    Terra: '🌍',
    Vento: '💨',
    Eletricidade: '⚡',
    Gelo: '❄️',
    Luz: '✨',
    Sombra: '🌑',
    Void: '🌀',
    Aether: '🌟'
  };
  return emojis[elemento] || '❓';
}
