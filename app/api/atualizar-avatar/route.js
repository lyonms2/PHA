// ==================== API: ATUALIZAR AVATAR ====================
// Arquivo: /app/api/atualizar-avatar/route.js

import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';
import { processarGanhoXP } from '@/app/avatares/sistemas/progressionSystem';
import { getNivelVinculo } from '@/app/avatares/sistemas/bondSystem';
import { validateRequest } from '@/lib/api/middleware';
import { trackMissionProgress } from '@/lib/missions/missionTracker';

export async function POST(request) {
  try {
    // Validar que avatarId está presente
    const validation = await validateRequest(request, ['avatarId']);
    if (!validation.valid) return validation.response;

    const { avatarId, experiencia, exaustao, vinculo, hp_atual, nivel, forca, agilidade, resistencia, foco } = validation.body;

    // Buscar avatar atual do Firestore
    const avatarAtual = await getDocument('avatares', avatarId);

    if (!avatarAtual) {
      console.error('Avatar não encontrado');
      return NextResponse.json(
        { message: 'Avatar não encontrado' },
        { status: 404 }
      );
    }

    // === PROCESSAR XP E LEVEL UP ===
    let levelUpData = null;
    let novoNivel = avatarAtual.nivel;
    let novaExperiencia = avatarAtual.experiencia || 0;

    if (experiencia && experiencia > 0) {
      const resultadoXP = processarGanhoXP(avatarAtual, experiencia);
      
      novoNivel = resultadoXP.nivelAtual;
      novaExperiencia = resultadoXP.xpAtual;

      if (resultadoXP.levelUps > 0) {
        levelUpData = {
          levelUp: true,
          nivelAnterior: resultadoXP.nivelAnterior,
          novoNivel: resultadoXP.nivelAtual,
          levelUps: resultadoXP.levelUps,
          statsNovos: resultadoXP.statsNovos,
          recompensas: resultadoXP.recompensas,
          mensagens: resultadoXP.mensagens
        };

        // Atualizar stats se subiu de nível
        const { forca, agilidade, resistencia, foco } = resultadoXP.statsNovos;

        await updateDocument('avatares', avatarId, {
          forca,
          agilidade,
          resistencia,
          foco
        });

        // Rastrear progresso de missões (não bloqueia se falhar)
        // Rastrear cada nível ganho
        if (avatarAtual.user_id) {
          trackMissionProgress(avatarAtual.user_id, 'GANHAR_NIVEL', resultadoXP.levelUps);
        }
      }
    }

    // === PROCESSAR EXAUSTÃO ===
    const novaExaustao = Math.min(100, (avatarAtual.exaustao || 0) + (exaustao || 0));

    // === PROCESSAR VÍNCULO ===
    let novoVinculo = avatarAtual.vinculo || 0;
    let nivelVinculo = null;
    let mudouNivelVinculo = false;

    if (vinculo !== undefined && vinculo !== null) {
      const vinculoAnterior = avatarAtual.vinculo || 0;
      const nivelAnterior = getNivelVinculo(vinculoAnterior);

      novoVinculo = Math.max(0, Math.min(100, vinculoAnterior + vinculo));
      nivelVinculo = getNivelVinculo(novoVinculo);

      mudouNivelVinculo = nivelAnterior.nome !== nivelVinculo.nome;

      console.log('Vínculo atualizado:', {
        anterior: vinculoAnterior,
        ganho: vinculo,
        novo: novoVinculo,
        nivel: nivelVinculo.nome,
        mudouNivel: mudouNivelVinculo
      });

      // Rastrear progresso de missões se nível de vínculo aumentou
      if (mudouNivelVinculo && avatarAtual.user_id) {
        trackMissionProgress(avatarAtual.user_id, 'AUMENTAR_VINCULO', 1);
      }
    }

    // === ATUALIZAR AVATAR NO BANCO ===
    const updates = {
      nivel: novoNivel,
      experiencia: novaExperiencia,
      exaustao: novaExaustao,
      updated_at: new Date().toISOString()
    };

    // Só atualizar vínculo se foi explicitamente enviado no payload
    if (vinculo !== undefined && vinculo !== null) {
      updates.vinculo = novoVinculo;
    }

    // Só atualizar hp_atual se foi explicitamente enviado no payload
    if (hp_atual !== undefined && hp_atual !== null) {
      updates.hp_atual = hp_atual;
    }

    console.log('🔄 Atualizando avatar no banco:', {
      avatarId,
      updates,
      vinculoAnterior: avatarAtual.vinculo,
      vinculoNovo: novoVinculo,
      ganhoVinculo: vinculo
    });

    try {
      await updateDocument('avatares', avatarId, updates);
    } catch (updateError) {
      console.error('❌ Erro ao atualizar avatar:', updateError);
      return NextResponse.json(
        { message: 'Erro ao atualizar avatar', erro: updateError.message },
        { status: 500 }
      );
    }

    // Buscar avatar atualizado
    const avatarAtualizado = await getDocument('avatares', avatarId);

    console.log('✅ Avatar atualizado com sucesso:', {
      id: avatarAtualizado.id,
      nivel: avatarAtualizado.nivel,
      experiencia: avatarAtualizado.experiencia,
      vinculo: avatarAtualizado.vinculo,
      exaustao: avatarAtualizado.exaustao
    });

    // === RESPOSTA ===
    return NextResponse.json({
      sucesso: true,
      avatar: avatarAtualizado,
      ganhos: {
        experiencia: experiencia || 0,
        exaustao: exaustao || 0,
        vinculo: vinculo || 0
      },
      vinculo: novoVinculo,
      nivelVinculo: nivelVinculo ? {
        nome: nivelVinculo.nome,
        emoji: nivelVinculo.emoji,
        descricao: nivelVinculo.descricao,
        mudouNivel: mudouNivelVinculo
      } : null,
      ...levelUpData
    });

  } catch (error) {
    console.error('Erro na API atualizar-avatar:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor', erro: error.message },
      { status: 500 }
    );
  }
}
