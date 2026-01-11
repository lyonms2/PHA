import { NextResponse } from 'next/server';
import { getDocument, getDocuments, getDocumentsByQuery, updateDocument, createDocument, deleteDocument } from '@/lib/firebase/firestore';
import { calcularRecompensasPVP } from '@/lib/pvp/pvpRewardsSystem';
import { trackMissionProgress } from '@/lib/missions/missionTracker';
import { aplicarBonusColecoes } from '@/lib/arena/rewardsSystem';

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

    // Verificar se recompensas já foram processadas
    if (room.finished_at) {
      console.log('⚠️ [PVP FINISH] Recompensas já processadas para sala:', roomId);
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
    const hostRecompensasBase = calcularRecompensasPVP(
      hostAvatar,
      guestAvatar,
      hostWon,
      !hostWon && rendeu // Host se rendeu se perdeu e rendeu = true
    );

    // Calcular recompensas para guest (sem apostas)
    const guestRecompensasBase = calcularRecompensasPVP(
      guestAvatar,
      hostAvatar,
      !hostWon,
      hostWon && rendeu // Guest se rendeu se perdeu e rendeu = true
    );

    // ===== APLICAR BÔNUS DE COLEÇÕES =====
    // Buscar todos os avatares de ambos os jogadores
    const [hostTodosAvatares, guestTodosAvatares, hostPlayerStats, guestPlayerStats] = await Promise.all([
      getDocumentsByQuery('avatares', [{ field: 'user_id', operator: '==', value: room.host_user_id }]),
      getDocumentsByQuery('avatares', [{ field: 'user_id', operator: '==', value: room.guest_user_id }]),
      getDocument('player_stats', room.host_user_id),
      getDocument('player_stats', room.guest_user_id)
    ]);

    console.log(`💎 [PVP COLEÇÕES] Host: ${hostTodosAvatares.length} avatares | Guest: ${guestTodosAvatares.length} avatares`);

    // Aplicar bônus de coleções para host
    let hostRecompensas = hostRecompensasBase;
    let hostBonusInfo = null;
    try {
      hostRecompensas = aplicarBonusColecoes(hostRecompensasBase, hostAvatar, hostTodosAvatares);
      hostBonusInfo = {
        bonusGold: hostRecompensas.bonusGold,
        bonusXP: hostRecompensas.bonusXP,
        goldGanho: hostRecompensas.goldGanho || 0,
        xpGanho: hostRecompensas.xpGanho || 0
      };
      console.log(`💰 [PVP COLEÇÕES] Host bônus:`, hostBonusInfo);
    } catch (error) {
      console.error('⚠️ [PVP COLEÇÕES] Erro ao aplicar bônus host:', error);
    }

    // Aplicar bônus de coleções para guest
    let guestRecompensas = guestRecompensasBase;
    let guestBonusInfo = null;
    try {
      guestRecompensas = aplicarBonusColecoes(guestRecompensasBase, guestAvatar, guestTodosAvatares);
      guestBonusInfo = {
        bonusGold: guestRecompensas.bonusGold,
        bonusXP: guestRecompensas.bonusXP,
        goldGanho: guestRecompensas.goldGanho || 0,
        xpGanho: guestRecompensas.xpGanho || 0
      };
      console.log(`💰 [PVP COLEÇÕES] Guest bônus:`, guestBonusInfo);
    } catch (error) {
      console.error('⚠️ [PVP COLEÇÕES] Erro ao aplicar bônus guest:', error);
    }

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

    // Rastrear vínculo ganho para missões diárias (host)
    if (hostRecompensas.vinculo > 0) {
      try {
        await trackMissionProgress(room.host_user_id, 'GANHAR_VINCULO', hostRecompensas.vinculo);
      } catch (error) {
        console.error('[MISSÕES] Erro ao rastrear vínculo (host):', error);
      }
    }

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

    // Rastrear vínculo ganho para missões diárias (guest)
    if (guestRecompensas.vinculo > 0) {
      try {
        await trackMissionProgress(room.guest_user_id, 'GANHAR_VINCULO', guestRecompensas.vinculo);
      } catch (error) {
        console.error('[MISSÕES] Erro ao rastrear vínculo (guest):', error);
      }
    }

    // Atualizar stats do host player
    const novoHostFama = Math.max(0, (hostPlayerStats.fama || 0) + hostRecompensas.fama);
    const novoHostHunterXP = Math.max(0, (hostPlayerStats.hunterRankXp || 0) + hostRecompensas.xpCacador);
    const hostGold = hostRecompensas.gold || 0;
    const novoHostSaldo = Math.max(0, (hostPlayerStats.saldo || 0) + hostGold);

    await updateDocument('player_stats', room.host_user_id, {
      fama: novoHostFama,
      hunterRankXp: novoHostHunterXP,
      saldo: novoHostSaldo
    });

    // Atualizar stats do guest player
    const novoGuestFama = Math.max(0, (guestPlayerStats.fama || 0) + guestRecompensas.fama);
    const novoGuestHunterXP = Math.max(0, (guestPlayerStats.hunterRankXp || 0) + guestRecompensas.xpCacador);
    const guestGold = guestRecompensas.gold || 0;
    const novoGuestSaldo = Math.max(0, (guestPlayerStats.saldo || 0) + guestGold);

    await updateDocument('player_stats', room.guest_user_id, {
      fama: novoGuestFama,
      hunterRankXp: novoGuestHunterXP,
      saldo: novoGuestSaldo
    });

    // === ATUALIZAR PVP RANKINGS (LEADERBOARD) ===
    // Buscar temporada ativa
    let temporadas = await getDocuments('pvp_temporadas', {
      where: [['ativa', '==', true]]
    });

    // Se não existe temporada ativa, criar uma automaticamente
    if (!temporadas || temporadas.length === 0) {
      console.log('⚠️ [PVP RANKING] Nenhuma temporada ativa encontrada. Criando temporada automaticamente...');

      const agora = new Date();
      const dataInicio = new Date(agora);
      const dataFim = new Date(agora);
      dataFim.setDate(dataFim.getDate() + 30); // Temporada de 30 dias

      const temporadaId = `temporada_${Date.now()}`;
      const novaTemporada = {
        temporada_id: temporadaId,
        numero: 1,
        nome: 'Temporada 1',
        data_inicio: dataInicio.toISOString(),
        data_fim: dataFim.toISOString(),
        ativa: true,
        created_at: new Date().toISOString()
      };

      await createDocument('pvp_temporadas', novaTemporada, temporadaId);

      // Recarregar temporadas
      temporadas = await getDocuments('pvp_temporadas', {
        where: [['ativa', '==', true]]
      });

      console.log('✅ [PVP RANKING] Temporada criada:', temporadaId);
    }

    if (temporadas && temporadas.length > 0) {
      const temporadaAtiva = temporadas[0];
      console.log('📊 [PVP RANKING] Temporada ativa:', temporadaAtiva.temporada_id);

      // Atualizar ranking do HOST
      const hostRankingId = `${room.host_user_id}_${temporadaAtiva.temporada_id}`;
      const hostRankingAtual = await getDocument('pvp_rankings', hostRankingId);

      if (hostRankingAtual) {
        // Atualizar existente
        const novasHostVitorias = hostWon ? hostRankingAtual.vitorias + 1 : hostRankingAtual.vitorias;
        const novasHostDerrotas = !hostWon ? hostRankingAtual.derrotas + 1 : hostRankingAtual.derrotas;
        const novoHostStreak = hostWon ? (hostRankingAtual.streak || 0) + 1 : 0;

        await updateDocument('pvp_rankings', hostRankingId, {
          fama: novoHostFama,
          vitorias: novasHostVitorias,
          derrotas: novasHostDerrotas,
          streak: novoHostStreak,
          streak_maximo: Math.max(hostRankingAtual.streak_maximo || 0, novoHostStreak),
          ultima_batalha: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        console.log('✅ [PVP RANKING] Host atualizado:', { novoHostFama, novasHostVitorias, novasHostDerrotas, novoHostStreak });
      } else {
        // Criar novo registro
        await createDocument('pvp_rankings', {
          user_id: room.host_user_id,
          temporada_id: temporadaAtiva.temporada_id,
          fama: novoHostFama,
          vitorias: hostWon ? 1 : 0,
          derrotas: hostWon ? 0 : 1,
          streak: hostWon ? 1 : 0,
          streak_maximo: hostWon ? 1 : 0,
          ultima_batalha: new Date().toISOString(),
          recompensas_recebidas: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, hostRankingId);

        console.log('✅ [PVP RANKING] Host criado:', hostRankingId);
      }

      // Atualizar ranking do GUEST
      const guestRankingId = `${room.guest_user_id}_${temporadaAtiva.temporada_id}`;
      const guestRankingAtual = await getDocument('pvp_rankings', guestRankingId);

      if (guestRankingAtual) {
        // Atualizar existente
        const novasGuestVitorias = !hostWon ? guestRankingAtual.vitorias + 1 : guestRankingAtual.vitorias;
        const novasGuestDerrotas = hostWon ? guestRankingAtual.derrotas + 1 : guestRankingAtual.derrotas;
        const novoGuestStreak = !hostWon ? (guestRankingAtual.streak || 0) + 1 : 0;

        await updateDocument('pvp_rankings', guestRankingId, {
          fama: novoGuestFama,
          vitorias: novasGuestVitorias,
          derrotas: novasGuestDerrotas,
          streak: novoGuestStreak,
          streak_maximo: Math.max(guestRankingAtual.streak_maximo || 0, novoGuestStreak),
          ultima_batalha: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        console.log('✅ [PVP RANKING] Guest atualizado:', { novoGuestFama, novasGuestVitorias, novasGuestDerrotas, novoGuestStreak });
      } else {
        // Criar novo registro
        await createDocument('pvp_rankings', {
          user_id: room.guest_user_id,
          temporada_id: temporadaAtiva.temporada_id,
          fama: novoGuestFama,
          vitorias: !hostWon ? 1 : 0,
          derrotas: hostWon ? 0 : 1,
          streak: !hostWon ? 1 : 0,
          streak_maximo: !hostWon ? 1 : 0,
          ultima_batalha: new Date().toISOString(),
          recompensas_recebidas: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, guestRankingId);

        console.log('✅ [PVP RANKING] Guest criado:', guestRankingId);
      }
    } else {
      console.warn('⚠️ [PVP RANKING] Nenhuma temporada ativa encontrada!');
    }

    // Marcar sala como finalizada
    await updateDocument('pvp_duel_rooms', roomId, {
      status: 'finished',
      winner,
      rendeu,
      finished_at: new Date().toISOString()
    });

    // Rastrear progresso de missões (não bloqueia se falhar)
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
        xpAvatar: hostRecompensas.xp,
        gold: hostRecompensas.gold,
        bonus: hostBonusInfo
      },
      guest: {
        fama: guestRecompensas.fama,
        xpCacador: guestRecompensas.xpCacador,
        xpAvatar: guestRecompensas.xp,
        gold: guestRecompensas.gold,
        bonus: guestBonusInfo
      }
    });

    return NextResponse.json({
      success: true,
      winner,
      rendeu,
      host: {
        recompensas: hostRecompensas,
        bonusColecoes: hostBonusInfo,
        stats: {
          avatar: {
            experiencia: hostAvatar.experiencia,
            vinculo: hostAvatar.vinculo,
            exaustao: hostAvatar.exaustao,
            hp_atual: hostWon ? room.host_hp : 0
          },
          player: {
            fama: hostPlayerStats.fama,
            hunterRankXp: hostPlayerStats.hunterRankXp,
            saldo: novoHostSaldo
          }
        }
      },
      guest: {
        recompensas: guestRecompensas,
        bonusColecoes: guestBonusInfo,
        stats: {
          avatar: {
            experiencia: guestAvatar.experiencia,
            vinculo: guestAvatar.vinculo,
            exaustao: guestAvatar.exaustao,
            hp_atual: !hostWon ? room.guest_hp : 0
          },
          player: {
            fama: guestPlayerStats.fama,
            hunterRankXp: guestPlayerStats.hunterRankXp,
            saldo: novoGuestSaldo
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
