import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';
import { COLECOES } from '@/lib/collections/collectionDefinitions';
import { verificarColecaoCompleta } from '@/lib/collections/collectionProgress';
import { getHunterRank, aplicarMultiplicadorRecompensas } from '@/lib/hunter/hunterRankSystem';

export const dynamic = 'force-dynamic';

/**
 * POST /api/colecoes/resgatar
 * Resgata recompensas de uma coleção completada
 * Body: { userId, colecaoId }
 */
export async function POST(request) {
  try {
    const { userId, colecaoId } = await request.json();

    if (!userId || !colecaoId) {
      return NextResponse.json(
        { error: 'userId e colecaoId são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar stats do jogador
    const stats = await getDocument('player_stats', userId);

    if (!stats) {
      return NextResponse.json({ error: 'Player stats não encontrado' }, { status: 404 });
    }

    // Buscar definição da coleção
    const colecao = COLECOES.find(c => c.id === colecaoId);

    if (!colecao) {
      return NextResponse.json({ error: 'Coleção não encontrada' }, { status: 404 });
    }

    // Verificar se já foi completada
    const colecoesCompletadas = stats.colecoes_completadas || [];

    if (colecoesCompletadas.includes(colecaoId)) {
      return NextResponse.json(
        { error: 'Coleção já foi resgatada anteriormente' },
        { status: 400 }
      );
    }

    // Verificar se está realmente completa
    const avatares = stats.avatars || [];
    const { completa } = verificarColecaoCompleta(colecao, avatares);

    if (!completa) {
      return NextResponse.json(
        { error: 'Coleção não está completa' },
        { status: 400 }
      );
    }

    // Aplicar bônus de Hunter Rank nas recompensas
    const hunterRank = getHunterRank(stats.hunterRankXp || 0);
    const recompensasComBonus = aplicarMultiplicadorRecompensas(colecao.recompensas, hunterRank);

    // Atualizar stats do jogador
    const novasMoedas = (stats.moedas || 0) + recompensasComBonus.moedas;
    const novosFragmentos = (stats.fragmentos || 0) + recompensasComBonus.fragmentos;
    const novoXpCacador = (stats.hunterRankXp || 0) + recompensasComBonus.xpCacador;

    await updateDocument('player_stats', userId, {
      moedas: novasMoedas,
      fragmentos: novosFragmentos,
      hunterRankXp: novoXpCacador,
      colecoes_completadas: [...colecoesCompletadas, colecaoId],
      updated_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      colecao: {
        id: colecao.id,
        nome: colecao.nome,
        icone: colecao.icone
      },
      recompensas: recompensasComBonus,
      bonus_hunter_rank: {
        rank: hunterRank.nome,
        percentual: Math.floor((hunterRank.multiplicadorRecompensas - 1.0) * 100)
      },
      novos_valores: {
        moedas: novasMoedas,
        fragmentos: novosFragmentos,
        hunterRankXp: novoXpCacador
      }
    });

  } catch (error) {
    console.error('[COLECOES] Erro ao resgatar coleção:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
