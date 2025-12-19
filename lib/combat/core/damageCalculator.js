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
  // Se o oponente tem defesa_aumentada ou defesa_aumentada_instantanea, dobra a redução
  const temDefesaAumentada = opponentEffects.some(ef =>
    ef.tipo === 'defesa_aumentada' || ef.tipo === 'defesa_aumentada_instantanea'
  );
  const multiplicadorDefesa = temDefesaAumentada ? 2.0 : 1.0;

  // Aplicar modificadores de sinergia na resistência do inimigo
  let resistenciaFinal = resistenciaOponente;
  if (modificadoresSinergia.resistencia_inimigo_reducao) {
    resistenciaFinal = resistenciaOponente * (1 - modificadoresSinergia.resistencia_inimigo_reducao);
  }

  // Aplicar modificadores de resistência do defensor (sinergia que aumenta própria resistência)
  if (defenderModifiers.resistencia_mult) {
    resistenciaFinal = resistenciaFinal * defenderModifiers.resistencia_mult;
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
  const danoAntesSinergia = dano;

  // Aplicar modificador de dano de sinergia
  if (modificadoresSinergia.dano_mult) {
    dano = dano * modificadoresSinergia.dano_mult;
    const percentual = Math.floor((modificadoresSinergia.dano_mult - 1.0) * 100);
    if (percentual !== 0) {
      sinergiaTexto += `${percentual > 0 ? '+' : ''}${percentual}% Dano `;
    }

    console.log('🔥 [SINERGIA DANO ATAQUE] Aplicando modificador:', {
      danoAntes: Math.floor(danoAntesSinergia),
      multiplicador: modificadoresSinergia.dano_mult,
      danoDepois: Math.floor(dano),
      percentual: `+${percentual}%`
    });
  }

  // Aplicar redução de dano do defensor (sinergia que reduz dano inimigo)
  if (defenderModifiers.dano_inimigo_reducao) {
    const danoAntesReducao = dano;
    dano = dano * (1 - defenderModifiers.dano_inimigo_reducao);
    const percentual = Math.floor(defenderModifiers.dano_inimigo_reducao * 100);
    sinergiaTexto += `-${percentual}% Dano Inimigo `;

    console.log('🛡️ [SINERGIA DEFESA ATAQUE] Redução de dano do defensor:', {
      danoAntes: Math.floor(danoAntesReducao),
      reducao: defenderModifiers.dano_inimigo_reducao,
      danoDepois: Math.floor(dano),
      percentual: `-${percentual}%`
    });
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
  let tipoRouboVida = null;
  if (modificadoresSinergia.roubo_vida_percent && modificadoresSinergia.roubo_vida_percent > 0) {
    rouboVida = Math.floor(dano * modificadoresSinergia.roubo_vida_percent);
    const percentual = Math.floor(modificadoresSinergia.roubo_vida_percent * 100);
    sinergiaTexto += `+${percentual}% Roubo Vida `;
    tipoRouboVida = 'roubo_vida'; // Ataques básicos sempre têm roubo de vida normal (sinergia)
  }

  // Detalhes do cálculo para o log
  const detalhes = {
    danoBase: Math.floor(danoBase),
    forca,
    random,
    reducaoDefesa: Math.floor(reducaoDefesa),
    resistenciaOponente,
    defesaAumentada: temDefesaAumentada ? `2x redução (+${Math.floor(reducaoDefesa / 2)} extra)` : null,
    penalidadeExaustao: penalidadeTexto,
    bonusVinculo: vinculoTexto,
    elementalMult: elemental.mult,
    chanceCritico: Math.floor(chanceCritico),
    sinergia: sinergiaTexto.trim() || null
  };

  return { dano, critico, elemental, detalhes, rouboVida, tipoRouboVida };
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
  // Se o oponente tem defesa_aumentada ou defesa_aumentada_instantanea, dobra a redução
  const temDefesaAumentada = opponentEffects.some(ef =>
    ef.tipo === 'defesa_aumentada' || ef.tipo === 'defesa_aumentada_instantanea'
  );
  const multiplicadorDefesa = temDefesaAumentada ? 2.0 : 1.0;

  // Aplicar modificadores de sinergia na resistência do inimigo
  let resistenciaFinal = resistenciaOponente;
  if (modificadoresSinergia.resistencia_inimigo_reducao) {
    resistenciaFinal = resistenciaOponente * (1 - modificadoresSinergia.resistencia_inimigo_reducao);
  }

  // Aplicar modificadores de resistência do defensor (sinergia que aumenta própria resistência)
  if (defenderModifiers.resistencia_mult) {
    resistenciaFinal = resistenciaFinal * defenderModifiers.resistencia_mult;
  }

  // ===== PENETRAÇÃO DE DEFESA (ignora_defesa) =====
  // Void e Aether podem ignorar % da defesa (0.0 a 1.0)
  const penetracao = habilidade.ignora_defesa || 0;
  const resistenciaAposPenetracao = resistenciaFinal * (1 - penetracao);

  const reducaoResistencia = (resistenciaAposPenetracao * 0.4) * multiplicadorDefesa;
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
  const danoAntesSinergia = dano;

  // Aplicar modificador de dano de sinergia
  if (modificadoresSinergia.dano_mult) {
    dano = dano * modificadoresSinergia.dano_mult;
    const percentual = Math.floor((modificadoresSinergia.dano_mult - 1.0) * 100);
    if (percentual !== 0) {
      sinergiaTexto += `${percentual > 0 ? '+' : ''}${percentual}% Dano `;
    }

    console.log('🔥 [SINERGIA DANO] Aplicando modificador:', {
      danoAntes: Math.floor(danoAntesSinergia),
      multiplicador: modificadoresSinergia.dano_mult,
      danoDepois: Math.floor(dano),
      percentual: `+${percentual}%`
    });
  }

  // Aplicar redução de dano do defensor (sinergia que reduz dano inimigo)
  if (defenderModifiers.dano_inimigo_reducao) {
    const danoAntesReducao = dano;
    dano = dano * (1 - defenderModifiers.dano_inimigo_reducao);
    const percentual = Math.floor(defenderModifiers.dano_inimigo_reducao * 100);
    sinergiaTexto += `-${percentual}% Dano Inimigo `;

    console.log('🛡️ [SINERGIA DEFESA] Redução de dano do defensor:', {
      danoAntes: Math.floor(danoAntesReducao),
      reducao: defenderModifiers.dano_inimigo_reducao,
      danoDepois: Math.floor(dano),
      percentual: `-${percentual}%`
    });
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

  // ===== ROUBO DE VIDA =====
  let rouboVida = 0;
  let tipoRouboVida = null; // 'auto_cura' ou 'roubo_vida'

  // 1. Roubo de vida de sinergia
  if (modificadoresSinergia.roubo_vida_percent && modificadoresSinergia.roubo_vida_percent > 0) {
    rouboVida = Math.floor(dano * modificadoresSinergia.roubo_vida_percent);
    const percentual = Math.floor(modificadoresSinergia.roubo_vida_percent * 100);
    sinergiaTexto += `+${percentual}% Roubo Vida `;
    tipoRouboVida = 'roubo_vida';
  }

  // 2. Roubo de vida dos efeitos da habilidade (Sombra e Água)
  const efeitosRouboVida = (habilidade.efeitos_status || []).filter(ef =>
    ef === 'roubo_vida' || ef === 'roubo_vida_intenso' || ef === 'roubo_vida_massivo' || ef === 'auto_cura'
  );

  if (efeitosRouboVida.length > 0) {
    // Definir percentuais de roubo de vida por tipo de efeito
    const percentuaisRoubo = {
      'roubo_vida': 0.15,          // 15% do dano (Sombra)
      'roubo_vida_intenso': 0.30,  // 30% do dano (Sombra)
      'roubo_vida_massivo': 0.40,  // 40% do dano (Sombra)
      'auto_cura': 0.20            // 20% do dano (Água)
    };

    // Usar o maior percentual se houver múltiplos efeitos
    const maiorPercentual = Math.max(...efeitosRouboVida.map(ef => percentuaisRoubo[ef] || 0));
    const rouboVidaHabilidade = Math.floor(dano * maiorPercentual);

    // Determinar tipo: auto_cura tem prioridade
    if (efeitosRouboVida.includes('auto_cura')) {
      tipoRouboVida = 'auto_cura';
    } else {
      tipoRouboVida = 'roubo_vida';
    }

    rouboVida = Math.max(rouboVida, rouboVidaHabilidade);  // Usar o maior valor
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
    penetracao: penetracao > 0 ? `${Math.floor(penetracao * 100)}% defesa ignorada` : null,
    defesaAumentada: temDefesaAumentada ? `2x redução (+${Math.floor(reducaoResistencia / 2)} extra)` : null,
    penalidadeExaustao: penalidadeTexto,
    bonusVinculo: vinculoTexto,
    elementalMult: elemental.mult,
    chanceCritico: Math.floor(chanceCritico),
    bloqueado,
    sinergia: sinergiaTexto.trim() || null,
    rouboVida: rouboVida > 0 ? `+${rouboVida} HP` : null
  };

  return { dano, critico, elemental, numGolpes, detalhes, rouboVida, tipoRouboVida };
}

/**
 * Calcula cura de habilidade de suporte
 *
 * @param {Object} params
 * @param {Object} params.habilidade - Dados da habilidade
 * @param {Object} params.myAvatar - Avatar do usuário
 * @param {Object} params.modificadoresSinergia - Modificadores de sinergia
 * @param {number} params.hpMax - HP máximo do alvo (para curas percentuais)
 * @returns {number} Quantidade de cura
 */
export function calcularCuraHabilidade({ habilidade, myAvatar, modificadoresSinergia = {}, hpMax = 100 }) {
  const curaBase = Math.abs(habilidade.dano_base) || 20;

  // ===== CURA PERCENTUAL (baseada no HP máximo) =====
  // Se multiplicador_stat é 0 e há efeito de cura instantânea, é cura percentual
  const isCuraPercentual = habilidade.multiplicador_stat === 0 &&
    (habilidade.efeitos_status || []).includes('cura_instantanea');

  console.log('🔍 [DEBUG CURA]', {
    nome: habilidade.nome,
    dano_base: habilidade.dano_base,
    multiplicador_stat: habilidade.multiplicador_stat,
    efeitos_status: habilidade.efeitos_status,
    isCuraPercentual,
    hpMax
  });

  if (isCuraPercentual) {
    // Cura percentual: dano_base negativo indica a porcentagem
    // Ex: dano_base: -30 = 30% do HP máximo
    const percentual = curaBase / 100;
    let cura = Math.ceil(hpMax * percentual);

    console.log('💚 [CURA PERCENTUAL]', {
      curaBase,
      percentual,
      hpMax,
      curaCalculada: cura,
      modificadores: modificadoresSinergia
    });

    // Aplicar modificadores de sinergia de cura
    if (modificadoresSinergia.cura_mult) {
      cura = cura * modificadoresSinergia.cura_mult;
    }

    return Math.floor(cura);
  }

  // ===== CURA NORMAL (baseada em stats) =====
  const statPrimario = habilidade.stat_primario || 'foco';
  const statValue = myAvatar?.[statPrimario] ?? myAvatar?.foco ?? 10;
  let cura = curaBase + (statValue * (habilidade.multiplicador_stat || 0.5));

  console.log('💚 [CURA NORMAL]', {
    curaBase,
    statPrimario,
    statValue,
    multiplicador: habilidade.multiplicador_stat || 0.5,
    curaCalculada: cura
  });

  // Aplicar modificadores de sinergia de cura
  if (modificadoresSinergia.cura_mult) {
    cura = cura * modificadoresSinergia.cura_mult;
  }

  return Math.floor(cura);
}
