import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/room/state?roomId=xxx&visitorId=xxx
 * Busca estado da sala
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const visitorId = searchParams.get('visitorId');

    if (!roomId || !visitorId) {
      return NextResponse.json(
        { error: 'roomId e visitorId são obrigatórios' },
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

    // Determinar se é host ou guest
    const isHost = room.host_user_id === visitorId;
    const isGuest = room.guest_user_id === visitorId;

    if (!isHost && !isGuest) {
      return NextResponse.json(
        { error: 'Você não está nesta sala' },
        { status: 403 }
      );
    }

    const role = isHost ? 'host' : 'guest';
    const isYourTurn = room.current_turn === role;

    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        code: room.code,
        status: room.status,
        hostNome: room.host_nome,
        guestNome: room.guest_nome,
        hostReady: room.host_ready,
        guestReady: room.guest_ready,
        hostHp: room.host_hp,
        guestHp: room.guest_hp,
        currentTurn: room.current_turn,
        winner: room.winner
      },
      role,
      isYourTurn,
      myHp: isHost ? room.host_hp : room.guest_hp,
      myHpMax: isHost ? (room.host_hp_max ?? 100) : (room.guest_hp_max ?? 100),
      myExaustao: isHost ? (room.host_exaustao ?? 0) : (room.guest_exaustao ?? 0),
      opponentHp: isHost ? room.guest_hp : room.host_hp,
      opponentHpMax: isHost ? (room.guest_hp_max ?? 100) : (room.host_hp_max ?? 100),
      opponentExaustao: isHost ? (room.guest_exaustao ?? 0) : (room.host_exaustao ?? 0),
      myEnergy: isHost ? (room.host_energy ?? 100) : (room.guest_energy ?? 100),
      opponentEnergy: isHost ? (room.guest_energy ?? 100) : (room.host_energy ?? 100),
      opponentNome: isHost ? room.guest_nome : room.host_nome,
      opponentAvatar: isHost ? room.guest_avatar : room.host_avatar
    });

  } catch (error) {
    console.error('Erro em GET /api/pvp/room/state:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pvp/room/state
 * Atualiza estado (ready, attack)
 */
export async function POST(request) {
  try {
    const { roomId, visitorId, action } = await request.json();

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

    // Ação: marcar como pronto
    if (action === 'ready') {
      const field = isHost ? 'host_ready' : 'guest_ready';
      await updateDocument('pvp_duel_rooms', roomId, {
        [field]: true
      });

      // Verificar se ambos estão prontos
      const updatedRoom = await getDocument('pvp_duel_rooms', roomId);
      if (updatedRoom.host_ready && updatedRoom.guest_ready) {
        await updateDocument('pvp_duel_rooms', roomId, {
          status: 'active',
          current_turn: 'host' // Host começa
        });
      }

      return NextResponse.json({ success: true, message: 'Pronto!' });
    }

    // Ação: atacar
    if (action === 'attack') {
      // Verificar se é seu turno
      if (room.current_turn !== role) {
        return NextResponse.json(
          { error: 'Não é seu turno!' },
          { status: 400 }
        );
      }

      // Verificar se sala está ativa
      if (room.status !== 'active') {
        return NextResponse.json(
          { error: 'Batalha não está ativa' },
          { status: 400 }
        );
      }

      // Verificar energia
      const myEnergyField = isHost ? 'host_energy' : 'guest_energy';
      const currentEnergy = room[myEnergyField] ?? 100;
      if (currentEnergy < 1) {
        return NextResponse.json(
          { error: 'Sem energia para atacar!' },
          { status: 400 }
        );
      }

      // Calcular dano (simples: 10-20)
      const dano = Math.floor(Math.random() * 11) + 10;

      // Atualizar HP do oponente e energia do atacante
      const opponentHpField = isHost ? 'guest_hp' : 'host_hp';
      const newOpponentHp = Math.max(0, (isHost ? room.guest_hp : room.host_hp) - dano);
      const newEnergy = currentEnergy - 1;

      const updates = {
        [opponentHpField]: newOpponentHp,
        [myEnergyField]: newEnergy,
        current_turn: isHost ? 'guest' : 'host' // Passa o turno
      };

      // Verificar se acabou
      if (newOpponentHp <= 0) {
        updates.status = 'finished';
        updates.winner = role;
      }

      await updateDocument('pvp_duel_rooms', roomId, updates);

      return NextResponse.json({
        success: true,
        dano,
        newOpponentHp,
        newEnergy,
        finished: newOpponentHp <= 0,
        winner: newOpponentHp <= 0 ? role : null
      });
    }

    return NextResponse.json(
      { error: 'Ação inválida' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Erro em POST /api/pvp/room/state:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
