import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';
import { calcularRecompensasPVP } from '@/lib/pvp/pvpRewardsSystem';
import { trackMissionProgress } from '@/lib/missions/missionTracker';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pvp/room/finish
 * Finaliza batalha PVP e aplica recompensas/penalidades
 */
export async function POST(request) {
  try {
    const { roomId, winner, rendeu = false } = await request.json();

    if (!roomId || !winner) {
      return NextResponse.json(
        { error: 'roomId e winner são obrigatórios' },
        { status: 400 }
      );
    }

    if (!['host', 'guest'].includes(winner)) {
      return NextResponse.json(
        { error: 'winner deve ser "host" ou "guest"' },
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

    // Verificar se recompensas já foram processadas (finished_at existe)
    if (room.finished_at) {
      return NextResponse.json(
        { error: 'Recompensas já foram processadas para esta batalha' },
        { status: 400 }
      );
    }

    // Determinar vencedor e perdedor
    const hostWon = winner === 'host';
    const hostAvatar = room.host_avatar;
    const guestAvatar = room.guest_avatar;

    // Calcular recompensas para host (sem apostas)
    const hostRecompensas = calcularRecompensasPVP(
      hostAvatar,
      guestAvatar,
      hostWon,
      !hostWon && rendeu // Host se rendeu se perdeu e rendeu = true
    );

    // Calcular recompensas para guest (sem apostas)
    const guestRecompensas = calcularRecompensasPVP(
      guestAvatar,
      hostAvatar,
      !hostWon,
      hostWon && rendeu // Guest se rendeu se perdeu e rendeu = true
    );

    // Buscar dados atuais dos jogadores
    const [hostPlayerStats, guestPlayerStats] = await Promise.all([
      getDocument('player_stats', room.host_user_id),
      getDocument('player_stats', room.guest_user_id)
    ]);

    // Atualizar stats do host avatar
    const novoHostXP = (hostAvatar.experiencia || 0) + hostRecompensas.xp;
    const novoHostVinculo = Math.min(100, Math.max(0, (hostAvatar.vinculo || 0) + hostRecompensas.vinculo));
    const novoHostExaustao = Math.min(100, Math.max(0, (hostAvatar.exaustao || 0) + hostRecompensas.exaustao));

    await updateDocument('avatares', hostAvatar.id, {
      experiencia: novoHostXP,
      vinculo: novoHostVinculo,
      exaustao: novoHostExaustao,
      hp_atual: hostWon ? room.host_hp : 0 // Se perdeu, HP = 0
    });

    // Atualizar stats do guest avatar
    const novoGuestXP = (guestAvatar.experiencia || 0) + guestRecompensas.xp;
    const novoGuestVinculo = Math.min(100, Math.max(0, (guestAvatar.vinculo || 0) + guestRecompensas.vinculo));
    const novoGuestExaustao = Math.min(100, Math.max(0, (guestAvatar.exaustao || 0) + guestRecompensas.exaustao));

    await updateDocument('avatares', guestAvatar.id, {
      experiencia: novoGuestXP,
      vinculo: novoGuestVinculo,
      exaustao: novoGuestExaustao,
      hp_atual: !hostWon ? room.guest_hp : 0 // Se perdeu, HP = 0
    });

    // Atualizar stats do host player
    const novoHostFama = Math.max(0, (hostPlayerStats.fama || 0) + hostRecompensas.fama);
    const novoHostHunterXP = Math.max(0, (hostPlayerStats.hunterRankXp || 0) + hostRecompensas.xpCacador);

    await updateDocument('player_stats', room.host_user_id, {
      fama: novoHostFama,
      hunterRankXp: novoHostHunterXP
    });

    // Atualizar stats do guest player
    const novoGuestFama = Math.max(0, (guestPlayerStats.fama || 0) + guestRecompensas.fama);
    const novoGuestHunterXP = Math.max(0, (guestPlayerStats.hunterRankXp || 0) + guestRecompensas.xpCacador);

    await updateDocument('player_stats', room.guest_user_id, {
      fama: novoGuestFama,
      hunterRankXp: novoGuestHunterXP
    });

    // Marcar sala como finalizada
    await updateDocument('pvp_duel_rooms', roomId, {
      status: 'finished',
      winner,
      rendeu,
      finished_at: new Date().toISOString()
    });

    // Rastrear progresso de missões (não bloqueia se falhar)
    // Ambos os jogadores participaram do PVP
    trackMissionProgress(room.host_user_id, 'PARTICIPAR_PVP', 1);
    trackMissionProgress(room.guest_user_id, 'PARTICIPAR_PVP', 1);

    // Apenas o vencedor ganha crédito por vitória
    if (hostWon) {
      trackMissionProgress(room.host_user_id, 'VITORIA_PVP', 1);
    } else {
      trackMissionProgress(room.guest_user_id, 'VITORIA_PVP', 1);
    }

    console.log('🏆 Recompensas PVP aplicadas:', {
      roomId,
      winner: hostWon ? 'host' : 'guest',
      host: {
        fama: hostRecompensas.fama,
        xpCacador: hostRecompensas.xpCacador,
        xpAvatar: hostRecompensas.xp
      },
      guest: {
        fama: guestRecompensas.fama,
        xpCacador: guestRecompensas.xpCacador,
        xpAvatar: guestRecompensas.xp
      }
    });

    return NextResponse.json({
      success: true,
      winner,
      rendeu,
      host: {
        recompensas: hostRecompensas,
        stats: {
          avatar: {
            experiencia: novoHostXP,
            vinculo: novoHostVinculo,
            exaustao: novoHostExaustao,
            hp_atual: hostWon ? room.host_hp : 0
          },
          player: {
            fama: novoHostFama,
            hunterRankXp: novoHostHunterXP
          }
        }
      },
      guest: {
        recompensas: guestRecompensas,
        stats: {
          avatar: {
            experiencia: novoGuestXP,
            vinculo: novoGuestVinculo,
            exaustao: novoGuestExaustao,
            hp_atual: !hostWon ? room.guest_hp : 0
          },
          player: {
            fama: novoGuestFama,
            hunterRankXp: novoGuestHunterXP
          }
        }
      }
    });

  } catch (error) {
    console.error('Erro em POST /api/pvp/room/finish:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
