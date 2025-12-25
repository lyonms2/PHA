import { NextResponse } from 'next/server';
import { getDocument } from '@/lib/firebase/firestore';

/**
 * GET /api/pvp/room/state?roomId=xxx&visitorId=xxx
 * Busca estado atual da sala de PvP
 *
 * Retorna informações da sala e dados específicos do jogador
 * (HP, energia, efeitos, etc.)
 */
export async function handleGetState(request) {
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
      myEnergyMax: isHost ? (room.host_energy_max || 100) : (room.guest_energy_max || 100),
      opponentEnergy: isHost ? (room.guest_energy ?? 100) : (room.host_energy ?? 100),
      opponentEnergyMax: isHost ? (room.guest_energy_max || 100) : (room.host_energy_max || 100),
      opponentNome: isHost ? room.guest_nome : room.host_nome,
      opponentAvatar: isHost ? room.guest_avatar : room.host_avatar,
      opponentAvatarSuporte: isHost ? room.guest_avatar_suporte : room.host_avatar_suporte,
      opponentSinergia: isHost ? room.guest_sinergia : room.host_sinergia,
      myEffects: isHost ? (room.host_effects || []) : (room.guest_effects || []),
      opponentEffects: isHost ? (room.guest_effects || []) : (room.host_effects || []),
      myCooldowns: isHost ? (room.host_cooldowns || {}) : (room.guest_cooldowns || {}),
      opponentCooldowns: isHost ? (room.guest_cooldowns || {}) : (room.host_cooldowns || {}),
      battleLog: room.battle_log || []
    });

  } catch (error) {
    console.error('Erro em GET /api/pvp/room/state:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
