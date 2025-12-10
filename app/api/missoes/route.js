import { NextResponse } from 'next/server';
import { getDocument, createDocument, updateDocument } from '@/lib/firebase/firestore';
import { gerarMissoesDiarias } from '@/lib/missions/missionDefinitions';
import { verificarMissaoConcluida, getMeta } from '@/lib/missions/missionProgress';

export const dynamic = 'force-dynamic';

/**
 * GET /api/missoes
 * Busca missões diárias do jogador
 */
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    // Data atual (formato: YYYY-MM-DD)
    const hoje = new Date().toISOString().split('T')[0];
    const progressoId = `${userId}_${hoje}`;

    // Buscar progresso existente
    let progressoDiario = await getDocument('daily_missions_progress', progressoId);

    // Se não existe, criar novo progresso para hoje
    if (!progressoDiario) {
      const missoesHoje = gerarMissoesDiarias(hoje);

      progressoDiario = {
        user_id: userId,
        data: hoje,
        missoes: missoesHoje.map(missao => ({
          ...missao,
          progresso: 0,
          meta: getMeta(missao),
          concluida: false,
          coletada: false
        })),
        todas_concluidas: false,
        created_at: new Date().toISOString()
      };

      await createDocument('daily_missions_progress', progressoDiario, progressoId);
    }

    // Buscar player stats para calcular streak
    const playerStats = await getDocument('player_stats', userId);
    const streakAtual = playerStats?.streak_missoes || 0;
    const ultimoDia = playerStats?.ultimo_dia_missoes || null;

    // Verificar se o streak foi quebrado (não completou ontem)
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    const dataOntem = ontem.toISOString().split('T')[0];

    let streakValido = streakAtual;
    if (ultimoDia && ultimoDia !== hoje && ultimoDia !== dataOntem) {
      // Quebrou o streak
      streakValido = 0;
    }

    // Calcular próximo marco de streak
    let proximoMarco = 3;
    if (streakValido >= 3) proximoMarco = 7;
    if (streakValido >= 7) proximoMarco = 14;
    if (streakValido >= 14) proximoMarco = 30;
    if (streakValido >= 30) proximoMarco = null; // Máximo atingido

    return NextResponse.json({
      missoes: progressoDiario.missoes,
      todas_concluidas: progressoDiario.todas_concluidas,
      streak: {
        atual: streakValido,
        proximo_marco: proximoMarco,
        progresso: proximoMarco ? streakValido : 30
      },
      data: hoje
    });

  } catch (error) {
    console.error('Erro em GET /api/missoes:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
