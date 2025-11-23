import { NextResponse } from 'next/server';
import { createDocument, getDocuments, deleteDocument, getDocument, updateDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

// Calcular HP máximo baseado nos stats
const calcularHpMaximo = (avatar) => {
  if (!avatar) return 100;

  const resistencia = avatar.resistencia || 10;
  const nivel = avatar.nivel || 1;
  const raridade = avatar.raridade || 'Comum';

  // Bônus de raridade
  let bonusRaridade = 0;
  if (raridade === 'Lendário' || raridade === 'Mítico') bonusRaridade = 100;
  else if (raridade === 'Épico') bonusRaridade = 75;
  else if (raridade === 'Raro') bonusRaridade = 50;
  else if (raridade === 'Incomum') bonusRaridade = 25;

  return (resistencia * 10) + (nivel * 5) + bonusRaridade;
};

/**
 * GET /api/pvp/lobby
 * Lista jogadores no lobby esperando duelo
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const visitorId = searchParams.get('visitorId');
    const minPower = parseInt(searchParams.get('minPower') || '0');
    const maxPower = parseInt(searchParams.get('maxPower') || '999');

    // Limpar entradas expiradas (mais de 2 minutos)
    const allEntries = await getDocuments('pvp_lobby', {});
    const now = new Date();

    for (const entry of allEntries || []) {
      const createdAt = new Date(entry.created_at);
      if (now - createdAt > 2 * 60 * 1000) {
        await deleteDocument('pvp_lobby', entry.id);
      }
    }

    // Buscar jogadores no lobby com filtro de poder
    const allPlayers = await getDocuments('pvp_lobby', {
      where: [['status', '==', 'waiting']]
    });

    // Filtrar por faixa de poder
    const players = (allPlayers || []).filter(p => {
      const playerMin = p.minPower || 0;
      const playerMax = p.maxPower || 999;
      // Jogador está na mesma sala se as faixas coincidem
      return playerMin === minPower && playerMax === maxPower;
    });

    // Buscar desafios pendentes para o usuário atual
    let pendingChallenge = null;
    let acceptedRoom = null;

    if (visitorId) {
      // Verificar se alguém te desafiou
      const challenges = await getDocuments('pvp_lobby', {
        where: [
          ['target_id', '==', visitorId],
          ['status', '==', 'challenging']
        ]
      });
      if (challenges && challenges.length > 0) {
        pendingChallenge = challenges[0];
      }

      // Verificar se seu desafio foi aceito (você tem um room_id)
      const myEntries = await getDocuments('pvp_lobby', {
        where: [['visitorId', '==', visitorId]]
      });
      if (myEntries && myEntries.length > 0 && myEntries[0].room_id) {
        acceptedRoom = myEntries[0].room_id;
        // Limpar entrada do lobby
        await deleteDocument('pvp_lobby', myEntries[0].id);
      }
    }

    return NextResponse.json({
      success: true,
      players: players || [],
      pendingChallenge,
      acceptedRoom
    });

  } catch (error) {
    console.error('Erro em GET /api/pvp/lobby:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pvp/lobby
 * Ações: enter, leave, challenge, accept, reject
 */
export async function POST(request) {
  try {
    const { visitorId, action, targetId, minPower, maxPower, avatar } = await request.json();

    if (!visitorId || !action) {
      return NextResponse.json(
        { error: 'visitorId e action são obrigatórios' },
        { status: 400 }
      );
    }

    // Entrar no lobby
    if (action === 'enter') {
      // Verificar se já está no lobby
      const existing = await getDocuments('pvp_lobby', {
        where: [['visitorId', '==', visitorId]]
      });

      if (existing && existing.length > 0) {
        // Atualizar entrada existente com novos dados
        const hpMax = calcularHpMaximo(avatar);
        await updateDocument('pvp_lobby', existing[0].id, {
          minPower: minPower || 0,
          maxPower: maxPower || 999,
          avatar: avatar || null,
          poder: avatar ? (avatar.forca + avatar.agilidade + avatar.resistencia + avatar.foco) : 0,
          hp_atual: avatar?.hp_atual || hpMax,
          hp_maximo: hpMax,
          exaustao: avatar?.exaustao || 0,
          created_at: new Date().toISOString()
        });
        return NextResponse.json({ success: true, message: 'Atualizado no lobby' });
      }

      // Buscar nome do jogador
      const playerStats = await getDocument('player_stats', visitorId);
      const hpMax = calcularHpMaximo(avatar);

      await createDocument('pvp_lobby', {
        visitorId,
        nome: playerStats?.nome_operacao || 'Jogador',
        status: 'waiting',
        target_id: null,
        minPower: minPower || 0,
        maxPower: maxPower || 999,
        avatar: avatar || null,
        poder: avatar ? (avatar.forca + avatar.agilidade + avatar.resistencia + avatar.foco) : 0,
        hp_atual: avatar?.hp_atual || hpMax,
        hp_maximo: hpMax,
        exaustao: avatar?.exaustao || 0,
        created_at: new Date().toISOString()
      });

      return NextResponse.json({ success: true, message: 'Entrou no lobby' });
    }

    // Sair do lobby
    if (action === 'leave') {
      const entries = await getDocuments('pvp_lobby', {
        where: [['visitorId', '==', visitorId]]
      });

      for (const entry of entries || []) {
        await deleteDocument('pvp_lobby', entry.id);
      }

      return NextResponse.json({ success: true, message: 'Saiu do lobby' });
    }

    // Desafiar jogador
    if (action === 'challenge') {
      if (!targetId) {
        return NextResponse.json(
          { error: 'targetId é obrigatório para desafiar' },
          { status: 400 }
        );
      }

      // Atualizar status do desafiante
      const myEntries = await getDocuments('pvp_lobby', {
        where: [['visitorId', '==', visitorId]]
      });

      if (!myEntries || myEntries.length === 0) {
        return NextResponse.json(
          { error: 'Você não está no lobby' },
          { status: 400 }
        );
      }

      // Buscar nome do desafiante
      const playerStats = await getDocument('player_stats', visitorId);

      // Atualizar para challenging
      await updateDocument('pvp_lobby', myEntries[0].id, {
        status: 'challenging',
        target_id: targetId,
        challenger_nome: playerStats?.nome_operacao || 'Jogador'
      });

      return NextResponse.json({ success: true, message: 'Desafio enviado' });
    }

    // Aceitar desafio
    if (action === 'accept') {
      // Buscar o desafio
      const challenges = await getDocuments('pvp_lobby', {
        where: [
          ['target_id', '==', visitorId],
          ['status', '==', 'challenging']
        ]
      });

      if (!challenges || challenges.length === 0) {
        return NextResponse.json(
          { error: 'Nenhum desafio encontrado' },
          { status: 404 }
        );
      }

      const challenge = challenges[0];
      const challengerId = challenge.visitorId;

      // Buscar dados dos jogadores
      const challengerStats = await getDocument('player_stats', challengerId);
      const targetStats = await getDocument('player_stats', visitorId);

      // Buscar entrada do aceitante para pegar avatar
      const myEntries = await getDocuments('pvp_lobby', {
        where: [['visitorId', '==', visitorId]]
      });
      const myEntry = myEntries && myEntries.length > 0 ? myEntries[0] : null;

      // Criar sala de duelo com avatares e energia
      // Usar HP real dos avatares (calculado corretamente)
      const hostHpMax = challenge.hp_maximo || calcularHpMaximo(challenge.avatar);
      const hostHpAtual = challenge.hp_atual || hostHpMax;
      const hostExaustao = challenge.exaustao || 0;
      const guestHpMax = myEntry?.hp_maximo || calcularHpMaximo(myEntry?.avatar);
      const guestHpAtual = myEntry?.hp_atual || guestHpMax;
      const guestExaustao = myEntry?.exaustao || 0;

      const roomId = await createDocument('pvp_duel_rooms', {
        code: null,
        host_user_id: challengerId,
        host_nome: challengerStats?.nome_operacao || 'Jogador 1',
        host_avatar: challenge.avatar || null,
        host_hp: hostHpAtual,
        host_hp_max: hostHpMax,
        host_exaustao: hostExaustao,
        guest_user_id: visitorId,
        guest_nome: targetStats?.nome_operacao || 'Jogador 2',
        guest_avatar: myEntry?.avatar || null,
        guest_hp: guestHpAtual,
        guest_hp_max: guestHpMax,
        guest_exaustao: guestExaustao,
        status: 'active',
        host_ready: true,
        guest_ready: true,
        host_energy: 100,
        guest_energy: 100,
        current_turn: 'host',
        created_at: new Date().toISOString()
      });

      // Atualizar entrada do desafiante com o roomId
      await updateDocument('pvp_lobby', challenge.id, {
        room_id: roomId,
        status: 'matched'
      });

      // Remover entrada do aceitante do lobby
      for (const entry of myEntries || []) {
        await deleteDocument('pvp_lobby', entry.id);
      }

      return NextResponse.json({
        success: true,
        roomId,
        message: 'Desafio aceito! Batalha iniciada!'
      });
    }

    // Recusar desafio
    if (action === 'reject') {
      const challenges = await getDocuments('pvp_lobby', {
        where: [
          ['target_id', '==', visitorId],
          ['status', '==', 'challenging']
        ]
      });

      if (challenges && challenges.length > 0) {
        await updateDocument('pvp_lobby', challenges[0].id, {
          status: 'waiting',
          target_id: null
        });
      }

      return NextResponse.json({ success: true, message: 'Desafio recusado' });
    }

    return NextResponse.json(
      { error: 'Ação inválida' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Erro em POST /api/pvp/lobby:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
