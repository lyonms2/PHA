/**
 * Sistema de Recompensas para PVP (Jogador vs Jogador)
 * Calcula Fama, XP, Vínculo, Exaustão e Apostas baseado em resultado
 * AGORA USA O SISTEMA CENTRALIZADO DE EXAUSTÃO
 */

import { FONTES_EXAUSTAO } from '@/app/avatares/sistemas/exhaustionSystem';

/**
 * Calcula Fama baseado no poder do oponente e resultado
 * @param {number} meuPoder - Poder total do meu avatar
 * @param {number} poderOponente - Poder total do oponente
 * @param {boolean} vitoria - Se ganhou ou perdeu
 * @returns {number} Fama ganha/perdida
 */
export function calcularFama(meuPoder, poderOponente, vitoria) {
  // Fama base: diferença de poder afeta ganho/perda
  const diferencaPoder = poderOponente - meuPoder;

  if (vitoria) {
    // VITÓRIA
    // Ganhar de alguém mais forte = mais fama
    // Ganhar de alguém mais fraco = menos fama
    let famaBase = 15; // Base de fama

    if (diferencaPoder > 20) {
      famaBase = 30; // Venceu alguém muito mais forte
    } else if (diferencaPoder > 10) {
      famaBase = 22; // Venceu alguém mais forte
    } else if (diferencaPoder < -20) {
      famaBase = 8; // Venceu alguém muito mais fraco
    } else if (diferencaPoder < -10) {
      famaBase = 12; // Venceu alguém mais fraco
    }

    return famaBase;
  } else {
    // DERROTA
    // Perder para alguém mais forte = perder menos fama
    // Perder para alguém mais fraco = perder mais fama
    let famaBase = -10; // Base de perda

    if (diferencaPoder > 20) {
      famaBase = -5; // Perdeu para alguém muito mais forte (normal)
    } else if (diferencaPoder > 10) {
      famaBase = -7; // Perdeu para alguém mais forte
    } else if (diferencaPoder < -20) {
      famaBase = -20; // Perdeu para alguém muito mais fraco (humilhante)
    } else if (diferencaPoder < -10) {
      famaBase = -15; // Perdeu para alguém mais fraco
    }

    return famaBase;
  }
}

/**
 * Calcula recompensas PVP completas
 * @param {Object} meuAvatar - Meu avatar
 * @param {Object} oponenteAvatar - Avatar do oponente
 * @param {boolean} vitoria - Se ganhou ou perdeu
 * @param {boolean} rendeu - Se houve rendição (false = batalha completa)
 * @returns {Object} Recompensas { fama, xp, vinculo, exaustao, xpCacador, gold }
 */
export function calcularRecompensasPVP(meuAvatar, oponenteAvatar, vitoria, rendeu = false) {
  const meuPoder = (meuAvatar.forca || 0) + (meuAvatar.agilidade || 0) +
                   (meuAvatar.resistencia || 0) + (meuAvatar.foco || 0);
  const poderOponente = (oponenteAvatar.forca || 0) + (oponenteAvatar.agilidade || 0) +
                        (oponenteAvatar.resistencia || 0) + (oponenteAvatar.foco || 0);

  // Usar valores do sistema centralizado - PVP usa COMBATE_DIFICIL como base
  const exaustaoBasePVP = FONTES_EXAUSTAO.COMBATE_DIFICIL.ganho; // 12.5 (já reduzido 50%)

  if (vitoria) {
    // ===== VITÓRIA =====
    const fama = calcularFama(meuPoder, poderOponente, true);

    // XP baseado no poder do oponente (PVP dá mais XP que treino)
    const xp = Math.floor(poderOponente * 0.6); // 60% do poder em XP

    // Gold baseado no poder do oponente (PVP dá mais gold que treino)
    const gold = Math.floor(poderOponente * 0.7); // 70% do poder em gold

    // Vínculo aumenta em vitória
    const vinculo = rendeu ? 3 : 5; // Menos se oponente rendeu

    // Exaustão do sistema centralizado (rendição reduz em 30%)
    const exaustao = rendeu ? Math.floor(exaustaoBasePVP * 0.7) : exaustaoBasePVP;

    // XP do caçador (40% do XP do avatar em PVP)
    const xpCacador = Math.floor(xp * 0.4);

    return {
      fama,
      xp,
      gold,
      vinculo,
      exaustao,
      xpCacador,
      resultado: rendeu ? 'Vitória por Rendição' : 'Vitória',
      descricao: rendeu
        ? `Oponente se rendeu! Vitória parcial.`
        : `Vitória em combate direto!`
    };
  } else {
    // ===== DERROTA =====
    const fama = calcularFama(meuPoder, poderOponente, false);

    // XP reduzido em derrota
    const xp = Math.floor(poderOponente * 0.15); // 15% do poder

    // Gold reduzido em derrota (rendição não perde gold)
    const gold = rendeu ? 0 : Math.floor(poderOponente * 0.2); // 20% do poder

    // Vínculo diminui em derrota
    const vinculo = -1;

    // Exaustão maior em derrota (derrota cansa +50%, rendição -50%)
    const exaustao = rendeu
      ? Math.floor(exaustaoBasePVP * 0.5)
      : Math.floor(exaustaoBasePVP * 1.5);

    // XP do caçador reduzido
    const xpCacador = Math.floor(xp * 0.3);

    return {
      fama,
      xp,
      gold,
      vinculo,
      exaustao,
      xpCacador,
      resultado: rendeu ? 'Rendição' : 'Derrota',
      descricao: rendeu
        ? `Você se rendeu. Sem penalidade de moedas.`
        : `Derrota em combate.`
    };
  }
}

/**
 * Calcula penalidades por abandono no PVP
 * @returns {Object} Penalidades { fama, vinculo, exaustao, xpCacador, gold }
 */
export function calcularPenalidadesAbandonoPVP() {
  // Usa sistema centralizado - COMBATE_BOSS para punição severa de abandono
  const exaustaoAbandono = FONTES_EXAUSTAO.COMBATE_BOSS.ganho; // 20 (já reduzido 50%)

  return {
    fama: -25, // Perde bastante fama por abandonar
    xp: 0,
    gold: 0, // Sem gold por abandono
    vinculo: -5, // Perde muito vínculo
    exaustao: exaustaoAbandono, // Usa valor do sistema centralizado
    xpCacador: 0,
    resultado: 'Abandono',
    descricao: 'Batalha abandonada! Penalidades severas aplicadas.'
  };
}

/**
 * Calcula rank PVP baseado em Fama
 * @param {number} fama - Total de fama acumulada
 * @returns {Object} Rank { nome, emoji, corTexto, corFundo, proximo }
 */
export function calcularRankPVP(fama = 0) {
  if (fama < 0) fama = 0; // Fama não pode ser negativa

  const ranks = [
    { nome: 'Novato', emoji: '🥉', minFama: 0, corTexto: 'text-gray-400', corFundo: 'bg-gray-700' },
    { nome: 'Bronze', emoji: '🥉', minFama: 100, corTexto: 'text-orange-600', corFundo: 'bg-orange-900' },
    { nome: 'Prata', emoji: '🥈', minFama: 300, corTexto: 'text-gray-300', corFundo: 'bg-gray-600' },
    { nome: 'Ouro', emoji: '🥇', minFama: 600, corTexto: 'text-yellow-400', corFundo: 'bg-yellow-700' },
    { nome: 'Platina', emoji: '💎', minFama: 1000, corTexto: 'text-cyan-400', corFundo: 'bg-cyan-700' },
    { nome: 'Diamante', emoji: '💎', minFama: 1500, corTexto: 'text-blue-400', corFundo: 'bg-blue-700' },
    { nome: 'Mestre', emoji: '👑', minFama: 2200, corTexto: 'text-purple-400', corFundo: 'bg-purple-700' },
    { nome: 'Grão-Mestre', emoji: '👑', minFama: 3000, corTexto: 'text-pink-400', corFundo: 'bg-pink-700' },
    { nome: 'Lendário', emoji: '⭐', minFama: 4000, corTexto: 'text-yellow-300', corFundo: 'bg-gradient-to-r from-yellow-600 to-orange-600' }
  ];

  let rankAtual = ranks[0];
  let proximoRank = ranks[1];

  for (let i = 0; i < ranks.length; i++) {
    if (fama >= ranks[i].minFama) {
      rankAtual = ranks[i];
      proximoRank = ranks[i + 1] || null;
    } else {
      break;
    }
  }

  return {
    ...rankAtual,
    fama,
    proximoRank: proximoRank ? {
      nome: proximoRank.nome,
      famaRestante: proximoRank.minFama - fama
    } : null
  };
}

export default {
  calcularFama,
  calcularRecompensasPVP,
  calcularPenalidadesAbandonoPVP,
  calcularRankPVP
};
