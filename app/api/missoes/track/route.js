import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';
import { incrementarProgresso, eventoCorrespondeAMissao } from '@/lib/missions/missionProgress';

export const dynamic = 'force-dynamic';

/**
 * POST /api/missoes/track
 * Atualiza progresso de missões baseado em eventos
 * Body: { userId, tipoEvento, incremento?, extras? }
 */
export async function POST(request) {
  try {
    const { userId, tipoEvento, incremento = 1, extras = {} } = await request.json();

    if (!userId || !tipoEvento) {
      return NextResponse.json(
        { error: 'userId e tipoEvento são obrigatórios' },
        { status: 400 }
      );
    }

    // Data atual
    const hoje = new Date().toISOString().split('T')[0];
    const progressoId = `${userId}_${hoje}`;

    // Buscar progresso
    const progressoDiario = await getDocument('daily_missions_progress', progressoId);

    if (!progressoDiario) {
      return NextResponse.json(
        { message: 'Nenhuma missão ativa para hoje' },
        { status: 404 }
      );
    }

    // Atualizar progresso das missões que correspondem ao evento
    let houveMudanca = false;
    const missoesAtualizadas = progressoDiario.missoes.map(missao => {
      // Se já concluída, não atualizar
      if (missao.concluida) {
        return missao;
      }

      // Verificar se evento corresponde à missão
      if (eventoCorrespondeAMissao(missao, tipoEvento)) {
        const resultado = incrementarProgresso(missao, missao.progresso, incremento);

        houveMudanca = true;

        console.log(`[MISSÕES] ${missao.nome}: ${missao.progresso} → ${resultado.progresso}/${missao.meta}${resultado.concluida ? ' ✅' : ''}`);

        return {
          ...missao,
          progresso: resultado.progresso,
          concluida: resultado.concluida
        };
      }

      return missao;
    });

    // Verificar se todas foram concluídas
    const todasConcluidas = missoesAtualizadas.every(m => m.concluida);

    // Atualizar no banco
    if (houveMudanca) {
      await updateDocument('daily_missions_progress', progressoId, {
        missoes: missoesAtualizadas,
        todas_concluidas: todasConcluidas,
        updated_at: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      missoes_atualizadas: houveMudanca,
      todas_concluidas: todasConcluidas,
      missoes: missoesAtualizadas
    });

  } catch (error) {
    console.error('Erro em POST /api/missoes/track:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
