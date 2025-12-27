import { NextResponse } from 'next/server';
import { getDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Buscar stats do jogador da collection player_stats
    const stats = await getDocument('player_stats', userId);

    if (!stats) {
      return NextResponse.json({ error: 'Stats do jogador não encontrados' }, { status: 404 });
    }

    // Retornar stats completos do jogador
    return NextResponse.json({
      stats: {
        nivel: stats.nivel || 1,
        moedas: stats.moedas || 0,
        fragmentos: stats.fragmentos || 0,
        xp: stats.xp || 0,
        hunterRankXp: stats.hunterRankXp || 0,
        avatars: stats.avatars || [],
        titulos: stats.titulos || [],
        colecoes_completadas: stats.colecoes_completadas || [],
        avatares_hall_da_fama: stats.avatares_hall_da_fama || []
      }
    });
  } catch (error) {
    console.error('Erro ao buscar stats do jogador:', error);
    return NextResponse.json({ error: 'Erro ao buscar stats' }, { status: 500 });
  }
}
