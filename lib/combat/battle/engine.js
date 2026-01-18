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
import { ehBuff } from '@/app/avatares/sistemas/effects/effectsProcessor';

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

  // Aplicar penalidades de exaustão e buffs de efeitos
  const attackerStats = aplicarPenalidadesExaustao({
    forca: attacker.avatar.forca ?? 10,
    agilidade: attacker.avatar.agilidade ?? 10,
    resistencia: attacker.avatar.resistencia ?? 10,
    foco: attacker.avatar.foco ?? 10
  }, attacker.exaustao ?? 0, attacker.effects || []);

  const defenderStats = aplicarPenalidadesExaustao({
    forca: defender.avatar.forca ?? 10,
    agilidade: defender.avatar.agilidade ?? 10,
    resistencia: defender.avatar.resistencia ?? 10,
    foco: defender.avatar.foco ?? 10
  }, defender.exaustao ?? 0, defender.effects || []);

  console.log('📊 [ATAQUE] Stats após exaustão:', {
    atacante: { ...attackerStats, exaustao: attacker.exaustao },
    defensor: { ...defenderStats, exaustao: defender.exaustao }
  });

  // Teste de acerto (com modificadores de sinergia do atacante e defensor)
  const hitResult = testarAcertoAtaque({
    agilidade: attackerStats.agilidade,
    agilidadeOponente: defenderStats.agilidade,
    opponentEffects: defender.effects || [],
    defenderModifiers: defender.modificadoresSinergia || {},
    attackerModifiers: attacker.modificadoresSinergia || {}
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

  // Obter modificadores de sinergia do atacante e defensor
  const modificadoresSinergia = attacker.modificadoresSinergia || {};
  const defenderModifiers = defender.modificadoresSinergia || {};

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
    modificadoresSinergia,
    defenderModifiers
  });

  const { dano, critico, elemental, detalhes, rouboVida, tipoRouboVida } = damageResult;

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

  const newDefenderHp = Math.max(0, defender.hp - dano);

  // Verificar contra-ataque de Escudo Flamejante
  const escudoFlamejante = (defender.effects || []).find(ef => ef.tipo === 'escudo_flamejante');
  let newAttackerEffects = attacker.effects || [];
  let danoContraAtaque = 0;

  if (escudoFlamejante && dano > 0) {
    // Contra-ataque: 20% do dano recebido volta como queimadura instantânea
    danoContraAtaque = Math.floor(dano * 0.20);
    console.log('🔥 [CONTRA-ATAQUE] Escudo Flamejante ativado!', {
      danoRecebido: dano,
      danoContraAtaque,
      defensor: defender.nome,
      atacante: attacker.nome
    });
  }

  // Calcular HP final do atacante (contra-ataque + roubo de vida)
  let newAttackerHp = attacker.hp - danoContraAtaque;

  // Aplicar roubo de vida (se houver)
  if (rouboVida && rouboVida > 0) {
    newAttackerHp = Math.min(attacker.hpMax || 100, newAttackerHp + rouboVida);

    // Diferenciar entre auto-cura (Água) e roubo de vida (Sombra/sinergia)
    if (tipoRouboVida === 'auto_cura') {
      console.log('💧 [ATAQUE] Auto-cura (baseada no dano causado):', {
        cura: rouboVida,
        hpAntes: attacker.hp,
        hpComContraAtaque: attacker.hp - danoContraAtaque,
        hpFinal: newAttackerHp
      });
    } else {
      console.log('💚 [ATAQUE] Roubo de vida:', {
        roubado: rouboVida,
        hpAntes: attacker.hp,
        hpComContraAtaque: attacker.hp - danoContraAtaque,
        hpFinal: newAttackerHp
      });
    }
  }

  if (danoContraAtaque > 0) {
    console.log('🔥 [CONTRA-ATAQUE] HP final do atacante:', {
      hpAntes: attacker.hp,
      danoContraAtaque,
      rouboVida,
      hpFinal: newAttackerHp
    });
  }

  // Garantir que HP não seja negativo
  newAttackerHp = Math.max(0, newAttackerHp);

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
    contraAtaque: danoContraAtaque > 0,
    danoContraAtaque,
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
      contraAtaque: danoContraAtaque > 0,
      danoContraAtaque,
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
  const energyMax = defender.energyMax || 100; // Respeitar limite da sinergia
  const newEnergy = Math.min(energyMax, defender.energy + energiaRecuperada);

  console.log('🛡️ [DEFESA] Processando defesa:', {
    jogador: defender.nome,
    energiaAntes: defender.energy,
    energiaDepois: newEnergy,
    energiaRecuperada,
    energyMax
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
  // ===== CABEÇALHO VISUAL =====
  console.log('%c═══════════════════════════════════════════════════════', 'color: #00ff00; font-weight: bold');
  console.log('%c⚔️ HABILIDADE USADA: ' + habilidade.nome, 'color: #ffaa00; font-size: 14px; font-weight: bold');
  console.log('%c═══════════════════════════════════════════════════════', 'color: #00ff00; font-weight: bold');

  // ===== INFORMAÇÕES DA HABILIDADE =====
  console.group('📋 Informações da Habilidade');
  console.table({
    'Nome': habilidade.nome,
    'Tipo': habilidade.tipo,
    'Dano Base': habilidade.dano_base || 0,
    'Multiplicador': (habilidade.multiplicador_stat || 0) + 'x ' + (habilidade.stat_primario || 'forca'),
    'Custo Energia': habilidade.custo_energia || 30,
    'Cooldown': habilidade.cooldown || 0,
    'Efeitos': habilidade.efeitos_status?.join(', ') || 'Nenhum'
  });
  console.groupEnd();

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
  console.log(`⚡ Energia: ${attacker.energy}/${attacker.energyMax || 100} (Custo: ${custoEnergia})`);

  if (attacker.energy < custoEnergia) {
    console.log('%c❌ ENERGIA INSUFICIENTE!', 'color: red; font-weight: bold');
    console.log('%c═══════════════════════════════════════════════════════', 'color: #00ff00; font-weight: bold');
    return {
      success: false,
      error: `Energia insuficiente! (${custoEnergia} necessária)`
    };
  }

  // Aplicar penalidades de exaustão e buffs de efeitos
  const attackerStats = aplicarPenalidadesExaustao({
    forca: attacker.avatar.forca ?? 10,
    agilidade: attacker.avatar.agilidade ?? 10,
    resistencia: attacker.avatar.resistencia ?? 10,
    foco: attacker.avatar.foco ?? 10
  }, attacker.exaustao ?? 0, attacker.effects || []);

  const defenderStats = aplicarPenalidadesExaustao({
    forca: defender.avatar.forca ?? 10,
    agilidade: defender.avatar.agilidade ?? 10,
    resistencia: defender.avatar.resistencia ?? 10,
    foco: defender.avatar.foco ?? 10
  }, defender.exaustao ?? 0, defender.effects || []);

  // ===== MODIFICADORES DE STATS (BUFFS/DEBUFFS) =====
  console.group('📊 Modificadores de Stats');
  console.log(`🎯 ${attacker.nome} (Atacante):`, {
    'Buffs Ativos': (attacker.effects?.filter(e => e.tipo?.includes('aumentad') || e.tipo === 'bencao' || e.tipo === 'regeneracao') || []).length,
    'Debuffs Ativos': (attacker.effects?.filter(e => e.tipo?.includes('reducao') || e.tipo === 'lentidao' || e.tipo === 'enfraquecido') || []).length,
    'Stats Finais': attackerStats
  });
  if (attacker.effects && attacker.effects.length > 0) {
    const efeitosFormatados = attacker.effects.map(e => ({
      Nome: e.nome || e.tipo,
      Tipo: e.tipo,
      Turnos: e.turnosRestantes || e.duracao || '?',
      Valor: e.valor || e.bonusResistencia || e.bonusFoco || '-'
    }));
    console.table(efeitosFormatados);
  }

  console.log(`🛡️ ${defender.nome} (Defensor):`, {
    'Buffs Ativos': (defender.effects?.filter(e => e.tipo?.includes('aumentad') || e.tipo === 'bencao' || e.tipo === 'regeneracao') || []).length,
    'Debuffs Ativos': (defender.effects?.filter(e => e.tipo?.includes('reducao') || e.tipo === 'lentidao' || e.tipo === 'enfraquecido') || []).length,
    'Stats Finais': defenderStats
  });
  if (defender.effects && defender.effects.length > 0) {
    const efeitosFormatados = defender.effects.map(e => ({
      Nome: e.nome || e.tipo,
      Tipo: e.tipo,
      Turnos: e.turnosRestantes || e.duracao || '?',
      Valor: e.valor || e.bonusResistencia || e.bonusFoco || '-'
    }));
    console.table(efeitosFormatados);
  }
  console.groupEnd();

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
  let tipoRouboVida = null; // 'auto_cura' (Água) ou 'roubo_vida' (Sombra)
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

    // Calcular dano (com modificadores do defensor e stats COM buffs aplicados)
    const damageResult = calcularDanoHabilidade({
      habilidade,
      myAvatar: attacker.avatar,
      stats: attackerStats, // NOVO: Passar stats com buffs aplicados
      foco: attackerStats.foco,
      resistenciaOponente: defenderStats.resistencia,
      myExaustao: attacker.exaustao ?? 0,
      meuElemento: attacker.avatar.elemento || 'Neutro',
      elementoOponente: defender.avatar.elemento || 'Neutro',
      opponentDefending: defender.defending || false,
      opponentEffects: defender.effects || [],
      modificadoresSinergia,
      defenderModifiers: defender.modificadoresSinergia || {}
    });

    dano = damageResult.dano;
    critico = damageResult.critico;
    elemental = damageResult.elemental;
    numGolpes = damageResult.numGolpes;
    detalhes = damageResult.detalhes;
    rouboVida = damageResult.rouboVida || 0;
    tipoRouboVida = damageResult.tipoRouboVida;

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

  // Habilidade de suporte (cura APENAS se dano_base < 0 ou tem cura explícita)
  // Buffs/debuffs de suporte com dano_base: 0 NÃO curam
  if (habilidade.dano_base < 0 || (tipoNormalizado === 'suporte' && habilidade.dano_base !== 0)) {
    cura = calcularCuraHabilidade({
      habilidade,
      myAvatar: attacker.avatar,
      modificadoresSinergia: attacker.modificadoresSinergia || {},
      hpMax: attacker.hpMax || 100
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
        // Objeto: buscar nome em várias propriedades possíveis
        nomeEfeito = efeito.efeito || efeito.tipo || efeito.nome;
        efeitoDicionario = obterEfeito(nomeEfeito) || {};
      }

      // Chance de aplicar efeito (suporta tanto 'chance' quanto 'chance_efeito' no objeto)
      const chanceIndividual = typeof efeito === 'object' ? (efeito.chance ?? efeito.chance_efeito ?? 100) : 100;
      const chanceGlobal = habilidade.chance_efeito ?? 100;
      const chanceAplicar = Math.min(chanceIndividual, chanceGlobal);
      const roll = Math.random() * 100;

      if (roll > chanceAplicar) {
        console.log(`⚠️ [HABILIDADE] Efeito ${nomeEfeito} não aplicado (chance: ${chanceAplicar}%, roll: ${Math.floor(roll)}%)`);
        continue;
      }

      // ===== EFEITOS ESPECIAIS QUE NÃO DEVEM SER APLICADOS COMO STATUS =====
      // Estes efeitos são apenas sinalizadores para o damageCalculator
      const efeitosApenasCalculo = [
        'auto_cura', 'cura_instantanea',
        'roubo_vida', 'roubo_vida_intenso', 'roubo_vida_massivo'
      ];
      if (efeitosApenasCalculo.includes(nomeEfeito)) {
        console.log(`⚙️ [HABILIDADE] Efeito ${nomeEfeito} é apenas para cálculo, não será aplicado como status`);
        continue;
      }

      // ===== PROCESSAR LIMPAR DEBUFFS =====
      if (nomeEfeito === 'limpar_debuffs') {
        const alvoLimpeza = (typeof efeito === 'object' ? efeito.alvo : null) || habilidade.alvo || 'oponente';
        if (alvoLimpeza === 'self' || alvoLimpeza === 'proprio') {
          // Remover todos os debuffs do atacante (manter apenas buffs e efeitos válidos)
          const efeitosValidos = newAttackerEffects.filter(ef => ef && ef.tipo);
          const debuffsRemovidos = efeitosValidos.filter(ef => !ehBuff(ef.tipo));
          newAttackerEffects = efeitosValidos.filter(ef => ehBuff(ef.tipo));
          console.log(`✨ [LIMPAR DEBUFFS] Removidos ${debuffsRemovidos.length} debuffs de ${attacker.nome}:`, debuffsRemovidos.map(d => d.tipo).join(', '));
        } else {
          // Remover todos os debuffs do defensor (manter apenas buffs e efeitos válidos)
          const efeitosValidos = newDefenderEffects.filter(ef => ef && ef.tipo);
          const debuffsRemovidos = efeitosValidos.filter(ef => !ehBuff(ef.tipo));
          newDefenderEffects = efeitosValidos.filter(ef => ehBuff(ef.tipo));
          console.log(`✨ [LIMPAR DEBUFFS] Removidos ${debuffsRemovidos.length} debuffs de ${defender.nome}:`, debuffsRemovidos.map(d => d.tipo).join(', '));
        }
        efeitosAplicados.push(nomeEfeito);
        continue; // Não adicionar como efeito de status
      }

      // Criar objeto de efeito com propriedades do dicionário + overrides da habilidade/efeito
      // IMPORTANTE: Usar ?? ao invés de || para permitir duracao_base: 0 (efeitos instantâneos)
      const duracaoEfeito = efeito.duracao ?? habilidade.duracao_efeito ?? efeitoDicionario.duracao_base ?? 3;

      // Decidir alvo do efeito primeiro para calcular turnosRestantes corretamente
      const alvoEfeito = (typeof efeito === 'object' ? efeito.alvo : null) || habilidade.alvo || 'oponente';
      const ehAlvoSelf = alvoEfeito === 'self' || alvoEfeito === 'proprio';

      // FIX: Efeitos aplicados em "self" precisam +1 turno para compensar o decremento
      // imediato no início do próximo turno. Exemplo: duracao:2 deve funcionar por 2 turnos COMPLETOS.
      // Sem o +1: Turno1: aplica (2) → Turno2 início: decrementa (1) → Turno3 início: expira (0) ❌
      // Com o +1: Turno1: aplica (3) → Turno2 início: (2) → Turno3 início: (1) → Turno4: expira ✅
      const turnosRestantesInicial = ehAlvoSelf ? duracaoEfeito + 1 : duracaoEfeito;

      const efeitoObj = {
        tipo: nomeEfeito,
        valor: efeito.valor || 10,
        duracao: duracaoEfeito,
        turnosRestantes: turnosRestantesInicial,
        origem: attacker.avatar.elemento,
        // Copiar propriedades específicas do dicionário
        ...(efeitoDicionario.cura_por_turno && { curaPorTurno: efeitoDicionario.cura_por_turno }),
        ...(efeitoDicionario.dano_por_turno && { danoPorTurno: efeitoDicionario.dano_por_turno }),
        ...(efeitoDicionario.bonus_resistencia && { bonusResistencia: efeitoDicionario.bonus_resistencia }),
        ...(efeitoDicionario.bonus_evasao && { bonusEvasao: efeitoDicionario.bonus_evasao }),
        ...(efeitoDicionario.bonus_agilidade && { bonusAgilidade: efeitoDicionario.bonus_agilidade }),
        ...(efeitoDicionario.bonus_foco && { bonusFoco: efeitoDicionario.bonus_foco }),
        ...(efeitoDicionario.bonus_forca && { bonusForca: efeitoDicionario.bonus_forca }),
        ...(efeitoDicionario.bonus_todos_stats && { bonusTodosStats: efeitoDicionario.bonus_todos_stats }),
        ...(efeitoDicionario.reducao_stats && { reducaoStats: efeitoDicionario.reducao_stats }),
        ...(efeitoDicionario.reducao_resistencia && { reducaoResistencia: efeitoDicionario.reducao_resistencia }),
        ...(efeitoDicionario.impede_cura && { impedeCura: efeitoDicionario.impede_cura }),
        ...(efeitoDicionario.evasao_total && { evasaoTotal: efeitoDicionario.evasao_total }),
      };

      // Aplicar efeito no alvo correto
      if (ehAlvoSelf) {
        newAttackerEffects = [...newAttackerEffects.filter(e => e.tipo !== efeitoObj.tipo), efeitoObj];
        console.log(`✅ [HABILIDADE] Efeito ${efeitoObj.tipo} aplicado em ${attacker.nome} (self) - duracao:${efeitoObj.duracao}, turnosRestantes:${efeitoObj.turnosRestantes}`);
      } else {
        newDefenderEffects = [...newDefenderEffects.filter(e => e.tipo !== efeitoObj.tipo), efeitoObj];
        console.log(`✅ [HABILIDADE] Efeito ${efeitoObj.tipo} aplicado em ${defender.nome} (oponente) - duracao:${efeitoObj.duracao}, turnosRestantes:${efeitoObj.turnosRestantes}`);
      }

      efeitosAplicados.push(nomeEfeito);
    }
  }

  // Verificar contra-ataque de Escudo Flamejante (só para habilidades ofensivas)
  const escudoFlamejante = (tipoNormalizado === 'ofensivo' || tipoNormalizado === 'ofensiva') ?
    (defender.effects || []).find(ef => ef.tipo === 'escudo_flamejante') : null;
  let danoContraAtaque = 0;

  if (escudoFlamejante && dano > 0) {
    // Contra-ataque: 20% do dano recebido volta como dano instantâneo
    danoContraAtaque = Math.floor(dano * 0.20);
    console.log('🔥 [CONTRA-ATAQUE] Escudo Flamejante ativado!', {
      danoRecebido: dano,
      danoContraAtaque,
      defensor: defender.nome,
      atacante: attacker.nome
    });
  }

  const newDefenderHp = Math.max(0, defender.hp - dano);

  // Aplicar contra-ataque, cura e roubo de vida
  let newAttackerHp = attacker.hp - danoContraAtaque + cura;
  if (rouboVida && rouboVida > 0) {
    newAttackerHp += rouboVida;

    // Diferenciar entre auto-cura (Água) e roubo de vida (Sombra)
    if (tipoRouboVida === 'auto_cura') {
      console.log('💧 [HABILIDADE] Auto-cura (baseada no dano causado):', {
        cura: rouboVida,
        hpAntes: attacker.hp,
        hpComContraAtaque: attacker.hp - danoContraAtaque,
        hpComCura: attacker.hp - danoContraAtaque + cura,
        hpFinal: newAttackerHp
      });
    } else {
      console.log('💚 [HABILIDADE] Roubo de vida:', {
        roubado: rouboVida,
        hpAntes: attacker.hp,
        hpComContraAtaque: attacker.hp - danoContraAtaque,
        hpComCura: attacker.hp - danoContraAtaque + cura,
        hpComRoubo: newAttackerHp
      });
    }
  }

  if (danoContraAtaque > 0) {
    console.log('🔥 [CONTRA-ATAQUE] HP final do atacante:', {
      hpAntes: attacker.hp,
      danoContraAtaque,
      cura,
      rouboVida,
      hpFinal: newAttackerHp
    });
  }

  newAttackerHp = Math.min(attacker.hpMax || 100, Math.max(0, newAttackerHp));

  console.log('❤️ [HABILIDADE] HP final:', {
    atacante: { antes: attacker.hp, depois: newAttackerHp, cura, rouboVida },
    defensor: { antes: defender.hp, depois: newDefenderHp, dano }
  });

  console.log('🔍 [DEBUG] Retornando attacker.hp:', {
    newAttackerHp,
    attackerHpMax: attacker.hpMax,
    hpRetornado: newAttackerHp
  });

  // ===== RESULTADO FINAL CONSOLIDADO =====
  console.group('📋 Resultado Final');
  console.log('%c✅ Habilidade executada com sucesso!', 'color: #00ff00; font-weight: bold');
  console.table({
    'Dano Causado': dano || 0,
    'Cura Recebida': cura || 0,
    'Roubo de Vida': rouboVida || 0,
    'Energia Gasta': custoEnergia,
    'HP Defensor': `${newDefenderHp}/${defender.hpMax || 100}`,
    'HP Atacante': `${newAttackerHp}/${attacker.hpMax || 100}`,
    'Energia Atacante': `${newEnergy}/${attacker.energyMax || 100}`,
    'Efeitos Aplicados': efeitosAplicados.length,
    'Crítico': critico ? 'SIM' : 'Não',
    'Contra-Ataque': danoContraAtaque > 0 ? `SIM (${danoContraAtaque} dano)` : 'Não'
  });

  if (efeitosAplicados.length > 0) {
    console.log('%c✨ Efeitos aplicados:', 'color: #FFD700; font-weight: bold');
    console.log(efeitosAplicados.join(', '));
  }

  console.groupEnd();
  console.log('%c═══════════════════════════════════════════════════════', 'color: #00ff00; font-weight: bold');

  return {
    success: true,
    action: 'ability',
    habilidade: habilidade.nome,
    dano,
    cura,
    critico,
    bloqueado: defender.defending || false,
    contraAtaque: danoContraAtaque > 0,
    danoContraAtaque,
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
      contraAtaque: danoContraAtaque > 0,
      danoContraAtaque,
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
      newEffects: [],
      stunned: false
    };
  }

  // Filtrar apenas efeitos válidos
  const validEffects = combatant.effects.filter(ef => ef && ef.tipo);
  if (validEffects.length === 0) {
    return {
      success: true,
      effects: [],
      dano: 0,
      cura: 0,
      newHp: combatant.hp,
      newEffects: [],
      stunned: false
    };
  }

  // ===== VERIFICAR EFEITOS DE CONTROLE QUE IMPEDEM AÇÕES - PULA TURNO =====
  const stunEffects = ['atordoado', 'paralisia', 'paralisado', 'paralisia_intensa', 'congelado'];
  const stunEffect = validEffects.find(ef => stunEffects.includes(ef.tipo));

  if (stunEffect) {
    console.log(`😵 [PROCESSEFFECTS] ${combatant.nome} está ${stunEffect.tipo} e não pode agir!`);

    // Decrementar TODOS os efeitos (stun impede ações, mas o tempo passa para todos os efeitos)
    const newEffects = validEffects.map(ef => {
      return {
        ...ef,
        turnosRestantes: (ef.turnosRestantes ?? ef.duracao ?? 1) - 1
      };
    }).filter(ef => {
      // Remover se turnosRestantes <= 0
      if (ef.turnosRestantes <= 0) {
        console.log(`✖️ [PROCESSEFFECTS] ${ef.tipo} expirou`);
        return false;
      }
      return true;
    });

    return {
      success: true,
      stunned: true,
      stunnedType: stunEffect.tipo,
      dano: 0,
      cura: 0,
      newHp: combatant.hp,
      newEffects,
      efeitosProcessados: [{ tipo: stunEffect.tipo, acao: 'impede_acao' }],
      finished: false
    };
  }

  // ===== PROCESSAR OUTROS EFEITOS (dano, cura, etc) =====
  let totalDano = 0;
  let totalCura = 0;
  const efeitosProcessados = [];
  const newEffects = [];

  for (const efeito of validEffects) {
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

    // Decrementar duração APENAS se não for efeito instantâneo
    // Efeitos instantâneos (duracao_base: 1) duram o turno ATUAL + são removidos no próximo
    // Por isso, efeitos com turnosRestantes: 1 devem ser decrementados para 0 e removidos
    const valorAntes = efeito.turnosRestantes ?? efeito.duracao ?? 1;
    const turnosRestantes = valorAntes - 1;

    console.log(`⏱️ [EFEITO] ${combatant.nome} - ${efeito.tipo}: ${valorAntes} → ${turnosRestantes}`);

    // Manter efeito se ainda tem turnos (>= 0 para efeitos que estão no turno atual)
    // Efeitos com turnosRestantes: 0 são removidos
    if (turnosRestantes > 0) {
      newEffects.push({
        ...efeito,
        turnosRestantes
      });
      console.log(`  ✅ Efeito mantido com ${turnosRestantes} turnos`);
    } else {
      // Efeito expirou
      efeitosProcessados.push({ tipo: efeito.tipo, acao: 'expirou' });
      console.log(`  ❌ Efeito expirou`);
    }
  }

  const newHp = Math.max(0, Math.min(combatant.hpMax || 100, combatant.hp - totalDano + totalCura));

  return {
    success: true,
    stunned: false,
    dano: totalDano,
    cura: totalCura,
    newHp,
    newEffects,
    efeitosProcessados,
    finished: newHp <= 0
  };
}
