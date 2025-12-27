import { NextResponse } from 'next/server';
import { getDocument } from '@/lib/firebase/firestore';
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
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar stats do jogador
    const stats = await getDocument('player_stats', userId);

    if (!stats) {
      return NextResponse.json({ error: 'Player stats não encontrado' }, { status: 404 });
    }

    const avatares = stats.avatars || [];

    // Calcular progresso de todas as coleções
    const progressoColecoes = calcularProgressoColecoes(avatares);

    // Contar coleções ativas (que dão bônus)
    const colecoesAtivas = progressoColecoes.filter(c => c.ativa).length;

    return NextResponse.json({
      colecoes: progressoColecoes,
      colecoes_ativas: colecoesAtivas
    });

  } catch (error) {
    console.error('[COLECOES] Erro ao buscar coleções:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
