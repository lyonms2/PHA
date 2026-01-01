import { NextResponse } from 'next/server';
import { getDocuments, deleteDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/cleanup
 * Deleta salas PVP finalizadas há mais de 24 horas
 * Pode ser chamado por cron job ou manualmente
 */
export async function GET(request) {
  try {
    console.log('🧹 [PVP CLEANUP] Iniciando limpeza de salas antigas...');

    // Buscar todas as salas finalizadas
    const rooms = await getDocuments('pvp_duel_rooms', {
      where: [['status', '==', 'finished']]
    });

    if (!rooms || rooms.length === 0) {
      console.log('✅ [PVP CLEANUP] Nenhuma sala finalizada encontrada');
      return NextResponse.json({
        success: true,
        message: 'Nenhuma sala para limpar',
        deleted: 0
      });
    }

    console.log(`📊 [PVP CLEANUP] Encontradas ${rooms.length} salas finalizadas`);

    // Calcular tempo limite (24 horas atrás)
    const now = new Date();
    const limite24h = new Date(now.getTime() - (24 * 60 * 60 * 1000));

    let deletadas = 0;
    const roomsParaDeletar = [];

    // Identificar salas antigas
    for (const room of rooms) {
      if (room.finished_at) {
        const finishedAt = new Date(room.finished_at);

        if (finishedAt < limite24h) {
          roomsParaDeletar.push(room);
        }
      }
    }

    console.log(`🗑️  [PVP CLEANUP] ${roomsParaDeletar.length} salas com mais de 24h serão deletadas`);

    // Deletar salas antigas
    for (const room of roomsParaDeletar) {
      try {
        await deleteDocument('pvp_duel_rooms', room.id);
        deletadas++;
        console.log(`✅ [PVP CLEANUP] Sala deletada: ${room.id} (finalizada em ${room.finished_at})`);
      } catch (error) {
        console.error(`❌ [PVP CLEANUP] Erro ao deletar sala ${room.id}:`, error);
      }
    }

    console.log(`🎯 [PVP CLEANUP] Limpeza concluída: ${deletadas}/${roomsParaDeletar.length} salas deletadas`);

    return NextResponse.json({
      success: true,
      message: `Limpeza concluída com sucesso`,
      total_finalizadas: rooms.length,
      antigas: roomsParaDeletar.length,
      deleted: deletadas
    });

  } catch (error) {
    console.error('❌ [PVP CLEANUP] Erro durante limpeza:', error);
    return NextResponse.json(
      { error: 'Erro ao limpar salas PVP' },
      { status: 500 }
    );
  }
}
