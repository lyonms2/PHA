/**
 * Sistema de cálculo de dano
 * Processa todo o cálculo de dano de ataques e habilidades
 */

import { calcularMultiplicadorElemental } from './elementalSystem';

/**
 * Calcula dano de ataque básico
 *
 * Fórmula: 5 + (força × 0.5) + random(1-5)
 * Redução: - (resistência × 0.3) × multiplicadorDefesa
 * Modificadores: exaustão, vínculo, elemental, crítico, bloqueio
 *
 * @param {Object} params
 * @param {number} params.forca - Força do atacante
 * @param {number} params.foco - Foco do atacante (para crítico)
 * @param {number} params.resistenciaOponente - Resistência do defensor
 * @param {number} params.myExaustao - Exaustão do atacante (0-100)
 * @param {number} params.vinculo - Vínculo do atacante (0-100)
 * @param {string} params.meuElemento - Elemento do atacante
 * @param {string} params.elementoOponente - Elemento do defensor
 * @param {boolean} params.opponentDefending - Se oponente está defendendo
 * @param {Array} params.opponentEffects - Efeitos do oponente
 * @returns {Object} { dano: number, critico: boolean, elemental: object, detalhes: object }
 */
export function calcularDanoAtaque({
  forca,
  foco,
  resistenciaOponente,
  myExaustao,
  vinculo,
  meuElemento,
  elementoOponente,
  opponentDefending,
  opponentEffects = [],
  modificadoresSinergia = {},
  defenderModifiers = {}
}) {
  // Calcular multiplicador elemental
  const elemental = calcularMultiplicadorElemental(meuElemento, elementoOponente);

  // Calcular dano base: 5 + (força × 0.5) + random(1-5)
  const random = Math.floor(Math.random() * 5) + 1;
  let danoBase = 5 + (forca * 0.5) + random;

  // Redução por defesa: - (resistência × 0.3)
  // Se o oponente tem defesa_aumentada, dobra a redução
  const temDefesaAumentada = opponentEffects.some(ef => ef.tipo === 'defesa_aumentada');
  const multiplicadorDefesa = temDefesaAumentada ? 2.0 : 1.0;

  // Aplicar modificadores de sinergia na resistência do inimigo
  let resistenciaFinal = resistenciaOponente;
  if (modificadoresSinergia.resistencia_inimigo_reducao) {
    resistenciaFinal = resistenciaOponente * (1 - modificadoresSinergia.resistencia_inimigo_reducao);
  }

  const reducaoDefesa = (resistenciaFinal * 0.3) * multiplicadorDefesa;
  let dano = danoBase - reducaoDefesa;

  // Penalidade de exaustão
  let penalidade = 1.0;
  let penalidadeTexto = '';
  if (myExaustao >= 80) { penalidade = 0.5; penalidadeTexto = '-50%'; }
  else if (myExaustao >= 60) { penalidade = 0.75; penalidadeTexto = '-25%'; }
  else if (myExaustao >= 40) { penalidade = 0.95; penalidadeTexto = '-5%'; }
  dano = dano * penalidade;

  // Bônus de vínculo
  let bonusVinculo = 1.0;
  let vinculoTexto = '';
  if (vinculo >= 80) { bonusVinculo = 1.2; vinculoTexto = '+20%'; }
  else if (vinculo >= 60) { bonusVinculo = 1.15; vinculoTexto = '+15%'; }
  else if (vinculo >= 40) { bonusVinculo = 1.1; vinculoTexto = '+10%'; }
  dano = dano * bonusVinculo;

  // Multiplicador elemental
  dano = dano * elemental.mult;

  // ===== MODIFICADORES DE SINERGIA =====
  let sinergiaTexto = '';

  // Aplicar modificador de dano de sinergia
  if (modificadoresSinergia.dano_mult) {
    dano = dano * modificadoresSinergia.dano_mult;
    const percentual = Math.floor((modificadoresSinergia.dano_mult - 1.0) * 100);
    if (percentual !== 0) {
      sinergiaTexto += `${percentual > 0 ? '+' : ''}${percentual}% Dano `;
    }
  }

  // Aplicar redução de dano do defensor (sinergia que reduz dano inimigo)
  if (defenderModifiers.dano_inimigo_reducao) {
    dano = dano * (1 - defenderModifiers.dano_inimigo_reducao);
    const percentual = Math.floor(defenderModifiers.dano_inimigo_reducao * 100);
    sinergiaTexto += `-${percentual}% Dano Inimigo `;
  }

  // Chance de crítico: 5% + (foco × 0.3%)
  const chanceCritico = 5 + (foco * 0.3);
  const rolou = Math.random() * 100;
  const critico = rolou < chanceCritico;

  if (critico) {
    dano = dano * 2;
  }

  // Garantir dano mínimo de 1
  dano = Math.max(1, Math.floor(dano));

  // Verificar se oponente está defendendo (reduz dano em 50%)
  if (opponentDefending) {
    dano = Math.floor(dano * 0.5);
  }

  // ===== ROUBO DE VIDA DE SINERGIA =====
  let rouboVida = 0;
  if (modificadoresSinergia.roubo_vida_percent && modificadoresSinergia.roubo_vida_percent > 0) {
    rouboVida = Math.floor(dano * modificadoresSinergia.roubo_vida_percent);
    const percentual = Math.floor(modificadoresSinergia.roubo_vida_percent * 100);
    sinergiaTexto += `+${percentual}% Roubo Vida `;
  }

  // Detalhes do cálculo para o log
  const detalhes = {
    danoBase: Math.floor(danoBase),
    forca,
    random,
    reducaoDefesa: Math.floor(reducaoDefesa),
    resistenciaOponente,
    penalidadeExaustao: penalidadeTexto,
    bonusVinculo: vinculoTexto,
    elementalMult: elemental.mult,
    chanceCritico: Math.floor(chanceCritico),
    sinergia: sinergiaTexto.trim() || null
  };

  return { dano, critico, elemental, detalhes, rouboVida };
}

/**
 * Calcula dano de habilidade ofensiva
 *
 * Fórmula: dano_base + (stat × multiplicador_stat) + random(1-5)
 * Redução: - (resistência × 0.4) × multiplicadorDefesa
 * Modificadores: exaustão, vínculo, elemental, crítico, bloqueio, múltiplos golpes
 *
 * @param {Object} params
 * @param {Object} params.habilidade - Dados da habilidade
 * @param {Object} params.myAvatar - Avatar do atacante
 * @param {number} params.foco - Foco do atacante (para crítico)
 * @param {number} params.resistenciaOponente - Resistência do defensor
 * @param {number} params.myExaustao - Exaustão do atacante (0-100)
 * @param {string} params.meuElemento - Elemento do atacante
 * @param {string} params.elementoOponente - Elemento do defensor
 * @param {boolean} params.opponentDefending - Se oponente está defendendo
 * @param {Array} params.opponentEffects - Efeitos do oponente
 * @returns {Object} { dano: number, critico: boolean, elemental: object, numGolpes: number, detalhes: object }
 */
export function calcularDanoHabilidade({
  habilidade,
  myAvatar,
  foco,
  resistenciaOponente,
  myExaustao,
  meuElemento,
  elementoOponente,
  opponentDefending,
  opponentEffects = [],
  modificadoresSinergia = {},
  defenderModifiers = {}
}) {
  let sinergiaTexto = '';
  // Calcular multiplicador elemental
  const elemental = calcularMultiplicadorElemental(meuElemento, elementoOponente);

  // Dano base da habilidade + multiplicador de stat
  const danoBaseHab = habilidade.dano_base || 15;
  const multiplicadorStat = habilidade.multiplicador_stat || 0.5;

  // Usar o stat primário da habilidade (forca, foco, agilidade, etc.)
  const statPrimario = habilidade.stat_primario || 'forca';
  const statValue = myAvatar?.[statPrimario] ?? myAvatar?.forca ?? 10;

  const random = Math.floor(Math.random() * 5) + 1;
  let dano = danoBaseHab + (statValue * multiplicadorStat) + random;

  // ===== REDUÇÃO POR RESISTÊNCIA DO OPONENTE =====
  // Fórmula: Redução = resistência × 0.4 (mais impactante que ataques normais)
  // Se o oponente tem defesa_aumentada, dobra a redução
  const temDefesaAumentada = opponentEffects.some(ef => ef.tipo === 'defesa_aumentada');
  const multiplicadorDefesa = temDefesaAumentada ? 2.0 : 1.0;

  // Aplicar modificadores de sinergia na resistência do inimigo
  let resistenciaFinal = resistenciaOponente;
  if (modificadoresSinergia.resistencia_inimigo_reducao) {
    resistenciaFinal = resistenciaOponente * (1 - modificadoresSinergia.resistencia_inimigo_reducao);
  }

  const reducaoResistencia = (resistenciaFinal * 0.4) * multiplicadorDefesa;
  dano = dano - reducaoResistencia;

  // ===== PENALIDADE DE EXAUSTÃO =====
  let penalidade = 1.0;
  let penalidadeTexto = '';
  if (myExaustao >= 80) { penalidade = 0.5; penalidadeTexto = '-50%'; }
  else if (myExaustao >= 60) { penalidade = 0.75; penalidadeTexto = '-25%'; }
  else if (myExaustao >= 40) { penalidade = 0.95; penalidadeTexto = '-5%'; }
  dano = dano * penalidade;

  // ===== BÔNUS DE VÍNCULO =====
  const vinculo = myAvatar?.vinculo ?? 0;
  let bonusVinculo = 1.0;
  let vinculoTexto = '';
  if (vinculo >= 80) { bonusVinculo = 1.2; vinculoTexto = '+20%'; }
  else if (vinculo >= 60) { bonusVinculo = 1.15; vinculoTexto = '+15%'; }
  else if (vinculo >= 40) { bonusVinculo = 1.1; vinculoTexto = '+10%'; }
  dano = dano * bonusVinculo;

  // ===== MULTIPLICADOR ELEMENTAL =====
  dano = dano * elemental.mult;

  // ===== MODIFICADORES DE SINERGIA =====
  // Aplicar modificador de dano de sinergia
  if (modificadoresSinergia.dano_mult) {
    dano = dano * modificadoresSinergia.dano_mult;
    const percentual = Math.floor((modificadoresSinergia.dano_mult - 1.0) * 100);
    if (percentual !== 0) {
      sinergiaTexto += `${percentual > 0 ? '+' : ''}${percentual}% Dano `;
    }
  }

  // Aplicar redução de dano do defensor (sinergia que reduz dano inimigo)
  if (defenderModifiers.dano_inimigo_reducao) {
    dano = dano * (1 - defenderModifiers.dano_inimigo_reducao);
    const percentual = Math.floor(defenderModifiers.dano_inimigo_reducao * 100);
    sinergiaTexto += `-${percentual}% Dano Inimigo `;
  }

  // ===== CHANCE DE CRÍTICO =====
  const chanceCritico = 5 + (foco * 0.3);
  const critico = Math.random() * 100 < chanceCritico;
  if (critico) {
    dano = dano * 2;
  }

  // ===== BLOQUEIO (DEFENDENDO) =====
  const bloqueado = opponentDefending;
  if (bloqueado) {
    dano = Math.floor(dano * 0.5);
  }

  // Garantir dano mínimo de 1
  dano = Math.max(1, Math.floor(dano));

  // ===== MÚLTIPLOS GOLPES =====
  // Se a habilidade tem num_golpes, multiplica o dano
  const numGolpes = habilidade.num_golpes || 1;
  if (numGolpes > 1) {
    dano = dano * numGolpes;
  }

  // ===== ROUBO DE VIDA DE SINERGIA =====
  let rouboVida = 0;
  if (modificadoresSinergia.roubo_vida_percent && modificadoresSinergia.roubo_vida_percent > 0) {
    rouboVida = Math.floor(dano * modificadoresSinergia.roubo_vida_percent);
    const percentual = Math.floor(modificadoresSinergia.roubo_vida_percent * 100);
    sinergiaTexto += `+${percentual}% Roubo Vida `;
  }

  // Salvar detalhes do cálculo
  const detalhes = {
    danoBase: Math.floor(danoBaseHab + (statValue * multiplicadorStat)),
    danoBaseHab,
    stat: statPrimario,
    statValue,
    multiplicadorStat,
    random,
    reducaoResistencia: Math.floor(reducaoResistencia),
    resistenciaOponente,
    penalidadeExaustao: penalidadeTexto,
    bonusVinculo: vinculoTexto,
    elementalMult: elemental.mult,
    chanceCritico: Math.floor(chanceCritico),
    bloqueado,
    sinergia: sinergiaTexto.trim() || null
  };

  return { dano, critico, elemental, numGolpes, detalhes, rouboVida };
}

/**
 * Calcula cura de habilidade de suporte
 *
 * @param {Object} params
 * @param {Object} params.habilidade - Dados da habilidade
 * @param {Object} params.myAvatar - Avatar do usuário
 * @returns {number} Quantidade de cura
 */
export function calcularCuraHabilidade({ habilidade, myAvatar }) {
  const curaBase = Math.abs(habilidade.dano_base) || 20;
  const statPrimario = habilidade.stat_primario || 'foco';
  const statValue = myAvatar?.[statPrimario] ?? myAvatar?.foco ?? 10;
  const cura = curaBase + (statValue * (habilidade.multiplicador_stat || 0.5));
  return Math.floor(cura);
}
