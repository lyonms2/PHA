/**
 * Sistema de Evolução de Raridade
 * Permite evoluir avatares de Comum→Raro→Lendário
 * Custo balanceado, chance de sucesso com bônus de Hunter Rank
 */

/**
 * Configuração de custos e chances de evolução
 */
export const EVOLUCAO_CONFIG = {
  'Comum→Raro': {
    custoMoedas: 5000,
    custoFragmentos: 100,
    chanceBase: 70, // 70% de sucesso
    nivelMinimo: 10,
    bonusHunterRank: 0.1 // +10% por rank acima de F
  },
  'Raro→Lendário': {
    custoMoedas: 25000,
    custoFragmentos: 500,
    chanceBase: 50, // 50% de sucesso
    nivelMinimo: 25,
    bonusHunterRank: 0.05 // +5% por rank acima de F
  }
};

/**
 * Multiplicadores de conversão de stats por raridade
 * Quando avatar evolui, stats são multiplicados
 *
 * AJUSTADO para garantir que stats evoluídos atinjam o mínimo da próxima raridade:
 * - Comum (min 5) x 2.0 = 10 (mínimo de Raro)
 * - Raro (min 10) x 1.6 = 16 (mínimo de Lendário)
 */
export const MULTIPLICADORES_STATS = {
  'Comum→Raro': {
    forca: 2.0,       // Dobra (+100%)
    agilidade: 2.0,
    resistencia: 2.0,
    foco: 2.0,
    descricao: '+100% em todos os stats (dobra)'
  },
  'Raro→Lendário': {
    forca: 1.6,       // +60%
    agilidade: 1.6,
    resistencia: 1.6,
    foco: 1.6,
    descricao: '+60% em todos os stats'
  }
};

/**
 * Verifica se avatar pode evoluir
 * @param {Object} avatar - Avatar a evoluir
 * @returns {Object} { podeEvoluir, motivo, proximaRaridade, config }
 */
export function verificarEvolucaoPossivel(avatar) {
  if (!avatar) {
    return { podeEvoluir: false, motivo: 'Avatar não encontrado' };
  }

  if (!avatar.vivo) {
    return { podeEvoluir: false, motivo: 'Avatar está morto' };
  }

  const raridade = avatar.raridade;
  const nivel = avatar.nivel || 1;

  if (raridade === 'Lendário') {
    return { podeEvoluir: false, motivo: 'Avatar já está no nível máximo (Lendário)' };
  }

  const tipoEvolucao = raridade === 'Comum' ? 'Comum→Raro' : 'Raro→Lendário';
  const config = EVOLUCAO_CONFIG[tipoEvolucao];

  if (nivel < config.nivelMinimo) {
    return {
      podeEvoluir: false,
      motivo: `Nível mínimo: ${config.nivelMinimo} (atual: ${nivel})`
    };
  }

  const proximaRaridade = raridade === 'Comum' ? 'Raro' : 'Lendário';

  return {
    podeEvoluir: true,
    proximaRaridade,
    tipoEvolucao,
    config
  };
}

/**
 * Calcula chance de sucesso com bônus de Hunter Rank
 * @param {string} tipoEvolucao - 'Comum→Raro' ou 'Raro→Lendário'
 * @param {Object} hunterRank - Rank do caçador
 * @returns {number} Chance de sucesso (0-100)
 */
export function calcularChanceSucesso(tipoEvolucao, hunterRank) {
  const config = EVOLUCAO_CONFIG[tipoEvolucao];
  if (!config) return 0;

  let chance = config.chanceBase;

  // Bônus por Hunter Rank
  if (hunterRank && hunterRank.nivel > 0) {
    const bonusRank = hunterRank.nivel * (config.bonusHunterRank * 100);
    chance += bonusRank;
  }

  return Math.min(95, chance); // Máximo 95%
}

/**
 * Calcula novos stats após evolução
 * @param {Object} avatar - Avatar original
 * @param {string} tipoEvolucao - Tipo de evolução
 * @returns {Object} Novos stats
 */
export function calcularStatsEvoluidos(avatar, tipoEvolucao) {
  const multiplicadores = MULTIPLICADORES_STATS[tipoEvolucao];
  if (!multiplicadores) {
    throw new Error(`Tipo de evolução inválido: ${tipoEvolucao}`);
  }

  return {
    forca: Math.floor(avatar.forca * multiplicadores.forca),
    agilidade: Math.floor(avatar.agilidade * multiplicadores.agilidade),
    resistencia: Math.floor(avatar.resistencia * multiplicadores.resistencia),
    foco: Math.floor(avatar.foco * multiplicadores.foco)
  };
}

/**
 * Executa rolagem de sucesso da evolução
 * @param {number} chanceSucesso - Chance de sucesso (0-100)
 * @returns {boolean} true se sucesso, false se falha
 */
export function rolarSucesso(chanceSucesso) {
  const rolagem = Math.random() * 100;
  return rolagem <= chanceSucesso;
}

/**
 * Calcula HP máximo após evolução (recalcula baseado em resistência nova)
 * @param {Object} statsNovos - Novos stats do avatar
 * @param {number} nivel - Nível do avatar
 * @returns {number} HP máximo
 */
export function calcularHPMaximoEvolucao(statsNovos, nivel) {
  // Fórmula: 50 + (resistencia * 5) + (nivel * 3)
  return Math.floor(50 + (statsNovos.resistencia * 5) + (nivel * 3));
}

/**
 * Processa evolução completa de um avatar
 * @param {Object} avatar - Avatar a evoluir
 * @param {Object} hunterRank - Rank do caçador
 * @returns {Object} Resultado da evolução
 */
export function processarEvolucao(avatar, hunterRank) {
  const verificacao = verificarEvolucaoPossivel(avatar);

  if (!verificacao.podeEvoluir) {
    return {
      sucesso: false,
      motivo: verificacao.motivo
    };
  }

  const { tipoEvolucao, config, proximaRaridade } = verificacao;
  const chanceSucesso = calcularChanceSucesso(tipoEvolucao, hunterRank);
  const sucesso = rolarSucesso(chanceSucesso);

  if (!sucesso) {
    return {
      sucesso: false,
      tentativaFalhou: true,
      chanceSucesso,
      mensagem: 'A evolução falhou! O avatar permanece inalterado.'
    };
  }

  // Sucesso! Calcular novos stats
  const statsNovos = calcularStatsEvoluidos(avatar, tipoEvolucao);
  const hpMaximo = calcularHPMaximoEvolucao(statsNovos, avatar.nivel);

  return {
    sucesso: true,
    chanceSucesso,
    novaRaridade: proximaRaridade,
    statsAntigos: {
      forca: avatar.forca,
      agilidade: avatar.agilidade,
      resistencia: avatar.resistencia,
      foco: avatar.foco
    },
    statsNovos,
    hpMaximo,
    mensagem: `🎉 Evolução bem-sucedida! ${avatar.nome} agora é ${proximaRaridade}!`
  };
}

export default {
  EVOLUCAO_CONFIG,
  MULTIPLICADORES_STATS,
  verificarEvolucaoPossivel,
  calcularChanceSucesso,
  calcularStatsEvoluidos,
  rolarSucesso,
  calcularHPMaximoEvolucao,
  processarEvolucao
};
