/**
 * API: BATALHA CONTRA BOSS (Refatorada)
 * Batalha contra bosses usando a biblioteca de combate compartilhada
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
import { processarMecanicasEspeciaisBoss } from '@/lib/arena/bossSystem';
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
        bossNome: battle.boss.nome,
        playerHp: battle.player.hp,
        playerHpMax: battle.player.hp_max,
        playerEnergy: battle.player.energy,
        playerExaustao: battle.player.exaustao || 0,
        playerEffects: battle.player.efeitos || [],
        bossHp: battle.boss.hp,
        bossHpMax: battle.boss.hp_max,
        bossEnergy: battle.boss.energy,
        bossExaustao: battle.boss.exaustao || 0,
        bossEffects: battle.boss.efeitos || [],
        bossAvatar: battle.boss,
        playerDefending: battle.player.defending || false,
        bossDefending: battle.boss.defending || false,
        battleLog: battle.battle_log || [],
        bossData: battle.bossData,
        mecanicasAtivas: battle.mecanicasAtivas || []
      },
      isYourTurn: battle.current_turn === 'player'
    });

  } catch (error) {
    console.error('Erro em GET /api/arena/desafios/batalha:', error);
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
    const { battleId, action, playerAvatar, bossAvatar, bossData, abilityIndex } = await request.json();

    // ===== INICIAR NOVA BATALHA =====
    if (action === 'init') {
      if (!playerAvatar || !bossAvatar || !bossData) {
        return NextResponse.json(
          { error: 'Dados incompletos para iniciar batalha' },
          { status: 400 }
        );
      }

      const newBattleId = `boss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const playerHpMax = calcularHPMaximoCompleto(playerAvatar);
      const bossHpMax = calcularHPMaximoCompleto(bossAvatar);

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
        boss: {
          ...bossAvatar,
          hp: bossHpMax,
          hp_max: bossHpMax,
          energy: 100,
          efeitos: [],
          defending: false,
          exaustao: 0
        },
        bossData, // Dados do boss (mecânicas, recompensas, etc.)
        mecanicasAtivas: [],
        battle_log: [],
        playerAvatarOriginal: { ...playerAvatar },
        rewardsApplied: false
      };

      battleSessions.set(newBattleId, newBattle);

      console.log('🎮 Nova batalha contra boss iniciada:', {
        battleId: newBattleId,
        jogador: playerAvatar.nome,
        boss: bossAvatar.nome
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
      avatar: battle.boss,
      exaustao: battle.boss.exaustao,
      effects: battle.boss.efeitos,
      energy: battle.boss.energy,
      hp: battle.boss.hp,
      hpMax: battle.boss.hp_max,
      defending: battle.boss.defending,
      nome: battle.boss.nome
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

    // Atualizar estado da batalha
    if (action === 'defend') {
      battle.player = {
        ...battle.player,
        energy: result.attacker.energy,
        defending: true
      };
      // Defend não afeta o boss, então não atualizamos battle.boss
    } else {
      battle.player = {
        ...battle.player,
        hp: result.attacker?.hp ?? battle.player.hp,
        energy: result.attacker.energy,
        efeitos: result.attacker.effects,
        defending: false
      };

      // Só atualizar boss se result.defender existir (attack/ability)
      if (result.defender) {
        battle.boss = {
          ...battle.boss,
          hp: result.defender.hp,
          efeitos: result.defender.effects,
          defending: result.defender.defending
        };
      }
    }

    battle.battle_log = adicionarLogBatalha(battle.battle_log, result.log);

    // ===== PROCESSAR MECÂNICAS ESPECIAIS DO BOSS =====
    if (battle.bossData?.mecanicas) {
      const mecanicasResult = processarMecanicasEspeciaisBoss({
        battle,
        playerAction: action,
        bossHpPercentual: (battle.boss.hp / battle.boss.hp_max) * 100
      });

      if (mecanicasResult.mecanicaAplicada) {
        battle.mecanicasAtivas = mecanicasResult.mecanicasAtivas || [];
        battle.boss = mecanicasResult.boss || battle.boss;
        battle.player = mecanicasResult.player || battle.player;

        // Adicionar logs de mecânicas
        if (mecanicasResult.logs) {
          for (const log of mecanicasResult.logs) {
            battle.battle_log = adicionarLogBatalha(battle.battle_log, log);
          }
        }
      }
    }

    // Verificar se acabou
    if (result.finished) {
      battle.status = 'finished';
      battle.winner = 'player';
      battleSessions.set(battleId, battle);

      return NextResponse.json({
        success: true,
        ...result,
        finished: true,
        winner: 'player',
        mecanicasAtivas: battle.mecanicasAtivas
      });
    }

    // ===== TURNO DO BOSS =====
    battle.current_turn = 'boss';

    // Processar efeitos do boss (início do turno)
    const bossEffectsResult = processEffects({
      hp: battle.boss.hp,
      hpMax: battle.boss.hp_max,
      effects: battle.boss.efeitos,
      nome: battle.boss.nome
    });

    battle.boss.hp = bossEffectsResult.newHp;
    battle.boss.efeitos = bossEffectsResult.newEffects;

    if (bossEffectsResult.dano > 0 || bossEffectsResult.cura > 0) {
      battle.battle_log = adicionarLogBatalha(battle.battle_log, {
        acao: 'effects',
        jogador: battle.boss.nome,
        dano: bossEffectsResult.dano,
        cura: bossEffectsResult.cura
      });
    }

    if (bossEffectsResult.finished) {
      battle.status = 'finished';
      battle.winner = 'player';
      battleSessions.set(battleId, battle);

      return NextResponse.json({
        success: true,
        ...result,
        finished: true,
        winner: 'player',
        mecanicasAtivas: battle.mecanicasAtivas
      });
    }

    // Boss escolhe ação (IA agressiva para bosses)
    const acaoBoss = escolherAcaoIA(battle.boss, battle.player, { tipo: 'agressivo', agressividade: 90 });

    // Processar ação do boss
    const bossAttacker = {
      avatar: battle.boss,
      exaustao: battle.boss.exaustao,
      effects: battle.boss.efeitos,
      energy: battle.boss.energy,
      hp: battle.boss.hp,
      hpMax: battle.boss.hp_max,
      defending: battle.boss.defending,
      nome: battle.boss.nome
    };

    const bossDefender = {
      avatar: battle.player,
      exaustao: battle.player.exaustao,
      effects: battle.player.efeitos,
      energy: battle.player.energy,
      hp: battle.player.hp,
      hpMax: battle.player.hp_max,
      defending: battle.player.defending,
      nome: battle.player.nome
    };

    let bossResult;
    if (acaoBoss.acao === 'attack') {
      bossResult = processAttack(battle, bossAttacker, bossDefender);
    } else if (acaoBoss.acao === 'defend') {
      bossResult = processDefend(battle, bossAttacker);
    } else if (acaoBoss.acao === 'ability') {
      const habilidadeBoss = battle.boss.habilidades?.[acaoBoss.abilityIndex];
      if (habilidadeBoss) {
        const habAtualizada = atualizarBalanceamentoHabilidade(habilidadeBoss, battle.boss.elemento);
        bossResult = processAbility(battle, bossAttacker, bossDefender, habAtualizada);
      } else {
        bossResult = processAttack(battle, bossAttacker, bossDefender);
      }
    }

    if (bossResult && bossResult.success) {
      // Atualizar estado
      if (acaoBoss.acao === 'defend') {
        battle.boss = {
          ...battle.boss,
          energy: bossResult.attacker.energy,
          defending: true
        };
        // Defend não afeta o player, então não atualizamos battle.player
      } else {
        battle.boss = {
          ...battle.boss,
          hp: bossResult.attacker?.hp ?? battle.boss.hp,
          energy: bossResult.attacker.energy,
          efeitos: bossResult.attacker.effects,
          defending: false
        };

        // Só atualizar player se bossResult.defender existir (attack/ability)
        if (bossResult.defender) {
          battle.player = {
            ...battle.player,
            hp: bossResult.defender.hp,
            efeitos: bossResult.defender.effects,
            defending: bossResult.defender.defending
          };
        }
      }

      battle.battle_log = adicionarLogBatalha(battle.battle_log, bossResult.log);

      if (bossResult.finished) {
        battle.status = 'finished';
        battle.winner = 'boss';
        battleSessions.set(battleId, battle);

        return NextResponse.json({
          success: true,
          ...result,
          bossAction: bossResult,
          finished: true,
          winner: 'boss',
          mecanicasAtivas: battle.mecanicasAtivas
        });
      }
    }

    // Voltar turno para player
    battle.current_turn = 'player';
    battleSessions.set(battleId, battle);

    return NextResponse.json({
      success: true,
      ...result,
      bossAction: bossResult,
      mecanicasAtivas: battle.mecanicasAtivas
    });

  } catch (error) {
    console.error('Erro em POST /api/arena/desafios/batalha:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
