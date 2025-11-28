import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';
import { calcularLimitesAposta } from '@/lib/pvp/pvpRewardsSystem';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pvp/room/set-bet
 * Define a aposta de um jogador para a batalha
 */
export async function POST(request) {
  try {
    const { roomId, userId, betAmount } = await request.json();

    if (!roomId || !userId || betAmount === undefined) {
      return NextResponse.json(
        { error: 'roomId, userId e betAmount são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar sala
    const room = await getDocument('pvp_duel_rooms', roomId);

    if (!room) {
      return NextResponse.json(
        { error: 'Sala não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se o usuário é participante da sala
    const isHost = room.host_user_id === userId;
    const isGuest = room.guest_user_id === userId;

    if (!isHost && !isGuest) {
      return NextResponse.json(
        { error: 'Você não é participante desta sala' },
        { status: 403 }
      );
    }

    // Buscar dados do jogador para validar aposta
    const playerStats = await getDocument('player_stats', userId);

    if (!playerStats) {
      return NextResponse.json(
        { error: 'Dados do jogador não encontrados' },
        { status: 404 }
      );
    }

    // Calcular limites de aposta
    const limites = calcularLimitesAposta(
      playerStats.nivel || 1,
      playerStats.moedas || 0
    );

    // Validar valor da aposta
    if (betAmount < limites.minimo) {
      return NextResponse.json(
        { error: `Aposta mínima é ${limites.minimo} moedas` },
        { status: 400 }
      );
    }

    if (betAmount > limites.maximo) {
      return NextResponse.json(
        { error: `Aposta máxima é ${limites.maximo} moedas (você tem ${playerStats.moedas || 0} moedas)` },
        { status: 400 }
      );
    }

    // Atualizar aposta na sala
    const updateData = isHost
      ? { host_bet: betAmount }
      : { guest_bet: betAmount };

    await updateDocument('pvp_duel_rooms', roomId, updateData);

    return NextResponse.json({
      success: true,
      bet: betAmount,
      limites
    });

  } catch (error) {
    console.error('Erro em POST /api/pvp/room/set-bet:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
