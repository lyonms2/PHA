import { NextResponse } from 'next/server';
import { getDocument } from '@/lib/firebase/firestore';
import {
  handleGetState,
  handleReady,
  handleAttack,
  handleDefend,
  handleAbility,
  handleSurrender,
  handleProcessEffects
} from './handlers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/room/state?roomId=xxx&visitorId=xxx
 * Busca estado da sala
 */
export async function GET(request) {
  return handleGetState(request);
}

/**
 * POST /api/pvp/room/state
 * Atualiza estado (ready, attack, defend, ability, surrender, process_effects)
 */
export async function POST(request) {
  try {
    const { roomId, visitorId, action, abilityIndex } = await request.json();

    if (!roomId || !visitorId || !action) {
      return NextResponse.json(
        { error: 'roomId, visitorId e action são obrigatórios' },
        { status: 400 }
      );
    }

    const room = await getDocument('pvp_duel_rooms', roomId);

    if (!room) {
      return NextResponse.json(
        { error: 'Sala não encontrada' },
        { status: 404 }
      );
    }

    const isHost = room.host_user_id === visitorId;
    const isGuest = room.guest_user_id === visitorId;

    if (!isHost && !isGuest) {
      return NextResponse.json(
        { error: 'Você não está nesta sala' },
        { status: 403 }
      );
    }

    const role = isHost ? 'host' : 'guest';

    // Rotear para o handler apropriado baseado na ação
    switch (action) {
      case 'ready':
        return handleReady({ roomId, isHost });

      case 'attack':
        return handleAttack({ room, role, isHost });

      case 'defend':
        return handleDefend({ room, role, isHost });

      case 'ability':
        return handleAbility({ room, role, isHost, abilityIndex });

      case 'surrender':
        return handleSurrender({ room, isHost });

      case 'process_effects':
        return handleProcessEffects({ room, isHost });

      default:
        return NextResponse.json(
          { error: 'Ação inválida' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Erro em POST /api/pvp/room/state:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
