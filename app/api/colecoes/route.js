import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';
import { calcularProgressoColecoes } from '@/lib/collections/collectionProgress';

export const dynamic = 'force-dynamic';

/**
 * GET /api/colecoes?userId=xxx
 * Retorna progresso de todas as coleções do jogador
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Buscar stats do jogador (contém coleções completadas)
    const stats = await getDocument('player_stats', userId);

    if (!stats) {
      return NextResponse.json({ error: 'Player stats não encontrado' }, { status: 404 });
    }

    // Buscar avatares do jogador
    const avatares = stats.avatars || [];
    const colecoesCompletadas = stats.colecoes_completadas || [];

    // Calcular progresso de todas as coleções
    const progressoColecoes = calcularProgressoColecoes(avatares, colecoesCompletadas);

    // Contar coleções completadas mas não resgatadas
    const colecoesParaResgatar = progressoColecoes.filter(c => c.podeResgatar).length;

    return NextResponse.json({
      success: true,
      colecoes: progressoColecoes,
      colecoes_completadas: colecoesCompletadas.length,
      colecoes_para_resgatar: colecoesParaResgatar
    });

  } catch (error) {
    console.error('[COLECOES] Erro ao buscar coleções:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
