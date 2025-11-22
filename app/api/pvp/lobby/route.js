import { NextResponse } from 'next/server';
import { createDocument, getDocuments, deleteDocument, getDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pvp/lobby
 * Lista jogadores no lobby esperando duelo
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const visitorId = searchParams.get('visitorId');

    // Limpar entradas expiradas (mais de 2 minutos)
    const allEntries = await getDocuments('pvp_lobby', {});
    const now = new Date();

    for (const entry of allEntries || []) {
      const createdAt = new Date(entry.created_at);
      if (now - createdAt > 2 * 60 * 1000) {
        await deleteDocument('pvp_lobby', entry.id);
      }
    }

    // Buscar jogadores no lobby
    const players = await getDocuments('pvp_lobby', {
      where: [['status', '==', 'waiting']]
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
    const { visitorId, action, targetId } = await request.json();

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
        return NextResponse.json({ success: true, message: 'Já está no lobby' });
      }

      // Buscar nome do jogador
      const playerStats = await getDocument('player_stats', visitorId);

      await createDocument('pvp_lobby', {
        visitorId,
        nome: playerStats?.nome_operacao || 'Jogador',
        status: 'waiting',
        target_id: null,
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
      const { updateDocument } = await import('@/lib/firebase/firestore');
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

      // Buscar nomes
      const challengerStats = await getDocument('player_stats', challengerId);
      const targetStats = await getDocument('player_stats', visitorId);

      // Criar sala de duelo
      const roomId = await createDocument('pvp_duel_rooms', {
        code: null,
        host_user_id: challengerId,
        host_nome: challengerStats?.nome_operacao || 'Jogador 1',
        guest_user_id: visitorId,
        guest_nome: targetStats?.nome_operacao || 'Jogador 2',
        status: 'active', // Já ativa!
        host_ready: true,
        guest_ready: true,
        host_hp: 100,
        guest_hp: 100,
        current_turn: 'host',
        created_at: new Date().toISOString()
      });

      // Atualizar entrada do desafiante com o roomId (para ele detectar via polling)
      const { updateDocument } = await import('@/lib/firebase/firestore');
      await updateDocument('pvp_lobby', challenge.id, {
        room_id: roomId,
        status: 'matched'
      });

      // Remover entrada do aceitante do lobby
      const myEntries = await getDocuments('pvp_lobby', {
        where: [['visitorId', '==', visitorId]]
      });
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
        const { updateDocument } = await import('@/lib/firebase/firestore');
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
