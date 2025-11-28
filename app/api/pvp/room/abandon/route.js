import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';
import { calcularPenalidadesAbandonoPVP } from '@/lib/pvp/pvpRewardsSystem';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pvp/room/abandon
 * Aplica penalidades quando um jogador abandona a batalha
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

    if (room.status === 'finished') {
      return NextResponse.json(
        { error: 'Batalha já foi finalizada' },
        { status: 400 }
      );
    }

    // Determinar quem abandonou
    const isHost = room.host_user_id === userId;
    const isGuest = room.guest_user_id === userId;

    if (!isHost && !isGuest) {
      return NextResponse.json(
        { error: 'Você não é participante desta sala' },
        { status: 403 }
      );
    }

    const abandonedAvatar = isHost ? room.host_avatar : room.guest_avatar;
    const bet = isHost ? (room.host_bet || 0) : (room.guest_bet || 0);

    // Calcular penalidades de abandono
    const penalidades = calcularPenalidadesAbandonoPVP(bet);

    // Buscar dados atuais do jogador
    const playerStats = await getDocument('player_stats', userId);

    if (!playerStats) {
      return NextResponse.json(
        { error: 'Dados do jogador não encontrados' },
        { status: 404 }
      );
    }

    // Aplicar penalidades no avatar
    const novoVinculo = Math.max(0, (abandonedAvatar.vinculo || 0) + penalidades.vinculo);
    const novoExaustao = Math.min(100, (abandonedAvatar.exaustao || 0) + penalidades.exaustao);

    await updateDocument('avatares', abandonedAvatar.id, {
      vinculo: novoVinculo,
      exaustao: novoExaustao,
      hp_atual: 0 // Avatar "morre" por abandono
    });

    // Aplicar penalidades no jogador
    const novoFama = Math.max(0, (playerStats.fama || 0) + penalidades.fama);
    const novoMoedas = Math.max(0, (playerStats.moedas || 0) + penalidades.moedas);

    await updateDocument('player_stats', userId, {
      fama: novoFama,
      moedas: novoMoedas
    });

    // Marcar sala como finalizada por abandono
    const winner = isHost ? 'guest' : 'host';

    await updateDocument('pvp_duel_rooms', roomId, {
      status: 'finished',
      winner,
      rendeu: false,
      finished_at: new Date().toISOString(),
      finish_reason: 'abandon'
    });

    return NextResponse.json({
      success: true,
      winner,
      penalidades: {
        vinculo: penalidades.vinculo,
        exaustao: penalidades.exaustao,
        fama: penalidades.fama,
        moedas: penalidades.moedas,
        hp_atual: 0
      },
      message: 'Você abandonou a batalha. Penalidades completas aplicadas!'
    });

  } catch (error) {
    console.error('Erro em POST /api/pvp/room/abandon:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
