/**
 * API: BATALHA DE TREINO IA (Refatorada)
 * Batalha contra IA usando a biblioteca de combate compartilhada
 */

import { NextResponse } from 'next/server';
import {
  processAttack,
  processDefend,
  processAbility,
  processEffects,
  atualizarBalanceamentoHabilidade,
  adicionarLogBatalha
} from '@/lib/combat/battle';
import { escolherAcaoIA } from '@/lib/pvp/ai-engine';
import { HABILIDADES_POR_ELEMENTO } from '@/app/avatares/sistemas/abilitiesSystem';
import {
  calcularRecompensasTreino,
  calcularPenalidadesAbandono
} from '@/lib/arena/rewardsSystem';
import { calcularHPMaximoCompleto } from '@/lib/combat/statsCalculator';

export const dynamic = 'force-dynamic';

// Armazenamento em memória das batalhas
const battleSessions = new Map();

/**
 * GET - Buscar estado da batalha
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const battleId = searchParams.get('battleId');

    if (!battleId) {
      return NextResponse.json(
        { error: 'battleId é obrigatório' },
        { status: 400 }
      );
    }

    const battle = battleSessions.get(battleId);

    if (!battle) {
      return NextResponse.json(
        { error: 'Batalha não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      battle: {
        id: battle.id,
        status: battle.status,
        currentTurn: battle.current_turn,
        winner: battle.winner,
        playerNome: battle.player.nome,
        iaNoome: battle.ia.nome,
        playerHp: battle.player.hp,
        playerHpMax: battle.player.hp_max,
        playerEnergy: battle.player.energy,
        playerExaustao: battle.player.exaustao || 0,
        playerEffects: battle.player.efeitos || [],
        iaHp: battle.ia.hp,
        iaHpMax: battle.ia.hp_max,
        iaEnergy: battle.ia.energy,
        iaExaustao: battle.ia.exaustao || 0,
        iaEffects: battle.ia.efeitos || [],
        iaAvatar: battle.ia,
        playerDefending: battle.player.defending || false,
        iaDefending: battle.ia.defending || false,
        battleLog: battle.battle_log || []
      },
      isYourTurn: battle.current_turn === 'player'
    });

  } catch (error) {
    console.error('Erro em GET /api/arena/treino-ia/batalha:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST - Inicializar ou executar ações na batalha
 */
export async function POST(request) {
  try {
    const { battleId, action, playerAvatar, iaAvatar, personalidadeIA, abilityIndex, dificuldade } = await request.json();

    // ===== INICIAR NOVA BATALHA =====
    if (action === 'init') {
      if (!playerAvatar || !iaAvatar || !personalidadeIA) {
        return NextResponse.json(
          { error: 'Dados incompletos para iniciar batalha' },
          { status: 400 }
        );
      }

      const newBattleId = `treino_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const playerHpMax = calcularHPMaximoCompleto(playerAvatar);
      const iaHpMax = calcularHPMaximoCompleto(iaAvatar);
      const poderOponente = (iaAvatar.forca || 10) + (iaAvatar.agilidade || 10) +
                           (iaAvatar.resistencia || 10) + (iaAvatar.foco || 10);

      const newBattle = {
        id: newBattleId,
        status: 'active',
        current_turn: 'player',
        winner: null,
        player: {
          ...playerAvatar,
          hp: playerHpMax,
          hp_max: playerHpMax,
          energy: 100,
          efeitos: [],
          defending: false,
          exaustao: 0
        },
        ia: {
          ...iaAvatar,
          hp: iaHpMax,
          hp_max: iaHpMax,
          energy: 100,
          efeitos: [],
          defending: false,
          exaustao: 0
        },
        personalidadeIA,
        battle_log: [],
        dificuldade: dificuldade || 'normal',
        poderOponente,
        playerAvatarOriginal: { ...playerAvatar },
        rewardsApplied: false
      };

      battleSessions.set(newBattleId, newBattle);

      console.log('🎮 Nova batalha de treino iniciada:', {
        battleId: newBattleId,
        jogador: playerAvatar.nome,
        ia: iaAvatar.nome
      });

      return NextResponse.json({
        success: true,
        battleId: newBattleId,
        message: 'Batalha iniciada!'
      });
    }

    // ===== AÇÕES DE BATALHA =====
    if (!battleId) {
      return NextResponse.json(
        { error: 'battleId é obrigatório' },
        { status: 400 }
      );
    }

    const battle = battleSessions.get(battleId);

    if (!battle) {
      return NextResponse.json(
        { error: 'Batalha não encontrada' },
        { status: 404 }
      );
    }

    if (battle.status !== 'active') {
      return NextResponse.json(
        { error: 'Batalha não está ativa' },
        { status: 400 }
      );
    }

    if (battle.current_turn !== 'player') {
      return NextResponse.json(
        { error: 'Não é seu turno!' },
        { status: 400 }
      );
    }

    // ===== PROCESSAR AÇÃO DO PLAYER =====
    let result;

    // Validar estado antes de processar
    console.log('🎮 [BATALHA] Estado antes de processar ação do jogador:', {
      playerHp: battle.player.hp,
      iaHp: battle.ia.hp,
      action,
      abilityIndex
    });

    if (battle.player.hp === undefined || battle.ia.hp === undefined) {
      console.error('❌ [BATALHA] HP está undefined!', {
        player: battle.player,
        ia: battle.ia
      });
      return NextResponse.json(
        { error: 'Estado de batalha corrompido - HP undefined' },
        { status: 500 }
      );
    }

    const attacker = {
      avatar: battle.player,
      exaustao: battle.player.exaustao,
      effects: battle.player.efeitos,
      energy: battle.player.energy,
      hp: battle.player.hp,
      hpMax: battle.player.hp_max,
      defending: battle.player.defending,
      nome: battle.player.nome
    };

    const defender = {
      avatar: battle.ia,
      exaustao: battle.ia.exaustao,
      effects: battle.ia.efeitos,
      energy: battle.ia.energy,
      hp: battle.ia.hp,
      hpMax: battle.ia.hp_max,
      defending: battle.ia.defending,
      nome: battle.ia.nome
    };

    if (action === 'attack') {
      result = processAttack(battle, attacker, defender);
    } else if (action === 'defend') {
      result = processDefend(battle, attacker);
    } else if (action === 'ability') {
      if (abilityIndex === undefined || abilityIndex === null) {
        return NextResponse.json(
          { error: 'abilityIndex é obrigatório' },
          { status: 400 }
        );
      }

      const habilidades = battle.player.habilidades || [];
      const habilidadeAvatar = habilidades[abilityIndex];

      if (!habilidadeAvatar) {
        return NextResponse.json(
          { error: 'Habilidade não encontrada' },
          { status: 400 }
        );
      }

      // Atualizar balanceamento
      const habilidadeAtualizada = atualizarBalanceamentoHabilidade(
        habilidadeAvatar,
        battle.player.elemento
      );

      result = processAbility(battle, attacker, defender, habilidadeAtualizada);
    } else {
      return NextResponse.json(
        { error: 'Ação inválida' },
        { status: 400 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Atualizar estado da batalha com resultado
    console.log('📝 [BATALHA] Resultado da ação:', {
      success: result.success,
      action: result.action,
      attackerHp: result.attacker?.hp,
      defenderHp: result.defender?.hp,
      errou: result.errou,
      finished: result.finished
    });

    if (action === 'defend') {
      battle.player = {
        ...battle.player,
        energy: result.attacker.energy,
        defending: true
      };
      // Defend não afeta o inimigo, então não atualizamos battle.ia
    } else {
      battle.player = {
        ...battle.player,
        hp: result.attacker?.hp ?? battle.player.hp,
        energy: result.attacker.energy,
        efeitos: result.attacker.effects,
        defending: false
      };

      // Só atualizar IA se result.defender existir (attack/ability)
      if (result.defender) {
        battle.ia = {
          ...battle.ia,
          hp: result.defender.hp,
          efeitos: result.defender.effects,
          defending: result.defender.defending
        };
      }
    }

    console.log('✅ [BATALHA] Estado atualizado após jogador:', {
      playerHp: battle.player.hp,
      iaHp: battle.ia.hp
    });

    // Adicionar log
    battle.battle_log = adicionarLogBatalha(battle.battle_log, result.log);

    // Verificar se acabou
    console.log('🏁 [BATALHA] Verificando fim da batalha:', {
      finished: result.finished,
      iaHp: battle.ia.hp
    });

    if (result.finished) {
      console.log('🎉 [BATALHA] Batalha finalizada! Player venceu!');
      battle.status = 'finished';
      battle.winner = 'player';

      // Calcular recompensas
      const recompensas = calcularRecompensasTreino(
        battle.poderOponente,
        battle.dificuldade,
        true // vitória
      );

      console.log('💰 [RECOMPENSAS] Calculadas:', recompensas);
      battle.rewardsApplied = true;
      battleSessions.set(battleId, battle);

      return NextResponse.json({
        success: true,
        ...result,
        finished: true,
        winner: 'player',
        recompensas
      });
    }

    // ===== TURNO DA IA =====
    battle.current_turn = 'ia';

    console.log('🤖 [TURNO IA] Iniciando turno da IA');

    // Processar efeitos da IA (início do turno)
    console.log('🔥 [EFEITOS IA] Processando efeitos:', {
      iaHp: battle.ia.hp,
      iaEffects: battle.ia.efeitos
    });

    const iaEffectsResult = processEffects({
      hp: battle.ia.hp,
      hpMax: battle.ia.hp_max,
      effects: battle.ia.efeitos,
      nome: battle.ia.nome
    });

    console.log('🔥 [EFEITOS IA] Resultado:', {
      newHp: iaEffectsResult.newHp,
      dano: iaEffectsResult.dano,
      cura: iaEffectsResult.cura
    });

    battle.ia.hp = iaEffectsResult.newHp;
    battle.ia.efeitos = iaEffectsResult.newEffects;

    if (iaEffectsResult.dano > 0 || iaEffectsResult.cura > 0) {
      battle.battle_log = adicionarLogBatalha(battle.battle_log, {
        acao: 'effects',
        jogador: battle.ia.nome,
        dano: iaEffectsResult.dano,
        cura: iaEffectsResult.cura
      });
    }

    if (iaEffectsResult.finished) {
      battle.status = 'finished';
      battle.winner = 'player';

      // Calcular recompensas (IA morreu por efeitos)
      const recompensas = calcularRecompensasTreino(
        battle.poderOponente,
        battle.dificuldade,
        true // vitória
      );

      console.log('💰 [RECOMPENSAS] IA morreu por efeitos - Calculadas:', recompensas);
      battle.rewardsApplied = true;
      battleSessions.set(battleId, battle);

      return NextResponse.json({
        success: true,
        ...result,
        finished: true,
        winner: 'player',
        recompensas
      });
    }

    // IA escolhe ação
    console.log('🎯 [IA] Escolhendo ação da IA:', {
      iaHp: battle.ia.hp,
      playerHp: battle.player.hp
    });

    const acaoIA = escolherAcaoIA(battle.ia, battle.player, battle.personalidadeIA);

    console.log('🎯 [IA] Ação escolhida:', acaoIA.acao);

    // Processar ação da IA
    console.log('⚙️ [IA] Construindo iaAttacker e iaDefender:', {
      'battle.ia.hp': battle.ia.hp,
      'battle.player.hp': battle.player.hp
    });

    const iaAttacker = {
      avatar: battle.ia,
      exaustao: battle.ia.exaustao,
      effects: battle.ia.efeitos,
      energy: battle.ia.energy,
      hp: battle.ia.hp,
      hpMax: battle.ia.hp_max,
      defending: battle.ia.defending,
      nome: battle.ia.nome
    };

    const iaDefender = {
      avatar: battle.player,
      exaustao: battle.player.exaustao,
      effects: battle.player.efeitos,
      energy: battle.player.energy,
      hp: battle.player.hp,
      hpMax: battle.player.hp_max,
      defending: battle.player.defending,
      nome: battle.player.nome
    };

    console.log('⚙️ [IA] Objetos construídos:', {
      'iaAttacker.hp': iaAttacker.hp,
      'iaDefender.hp': iaDefender.hp
    });

    let iaResult;
    console.log('🔨 [IA] Processando ação:', acaoIA.acao);

    if (acaoIA.acao === 'attack') {
      iaResult = processAttack(battle, iaAttacker, iaDefender);
    } else if (acaoIA.acao === 'defend') {
      iaResult = processDefend(battle, iaAttacker);
    } else if (acaoIA.acao === 'ability') {
      const habilidadeIA = battle.ia.habilidades?.[acaoIA.abilityIndex];
      if (habilidadeIA) {
        const habAtualizada = atualizarBalanceamentoHabilidade(habilidadeIA, battle.ia.elemento);
        iaResult = processAbility(battle, iaAttacker, iaDefender, habAtualizada);
      } else {
        // Fallback para ataque
        iaResult = processAttack(battle, iaAttacker, iaDefender);
      }
    }

    console.log('📝 [IA] Resultado da ação da IA:', {
      success: iaResult?.success,
      action: iaResult?.action,
      attackerHp: iaResult?.attacker?.hp,
      defenderHp: iaResult?.defender?.hp
    });

    if (iaResult && iaResult.success) {
      // Atualizar estado
      if (acaoIA.acao === 'defend') {
        battle.ia = {
          ...battle.ia,
          energy: iaResult.attacker.energy,
          defending: true
        };
        // Defend não afeta o player, então não atualizamos battle.player
      } else {
        battle.ia = {
          ...battle.ia,
          hp: iaResult.attacker?.hp ?? battle.ia.hp,
          energy: iaResult.attacker.energy,
          efeitos: iaResult.attacker.effects,
          defending: false
        };

        // Só atualizar player se iaResult.defender existir (attack/ability)
        if (iaResult.defender) {
          battle.player = {
            ...battle.player,
            hp: iaResult.defender.hp,
            efeitos: iaResult.defender.effects,
            defending: iaResult.defender.defending
          };
        }
      }

      battle.battle_log = adicionarLogBatalha(battle.battle_log, iaResult.log);

      if (iaResult.finished) {
        battle.status = 'finished';
        battle.winner = 'ia';

        // Calcular recompensas (derrota)
        const recompensas = calcularRecompensasTreino(
          battle.poderOponente,
          battle.dificuldade,
          false // derrota
        );

        console.log('💰 [RECOMPENSAS] Derrota - Calculadas:', recompensas);
        battle.rewardsApplied = true;
        battleSessions.set(battleId, battle);

        return NextResponse.json({
          success: true,
          ...result,
          iaAction: iaResult,
          finished: true,
          winner: 'ia',
          recompensas
        });
      }
    }

    // Voltar turno para player
    battle.current_turn = 'player';
    battleSessions.set(battleId, battle);

    return NextResponse.json({
      success: true,
      ...result,
      iaAction: iaResult
    });

  } catch (error) {
    console.error('Erro em POST /api/arena/treino-ia/batalha:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
