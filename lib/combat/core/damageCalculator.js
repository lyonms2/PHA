/**
 * Sistema de cálculo de dano
 * Processa todo o cálculo de dano de ataques e habilidades
 */

import { calcularMultiplicadorElemental } from './elementalSystem';

/**
 * Calcula dano de ataque básico
 *
 * Fórmula: 5 + (força × 0.5) + random(1-5)
 * Redução: - (resistência × 0.3)
 * Modificadores: vínculo, elemental, crítico (com bônus de sinergia), bloqueio
 * Sinergias: resistência do defensor, chance de crítico do atacante
 *
 * @param {Object} params
 * @param {number} params.forca - Força do atacante
 * @param {number} params.foco - Foco do atacante (para crítico)
 * @param {number} params.resistenciaOponente - Resistência do defensor
 * @param {number} params.myExaustao - (REMOVIDO - não usado mais)
 * @param {number} params.vinculo - Vínculo do atacante (0-100)
 * @param {string} params.meuElemento - Elemento do atacante
 * @param {string} params.elementoOponente - Elemento do defensor
 * @param {boolean} params.opponentDefending - Se oponente está defendendo
 * @param {Array} params.opponentEffects - Efeitos do oponente
 * @param {Object} params.modificadoresSinergia - Modificadores da sinergia do atacante (critico)
 * @param {Object} params.defenderModifiers - Modificadores da sinergia do defensor (resistencia)
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
  // LOG DE SINERGIAS ATIVAS (ATAQUE BÁSICO)
  if (Object.keys(modificadoresSinergia).length > 0 || Object.keys(defenderModifiers).length > 0) {
    console.group('%c✨ SINERGIAS ATIVAS (Ataque Básico)', 'color: #FFD700; font-weight: bold; font-size: 13px');

    if (Object.keys(modificadoresSinergia).length > 0) {
      console.log('%c🔮 Sinergia do Atacante:', 'color: #00ff00; font-weight: bold');
      const sinergiaFormatada = {};
      for (const [key, value] of Object.entries(modificadoresSinergia)) {
        const percentual = Math.floor(value * 100);
        const nomes = {
          critico: 'Chance Crítico',
          resistencia: 'Resistência'
        };
        sinergiaFormatada[nomes[key] || key] = `${percentual >= 0 ? '+' : ''}${percentual}%`;
      }
      console.table(sinergiaFormatada);
    }

    if (Object.keys(defenderModifiers).length > 0) {
      console.log('%c🛡️ Sinergia do Defensor:', 'color: #ff6b6b; font-weight: bold');
      const defensorFormatado = {};
      for (const [key, value] of Object.entries(defenderModifiers)) {
        const percentual = Math.floor(value * 100);
        defensorFormatado['Resistência Inimigo'] = `${percentual >= 0 ? '+' : ''}${percentual}%`;
      }
      console.table(defensorFormatado);
    }

    console.groupEnd();
  }

  // Calcular multiplicador elemental
  const elemental = calcularMultiplicadorElemental(meuElemento, elementoOponente);

  // Calcular dano base: 5 + (força × 0.5) + random(1-5)
  const random = Math.floor(Math.random() * 5) + 1;
  let danoBase = 5 + (forca * 0.5) + random;

  // Redução por defesa: - (resistência × 0.3)
  // Aplicar modificadores de sinergia:
  // - OFENSIVOS (negativos, reduzem resistência): Vêm do ATACANTE
  // - DEFENSIVOS (positivos, aumentam resistência): Vêm do DEFENSOR
  let resistenciaFinal = resistenciaOponente;

  // Sinergia OFENSIVA do atacante (reduz resistência do defensor)
  if (modificadoresSinergia.resistencia && modificadoresSinergia.resistencia < 0) {
    resistenciaFinal = resistenciaOponente * (1 + modificadoresSinergia.resistencia);
    const percentual = Math.floor(modificadoresSinergia.resistencia * 100);

    console.log(`%c🗡️ SINERGIA OFENSIVA (Atacante REDUZ Defensor): ${percentual}%`,
      'color: #ff6b6b; font-weight: bold',
      {
        'Resistência Base Defensor': Math.floor(resistenciaOponente),
        'Com Sinergia Atacante': Math.floor(resistenciaFinal),
        'Diferença': `${Math.floor(resistenciaFinal - resistenciaOponente)}`
      }
    );
  }

  // Sinergia DEFENSIVA do defensor (aumenta própria resistência)
  if (defenderModifiers.resistencia && defenderModifiers.resistencia > 0) {
    const resistenciaAntesSinergia = resistenciaFinal; // Salva valor ANTES da sinergia defensiva
    resistenciaFinal = resistenciaFinal * (1 + defenderModifiers.resistencia);
    const percentual = Math.floor(defenderModifiers.resistencia * 100);

    console.log(`%c🛡️ SINERGIA DEFENSIVA (Defensor se protege): +${percentual}%`,
      'color: #4ade80; font-weight: bold',
      {
        'Resistência Base Defensor': Math.ceil(resistenciaAntesSinergia),
        'Com Sinergia Defensor': Math.ceil(resistenciaFinal),
        'Diferença': `+${Math.ceil(resistenciaFinal - resistenciaAntesSinergia)}`
      }
    );
  }

  // Aplicar buffs de defesa aumentada do defensor (usa o valor real do bonusResistencia)
  console.log('🔍 [DEBUG DEFESA] opponentEffects recebidos:', JSON.stringify(opponentEffects));
  const efeitoDefesa = opponentEffects.find(ef =>
    ef.tipo === 'defesa_aumentada' || ef.tipo === 'defesa_aumentada_instantanea'
  );
  console.log('🔍 [DEBUG DEFESA] efeitoDefesa encontrado:', JSON.stringify(efeitoDefesa));
  if (efeitoDefesa && efeitoDefesa.bonusResistencia) {
    const resistenciaAntes = resistenciaFinal;
    resistenciaFinal = resistenciaFinal * (1 + efeitoDefesa.bonusResistencia);
    console.log(`🛡️ [BUFF DEFESA] Resistência aumentada: ${resistenciaAntes} → ${resistenciaFinal} (+${Math.floor(efeitoDefesa.bonusResistencia * 100)}%)`);
  }

  const reducaoDefesa = resistenciaFinal * 0.3;
  let dano = danoBase - reducaoDefesa;

  // Bônus de vínculo
  let bonusVinculo = 1.0;
  let vinculoTexto = '';
  if (vinculo >= 80) { bonusVinculo = 1.2; vinculoTexto = '+20%'; }
  else if (vinculo >= 60) { bonusVinculo = 1.15; vinculoTexto = '+15%'; }
  else if (vinculo >= 40) { bonusVinculo = 1.1; vinculoTexto = '+10%'; }
  dano = dano * bonusVinculo;

  // Multiplicador elemental
  dano = dano * elemental.mult;

  // Chance de crítico: 5% + (foco × 0.3%) + bônus de sinergia
  let bonusCritico = 0;
  if (modificadoresSinergia.critico) {
    bonusCritico = modificadoresSinergia.critico * 100; // Converter para %

    console.log(`%c⚡ SINERGIA DE CRÍTICO: +${Math.floor(bonusCritico)}%`,
      'color: #FFD700; font-weight: bold',
      {
        'Chance Base': `${Math.floor(5 + (foco * 0.3))}%`,
        'Bônus Sinergia': `+${Math.floor(bonusCritico)}%`,
        'Chance Total': `${Math.floor(5 + (foco * 0.3) + bonusCritico)}%`
      }
    );
  }
  const chanceCritico = 5 + (foco * 0.3) + bonusCritico;
  const rolou = Math.random() * 100;
  const critico = rolou < chanceCritico;

  if (critico) {
    const danoAntesCritico = dano;
    dano = dano * 2;
    console.log(`💥 [CRÍTICO ATAQUE] ${danoAntesCritico.toFixed(2)} × 2 = ${dano.toFixed(2)}`);
  }

  // Garantir dano mínimo de 1
  const danoAntesFloor = dano;
  dano = Math.max(1, Math.floor(dano));
  console.log(`🔢 [FLOOR ATAQUE] ${danoAntesFloor.toFixed(2)} → ${dano}`);

  // Verificar se oponente está defendendo (reduz dano em 50%)
  if (opponentDefending) {
    const danoAntesDefend = dano;
    dano = Math.floor(dano * 0.5);
    console.log(`🛡️ [DEFEND ATAQUE] ${danoAntesDefend} × 0.5 = ${danoAntesDefend * 0.5} → ${dano}`);
  }

  // Verificar se defensor tem efeito de redução de dano (Campo de Anulação, etc)
  const efeitoReducaoDano = opponentEffects.find(ef => ef.tipo === 'reducao_dano' && ef.reducaoDanoRecebido);
  if (efeitoReducaoDano) {
    const danoAntesReducao = dano;
    const percentualReducao = efeitoReducaoDano.reducaoDanoRecebido;
    dano = Math.floor(dano * (1 - percentualReducao));
    console.log(`🛡️💜 [REDUÇÃO DANO] ${danoAntesReducao} × ${(1 - percentualReducao).toFixed(2)} = ${dano} (-${Math.floor(percentualReducao * 100)}%)`);
  }

  // Detalhes do cálculo para o log
  const detalhes = {
    danoBase: Math.floor(danoBase),
    forca,
    random,
    reducaoDefesa: Math.floor(reducaoDefesa),
    resistenciaOponente,
    bonusVinculo: vinculoTexto,
    elementalMult: elemental.mult,
    chanceCritico: Math.floor(chanceCritico),
    bonusCritico: bonusCritico > 0 ? `+${Math.floor(bonusCritico)}%` : null
  };

  return { dano, critico, elemental, detalhes };
}

/**
 * Calcula dano de habilidade ofensiva
 *
 * Fórmula: dano_base + (stat × multiplicador_stat) + random(1-5)
 * Redução: - (resistência × 0.4) com possível penetração
 * Modificadores: vínculo, elemental, crítico (com bônus de sinergia), bloqueio, múltiplos golpes
 * Sinergias: dano_habilidades do atacante, resistência do defensor, chance de crítico
 *
 * @param {Object} params
 * @param {Object} params.habilidade - Dados da habilidade
 * @param {Object} params.myAvatar - Avatar do atacante
 * @param {Object} params.stats - Stats com buffs aplicados
 * @param {number} params.foco - Foco do atacante (para crítico)
 * @param {number} params.resistenciaOponente - Resistência do defensor
 * @param {number} params.myExaustao - (REMOVIDO - não usado mais)
 * @param {string} params.meuElemento - Elemento do atacante
 * @param {string} params.elementoOponente - Elemento do defensor
 * @param {boolean} params.opponentDefending - Se oponente está defendendo
 * @param {Array} params.opponentEffects - Efeitos do oponente
 * @param {Object} params.modificadoresSinergia - Modificadores da sinergia do atacante (dano_habilidades, critico)
 * @param {Object} params.defenderModifiers - Modificadores da sinergia do defensor (resistencia)
 * @returns {Object} { dano: number, critico: boolean, elemental: object, numGolpes: number, detalhes: object, rouboVida: number, tipoRouboVida: string }
 */
export function calcularDanoHabilidade({
  habilidade,
  myAvatar,
  stats, // NOVO: Stats com buffs aplicados
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

  // LOG DE SINERGIAS ATIVAS
  if (Object.keys(modificadoresSinergia).length > 0 || Object.keys(defenderModifiers).length > 0) {
    console.group('%c✨ SINERGIAS ATIVAS', 'color: #FFD700; font-weight: bold; font-size: 14px');

    if (Object.keys(modificadoresSinergia).length > 0) {
      console.log('%c🔮 Sinergia do Atacante (Suporte → Inimigo Principal):', 'color: #00ff00; font-weight: bold');
      const sinergiaFormatada = {};
      for (const [key, value] of Object.entries(modificadoresSinergia)) {
        const percentual = Math.floor(value * 100);
        const nomes = {
          dano_habilidades: 'Dano de Habilidades',
          critico: 'Chance Crítico',
          resistencia: 'Resistência',
          evasao: 'Evasão'
        };
        sinergiaFormatada[nomes[key] || key] = `${percentual >= 0 ? '+' : ''}${percentual}%`;
      }
      console.table(sinergiaFormatada);
    }

    if (Object.keys(defenderModifiers).length > 0) {
      console.log('%c🛡️ Sinergia do Defensor (Suporte Inimigo → Você):', 'color: #ff6b6b; font-weight: bold');
      const defensorFormatado = {};
      for (const [key, value] of Object.entries(defenderModifiers)) {
        const percentual = Math.floor(value * 100);
        const nomes = {
          resistencia: 'Resistência Inimigo',
          dano_habilidades: 'Dano Inimigo',
          evasao: 'Evasão Inimigo'
        };
        defensorFormatado[nomes[key] || key] = `${percentual >= 0 ? '+' : ''}${percentual}%`;
      }
      console.table(defensorFormatado);
    }

    console.groupEnd();
  }

  // Calcular multiplicador elemental
  const elemental = calcularMultiplicadorElemental(meuElemento, elementoOponente);

  // Dano 100% baseado em stats (sem dano base fixo)
  const multiplicadorStat = habilidade.multiplicador_stat || 3.5;

  // Usar o stat primário da habilidade (forca, foco, agilidade, etc.)
  const statPrimario = habilidade.stat_primario || 'forca';
  // PRIORIDADE: stats com buffs > avatar original
  const statValue = stats?.[statPrimario] ?? myAvatar?.[statPrimario] ?? myAvatar?.forca ?? 10;

  console.log(`📊 [DANO HABILIDADE] ${habilidade.nome} usando ${statPrimario}:`, {
    statValue,
    multiplicador: multiplicadorStat,
    comBuffs: stats?.[statPrimario],
    semBuffs: myAvatar?.[statPrimario],
    usouBuffs: !!stats?.[statPrimario]
  });

  const random = Math.floor(Math.random() * 5) + 1;
  let dano = (statValue * multiplicadorStat) + random;

  // ===== REDUÇÃO POR RESISTÊNCIA DO OPONENTE =====
  // Fórmula: Redução = resistência × 0.4 (mais impactante que ataques normais)
  // Aplicar modificadores de sinergia:
  // - OFENSIVOS (negativos, reduzem resistência): Vêm do ATACANTE
  // - DEFENSIVOS (positivos, aumentam resistência): Vêm do DEFENSOR
  let resistenciaFinal = resistenciaOponente;

  // Sinergia OFENSIVA do atacante (reduz resistência do defensor)
  if (modificadoresSinergia.resistencia && modificadoresSinergia.resistencia < 0) {
    resistenciaFinal = resistenciaOponente * (1 + modificadoresSinergia.resistencia);
    const percentual = Math.floor(modificadoresSinergia.resistencia * 100);

    console.log(`%c🗡️ SINERGIA OFENSIVA (Atacante REDUZ Defensor): ${percentual}%`,
      'color: #ff6b6b; font-weight: bold',
      {
        'Resistência Base Defensor': Math.floor(resistenciaOponente),
        'Com Sinergia Atacante': Math.floor(resistenciaFinal),
        'Diferença': `${Math.floor(resistenciaFinal - resistenciaOponente)}`
      }
    );
  }

  // Sinergia DEFENSIVA do defensor (aumenta própria resistência)
  if (defenderModifiers.resistencia && defenderModifiers.resistencia > 0) {
    const resistenciaAntesSinergia = resistenciaFinal; // Salva valor ANTES da sinergia defensiva
    resistenciaFinal = resistenciaFinal * (1 + defenderModifiers.resistencia);
    const percentual = Math.floor(defenderModifiers.resistencia * 100);

    console.log(`%c🛡️ SINERGIA DEFENSIVA (Defensor se protege): +${percentual}%`,
      'color: #4ade80; font-weight: bold',
      {
        'Resistência Base Defensor': Math.ceil(resistenciaAntesSinergia),
        'Com Sinergia Defensor': Math.ceil(resistenciaFinal),
        'Diferença': `+${Math.ceil(resistenciaFinal - resistenciaAntesSinergia)}`
      }
    );
  }

  // Aplicar buffs de defesa aumentada do defensor (usa o valor real do bonusResistencia)
  console.log('🔍 [DEBUG DEFESA] opponentEffects recebidos:', JSON.stringify(opponentEffects));
  const efeitoDefesa = opponentEffects.find(ef =>
    ef.tipo === 'defesa_aumentada' || ef.tipo === 'defesa_aumentada_instantanea'
  );
  console.log('🔍 [DEBUG DEFESA] efeitoDefesa encontrado:', JSON.stringify(efeitoDefesa));
  if (efeitoDefesa && efeitoDefesa.bonusResistencia) {
    const resistenciaAntes = resistenciaFinal;
    resistenciaFinal = resistenciaFinal * (1 + efeitoDefesa.bonusResistencia);
    console.log(`🛡️ [BUFF DEFESA] Resistência aumentada: ${resistenciaAntes} → ${resistenciaFinal} (+${Math.floor(efeitoDefesa.bonusResistencia * 100)}%)`);
  }

  // ===== PENETRAÇÃO DE DEFESA (ignora_defesa) =====
  // Void e Aether podem ignorar % da defesa (0.0 a 1.0)
  const penetracao = habilidade.ignora_defesa || 0;
  const resistenciaAposPenetracao = resistenciaFinal * (1 - penetracao);

  if (penetracao > 0) {
    console.log(`%c⚔️✨ [PENETRAÇÃO DE DEFESA] ${Math.floor(penetracao * 100)}% ignorado`,
      'color: #ff00ff; font-weight: bold',
      {
        'Resistência Original': resistenciaFinal.toFixed(2),
        'Penetração': `${Math.floor(penetracao * 100)}%`,
        'Resistência Efetiva': resistenciaAposPenetracao.toFixed(2),
        'Redução Aplicada': `${resistenciaAposPenetracao.toFixed(2)} × 0.4 = ${(resistenciaAposPenetracao * 0.4).toFixed(2)}`
      }
    );
  }

  const reducaoResistencia = resistenciaAposPenetracao * 0.4;
  const danoAposResistencia = dano - reducaoResistencia;
  dano = danoAposResistencia;

  // ===== BÔNUS DE VÍNCULO =====
  const vinculo = myAvatar?.vinculo ?? 0;
  let bonusVinculo = 1.0;
  let vinculoTexto = '';
  if (vinculo >= 80) { bonusVinculo = 1.2; vinculoTexto = '+20%'; }
  else if (vinculo >= 60) { bonusVinculo = 1.15; vinculoTexto = '+15%'; }
  else if (vinculo >= 40) { bonusVinculo = 1.1; vinculoTexto = '+10%'; }
  const danoAposVinculo = dano * bonusVinculo;
  dano = danoAposVinculo;

  // ===== MULTIPLICADOR ELEMENTAL =====
  const danoAntesElemental = dano;
  dano = dano * elemental.mult;


  // ===== MODIFICADORES DE SINERGIA =====
  // Aplicar modificador de dano de habilidades (elemento do suporte vs elemento do principal inimigo)
  const danoAntesSinergia = dano;
  if (modificadoresSinergia.dano_habilidades) {
    dano = dano * (1 + modificadoresSinergia.dano_habilidades);
    const percentual = Math.floor(modificadoresSinergia.dano_habilidades * 100);
    sinergiaTexto += `${percentual > 0 ? '+' : ''}${percentual}% Dano Habilidades `;

    console.log(`%c✨ SINERGIA DE DANO APLICADA: ${percentual >= 0 ? '+' : ''}${percentual}%`,
      'color: #FFD700; font-weight: bold',
      {
        'Dano Antes': Math.floor(danoAntesSinergia),
        'Dano Depois': Math.floor(dano),
        'Diferença': `${percentual >= 0 ? '+' : ''}${Math.floor(dano - danoAntesSinergia)} (${percentual}%)`
      }
    );
  }

  // ===== CHANCE DE CRÍTICO =====
  // Bônus de sinergia de crítico (Eletricidade)
  let bonusCritico = 0;
  if (modificadoresSinergia.critico) {
    bonusCritico = modificadoresSinergia.critico * 100; // Converter para %

    console.log(`%c⚡ SINERGIA DE CRÍTICO: +${Math.floor(bonusCritico)}%`,
      'color: #FFD700; font-weight: bold',
      {
        'Chance Base': `${Math.floor(5 + (foco * 0.3))}%`,
        'Bônus Sinergia': `+${Math.floor(bonusCritico)}%`,
        'Chance Total': `${Math.floor(5 + (foco * 0.3) + bonusCritico)}%`
      }
    );
  }
  const chanceCritico = 5 + (foco * 0.3) + bonusCritico;
  const critico = Math.random() * 100 < chanceCritico;
  const danoAntesCritico = dano;
  if (critico) {
    const danoAntesCritico = dano;
    dano = dano * 2;
    console.log(`💥 [CRÍTICO HABILIDADE] ${danoAntesCritico.toFixed(2)} × 2 = ${dano.toFixed(2)}`);
  }

  // ===== BLOQUEIO (DEFENDENDO) =====
  const bloqueado = opponentDefending;
  const danoAntesBloqueio = dano;
  if (bloqueado) {
    dano = Math.floor(dano * 0.5);
    console.log(`🛡️ [DEFEND HABILIDADE - PRÉ-FLOOR] ${danoAntesBloqueio.toFixed(2)} × 0.5 = ${danoAntesBloqueio * 0.5} → ${dano}`);
  }

  // Garantir dano mínimo de 1
  const danoAntesFloor = dano;
  dano = Math.max(1, Math.floor(dano));
  console.log(`🔢 [FLOOR HABILIDADE] ${danoAntesFloor.toFixed(2)} → ${dano}`);

  // Verificar se defensor tem efeito de redução de dano (Campo de Anulação, etc)
  const efeitoReducaoDano = opponentEffects.find(ef => ef.tipo === 'reducao_dano' && ef.reducaoDanoRecebido);
  if (efeitoReducaoDano) {
    const danoAntesReducao = dano;
    const percentualReducao = efeitoReducaoDano.reducaoDanoRecebido;
    dano = Math.floor(dano * (1 - percentualReducao));
    console.log(`🛡️💜 [REDUÇÃO DANO HABILIDADE] ${danoAntesReducao} × ${(1 - percentualReducao).toFixed(2)} = ${dano} (-${Math.floor(percentualReducao * 100)}%)`);
  }

  // ===== MÚLTIPLOS GOLPES =====
  // Se a habilidade tem num_golpes, multiplica o dano
  const numGolpes = habilidade.num_golpes || 1;
  if (numGolpes > 1) {
    dano = dano * numGolpes;
  }

  // ===== ROUBO DE VIDA =====
  let rouboVida = 0;
  let tipoRouboVida = null; // 'auto_cura' ou 'roubo_vida'

  // Roubo de vida dos efeitos da habilidade (Sombra e Água)
  // Filtra efeitos de roubo (strings ou objetos) e só conta os que têm 100% de chance
  const efeitosRouboVida = (habilidade.efeitos_status || [])
    .filter(ef => {
      const nomeEfeito = typeof ef === 'string' ? ef : ef.efeito;
      return nomeEfeito === 'roubo_vida' || nomeEfeito === 'roubo_vida_intenso' ||
             nomeEfeito === 'roubo_vida_massivo' || nomeEfeito === 'auto_cura';
    })
    .filter(ef => {
      // Chance individual do efeito (objeto) ou global da habilidade
      const chanceIndividual = typeof ef === 'object' ? (ef.chance ?? 100) : 100;
      const chanceGlobal = habilidade.chance_efeito ?? 100;
      const chanceEfetiva = Math.min(chanceIndividual, chanceGlobal);
      return chanceEfetiva >= 100;
    })
    .map(ef => typeof ef === 'string' ? ef : ef.efeito);

  if (efeitosRouboVida.length > 0) {
    // Definir percentuais de roubo de vida por tipo de efeito
    const percentuaisRoubo = {
      'roubo_vida': 0.15,          // 15% do dano (Sombra)
      'roubo_vida_intenso': 0.25,  // 25% do dano (Sombra) - CORRIGIDO de 30%
      'roubo_vida_massivo': 0.40,  // 40% do dano (Sombra)
      'auto_cura': 0.20            // 20% do dano (Água)
    };

    // Usar o maior percentual se houver múltiplos efeitos
    const maiorPercentual = Math.max(...efeitosRouboVida.map(ef => percentuaisRoubo[ef] || 0));
    rouboVida = Math.floor(dano * maiorPercentual);

    // Determinar tipo: auto_cura tem prioridade
    if (efeitosRouboVida.includes('auto_cura')) {
      tipoRouboVida = 'auto_cura';
    } else {
      tipoRouboVida = 'roubo_vida';
    }
  }

  // Salvar detalhes do cálculo
  // NOTA: dano_base = 0 (100% stat-based desde balance update)
  const detalhes = {
    danoBase: Math.floor(statValue * multiplicadorStat),
    stat: statPrimario,
    statValue,
    multiplicadorStat,
    random,
    reducaoResistencia: Math.floor(reducaoResistencia),
    resistenciaOponente,
    penetracao: penetracao > 0 ? `${Math.floor(penetracao * 100)}% defesa ignorada` : null,
    bonusVinculo: vinculoTexto,
    elementalMult: elemental.mult,
    chanceCritico: Math.floor(chanceCritico),
    bonusCritico: bonusCritico > 0 ? `+${Math.floor(bonusCritico)}%` : null,
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
