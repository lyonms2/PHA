// ==================== SISTEMA DE COMBATE PVP UNIFICADO ====================
// Arquivo: /lib/combat/pvpCombatSystem.js
//
// Sistema de combate baseado nas mecânicas do PVP, usado por:
// - PVP (duelos entre jogadores)
// - Treino IA (combate contra IA)
// - Desafios de Boss (combate contra bosses épicos)

import { aplicarPenalidadesExaustao } from '@/app/avatares/sistemas/exhaustionSystem';
import { calcularMultiplicadorElemental } from '@/lib/combat/core/elementalSystem';

/**
 * Calcula a chance de acerto de um ataque
 * @param {number} agilidadeAtacante - Agilidade do atacante
 * @param {number} agilidadeDefensor - Agilidade do defensor
 * @param {Array} efeitosDefensor - Efeitos ativos no defensor
 * @returns {Object} { chanceAcerto, acertou, detalhes }
 */
export function calcularAcerto(agilidadeAtacante, agilidadeDefensor, efeitosDefensor = []) {
  // Verificar invisibilidade (sempre esquiva)
  const temInvisibilidade = efeitosDefensor.some(ef =>
    ef.tipo === 'invisivel' || ef.tipo === 'invisível'
  );

  if (temInvisibilidade) {
    return {
      chanceAcerto: 0,
      acertou: false,
      esquivou: true,
      invisivel: true,
      detalhes: { mensagem: 'Oponente está invisível!' }
    };
  }

  // Calcular bônus de evasão de buffs
  let bonusEvasao = 0;
  const temEvasaoAumentada = efeitosDefensor.some(ef => ef.tipo === 'evasao_aumentada');
  const temVelocidadeAumentada = efeitosDefensor.some(ef =>
    ef.tipo === 'velocidade' || ef.tipo === 'velocidade_aumentada'
  );

  if (temEvasaoAumentada) bonusEvasao += 30; // +30% evasão
  if (temVelocidadeAumentada) bonusEvasao += 15; // +15% evasão

  // Base 70% + diferença de agilidade × 2% - bônus evasão
  let chanceAcerto = 70 + (agilidadeAtacante - agilidadeDefensor) * 2 - bonusEvasao;
  chanceAcerto = Math.min(95, Math.max(5, chanceAcerto)); // Mínimo 5%, máximo 95%

  const rolouAcerto = Math.random() * 100;
  const acertou = rolouAcerto < chanceAcerto;

  return {
    chanceAcerto: Math.floor(chanceAcerto),
    acertou,
    esquivou: !acertou,
    detalhes: {
      agilidadeAtacante,
      agilidadeDefensor,
      bonusEvasao,
      rolouAcerto: Math.floor(rolouAcerto)
    }
  };
}

/**
 * Calcula o dano de um ataque básico
 */
export function calcularDanoAtaque(atacante, defensor, opcoesDefensor = {}, modificadoresSinergia = {}) {
  const vinculo = atacante.vinculo ?? 0;
  const exaustao = atacante.exaustao ?? 0;
  const elemento = atacante.elemento || 'Neutro';
  const elementoOponente = defensor.elemento || 'Neutro';
  const efeitosOponente = defensor.efeitos || [];
  const defendendo = opcoesDefensor.defendendo || false;

  // Aplicar debuffs de exaustão nos stats ANTES dos cálculos
  const statsAtacanteBase = {
    forca: atacante.forca ?? 10,
    agilidade: atacante.agilidade ?? 10,
    resistencia: atacante.resistencia ?? 10,
    foco: atacante.foco ?? 10
  };
  const statsAtacante = aplicarPenalidadesExaustao(statsAtacanteBase, exaustao);

  const statsDefensorBase = {
    forca: defensor.forca ?? 10,
    agilidade: defensor.agilidade ?? 10,
    resistencia: defensor.resistencia ?? 10,
    foco: defensor.foco ?? 10
  };
  const statsDefensor = aplicarPenalidadesExaustao(statsDefensorBase, defensor.exaustao ?? 0);

  // Stats COM debuffs de exaustão aplicados
  const forca = statsAtacante.forca;
  const foco = statsAtacante.foco;
  const agilidade = statsAtacante.agilidade;
  const resistenciaOponente = statsDefensor.resistencia;
  const agilidadeOponente = statsDefensor.agilidade;

  // ===== TESTE DE ACERTO =====
  const resultadoAcerto = calcularAcerto(agilidade, agilidadeOponente, efeitosOponente);
  if (!resultadoAcerto.acertou) {
    return {
      errou: true,
      esquivou: resultadoAcerto.esquivou,
      invisivel: resultadoAcerto.invisivel,
      dano: 0,
      detalhes: resultadoAcerto.detalhes
    };
  }

  // ===== CÁLCULO DE DANO BASE =====
  const random = Math.floor(Math.random() * 5) + 1;
  let danoBase = 5 + (forca * 0.5) + random;

  // ===== REDUÇÃO POR DEFESA =====
  // Aplicar modificadores de sinergia na resistência do inimigo
  let resistenciaFinal = resistenciaOponente;
  if (modificadoresSinergia.resistencia_inimigo_reducao) {
    resistenciaFinal = resistenciaOponente * (1 - modificadoresSinergia.resistencia_inimigo_reducao);
  }

  // Aplicar buffs de defesa aumentada do defensor (usa o valor real do bonusResistencia)
  const efeitoDefesa = efeitosOponente.find(ef =>
    ef.tipo === 'defesa_aumentada' || ef.tipo === 'defesa_aumentada_instantanea'
  );
  if (efeitoDefesa && efeitoDefesa.bonusResistencia) {
    resistenciaFinal = resistenciaFinal * (1 + efeitoDefesa.bonusResistencia);
  }

  const reducaoDefesa = resistenciaFinal * 0.3;
  let dano = danoBase - reducaoDefesa;

  // ===== PENALIDADE DE EXAUSTÃO =====
  let penalidade = 1.0;
  let penalidadeTexto = '';
  if (exaustao >= 80) { penalidade = 0.5; penalidadeTexto = '-50%'; }
  else if (exaustao >= 60) { penalidade = 0.75; penalidadeTexto = '-25%'; }
  else if (exaustao >= 40) { penalidade = 0.95; penalidadeTexto = '-5%'; }
  dano = dano * penalidade;

  // ===== BÔNUS DE VÍNCULO =====
  let bonusVinculo = 1.0;
  let vinculoTexto = '';
  if (vinculo >= 80) { bonusVinculo = 1.2; vinculoTexto = '+20%'; }
  else if (vinculo >= 60) { bonusVinculo = 1.15; vinculoTexto = '+15%'; }
  else if (vinculo >= 40) { bonusVinculo = 1.1; vinculoTexto = '+10%'; }
  dano = dano * bonusVinculo;

  // ===== MULTIPLICADOR ELEMENTAL =====
  const elemental = calcularMultiplicadorElemental(elemento, elementoOponente);
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

  // ===== CHANCE DE CRÍTICO =====
  const chanceCritico = 5 + (foco * 0.3);
  const rolou = Math.random() * 100;
  const critico = rolou < chanceCritico;

  if (critico) {
    dano = dano * 2;
  }

  // ===== BLOQUEIO (DEFENDENDO) =====
  const bloqueado = defendendo;
  if (bloqueado) {
    dano = Math.floor(dano * 0.5);
  }

  // Garantir dano mínimo de 1
  dano = Math.max(1, Math.floor(dano));

  // ===== ROUBO DE VIDA DE SINERGIA =====
  let rouboVida = 0;
  if (modificadoresSinergia.roubo_vida_percent && modificadoresSinergia.roubo_vida_percent > 0) {
    rouboVida = Math.floor(dano * modificadoresSinergia.roubo_vida_percent);
    const percentual = Math.floor(modificadoresSinergia.roubo_vida_percent * 100);
    sinergiaTexto += `+${percentual}% Roubo Vida `;
  }

  // Detalhes do cálculo
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

  return {
    dano,
    critico,
    bloqueado,
    elemental: elemental.tipo,
    rouboVida,
    detalhes
  };
}

/**
 * Calcula o dano de uma habilidade
 */
export function calcularDanoHabilidade(atacante, defensor, habilidade, opcoesDefensor = {}, modificadoresSinergia = {}) {
  const vinculo = atacante.vinculo ?? 0;
  const exaustao = atacante.exaustao ?? 0;
  const elemento = atacante.elemento || 'Neutro';
  const elementoOponente = defensor.elemento || 'Neutro';
  const efeitosOponente = defensor.efeitos || [];

  // Aplicar debuffs de exaustão nos stats ANTES dos cálculos
  const statsAtacanteBase = {
    forca: atacante.forca ?? 10,
    agilidade: atacante.agilidade ?? 10,
    resistencia: atacante.resistencia ?? 10,
    foco: atacante.foco ?? 10
  };
  const statsAtacante = aplicarPenalidadesExaustao(statsAtacanteBase, exaustao);

  const statsDefensorBase = {
    forca: defensor.forca ?? 10,
    agilidade: defensor.agilidade ?? 10,
    resistencia: defensor.resistencia ?? 10,
    foco: defensor.foco ?? 10
  };
  const statsDefensor = aplicarPenalidadesExaustao(statsDefensorBase, defensor.exaustao ?? 0);

  // Stats COM debuffs de exaustão aplicados
  const forca = statsAtacante.forca;
  const foco = statsAtacante.foco;
  const agilidade = statsAtacante.agilidade;
  const resistenciaOponente = statsDefensor.resistencia;
  const agilidadeOponente = statsDefensor.agilidade;
  const defendendo = opcoesDefensor.defendendo || false;

  // ===== TESTE DE ACERTO DA HABILIDADE =====
  const chanceAcertoBase = habilidade.chance_acerto ?? 100;

  // Verificar buffs de evasão do oponente
  const temInvisibilidade = efeitosOponente.some(ef =>
    ef.tipo === 'invisivel' || ef.tipo === 'invisível'
  );
  const temEvasaoAumentada = efeitosOponente.some(ef => ef.tipo === 'evasao_aumentada');
  const temVelocidadeAumentada = efeitosOponente.some(ef =>
    ef.tipo === 'velocidade' || ef.tipo === 'velocidade_aumentada'
  );

  // Invisibilidade = sempre esquiva (a menos que seja 100% acerto)
  if (temInvisibilidade && chanceAcertoBase < 100) {
    return {
      errou: true,
      esquivou: true,
      invisivel: true,
      dano: 0,
      detalhes: { mensagem: 'Oponente está invisível!' }
    };
  }

  // Calcular bônus de evasão de buffs
  let bonusEvasao = 0;
  if (temEvasaoAumentada) bonusEvasao += 30;
  if (temVelocidadeAumentada) bonusEvasao += 15;

  // Chance final = chance base - (agilidade oponente × 0.5%) - bônus evasão
  let chanceAcertoFinal = chanceAcertoBase - (agilidadeOponente * 0.5) - bonusEvasao;
  chanceAcertoFinal = Math.min(100, Math.max(5, chanceAcertoFinal));
  const rolouAcerto = Math.random() * 100;
  const acertou = rolouAcerto < chanceAcertoFinal;

  // Se habilidade ofensiva/controle errou
  if (!acertou && (habilidade.tipo === 'Ofensiva' || habilidade.tipo === 'Controle')) {
    return {
      errou: true,
      dano: 0,
      detalhes: {
        chanceAcerto: Math.floor(chanceAcertoFinal),
        chanceAcertoBase,
        agilidadeOponente,
        reducaoEvasao: Math.floor(agilidadeOponente * 0.5),
        rolouAcerto: Math.floor(rolouAcerto)
      }
    };
  }

  let dano = 0;
  let cura = 0;
  let critico = false;
  let numGolpes = habilidade.num_golpes || 1;
  let sinergiaTexto = ''; // Declarar aqui para estar disponível em todos os blocos

  // ===== CALCULAR DANO (HABILIDADES OFENSIVAS/CONTROLE) =====
  if (habilidade.tipo === 'Ofensiva' || habilidade.tipo === 'Controle' || (habilidade.dano_base && habilidade.dano_base > 0)) {
    const danoBase = habilidade.dano_base || 15;
    const multiplicadorStat = habilidade.multiplicador_stat || 0.5;
    const statPrimario = habilidade.stat_primario || 'forca';
    const statValue = atacante[statPrimario] ?? forca;

    const random = Math.floor(Math.random() * 5) + 1;
    dano = danoBase + (statValue * multiplicadorStat) + random;

    // ===== REDUÇÃO POR RESISTÊNCIA =====
    // Aplicar modificadores de sinergia na resistência do inimigo
    let resistenciaFinal = resistenciaOponente;
    if (modificadoresSinergia.resistencia_inimigo_reducao) {
      resistenciaFinal = resistenciaOponente * (1 - modificadoresSinergia.resistencia_inimigo_reducao);
    }

    // Aplicar buffs de defesa aumentada do defensor (usa o valor real do bonusResistencia)
    const efeitoDefesa = efeitosOponente.find(ef =>
      ef.tipo === 'defesa_aumentada' || ef.tipo === 'defesa_aumentada_instantanea'
    );
    if (efeitoDefesa && efeitoDefesa.bonusResistencia) {
      resistenciaFinal = resistenciaFinal * (1 + efeitoDefesa.bonusResistencia);
    }

    const reducaoResistencia = resistenciaFinal * 0.4;
    dano = dano - reducaoResistencia;

    // ===== PENALIDADE DE EXAUSTÃO =====
    let penalidade = 1.0;
    let penalidadeTexto = '';
    if (exaustao >= 80) { penalidade = 0.5; penalidadeTexto = '-50%'; }
    else if (exaustao >= 60) { penalidade = 0.75; penalidadeTexto = '-25%'; }
    else if (exaustao >= 40) { penalidade = 0.95; penalidadeTexto = '-5%'; }
    dano = dano * penalidade;

    // ===== BÔNUS DE VÍNCULO =====
    let bonusVinculo = 1.0;
    let vinculoTexto = '';
    if (vinculo >= 80) { bonusVinculo = 1.2; vinculoTexto = '+20%'; }
    else if (vinculo >= 60) { bonusVinculo = 1.15; vinculoTexto = '+15%'; }
    else if (vinculo >= 40) { bonusVinculo = 1.1; vinculoTexto = '+10%'; }
    dano = dano * bonusVinculo;

    // ===== MULTIPLICADOR ELEMENTAL =====
    const elemental = calcularMultiplicadorElemental(elemento, elementoOponente);
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

    // ===== CHANCE DE CRÍTICO =====
    const chanceCritico = 5 + (foco * 0.3);
    critico = Math.random() * 100 < chanceCritico;
    if (critico) {
      dano = dano * 2;
    }

    // ===== BLOQUEIO =====
    const bloqueado = defendendo;
    if (bloqueado) {
      dano = Math.floor(dano * 0.5);
    }

    // Garantir dano mínimo de 1
    dano = Math.max(1, Math.floor(dano));

    // ===== MÚLTIPLOS GOLPES =====
    if (numGolpes > 1) {
      dano = dano * numGolpes;
    }
  }

  // ===== HABILIDADE DE CURA (SUPORTE) =====
  if (habilidade.tipo === 'Suporte' && habilidade.dano_base < 0) {
    const curaBase = Math.abs(habilidade.dano_base) || 20;
    const statPrimario = habilidade.stat_primario || 'foco';
    const statValue = atacante[statPrimario] ?? foco;
    cura = curaBase + (statValue * (habilidade.multiplicador_stat || 0.5));
    cura = Math.floor(cura);
  }

  // ===== ROUBO DE VIDA =====
  if (dano > 0 && habilidade.efeitos_status) {
    const temRouboVida = habilidade.efeitos_status.some(ef =>
      typeof ef === 'string' && (ef === 'roubo_vida' || ef === 'roubo_vida_intenso' || ef === 'roubo_vida_massivo')
    );

    if (temRouboVida) {
      let percentualRoubo = 0.25; // Roubo de vida normal: 25%
      if (habilidade.efeitos_status.includes('roubo_vida_intenso')) percentualRoubo = 0.40;
      if (habilidade.efeitos_status.includes('roubo_vida_massivo')) percentualRoubo = 0.50;

      const curaRoubo = Math.floor(dano * percentualRoubo);
      cura += curaRoubo;
    }
  }

  // ===== ROUBO DE VIDA DE SINERGIA =====
  if (dano > 0 && modificadoresSinergia.roubo_vida_percent && modificadoresSinergia.roubo_vida_percent > 0) {
    const curaRouboSinergia = Math.floor(dano * modificadoresSinergia.roubo_vida_percent);
    cura += curaRouboSinergia;

    const percentual = Math.floor(modificadoresSinergia.roubo_vida_percent * 100);
    sinergiaTexto += `+${percentual}% Roubo Vida `;
  }

  // ===== CURA COM MODIFICADORES DE SINERGIA =====
  if (cura > 0 && modificadoresSinergia.cura_mult) {
    cura = Math.floor(cura * modificadoresSinergia.cura_mult);
  }

  const elemental = calcularMultiplicadorElemental(elemento, elementoOponente);

  return {
    dano,
    cura,
    critico,
    bloqueado: defendendo,
    elemental: elemental.tipo,
    numGolpes: numGolpes > 1 ? numGolpes : undefined,
    detalhes: {
      habilidade: habilidade.nome,
      tipo: habilidade.tipo,
      sinergia: sinergiaTexto.trim() || null
    }
  };
}

/**
 * Processa efeitos de status no início do turno
 */
export function processarEfeitos(avatar, hpMax) {
  const efeitos = avatar.efeitos || [];
  let hp = avatar.hp ?? avatar.hp_atual ?? 100;

  const logsEfeitos = [];
  let danoTotal = 0;
  let curaTotal = 0;
  let paralisado = false;

  // ===== VERIFICAR PARALISIA - PULA TURNO =====
  const efeitoParalisia = efeitos.find(ef => ef.tipo === 'paralisia' || ef.tipo === 'paralisado');
  if (efeitoParalisia) {
    paralisado = true;
    logsEfeitos.push('⚡⚡ PARALISADO! Não pode agir neste turno!');
  }

  // Processar cada efeito
  const efeitosRestantes = [];
  const emojiMap = {
    'queimadura': '🔥', 'queimadura_intensa': '🔥🔥', 'veneno': '💀', 'sangramento': '🩸',
    'eletrocutado': '⚡', 'eletrocucao': '⚡', 'afogamento': '💧', 'maldito': '💀',
    'paralisia_intensa': '⚡⚡⚡', 'fissuras_explosivas': '💥🌍'
  };

  for (const ef of efeitos) {
    // Aplicar dano contínuo
    if (ef.danoPorTurno > 0) {
      danoTotal += ef.danoPorTurno;
      const emoji = emojiMap[ef.tipo] || '💥';
      logsEfeitos.push(`${emoji} ${ef.tipo}: -${ef.danoPorTurno} HP`);
    }

    // Regeneração
    if (ef.tipo === 'regeneração' || ef.tipo === 'regeneracao') {
      const curaEfeito = Math.floor(hpMax * 0.05);
      curaTotal += curaEfeito;
      logsEfeitos.push(`💚 Regeneração: +${curaEfeito} HP`);
    }

    // Auto-cura
    if (ef.tipo === 'auto_cura') {
      const curaEfeito = Math.floor(hpMax * 0.03);
      curaTotal += curaEfeito;
      logsEfeitos.push(`💚 Auto-cura: +${curaEfeito} HP`);
    }

    // Decrementar duração
    ef.turnosRestantes -= 1;
    if (ef.turnosRestantes > 0) {
      efeitosRestantes.push(ef);
    } else {
      logsEfeitos.push(`✖️ ${ef.tipo} expirou`);
    }
  }

  // Calcular novo HP
  const newHp = Math.min(hpMax, Math.max(0, hp - danoTotal + curaTotal));

  return {
    newHp,
    danoTotal,
    curaTotal,
    logsEfeitos,
    efeitosRestantes,
    paralisado,
    morreu: newHp <= 0
  };
}

/**
 * Aplica efeitos de status de uma habilidade
 */
export function aplicarEfeitosHabilidade(habilidade, atacante, defensor) {
  if (!habilidade.efeitos_status || habilidade.efeitos_status.length === 0) {
    return { efeitosAplicados: [], efeitosAtacante: [], efeitosDefensor: [] };
  }

  const efeitosAplicados = [];
  const efeitosAtacante = [...(atacante.efeitos || [])];
  const efeitosDefensor = [...(defensor.efeitos || [])];
  const elemento = atacante.elemento || 'Neutro';
  const forca = atacante.forca ?? 10;

  // Emojis por tipo de efeito
  const efeitoEmojis = {
    'queimadura': '🔥', 'queimadura_intensa': '🔥🔥', 'veneno': '💀', 'sangramento': '🩸',
    'eletrocutado': '⚡', 'defesa_aumentada': '🛡️', 'velocidade': '💨',
    'evasao_aumentada': '👻', 'regeneração': '💚', 'regeneracao': '💚',
    'paralisia': '⚡⚡', 'paralisado': '⚡⚡', 'invisivel': '👻', 'invisível': '👻'
  };

  for (const efeitoConfig of habilidade.efeitos_status) {
    const tipoEfeito = typeof efeitoConfig === 'string' ? efeitoConfig : efeitoConfig.tipo || efeitoConfig;

    // PULAR efeitos instantâneos (roubo de vida já foi processado)
    if (['roubo_vida', 'roubo_vida_intenso', 'roubo_vida_massivo'].includes(tipoEfeito)) {
      continue;
    }

    // ===== TESTAR CHANCE DO EFEITO =====
    const chanceEfeito = habilidade.chance_efeito ?? 100;
    const rolouEfeito = Math.random() * 100;
    if (rolouEfeito >= chanceEfeito) {
      continue; // Efeito não ativou
    }

    const valorEfeito = typeof efeitoConfig === 'object' ? (efeitoConfig.valor || 10) : 10;
    const duracaoEfeito = habilidade.duracao_efeito || 3;

    // ===== VERIFICAR SE JÁ TEM PARALISIA (NÃO EMPILHAR) =====
    if (tipoEfeito === 'paralisia' || tipoEfeito === 'paralisado') {
      const jaTemParalisia = efeitosDefensor.some(ef =>
        ef.tipo === 'paralisia' || ef.tipo === 'paralisado'
      );
      if (jaTemParalisia) {
        continue; // Já está paralisado
      }
    }

    // Determinar dano por turno baseado no tipo
    let danoPorTurno = 0;
    if (['queimadura', 'veneno', 'sangramento', 'eletrocutado', 'eletrocucao', 'afogamento'].includes(tipoEfeito)) {
      danoPorTurno = Math.floor(forca * 0.2) + 5;
    }
    if (tipoEfeito === 'queimadura_intensa') {
      danoPorTurno = Math.floor(forca * 0.4) + 10;
    }

    const novoEfeito = {
      tipo: tipoEfeito,
      valor: valorEfeito,
      danoPorTurno,
      duracao: duracaoEfeito,
      turnosRestantes: duracaoEfeito,
      origem: elemento
    };

    // Buffs aplicam em si mesmo, debuffs no oponente
    const buffsPositivos = [
      'defesa_aumentada', 'velocidade', 'velocidade_aumentada', 'evasao_aumentada',
      'foco_aumentado', 'forca_aumentada', 'regeneração', 'regeneracao',
      'escudo', 'sobrecarga', 'benção', 'bencao', 'invisível', 'invisivel',
      'proteção', 'protecao', 'queimadura_contra_ataque'
    ];

    if (buffsPositivos.includes(tipoEfeito)) {
      // Remover efeito existente do mesmo tipo e adicionar novo
      const index = efeitosAtacante.findIndex(e => e.tipo === tipoEfeito);
      if (index >= 0) efeitosAtacante.splice(index, 1);
      efeitosAtacante.push(novoEfeito);
    } else {
      // Debuffs aplicam no defensor
      const index = efeitosDefensor.findIndex(e => e.tipo === tipoEfeito);
      if (index >= 0) efeitosDefensor.splice(index, 1);
      efeitosDefensor.push(novoEfeito);
    }

    const emoji = efeitoEmojis[tipoEfeito] || '✨';
    efeitosAplicados.push(`${emoji} ${tipoEfeito}`);
  }

  return {
    efeitosAplicados,
    efeitosAtacante,
    efeitosDefensor
  };
}

/**
 * Verifica contra-ataque de queimadura
 */
export function verificarContraAtaque(defensor, atacante, dano) {
  const efeitosDefensor = defensor.efeitos || [];
  const temContraAtaque = efeitosDefensor.some(ef => ef.tipo === 'queimadura_contra_ataque');

  if (!temContraAtaque || dano <= 0) {
    return { contraAtaque: false, efeitosAtacante: atacante.efeitos || [] };
  }

  const forca = atacante.forca ?? 10;
  const elemento = defensor.elemento || 'Neutro';
  const danoPorTurno = Math.floor(forca * 0.2) + 5;

  const queimadura = {
    tipo: 'queimadura',
    valor: 10,
    danoPorTurno,
    duracao: 3,
    turnosRestantes: 3,
    origem: elemento
  };

  const efeitosAtacante = [...(atacante.efeitos || [])];
  const index = efeitosAtacante.findIndex(e => e.tipo === 'queimadura');
  if (index >= 0) efeitosAtacante.splice(index, 1);
  efeitosAtacante.push(queimadura);

  return {
    contraAtaque: true,
    efeitosAtacante
  };
}
