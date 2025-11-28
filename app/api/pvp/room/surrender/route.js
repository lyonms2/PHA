import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pvp/room/surrender
 * Jogador se rende na batalha PVP
 */
export async function POST(request) {
  try {
    const { roomId, userId } = await request.json();

    if (!roomId || !userId) {
      return NextResponse.json(
        { error: 'roomId e userId são obrigatórios' },
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

    if (room.status !== 'active') {
      return NextResponse.json(
        { error: 'A batalha não está ativa' },
        { status: 400 }
      );
    }

    if (room.status === 'finished') {
      return NextResponse.json(
        { error: 'Batalha já foi finalizada' },
        { status: 400 }
      );
    }

    // Determinar quem se rendeu
    const isHost = room.host_user_id === userId;
    const isGuest = room.guest_user_id === userId;

    if (!isHost && !isGuest) {
      return NextResponse.json(
        { error: 'Você não é participante desta sala' },
        { status: 403 }
      );
    }

    // Quem se rendeu perde, o outro vence
    const winner = isHost ? 'guest' : 'host';

    // Marcar sala como finalizada por rendição
    await updateDocument('pvp_duel_rooms', roomId, {
      status: 'finished',
      winner,
      rendeu: true,
      finished_at: new Date().toISOString(),
      finish_reason: 'surrender'
    });

    return NextResponse.json({
      success: true,
      winner,
      rendeu: true,
      message: 'Você se rendeu. Penalidades reduzidas aplicadas (50% das penalidades normais)'
    });

  } catch (error) {
    console.error('Erro em POST /api/pvp/room/surrender:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
