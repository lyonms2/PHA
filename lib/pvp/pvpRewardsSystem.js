/**
 * Sistema de Recompensas para PVP (Jogador vs Jogador)
 * Calcula Fama, XP, Vínculo, Exaustão e Apostas baseado em resultado
 */

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
 * @param {number} aposta - Valor apostado
 * @param {boolean} rendeu - Se houve rendição (false = batalha completa)
 * @returns {Object} Recompensas { fama, xp, vinculo, exaustao, moedas, xpCacador }
 */
export function calcularRecompensasPVP(meuAvatar, oponenteAvatar, vitoria, aposta = 0, rendeu = false) {
  const meuPoder = (meuAvatar.forca || 0) + (meuAvatar.agilidade || 0) +
                   (meuAvatar.resistencia || 0) + (meuAvatar.foco || 0);
  const poderOponente = (oponenteAvatar.forca || 0) + (oponenteAvatar.agilidade || 0) +
                        (oponenteAvatar.resistencia || 0) + (oponenteAvatar.foco || 0);

  if (vitoria) {
    // ===== VITÓRIA =====
    const fama = calcularFama(meuPoder, poderOponente, true);

    // XP baseado no poder do oponente (PVP dá mais XP que treino)
    const xp = Math.floor(poderOponente * 0.6); // 60% do poder em XP

    // Vínculo aumenta em vitória
    const vinculo = rendeu ? 3 : 5; // Menos se oponente rendeu

    // Exaustão moderada (batalha real cansa)
    const exaustao = 15;

    // Moedas: ganha a aposta do oponente + sua aposta de volta
    const moedas = rendeu ? Math.floor(aposta * 1.5) : (aposta * 2); // Se rendeu, ganha só 50% da aposta do oponente

    // XP do caçador (40% do XP do avatar em PVP)
    const xpCacador = Math.floor(xp * 0.4);

    return {
      fama,
      xp,
      vinculo,
      exaustao,
      moedas,
      moedasGanhas: rendeu ? Math.floor(aposta * 0.5) : aposta, // Quanto ganhou do oponente
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

    // Vínculo diminui em derrota
    const vinculo = -1;

    // Exaustão maior em derrota (lutou até o fim)
    const exaustao = rendeu ? 10 : 20;

    // Moedas: perde a aposta
    const moedas = rendeu ? Math.floor(-aposta * 0.5) : -aposta; // Rendição perde só 50%

    // XP do caçador reduzido
    const xpCacador = Math.floor(xp * 0.3);

    return {
      fama,
      xp,
      vinculo,
      exaustao,
      moedas,
      moedasPerdidas: rendeu ? Math.floor(aposta * 0.5) : aposta,
      xpCacador,
      resultado: rendeu ? 'Rendição' : 'Derrota',
      descricao: rendeu
        ? `Você se rendeu. Perde apenas 50% da aposta.`
        : `Derrota em combate. Perde a aposta completa.`
    };
  }
}

/**
 * Calcula penalidades por abandono no PVP
 * @param {number} aposta - Valor apostado
 * @returns {Object} Penalidades { fama, vinculo, exaustao, moedas }
 */
export function calcularPenalidadesAbandonoPVP(aposta = 0) {
  return {
    fama: -25, // Perde bastante fama por abandonar
    xp: 0,
    vinculo: -5, // Perde muito vínculo
    exaustao: 25, // Exaustão por abandono
    moedas: -aposta, // Perde toda a aposta
    moedasPerdidas: aposta,
    xpCacador: 0,
    resultado: 'Abandono',
    descricao: 'Batalha abandonada! Penalidades severas aplicadas.'
  };
}

/**
 * Valida valor de aposta baseado no nível do jogador
 * @param {number} nivel - Nível do caçador
 * @param {number} moedasDisponiveis - Moedas disponíveis
 * @returns {Object} Limites { minimo, maximo }
 */
export function calcularLimitesAposta(nivel, moedasDisponiveis) {
  const minimo = Math.max(10, nivel * 5); // Mínimo cresce com nível
  const maximo = Math.min(moedasDisponiveis, nivel * 100); // Máximo baseado em nível e moedas

  return {
    minimo: Math.min(minimo, moedasDisponiveis), // Não pode ser maior que o disponível
    maximo,
    sugerido: Math.min(nivel * 25, moedasDisponiveis) // Valor sugerido
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
  calcularLimitesAposta,
  calcularRankPVP
};
