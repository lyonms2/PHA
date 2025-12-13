import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';
import { getHunterRank, aplicarBonusMoedas, aplicarBonusFragmentos } from '@/lib/hunter/hunterRankSystem';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pvp/recompensas/coletar
 * Coleta recompensas de fim de temporada
 * Body: { userId, recompensaId }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, recompensaId } = body;

    if (!userId || !recompensaId) {
      return NextResponse.json({ error: 'userId e recompensaId são obrigatórios' }, { status: 400 });
    }

    // Buscar recompensa no Firestore
    const recompensa = await getDocument('pvp_recompensas_pendentes', recompensaId);

    if (!recompensa || recompensa.user_id !== userId || recompensa.coletada) {
      return NextResponse.json({ error: 'Recompensa não encontrada ou já coletada' }, { status: 404 });
    }

    console.log('[COLETAR RECOMPENSA] Coletando:', {
      moedas: recompensa.moedas,
      fragmentos: recompensa.fragmentos,
      avatar_lendario: recompensa.avatar_lendario,
      avatar_raro: recompensa.avatar_raro
    });

    // Buscar stats atuais do jogador
    const stats = await getDocument('player_stats', userId);

    if (!stats) {
      console.error('[COLETAR RECOMPENSA] Erro ao buscar stats');
      return NextResponse.json({ error: 'Erro ao buscar stats do jogador' }, { status: 500 });
    }

    // Obter rank do caçador para aplicar bônus
    const hunterRank = getHunterRank(stats.hunterRankXp || 0);

    // Aplicar bônus de rank às recompensas
    const moedasBase = recompensa.moedas || 0;
    const fragmentosBase = recompensa.fragmentos || 0;

    const moedasComBonus = aplicarBonusMoedas(moedasBase, hunterRank);
    const fragmentosComBonus = Math.floor(fragmentosBase * (1 + (hunterRank.bonusFragmentos || 0)));

    const bonusMoedas = moedasComBonus - moedasBase;
    const bonusFragmentos = fragmentosComBonus - fragmentosBase;

    // Calcular novos valores
    const novasMoedas = (stats.moedas || 0) + moedasComBonus;
    const novosFragmentos = (stats.fragmentos || 0) + fragmentosComBonus;

    // Atualizar moedas e fragmentos do jogador
    await updateDocument('player_stats', userId, {
      moedas: novasMoedas,
      fragmentos: novosFragmentos,
      updated_at: new Date().toISOString()
    });

    // Marcar recompensa como coletada
    await updateDocument('pvp_recompensas_pendentes', recompensaId, {
      coletada: true,
      data_coleta: new Date().toISOString()
    });

    // Se ganhou avatar lendário ou raro, retornar flag para mostrar modal
    const ganhouAvatar = recompensa.avatar_lendario || recompensa.avatar_raro;
    const raridadeAvatar = recompensa.avatar_lendario ? 'Lendário' :
                           recompensa.avatar_raro ? 'Raro' : null;

    return NextResponse.json({
      success: true,
      recompensa: {
        moedas_base: moedasBase,
        moedas_total: moedasComBonus,
        fragmentos_base: fragmentosBase,
        fragmentos_total: fragmentosComBonus,
        avatar_lendario: recompensa.avatar_lendario,
        avatar_raro: recompensa.avatar_raro,
        ganhouAvatar,
        raridadeAvatar
      },
      bonus_hunter_rank: {
        rank: hunterRank.nome,
        bonus_moedas: bonusMoedas,
        bonus_fragmentos: bonusFragmentos,
        percentual_moedas: Math.round((hunterRank.bonusMoedas || 0) * 100),
        percentual_fragmentos: Math.round((hunterRank.bonusFragmentos || 0) * 100)
      },
      novosValores: {
        moedas: novasMoedas,
        fragmentos: novosFragmentos
      },
      message: 'Recompensas coletadas com sucesso!'
    });
  } catch (error) {
    console.error('[COLETAR RECOMPENSA] Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor: ' + error.message }, { status: 500 });
  }
}
