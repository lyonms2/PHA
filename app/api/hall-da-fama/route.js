import { NextResponse } from 'next/server';
import { getDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * GET /api/hall-da-fama?userId=xxx
 * Retorna todos os avatares dedicados ao Hall da Fama do jogador
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

    const hallDaFama = stats.avatares_hall_da_fama || [];

    // Agrupar avatares por coleção
    const avataresPorColecao = {};

    hallDaFama.forEach(avatar => {
      const colecaoId = avatar.colecao_dedicada || 'sem_colecao';
      if (!avataresPorColecao[colecaoId]) {
        avataresPorColecao[colecaoId] = {
          colecao_id: colecaoId,
          colecao_nome: avatar.colecao_nome || 'Sem Coleção',
          avatares: []
        };
      }
      avataresPorColecao[colecaoId].avatares.push(avatar);
    });

    // Estatísticas do Hall da Fama
    const estatisticas = {
      total_avatares: hallDaFama.length,
      por_raridade: {},
      por_elemento: {},
      colecoes_dedicadas: Object.keys(avataresPorColecao).length
    };

    // Contar por raridade e elemento
    hallDaFama.forEach(avatar => {
      // Raridade
      if (avatar.raridade) {
        estatisticas.por_raridade[avatar.raridade] =
          (estatisticas.por_raridade[avatar.raridade] || 0) + 1;
      }

      // Elemento
      if (avatar.elemento) {
        estatisticas.por_elemento[avatar.elemento] =
          (estatisticas.por_elemento[avatar.elemento] || 0) + 1;
      }
    });

    return NextResponse.json({
      success: true,
      hall_da_fama: hallDaFama,
      agrupado_por_colecao: Object.values(avataresPorColecao),
      estatisticas
    });

  } catch (error) {
    console.error('[HALL DA FAMA] Erro ao buscar Hall da Fama:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
