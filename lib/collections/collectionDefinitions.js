// ==================== SISTEMA DE COLEÇÕES DE AVATARES ====================
// Coleções temáticas que dão recompensas ao serem completadas

/**
 * Tipos de coleções
 */
export const TIPOS_COLECAO = {
  ELEMENTO: 'ELEMENTO',           // Coletar X avatares de um elemento
  RARIDADE: 'RARIDADE',           // Coletar X avatares de uma raridade
  CARACTERISTICA: 'CARACTERISTICA', // Coletar avatares com características específicas
  PODER: 'PODER',                 // Coletar avatares com poder total alto
  COMPLETA: 'COMPLETA'            // Coletar TODOS os avatares de um critério
};

/**
 * Tipos de resgate (como funciona a coleção)
 */
export const TIPOS_RESGATE = {
  NORMAL: 'NORMAL',       // Só precisa TER os avatares (não perde eles)
  DEDICADA: 'DEDICADA'    // Precisa DEDICAR os avatares (vão pro Hall da Fama, liberam slots)
};

/**
 * Definições de todas as coleções disponíveis
 */
export const COLECOES = [
  // ========== COLEÇÕES DE ELEMENTO ==========
  {
    id: 'colecao_fogo_basica',
    nome: 'Mestre do Fogo I',
    descricao: 'Colete 5 avatares de Fogo',
    icone: '🔥',
    tipo: TIPOS_COLECAO.ELEMENTO,
    criterio: {
      elemento: 'Fogo',
      quantidade: 5
    },
    recompensas: {
      moedas: 500,
      fragmentos: 10,
      xpCacador: 50
    },
    raridade: 'Comum',
    tipoResgate: TIPOS_RESGATE.NORMAL
  },
  {
    id: 'colecao_fogo_avancada',
    nome: 'Mestre do Fogo II',
    descricao: 'Colete 10 avatares de Fogo',
    icone: '🔥',
    tipo: TIPOS_COLECAO.ELEMENTO,
    criterio: {
      elemento: 'Fogo',
      quantidade: 10
    },
    recompensas: {
      moedas: 1200,
      fragmentos: 25,
      xpCacador: 120
    },
    raridade: 'Raro',
    prerequisito: 'colecao_fogo_basica',
    tipoResgate: TIPOS_RESGATE.NORMAL
  },
  {
    id: 'colecao_agua_basica',
    nome: 'Mestre da Água I',
    descricao: 'Colete 5 avatares de Água',
    icone: '💧',
    tipo: TIPOS_COLECAO.ELEMENTO,
    criterio: {
      elemento: 'Água',
      quantidade: 5
    },
    recompensas: {
      moedas: 500,
      fragmentos: 10,
      xpCacador: 50
    },
    raridade: 'Comum',
    tipoResgate: TIPOS_RESGATE.NORMAL
  },
  {
    id: 'colecao_terra_basica',
    nome: 'Mestre da Terra I',
    descricao: 'Colete 5 avatares de Terra',
    icone: '🪨',
    tipo: TIPOS_COLECAO.ELEMENTO,
    criterio: {
      elemento: 'Terra',
      quantidade: 5
    },
    recompensas: {
      moedas: 500,
      fragmentos: 10,
      xpCacador: 50
    },
    raridade: 'Comum',
    tipoResgate: TIPOS_RESGATE.NORMAL
  },
  {
    id: 'colecao_ar_basica',
    nome: 'Mestre do Ar I',
    descricao: 'Colete 5 avatares de Ar',
    icone: '💨',
    tipo: TIPOS_COLECAO.ELEMENTO,
    criterio: {
      elemento: 'Ar',
      quantidade: 5
    },
    recompensas: {
      moedas: 500,
      fragmentos: 10,
      xpCacador: 50
    },
    raridade: 'Comum',
    tipoResgate: TIPOS_RESGATE.NORMAL
  },

  // ========== COLEÇÕES DE RARIDADE ==========
  {
    id: 'colecao_lendarios',
    nome: 'Colecionador Lendário',
    descricao: 'Colete 3 avatares Lendários',
    icone: '👑',
    tipo: TIPOS_COLECAO.RARIDADE,
    criterio: {
      raridade: 'Lendário',
      quantidade: 3
    },
    recompensas: {
      moedas: 2000,
      fragmentos: 50,
      xpCacador: 200
    },
    raridade: 'Lendário',
    tipoResgate: TIPOS_RESGATE.NORMAL
  },
  {
    id: 'colecao_raros',
    nome: 'Caçador de Raros',
    descricao: 'Colete 5 avatares Raros',
    icone: '💎',
    tipo: TIPOS_COLECAO.RARIDADE,
    criterio: {
      raridade: 'Raro',
      quantidade: 5
    },
    recompensas: {
      moedas: 800,
      fragmentos: 20,
      xpCacador: 80
    },
    raridade: 'Raro',
    tipoResgate: TIPOS_RESGATE.NORMAL
  },

  // ========== COLEÇÕES DE CARACTERÍSTICA ==========
  {
    id: 'colecao_tres_olhos',
    nome: 'Visão Tripla',
    descricao: 'Colete 3 avatares com 3 olhos',
    icone: '👁️',
    tipo: TIPOS_COLECAO.CARACTERISTICA,
    criterio: {
      caracteristica: 'olhos',
      valor: 3,
      quantidade: 3
    },
    recompensas: {
      moedas: 600,
      fragmentos: 15,
      xpCacador: 60
    },
    raridade: 'Raro',
    tipoResgate: TIPOS_RESGATE.NORMAL
  },
  {
    id: 'colecao_com_asas',
    nome: 'Esquadrão Alado',
    descricao: 'Colete 5 avatares com asas',
    icone: '🦅',
    tipo: TIPOS_COLECAO.CARACTERISTICA,
    criterio: {
      caracteristica: 'temAsas',
      valor: true,
      quantidade: 5
    },
    recompensas: {
      moedas: 700,
      fragmentos: 18,
      xpCacador: 70
    },
    raridade: 'Raro',
    tipoResgate: TIPOS_RESGATE.NORMAL
  },
  {
    id: 'colecao_com_chifres',
    nome: 'Legião Cornuda',
    descricao: 'Colete 4 avatares com chifres',
    icone: '😈',
    tipo: TIPOS_COLECAO.CARACTERISTICA,
    criterio: {
      caracteristica: 'temChifres',
      valor: true,
      quantidade: 4
    },
    recompensas: {
      moedas: 650,
      fragmentos: 16,
      xpCacador: 65
    },
    raridade: 'Raro',
    tipoResgate: TIPOS_RESGATE.NORMAL
  },

  // ========== COLEÇÕES DE PODER ==========
  {
    id: 'colecao_poder_500',
    nome: 'Elite de Poder',
    descricao: 'Colete 3 avatares com poder total 500+',
    icone: '⚡',
    tipo: TIPOS_COLECAO.PODER,
    criterio: {
      poderMinimo: 500,
      quantidade: 3
    },
    recompensas: {
      moedas: 1000,
      fragmentos: 30,
      xpCacador: 100
    },
    raridade: 'Épico',
    tipoResgate: TIPOS_RESGATE.NORMAL
  },
  {
    id: 'colecao_poder_800',
    nome: 'Força Suprema',
    descricao: 'Colete 2 avatares com poder total 800+',
    icone: '💪',
    tipo: TIPOS_COLECAO.PODER,
    criterio: {
      poderMinimo: 800,
      quantidade: 2
    },
    recompensas: {
      moedas: 1500,
      fragmentos: 40,
      xpCacador: 150
    },
    raridade: 'Lendário',
    tipoResgate: TIPOS_RESGATE.NORMAL
  },

  // ========== COLEÇÕES COMPLETAS ==========
  {
    id: 'colecao_4_elementos',
    nome: 'Mestre dos Elementos',
    descricao: 'Tenha pelo menos 1 avatar de cada elemento',
    icone: '🌟',
    tipo: TIPOS_COLECAO.COMPLETA,
    criterio: {
      elementos: ['Fogo', 'Água', 'Terra', 'Ar'],
      quantidadePorElemento: 1
    },
    recompensas: {
      moedas: 1000,
      fragmentos: 25,
      xpCacador: 100
    },
    raridade: 'Épico',
    tipoResgate: TIPOS_RESGATE.NORMAL
  },
  {
    id: 'colecao_diversidade',
    nome: 'Colecionador Diverso',
    descricao: 'Colete 20 avatares diferentes',
    icone: '🎭',
    tipo: TIPOS_COLECAO.COMPLETA,
    criterio: {
      totalAvatares: 20
    },
    recompensas: {
      moedas: 2500,
      fragmentos: 60,
      xpCacador: 250
    },
    raridade: 'Lendário',
    tipoResgate: TIPOS_RESGATE.NORMAL
  },

  // ========== COLEÇÕES PREMIUM (DEDICADAS) ==========
  {
    id: 'hall_elementos_supremos',
    nome: '🏛️ Hall dos Elementos Supremos',
    descricao: 'DEDIQUE 1 avatar Lendário de cada elemento (4 total)',
    icone: '🏛️',
    tipo: TIPOS_COLECAO.COMPLETA,
    criterio: {
      dedicar: true,
      elementosLendarios: ['Fogo', 'Água', 'Terra', 'Ar'],
      raridade: 'Lendário'
    },
    recompensas: {
      moedas: 5000,
      fragmentos: 100,
      xpCacador: 500,
      avatarLendarioGarantido: true,
      titulo: 'Mestre Supremo dos Elementos'
    },
    raridade: 'Lendário',
    tipoResgate: TIPOS_RESGATE.DEDICADA,
    avisoImportante: '⚠️ Avatares dedicados vão para o Hall da Fama permanentemente'
  },
  {
    id: 'hall_titans',
    nome: '🏛️ Hall dos Titãs',
    descricao: 'DEDIQUE 3 avatares com 1000+ de poder total',
    icone: '⚡',
    tipo: TIPOS_COLECAO.PODER,
    criterio: {
      dedicar: true,
      poderMinimo: 1000,
      quantidade: 3
    },
    recompensas: {
      moedas: 8000,
      fragmentos: 150,
      xpCacador: 800,
      avatarLendarioGarantido: true,
      titulo: 'Senhor dos Titãs'
    },
    raridade: 'Lendário',
    tipoResgate: TIPOS_RESGATE.DEDICADA,
    avisoImportante: '⚠️ Avatares dedicados vão para o Hall da Fama permanentemente'
  },
  {
    id: 'hall_lendas',
    nome: '🏛️ Salão das Lendas',
    descricao: 'DEDIQUE 5 avatares Lendários',
    icone: '👑',
    tipo: TIPOS_COLECAO.RARIDADE,
    criterio: {
      dedicar: true,
      raridade: 'Lendário',
      quantidade: 5
    },
    recompensas: {
      moedas: 10000,
      fragmentos: 200,
      xpCacador: 1000,
      avatarLendarioGarantido: 2, // 2 avatares lendários
      titulo: 'Colecionador Supremo'
    },
    raridade: 'Lendário',
    tipoResgate: TIPOS_RESGATE.DEDICADA,
    avisoImportante: '⚠️ Avatares dedicados vão para o Hall da Fama permanentemente'
  },
  {
    id: 'hall_unicidade',
    nome: '🏛️ Museu da Unicidade',
    descricao: 'DEDIQUE 1 avatar de cada raridade (Comum, Incomum, Raro, Épico, Lendário)',
    icone: '💎',
    tipo: TIPOS_COLECAO.COMPLETA,
    criterio: {
      dedicar: true,
      todasRaridades: ['Comum', 'Incomum', 'Raro', 'Épico', 'Lendário']
    },
    recompensas: {
      moedas: 6000,
      fragmentos: 120,
      xpCacador: 600,
      avatarLendarioGarantido: true,
      titulo: 'Curador do Museu'
    },
    raridade: 'Épico',
    tipoResgate: TIPOS_RESGATE.DEDICADA,
    avisoImportante: '⚠️ Avatares dedicados vão para o Hall da Fama permanentemente'
  }
];

/**
 * Retorna cor da raridade da coleção
 */
export function getCorRaridadeColecao(raridade) {
  const cores = {
    'Comum': 'text-gray-400',
    'Raro': 'text-blue-400',
    'Épico': 'text-purple-400',
    'Lendário': 'text-orange-400'
  };
  return cores[raridade] || 'text-gray-400';
}

/**
 * Retorna cor de fundo da raridade da coleção
 */
export function getBgRaridadeColecao(raridade) {
  const cores = {
    'Comum': 'from-gray-600 to-gray-700',
    'Raro': 'from-blue-600 to-blue-700',
    'Épico': 'from-purple-600 to-purple-700',
    'Lendário': 'from-orange-600 to-red-600'
  };
  return cores[raridade] || 'from-gray-600 to-gray-700';
}

export default {
  TIPOS_COLECAO,
  TIPOS_RESGATE,
  COLECOES,
  getCorRaridadeColecao,
  getBgRaridadeColecao
};
