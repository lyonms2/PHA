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
import { trackMissionProgress } from '@/lib/missions/missionTracker';
import { calcularHPComSinergia, calcularEnergiaComSinergia } from '@/lib/combat/synergyApplicator';
import { decrementarCooldowns, ativarCooldown } from '@/lib/combat/cooldownSystem';
import { getBattle, setBattle, deleteBattle, enableSessionLogs } from '@/lib/arena/battleSessionStorage';

export const dynamic = 'force-dynamic';

// Habilitar logs de debug das sessões
enableSessionLogs();
console.log('✅ [ROTA TREINO] Módulo carregado - Storage habilitado');

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

    const battle = await getBattle(battleId);

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
        playerEnergyMax: battle.player.energy_max || 100,
        playerExaustao: battle.player.exaustao || 0,
        playerEffects: battle.player.efeitos || [],
        iaHp: battle.ia.hp,
        iaHpMax: battle.ia.hp_max,
        iaEnergy: battle.ia.energy,
        iaEnergyMax: battle.ia.energy_max || 100,
        iaExaustao: battle.ia.exaustao || 0,
        iaEffects: battle.ia.efeitos || [],
        iaAvatar: battle.ia,
        playerDefending: battle.player.defending || false,
        iaDefending: battle.ia.defending || false,
        battleLog: battle.battle_log || [],
        playerCooldowns: battle.player_cooldowns || {},
        iaCooldowns: battle.ia_cooldowns || {},
        playerItemsUsed: battle.player_items_used ?? 0
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
    const { battleId, action, playerAvatar, iaAvatar, personalidadeIA, abilityIndex, dificuldade, sinergia, sinergiaIA, inventoryItemId, itemId } = await request.json();

    // ===== INICIAR NOVA BATALHA =====
    if (action === 'init') {
      if (!playerAvatar || !iaAvatar || !personalidadeIA) {
        return NextResponse.json(
          { error: 'Dados incompletos para iniciar batalha' },
          { status: 400 }
        );
      }

      const newBattleId = `treino_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const playerHpMaxBase = calcularHPMaximoCompleto(playerAvatar);
      const iaHpMaxBase = calcularHPMaximoCompleto(iaAvatar);
      const poderOponente = (iaAvatar.forca || 10) + (iaAvatar.agilidade || 10) +
                           (iaAvatar.resistencia || 10) + (iaAvatar.foco || 10);

      // Aplicar modificadores de sinergia ao HP e Energia
      const modificadoresPlayer = sinergia?.modificadores || {};
      const modificadoresIA = sinergiaIA?.modificadores || {};

      console.log('🔍 [SINERGIA DEBUG] Modificadores recebidos:', {
        playerSinergia: sinergia?.nome || 'Nenhuma',
        playerModificadores: modificadoresPlayer,
        iaSinergia: sinergiaIA?.nome || 'Nenhuma',
        iaModificadores: modificadoresIA
      });

      // HP e Energia do jogador (próprios modificadores + redução do inimigo)
      let playerHpMax = calcularHPComSinergia(playerHpMaxBase, modificadoresPlayer);
      let playerEnergyMax = calcularEnergiaComSinergia(100, modificadoresPlayer);

      // Aplicar redução de energia causada pelo inimigo
      if (modificadoresIA.energia_inimigo_reducao) {
        playerEnergyMax = Math.floor(playerEnergyMax * (1 - modificadoresIA.energia_inimigo_reducao));
      }

      // HP e Energia da IA (próprios modificadores + redução do jogador)
      let iaHpMax = calcularHPComSinergia(iaHpMaxBase, modificadoresIA);
      let iaEnergyMax = calcularEnergiaComSinergia(100, modificadoresIA);

      // Aplicar redução de energia causada pelo jogador
      if (modificadoresPlayer.energia_inimigo_reducao) {
        iaEnergyMax = Math.floor(iaEnergyMax * (1 - modificadoresPlayer.energia_inimigo_reducao));
      }

      console.log('📊 [SINERGIA DEBUG] Valores finais:', {
        player: {
          hpBase: playerHpMaxBase,
          hpComSinergia: playerHpMax,
          energiaBase: 100,
          energiaComSinergia: playerEnergyMax
        },
        ia: {
          hpBase: iaHpMaxBase,
          hpComSinergia: iaHpMax,
          energiaBase: 100,
          energiaComSinergia: iaEnergyMax
        }
      });

      const newBattle = {
        id: newBattleId,
        status: 'active',
        current_turn: 'player',
        winner: null,
        player: {
          ...playerAvatar,
          hp: playerHpMax,
          hp_max: playerHpMax,
          energy: playerEnergyMax,
          energy_max: playerEnergyMax,
          efeitos: [],
          defending: false,
          exaustao: 0,
          modificadoresSinergia: modificadoresPlayer
        },
        ia: {
          ...iaAvatar,
          hp: iaHpMax,
          hp_max: iaHpMax,
          energy: iaEnergyMax,
          energy_max: iaEnergyMax,
          efeitos: [],
          defending: false,
          exaustao: 0,
          modificadoresSinergia: modificadoresIA
        },
        personalidadeIA,
        battle_log: [],
        dificuldade: dificuldade || 'normal',
        poderOponente,
        playerAvatarOriginal: { ...playerAvatar },
        rewardsApplied: false,
        // Armazenar sinergias e modificadores
        sinergia: sinergia || null,
        sinergiaIA: sinergiaIA || null,
        modificadoresPlayer,
        modificadoresIA,
        // Sistema de cooldown: { nomeHabilidade: turnosRestantes }
        player_cooldowns: {},
        ia_cooldowns: {}
      };

      await setBattle(newBattleId, newBattle);

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

    const battle = await getBattle(battleId);

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

    // ===== PROCESSAR EFEITOS DO PLAYER (INÍCIO DO TURNO) =====
    console.log('🔥 [EFEITOS PLAYER] Processando efeitos no início do turno:', {
      playerHp: battle.player.hp,
      playerEffects: battle.player.efeitos
    });

    const playerEffectsResult = processEffects({
      hp: battle.player.hp,
      hpMax: battle.player.hp_max,
      effects: battle.player.efeitos || [],
      nome: battle.player.nome
    });

    console.log('🔥 [EFEITOS PLAYER] Resultado:', {
      newHp: playerEffectsResult.newHp,
      dano: playerEffectsResult.dano,
      cura: playerEffectsResult.cura,
      newEffects: playerEffectsResult.newEffects
    });

    // Atualizar HP e efeitos do jogador
    battle.player.hp = playerEffectsResult.newHp;
    battle.player.efeitos = playerEffectsResult.newEffects;

    console.log('📊 [EFEITOS PLAYER] Efeitos atualizados no estado:',
      battle.player.efeitos.map(ef => `${ef.tipo}:${ef.turnosRestantes}`).join(', ') || 'nenhum'
    );

    // Adicionar log se houve dano ou cura
    if (playerEffectsResult.dano > 0 || playerEffectsResult.cura > 0) {
      battle.battle_log = adicionarLogBatalha(battle.battle_log, {
        acao: 'effects',
        jogador: battle.player.nome,
        dano: playerEffectsResult.dano,
        cura: playerEffectsResult.cura
      });
    }

    // Verificar se player morreu por efeitos
    if (playerEffectsResult.finished) {
      battle.status = 'finished';
      battle.winner = 'ia';

      // Calcular recompensas (derrota por efeitos)
      const recompensas = calcularRecompensasTreino(
        battle.poderOponente,
        battle.dificuldade,
        false // derrota
      );

      console.log('💰 [RECOMPENSAS] Player morreu por efeitos - Calculadas:', recompensas);
      battle.rewardsApplied = true;
      await setBattle(battleId, battle);

      // Rastrear progresso de missões (não bloqueia se falhar)
      const userId = battle.playerAvatarOriginal?.user_id;
      if (userId) {
        trackMissionProgress(userId, 'PARTICIPAR_TREINO', 1);
      }

      return NextResponse.json({
        success: true,
        finished: true,
        winner: 'ia',
        recompensas,
        message: 'Você foi derrotado por efeitos de status!'
      });
    }

    // ===== HANDLER ESPECÍFICO PARA PROCESSAR EFEITOS =====
    // Se a ação for apenas processar efeitos, retornar aqui sem continuar
    if (action === 'process_effects') {
      await setBattle(battleId, battle);

      // Logs de efeitos para exibir no frontend
      const logsEfeitos = playerEffectsResult.logs || [];

      return NextResponse.json({
        success: true,
        action: 'process_effects',
        newHp: battle.player.hp,
        efeitosRestantes: battle.player.efeitos,
        logsEfeitos,
        finished: false
      });
    }

    // ===== VERIFICAR ATORDOAMENTO DO PLAYER =====
    // A lib processEffects já retorna stunned: true se estiver atordoado/paralisado
    let result; // Declarar result aqui para uso em ambos os blocos

    if (playerEffectsResult.stunned) {
      console.log(`😵 [ATORDOADO] Player está ${playerEffectsResult.stunnedType} e pula o turno!`);

      // Adicionar log de turno pulado
      battle.battle_log = adicionarLogBatalha(battle.battle_log, {
        acao: 'atordoado',
        jogador: battle.player.nome,
        alvo: battle.player.nome,
        mensagem: `está ${playerEffectsResult.stunnedType} e não pode agir!`
      });

      // Pular para o turno da IA (result vazio para player)
      result = {
        success: true,
        action: 'stunned',
        attackerHp: battle.player.hp,
        defenderHp: battle.ia.hp,
        log: {
          acao: 'atordoado',
          jogador: battle.player.nome,
          mensagem: `está ${playerEffectsResult.stunnedType} e não pode agir!`
        }
      };
    } else {
      // ===== PROCESSAR AÇÃO DO PLAYER =====
      // ===== DECREMENTAR COOLDOWNS NO INÍCIO DO TURNO =====
      battle.player_cooldowns = decrementarCooldowns(
        battle.player_cooldowns || {},
        battle.player.nome,
        'TREINO'
      );

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
      energyMax: battle.player.energy_max || 100,
      hp: battle.player.hp,
      hpMax: battle.player.hp_max,
      defending: battle.player.defending,
      nome: battle.player.nome,
      modificadoresSinergia: battle.modificadoresPlayer
    };

    const defender = {
      avatar: battle.ia,
      exaustao: battle.ia.exaustao,
      effects: battle.ia.efeitos,
      energy: battle.ia.energy,
      energyMax: battle.ia.energy_max || 100,
      hp: battle.ia.hp,
      hpMax: battle.ia.hp_max,
      defending: battle.ia.defending,
      nome: battle.ia.nome,
      modificadoresSinergia: battle.modificadoresIA
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

      // ===== VERIFICAR COOLDOWN =====
      const cooldownsPlayer = battle.player_cooldowns || {};
      const cooldownRestante = cooldownsPlayer[habilidadeAtualizada.nome] || 0;

      if (cooldownRestante > 0) {
        return NextResponse.json(
          { error: `Habilidade ${habilidadeAtualizada.nome} em cooldown! Aguarde ${cooldownRestante} turno(s).` },
          { status: 400 }
        );
      }

      result = processAbility(battle, attacker, defender, habilidadeAtualizada);

      // ===== ATIVAR COOLDOWN SE HABILIDADE FOI USADA =====
      // Cooldown ativa quando a habilidade é USADA (gasta energia), não quando acerta
      if (result.success) {
        const cooldown = habilidadeAtualizada.cooldown || 0;
        battle.player_cooldowns = ativarCooldown(
          battle.player_cooldowns || {},
          habilidadeAtualizada.nome,
          cooldown,
          battle.player.nome,
          'TREINO',
          result.attacker?.effects || []
        );
      }
    } else if (action === 'useItem') {
      // ===== USAR ITEM (POÇÃO) =====
      if (!inventoryItemId || !itemId) {
        return NextResponse.json(
          { error: 'inventoryItemId e itemId são obrigatórios' },
          { status: 400 }
        );
      }

      const { getDocument, updateDocument, deleteDocument } = await import('@/lib/firebase/firestore');

      // Buscar item do inventário
      const inventoryItem = await getDocument('player_inventory', inventoryItemId);
      if (!inventoryItem) {
        return NextResponse.json(
          { error: 'Item não encontrado no inventário' },
          { status: 404 }
        );
      }

      // Buscar detalhes do item
      const item = await getDocument('items', itemId);
      if (!item) {
        return NextResponse.json(
          { error: 'Item não encontrado' },
          { status: 404 }
        );
      }

      // Verificar se é poção de HP
      const efeito = item.efeito;
      if (efeito !== 'hp' && efeito !== 'cura_hp') {
        return NextResponse.json(
          { error: 'Apenas poções de HP podem ser usadas em batalha' },
          { status: 400 }
        );
      }

      // Verificar limite de 2 itens por batalha
      const itemsUsed = battle.player_items_used ?? 0;
      if (itemsUsed >= 2) {
        return NextResponse.json(
          { error: 'Você já usou o máximo de 2 itens nesta batalha!' },
          { status: 400 }
        );
      }

      // Verificar se já está com HP cheio
      const currentHp = battle.player.hp;
      const maxHp = battle.player.hp_max;
      if (currentHp >= maxHp) {
        return NextResponse.json(
          { error: 'HP já está no máximo!' },
          { status: 400 }
        );
      }

      // Calcular HP curado
      const hpCurado = Math.min(item.valor_efeito, maxHp - currentHp);
      const newHp = currentHp + hpCurado;

      // Consumir item do inventário
      if (inventoryItem.quantidade > 1) {
        await updateDocument('player_inventory', inventoryItemId, {
          quantidade: inventoryItem.quantidade - 1,
          updated_at: new Date().toISOString()
        });
      } else {
        await deleteDocument('player_inventory', inventoryItemId);
      }

      // Incrementar contador de itens usados
      const newItemsUsed = itemsUsed + 1;
      battle.player_items_used = newItemsUsed;

      // Atualizar HP do jogador
      battle.player = {
        ...battle.player,
        hp: newHp
      };

      // Criar resultado
      result = {
        success: true,
        action: 'useItem',
        attacker: { ...battle.player, hp: newHp, energy: battle.player.energy },
        defender: battle.ia,
        log: {
          acao: 'useItem',
          jogador: battle.player.nome,
          item: item.nome,
          hpCurado,
          hpAnterior: currentHp,
          hpNovo: newHp
        },
        finished: false,
        hpCurado,
        hpAnterior: currentHp,
        hpNovo: newHp,
        itemsUsed: newItemsUsed,
        itemsMax: 2
      };
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
      await setBattle(battleId, battle);

      // Rastrear progresso de missões (não bloqueia se falhar)
      const userId = battle.playerAvatarOriginal?.user_id;
      if (userId) {
        trackMissionProgress(userId, 'VITORIA_TREINO', 1);
        // Rastrear dificuldade específica
        if (battle.dificuldade === 'normal') {
          trackMissionProgress(userId, 'VITORIA_TREINO_NORMAL', 1);
        } else if (battle.dificuldade === 'dificil') {
          trackMissionProgress(userId, 'VITORIA_TREINO_DIFICIL', 1);
        }
      }

      return NextResponse.json({
        success: true,
        ...result,
        finished: true,
        winner: 'player',
        recompensas
      });
      }
    } // Fim do else - player não atordoado

    // ===== TURNO DA IA =====
    battle.current_turn = 'ia';

    // Decrementar cooldowns da IA no início do turno
    battle.ia_cooldowns = decrementarCooldowns(battle.ia_cooldowns || {}, battle.ia.nome, 'TREINO');

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
      await setBattle(battleId, battle);

      // Rastrear progresso de missões (não bloqueia se falhar)
      const userId = battle.playerAvatarOriginal?.user_id;
      if (userId) {
        trackMissionProgress(userId, 'VITORIA_TREINO', 1);
        // Rastrear dificuldade específica
        if (battle.dificuldade === 'normal') {
          trackMissionProgress(userId, 'VITORIA_TREINO_NORMAL', 1);
        } else if (battle.dificuldade === 'dificil') {
          trackMissionProgress(userId, 'VITORIA_TREINO_DIFICIL', 1);
        }
      }

      return NextResponse.json({
        success: true,
        ...result,
        finished: true,
        winner: 'player',
        recompensas
      });
    }

    // ===== VERIFICAR ATORDOAMENTO DA IA =====
    // A lib processEffects já retorna stunned: true se estiver atordoado/paralisado
    let iaResult;
    let acaoIA = { acao: 'stunned' }; // Default para atordoado

    if (iaEffectsResult.stunned) {
      console.log(`😵 [ATORDOADO] IA está ${iaEffectsResult.stunnedType} e pula o turno!`);

      // Adicionar log de turno pulado
      battle.battle_log = adicionarLogBatalha(battle.battle_log, {
        acao: 'atordoado',
        jogador: battle.ia.nome,
        alvo: battle.ia.nome,
        mensagem: `está ${iaEffectsResult.stunnedType} e não pode agir!`
      });

      // IA não age, apenas cria resultado vazio
      iaResult = {
        success: true,
        action: 'stunned',
        attacker: {
          ...battle.ia,
          hp: battle.ia.hp,
          energy: battle.ia.energy,
          effects: battle.ia.efeitos
        },
        defender: {
          ...battle.player,
          hp: battle.player.hp,
          effects: battle.player.efeitos
        },
        log: {
          acao: 'atordoado',
          jogador: battle.ia.nome,
          mensagem: `está ${iaEffectsResult.stunnedType} e não pode agir!`
        }
      };
    } else {
      // IA escolhe ação
      console.log('🎯 [IA] Escolhendo ação da IA:', {
        iaHp: battle.ia.hp,
        playerHp: battle.player.hp,
        cooldowns: battle.ia_cooldowns
      });

      acaoIA = escolherAcaoIA(battle.ia, battle.player, battle.personalidadeIA, battle.ia_cooldowns || {});

      if (acaoIA.acao === 'ability' && acaoIA.habilidadeIndex !== undefined) {
        const nomeHab = battle.ia.habilidades[acaoIA.habilidadeIndex]?.nome || 'desconhecida';
        console.log('🎯 [IA] Ação escolhida:', acaoIA.acao, `- ${nomeHab} (index ${acaoIA.habilidadeIndex})`);
      } else {
        console.log('🎯 [IA] Ação escolhida:', acaoIA.acao);
      }

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
        energyMax: battle.ia.energy_max || 100,
        hp: battle.ia.hp,
        hpMax: battle.ia.hp_max,
        defending: battle.ia.defending,
        nome: battle.ia.nome,
        modificadoresSinergia: battle.modificadoresIA
      };

      const iaDefender = {
        avatar: battle.player,
        exaustao: battle.player.exaustao,
        effects: battle.player.efeitos,
        energy: battle.player.energy,
        energyMax: battle.player.energy_max || 100,
        hp: battle.player.hp,
        hpMax: battle.player.hp_max,
        defending: battle.player.defending,
        nome: battle.player.nome,
        modificadoresSinergia: battle.modificadoresPlayer
      };

      console.log('⚙️ [IA] Objetos construídos:', {
        'iaAttacker.hp': iaAttacker.hp,
        'iaDefender.hp': iaDefender.hp
      });

      console.log('🔨 [IA] Processando ação:', acaoIA.acao);

      if (acaoIA.acao === 'attack') {
        iaResult = processAttack(battle, iaAttacker, iaDefender);
      } else if (acaoIA.acao === 'defend') {
        iaResult = processDefend(battle, iaAttacker);
      } else if (acaoIA.acao === 'ability') {
        console.log('🔍 [DEBUG IA HABILIDADE]', {
          iaTemHabilidades: !!battle.ia.habilidades,
          totalHabilidades: battle.ia.habilidades?.length,
          indiceEscolhido: acaoIA.habilidadeIndex,
          habilidadeNomes: battle.ia.habilidades?.map(h => h.nome)
        });

        const habilidadeIA = battle.ia.habilidades?.[acaoIA.habilidadeIndex];

        if (habilidadeIA) {
          console.log('✅ [IA HABILIDADE] Encontrada:', habilidadeIA.nome);
          const habAtualizada = atualizarBalanceamentoHabilidade(habilidadeIA, battle.ia.elemento);

          // ===== VERIFICAR COOLDOWN DA IA =====
          const cooldownsIA = battle.ia_cooldowns || {};
          const cooldownRestante = cooldownsIA[habAtualizada.nome] || 0;

          if (cooldownRestante > 0) {
            console.log(`⏱️ [COOLDOWN IA] ${habAtualizada.nome} em cooldown (${cooldownRestante} turnos). Usando ataque básico.`);
            iaResult = processAttack(battle, iaAttacker, iaDefender);
          } else {
            iaResult = processAbility(battle, iaAttacker, iaDefender, habAtualizada);

            // ===== FALLBACK SE HABILIDADE FALHOU (ex: energia insuficiente) =====
            if (!iaResult.success) {
              console.log('⚠️ [IA HABILIDADE] Falhou - Usando ataque básico como fallback:', iaResult.error);
              iaResult = processAttack(battle, iaAttacker, iaDefender);
            } else {
              // ===== ATIVAR COOLDOWN SE HABILIDADE FOI USADA =====
              // Cooldown ativa quando a habilidade é USADA (gasta energia), não quando acerta
              const cooldown = habAtualizada.cooldown || 0;
              battle.ia_cooldowns = ativarCooldown(
                battle.ia_cooldowns || {},
                habAtualizada.nome,
                cooldown,
                battle.ia.nome,
                'TREINO',
                iaResult.attacker?.effects || []
              );
            }
          }
        } else {
          console.log('❌ [IA HABILIDADE] NÃO ENCONTRADA - Usando ataque básico', {
            indice: acaoIA.habilidadeIndex,
            habilidadesDisponiveis: battle.ia.habilidades?.length || 0
          });
          // Fallback para ataque
          iaResult = processAttack(battle, iaAttacker, iaDefender);
        }
      }

      console.log('📝 [IA] Resultado da ação da IA:', {
        success: iaResult?.success,
        action: iaResult?.action,
        attackerHp: iaResult?.attacker?.hp,
        defenderHp: iaResult?.defender?.hp,
        iaResultExists: !!iaResult
      });
    } // Fim do else - IA não atordoada

    console.log('🔍 [DEBUG] Verificando iaResult antes de processar:', {
      iaResultExists: !!iaResult,
      iaResultSuccess: iaResult?.success,
      acaoIA: acaoIA?.acao
    });

    if (iaResult && iaResult.success) {
      console.log('✅ [IA] iaResult válido, atualizando estado da batalha');
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
        await setBattle(battleId, battle);

        // Preparar logs para o jogador ver
        const logsParaJogador = [];
        if (iaResult && iaResult.log && iaResult.log.detalhes) {
          logsParaJogador.push(iaResult.log.detalhes);
        }
        logsParaJogador.push('☠️ Você foi derrotado!');

        return NextResponse.json({
          success: true,
          ...result,
          iaAction: iaResult,
          finished: true,
          winner: 'ia',
          recompensas,
          logsParaJogador
        });
      }
    } else {
      console.error('❌ [IA] iaResult inválido ou sem success:', {
        iaResultExists: !!iaResult,
        success: iaResult?.success,
        action: iaResult?.action,
        error: iaResult?.error
      });
    }

    // Voltar turno para player (cooldowns do player já foram decrementados no início do turno)
    battle.current_turn = 'player';
    await setBattle(battleId, battle);

    // Preparar logs para o jogador ver
    const logsParaJogador = [];
    if (iaResult && iaResult.log && iaResult.log.detalhes) {
      logsParaJogador.push(iaResult.log.detalhes);
    }

    return NextResponse.json({
      success: true,
      ...result,
      iaAction: iaResult,
      logsParaJogador // Logs explícitos para adicionar no frontend
    });

  } catch (error) {
    console.error('Erro em POST /api/arena/treino-ia/batalha:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
