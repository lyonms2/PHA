/**
 * Battle Engine - Motor de batalha unificado
 * Sistema de combate genérico usado por PVP, Treino IA, Desafios e todos os modos de batalha
 *
 * Princípio: Separa lógica de combate (cálculos) da persistência (banco de dados)
 * - Recebe estado atual
 * - Executa ação
 * - Retorna novo estado
 * - Quem chama decide como persistir
 */

import { aplicarPenalidadesExaustao } from '@/app/avatares/sistemas/exhaustionSystem';
import { testarAcertoAtaque } from '@/lib/combat/core/hitChecker';
import { calcularDanoAtaque, calcularDanoHabilidade, calcularCuraHabilidade } from '@/lib/combat/core/damageCalculator';
import { formatAttackLog, formatDefendLog, formatAbilityLog } from './logs/battleLogger';
import { obterEfeito } from '@/app/avatares/sistemas/effects/statusEffects';

/**
 * Processa um ataque básico
 * @param {Object} battleState - Estado atual da batalha
 * @param {Object} attacker - Dados do atacante { avatar, exaustao, effects, energy, nome }
 * @param {Object} defender - Dados do defensor { avatar, exaustao, effects, hp, defending, nome }
 * @returns {Object} Novo estado após o ataque
 */
export function processAttack(battleState, attacker, defender) {
  console.log('⚔️ [ATAQUE] Iniciando processamento:', {
    atacante: attacker.nome,
    defensor: defender.nome,
    energiaAtacante: attacker.energy
  });

  // Validar energia
  if (attacker.energy < 10) {
    return {
      success: false,
      error: 'Energia insuficiente! (10 necessária)'
    };
  }

  // Aplicar penalidades de exaustão
  const attackerStats = aplicarPenalidadesExaustao({
    forca: attacker.avatar.forca ?? 10,
    agilidade: attacker.avatar.agilidade ?? 10,
    resistencia: attacker.avatar.resistencia ?? 10,
    foco: attacker.avatar.foco ?? 10
  }, attacker.exaustao ?? 0);

  const defenderStats = aplicarPenalidadesExaustao({
    forca: defender.avatar.forca ?? 10,
    agilidade: defender.avatar.agilidade ?? 10,
    resistencia: defender.avatar.resistencia ?? 10,
    foco: defender.avatar.foco ?? 10
  }, defender.exaustao ?? 0);

  console.log('📊 [ATAQUE] Stats após exaustão:', {
    atacante: { ...attackerStats, exaustao: attacker.exaustao },
    defensor: { ...defenderStats, exaustao: defender.exaustao }
  });

  // Teste de acerto
  const hitResult = testarAcertoAtaque({
    agilidade: attackerStats.agilidade,
    agilidadeOponente: defenderStats.agilidade,
    opponentEffects: defender.effects || []
  });

  console.log('🎯 [ATAQUE] Teste de acerto:', {
    chanceAcerto: Math.floor(hitResult.chanceAcerto),
    acertou: hitResult.acertou,
    esquivou: hitResult.esquivou,
    invisivel: hitResult.invisivel
  });

  const newEnergy = attacker.energy - 10;

  // Se errou
  if (!hitResult.acertou) {
    return {
      success: true,
      action: 'attack',
      errou: true,
      esquivou: hitResult.esquivou,
      invisivel: hitResult.invisivel,
      dano: 0,
      attacker: {
        ...attacker,
        energy: newEnergy,
        hp: attacker.hp // Preservar HP explicitamente
      },
      defender: {
        ...defender,
        hp: defender.hp // Preservar HP explicitamente
      },
      log: {
        acao: 'attack',
        jogador: attacker.nome,
        alvo: defender.nome,
        errou: true,
        esquivou: hitResult.esquivou,
        invisivel: hitResult.invisivel,
        chanceAcerto: hitResult.invisivel ? undefined : Math.floor(hitResult.chanceAcerto),
        detalhes: `${attacker.nome} ERROU o ataque! ${hitResult.invisivel ? '👻 Alvo INVISÍVEL!' : `💨 Esquivou! (Chance: ${Math.floor(hitResult.chanceAcerto)}%)`}`
      }
    };
  }

  // Obter modificadores de sinergia do atacante
  const modificadoresSinergia = attacker.modificadoresSinergia || {};

  // Calcular dano
  const damageResult = calcularDanoAtaque({
    forca: attackerStats.forca,
    foco: attackerStats.foco,
    resistenciaOponente: defenderStats.resistencia,
    myExaustao: attacker.exaustao ?? 0,
    vinculo: attacker.avatar.vinculo ?? 0,
    meuElemento: attacker.avatar.elemento || 'Neutro',
    elementoOponente: defender.avatar.elemento || 'Neutro',
    opponentDefending: defender.defending || false,
    opponentEffects: defender.effects || [],
    modificadoresSinergia
  });

  const { dano, critico, elemental, detalhes, rouboVida } = damageResult;

  console.log('💥 [ATAQUE] Cálculo de dano:', {
    danoFinal: dano,
    critico,
    elemental: elemental.tipo,
    defendendo: defender.defending,
    detalhes: {
      danoBase: detalhes.danoBase,
      focoBonus: detalhes.focoBonus,
      vinculoBonus: detalhes.vinculoBonus,
      elementalMult: detalhes.elementalMult,
      criticoMult: detalhes.criticoMult
    }
  });

  // Verificar contra-ataque
  const temContraAtaque = (defender.effects || []).some(ef => ef.tipo === 'queimadura_contra_ataque');
  let newAttackerEffects = attacker.effects || [];

  if (temContraAtaque) {
    const danoPorTurno = Math.floor(attackerStats.forca * 0.2) + 5;
    const queimaduraEfeito = {
      tipo: 'queimadura',
      valor: 10,
      danoPorTurno,
      duracao: 3,
      turnosRestantes: 3,
      origem: defender.avatar.elemento
    };
    newAttackerEffects = [...newAttackerEffects.filter(e => e.tipo !== 'queimadura'), queimaduraEfeito];
    console.log('🔥 [ATAQUE] Contra-ataque aplicado! Queimadura:', danoPorTurno, 'por turno');
  }

  const newDefenderHp = Math.max(0, defender.hp - dano);

  // Aplicar roubo de vida (se houver)
  let newAttackerHp = attacker.hp;
  if (rouboVida && rouboVida > 0) {
    newAttackerHp = Math.min(attacker.hp_max || attacker.hp, attacker.hp + rouboVida);
    console.log('💚 [ATAQUE] Roubo de vida:', {
      roubado: rouboVida,
      hpAntes: attacker.hp,
      hpDepois: newAttackerHp
    });
  }

  console.log('❤️ [ATAQUE] HP após ataque:', {
    defensorAntes: defender.hp,
    defensorDepois: newDefenderHp,
    dano,
    rouboVida
  });

  return {
    success: true,
    action: 'attack',
    dano,
    critico,
    bloqueado: defender.defending || false,
    contraAtaque: temContraAtaque,
    elemental: elemental.tipo,
    rouboVida,
    finished: newDefenderHp <= 0,
    attacker: {
      ...attacker,
      hp: newAttackerHp,
      energy: newEnergy,
      effects: newAttackerEffects
    },
    defender: {
      ...defender,
      hp: newDefenderHp,
      defending: false // Reset defesa após ataque
    },
    detalhes,
    log: {
      acao: 'attack',
      jogador: attacker.nome,
      alvo: defender.nome,
      dano,
      critico,
      bloqueado: defender.defending || false,
      contraAtaque: temContraAtaque,
      elemental: elemental.tipo,
      rouboVida,
      get detalhes() {
        // Usar biblioteca centralizada para formatação com detalhes de cálculo
        return formatAttackLog(this, detalhes);
      }
    }
  };
}

/**
 * Processa defesa
 * @param {Object} battleState - Estado atual da batalha
 * @param {Object} defender - Dados de quem está defendendo
 * @returns {Object} Novo estado após defesa
 */
export function processDefend(battleState, defender) {
  const energiaRecuperada = 20;
  const newEnergy = Math.min(100, defender.energy + energiaRecuperada);

  console.log('🛡️ [DEFESA] Processando defesa:', {
    jogador: defender.nome,
    energiaAntes: defender.energy,
    energiaDepois: newEnergy,
    energiaRecuperada
  });

  return {
    success: true,
    action: 'defend',
    energiaRecuperada,
    attacker: {
      ...defender,
      energy: newEnergy,
      defending: true
    },
    log: {
      acao: 'defend',
      jogador: defender.nome,
      energiaRecuperada,
      newEnergy,
      get detalhes() {
        // Usar biblioteca centralizada para formatação
        return formatDefendLog(this, this.newEnergy);
      }
    }
  };
}

/**
 * Processa uso de habilidade
 * @param {Object} battleState - Estado atual da batalha
 * @param {Object} attacker - Dados do atacante
 * @param {Object} defender - Dados do defensor
 * @param {Object} habilidade - Habilidade sendo usada
 * @returns {Object} Novo estado após habilidade
 */
export function processAbility(battleState, attacker, defender, habilidade) {
  console.log('✨ [HABILIDADE] Iniciando processamento:', {
    habilidade: habilidade.nome,
    tipo: habilidade.tipo,
    atacante: attacker.nome,
    defensor: defender.nome,
    custoEnergia: habilidade.custo_energia || 30,
    energiaAtacante: attacker.energy
  });

  // Validar energia
  const custoEnergia = habilidade.custo_energia || 30;
  if (attacker.energy < custoEnergia) {
    return {
      success: false,
      error: `Energia insuficiente! (${custoEnergia} necessária)`
    };
  }

  // Aplicar penalidades de exaustão
  const attackerStats = aplicarPenalidadesExaustao({
    forca: attacker.avatar.forca ?? 10,
    agilidade: attacker.avatar.agilidade ?? 10,
    resistencia: attacker.avatar.resistencia ?? 10,
    foco: attacker.avatar.foco ?? 10
  }, attacker.exaustao ?? 0);

  const defenderStats = aplicarPenalidadesExaustao({
    forca: defender.avatar.forca ?? 10,
    agilidade: defender.avatar.agilidade ?? 10,
    resistencia: defender.avatar.resistencia ?? 10,
    foco: defender.avatar.foco ?? 10
  }, defender.exaustao ?? 0);

  console.log('📊 [HABILIDADE] Stats após exaustão:', {
    atacante: { ...attackerStats, exaustao: attacker.exaustao },
    defensor: { ...defenderStats, exaustao: defender.exaustao }
  });

  const newEnergy = attacker.energy - custoEnergia;
  let dano = 0;
  let cura = 0;
  let critico = false;
  let elemental = { tipo: 'normal', mult: 1 };
  let numGolpes = 1;
  let rouboVida = 0;
  let detalhes = {};

  // Normalizar tipo para minúsculo
  const tipoNormalizado = (habilidade.tipo || '').toLowerCase();

  // Habilidade ofensiva
  if (tipoNormalizado === 'ofensivo' || tipoNormalizado === 'ofensiva') {
    // Teste de acerto
    const hitResult = testarAcertoAtaque({
      agilidade: attackerStats.agilidade,
      agilidadeOponente: defenderStats.agilidade,
      opponentEffects: defender.effects || []
    });

    console.log('🎯 [HABILIDADE] Teste de acerto:', {
      chanceAcerto: Math.floor(hitResult.chanceAcerto),
      acertou: hitResult.acertou,
      esquivou: hitResult.esquivou,
      invisivel: hitResult.invisivel
    });

    if (!hitResult.acertou) {
      console.log('❌ [HABILIDADE] Errou!');
      return {
        success: true,
        action: 'ability',
        habilidade: habilidade.nome,
        errou: true,
        esquivou: hitResult.esquivou,
        invisivel: hitResult.invisivel,
        dano: 0,
        attacker: {
          ...attacker,
          energy: newEnergy,
          hp: attacker.hp // Preservar HP explicitamente
        },
        defender: {
          ...defender,
          hp: defender.hp // Preservar HP explicitamente
        },
        log: {
          acao: 'ability',
          jogador: attacker.nome,
          alvo: defender.nome,
          habilidade: habilidade.nome,
          errou: true,
          esquivou: hitResult.esquivou,
          invisivel: hitResult.invisivel,
          get detalhes() {
            // Usar biblioteca centralizada para formatação
            return formatAbilityLog(this);
          }
        }
      };
    }

    // Obter modificadores de sinergia do atacante
    const modificadoresSinergia = attacker.modificadoresSinergia || {};

    // Calcular dano
    const damageResult = calcularDanoHabilidade({
      habilidade,
      myAvatar: attacker.avatar,
      foco: attackerStats.foco,
      resistenciaOponente: defenderStats.resistencia,
      myExaustao: attacker.exaustao ?? 0,
      meuElemento: attacker.avatar.elemento || 'Neutro',
      elementoOponente: defender.avatar.elemento || 'Neutro',
      opponentDefending: defender.defending || false,
      opponentEffects: defender.effects || [],
      modificadoresSinergia
    });

    dano = damageResult.dano;
    critico = damageResult.critico;
    elemental = damageResult.elemental;
    numGolpes = damageResult.numGolpes;
    detalhes = damageResult.detalhes;
    rouboVida = damageResult.rouboVida || 0;

    console.log('💥 [HABILIDADE] Cálculo de dano:', {
      danoFinal: dano,
      critico,
      elemental: elemental.tipo,
      numGolpes,
      defendendo: defender.defending,
      detalhes: {
        danoBase: detalhes.danoBase,
        focoBonus: detalhes.focoBonus,
        elementalMult: detalhes.elementalMult,
        criticoMult: detalhes.criticoMult
      }
    });
  }

  // Habilidade de suporte (cura)
  if (tipoNormalizado === 'suporte' || habilidade.dano_base < 0) {
    cura = calcularCuraHabilidade({
      habilidade,
      myAvatar: attacker.avatar
    });
    console.log('💚 [HABILIDADE] Cálculo de cura:', {
      curaTotal: cura,
      hpAntes: attacker.hp,
      hpMax: attacker.hpMax
    });
  }

  // Aplicar efeitos da habilidade
  let newAttackerEffects = attacker.effects || [];
  let newDefenderEffects = defender.effects || [];
  const efeitosAplicados = [];

  // Compatibilidade: aceitar tanto 'efeitos' quanto 'efeitos_status'
  const efeitosHabilidade = habilidade.efeitos || habilidade.efeitos_status;

  if (efeitosHabilidade && Array.isArray(efeitosHabilidade)) {
    console.log('🌟 [HABILIDADE] Processando efeitos:', efeitosHabilidade);

    for (const efeito of efeitosHabilidade) {
      // Se efeito é string, buscar no dicionário
      let nomeEfeito, efeitoDicionario;
      if (typeof efeito === 'string') {
        nomeEfeito = efeito;
        efeitoDicionario = obterEfeito(efeito);
        if (!efeitoDicionario) {
          console.warn(`⚠️ [HABILIDADE] Efeito '${efeito}' não encontrado no dicionário!`);
          continue;
        }
      } else {
        nomeEfeito = efeito.tipo || efeito.nome;
        efeitoDicionario = obterEfeito(nomeEfeito) || {};
      }

      // Chance de aplicar efeito
      const chanceAplicar = efeito.chance_efeito || habilidade.chance_efeito || 100;
      const roll = Math.random() * 100;

      if (roll > chanceAplicar) {
        console.log(`⚠️ [HABILIDADE] Efeito ${nomeEfeito} não aplicado (chance: ${chanceAplicar}%, roll: ${Math.floor(roll)}%)`);
        continue;
      }

      // Criar objeto de efeito com propriedades do dicionário + overrides da habilidade/efeito
      const efeitoObj = {
        tipo: nomeEfeito,
        valor: efeito.valor || 10,
        duracao: efeito.duracao || habilidade.duracao_efeito || efeitoDicionario.duracao_base || 3,
        turnosRestantes: efeito.duracao || habilidade.duracao_efeito || efeitoDicionario.duracao_base || 3,
        origem: attacker.avatar.elemento,
        // Copiar propriedades específicas do dicionário
        ...(efeitoDicionario.cura_por_turno && { curaPorTurno: efeitoDicionario.cura_por_turno }),
        ...(efeitoDicionario.dano_por_turno && { danoPorTurno: efeitoDicionario.dano_por_turno }),
        ...(efeitoDicionario.bonus_resistencia && { bonusResistencia: efeitoDicionario.bonus_resistencia }),
        ...(efeitoDicionario.bonus_evasao && { bonusEvasao: efeitoDicionario.bonus_evasao }),
        ...(efeitoDicionario.bonus_agilidade && { bonusAgilidade: efeitoDicionario.bonus_agilidade }),
        ...(efeitoDicionario.reducao_stats && { reducaoStats: efeitoDicionario.reducao_stats }),
        ...(efeitoDicionario.impede_cura && { impedeCura: efeitoDicionario.impede_cura }),
        ...(efeitoDicionario.evasao_total && { evasaoTotal: efeitoDicionario.evasao_total }),
      };

      // Decidir alvo do efeito - prioridade: efeito.alvo > habilidade.alvo > 'oponente'
      const alvoEfeito = (typeof efeito === 'object' ? efeito.alvo : null) || habilidade.alvo || 'oponente';
      if (alvoEfeito === 'self' || alvoEfeito === 'proprio') {
        newAttackerEffects = [...newAttackerEffects.filter(e => e.tipo !== efeitoObj.tipo), efeitoObj];
        console.log(`✅ [HABILIDADE] Efeito ${efeitoObj.tipo} aplicado em ${attacker.nome} (self)`, efeitoObj);
      } else {
        newDefenderEffects = [...newDefenderEffects.filter(e => e.tipo !== efeitoObj.tipo), efeitoObj];
        console.log(`✅ [HABILIDADE] Efeito ${efeitoObj.tipo} aplicado em ${defender.nome} (oponente)`, efeitoObj);
      }

      efeitosAplicados.push(nomeEfeito);
    }
  }

  // Verificar contra-ataque (só para habilidades ofensivas)
  const temContraAtaque = (tipoNormalizado === 'ofensivo' || tipoNormalizado === 'ofensiva') && (defender.effects || []).some(ef => ef.tipo === 'queimadura_contra_ataque');
  if (temContraAtaque) {
    const danoPorTurno = Math.floor(attackerStats.forca * 0.2) + 5;
    const queimaduraEfeito = {
      tipo: 'queimadura',
      valor: 10,
      danoPorTurno,
      duracao: 3,
      turnosRestantes: 3,
      origem: defender.avatar.elemento
    };
    newAttackerEffects = [...newAttackerEffects.filter(e => e.tipo !== 'queimadura'), queimaduraEfeito];
  }

  const newDefenderHp = Math.max(0, defender.hp - dano);

  // Aplicar cura e roubo de vida
  let newAttackerHp = attacker.hp + cura;
  if (rouboVida && rouboVida > 0) {
    newAttackerHp += rouboVida;
    console.log('💚 [HABILIDADE] Roubo de vida:', {
      roubado: rouboVida,
      hpAntes: attacker.hp,
      hpComCura: attacker.hp + cura,
      hpComRoubo: newAttackerHp
    });
  }
  newAttackerHp = Math.min(attacker.hpMax || 100, newAttackerHp);

  console.log('❤️ [HABILIDADE] HP final:', {
    atacante: { antes: attacker.hp, depois: newAttackerHp, cura, rouboVida },
    defensor: { antes: defender.hp, depois: newDefenderHp, dano }
  });

  return {
    success: true,
    action: 'ability',
    habilidade: habilidade.nome,
    dano,
    cura,
    critico,
    bloqueado: defender.defending || false,
    contraAtaque: temContraAtaque,
    elemental: elemental.tipo,
    numGolpes,
    rouboVida,
    efeitos: efeitosAplicados,
    finished: newDefenderHp <= 0,
    attacker: {
      ...attacker,
      energy: newEnergy,
      hp: newAttackerHp,
      effects: newAttackerEffects
    },
    defender: {
      ...defender,
      hp: newDefenderHp,
      defending: false,
      effects: newDefenderEffects
    },
    detalhes,
    log: {
      acao: 'ability',
      jogador: attacker.nome,
      alvo: defender.nome,
      habilidade: habilidade.nome,
      dano,
      cura,
      critico,
      bloqueado: defender.defending || false,
      contraAtaque: temContraAtaque,
      elemental: elemental.tipo,
      numGolpes,
      rouboVida,
      efeitos: efeitosAplicados,
      get detalhes() {
        // Usar biblioteca centralizada para formatação com detalhes de cálculo
        return formatAbilityLog(this, detalhes);
      }
    }
  };
}

/**
 * Processa efeitos de status (DoT, HoT, buffs, debuffs)
 * @param {Object} combatant - Dados de quem tem efeitos { hp, hpMax, effects, nome }
 * @returns {Object} Resultado do processamento
 */
export function processEffects(combatant) {
  if (!combatant.effects || combatant.effects.length === 0) {
    return {
      success: true,
      effects: [],
      dano: 0,
      cura: 0,
      newHp: combatant.hp,
      newEffects: []
    };
  }

  let totalDano = 0;
  let totalCura = 0;
  const efeitosProcessados = [];
  const newEffects = [];

  for (const efeito of combatant.effects) {
    // Efeitos de dano contínuo
    if (['queimadura', 'queimadura_intensa', 'veneno', 'sangramento', 'eletrocutado', 'eletrocucao'].includes(efeito.tipo)) {
      let dano = efeito.danoPorTurno || efeito.valor || 5;
      // Se danoPorTurno é percentual (< 1), calcular baseado no HP máximo
      if (efeito.danoPorTurno && efeito.danoPorTurno < 1) {
        dano = Math.ceil((combatant.hpMax || 100) * efeito.danoPorTurno);
      }
      totalDano += dano;
      efeitosProcessados.push({ tipo: efeito.tipo, valor: dano, acao: 'dano' });
    }

    // Efeitos de cura contínua
    if (['regeneração', 'regeneracao', 'auto_cura'].includes(efeito.tipo)) {
      let cura = efeito.curaPorTurno || efeito.valor || 5;
      // Se curaPorTurno é percentual (< 1), calcular baseado no HP máximo
      if (efeito.curaPorTurno && efeito.curaPorTurno < 1) {
        cura = Math.ceil((combatant.hpMax || 100) * efeito.curaPorTurno);
      }
      totalCura += cura;
      efeitosProcessados.push({ tipo: efeito.tipo, valor: cura, acao: 'cura' });
    }

    // Decrementar duração
    const turnosRestantes = (efeito.turnosRestantes ?? efeito.duracao ?? 1) - 1;

    // Manter efeito se ainda tem turnos
    if (turnosRestantes > 0) {
      newEffects.push({
        ...efeito,
        turnosRestantes
      });
    } else {
      efeitosProcessados.push({ tipo: efeito.tipo, acao: 'expirou' });
    }
  }

  const newHp = Math.max(0, Math.min(combatant.hpMax || 100, combatant.hp - totalDano + totalCura));

  return {
    success: true,
    dano: totalDano,
    cura: totalCura,
    newHp,
    newEffects,
    efeitosProcessados,
    finished: newHp <= 0
  };
}
