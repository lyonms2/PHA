/**
 * Sistema de teste de acerto/evasão
 * Calcula se um ataque ou habilidade acerta o alvo
 */

/**
 * Verifica se o ataque básico acerta o alvo
 *
 * Base: 70% + (agilidade atacante - agilidade defensor) × 2%
 * Modificadores: invisibilidade, evasão aumentada, velocidade aumentada, sinergia de evasão
 * Range: 5% mínimo, 95% máximo
 *
 * @param {Object} params
 * @param {number} params.agilidade - Agilidade do atacante
 * @param {number} params.agilidadeOponente - Agilidade do defensor
 * @param {Array} params.attackerEffects - Efeitos do atacante
 * @param {Array} params.opponentEffects - Efeitos do oponente
 * @param {Object} params.defenderModifiers - Modificadores de sinergia do defensor
 * @param {Object} params.attackerModifiers - Modificadores de sinergia do atacante
 * @returns {Object} { acertou: boolean, chanceAcerto: number, esquivou: boolean, invisivel: boolean }
 */
export function testarAcertoAtaque({ agilidade, agilidadeOponente, attackerEffects = [], opponentEffects = [], defenderModifiers = {}, attackerModifiers = {} }) {
  // Verificar se atacante tem acerto garantido (Escudo Energético do AETHER ou Campo de Anulação do VOID)
  const temAcertoGarantido = attackerEffects.some(ef =>
    (ef.tipo === 'escudo_energetico' || ef.tipo === 'reducao_dano') && ef.acertoGarantido
  );
  if (temAcertoGarantido) {
    const nomeEfeito = attackerEffects.find(ef => ef.acertoGarantido)?.tipo === 'escudo_energetico'
      ? 'Escudo Energético'
      : 'Campo de Anulação';
    console.log(`🎯✨ [ACERTO GARANTIDO] ${nomeEfeito} ativo - 100% de acerto!`);
    return {
      acertou: true,
      chanceAcerto: 100,
      esquivou: false,
      invisivel: false,
      acertoGarantido: true
    };
  }

  // Verificar buffs de evasão do oponente
  const temInvisibilidade = opponentEffects.some(ef => ef.tipo === 'invisivel' || ef.tipo === 'invisível');
  const temEvasaoAumentada = opponentEffects.some(ef => ef.tipo === 'evasao_aumentada');
  const temVelocidadeAumentada = opponentEffects.some(ef => ef.tipo === 'velocidade' || ef.tipo === 'velocidade_aumentada');

  // Invisibilidade = sempre esquiva
  if (temInvisibilidade) {
    return {
      acertou: false,
      chanceAcerto: 0,
      esquivou: true,
      invisivel: true
    };
  }

  // Calcular bônus de evasão de buffs
  let bonusEvasao = 0;
  if (temEvasaoAumentada) bonusEvasao += 30; // +30% evasão
  if (temVelocidadeAumentada) bonusEvasao += 15; // +15% evasão

  // Aplicar modificadores de sinergia de evasão do defensor (ex: +0.05 = +5% evasão = reduz chance de acerto em 5 pontos)
  if (defenderModifiers.evasao) {
    const evasaoPercentual = defenderModifiers.evasao * 100;
    bonusEvasao += evasaoPercentual;
  }

  // Aplicar redução de evasão do atacante (ex: -20% evasão inimiga = aumenta chance de acerto em 20 pontos)
  if (attackerModifiers.evasao_inimigo_reducao) {
    const reducaoEvasaoPercentual = attackerModifiers.evasao_inimigo_reducao * 100;
    bonusEvasao -= reducaoEvasaoPercentual; // Subtrai porque é uma redução da evasão do oponente
  }

  // Base 70% + diferença de agilidade × 2% - bônus evasão
  let chanceAcerto = 70 + (agilidade - agilidadeOponente) * 2 - bonusEvasao;
  chanceAcerto = Math.min(95, Math.max(5, chanceAcerto)); // Mínimo 5%, máximo 95%

  const rolouAcerto = Math.random() * 100;
  const acertou = rolouAcerto < chanceAcerto;

  return {
    acertou,
    chanceAcerto,
    esquivou: !acertou,
    invisivel: false,
    rolouAcerto
  };
}

/**
 * Verifica se uma habilidade acerta o alvo
 *
 * Chance base da habilidade - (agilidade oponente × 0.5%) - bônus de evasão
 * Range: 5% mínimo, 100% máximo
 *
 * @param {Object} params
 * @param {number} params.chanceAcertoBase - Chance base da habilidade (padrão 100%)
 * @param {number} params.agilidadeOponente - Agilidade do defensor
 * @param {Array} params.attackerEffects - Efeitos do atacante
 * @param {Array} params.opponentEffects - Efeitos do oponente
 * @param {Object} params.defenderModifiers - Modificadores de sinergia do defensor
 * @param {Object} params.attackerModifiers - Modificadores de sinergia do atacante
 * @returns {Object} { acertou: boolean, chanceAcerto: number, esquivou: boolean, invisivel: boolean }
 */
export function testarAcertoHabilidade({ chanceAcertoBase = 100, agilidadeOponente, attackerEffects = [], opponentEffects = [], defenderModifiers = {}, attackerModifiers = {} }) {
  // Verificar se atacante tem acerto garantido (Escudo Energético do AETHER ou Campo de Anulação do VOID)
  const temAcertoGarantido = attackerEffects.some(ef =>
    (ef.tipo === 'escudo_energetico' || ef.tipo === 'reducao_dano') && ef.acertoGarantido
  );
  if (temAcertoGarantido) {
    const nomeEfeito = attackerEffects.find(ef => ef.acertoGarantido)?.tipo === 'escudo_energetico'
      ? 'Escudo Energético'
      : 'Campo de Anulação';
    console.log(`🎯✨ [ACERTO GARANTIDO HABILIDADE] ${nomeEfeito} ativo - 100% de acerto!`);
    return {
      acertou: true,
      chanceAcerto: 100,
      esquivou: false,
      invisivel: false,
      acertoGarantido: true
    };
  }

  // Verificar buffs de evasão do oponente
  const temInvisibilidade = opponentEffects.some(ef => ef.tipo === 'invisivel' || ef.tipo === 'invisível');
  const temEvasaoAumentada = opponentEffects.some(ef => ef.tipo === 'evasao_aumentada');
  const temVelocidadeAumentada = opponentEffects.some(ef => ef.tipo === 'velocidade' || ef.tipo === 'velocidade_aumentada');

  // Invisibilidade = sempre esquiva (a menos que seja habilidade de 100% acerto)
  if (temInvisibilidade && chanceAcertoBase < 100) {
    return {
      acertou: false,
      chanceAcerto: 0,
      esquivou: true,
      invisivel: true
    };
  }

  // Calcular bônus de evasão de buffs
  let bonusEvasao = 0;
  if (temEvasaoAumentada) bonusEvasao += 30; // +30% evasão
  if (temVelocidadeAumentada) bonusEvasao += 15; // +15% evasão

  // Aplicar modificadores de sinergia de evasão do defensor (ex: +0.05 = +5% evasão)
  if (defenderModifiers.evasao) {
    const evasaoPercentual = defenderModifiers.evasao * 100;
    bonusEvasao += evasaoPercentual;
  }

  // Aplicar redução de evasão do atacante
  if (attackerModifiers.evasao_inimigo_reducao) {
    const reducaoEvasaoPercentual = attackerModifiers.evasao_inimigo_reducao * 100;
    bonusEvasao -= reducaoEvasaoPercentual;
  }

  // Chance final = chance base da habilidade - (agilidade oponente × 0.5%) - bônus de evasão
  let chanceAcerto = chanceAcertoBase - (agilidadeOponente * 0.5) - bonusEvasao;
  chanceAcerto = Math.min(100, Math.max(5, chanceAcerto)); // Mínimo 5%, máximo 100%

  const rolouAcerto = Math.random() * 100;
  const acertou = rolouAcerto < chanceAcerto;

  return {
    acertou,
    chanceAcerto,
    esquivou: !acertou,
    invisivel: false,
    rolouAcerto
  };
}
