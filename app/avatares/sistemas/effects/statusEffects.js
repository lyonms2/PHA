// ==================== SISTEMA DE EFEITOS DE STATUS ====================
// Arquivo: /app/avatares/sistemas/effects/statusEffects.js
// Extraído de: abilitiesSystem.js

/**
 * Efeitos de status possíveis
 *
 * Tipos de efeitos:
 * - dano_continuo: Causa dano por turno
 * - controle: Impede ou dificulta ações
 * - debuff: Reduz stats ou efetividade
 * - buff: Aumenta stats ou efetividade
 * - buff_risco: Buff que causa debuff
 * - cura_continua: Cura por turno
 * - defensivo: Efeitos defensivos especiais
 * - especial: Efeitos especiais únicos
 * - zona: Efeitos em zona de combate
 */
export const EFEITOS_STATUS = {
  // ==================== EFEITOS OFENSIVOS ====================

  queimadura: {
    nome: 'Queimadura',
    tipo: 'dano_continuo',
    dano_por_turno: 0.05, // 5% do HP máximo
    duracao_base: 3,
    icone: '🔥'
  },

  queimadura_intensa: {
    nome: 'Queimadura Intensa',
    tipo: 'dano_continuo',
    dano_por_turno: 0.10,
    duracao_base: 3,
    icone: '🔥🔥'
  },

  queimadura_contra_ataque: {
    nome: 'Queimadura Contra-Ataque',
    tipo: 'dano_continuo',
    dano_por_turno: 0.04,
    duracao_base: 2,
    icone: '🔥'
  },

  congelado: {
    nome: 'Congelado',
    tipo: 'controle',
    efeito: 'impede_acao',
    duracao_base: 2,
    icone: '❄️'
  },

  paralisia: {
    nome: 'Paralisia',
    tipo: 'controle',
    chance_falha: 0.30, // 30% chance de falhar ação
    duracao_base: 2,
    icone: '⚡'
  },

  paralisia_intensa: {
    nome: 'Paralisia Intensa',
    tipo: 'controle',
    chance_falha: 0.60,
    duracao_base: 2,
    icone: '⚡⚡'
  },

  atordoado: {
    nome: 'Atordoado',
    tipo: 'controle',
    efeito: 'pula_turno',
    duracao_base: 1,
    icone: '💫'
  },

  desorientado: {
    nome: 'Desorientado',
    tipo: 'debuff',
    reducao_acerto: 0.30, // -30% chance de acerto
    duracao_base: 2,
    icone: '🌀'
  },

  enfraquecido: {
    nome: 'Enfraquecido',
    tipo: 'debuff',
    reducao_stats: 0.25, // -25% em todos os stats
    duracao_base: 3,
    icone: '⬇️'
  },

  lentidao: {
    nome: 'Lentidão',
    tipo: 'debuff',
    reducao_agilidade: 0.40, // -40% agilidade
    duracao_base: 3,
    icone: '🐌'
  },

  afogamento: {
    nome: 'Afogamento',
    tipo: 'dano_continuo',
    dano_por_turno: 0.08,
    duracao_base: 3,
    icone: '💧'
  },

  maldito: {
    nome: 'Maldito',
    tipo: 'dano_continuo',
    dano_por_turno: 0.07,
    impede_cura: true,
    duracao_base: 4,
    icone: '💀'
  },

  eletrocucao: {
    nome: 'Eletrocução',
    tipo: 'dano_continuo',
    dano_por_turno: 0.06,
    duracao_base: 3,
    icone: '⚡'
  },

  // ==================== EFEITOS DEFENSIVOS / BUFFS ====================

  defesa_aumentada: {
    nome: 'Defesa Aumentada',
    tipo: 'buff',
    bonus_resistencia: 0.50, // +50% resistência
    duracao_base: 3,
    icone: '🛡️'
  },

  defesa_aumentada_instantanea: {
    nome: 'Defesa Aumentada (Turno Atual)',
    tipo: 'buff',
    bonus_resistencia: 0.60, // +60% resistência APENAS neste turno
    duracao_base: 1, // Dura apenas 1 turno (instantâneo)
    icone: '🛡️🔥',
    instantaneo: true // Flag para indicar que é efeito instantâneo
  },

  evasao_aumentada: {
    nome: 'Evasão Aumentada',
    tipo: 'buff',
    bonus_evasao: 0.30, // +30% evasão
    duracao_base: 3,
    icone: '💨'
  },

  velocidade_aumentada: {
    nome: 'Velocidade Aumentada',
    tipo: 'buff',
    bonus_agilidade: 0.40, // +40% agilidade
    duracao_base: 3,
    icone: '⚡'
  },

  sobrecarga: {
    nome: 'Sobrecarga',
    tipo: 'buff_risco',
    bonus_foco: 0.60, // +60% foco
    reducao_resistencia: 0.30, // -30% resistência
    duracao_base: 3,
    icone: '⚡🔴'
  },

  bencao: {
    nome: 'Benção',
    tipo: 'buff',
    bonus_todos_stats: 0.20, // +20% todos os stats
    duracao_base: 3,
    icone: '✨'
  },

  regeneracao: {
    nome: 'Regeneração',
    tipo: 'cura_continua',
    cura_por_turno: 0.05, // 5% HP por turno
    duracao_base: 4,
    icone: '💚'
  },

  invisivel: {
    nome: 'Invisível',
    tipo: 'defensivo',
    evasao_total: true, // 100% evasão
    duracao_base: 1,
    icone: '👻'
  },

  // ==================== EFEITOS ESPECIAIS ====================

  roubo_vida: {
    nome: 'Roubo de Vida',
    tipo: 'especial',
    percentual_roubo: 0.15, // 15% do dano vira cura
    duracao_base: 0, // Instantâneo
    icone: '🩸'
  },

  roubo_vida_intenso: {
    nome: 'Roubo de Vida Intenso',
    tipo: 'especial',
    percentual_roubo: 0.30,
    duracao_base: 0,
    icone: '🩸🩸'
  },

  roubo_vida_massivo: {
    nome: 'Roubo de Vida Massivo',
    tipo: 'especial',
    percentual_roubo: 0.40,
    duracao_base: 0,
    icone: '🩸🩸🩸'
  },

  perfuracao: {
    nome: 'Perfuração',
    tipo: 'especial',
    ignora_defesa: 0.40, // Ignora 40% da defesa
    duracao_base: 0,
    icone: '🗡️'
  },

  execucao: {
    nome: 'Execução',
    tipo: 'especial',
    bonus_baixo_hp: 0.50, // +50% dano em alvos com <30% HP
    limite_hp: 0.30,
    duracao_base: 0,
    icone: '💀'
  },

  auto_cura: {
    nome: 'Auto Cura',
    tipo: 'especial',
    percentual_cura: 0.25, // 25% do dano é convertido em cura
    duracao_base: 0,
    icone: '💚'
  },

  dano_massivo_inimigos: {
    nome: 'Dano Massivo nos Inimigos',
    tipo: 'especial',
    multiplicador_dano_extra: 1.5, // 50% de dano extra
    duracao_base: 0,
    icone: '💥'
  },

  terror: {
    nome: 'Terror',
    tipo: 'debuff',
    reducao_stats: 0.40, // -40% em todos os stats
    duracao_base: 3,
    icone: '😱'
  },

  // ==================== EFEITOS DE ZONA ====================

  campo_eletrico: {
    nome: 'Campo Elétrico',
    tipo: 'zona',
    dano_entrada: 20,
    duracao_base: 4,
    icone: '⚡🔷'
  },

  fissuras_explosivas: {
    nome: 'Fissuras Explosivas',
    tipo: 'zona',
    dano_continuo: 0.06,
    duracao_base: 3,
    icone: '💥'
  },

  vendaval_cortante: {
    nome: 'Vendaval Cortante',
    tipo: 'zona',
    dano_continuo: 0.04,
    duracao_base: 2,
    icone: '🌪️'
  },

  precisao_aumentada: {
    nome: 'Precisão Aumentada',
    tipo: 'buff',
    bonus_acerto: 0.25, // +25% chance de acerto
    duracao_base: 3,
    icone: '🎯'
  },

  // ==================== EFEITOS DE LIMPEZA ====================

  limpar_debuffs: {
    nome: 'Limpar Debuffs',
    tipo: 'especial',
    remove_debuffs: true,
    duracao_base: 0,
    icone: '✨'
  }
};

/**
 * Obtém um efeito de status pelo nome
 * @param {string} nomEfeito - Nome do efeito
 * @returns {Object|null} Objeto do efeito ou null
 */
export function obterEfeito(nomEfeito) {
  return EFEITOS_STATUS[nomEfeito] || null;
}

/**
 * Verifica se um efeito existe
 * @param {string} nomEfeito - Nome do efeito
 * @returns {boolean}
 */
export function efeitoExiste(nomEfeito) {
  return nomEfeito in EFEITOS_STATUS;
}

/**
 * Lista todos os efeitos de um tipo específico
 * @param {string} tipo - Tipo de efeito
 * @returns {Array} Array de nomes de efeitos
 */
export function obterEfeitosPorTipo(tipo) {
  return Object.entries(EFEITOS_STATUS)
    .filter(([_, efeito]) => efeito.tipo === tipo)
    .map(([nome, _]) => nome);
}

/**
 * Obtém a duração de um efeito
 * @param {string} nomEfeito - Nome do efeito
 * @returns {number} Duração base em turnos
 */
export function obterDuracaoEfeito(nomEfeito) {
  const efeito = EFEITOS_STATUS[nomEfeito];
  return efeito ? efeito.duracao_base : 0;
}

/**
 * Verifica se um efeito é contínuo (tem duração)
 * @param {string} nomEfeito - Nome do efeito
 * @returns {boolean}
 */
export function efeitoEhContinuo(nomEfeito) {
  const efeito = EFEITOS_STATUS[nomEfeito];
  return efeito && efeito.duracao_base > 0;
}

/**
 * Verifica se um efeito é instantâneo
 * @param {string} nomEfeito - Nome do efeito
 * @returns {boolean}
 */
export function efeitoEhInstantaneo(nomEfeito) {
  const efeito = EFEITOS_STATUS[nomEfeito];
  return efeito && efeito.duracao_base === 0;
}

/**
 * Obtém todos os nomes de efeitos disponíveis
 * @returns {Array} Array com todos os nomes de efeitos
 */
export function obterTodosOsEfeitos() {
  return Object.keys(EFEITOS_STATUS);
}

/**
 * Conta quantos efeitos existem
 * @returns {number}
 */
export function contagemEfeitos() {
  return Object.keys(EFEITOS_STATUS).length;
}

// Exportação default
export default {
  EFEITOS_STATUS,
  obterEfeito,
  efeitoExiste,
  obterEfeitosPorTipo,
  obterDuracaoEfeito,
  efeitoEhContinuo,
  efeitoEhInstantaneo,
  obterTodosOsEfeitos,
  contagemEfeitos
};
