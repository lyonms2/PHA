/**
 * Sistema de Recompensas para Treino IA
 * Calcula XP, Vínculo e Exaustão baseado em poder e dificuldade
 * AGORA USA O SISTEMA CENTRALIZADO DE EXAUSTÃO
 */

import { FONTES_EXAUSTAO } from '@/app/avatares/sistemas/exhaustionSystem';

/**
 * Calcula recompensas de treino baseado no poder do oponente e dificuldade
 * @param {number} poderOponente - Poder total do oponente
 * @param {string} dificuldade - 'facil', 'normal', 'dificil'
 * @param {boolean} vitoria - Se ganhou ou perdeu
 * @returns {Object} Recompensas { xp, vinculo, exaustao, xpCacador }
 */
export function calcularRecompensasTreino(poderOponente, dificuldade, vitoria) {
  // Base de XP proporcional ao poder (balanceado para não quebrar o jogo)
  // Poder médio de 40-60 deve dar ~20-30 XP em vitória normal
  const baseXP = Math.floor(poderOponente * 0.4);

  // Multiplicadores por dificuldade
  const multiplicadores = {
    facil: { xp: 0.7, vinculo: 0.5 },
    normal: { xp: 1.0, vinculo: 1.0 },
    dificil: { xp: 1.5, vinculo: 1.5 }
  };

  const mult = multiplicadores[dificuldade] || multiplicadores.normal;

  // Usar valores do sistema centralizado de exaustão
  // Agora os valores vêm de FONTES_EXAUSTAO (já reduzidos em 50%)
  const fontesExaustao = {
    facil: FONTES_EXAUSTAO.COMBATE_FACIL.ganho,
    normal: FONTES_EXAUSTAO.COMBATE_NORMAL.ganho,
    dificil: FONTES_EXAUSTAO.COMBATE_DIFICIL.ganho
  };

  const exaustaoBase = fontesExaustao[dificuldade] || fontesExaustao.normal;

  if (vitoria) {
    // VITÓRIA - Recompensas completas
    const xp = Math.floor(baseXP * mult.xp);
    const vinculo = Math.floor(3 * mult.vinculo); // 3-4.5 de vínculo
    const exaustao = exaustaoBase; // Usa valor do sistema centralizado
    const xpCacador = Math.floor(xp * 0.3); // Caçador ganha 30% do XP do avatar

    return {
      xp,
      vinculo,
      exaustao,
      xpCacador,
      descricao: `Vitória no treino ${dificuldade}!`
    };
  } else {
    // DERROTA - Recompensas reduzidas
    const xp = Math.floor(baseXP * 0.2); // 20% do XP
    const vinculo = 1; // Vínculo mínimo
    const exaustao = Math.floor(exaustaoBase * 1.5); // 50% mais exaustão (derrota)
    const xpCacador = Math.floor(xp * 0.2); // Caçador ganha 20% do XP

    return {
      xp,
      vinculo,
      exaustao,
      xpCacador,
      descricao: `Derrota no treino ${dificuldade}.`
    };
  }
}

/**
 * Calcula penalidades por abandono
 * @param {string} dificuldade - 'facil', 'normal', 'dificil'
 * @returns {Object} Penalidades { vinculo, exaustao }
 */
export function calcularPenalidadesAbandono(dificuldade) {
  // Usa sistema centralizado - MISSAO_CURTA/MEDIA/LONGA já estão com valores reduzidos em 50%
  const mapaExaustao = {
    facil: FONTES_EXAUSTAO.MISSAO_CURTA.ganho,
    normal: FONTES_EXAUSTAO.MISSAO_MEDIA.ganho,
    dificil: FONTES_EXAUSTAO.MISSAO_LONGA.ganho
  };

  const penalidades = {
    facil: { vinculo: -2, exaustao: mapaExaustao.facil },
    normal: { vinculo: -3, exaustao: mapaExaustao.normal },
    dificil: { vinculo: -5, exaustao: mapaExaustao.dificil }
  };

  const pen = penalidades[dificuldade] || penalidades.normal;

  return {
    vinculo: pen.vinculo,
    exaustao: pen.exaustao,
    xp: 0,
    xpCacador: 0,
    descricao: 'Treino abandonado - penalidades aplicadas!'
  };
}

/**
 * Aplica limites de segurança aos valores
 */
export function aplicarLimites(avatar, recompensas) {
  const xpAtual = avatar.xp || 0;
  const vinculoAtual = avatar.vinculo || 0;
  const exaustaoAtual = avatar.exaustao || 0;

  return {
    xp: Math.max(0, xpAtual + recompensas.xp),
    vinculo: Math.min(100, Math.max(0, vinculoAtual + recompensas.vinculo)),
    exaustao: Math.min(100, Math.max(0, exaustaoAtual + recompensas.exaustao))
  };
}

/**
 * Verifica se avatar subiu de nível
 */
export function verificarSubidaNivel(xpAtual, xpNovo, nivelAtual) {
  const xpNecessario = nivelAtual * 100; // 100 XP por nível

  if (xpNovo >= xpNecessario && xpAtual < xpNecessario) {
    return {
      subiuNivel: true,
      novoNivel: nivelAtual + 1,
      mensagem: `🎉 Subiu para o nível ${nivelAtual + 1}!`
    };
  }

  return { subiuNivel: false };
}

export default {
  calcularRecompensasTreino,
  calcularPenalidadesAbandono,
  aplicarLimites,
  verificarSubidaNivel
};
