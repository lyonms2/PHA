// ==================== SISTEMA DE EFEITOS DE STATUS ====================
// Arquivo: /app/avatares/sistemas/effects/statusEffects.js
//
// ATUALIZADO: Agora usa valores do sistema centralizado de balanceamento
// Todos os valores vêm de effectBalance.js e cooldownBalance.js
// ================================================================

import { EFFECT_BALANCE } from '../balance/effectBalance.js';
import { COOLDOWN_BALANCE } from '../balance/cooldownBalance.js';

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
 */
export const EFEITOS_STATUS = {

  // ==================== DANO CONTÍNUO (DoT) ====================

  queimadura: {
    nome: 'Queimadura',
    tipo: 'dano_continuo',
    dano_por_turno: EFFECT_BALANCE.DOT_FRACO,  // 5% HP/turno
    duracao_base: COOLDOWN_BALANCE.DURACAO_DOT_FRACO,  // 2 turnos
    icone: '🔥',
    descricao: `Sofre ${(EFFECT_BALANCE.DOT_FRACO * 100).toFixed(0)}% do HP por turno`
  },

  queimadura_intensa: {
    nome: 'Queimadura Intensa',
    tipo: 'dano_continuo',
    dano_por_turno: EFFECT_BALANCE.DOT_FORTE,  // 12% HP/turno
    duracao_base: COOLDOWN_BALANCE.DURACAO_DOT_FORTE,  // 4 turnos
    icone: '🔥🔥',
    descricao: `Sofre ${(EFFECT_BALANCE.DOT_FORTE * 100).toFixed(0)}% do HP por turno (DoT intenso)`
  },

  afogamento: {
    nome: 'Afogamento',
    tipo: 'dano_continuo',
    dano_por_turno: EFFECT_BALANCE.DOT_MEDIO,  // 8% HP/turno
    duracao_base: COOLDOWN_BALANCE.DURACAO_DOT_MEDIO,  // 3 turnos
    icone: '💧'
  },

  eletrocucao: {
    nome: 'Eletrocução',
    tipo: 'dano_continuo',
    dano_por_turno: EFFECT_BALANCE.DOT_MEDIO,  // 8% HP/turno
    duracao_base: COOLDOWN_BALANCE.DURACAO_DOT_MEDIO,  // 3 turnos
    icone: '⚡'
  },

  maldito: {
    nome: 'Maldito',
    tipo: 'dano_continuo',
    dano_por_turno: EFFECT_BALANCE.DOT_MEDIO,  // 8% HP/turno
    impede_cura: true,
    duracao_base: COOLDOWN_BALANCE.DURACAO_DOT_MEDIO,  // 3 turnos
    icone: '💀'
  },


  // ==================== CONTROLE (Stun, Paralisia) ====================

  congelado: {
    nome: 'Congelado',
    tipo: 'controle',
    efeito: 'impede_acao',
    duracao_base: COOLDOWN_BALANCE.DURACAO_CONTROLE_MEDIO,  // 2 turnos (1 ativo)
    icone: '❄️'
  },

  paralisia: {
    nome: 'Paralisia',
    tipo: 'controle',
    chance_falha: EFFECT_BALANCE.CHANCE_CONTROLE_BAIXA,  // 30%
    duracao_base: COOLDOWN_BALANCE.DURACAO_CONTROLE_MEDIO,  // 2 turnos
    icone: '⚡'
  },

  paralisia_intensa: {
    nome: 'Paralisia Intensa',
    tipo: 'controle',
    chance_falha: EFFECT_BALANCE.CHANCE_CONTROLE_MEDIA,  // 50%
    duracao_base: COOLDOWN_BALANCE.DURACAO_CONTROLE_MEDIO,  // 2 turnos
    icone: '⚡⚡'
  },

  atordoado: {
    nome: 'Atordoado',
    tipo: 'controle',
    efeito: 'pula_turno',
    duracao_base: COOLDOWN_BALANCE.DURACAO_CONTROLE_FRACO,  // 1 turno
    icone: '💫'
  },


  // ==================== DEBUFFS (Reduções) ====================

  desorientado: {
    nome: 'Desorientado',
    tipo: 'debuff',
    reducao_acerto: EFFECT_BALANCE.DEBUFF_STAT_MEDIO,  // -30%
    duracao_base: COOLDOWN_BALANCE.DURACAO_DEBUFF_MEDIO,  // 3 turnos
    icone: '🌀'
  },

  enfraquecido: {
    nome: 'Enfraquecido',
    tipo: 'debuff',
    reducao_stats: EFFECT_BALANCE.DEBUFF_STAT_FRACO,  // -20%
    duracao_base: COOLDOWN_BALANCE.DURACAO_DEBUFF_MEDIO,  // 3 turnos
    icone: '⬇️'
  },

  lentidao: {
    nome: 'Lentidão',
    tipo: 'debuff',
    reducao_agilidade: EFFECT_BALANCE.DEBUFF_STAT_FORTE,  // -45%
    duracao_base: COOLDOWN_BALANCE.DURACAO_DEBUFF_MEDIO,  // 3 turnos
    icone: '🐌'
  },

  terror: {
    nome: 'Terror',
    tipo: 'debuff',
    reducao_stats: EFFECT_BALANCE.DEBUFF_STAT_FORTE,  // -45%
    duracao_base: COOLDOWN_BALANCE.DURACAO_DEBUFF_FORTE,  // 4 turnos
    icone: '😱'
  },


  // ==================== BUFFS (Aumentos) ====================

  defesa_aumentada: {
    nome: 'Defesa Aumentada',
    tipo: 'buff',
    bonus_resistencia: EFFECT_BALANCE.BUFF_STAT_FORTE,  // +50%
    duracao_base: COOLDOWN_BALANCE.DURACAO_BUFF_SELF_MEDIO,  // 3 turnos (2 ativos)
    icone: '🛡️'
  },

  defesa_aumentada_instantanea: {
    nome: 'Defesa Aumentada (Turno Atual)',
    tipo: 'buff',
    bonus_resistencia: EFFECT_BALANCE.BUFF_STAT_FORTE,  // +50%
    duracao_base: COOLDOWN_BALANCE.DURACAO_ESPECIAL_CURTA,  // 2 turnos
    icone: '🛡️🔥',
    instantaneo: true
  },

  evasao_aumentada: {
    nome: 'Evasão Aumentada',
    tipo: 'buff',
    bonus_evasao: EFFECT_BALANCE.EVASAO_AUMENTADA_MEDIA,  // +25%
    duracao_base: COOLDOWN_BALANCE.DURACAO_BUFF_SELF_MEDIO,  // 3 turnos
    icone: '💨'
  },

  evasao_aumentada_instantanea: {
    nome: 'Evasão Aumentada (Turno Atual)',
    tipo: 'buff',
    bonus_evasao: EFFECT_BALANCE.EVASAO_AUMENTADA_FORTE,  // +40%
    duracao_base: COOLDOWN_BALANCE.DURACAO_ESPECIAL_CURTA,  // 2 turnos
    icone: '💨⚡',
    instantaneo: true
  },

  velocidade_aumentada: {
    nome: 'Velocidade Aumentada',
    tipo: 'buff',
    bonus_agilidade: EFFECT_BALANCE.BUFF_STAT_MEDIO,  // +35%
    duracao_base: COOLDOWN_BALANCE.DURACAO_BUFF_SELF_MEDIO,  // 3 turnos
    icone: '⚡'
  },

  sobrecarga: {
    nome: 'Sobrecarga',
    tipo: 'buff_risco',
    bonus_foco: EFFECT_BALANCE.BUFF_STAT_MEDIO,  // +35% (antes era 60%!)
    reducao_resistencia: EFFECT_BALANCE.DEBUFF_STAT_MEDIO,  // -30%
    duracao_base: COOLDOWN_BALANCE.DURACAO_BUFF_SELF_MEDIO,  // 3 turnos (2 ativos)
    icone: '⚡🔴'
  },

  bencao: {
    nome: 'Benção',
    tipo: 'buff',
    bonus_todos_stats: EFFECT_BALANCE.BUFF_TODOS_STATS,  // +20%
    duracao_base: COOLDOWN_BALANCE.DURACAO_BUFF_SELF_MEDIO,  // 3 turnos
    icone: '✨'
  },

  transcendencia: {
    nome: 'Transcendência',
    tipo: 'buff',
    bonus_todos_stats: EFFECT_BALANCE.BUFF_STAT_FORTE,  // +50% (AETHER - elemento lendário!)
    duracao_base: COOLDOWN_BALANCE.DURACAO_BUFF_SELF_MEDIO,  // 3 turnos
    icone: '✨🌟',
    instantaneo: true
  },

  precisao_aumentada: {
    nome: 'Precisão Aumentada',
    tipo: 'buff',
    bonus_acerto: EFFECT_BALANCE.PRECISAO_AUMENTADA_MEDIA,  // +25%
    duracao_base: COOLDOWN_BALANCE.DURACAO_BUFF_SELF_MEDIO,  // 3 turnos
    icone: '🎯'
  },


  // ==================== CURA CONTÍNUA (HoT) ====================

  regeneracao: {
    nome: 'Regeneração',
    tipo: 'cura_continua',
    cura_por_turno: EFFECT_BALANCE.HOT_FRACO,  // 5% HP/turno
    duracao_base: COOLDOWN_BALANCE.DURACAO_HOT_MEDIO,  // 3 turnos
    icone: '💚'
  },


  // ==================== EFEITOS DEFENSIVOS ESPECIAIS ====================

  invisivel: {
    nome: 'Invisível',
    tipo: 'defensivo',
    evasao_total: true,  // 100% evasão
    duracao_base: COOLDOWN_BALANCE.DURACAO_ESPECIAL_MEDIA,  // 3 turnos (2 ativos)
    icone: '👻'
  },

  aegis_sagrado: {
    nome: 'Aegis Sagrado',
    tipo: 'defensivo',
    escudo_percentual: 0.35,  // Escudo de 35% HP
    reflexo_dano: 0.15,  // Reflete 15% do dano bloqueado
    duracao_base: COOLDOWN_BALANCE.DURACAO_ESPECIAL_CURTA,  // 2 turnos
    icone: '🛡️✨',
    instantaneo: true,
    descricao: 'Escudo de luz que absorve 35% HP e reflete 15% do dano'
  },

  corrente_temporal: {
    nome: 'Corrente Temporal',
    tipo: 'buff',
    bonus_agilidade: 0.20,  // +20% agilidade
    reduz_cooldown: 1,  // Reduz 1 turno de todos os cooldowns
    duracao_base: COOLDOWN_BALANCE.DURACAO_ESPECIAL_CURTA,  // 2 turnos
    icone: '🌊⏰',
    instantaneo: true,
    descricao: 'Acelera o tempo: reduz cooldowns e aumenta agilidade'
  },

  escudo_flamejante: {
    nome: 'Escudo Flamejante',
    tipo: 'buff',
    contra_ataque_percent: EFFECT_BALANCE.REFLEXAO_DANO_FRACA,  // Reflete 20%
    duracao_base: COOLDOWN_BALANCE.DURACAO_ESPECIAL_CURTA,  // 2 turnos
    icone: '🔥🛡️',
    instantaneo: true,
    descricao: 'Quando recebe dano, queima o atacante com 20% do dano'
  },

  reducao_dano: {
    nome: 'Campo de Anulação',
    tipo: 'buff',
    reducao_dano_recebido: 0.50,  // 50% redução (VOID - elemento lendário)
    drena_energia_atacante: 10,  // Drena 10 energia quando atacado
    duracao_base: COOLDOWN_BALANCE.DURACAO_ESPECIAL_CURTA,  // 2 turnos
    icone: '🛡️💜',
    instantaneo: true,
    descricao: 'Vácuo protetor que reduz dano e drena energia do atacante'
  },


  // ==================== EFEITOS ESPECIAIS (Instantâneos) ====================

  roubo_vida: {
    nome: 'Roubo de Vida',
    tipo: 'especial',
    percentual_roubo: EFFECT_BALANCE.ROUBO_VIDA_FRACO,  // 25%
    duracao_base: 0,  // Instantâneo
    icone: '🩸'
  },

  roubo_vida_intenso: {
    nome: 'Roubo de Vida Intenso',
    tipo: 'especial',
    percentual_roubo: EFFECT_BALANCE.ROUBO_VIDA_FRACO,  // 25% (não 40%)
    duracao_base: 0,
    icone: '🩸🩸'
  },

  roubo_vida_massivo: {
    nome: 'Roubo de Vida Massivo',
    tipo: 'especial',
    percentual_roubo: EFFECT_BALANCE.ROUBO_VIDA_FORTE,  // 50%
    duracao_base: 0,
    icone: '🩸🩸🩸'
  },

  cura_instantanea: {
    nome: 'Cura Instantânea',
    tipo: 'especial',
    percentual_cura: 0.30,  // 30% HP
    duracao_base: 0,
    icone: '💚'
  },

  auto_cura: {
    nome: 'Auto Cura',
    tipo: 'especial',
    percentual_cura: 0.25,  // 25%
    duracao_base: 0,
    icone: '💚'
  },

  perfuracao: {
    nome: 'Perfuração',
    tipo: 'especial',
    ignora_defesa: 0.40,  // Ignora 40% defesa
    duracao_base: 0,
    icone: '🗡️'
  },

  execucao: {
    nome: 'Execução',
    tipo: 'especial',
    bonus_baixo_hp: 0.50,  // +50% dano em <30% HP
    limite_hp: 0.30,
    duracao_base: 0,
    icone: '💀'
  },

  dano_massivo_inimigos: {
    nome: 'Dano Massivo nos Inimigos',
    tipo: 'especial',
    multiplicador_dano_extra: 1.5,  // 50% extra
    duracao_base: 0,
    icone: '💥'
  },

  anula_buffs: {
    nome: 'Anular Buffs',
    tipo: 'especial',
    remove_buffs_inimigo: true,
    duracao_base: 0,
    icone: '🚫'
  },

  limpar_debuffs: {
    nome: 'Limpar Debuffs',
    tipo: 'especial',
    remove_debuffs: true,
    duracao_base: 0,
    icone: '✨'
  },

  dreno_energia: {
    nome: 'Dreno de Energia',
    tipo: 'especial',
    drena_energia: 30,
    duracao_base: 0,
    icone: '⚡💀'
  },

  enfraquecimento_primordial: {
    nome: 'Ruptura Dimensional',
    tipo: 'debuff',
    reducao_forca: EFFECT_BALANCE.DEBUFF_STAT_MEDIO,  // -30%
    reducao_foco: EFFECT_BALANCE.DEBUFF_STAT_MEDIO,  // -30%
    duracao_base: COOLDOWN_BALANCE.DURACAO_ESPECIAL_CURTA,  // 2 turnos
    icone: '🕳️⬇️',
    descricao: 'Vazio consome força e foco do alvo'
  },

  escudo_energetico: {
    nome: 'Escudo Energético',
    tipo: 'buff',
    reducao_dano_recebido: 0.50,  // 50% redução (AETHER - elemento lendário)
    acerto_garantido: true,  // 100% de acerto enquanto ativo
    duracao_base: COOLDOWN_BALANCE.DURACAO_ESPECIAL_CURTA,  // 2 turnos
    icone: '✨🛡️',
    instantaneo: true,
    descricao: 'Energia primordial que transcende limitações'
  },


  // ==================== EFEITOS DE ZONA ====================

  campo_eletrico: {
    nome: 'Campo Elétrico',
    tipo: 'zona',
    dano_entrada: 20,
    duracao_base: COOLDOWN_BALANCE.DURACAO_ESPECIAL_CURTA,  // 2 turnos
    icone: '⚡🔷'
  },

  fissuras_explosivas: {
    nome: 'Fissuras Explosivas',
    tipo: 'zona',
    dano_continuo: EFFECT_BALANCE.DOT_MEDIO,  // 8%
    duracao_base: COOLDOWN_BALANCE.DURACAO_ESPECIAL_CURTA,  // 2 turnos
    icone: '💥'
  },

  vendaval_cortante: {
    nome: 'Vendaval Cortante',
    tipo: 'zona',
    dano_continuo: EFFECT_BALANCE.DOT_FRACO,  // 5%
    duracao_base: COOLDOWN_BALANCE.DURACAO_ESPECIAL_CURTA,  // 2 turnos
    icone: '🌪️'
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
