// ==================== API: ATUALIZAR STATS DO AVATAR E CAÇADOR ====================
// Arquivo: /app/api/meus-avatares/atualizar-stats/route.js
//
// Atualiza XP, Vínculo, Exaustão do avatar e XP do caçador após treino

import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { userId, avatarId, xp, vinculo, exaustao, hp, xpCacador } = await request.json();

    if (!userId || !avatarId) {
      return NextResponse.json(
        { error: 'userId e avatarId são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar dados atuais
    const [avatarData, playerStats] = await Promise.all([
      getDocument('avatares', avatarId),
      getDocument('player_stats', userId)
    ]);

    if (!avatarData) {
      return NextResponse.json(
        { error: 'Avatar não encontrado' },
        { status: 404 }
      );
    }

    if (!playerStats) {
      console.warn(`⚠️ Player Stats ${userId} não encontrado no Firestore. Atualizando apenas o avatar.`);
    }

    // PROTEÇÃO ANTI-DUPLICAÇÃO: verificar timestamp da última atualização
    const agora = Date.now();
    const ultimaAtualizacao = avatarData.ultima_atualizacao_stats || 0;
    const intervaloMinimo = 1000; // 1 segundo entre updates

    if (agora - ultimaAtualizacao < intervaloMinimo) {
      console.warn(`⚠️ [ANTI-DUPLICAÇÃO] Tentativa de update muito rápida bloqueada! Avatar: ${avatarData.nome}`);
      return NextResponse.json(
        { error: 'Aguarde antes de aplicar recompensas novamente', bloqueado: true },
        { status: 429 } // Too Many Requests
      );
    }

    // Calcular novos valores do AVATAR
    const xpAtual = avatarData.xp || 0;
    const vinculoAtual = avatarData.vinculo || 0;
    const exaustaoAtual = avatarData.exaustao || 0;
    const nivelAtual = avatarData.nivel || 1;

    const novoXP = Math.max(0, xpAtual + (xp || 0));
    const novoVinculo = Math.min(100, Math.max(0, vinculoAtual + (vinculo || 0)));
    const novaExaustao = Math.min(100, Math.max(0, exaustaoAtual + (exaustao || 0)));

    // Verificar subida de nível (100 XP por nível)
    const xpNecessario = nivelAtual * 100;
    let novoNivel = nivelAtual;
    let subiuNivel = false;

    if (novoXP >= xpNecessario && xpAtual < xpNecessario) {
      novoNivel = nivelAtual + 1;
      subiuNivel = true;
    }

    // Calcular novos valores do CAÇADOR (Hunter/Player)
    // Sistema de Hunter Rank usa hunterRankXp
    const hunterRankXpAtual = (playerStats?.hunterRankXp) || 0;
    const novoHunterRankXp = Math.max(0, hunterRankXpAtual + (xpCacador || 0));

    // Atualizar AVATAR no Firestore
    const avatarUpdate = {
      xp: novoXP,
      vinculo: novoVinculo,
      exaustao: novaExaustao,
      nivel: novoNivel,
      ultima_atualizacao_stats: agora // Timestamp para proteção anti-duplicação
    };

    // HP só atualiza se fornecido (para treino, permanece o mesmo)
    if (hp !== undefined && hp !== null) {
      avatarUpdate.hp_atual = hp;
    }

    await updateDocument('avatares', avatarId, avatarUpdate);

    // Atualizar CAÇADOR no Firestore (se playerStats existe)
    if (playerStats) {
      await updateDocument('player_stats', userId, {
        hunterRankXp: novoHunterRankXp
      });
    }

    console.log('✅ Stats atualizados:', {
      avatar: avatarData.nome,
      xp: `${xpAtual} → ${novoXP}`,
      vinculo: `${vinculoAtual} → ${novoVinculo}`,
      exaustao: `${exaustaoAtual} → ${novaExaustao}`,
      nivel: novoNivel,
      subiuNivel,
      cacador: {
        hunterRankXp: `${hunterRankXpAtual} → ${novoHunterRankXp}`
      }
    });

    return NextResponse.json({
      success: true,
      avatar: {
        xp: novoXP,
        vinculo: novoVinculo,
        exaustao: novaExaustao,
        nivel: novoNivel,
        subiuNivel,
        hp: hp !== undefined ? hp : avatarData.hp_atual
      },
      cacador: {
        hunterRankXp: novoHunterRankXp,
        ganhouXp: xpCacador || 0
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar stats:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', message: error.message },
      { status: 500 }
    );
  }
}
