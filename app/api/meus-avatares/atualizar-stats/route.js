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
    const [avatarData, userData] = await Promise.all([
      getDocument('avatares', avatarId),
      getDocument('usuarios', userId)
    ]);

    if (!avatarData) {
      return NextResponse.json(
        { error: 'Avatar não encontrado' },
        { status: 404 }
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
    const xpCacadorAtual = userData.xp || 0;
    const nivelCacadorAtual = userData.nivel || 1;

    const novoXPCacador = Math.max(0, xpCacadorAtual + (xpCacador || 0));

    // Verificar subida de nível do caçador (100 XP por nível)
    const xpNecessarioCacador = nivelCacadorAtual * 100;
    let novoNivelCacador = nivelCacadorAtual;
    let subiuNivelCacador = false;

    if (novoXPCacador >= xpNecessarioCacador && xpCacadorAtual < xpNecessarioCacador) {
      novoNivelCacador = nivelCacadorAtual + 1;
      subiuNivelCacador = true;
    }

    // Atualizar AVATAR no Firestore
    const avatarUpdate = {
      xp: novoXP,
      vinculo: novoVinculo,
      exaustao: novaExaustao,
      nivel: novoNivel
    };

    // HP só atualiza se fornecido (para treino, permanece o mesmo)
    if (hp !== undefined && hp !== null) {
      avatarUpdate.hp_atual = hp;
    }

    await updateDocument('avatares', avatarId, avatarUpdate);

    // Atualizar CAÇADOR no Firestore (se userData existe)
    if (userData) {
      await updateDocument('usuarios', userId, {
        xp: novoXPCacador,
        nivel: novoNivelCacador
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
        xp: `${xpCacadorAtual} → ${novoXPCacador}`,
        nivel: novoNivelCacador,
        subiuNivel: subiuNivelCacador
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
        hp: hp !== undefined ? hp : avatarData.hp
      },
      cacador: {
        xp: novoXPCacador,
        nivel: novoNivelCacador,
        subiuNivel: subiuNivelCacador
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
