import { NextResponse } from 'next/server';
import { getDocuments, updateDocument, getDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pvp/room/join
 * Entra em uma sala usando código
 */
export async function POST(request) {
  try {
    const { visitorId, roomCode } = await request.json();

    if (!visitorId || !roomCode) {
      return NextResponse.json(
        { error: 'visitorId e roomCode são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar sala pelo código
    const rooms = await getDocuments('pvp_duel_rooms', {
      where: [
        ['code', '==', roomCode.toUpperCase()],
        ['status', '==', 'waiting']
      ]
    });

    if (!rooms || rooms.length === 0) {
      return NextResponse.json(
        { error: 'Sala não encontrada ou já está em uso' },
        { status: 404 }
      );
    }

    const room = rooms[0];

    // Verificar se não é o próprio host
    if (room.host_user_id === visitorId) {
      return NextResponse.json(
        { error: 'Você não pode entrar na sua própria sala' },
        { status: 400 }
      );
    }

    // Buscar dados do jogador
    const playerStats = await getDocument('player_stats', visitorId);

    // Atualizar sala com o convidado
    await updateDocument('pvp_duel_rooms', room.id, {
      guest_user_id: visitorId,
      guest_nome: playerStats?.nome_operacao || 'Jogador 2',
      status: 'ready'
    });

    return NextResponse.json({
      success: true,
      roomId: room.id,
      hostNome: room.host_nome
    });

  } catch (error) {
    console.error('Erro em POST /api/pvp/room/join:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
