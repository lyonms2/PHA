// ==================== APLICADOR DE SINERGIAS SIMPLIFICADO ====================
// Aplica bônus do Avatar Suporte baseado no elemento do Avatar Principal Inimigo

import { getSynergyContraInimigo, formatarSinergiaParaLog, formatarModificadores, SYNERGIES_SIMPLIFIED } from './synergySystem';

// ==================== MULTIPLICADORES DE RARIDADE ====================
/**
 * Multiplicadores aplicados aos valores de sinergia baseado na raridade do avatar SUPORTE
 * Quanto maior a raridade do suporte, mais forte a sinergia
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
 * Aplica sinergia do Avatar Suporte contra o Avatar Principal Inimigo
 *
 * NOVO SISTEMA:
 * - Não importa o elemento do avatar principal próprio
 * - Importa: Elemento do Avatar Suporte (próprio) VS Elemento do Avatar Principal Inimigo
 *
 * @param {object} avatarSuporte - Avatar suporte (próprio)
 * @param {object} avatarPrincipalInimigo - Avatar principal inimigo
 * @returns {object} Modificadores da sinergia
 */
export function aplicarSinergia(avatarSuporte, avatarPrincipalInimigo) {
  // Se não houver suporte, retorna sem modificações
  if (!avatarSuporte) {
    return {
      sinergiaAtiva: null,
      modificadores: {},
      logTexto: '',
      modificadoresFormatados: []
    };
  }

  // Se não houver inimigo, retorna sem modificações
  if (!avatarPrincipalInimigo) {
    return {
      sinergiaAtiva: null,
      modificadores: {},
      logTexto: '',
      modificadoresFormatados: []
    };
  }

  // Obter sinergia: Suporte (próprio) VS Principal Inimigo
  const sinergia = getSynergyContraInimigo(
    avatarSuporte.elemento,
    avatarPrincipalInimigo.elemento
  );

  console.log('🔍 [SINERGIA DEBUG] getSynergyContraInimigo retornou:', {
    elementoSuporte: avatarSuporte.elemento,
    elementoInimigo: avatarPrincipalInimigo.elemento,
    sinergia: sinergia,
    modificadores: sinergia?.modificadores
  });

  if (!sinergia) {
    console.warn(`Sinergia não encontrada: ${avatarSuporte.elemento} (suporte) vs ${avatarPrincipalInimigo.elemento} (inimigo)`);
    return {
      sinergiaAtiva: null,
      modificadores: {},
      logTexto: '',
      modificadoresFormatados: []
    };
  }

  // Obter multiplicador de raridade do avatar SUPORTE
  const multiplicadorRaridade = obterMultiplicadorRaridade(avatarSuporte);

  // Criar objeto de modificadores aplicados (com multiplicador de raridade)
  const modificadores = {};

  for (const [tipo, valor] of Object.entries(sinergia.modificadores)) {
    const valorAjustado = valor * multiplicadorRaridade;
    modificadores[tipo] = valorAjustado;
  }

  // Formatar texto para logs
  const logTexto = formatarSinergiaParaLog(sinergia, multiplicadorRaridade);

  // Formatar modificadores para UI
  const modificadoresFormatados = formatarModificadores(sinergia, multiplicadorRaridade);

  const resultado = {
    sinergiaAtiva: {
      nome: sinergia.nome,
      descricao: sinergia.descricao,
      elementoSuporte: sinergia.elementoSuporte,
      elementoInimigo: sinergia.elementoInimigo,
      tipoSuporte: sinergia.tipoSuporte,
      raridadeSuporte: avatarSuporte.raridade || 'Comum',
      multiplicadorRaridade
    },
    modificadores,
    logTexto,
    modificadoresFormatados
  };

  console.log('✅ [SINERGIA DEBUG] aplicarSinergia() retornando:', {
    nome: resultado.sinergiaAtiva.nome,
    modificadores: resultado.modificadores,
    modificadoresFormatados: resultado.modificadoresFormatados
  });

  return resultado;
}

/**
 * Calcula HP com modificadores de sinergia
 * @param {number} hpBase - HP base calculado
 * @param {object} modificadores - Modificadores da sinergia
 * @returns {number} HP ajustado
 */
export function calcularHPComSinergia(hpBase, modificadores) {
  if (!modificadores || !modificadores.hp) {
    return hpBase;
  }

  const hpAjustado = Math.floor(hpBase * (1 + modificadores.hp));
  return Math.max(1, hpAjustado); // HP mínimo de 1
}

/**
 * Calcula Energia com modificadores de sinergia
 * @param {number} energiaBase - Energia base (sempre 100)
 * @param {object} modificadores - Modificadores da sinergia
 * @returns {number} Energia ajustada
 */
export function calcularEnergiaComSinergia(energiaBase, modificadores) {
  if (!modificadores || !modificadores.energia) {
    return energiaBase;
  }

  const energiaAjustada = Math.floor(energiaBase * (1 + modificadores.energia));
  return Math.max(10, energiaAjustada); // Energia mínima de 10
}

/**
 * Aplica modificador de dano de habilidades
 * @param {number} danoBase - Dano base da habilidade
 * @param {object} modificadores - Modificadores da sinergia
 * @returns {number} Dano ajustado
 */
export function aplicarModificadorDanoHabilidades(danoBase, modificadores) {
  if (!modificadores || !modificadores.dano_habilidades) {
    return danoBase;
  }

  const danoAjustado = danoBase * (1 + modificadores.dano_habilidades);
  return Math.floor(danoAjustado);
}

/**
 * Aplica modificador de resistência
 * @param {number} resistenciaBase - Resistência base
 * @param {object} modificadores - Modificadores da sinergia
 * @returns {number} Resistência ajustada
 */
export function aplicarModificadorResistencia(resistenciaBase, modificadores) {
  if (!modificadores || !modificadores.resistencia) {
    return resistenciaBase;
  }

  const resistenciaAjustada = resistenciaBase * (1 + modificadores.resistencia);
  return Math.floor(resistenciaAjustada);
}

/**
 * Aplica modificador de evasão
 * @param {number} evasaoBase - Evasão base
 * @param {object} modificadores - Modificadores da sinergia
 * @returns {number} Evasão ajustada
 */
export function aplicarModificadorEvasao(evasaoBase, modificadores) {
  if (!modificadores || !modificadores.evasao) {
    return evasaoBase;
  }

  const evasaoAjustada = evasaoBase * (1 + modificadores.evasao);
  return evasaoAjustada;
}

/**
 * Preview de sinergia - Mostra o que o Avatar Suporte pode fazer
 * NOVO SISTEMA: Mostra as sinergias possíveis do elemento do suporte
 *
 * @param {string} elementoSuporte - Elemento do avatar suporte
 * @param {string} raridadeSuporte - Raridade do suporte (para multiplicador)
 * @returns {object} Preview das sinergias possíveis
 */
export function previewSinergia(elementoSuporte, raridadeSuporte = 'Comum') {
  if (!elementoSuporte) {
    return null;
  }

  const multiplicador = MULTIPLICADORES_RARIDADE[raridadeSuporte] || 1.0;

  // Usar sinergias importadas do sistema
  const sinergiaElemento = SYNERGIES_SIMPLIFIED[elementoSuporte];

  if (!sinergiaElemento) {
    return null;
  }

  const contrainimigo = sinergiaElemento.contrainimigo;

  // Criar lista de matchups possíveis
  const matchups = [];

  // Adicionar matchups específicos
  for (const [elemento, sinergia] of Object.entries(contrainimigo)) {
    if (elemento === 'default') continue;

    const modificadoresAjustados = {};
    for (const [tipo, valor] of Object.entries(sinergia.modificadores)) {
      modificadoresAjustados[tipo] = valor * multiplicador;
    }

    matchups.push({
      elemento,
      nome: sinergia.nome,
      descricao: sinergia.descricao,
      modificadores: modificadoresAjustados,
      tipo: 'especifico'
    });
  }

  // Adicionar matchup padrão
  const defaultSinergia = contrainimigo.default;
  if (defaultSinergia) {
    const modificadoresAjustados = {};
    for (const [tipo, valor] of Object.entries(defaultSinergia.modificadores)) {
      modificadoresAjustados[tipo] = valor * multiplicador;
    }

    matchups.push({
      elemento: 'Outros',
      nome: defaultSinergia.nome,
      descricao: defaultSinergia.descricao,
      modificadores: modificadoresAjustados,
      tipo: 'default'
    });
  }

  return {
    elementoSuporte,
    tipoSuporte: sinergiaElemento.tipo,
    descricaoGeral: sinergiaElemento.descricao,
    raridadeSuporte,
    multiplicador,
    matchups
  };
}

export default {
  aplicarSinergia,
  calcularHPComSinergia,
  calcularEnergiaComSinergia,
  aplicarModificadorDanoHabilidades,
  aplicarModificadorResistencia,
  aplicarModificadorEvasao,
  previewSinergia
};
