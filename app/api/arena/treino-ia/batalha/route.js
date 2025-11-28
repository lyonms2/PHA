// ==================== API: BATALHA DE TREINO IA ====================
// Arquivo: /app/api/arena/treino-ia/batalha/route.js
//
// API de batalha contra IA usando mecânicas PVP

import { NextResponse } from 'next/server';
import {
  calcularDanoAtaque,
  calcularDanoHabilidade,
  aplicarEfeitosHabilidade,
  verificarContraAtaque,
  processarEfeitos
} from '@/lib/combat/pvpCombatSystem';
import { escolherAcaoIA } from '@/lib/pvp/ai-engine';
import { HABILIDADES_POR_ELEMENTO } from '@/app/avatares/sistemas/abilitiesSystem';
import {
  calcularRecompensasTreino,
  calcularPenalidadesAbandono
} from '@/lib/arena/rewardsSystem';

export const dynamic = 'force-dynamic';

// Armazenamento em memória das batalhas (em produção, usar DB)
const battleSessions = new Map();

/**
 * Atualiza os valores de balanceamento de uma habilidade
 */
function atualizarBalanceamentoHabilidade(habilidadeAvatar, elemento) {
  if (!habilidadeAvatar || !elemento) return habilidadeAvatar;

  const habilidadesSistema = HABILIDADES_POR_ELEMENTO[elemento];
  if (!habilidadesSistema) return habilidadeAvatar;

  const habilidadeSistema = Object.values(habilidadesSistema).find(
    h => h.nome === habilidadeAvatar.nome
  );

  if (!habilidadeSistema) return habilidadeAvatar;

  return {
    ...habilidadeAvatar,
    custo_energia: habilidadeSistema.custo_energia,
    chance_efeito: habilidadeSistema.chance_efeito,
    duracao_efeito: habilidadeSistema.duracao_efeito,
    dano_base: habilidadeSistema.dano_base,
    multiplicador_stat: habilidadeSistema.multiplicador_stat,
    cooldown: habilidadeSistema.cooldown
  };
}

/**
 * Helper: Adicionar log de ação ao histórico da batalha
 */
function adicionarLogBatalha(battleLog = [], novoLog) {
  const logLimpo = {};
  for (const [key, value] of Object.entries(novoLog)) {
    if (value !== undefined) {
      logLimpo[key] = value;
    }
  }

  const logComId = {
    ...logLimpo,
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString()
  };

  const logsAtualizados = [...battleLog, logComId];
  return logsAtualizados.slice(-20); // Manter apenas últimas 20 ações
}

/**
 * GET - Busca estado da batalha
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
 * POST - Inicializa ou atualiza batalha
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

      // Calcular HP máximo
      const calcularHP = (avatar) => {
        const resistencia = avatar.resistencia || 10;
        return 50 + (resistencia * 5);
      };

      const playerHpMax = calcularHP(playerAvatar);
      const iaHpMax = calcularHP(iaAvatar);

      // Calcular poder do oponente para recompensas
      const poderOponente = (iaAvatar.forca || 10) + (iaAvatar.agilidade || 10) +
                           (iaAvatar.resistencia || 10) + (iaAvatar.foco || 10);

      const newBattle = {
        id: newBattleId,
        status: 'active',
        current_turn: 'player', // Jogador começa
        winner: null,
        player: {
          ...playerAvatar,
          hp: playerHpMax,
          hp_max: playerHpMax,
          energy: 100,
          efeitos: [],
          defending: false
        },
        ia: {
          ...iaAvatar,
          hp: iaHpMax,
          hp_max: iaHpMax,
          energy: 100,
          efeitos: [],
          defending: false
        },
        personalidadeIA,
        battle_log: [],
        // Dados para sistema de recompensas
        dificuldade: dificuldade || 'normal',
        poderOponente,
        playerAvatarOriginal: { ...playerAvatar }, // Guardar dados originais
        rewardsApplied: false
      };

      battleSessions.set(newBattleId, newBattle);

      console.log('🎮 Nova batalha de treino iniciada:', {
        battleId: newBattleId,
        jogador: playerAvatar.nome,
        ia: iaAvatar.nome,
        personalidade: personalidadeIA.tipo
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

    // ===== ATACAR =====
    if (action === 'attack') {
      if (battle.current_turn !== 'player') {
        return NextResponse.json(
          { error: 'Não é seu turno!' },
          { status: 400 }
        );
      }

      if (battle.status !== 'active') {
        return NextResponse.json(
          { error: 'Batalha não está ativa' },
          { status: 400 }
        );
      }

      // Verificar energia
      if (battle.player.energy < 10) {
        return NextResponse.json(
          { error: 'Energia insuficiente! (10 necessária)' },
          { status: 400 }
        );
      }

      // Calcular dano usando sistema PVP
      const resultadoAtaque = calcularDanoAtaque(
        battle.player,
        battle.ia,
        { defendendo: battle.ia.defending }
      );

      if (resultadoAtaque.errou) {
        battle.player.energy -= 10;
        battle.player.defending = false;
        battle.current_turn = 'ia';

        const battleLog = adicionarLogBatalha(battle.battle_log, {
          acao: 'attack',
          jogador: battle.player.nome,
          alvo: battle.ia.nome,
          errou: true,
          esquivou: resultadoAtaque.esquivou,
          invisivel: resultadoAtaque.invisivel
        });
        battle.battle_log = battleLog;

        return NextResponse.json({
          success: true,
          errou: true,
          esquivou: resultadoAtaque.esquivou,
          invisivel: resultadoAtaque.invisivel,
          dano: 0,
          newOpponentHp: battle.ia.hp,
          newEnergy: battle.player.energy,
          detalhes: resultadoAtaque.detalhes
        });
      }

      const dano = resultadoAtaque.dano;
      battle.ia.hp = Math.max(0, battle.ia.hp - dano);
      battle.player.energy -= 10;

      // Verificar contra-ataque
      const contraAtaque = verificarContraAtaque(battle.ia, battle.player, dano);
      if (contraAtaque.contraAtaque) {
        battle.player.efeitos = contraAtaque.efeitosAtacante;
      }

      // Log
      const battleLog = adicionarLogBatalha(battle.battle_log, {
        acao: 'attack',
        jogador: battle.player.nome,
        alvo: battle.ia.nome,
        dano,
        critico: resultadoAtaque.critico,
        bloqueado: resultadoAtaque.bloqueado,
        contraAtaque: contraAtaque.contraAtaque,
        elemental: resultadoAtaque.elemental
      });
      battle.battle_log = battleLog;

      // Reset defending
      battle.ia.defending = false;
      battle.current_turn = 'ia';

      // Verificar fim
      if (battle.ia.hp <= 0) {
        battle.status = 'finished';
        battle.winner = 'player';
      }

      return NextResponse.json({
        success: true,
        dano,
        critico: resultadoAtaque.critico,
        bloqueado: resultadoAtaque.bloqueado,
        elemental: resultadoAtaque.elemental,
        contraAtaque: contraAtaque.contraAtaque,
        newOpponentHp: battle.ia.hp,
        newEnergy: battle.player.energy,
        finished: battle.ia.hp <= 0,
        winner: battle.ia.hp <= 0 ? 'player' : null,
        detalhes: resultadoAtaque.detalhes
      });
    }

    // ===== DEFENDER =====
    if (action === 'defend') {
      if (battle.current_turn !== 'player') {
        return NextResponse.json(
          { error: 'Não é seu turno!' },
          { status: 400 }
        );
      }

      if (battle.status !== 'active') {
        return NextResponse.json(
          { error: 'Batalha não está ativa' },
          { status: 400 }
        );
      }

      // Recuperar energia (+20, max 100)
      const newEnergy = Math.min(100, battle.player.energy + 20);
      const energyGained = newEnergy - battle.player.energy;
      battle.player.energy = newEnergy;
      battle.player.defending = true;

      // Log
      const battleLog = adicionarLogBatalha(battle.battle_log, {
        acao: 'defend',
        jogador: battle.player.nome,
        energiaRecuperada: energyGained
      });
      battle.battle_log = battleLog;

      battle.current_turn = 'ia';

      return NextResponse.json({
        success: true,
        newEnergy,
        energyGained
      });
    }

    // ===== USAR HABILIDADE =====
    if (action === 'ability') {
      if (battle.current_turn !== 'player') {
        return NextResponse.json(
          { error: 'Não é seu turno!' },
          { status: 400 }
        );
      }

      if (battle.status !== 'active') {
        return NextResponse.json(
          { error: 'Batalha não está ativa' },
          { status: 400 }
        );
      }

      if (!battle.player.habilidades || !battle.player.habilidades[abilityIndex]) {
        return NextResponse.json(
          { error: 'Habilidade não encontrada' },
          { status: 400 }
        );
      }

      // Atualizar balanceamento
      const habilidadeAvatar = battle.player.habilidades[abilityIndex];
      const habilidade = atualizarBalanceamentoHabilidade(habilidadeAvatar, battle.player.elemento);
      const custoEnergia = habilidade.custo_energia || 20;

      // Verificar energia
      if (battle.player.energy < custoEnergia) {
        return NextResponse.json(
          { error: `Energia insuficiente! (${custoEnergia} necessária)` },
          { status: 400 }
        );
      }

      // Calcular dano da habilidade
      const resultadoHabilidade = calcularDanoHabilidade(
        battle.player,
        battle.ia,
        habilidade,
        { defendendo: battle.ia.defending }
      );

      if (resultadoHabilidade.errou) {
        battle.player.energy -= custoEnergia;
        battle.current_turn = 'ia';

        const battleLog = adicionarLogBatalha(battle.battle_log, {
          acao: 'ability',
          jogador: battle.player.nome,
          alvo: battle.ia.nome,
          habilidade: habilidade.nome,
          errou: true
        });
        battle.battle_log = battleLog;

        return NextResponse.json({
          success: true,
          errou: true,
          dano: 0,
          nomeHabilidade: habilidade.nome,
          newEnergy: battle.player.energy,
          detalhes: resultadoHabilidade.detalhes
        });
      }

      const dano = resultadoHabilidade.dano || 0;
      const cura = resultadoHabilidade.cura || 0;

      // Aplicar dano/cura
      if (dano > 0) {
        battle.ia.hp = Math.max(0, battle.ia.hp - dano);
      }
      if (cura > 0) {
        battle.player.hp = Math.min(battle.player.hp_max, battle.player.hp + cura);
      }

      battle.player.energy -= custoEnergia;

      // Aplicar efeitos de status
      const efeitosResult = aplicarEfeitosHabilidade(habilidade, battle.player, battle.ia);
      battle.player.efeitos = efeitosResult.efeitosAtacante;
      battle.ia.efeitos = efeitosResult.efeitosDefensor;

      // Verificar contra-ataque
      let contraAtaqueAplicado = false;
      if (dano > 0) {
        const contraAtaque = verificarContraAtaque(battle.ia, battle.player, dano);
        if (contraAtaque.contraAtaque) {
          battle.player.efeitos = contraAtaque.efeitosAtacante;
          contraAtaqueAplicado = true;
        }
      }

      // Log
      const battleLog = adicionarLogBatalha(battle.battle_log, {
        acao: 'ability',
        jogador: battle.player.nome,
        alvo: habilidade.tipo === 'Suporte' ? battle.player.nome : battle.ia.nome,
        habilidade: habilidade.nome,
        dano: dano > 0 ? dano : undefined,
        cura: cura > 0 ? cura : undefined,
        critico: resultadoHabilidade.critico,
        bloqueado: resultadoHabilidade.bloqueado,
        contraAtaque: contraAtaqueAplicado,
        efeitos: efeitosResult.efeitosAplicados.length > 0 ? efeitosResult.efeitosAplicados : undefined,
        numGolpes: resultadoHabilidade.numGolpes,
        elemental: resultadoHabilidade.elemental
      });
      battle.battle_log = battleLog;

      // Reset defending
      battle.ia.defending = false;
      battle.current_turn = 'ia';

      // Verificar fim
      if (battle.ia.hp <= 0) {
        battle.status = 'finished';
        battle.winner = 'player';
      }

      return NextResponse.json({
        success: true,
        dano,
        cura,
        critico: resultadoHabilidade.critico,
        bloqueado: resultadoHabilidade.bloqueado,
        elemental: resultadoHabilidade.elemental,
        contraAtaque: contraAtaqueAplicado,
        efeito: efeitosResult.efeitosAplicados.join(', '),
        efeitosAplicados: efeitosResult.efeitosAplicados,
        nomeHabilidade: habilidade.nome,
        numGolpes: resultadoHabilidade.numGolpes,
        newOpponentHp: dano > 0 ? battle.ia.hp : undefined,
        newMyHp: cura > 0 ? battle.player.hp : undefined,
        newEnergy: battle.player.energy,
        finished: battle.ia.hp <= 0,
        winner: battle.ia.hp <= 0 ? 'player' : null,
        detalhes: resultadoHabilidade.detalhes
      });
    }

    // ===== TURNO DA IA =====
    if (action === 'ia_turn') {
      if (battle.current_turn !== 'ia') {
        return NextResponse.json(
          { error: 'Não é o turno da IA!' },
          { status: 400 }
        );
      }

      if (battle.status !== 'active') {
        return NextResponse.json(
          { error: 'Batalha não está ativa' },
          { status: 400 }
        );
      }

      // IA escolhe ação
      const acaoIA = escolherAcaoIA(battle.ia, battle.player, battle.personalidadeIA);

      if (acaoIA.acao === 'attack') {
        // IA ataca
        if (battle.ia.energy < 10) {
          // Sem energia, defender
          battle.ia.energy = Math.min(100, battle.ia.energy + 20);
          battle.ia.defending = true;
          battle.current_turn = 'player';

          const battleLog = adicionarLogBatalha(battle.battle_log, {
            acao: 'defend',
            jogador: battle.ia.nome,
            energiaRecuperada: 20
          });
          battle.battle_log = battleLog;

          return NextResponse.json({
            success: true,
            iaAction: 'defend',
            iaEnergy: battle.ia.energy
          });
        }

        const resultadoAtaque = calcularDanoAtaque(
          battle.ia,
          battle.player,
          { defendendo: battle.player.defending }
        );

        if (resultadoAtaque.errou) {
          battle.ia.energy -= 10;
          battle.ia.defending = false;
          battle.current_turn = 'player';

          const battleLog = adicionarLogBatalha(battle.battle_log, {
            acao: 'attack',
            jogador: battle.ia.nome,
            alvo: battle.player.nome,
            errou: true
          });
          battle.battle_log = battleLog;

          return NextResponse.json({
            success: true,
            iaAction: 'attack',
            errou: true,
            dano: 0,
            newPlayerHp: battle.player.hp,
            iaEnergy: battle.ia.energy
          });
        }

        const dano = resultadoAtaque.dano;
        battle.player.hp = Math.max(0, battle.player.hp - dano);
        battle.ia.energy -= 10;

        // Contra-ataque
        const contraAtaque = verificarContraAtaque(battle.player, battle.ia, dano);
        if (contraAtaque.contraAtaque) {
          battle.ia.efeitos = contraAtaque.efeitosAtacante;
        }

        // Log
        const battleLog = adicionarLogBatalha(battle.battle_log, {
          acao: 'attack',
          jogador: battle.ia.nome,
          alvo: battle.player.nome,
          dano,
          critico: resultadoAtaque.critico,
          bloqueado: resultadoAtaque.bloqueado,
          contraAtaque: contraAtaque.contraAtaque,
          elemental: resultadoAtaque.elemental
        });
        battle.battle_log = battleLog;

        battle.player.defending = false;
        battle.current_turn = 'player';

        // Verificar fim
        if (battle.player.hp <= 0) {
          battle.status = 'finished';
          battle.winner = 'ia';
        }

        return NextResponse.json({
          success: true,
          iaAction: 'attack',
          dano,
          critico: resultadoAtaque.critico,
          bloqueado: resultadoAtaque.bloqueado,
          elemental: resultadoAtaque.elemental,
          contraAtaque: contraAtaque.contraAtaque,
          newPlayerHp: battle.player.hp,
          iaEnergy: battle.ia.energy,
          finished: battle.player.hp <= 0,
          winner: battle.player.hp <= 0 ? 'ia' : null
        });

      } else if (acaoIA.acao === 'defend') {
        // IA defende
        const newEnergy = Math.min(100, battle.ia.energy + 20);
        const energyGained = newEnergy - battle.ia.energy;
        battle.ia.energy = newEnergy;
        battle.ia.defending = true;

        const battleLog = adicionarLogBatalha(battle.battle_log, {
          acao: 'defend',
          jogador: battle.ia.nome,
          energiaRecuperada: energyGained
        });
        battle.battle_log = battleLog;

        battle.current_turn = 'player';

        return NextResponse.json({
          success: true,
          iaAction: 'defend',
          iaEnergy: battle.ia.energy,
          energyGained
        });

      } else if (acaoIA.acao === 'ability') {
        // IA usa habilidade
        const abilityIdx = acaoIA.habilidadeIndex;
        if (!battle.ia.habilidades || !battle.ia.habilidades[abilityIdx]) {
          // Sem habilidade válida, atacar
          battle.current_turn = 'player';
          return NextResponse.json({
            success: true,
            iaAction: 'pass',
            message: 'IA não possui habilidade válida'
          });
        }

        const habilidadeAvatar = battle.ia.habilidades[abilityIdx];
        const habilidade = atualizarBalanceamentoHabilidade(habilidadeAvatar, battle.ia.elemento);
        const custoEnergia = habilidade.custo_energia || 20;

        if (battle.ia.energy < custoEnergia) {
          // Sem energia, defender
          battle.ia.energy = Math.min(100, battle.ia.energy + 20);
          battle.ia.defending = true;
          battle.current_turn = 'player';

          return NextResponse.json({
            success: true,
            iaAction: 'defend',
            iaEnergy: battle.ia.energy
          });
        }

        const resultadoHabilidade = calcularDanoHabilidade(
          battle.ia,
          battle.player,
          habilidade,
          { defendendo: battle.player.defending }
        );

        if (resultadoHabilidade.errou) {
          battle.ia.energy -= custoEnergia;
          battle.current_turn = 'player';

          const battleLog = adicionarLogBatalha(battle.battle_log, {
            acao: 'ability',
            jogador: battle.ia.nome,
            alvo: battle.player.nome,
            habilidade: habilidade.nome,
            errou: true
          });
          battle.battle_log = battleLog;

          return NextResponse.json({
            success: true,
            iaAction: 'ability',
            errou: true,
            nomeHabilidade: habilidade.nome,
            iaEnergy: battle.ia.energy
          });
        }

        const dano = resultadoHabilidade.dano || 0;
        const cura = resultadoHabilidade.cura || 0;

        if (dano > 0) {
          battle.player.hp = Math.max(0, battle.player.hp - dano);
        }
        if (cura > 0) {
          battle.ia.hp = Math.min(battle.ia.hp_max, battle.ia.hp + cura);
        }

        battle.ia.energy -= custoEnergia;

        // Aplicar efeitos
        const efeitosResult = aplicarEfeitosHabilidade(habilidade, battle.ia, battle.player);
        battle.ia.efeitos = efeitosResult.efeitosAtacante;
        battle.player.efeitos = efeitosResult.efeitosDefensor;

        // Contra-ataque
        let contraAtaqueAplicado = false;
        if (dano > 0) {
          const contraAtaque = verificarContraAtaque(battle.player, battle.ia, dano);
          if (contraAtaque.contraAtaque) {
            battle.ia.efeitos = contraAtaque.efeitosAtacante;
            contraAtaqueAplicado = true;
          }
        }

        // Log
        const battleLog = adicionarLogBatalha(battle.battle_log, {
          acao: 'ability',
          jogador: battle.ia.nome,
          alvo: habilidade.tipo === 'Suporte' ? battle.ia.nome : battle.player.nome,
          habilidade: habilidade.nome,
          dano: dano > 0 ? dano : undefined,
          cura: cura > 0 ? cura : undefined,
          critico: resultadoHabilidade.critico,
          bloqueado: resultadoHabilidade.bloqueado,
          contraAtaque: contraAtaqueAplicado,
          efeitos: efeitosResult.efeitosAplicados,
          elemental: resultadoHabilidade.elemental
        });
        battle.battle_log = battleLog;

        battle.player.defending = false;
        battle.current_turn = 'player';

        // Verificar fim
        if (battle.player.hp <= 0) {
          battle.status = 'finished';
          battle.winner = 'ia';
        }

        return NextResponse.json({
          success: true,
          iaAction: 'ability',
          nomeHabilidade: habilidade.nome,
          dano,
          cura,
          critico: resultadoHabilidade.critico,
          elemental: resultadoHabilidade.elemental,
          contraAtaque: contraAtaqueAplicado,
          efeitos: efeitosResult.efeitosAplicados,
          newPlayerHp: dano > 0 ? battle.player.hp : undefined,
          newIaHp: cura > 0 ? battle.ia.hp : undefined,
          iaEnergy: battle.ia.energy,
          finished: battle.player.hp <= 0,
          winner: battle.player.hp <= 0 ? 'ia' : null
        });
      }
    }

    // ===== PROCESSAR EFEITOS =====
    if (action === 'process_effects') {
      const isPlayer = request.json.then(body => body.target === 'player');
      const target = (await isPlayer) ? battle.player : battle.ia;
      const targetHpMax = target.hp_max;

      const resultado = processarEfeitos(target, targetHpMax);

      target.hp = resultado.newHp;
      target.efeitos = resultado.efeitosRestantes;

      // Se paralisado, passar turno
      if (resultado.paralisado) {
        battle.current_turn = (await isPlayer) ? 'ia' : 'player';
      }

      // Verificar morte
      if (resultado.morreu) {
        battle.status = 'finished';
        battle.winner = (await isPlayer) ? 'ia' : 'player';
      }

      return NextResponse.json({
        success: true,
        newHp: resultado.newHp,
        danoTotal: resultado.danoTotal,
        curaTotal: resultado.curaTotal,
        logsEfeitos: resultado.logsEfeitos,
        efeitosRestantes: resultado.efeitosRestantes,
        paralisado: resultado.paralisado,
        finished: resultado.morreu
      });
    }

    // ===== CALCULAR RECOMPENSAS =====
    if (action === 'get_rewards') {
      if (battle.status !== 'finished') {
        return NextResponse.json(
          { error: 'Batalha ainda não terminou' },
          { status: 400 }
        );
      }

      if (battle.rewardsApplied) {
        return NextResponse.json(
          { error: 'Recompensas já foram aplicadas' },
          { status: 400 }
        );
      }

      const vitoria = battle.winner === 'player';
      const recompensas = calcularRecompensasTreino(
        battle.poderOponente,
        battle.dificuldade,
        vitoria
      );

      battle.rewardsApplied = true;

      return NextResponse.json({
        success: true,
        recompensas: {
          ...recompensas,
          vitoria,
          hpOriginal: battle.playerAvatarOriginal.hp_atual || battle.playerAvatarOriginal.hp // HP não muda (é treino)
        }
      });
    }

    // ===== APLICAR PENALIDADES DE ABANDONO =====
    if (action === 'apply_abandonment') {
      if (battle.status === 'finished') {
        return NextResponse.json(
          { error: 'Batalha já terminou normalmente' },
          { status: 400 }
        );
      }

      const penalidades = calcularPenalidadesAbandono(battle.dificuldade);

      battle.status = 'abandoned';
      battle.rewardsApplied = true;

      return NextResponse.json({
        success: true,
        penalidades: {
          ...penalidades,
          hpOriginal: battle.playerAvatarOriginal.hp_atual || battle.playerAvatarOriginal.hp // HP não muda (é treino)
        }
      });
    }

    return NextResponse.json(
      { error: 'Ação inválida' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Erro em POST /api/arena/treino-ia/batalha:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', message: error.message },
      { status: 500 }
    );
  }
}
