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

    // Buscar dados do jogador
    const jogador = await getDocument('users', userId);

    if (!jogador) {
      return NextResponse.json({ error: 'Jogador não encontrado' }, { status: 404 });
    }

    // Retornar stats do jogador
    return NextResponse.json({
      nivel: jogador.nivel || 1,
      moedas: jogador.moedas || 0,
      fragmentos: jogador.fragmentos || 0,
      xp: jogador.xp || 0
    });
  } catch (error) {
    console.error('Erro ao buscar stats do jogador:', error);
    return NextResponse.json({ error: 'Erro ao buscar stats' }, { status: 500 });
  }
}
