import { NextResponse } from 'next/server';
import { getDocuments, createDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/temporada
 * Busca informações da temporada ativa
 * Se não existir nenhuma, cria uma automaticamente
 */
export async function GET(request) {
  try {
    let temporadas = await getDocuments('pvp_temporadas', {
      where: [['ativa', '==', true]]
    });

    // Se não existe temporada ativa, criar uma
    if (!temporadas || temporadas.length === 0) {
      const agora = new Date();
      const dataInicio = new Date(agora);
      const dataFim = new Date(agora);
      dataFim.setDate(dataFim.getDate() + 30); // Temporada de 30 dias

      const temporadaId = `temporada_${Date.now()}`;
      const novaTemporada = {
        temporada_id: temporadaId,
        numero: 1,
        nome: 'Temporada 1',
        data_inicio: dataInicio.toISOString(),
        data_fim: dataFim.toISOString(),
        ativa: true,
        created_at: new Date().toISOString()
      };

      await createDocument('pvp_temporadas', novaTemporada, temporadaId);

      // Recarregar temporadas
      temporadas = await getDocuments('pvp_temporadas', {
        where: [['ativa', '==', true]]
      });
    }

    let temporada = temporadas[0];

    // Calcular dias restantes
    let dataFim = new Date(temporada.data_fim);
    let agora = new Date();
    let diasRestantes = Math.ceil((dataFim - agora) / (1000 * 60 * 60 * 24));

    // Se a temporada expirou, encerrar automaticamente
    if (diasRestantes < 0) {
      console.log('[TEMPORADA] Temporada expirada, encerrando automaticamente...');

      try {
        // Importar função de encerramento
        const { encerrarTemporada } = await import('./encerrar/temporadaService');
        await encerrarTemporada(temporada);

        console.log('[TEMPORADA] Temporada encerrada com sucesso, recarregando...');

        // Recarregar temporada ativa (a nova criada)
        temporadas = await getDocuments('pvp_temporadas', {
          where: [['ativa', '==', true]]
        });

        if (temporadas && temporadas.length > 0) {
          temporada = temporadas[0];
          dataFim = new Date(temporada.data_fim);
          agora = new Date();
          diasRestantes = Math.ceil((dataFim - agora) / (1000 * 60 * 60 * 24));
        }
      } catch (error) {
        console.error('[TEMPORADA] Erro ao encerrar temporada automaticamente:', error);
        // Continuar retornando a temporada expirada se falhar
      }
    }

    return NextResponse.json({
      success: true,
      temporada: {
        id: temporada.temporada_id,
        numero: temporada.numero,
        nome: temporada.nome,
        dataInicio: temporada.data_inicio,
        dataFim: temporada.data_fim,
        diasRestantes: Math.max(0, diasRestantes),
        ativa: temporada.ativa
      }
    });
  } catch (error) {
    console.error('Erro no GET /api/pvp/temporada:', error);
    return NextResponse.json({ error: 'Erro interno do servidor: ' + error.message }, { status: 500 });
  }
}

// POST removido - funcionalidade de criar temporada deve ser migrada para Firebase Cloud Functions
