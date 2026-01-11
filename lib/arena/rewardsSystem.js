/**
 * Sistema de Recompensas para Treino IA
 * Calcula XP, Vínculo e Exaustão baseado em poder e dificuldade
 * AGORA USA O SISTEMA CENTRALIZADO DE EXAUSTÃO
 * AGORA INCLUI GOLD E BÔNUS DE COLEÇÕES
 */

import { FONTES_EXAUSTAO } from '@/app/avatares/sistemas/exhaustionSystem';
import { calcularBonusGold, calcularBonusXP } from '@/lib/collections/collectionDefinitions';
import { getColecoesAtivas } from '@/lib/collections/collectionProgress';

/**
 * Calcula recompensas de treino baseado no poder do oponente e dificuldade
 * @param {number} poderOponente - Poder total do oponente
 * @param {string} dificuldade - 'facil', 'normal', 'dificil'
 * @param {boolean} vitoria - Se ganhou ou perdeu
 * @returns {Object} Recompensas { xp, vinculo, exaustao, xpCacador, gold }
 */
export function calcularRecompensasTreino(poderOponente, dificuldade, vitoria) {
  // Base de XP proporcional ao poder (balanceado para não quebrar o jogo)
  // Poder médio de 40-60 deve dar ~20-30 XP em vitória normal
  const baseXP = Math.floor(poderOponente * 0.4);

  // Base de Gold proporcional ao poder
  // Poder médio de 40-60 deve dar ~15-25 gold em vitória normal
  const baseGold = Math.floor(poderOponente * 0.4);

  // Multiplicadores por dificuldade
  const multiplicadores = {
    facil: { xp: 0.7, vinculo: 0.5, gold: 0.8 },
    normal: { xp: 1.0, vinculo: 1.0, gold: 1.0 },
    dificil: { xp: 1.5, vinculo: 1.5, gold: 1.3 }
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
    const gold = Math.floor(baseGold * mult.gold);
    const vinculo = Math.floor(3 * mult.vinculo); // 3-4.5 de vínculo
    const exaustao = exaustaoBase; // Usa valor do sistema centralizado
    const xpCacador = Math.floor(xp * 0.3); // Caçador ganha 30% do XP do avatar

    return {
      xp,
      gold,
      vinculo,
      exaustao,
      xpCacador,
      descricao: `Vitória no treino ${dificuldade}!`
    };
  } else {
    // DERROTA - Recompensas reduzidas
    const xp = Math.floor(baseXP * 0.2); // 20% do XP
    const gold = Math.floor(baseGold * 0.3); // 30% do gold
    const vinculo = 1; // Vínculo mínimo
    const exaustao = Math.floor(exaustaoBase * 1.5); // 50% mais exaustão (derrota)
    const xpCacador = Math.floor(xp * 0.2); // Caçador ganha 20% do XP

    return {
      xp,
      gold,
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
 * @returns {Object} Penalidades { vinculo, exaustao, xp, gold, xpCacador }
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
    gold: 0,
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

/**
 * Aplica bônus de coleções nas recompensas
 * @param {Object} recompensas - Recompensas base { gold, xp, ...}
 * @param {Object} avatar - Avatar que ganhou as recompensas
 * @param {Array} todosAvatares - Todos os avatares do jogador
 * @returns {Object} Recompensas com bônus aplicado { goldFinal, xpFinal, bonusGold, bonusXP }
 */
export function aplicarBonusColecoes(recompensas, avatar, todosAvatares) {
  // Obter coleções ativas do jogador
  const colecoesAtivas = getColecoesAtivas(todosAvatares);

  // Calcular bônus de gold (cumulativo)
  const bonusGold = calcularBonusGold(colecoesAtivas);

  // Calcular bônus de XP para o avatar específico (maior do elemento)
  const bonusXP = calcularBonusXP(avatar, colecoesAtivas);

  // Aplicar bônus
  const goldBase = recompensas.gold || 0;
  const xpBase = recompensas.xp || 0;

  const goldFinal = Math.floor(goldBase * (1 + bonusGold / 100));
  const xpFinal = Math.floor(xpBase * (1 + bonusXP / 100));

  return {
    ...recompensas,
    gold: goldFinal,
    xp: xpFinal,
    goldBase, // Guardar valores base para logs
    xpBase,
    bonusGold: bonusGold > 0 ? bonusGold : undefined,
    bonusXP: bonusXP > 0 ? bonusXP : undefined,
    goldGanho: goldFinal - goldBase,
    xpGanho: xpFinal - xpBase
  };
}

export default {
  calcularRecompensasTreino,
  calcularPenalidadesAbandono,
  aplicarLimites,
  verificarSubidaNivel,
  aplicarBonusColecoes
};
