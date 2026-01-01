import { NextResponse } from 'next/server';
import { getDocuments, updateDocument, getDocument } from '@/lib/firebase/firestore';
import { calcularHPMaximoCompleto } from '@/lib/combat/statsCalculator';
import { aplicarSinergia, calcularHPComSinergia, calcularEnergiaComSinergia } from '@/lib/combat/synergyApplicator';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pvp/room/join
 * Entra em uma sala usando código
 */
export async function POST(request) {
  try {
    const { visitorId, roomCode, suporteId } = await request.json();

    if (!visitorId || !roomCode) {
      return NextResponse.json(
        { error: 'visitorId e roomCode são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar que avatar suporte é obrigatório
    if (!suporteId) {
      return NextResponse.json(
        { error: 'Avatar suporte é obrigatório para entrar em uma sala PVP' },
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

    // Buscar avatar suporte
    const avatarSuporte = await getDocument('avatares', suporteId);

    if (!avatarSuporte || avatarSuporte.user_id !== visitorId) {
      return NextResponse.json(
        { error: 'Avatar suporte não encontrado ou não pertence a você' },
        { status: 404 }
      );
    }

    // AGORA temos ambos os jogadores! Calcular AMBAS as sinergias corretamente
    // NOVO SISTEMA: Suporte (próprio) VS Principal (inimigo)

    // Sinergia do GUEST: Suporte (guest) VS Principal (host)
    const resultadoSinergiaGuest = aplicarSinergia(avatarSuporte, room.host_avatar);

    const sinergiaGuest = {
      sinergiaAtiva: resultadoSinergiaGuest.sinergiaAtiva,
      modificadores: resultadoSinergiaGuest.modificadores,
      logTexto: resultadoSinergiaGuest.logTexto,
      modificadoresFormatados: resultadoSinergiaGuest.modificadoresFormatados,
      avatarSuporte: {
        id: avatarSuporte.id,
        nome: avatarSuporte.nome,
        elemento: avatarSuporte.elemento,
        nivel: avatarSuporte.nivel,
        raridade: avatarSuporte.raridade,
        marca_morte: avatarSuporte.marca_morte || false,
        forca: avatarSuporte.forca,
        agilidade: avatarSuporte.agilidade,
        resistencia: avatarSuporte.resistencia,
        foco: avatarSuporte.foco
      }
    };

    // Sinergia do HOST: Suporte (host) VS Principal (guest)
    const resultadoSinergiaHost = aplicarSinergia(room.host_avatar_suporte, avatar);

    const sinergiaHost = {
      sinergiaAtiva: resultadoSinergiaHost.sinergiaAtiva,
      modificadores: resultadoSinergiaHost.modificadores,
      logTexto: resultadoSinergiaHost.logTexto,
      modificadoresFormatados: resultadoSinergiaHost.modificadoresFormatados,
      avatarSuporte: room.host_avatar_suporte
    };

    console.log('✨ Sinergias calculadas:', {
      guest: {
        suporte: avatarSuporte.nome,
        principalInimigo: room.host_avatar.nome,
        sinergia: resultadoSinergiaGuest.sinergiaAtiva?.nome || 'Nenhuma'
      },
      host: {
        suporte: room.host_avatar_suporte.nome,
        principalInimigo: avatar.nome,
        sinergia: resultadoSinergiaHost.sinergiaAtiva?.nome || 'Nenhuma'
      }
    });

    // Calcular HP e Energia para GUEST com sinergia
    const guestHpMaximoBase = calcularHPMaximoCompleto(avatar);
    const guestHpMaximo = calcularHPComSinergia(guestHpMaximoBase, resultadoSinergiaGuest.modificadores);
    const guestHpAtual = guestHpMaximo; // PVP sempre começa com HP máximo (combate simulado)
    const guestEnergia = calcularEnergiaComSinergia(100, resultadoSinergiaGuest.modificadores);

    // Calcular HP e Energia para HOST com sinergia (recalcular)
    const hostHpMaximoBase = room.host_hp_max; // Era calculado sem sinergia
    const hostHpMaximo = calcularHPComSinergia(hostHpMaximoBase, resultadoSinergiaHost.modificadores);
    const hostHpAtual = hostHpMaximo; // PVP sempre começa com HP máximo (combate simulado)
    const hostEnergia = calcularEnergiaComSinergia(100, resultadoSinergiaHost.modificadores);

    // Atualizar sala com AMBAS as sinergias e stats ajustados
    await updateDocument('pvp_duel_rooms', room.id, {
      // Dados do GUEST
      guest_user_id: visitorId,
      guest_nome: playerStats?.nome_operacao || 'Jogador 2',
      guest_avatar: {
        id: avatar.id,
        nome: avatar.nome,
        hp_maximo: guestHpMaximo,
        hp_atual: guestHpAtual,
        exaustao: avatar.exaustao || 0,
        nivel: avatar.nivel || 1,
        raridade: avatar.raridade || 'comum',
        elemento: avatar.elemento,
        forca: avatar.forca || 10,
        agilidade: avatar.agilidade || 10,
        resistencia: avatar.resistencia || 10,
        foco: avatar.foco || 10,
        habilidades: avatar.habilidades || []
      },
      guest_avatar_suporte: sinergiaGuest.avatarSuporte,
      guest_sinergia: sinergiaGuest,
      guest_hp: guestHpAtual,
      guest_hp_max: guestHpMaximo,
      guest_energy: guestEnergia,
      guest_energy_max: guestEnergia,
      guest_effects: [],
      guest_cooldowns: {},

      // Atualizar dados do HOST com sinergia correta
      host_sinergia: sinergiaHost,
      host_hp_max: hostHpMaximo,
      host_hp: hostHpAtual,
      host_energy: hostEnergia,
      host_energy_max: hostEnergia,

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
