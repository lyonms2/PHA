import { NextResponse } from 'next/server';
import { createDocument, getDocument, getDocuments } from '@/lib/firebase/firestore';
import { calcularHPMaximoCompleto } from '@/lib/combat/statsCalculator';
import { aplicarPenalidadesExaustao } from '@/app/avatares/sistemas/exhaustionSystem';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pvp/room/create
 * Cria uma sala de duelo com código de convite
 */
export async function POST(request) {
  try {
    const { userId, visitorId } = await request.json();

    if (!userId || !visitorId) {
      return NextResponse.json(
        { error: 'userId e visitorId são obrigatórios' },
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
        { error: 'Você precisa ter um avatar ativo para criar uma sala PVP' },
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

    // Gerar código de 6 caracteres
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Criar sala com dados completos do avatar
    const roomId = await createDocument('pvp_duel_rooms', {
      code: roomCode,
      host_user_id: visitorId,
      host_nome: playerStats?.nome_operacao || 'Jogador 1',
      host_avatar: {
        id: avatar.id,
        nome: avatar.nome,
        hp_maximo: hpMaximo,
        hp_atual: hpAtual,
        exaustao: avatar.exaustao || 0,
        nivel: avatar.nivel || 1,
        raridade: avatar.raridade || 'comum',
        ...statsComPenalidades // Stats com penalidades de exaustão aplicadas
      },
      host_bet: 0, // Aposta do host (será definida antes de iniciar)
      guest_user_id: null,
      guest_nome: null,
      guest_avatar: null,
      guest_bet: 0,
      status: 'waiting', // waiting, ready, active, finished
      host_ready: false,
      guest_ready: false,
      host_hp: hpAtual,
      guest_hp: 0,
      current_turn: 'host', // host ou guest
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutos
    });

    return NextResponse.json({
      success: true,
      roomId,
      roomCode
    });

  } catch (error) {
    console.error('Erro em POST /api/pvp/room/create:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
