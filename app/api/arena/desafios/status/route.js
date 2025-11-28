// ==================== API: STATUS DOS DESAFIOS ====================
// Arquivo: /app/api/arena/desafios/status/route.js

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * GET - Busca o status dos desafios do usuário
 * Retorna quais bosses foram derrotados e quando podem ser desafiados novamente
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { message: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar histórico de desafios do usuário no Firestore
    const desafiosRef = collection(db, 'desafios_boss');
    const q = query(desafiosRef, where('user_id', '==', userId));
    const querySnapshot = await getDocs(q);

    const desafios = {};

    querySnapshot.forEach(doc => {
      const data = doc.data();
      const bossId = data.boss_id;

      // Se já existe entrada para este boss, usar a mais recente
      if (!desafios[bossId] || new Date(data.data_conclusao) > new Date(desafios[bossId].dataConclusao)) {
        desafios[bossId] = {
          dataConclusao: data.data_conclusao,
          venceu: data.venceu || false,
          proximaTentativa: data.proxima_tentativa
        };
      }
    });

    return NextResponse.json({
      sucesso: true,
      desafios
    });

  } catch (error) {
    console.error('Erro ao buscar status dos desafios:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar status', erro: error.message },
      { status: 500 }
    );
  }
}
