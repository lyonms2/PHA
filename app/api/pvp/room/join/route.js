import { NextResponse } from 'next/server';
import { getDocuments, updateDocument, getDocument } from '@/lib/firebase/firestore';
import { calcularHPMaximoCompleto } from '@/lib/combat/statsCalculator';
import { aplicarPenalidadesExaustao } from '@/app/avatares/sistemas/exhaustionSystem';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pvp/room/join
 * Entra em uma sala usando código
 */
export async function POST(request) {
  try {
    const { visitorId, roomCode } = await request.json();

    if (!visitorId || !roomCode) {
      return NextResponse.json(
        { error: 'visitorId e roomCode são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar sala pelo código
    const rooms = await getDocuments('pvp_duel_rooms', {
      where: [
        ['code', '==', roomCode.toUpperCase()],
        ['status', '==', 'waiting']
      ]
    });

    if (!rooms || rooms.length === 0) {
      return NextResponse.json(
        { error: 'Sala não encontrada ou já está em uso' },
        { status: 404 }
      );
    }

    const room = rooms[0];

    // Verificar se não é o próprio host
    if (room.host_user_id === visitorId) {
      return NextResponse.json(
        { error: 'Você não pode entrar na sua própria sala' },
        { status: 400 }
      );
    }

    // Buscar dados do jogador
    const playerStats = await getDocument('player_stats', visitorId);

    // Buscar avatar ativo do jogador
    const avatares = await getDocuments('avatares', [
      { field: 'user_id', operator: '==', value: visitorId },
      { field: 'ativo', operator: '==', value: true }
    ]);

    if (!avatares || avatares.length === 0) {
      return NextResponse.json(
        { error: 'Você precisa ter um avatar ativo para entrar em uma sala PVP' },
        { status: 400 }
      );
    }

    const avatar = avatares[0];

    // Validar estado do avatar
    if ((avatar.hp_atual || 0) <= 0) {
      return NextResponse.json(
        { error: 'Seu avatar está morto. Descanse antes de batalhar!' },
        { status: 400 }
      );
    }

    if ((avatar.exaustao || 0) >= 100) {
      return NextResponse.json(
        { error: 'Seu avatar está completamente exausto. Descanse antes de batalhar!' },
        { status: 400 }
      );
    }

    // Calcular HP máximo do avatar
    const hpMaximo = calcularHPMaximoCompleto(avatar);
    const hpAtual = Math.min(avatar.hp_atual || hpMaximo, hpMaximo);

    // Aplicar penalidades de exaustão nos stats
    const statsBase = {
      forca: avatar.forca || 10,
      agilidade: avatar.agilidade || 10,
      resistencia: avatar.resistencia || 10,
      foco: avatar.foco || 10
    };
    const statsComPenalidades = aplicarPenalidadesExaustao(statsBase, avatar.exaustao || 0);

    // Atualizar sala com o convidado
    await updateDocument('pvp_duel_rooms', room.id, {
      guest_user_id: visitorId,
      guest_nome: playerStats?.nome_operacao || 'Jogador 2',
      guest_avatar: {
        id: avatar.id,
        nome: avatar.nome,
        hp_maximo: hpMaximo,
        hp_atual: hpAtual,
        exaustao: avatar.exaustao || 0,
        nivel: avatar.nivel || 1,
        raridade: avatar.raridade || 'comum',
        ...statsComPenalidades // Stats com penalidades de exaustão aplicadas
      },
      guest_hp: hpAtual,
      status: 'ready'
    });

    return NextResponse.json({
      success: true,
      roomId: room.id,
      hostNome: room.host_nome
    });

  } catch (error) {
    console.error('Erro em POST /api/pvp/room/join:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
