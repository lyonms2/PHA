// ==================== API: ATUALIZAR STATS DO AVATAR E CAÇADOR ====================
// Arquivo: /app/api/meus-avatares/atualizar-stats/route.js
//
// Atualiza XP, Vínculo, Exaustão do avatar e XP do caçador após treino

import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';
import { processarGanhoXP } from '@/app/avatares/sistemas/progressionSystem';

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
    const vinculoAtual = avatarData.vinculo || 0;
    const exaustaoAtual = avatarData.exaustao || 0;

    const novoVinculo = Math.min(100, Math.max(0, vinculoAtual + (vinculo || 0)));
    const novaExaustao = Math.min(100, Math.max(0, exaustaoAtual + (exaustao || 0)));

    // === PROCESSAR XP E LEVEL UP COM SISTEMA COMPLETO ===
    let levelUpData = null;
    let novoNivel = avatarData.nivel || 1;
    let novoXP = avatarData.experiencia || 0;
    let statsNovos = null;

    if (xp && xp > 0) {
      const resultadoXP = processarGanhoXP(avatarData, xp);

      novoNivel = resultadoXP.nivelAtual;
      novoXP = resultadoXP.xpAtual;

      if (resultadoXP.levelUps > 0) {
        // Avatar subiu de nível!
        statsNovos = resultadoXP.statsNovos;
        levelUpData = {
          levelUp: true,
          nivelAnterior: resultadoXP.nivelAnterior,
          novoNivel: resultadoXP.nivelAtual,
          levelUps: resultadoXP.levelUps,
          statsNovos: resultadoXP.statsNovos,
          recompensas: resultadoXP.recompensas,
          mensagens: resultadoXP.mensagens
        };

        console.log('🎉 LEVEL UP!', {
          avatar: avatarData.nome,
          nivelAnterior: resultadoXP.nivelAnterior,
          novoNivel: resultadoXP.nivelAtual,
          statsNovos: statsNovos
        });
      }
    }

    // Calcular novos valores do CAÇADOR (Hunter/Player)
    // Sistema de Hunter Rank usa hunterRankXp
    const hunterRankXpAtual = (playerStats?.hunterRankXp) || 0;
    const novoHunterRankXp = Math.max(0, hunterRankXpAtual + (xpCacador || 0));

    // Atualizar AVATAR no Firestore
    const avatarUpdate = {
      experiencia: novoXP,
      vinculo: novoVinculo,
      exaustao: novaExaustao,
      nivel: novoNivel,
      ultima_atualizacao_stats: agora // Timestamp para proteção anti-duplicação
    };

    // Se subiu de nível, atualizar stats!
    if (statsNovos) {
      avatarUpdate.forca = statsNovos.forca;
      avatarUpdate.agilidade = statsNovos.agilidade;
      avatarUpdate.resistencia = statsNovos.resistencia;
      avatarUpdate.foco = statsNovos.foco;
    }

    // HP só atualiza se fornecido (para treino, permanece o mesmo)
    if (hp !== undefined && hp !== null) {
      avatarUpdate.hp_atual = hp;
    }

    await updateDocument('avatares', avatarId, avatarUpdate);

    // Rastrear vínculo ganho para missões diárias (se houver vínculo ganho)
    if (vinculo && vinculo > 0) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/missoes/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            tipoEvento: 'GANHAR_VINCULO',
            incremento: vinculo
          })
        }).catch(err => console.error('[MISSÕES] Erro ao rastrear vínculo:', err));
      } catch (error) {
        console.error('[MISSÕES] Erro ao rastrear vínculo:', error);
      }
    }

    // Atualizar CAÇADOR no Firestore (se playerStats existe)
    if (playerStats) {
      await updateDocument('player_stats', userId, {
        hunterRankXp: novoHunterRankXp
      });
    }

    console.log('✅ Stats atualizados:', {
      avatar: avatarData.nome,
      experiencia: `${avatarData.experiencia || 0} → ${novoXP}`,
      vinculo: `${vinculoAtual} → ${novoVinculo}`,
      exaustao: `${exaustaoAtual} → ${novaExaustao}`,
      nivel: novoNivel,
      subiuNivel: levelUpData !== null,
      cacador: {
        hunterRankXp: `${hunterRankXpAtual} → ${novoHunterRankXp}`
      }
    });

    return NextResponse.json({
      success: true,
      avatar: {
        experiencia: novoXP,
        vinculo: novoVinculo,
        exaustao: novaExaustao,
        nivel: novoNivel,
        subiuNivel: levelUpData !== null,
        hp: hp !== undefined ? hp : avatarData.hp_atual
      },
      cacador: {
        hunterRankXp: novoHunterRankXp,
        ganhouXp: xpCacador || 0
      },
      ...levelUpData // Inclui dados de level up se houver
    });

  } catch (error) {
    console.error('Erro ao atualizar stats:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', message: error.message },
      { status: 500 }
    );
  }
}
