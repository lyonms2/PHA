import { NextResponse } from 'next/server';
import { createDocument, getDocuments, deleteDocument, getDocument, updateDocument } from '@/lib/firebase/firestore';
import { aplicarSinergia, calcularHPComSinergia, calcularEnergiaComSinergia } from '@/lib/combat/synergyApplicator';
import { calcularHPMaximoCompleto } from '@/lib/combat/statsCalculator';

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
    const { visitorId, action, targetId, minPower, maxPower, avatar, suporteId } = await request.json();

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
          suporte_id: suporteId || null,
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
        suporte_id: suporteId || null,
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

      // ====== BUSCAR E APLICAR SINERGIA DO HOST (desafiante) ======
      let hostSinergiaInfo = null;
      let hostAvatarSuporte = null;
      let hostHpMax = calcularHpMaximo(challenge.avatar);
      let hostEnergy = 100;
      let hostEnergyMax = 100;

      if (challenge.suporte_id) {
        hostAvatarSuporte = await getDocument('avatares', challenge.suporte_id);

        if (hostAvatarSuporte && challenge.avatar) {
          const resultadoSinergia = aplicarSinergia(challenge.avatar, hostAvatarSuporte);

          hostSinergiaInfo = {
            ...resultadoSinergia.sinergiaAtiva,
            modificadores: resultadoSinergia.modificadores,
            logTexto: resultadoSinergia.logTexto,
            avatarSuporte: {
              id: hostAvatarSuporte.id,
              nome: hostAvatarSuporte.nome,
              elemento: hostAvatarSuporte.elemento,
              nivel: hostAvatarSuporte.nivel,
              raridade: hostAvatarSuporte.raridade,
              marca_morte: hostAvatarSuporte.marca_morte || false,
              forca: hostAvatarSuporte.forca,
              agilidade: hostAvatarSuporte.agilidade,
              resistencia: hostAvatarSuporte.resistencia,
              foco: hostAvatarSuporte.foco
            }
          };

          // Recalcular HP e Energia com modificadores de sinergia
          const hpMaximoBase = calcularHPMaximoCompleto(challenge.avatar);
          hostHpMax = calcularHPComSinergia(hpMaximoBase, resultadoSinergia.modificadores);
          hostEnergy = calcularEnergiaComSinergia(100, resultadoSinergia.modificadores);
          hostEnergyMax = hostEnergy;
        }
      }

      const hostHpAtual = Math.min(challenge.hp_atual || hostHpMax, hostHpMax);

      // ====== BUSCAR E APLICAR SINERGIA DO GUEST (aceitante) ======
      let guestSinergiaInfo = null;
      let guestAvatarSuporte = null;
      let guestHpMax = calcularHpMaximo(myEntry?.avatar);
      let guestEnergy = 100;
      let guestEnergyMax = 100;

      if (myEntry?.suporte_id) {
        guestAvatarSuporte = await getDocument('avatares', myEntry.suporte_id);

        if (guestAvatarSuporte && myEntry.avatar) {
          const resultadoSinergia = aplicarSinergia(myEntry.avatar, guestAvatarSuporte);

          guestSinergiaInfo = {
            ...resultadoSinergia.sinergiaAtiva,
            modificadores: resultadoSinergia.modificadores,
            logTexto: resultadoSinergia.logTexto,
            avatarSuporte: {
              id: guestAvatarSuporte.id,
              nome: guestAvatarSuporte.nome,
              elemento: guestAvatarSuporte.elemento,
              nivel: guestAvatarSuporte.nivel,
              raridade: guestAvatarSuporte.raridade,
              marca_morte: guestAvatarSuporte.marca_morte || false,
              forca: guestAvatarSuporte.forca,
              agilidade: guestAvatarSuporte.agilidade,
              resistencia: guestAvatarSuporte.resistencia,
              foco: guestAvatarSuporte.foco
            }
          };

          // Recalcular HP e Energia com modificadores de sinergia
          const hpMaximoBase = calcularHPMaximoCompleto(myEntry.avatar);
          guestHpMax = calcularHPComSinergia(hpMaximoBase, resultadoSinergia.modificadores);
          guestEnergy = calcularEnergiaComSinergia(100, resultadoSinergia.modificadores);
          guestEnergyMax = guestEnergy;
        }
      }

      const guestHpAtual = Math.min(myEntry?.hp_atual || guestHpMax, guestHpMax);

      // ====== CRIAR SALA COM DADOS COMPLETOS ======
      const roomId = await createDocument('pvp_duel_rooms', {
        code: null,
        host_user_id: challengerId,
        host_nome: challengerStats?.nome_operacao || 'Jogador 1',
        host_avatar: {
          ...challenge.avatar,
          hp_maximo: hostHpMax,
          hp_atual: hostHpAtual,
          habilidades: challenge.avatar?.habilidades || []
        },
        host_avatar_suporte: hostSinergiaInfo?.avatarSuporte || null,
        host_sinergia: hostSinergiaInfo || null,
        host_hp: hostHpAtual,
        host_hp_max: hostHpMax,
        host_energy: hostEnergy,
        host_energy_max: hostEnergyMax,
        host_effects: [],
        host_cooldowns: {},
        guest_user_id: visitorId,
        guest_nome: targetStats?.nome_operacao || 'Jogador 2',
        guest_avatar: {
          ...myEntry?.avatar,
          hp_maximo: guestHpMax,
          hp_atual: guestHpAtual,
          habilidades: myEntry?.avatar?.habilidades || []
        },
        guest_avatar_suporte: guestSinergiaInfo?.avatarSuporte || null,
        guest_sinergia: guestSinergiaInfo || null,
        guest_hp: guestHpAtual,
        guest_hp_max: guestHpMax,
        guest_energy: guestEnergy,
        guest_energy_max: guestEnergyMax,
        guest_effects: [],
        guest_cooldowns: {},
        status: 'active',
        host_ready: true,
        guest_ready: true,
        current_turn: 'host',
        battle_log: [],
        created_at: new Date().toISOString()
      });

      console.log('✨ Sala PVP criada via lobby com sinergias:', {
        roomId,
        host: {
          nome: challenge.avatar?.nome,
          suporte: hostSinergiaInfo?.avatarSuporte?.nome || 'Nenhum',
          sinergia: hostSinergiaInfo?.nome || 'Nenhuma'
        },
        guest: {
          nome: myEntry?.avatar?.nome,
          suporte: guestSinergiaInfo?.avatarSuporte?.nome || 'Nenhum',
          sinergia: guestSinergiaInfo?.nome || 'Nenhuma'
        }
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
