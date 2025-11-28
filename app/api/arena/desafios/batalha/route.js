// ==================== API: BATALHA CONTRA BOSS ====================
// Arquivo: /app/api/arena/desafios/batalha/route.js
//
// API de batalha contra bosses usando mecânicas PVP

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
import { processarMecanicasEspeciaisBoss } from '@/lib/arena/bossSystem';

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
  return logsAtualizados.slice(-30); // Bosses têm logs mais longos
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
        bossNome: battle.boss.nome,
        playerHp: battle.player.hp,
        playerHpMax: battle.player.hp_max,
        playerEnergy: battle.player.energy,
        playerExaustao: battle.player.exaustao || 0,
        playerEffects: battle.player.efeitos || [],
        bossHp: battle.boss.hp,
        bossHpMax: battle.boss.hp_max,
        bossEnergy: battle.boss.energy,
        bossEffects: battle.boss.efeitos || [],
        bossAvatar: battle.boss,
        playerDefending: battle.player.defending || false,
        bossDefending: battle.boss.defending || false,
        battleLog: battle.battle_log || [],
        turnosDecorridos: battle.turnos || 0,
        mecanicasAtivas: battle.mecanicas_ativas || []
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
 * POST - Inicializa ou atualiza batalha
 */
export async function POST(request) {
  try {
    const { battleId, action, playerAvatar, bossAvatar, abilityIndex } = await request.json();

    // ===== INICIAR NOVA BATALHA =====
    if (action === 'init') {
      if (!playerAvatar || !bossAvatar) {
        return NextResponse.json(
          { error: 'Dados incompletos para iniciar batalha' },
          { status: 400 }
        );
      }

      const newBattleId = `boss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Calcular HP máximo
      const calcularHP = (avatar) => {
        const resistencia = avatar.resistencia || 10;
        return 50 + (resistencia * 5);
      };

      const playerHpMax = calcularHP(playerAvatar);
      // Boss já vem com HP calculado
      const bossHpMax = bossAvatar.hp_maximo || bossAvatar.hp_max || 200;

      const newBattle = {
        id: newBattleId,
        status: 'active',
        current_turn: 'player', // Jogador começa
        winner: null,
        turnos: 0,
        mecanicas_ativas: [],
        player: {
          ...playerAvatar,
          hp: playerHpMax,
          hp_max: playerHpMax,
          energy: 100,
          efeitos: [],
          defending: false
        },
        boss: {
          ...bossAvatar,
          hp: bossAvatar.hp_atual || bossHpMax,
          hp_max: bossHpMax,
          energy: 100,
          efeitos: [],
          defending: false
        },
        battle_log: []
      };

      battleSessions.set(newBattleId, newBattle);

      console.log('👹 Nova batalha de boss iniciada:', {
        battleId: newBattleId,
        jogador: playerAvatar.nome,
        boss: bossAvatar.nome,
        dificuldade: bossAvatar.dificuldade,
        hpBoss: bossHpMax
      });

      return NextResponse.json({
        success: true,
        battleId: newBattleId,
        message: 'Batalha contra boss iniciada!'
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
        battle.boss,
        { defendendo: battle.boss.defending }
      );

      if (resultadoAtaque.errou) {
        battle.player.energy -= 10;
        battle.player.defending = false;
        battle.turnos++;
        battle.current_turn = 'boss';

        const battleLog = adicionarLogBatalha(battle.battle_log, {
          acao: 'attack',
          jogador: battle.player.nome,
          alvo: battle.boss.nome,
          errou: true,
          esquivou: resultadoAtaque.esquivou,
          invisivel: resultadoAtaque.invisivel,
          turno: battle.turnos
        });
        battle.battle_log = battleLog;

        return NextResponse.json({
          success: true,
          errou: true,
          esquivou: resultadoAtaque.esquivou,
          invisivel: resultadoAtaque.invisivel,
          dano: 0,
          newOpponentHp: battle.boss.hp,
          newEnergy: battle.player.energy,
          detalhes: resultadoAtaque.detalhes
        });
      }

      const dano = resultadoAtaque.dano;
      battle.boss.hp = Math.max(0, battle.boss.hp - dano);
      battle.player.energy -= 10;

      // Verificar contra-ataque
      const contraAtaque = verificarContraAtaque(battle.boss, battle.player, dano);
      if (contraAtaque.contraAtaque) {
        battle.player.efeitos = contraAtaque.efeitosAtacante;
      }

      // Log
      battle.turnos++;
      const battleLog = adicionarLogBatalha(battle.battle_log, {
        acao: 'attack',
        jogador: battle.player.nome,
        alvo: battle.boss.nome,
        dano,
        critico: resultadoAtaque.critico,
        bloqueado: resultadoAtaque.bloqueado,
        contraAtaque: contraAtaque.contraAtaque,
        elemental: resultadoAtaque.elemental,
        turno: battle.turnos
      });
      battle.battle_log = battleLog;

      // Reset defending
      battle.boss.defending = false;
      battle.current_turn = 'boss';

      // Verificar fim
      if (battle.boss.hp <= 0) {
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
        newOpponentHp: battle.boss.hp,
        newEnergy: battle.player.energy,
        finished: battle.boss.hp <= 0,
        winner: battle.boss.hp <= 0 ? 'player' : null,
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
      battle.turnos++;
      const battleLog = adicionarLogBatalha(battle.battle_log, {
        acao: 'defend',
        jogador: battle.player.nome,
        energiaRecuperada: energyGained,
        turno: battle.turnos
      });
      battle.battle_log = battleLog;

      battle.current_turn = 'boss';

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
        battle.boss,
        habilidade,
        { defendendo: battle.boss.defending }
      );

      if (resultadoHabilidade.errou) {
        battle.player.energy -= custoEnergia;
        battle.turnos++;
        battle.current_turn = 'boss';

        const battleLog = adicionarLogBatalha(battle.battle_log, {
          acao: 'ability',
          jogador: battle.player.nome,
          alvo: battle.boss.nome,
          habilidade: habilidade.nome,
          errou: true,
          turno: battle.turnos
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
        battle.boss.hp = Math.max(0, battle.boss.hp - dano);
      }
      if (cura > 0) {
        battle.player.hp = Math.min(battle.player.hp_max, battle.player.hp + cura);
      }

      battle.player.energy -= custoEnergia;

      // Aplicar efeitos de status
      const efeitosResult = aplicarEfeitosHabilidade(habilidade, battle.player, battle.boss);
      battle.player.efeitos = efeitosResult.efeitosAtacante;
      battle.boss.efeitos = efeitosResult.efeitosDefensor;

      // Verificar contra-ataque
      let contraAtaqueAplicado = false;
      if (dano > 0) {
        const contraAtaque = verificarContraAtaque(battle.boss, battle.player, dano);
        if (contraAtaque.contraAtaque) {
          battle.player.efeitos = contraAtaque.efeitosAtacante;
          contraAtaqueAplicado = true;
        }
      }

      // Log
      battle.turnos++;
      const battleLog = adicionarLogBatalha(battle.battle_log, {
        acao: 'ability',
        jogador: battle.player.nome,
        alvo: habilidade.tipo === 'Suporte' ? battle.player.nome : battle.boss.nome,
        habilidade: habilidade.nome,
        dano: dano > 0 ? dano : undefined,
        cura: cura > 0 ? cura : undefined,
        critico: resultadoHabilidade.critico,
        bloqueado: resultadoHabilidade.bloqueado,
        contraAtaque: contraAtaqueAplicado,
        efeitos: efeitosResult.efeitosAplicados.length > 0 ? efeitosResult.efeitosAplicados : undefined,
        numGolpes: resultadoHabilidade.numGolpes,
        elemental: resultadoHabilidade.elemental,
        turno: battle.turnos
      });
      battle.battle_log = battleLog;

      // Reset defending
      battle.boss.defending = false;
      battle.current_turn = 'boss';

      // Verificar fim
      if (battle.boss.hp <= 0) {
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
        newOpponentHp: dano > 0 ? battle.boss.hp : undefined,
        newMyHp: cura > 0 ? battle.player.hp : undefined,
        newEnergy: battle.player.energy,
        finished: battle.boss.hp <= 0,
        winner: battle.boss.hp <= 0 ? 'player' : null,
        detalhes: resultadoHabilidade.detalhes
      });
    }

    // ===== TURNO DO BOSS =====
    if (action === 'boss_turn') {
      if (battle.current_turn !== 'boss') {
        return NextResponse.json(
          { error: 'Não é o turno do boss!' },
          { status: 400 }
        );
      }

      if (battle.status !== 'active') {
        return NextResponse.json(
          { error: 'Batalha não está ativa' },
          { status: 400 }
        );
      }

      // Processar mecânicas especiais do boss
      // (Rage mode, invocação de adds, shields, etc.)
      const mecanicasResult = processarMecanicasEspeciaisBoss(battle.boss, battle.player, battle.turnos);
      if (mecanicasResult.ativou) {
        battle.mecanicas_ativas.push(mecanicasResult);
        battle.battle_log = adicionarLogBatalha(battle.battle_log, {
          acao: 'mecanica_especial',
          jogador: battle.boss.nome,
          descricao: mecanicasResult.descricao,
          turno: battle.turnos
        });

        // Aplicar efeitos das mecânicas
        if (mecanicasResult.efeitos) {
          battle.boss.efeitos = [...(battle.boss.efeitos || []), ...mecanicasResult.efeitos];
        }
        if (mecanicasResult.efeitosPlayer) {
          battle.player.efeitos = [...(battle.player.efeitos || []), ...mecanicasResult.efeitosPlayer];
        }
      }

      // Boss escolhe ação (usando IA agressiva)
      const personalidadeBoss = { tipo: 'aggressive', chance_ability: 0.4 };
      const acaoBoss = escolherAcaoIA(battle.boss, battle.player, personalidadeBoss);

      if (acaoBoss.acao === 'attack') {
        // Boss ataca
        if (battle.boss.energy < 10) {
          // Sem energia, defender
          battle.boss.energy = Math.min(100, battle.boss.energy + 20);
          battle.boss.defending = true;
          battle.current_turn = 'player';

          const battleLog = adicionarLogBatalha(battle.battle_log, {
            acao: 'defend',
            jogador: battle.boss.nome,
            energiaRecuperada: 20,
            turno: battle.turnos
          });
          battle.battle_log = battleLog;

          return NextResponse.json({
            success: true,
            bossAction: 'defend',
            bossEnergy: battle.boss.energy
          });
        }

        const resultadoAtaque = calcularDanoAtaque(
          battle.boss,
          battle.player,
          { defendendo: battle.player.defending }
        );

        if (resultadoAtaque.errou) {
          battle.boss.energy -= 10;
          battle.boss.defending = false;
          battle.current_turn = 'player';

          const battleLog = adicionarLogBatalha(battle.battle_log, {
            acao: 'attack',
            jogador: battle.boss.nome,
            alvo: battle.player.nome,
            errou: true,
            turno: battle.turnos
          });
          battle.battle_log = battleLog;

          return NextResponse.json({
            success: true,
            bossAction: 'attack',
            errou: true,
            dano: 0,
            newPlayerHp: battle.player.hp,
            bossEnergy: battle.boss.energy
          });
        }

        const dano = resultadoAtaque.dano;
        battle.player.hp = Math.max(0, battle.player.hp - dano);
        battle.boss.energy -= 10;

        // Contra-ataque
        const contraAtaque = verificarContraAtaque(battle.player, battle.boss, dano);
        if (contraAtaque.contraAtaque) {
          battle.boss.efeitos = contraAtaque.efeitosAtacante;
        }

        // Log
        const battleLog = adicionarLogBatalha(battle.battle_log, {
          acao: 'attack',
          jogador: battle.boss.nome,
          alvo: battle.player.nome,
          dano,
          critico: resultadoAtaque.critico,
          bloqueado: resultadoAtaque.bloqueado,
          contraAtaque: contraAtaque.contraAtaque,
          elemental: resultadoAtaque.elemental,
          turno: battle.turnos
        });
        battle.battle_log = battleLog;

        battle.player.defending = false;
        battle.current_turn = 'player';

        // Verificar fim
        if (battle.player.hp <= 0) {
          battle.status = 'finished';
          battle.winner = 'boss';
        }

        return NextResponse.json({
          success: true,
          bossAction: 'attack',
          dano,
          critico: resultadoAtaque.critico,
          bloqueado: resultadoAtaque.bloqueado,
          elemental: resultadoAtaque.elemental,
          contraAtaque: contraAtaque.contraAtaque,
          newPlayerHp: battle.player.hp,
          bossEnergy: battle.boss.energy,
          finished: battle.player.hp <= 0,
          winner: battle.player.hp <= 0 ? 'boss' : null
        });

      } else if (acaoBoss.acao === 'defend') {
        // Boss defende
        const newEnergy = Math.min(100, battle.boss.energy + 20);
        const energyGained = newEnergy - battle.boss.energy;
        battle.boss.energy = newEnergy;
        battle.boss.defending = true;

        const battleLog = adicionarLogBatalha(battle.battle_log, {
          acao: 'defend',
          jogador: battle.boss.nome,
          energiaRecuperada: energyGained,
          turno: battle.turnos
        });
        battle.battle_log = battleLog;

        battle.current_turn = 'player';

        return NextResponse.json({
          success: true,
          bossAction: 'defend',
          bossEnergy: battle.boss.energy,
          energyGained
        });

      } else if (acaoBoss.acao === 'ability') {
        // Boss usa habilidade
        const abilityIdx = acaoBoss.habilidadeIndex;
        if (!battle.boss.habilidades || !battle.boss.habilidades[abilityIdx]) {
          battle.current_turn = 'player';
          return NextResponse.json({
            success: true,
            bossAction: 'pass'
          });
        }

        const habilidadeAvatar = battle.boss.habilidades[abilityIdx];
        const habilidade = atualizarBalanceamentoHabilidade(habilidadeAvatar, battle.boss.elemento);
        const custoEnergia = habilidade.custo_energia || 20;

        if (battle.boss.energy < custoEnergia) {
          battle.boss.energy = Math.min(100, battle.boss.energy + 20);
          battle.boss.defending = true;
          battle.current_turn = 'player';

          return NextResponse.json({
            success: true,
            bossAction: 'defend',
            bossEnergy: battle.boss.energy
          });
        }

        const resultadoHabilidade = calcularDanoHabilidade(
          battle.boss,
          battle.player,
          habilidade,
          { defendendo: battle.player.defending }
        );

        if (resultadoHabilidade.errou) {
          battle.boss.energy -= custoEnergia;
          battle.current_turn = 'player';

          const battleLog = adicionarLogBatalha(battle.battle_log, {
            acao: 'ability',
            jogador: battle.boss.nome,
            alvo: battle.player.nome,
            habilidade: habilidade.nome,
            errou: true,
            turno: battle.turnos
          });
          battle.battle_log = battleLog;

          return NextResponse.json({
            success: true,
            bossAction: 'ability',
            errou: true,
            nomeHabilidade: habilidade.nome,
            bossEnergy: battle.boss.energy
          });
        }

        const dano = resultadoHabilidade.dano || 0;
        const cura = resultadoHabilidade.cura || 0;

        if (dano > 0) {
          battle.player.hp = Math.max(0, battle.player.hp - dano);
        }
        if (cura > 0) {
          battle.boss.hp = Math.min(battle.boss.hp_max, battle.boss.hp + cura);
        }

        battle.boss.energy -= custoEnergia;

        // Aplicar efeitos
        const efeitosResult = aplicarEfeitosHabilidade(habilidade, battle.boss, battle.player);
        battle.boss.efeitos = efeitosResult.efeitosAtacante;
        battle.player.efeitos = efeitosResult.efeitosDefensor;

        // Contra-ataque
        let contraAtaqueAplicado = false;
        if (dano > 0) {
          const contraAtaque = verificarContraAtaque(battle.player, battle.boss, dano);
          if (contraAtaque.contraAtaque) {
            battle.boss.efeitos = contraAtaque.efeitosAtacante;
            contraAtaqueAplicado = true;
          }
        }

        // Log
        const battleLog = adicionarLogBatalha(battle.battle_log, {
          acao: 'ability',
          jogador: battle.boss.nome,
          alvo: habilidade.tipo === 'Suporte' ? battle.boss.nome : battle.player.nome,
          habilidade: habilidade.nome,
          dano: dano > 0 ? dano : undefined,
          cura: cura > 0 ? cura : undefined,
          critico: resultadoHabilidade.critico,
          bloqueado: resultadoHabilidade.bloqueado,
          contraAtaque: contraAtaqueAplicado,
          efeitos: efeitosResult.efeitosAplicados,
          elemental: resultadoHabilidade.elemental,
          turno: battle.turnos
        });
        battle.battle_log = battleLog;

        battle.player.defending = false;
        battle.current_turn = 'player';

        // Verificar fim
        if (battle.player.hp <= 0) {
          battle.status = 'finished';
          battle.winner = 'boss';
        }

        return NextResponse.json({
          success: true,
          bossAction: 'ability',
          nomeHabilidade: habilidade.nome,
          dano,
          cura,
          critico: resultadoHabilidade.critico,
          elemental: resultadoHabilidade.elemental,
          contraAtaque: contraAtaqueAplicado,
          efeitos: efeitosResult.efeitosAplicados,
          newPlayerHp: dano > 0 ? battle.player.hp : undefined,
          newBossHp: cura > 0 ? battle.boss.hp : undefined,
          bossEnergy: battle.boss.energy,
          finished: battle.player.hp <= 0,
          winner: battle.player.hp <= 0 ? 'boss' : null
        });
      }
    }

    // ===== PROCESSAR EFEITOS =====
    if (action === 'process_effects') {
      const bodyData = await request.json();
      const target = bodyData.target === 'player' ? battle.player : battle.boss;
      const targetHpMax = target.hp_max;

      const resultado = processarEfeitos(target, targetHpMax);

      target.hp = resultado.newHp;
      target.efeitos = resultado.efeitosRestantes;

      // Se paralisado, passar turno
      if (resultado.paralisado) {
        battle.current_turn = bodyData.target === 'player' ? 'boss' : 'player';
      }

      // Verificar morte
      if (resultado.morreu) {
        battle.status = 'finished';
        battle.winner = bodyData.target === 'player' ? 'boss' : 'player';
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

    return NextResponse.json(
      { error: 'Ação inválida' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Erro em POST /api/arena/desafios/batalha:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', message: error.message },
      { status: 500 }
    );
  }
}
