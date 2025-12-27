import { NextResponse } from 'next/server';
import { getDocuments } from '@/lib/firebase/firestore';
import { encerrarTemporada } from './temporadaService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pvp/temporada/encerrar
 * Encerra a temporada ativa e distribui recompensas
 * IMPORTANTE: Chamado automaticamente quando uma temporada expira ou manualmente por admin
 */
export async function POST(request) {
  try {
    console.log('[ENCERRAR TEMPORADA API] Iniciando encerramento via POST...');

    // Buscar temporada ativa
    const temporadas = await getDocuments('pvp_temporadas', {
      where: [['ativa', '==', true]]
    });

    if (!temporadas || temporadas.length === 0) {
      return NextResponse.json({ error: 'Nenhuma temporada ativa encontrada' }, { status: 404 });
    }

    const temporadaAtiva = temporadas[0];

    // Chamar função de encerramento
    const resultado = await encerrarTemporada(temporadaAtiva);

    return NextResponse.json(resultado);
  } catch (error) {
    console.error('[ENCERRAR TEMPORADA API] Erro interno:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error.message
    }, { status: 500 });
  }
}
