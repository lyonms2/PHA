import { NextResponse } from 'next/server';
import { createDocument, getDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pvp/room/create
 * Cria uma sala de duelo com código de convite
 */
export async function POST(request) {
  try {
    const { userId, visitorId } = await request.json();

    if (!userId || !visitorId) {
      return NextResponse.json(
        { error: 'userId e visitorId são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar dados do jogador
    const playerStats = await getDocument('player_stats', visitorId);
    const avatares = await getDocument('avatares', visitorId);

    // Gerar código de 6 caracteres
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Criar sala
    const roomId = await createDocument('pvp_duel_rooms', {
      code: roomCode,
      host_user_id: visitorId,
      host_nome: playerStats?.nome_operacao || 'Jogador 1',
      guest_user_id: null,
      guest_nome: null,
      status: 'waiting', // waiting, ready, active, finished
      host_ready: false,
      guest_ready: false,
      host_hp: 100,
      guest_hp: 100,
      current_turn: 'host', // host ou guest
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutos
    });

    return NextResponse.json({
      success: true,
      roomId,
      roomCode
    });

  } catch (error) {
    console.error('Erro em POST /api/pvp/room/create:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
