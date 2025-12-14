// ==================== APLICADOR DE SINERGIAS SIMPLIFICADO ====================
// Sistema que aplica bônus e desvantagens de sinergias aos avatares

import { getSynergy, formatarSinergiaParaLog, formatarVantagensDesvantagens } from './synergySystem';

// ==================== MULTIPLICADORES DE RARIDADE ====================
/**
 * Multiplicadores aplicados aos valores de sinergia baseado na raridade do avatar principal
 * Quanto maior a raridade, mais forte a sinergia
 */
const MULTIPLICADORES_RARIDADE = {
  'Comum': 1.0,      // 100% - valores base
  'Raro': 1.2,       // 120% - +20% nos valores
  'Lendário': 1.4    // 140% - +40% nos valores
};

/**
 * Obtém o multiplicador de raridade para um avatar
 * @param {object} avatar - Avatar para obter o multiplicador
 * @returns {number} Multiplicador de raridade (1.0, 1.2 ou 1.4)
 */
function obterMultiplicadorRaridade(avatar) {
  const raridade = avatar?.raridade || 'Comum';
  return MULTIPLICADORES_RARIDADE[raridade] || 1.0;
}

/**
 * Aplica sinergia entre Avatar Principal e Avatar Suporte
 * Retorna modificadores que podem ser usados nos cálculos de combate
 *
 * @param {object} principal - Avatar principal (quem luta)
 * @param {object} suporte - Avatar suporte (quem dá bônus)
 * @returns {object} Modificadores da sinergia
 */
export function aplicarSinergia(principal, suporte) {
  if (!principal) {
    throw new Error('Avatar principal é obrigatório');
  }

  // Se não houver suporte, retorna sem modificações
  if (!suporte) {
    return {
      sinergiaAtiva: null,
      modificadores: {},
      logTexto: ''
    };
  }

  // Obter sinergia entre os elementos
  const sinergia = getSynergy(principal.elemento, suporte.elemento);

  if (!sinergia) {
    console.warn(`Sinergia não encontrada: ${principal.elemento} + ${suporte.elemento}`);
    return {
      sinergiaAtiva: null,
      modificadores: {},
      logTexto: ''
    };
  }

  // Obter multiplicador de raridade do avatar principal
  const multiplicadorRaridade = obterMultiplicadorRaridade(principal);

  // Criar objeto de modificadores
  const modificadores = {};

  // Aplicar vantagem 1 (com multiplicador de raridade)
  if (sinergia.vantagem1) {
    const valorAjustado = sinergia.vantagem1.valor * multiplicadorRaridade;
    aplicarModificador(modificadores, sinergia.vantagem1.tipo, valorAjustado);
  }

  // Aplicar vantagem 2 (com multiplicador de raridade)
  if (sinergia.vantagem2) {
    const valorAjustado = sinergia.vantagem2.valor * multiplicadorRaridade;
    aplicarModificador(modificadores, sinergia.vantagem2.tipo, valorAjustado);
  }

  // Aplicar desvantagem (com multiplicador de raridade)
  if (sinergia.desvantagem) {
    const valorAjustado = sinergia.desvantagem.valor * multiplicadorRaridade;
    aplicarModificador(modificadores, sinergia.desvantagem.tipo, valorAjustado);
  }

  // Formatar texto para logs (com valores ajustados)
  const sinergiaAjustada = {
    ...sinergia,
    vantagem1: sinergia.vantagem1 ? { ...sinergia.vantagem1, valor: sinergia.vantagem1.valor * multiplicadorRaridade } : null,
    vantagem2: sinergia.vantagem2 ? { ...sinergia.vantagem2, valor: sinergia.vantagem2.valor * multiplicadorRaridade } : null,
    desvantagem: sinergia.desvantagem ? { ...sinergia.desvantagem, valor: sinergia.desvantagem.valor * multiplicadorRaridade } : null
  };
  const logTexto = formatarSinergiaParaLog(sinergiaAjustada);

  // Formatar vantagens e desvantagens para UI (com valores ajustados)
  const { vantagens, desvantagens } = formatarVantagensDesvantagens(sinergiaAjustada);

  return {
    sinergiaAtiva: {
      nome: sinergia.nome,
      descricao: sinergia.descricao,
      elementos: { principal: principal.elemento, suporte: suporte.elemento },
      vantagens,
      desvantagens,
      raridadePrincipal: principal.raridade || 'Comum',
      multiplicador: multiplicadorRaridade
    },
    modificadores,
    logTexto
  };
}

/**
 * Aplica um modificador ao objeto de modificadores
 */
function aplicarModificador(modificadores, tipo, valor) {
  switch (tipo) {
    // ========== MODIFICADORES DO JOGADOR ==========
    case 'dano':
      modificadores.dano_mult = (modificadores.dano_mult || 1.0) + valor;
      break;

    case 'energia':
      modificadores.energia_mult = (modificadores.energia_mult || 1.0) + valor;
      break;

    case 'evasao':
      modificadores.evasao_mult = (modificadores.evasao_mult || 1.0) + valor;
      break;

    case 'hp':
      modificadores.hp_mult = (modificadores.hp_mult || 1.0) + valor;
      break;

    case 'resistencia':
      modificadores.resistencia_mult = (modificadores.resistencia_mult || 1.0) + valor;
      break;

    case 'roubo_vida':
      modificadores.roubo_vida_percent = (modificadores.roubo_vida_percent || 0) + valor;
      break;

    case 'cura':
      modificadores.cura_mult = (modificadores.cura_mult || 1.0) + valor;
      break;

    // ========== MODIFICADORES DO INIMIGO ==========
    case 'energia_inimigo':
      modificadores.energia_inimigo_reducao = (modificadores.energia_inimigo_reducao || 0) + Math.abs(valor);
      break;

    case 'dano_inimigo':
      modificadores.dano_inimigo_reducao = (modificadores.dano_inimigo_reducao || 0) + Math.abs(valor);
      break;

    case 'evasao_inimigo':
      modificadores.evasao_inimigo_reducao = (modificadores.evasao_inimigo_reducao || 0) + Math.abs(valor);
      break;

    case 'resistencia_inimigo':
      modificadores.resistencia_inimigo_reducao = (modificadores.resistencia_inimigo_reducao || 0) + Math.abs(valor);
      break;

    default:
      console.warn(`Tipo de modificador desconhecido: ${tipo}`);
      modificadores[tipo] = valor;
  }
}

/**
 * Calcula HP máximo com modificadores de sinergia
 */
export function calcularHPComSinergia(hpBase, modificadores) {
  if (!modificadores.hp_mult) return hpBase;
  return Math.floor(hpBase * modificadores.hp_mult);
}

/**
 * Calcula energia máxima com modificadores de sinergia
 */
export function calcularEnergiaComSinergia(energiaBase, modificadores) {
  if (!modificadores.energia_mult) return energiaBase;
  return Math.floor(energiaBase * modificadores.energia_mult);
}

/**
 * Aplica modificadores de sinergia ao dano
 */
export function aplicarDanoSinergia(danoBase, modificadores) {
  if (!modificadores.dano_mult) return danoBase;
  return Math.floor(danoBase * modificadores.dano_mult);
}

/**
 * Aplica modificadores de sinergia à resistência
 */
export function aplicarResistenciaSinergia(resistenciaBase, modificadores, isInimigo = false) {
  // Se for inimigo, aplicar redução
  if (isInimigo && modificadores.resistencia_inimigo_reducao) {
    return Math.floor(resistenciaBase * (1 - modificadores.resistencia_inimigo_reducao));
  }

  // Se for aliado, aplicar multiplicador
  if (!isInimigo && modificadores.resistencia_mult) {
    return Math.floor(resistenciaBase * modificadores.resistencia_mult);
  }

  return resistenciaBase;
}

/**
 * Aplica modificadores de sinergia à evasão
 */
export function aplicarEvasaoSinergia(evasaoBase, modificadores, isInimigo = false) {
  // Se for inimigo, aplicar redução
  if (isInimigo && modificadores.evasao_inimigo_reducao) {
    return evasaoBase * (1 - modificadores.evasao_inimigo_reducao);
  }

  // Se for aliado, aplicar multiplicador
  if (!isInimigo && modificadores.evasao_mult) {
    return evasaoBase * modificadores.evasao_mult;
  }

  return evasaoBase;
}

/**
 * Aplica roubo de vida ao dano causado
 */
export function aplicarRouboVida(danoCausado, modificadores) {
  if (!modificadores.roubo_vida_percent || modificadores.roubo_vida_percent <= 0) {
    return 0;
  }
  return Math.floor(danoCausado * modificadores.roubo_vida_percent);
}

/**
 * Aplica modificadores de sinergia à cura
 */
export function aplicarCuraSinergia(curaBase, modificadores) {
  if (!modificadores.cura_mult) return curaBase;
  return Math.floor(curaBase * modificadores.cura_mult);
}

/**
 * Calcula redução de energia do inimigo no início da batalha
 */
export function calcularReducaoEnergiaInimigo(energiaBase, modificadores) {
  if (!modificadores.energia_inimigo_reducao) return energiaBase;
  return Math.floor(energiaBase * (1 - modificadores.energia_inimigo_reducao));
}

/**
 * Preview da sinergia para exibição na UI
 * @param {string} elementoPrincipal - Elemento do avatar principal
 * @param {string} elementoSuporte - Elemento do avatar suporte
 * @param {string} raridadePrincipal - Raridade do avatar principal (opcional, default: 'Comum')
 */
export function previewSinergia(elementoPrincipal, elementoSuporte, raridadePrincipal = 'Comum') {
  if (!elementoPrincipal || !elementoSuporte) return null;

  const sinergia = getSynergy(elementoPrincipal, elementoSuporte);
  if (!sinergia) return null;

  // Obter multiplicador de raridade
  const multiplicadorRaridade = MULTIPLICADORES_RARIDADE[raridadePrincipal] || 1.0;

  // Aplicar multiplicador aos valores
  const sinergiaAjustada = {
    ...sinergia,
    vantagem1: sinergia.vantagem1 ? { ...sinergia.vantagem1, valor: sinergia.vantagem1.valor * multiplicadorRaridade } : null,
    vantagem2: sinergia.vantagem2 ? { ...sinergia.vantagem2, valor: sinergia.vantagem2.valor * multiplicadorRaridade } : null,
    desvantagem: sinergia.desvantagem ? { ...sinergia.desvantagem, valor: sinergia.desvantagem.valor * multiplicadorRaridade } : null
  };

  // Formatar vantagens e desvantagens para UI (com valores ajustados)
  const { vantagens, desvantagens } = formatarVantagensDesvantagens(sinergiaAjustada);

  return {
    nome: sinergia.nome,
    descricao: sinergia.descricao,
    vantagens,
    desvantagens,
    raridadePrincipal,
    multiplicador: multiplicadorRaridade,
    // Manter compatibilidade (valores ajustados)
    vantagem1: sinergiaAjustada.vantagem1,
    vantagem2: sinergiaAjustada.vantagem2,
    desvantagem: sinergiaAjustada.desvantagem
  };
}

export default {
  aplicarSinergia,
  calcularHPComSinergia,
  calcularEnergiaComSinergia,
  aplicarDanoSinergia,
  aplicarResistenciaSinergia,
  aplicarEvasaoSinergia,
  aplicarRouboVida,
  aplicarCuraSinergia,
  calcularReducaoEnergiaInimigo,
  previewSinergia
};
