import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';
import { aplicarBonusHunterRank, calcularRecompensasStreak } from '@/lib/missions/missionProgress';
import { getHunterRank } from '@/lib/hunter/hunterRankSystem';

export const dynamic = 'force-dynamic';

/**
 * POST /api/missoes/coletar
 * Coleta recompensas de missões concluídas
 * Body: { userId, missaoId? } - missaoId opcional (se vazio, coleta todas)
 */
export async function POST(request) {
  try {
    const { userId, missaoId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    // Data atual
    const hoje = new Date().toISOString().split('T')[0];
    const progressoId = `${userId}_${hoje}`;

    // Buscar progresso
    const progressoDiario = await getDocument('daily_missions_progress', progressoId);

    if (!progressoDiario) {
      return NextResponse.json(
        { error: 'Nenhuma missão ativa para hoje' },
        { status: 404 }
      );
    }

    // Buscar player stats
    const playerStats = await getDocument('player_stats', userId);

    if (!playerStats) {
      return NextResponse.json(
        { error: 'Player stats não encontrado' },
        { status: 404 }
      );
    }

    // Determinar Hunter Rank
    const hunterRank = getHunterRank(playerStats.hunterRankXp || 0);

    // Filtrar missões para coletar
    let missoesParaColetar = progressoDiario.missoes.filter(m =>
      m.concluida && !m.coletada
    );

    // Se missaoId especificado, coletar apenas ela
    if (missaoId) {
      missoesParaColetar = missoesParaColetar.filter(m => m.id_unico === missaoId);
    }

    if (missoesParaColetar.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma missão para coletar' },
        { status: 400 }
      );
    }

    // Calcular recompensas totais
    let totalMoedas = 0;
    let totalFragmentos = 0;
    let totalXpCacador = 0;

    const recompensasDetalhadas = missoesParaColetar.map(missao => {
      const recompensasBase = missao.recompensas;
      const recompensasComBonus = aplicarBonusHunterRank(recompensasBase, hunterRank.nome);

      totalMoedas += recompensasComBonus.moedas;
      totalFragmentos += recompensasComBonus.fragmentos;
      totalXpCacador += recompensasComBonus.xpCacador;

      return {
        missao: missao.nome,
        recompensas: recompensasComBonus
      };
    });

    // Marcar missões como coletadas
    const missoesAtualizadas = progressoDiario.missoes.map(m => {
      if (missoesParaColetar.some(mc => mc.id_unico === m.id_unico)) {
        return { ...m, coletada: true };
      }
      return m;
    });

    // Verificar se TODAS as missões foram concluídas E coletadas
    const todasColetadas = missoesAtualizadas.every(m => m.coletada);

    // Atualizar streak se todas foram coletadas
    let novoStreak = playerStats.streak_missoes || 0;
    let recompensaStreak = null;

    if (todasColetadas && !progressoDiario.streak_aplicado) {
      // Verificar se completou ontem também
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      const dataOntem = ontem.toISOString().split('T')[0];

      if (playerStats.ultimo_dia_missoes === dataOntem) {
        // Incrementar streak
        novoStreak = (playerStats.streak_missoes || 0) + 1;
      } else {
        // Começar novo streak
        novoStreak = 1;
      }

      // Calcular recompensa de streak
      recompensaStreak = calcularRecompensasStreak(novoStreak);

      if (recompensaStreak) {
        totalMoedas += recompensaStreak.moedas || 0;
        totalFragmentos += recompensaStreak.fragmentos || 0;
      }

      // Atualizar player stats com streak
      await updateDocument('player_stats', userId, {
        streak_missoes: novoStreak,
        ultimo_dia_missoes: hoje,
        total_missoes_completas: (playerStats.total_missoes_completas || 0) + missoesParaColetar.length,
        moedas: (playerStats.moedas || 0) + totalMoedas,
        fragmentos: (playerStats.fragmentos || 0) + totalFragmentos,
        hunterRankXp: (playerStats.hunterRankXp || 0) + totalXpCacador
      });

      // Marcar streak como aplicado no progresso diário
      await updateDocument('daily_missions_progress', progressoId, {
        missoes: missoesAtualizadas,
        streak_aplicado: true,
        updated_at: new Date().toISOString()
      });
    } else {
      // Apenas atualizar missões coletadas (não aplica streak)
      await updateDocument('player_stats', userId, {
        moedas: (playerStats.moedas || 0) + totalMoedas,
        fragmentos: (playerStats.fragmentos || 0) + totalFragmentos,
        hunterRankXp: (playerStats.hunterRankXp || 0) + totalXpCacador,
        total_missoes_completas: (playerStats.total_missoes_completas || 0) + missoesParaColetar.length
      });

      await updateDocument('daily_missions_progress', progressoId, {
        missoes: missoesAtualizadas,
        updated_at: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      recompensas: {
        moedas: totalMoedas,
        fragmentos: totalFragmentos,
        xpCacador: totalXpCacador
      },
      bonus_hunter_rank: {
        rank: hunterRank.nome,
        percentual: Math.floor((aplicarBonusHunterRank({ moedas: 100, fragmentos: 10, xpCacador: 10 }, hunterRank.nome).moedas / 100 - 1) * 100)
      },
      streak: todasColetadas ? {
        dias_consecutivos: novoStreak,
        recompensa_extra: recompensaStreak
      } : null,
      missoes_coletadas: recompensasDetalhadas.length,
      detalhes: recompensasDetalhadas
    });

  } catch (error) {
    console.error('Erro em POST /api/missoes/coletar:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
