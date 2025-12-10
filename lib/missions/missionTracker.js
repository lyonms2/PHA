/**
 * Helper para tracking automático de progresso de missões
 * Usa chamada interna para evitar overhead de HTTP
 */

import { getDocument, updateDocument } from '@/lib/firebase/firestore';
import { incrementarProgresso, eventoCorrespondeAMissao } from './missionProgress';

/**
 * Rastreia progresso de missão para um evento
 * @param {string} userId - ID do usuário
 * @param {string} tipoEvento - Tipo do evento (ex: VITORIA_TREINO, INVOCAR_AVATAR)
 * @param {number} incremento - Quantidade a incrementar (padrão: 1)
 * @returns {Promise<Object>} Resultado do tracking
 */
export async function trackMissionProgress(userId, tipoEvento, incremento = 1) {
  try {
    // Data atual
    const hoje = new Date().toISOString().split('T')[0];
    const progressoId = `${userId}_${hoje}`;

    // Buscar progresso diário
    const progressoDiario = await getDocument('daily_missions_progress', progressoId);

    if (!progressoDiario) {
      // Sem missões ativas para hoje, não faz nada
      return { success: false, reason: 'no_missions' };
    }

    // Atualizar missões que correspondem ao evento
    let algumaMissaoAtualizada = false;
    const missoesAtualizadas = progressoDiario.missoes.map(missao => {
      if (eventoCorrespondeAMissao(missao, tipoEvento)) {
        const resultado = incrementarProgresso(missao, missao.progresso, incremento);
        algumaMissaoAtualizada = true;

        console.log(`📋 [MISSÃO] Atualizada: ${missao.nome} - ${resultado.progresso}/${missao.objetivo.quantidade}`);

        return {
          ...missao,
          progresso: resultado.progresso,
          concluida: resultado.concluida
        };
      }
      return missao;
    });

    if (!algumaMissaoAtualizada) {
      // Nenhuma missão corresponde a este evento
      return { success: false, reason: 'no_matching_mission' };
    }

    // Verificar se todas as missões foram concluídas
    const todasConcluidas = missoesAtualizadas.every(m => m.concluida);

    // Atualizar no banco
    await updateDocument('daily_missions_progress', progressoId, {
      missoes: missoesAtualizadas,
      todas_concluidas: todasConcluidas,
      updated_at: new Date().toISOString()
    });

    console.log(`✅ [MISSÃO] Progresso salvo para evento: ${tipoEvento}`);

    return {
      success: true,
      missoes_atualizadas: missoesAtualizadas.filter(m =>
        eventoCorrespondeAMissao(m, tipoEvento)
      ).length,
      todas_concluidas: todasConcluidas
    };

  } catch (error) {
    console.error('❌ [MISSÃO] Erro ao rastrear progresso:', error);
    // Não quebrar a API original se tracking falhar
    return { success: false, error: error.message };
  }
}

/**
 * Rastreia múltiplos eventos de uma vez
 * @param {string} userId - ID do usuário
 * @param {Array<{tipo: string, incremento: number}>} eventos - Lista de eventos
 */
export async function trackMultipleEvents(userId, eventos) {
  const results = [];
  for (const evento of eventos) {
    const result = await trackMissionProgress(userId, evento.tipo, evento.incremento || 1);
    results.push({ evento: evento.tipo, ...result });
  }
  return results;
}

export default {
  trackMissionProgress,
  trackMultipleEvents
};
