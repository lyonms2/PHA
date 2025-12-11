// ==================== APLICADOR DE SINERGIAS ====================
// Sistema que aplica bônus e desvantagens de sinergias aos stats de avatares

import { getSynergy, isSpecialSynergy } from './synergySystem';

/**
 * Aplica sinergia entre Avatar Principal e Avatar Suporte
 * Retorna stats modificados do avatar principal
 *
 * @param {object} principal - Avatar principal (quem luta)
 * @param {object} suporte - Avatar suporte (quem dá bônus)
 * @returns {object} Stats modificados e informações da sinergia
 */
export function aplicarSinergia(principal, suporte) {
  if (!principal) {
    throw new Error('Avatar principal é obrigatório');
  }

  // Se não houver suporte, retorna principal sem modificações
  if (!suporte) {
    return {
      stats: { ...principal },
      synergy: null,
      modificadores: {}
    };
  }

  // Obter sinergia entre os elementos
  const sinergia = getSynergy(principal.elemento, suporte.elemento);

  if (!sinergia) {
    console.warn(`Sinergia não encontrada: ${principal.elemento} + ${suporte.elemento}`);
    return {
      stats: { ...principal },
      synergy: null,
      modificadores: {}
    };
  }

  // Clonar stats do principal para modificar
  const statsModificados = { ...principal };
  const modificadores = {};

  // ==================== APLICAR BÔNUS ====================
  if (sinergia.bonus) {
    Object.entries(sinergia.bonus).forEach(([tipo, valor]) => {
      aplicarBonus(statsModificados, modificadores, tipo, valor);
    });
  }

  // ==================== APLICAR DESVANTAGENS ====================
  if (sinergia.desvantagem) {
    Object.entries(sinergia.desvantagem).forEach(([tipo, valor]) => {
      aplicarDesvantagem(statsModificados, modificadores, tipo, valor);
    });
  }

  return {
    stats: statsModificados,
    synergy: {
      nome: sinergia.nome,
      descricao: sinergia.descricao,
      elementos: { principal: principal.elemento, suporte: suporte.elemento },
      isSpecial: isSpecialSynergy(principal.elemento, suporte.elemento)
    },
    modificadores
  };
}

/**
 * Aplica um bônus específico
 */
function aplicarBonus(stats, modificadores, tipo, valor) {
  switch (tipo) {
    // ========== BÔNUS DE STATS BÁSICOS ==========
    case 'forca':
      stats.forca = Math.floor(stats.forca * (1 + valor));
      modificadores.forca = `+${Math.floor(valor * 100)}%`;
      break;

    case 'agilidade':
      stats.agilidade = Math.floor(stats.agilidade * (1 + valor));
      modificadores.agilidade = `+${Math.floor(valor * 100)}%`;
      break;

    case 'resistencia':
      stats.resistencia = Math.floor(stats.resistencia * (1 + valor));
      modificadores.resistencia = `+${Math.floor(valor * 100)}%`;
      break;

    case 'foco':
      stats.foco = Math.floor(stats.foco * (1 + valor));
      modificadores.foco = `+${Math.floor(valor * 100)}%`;
      break;

    case 'todos_stats':
      stats.forca = Math.floor(stats.forca * (1 + valor));
      stats.agilidade = Math.floor(stats.agilidade * (1 + valor));
      stats.resistencia = Math.floor(stats.resistencia * (1 + valor));
      stats.foco = Math.floor(stats.foco * (1 + valor));
      modificadores.todos_stats = `+${Math.floor(valor * 100)}% todos stats`;
      break;

    // ========== BÔNUS DE COMBATE ==========
    case 'dano':
      modificadores.dano_bonus = valor;
      break;

    case 'defesa':
      modificadores.defesa_bonus = valor;
      break;

    case 'evasao':
      modificadores.evasao_bonus = valor;
      break;

    case 'acuracia':
      modificadores.acuracia_bonus = valor;
      break;

    case 'critico_chance':
      modificadores.critico_chance_bonus = valor;
      break;

    // ========== EFEITOS ESPECIAIS (BOOLEAN) ==========
    case 'alcance':
      modificadores.alcance = valor; // 'area', 'corrente', etc.
      break;

    case 'dot_spread':
      modificadores.dot_spread = valor;
      break;

    case 'empurra_inimigo':
      modificadores.empurra_inimigo = valor;
      break;

    case 'atordoa':
      modificadores.atordoa = valor;
      break;

    case 'stun':
      modificadores.stun = valor;
      break;

    case 'first_strike':
      modificadores.first_strike = valor;
      break;

    case 'purifica_debuffs':
    case 'purifica_tudo':
    case 'remove_debuffs':
      modificadores.purifica = true;
      break;

    case 'anula_buffs':
    case 'anula_tudo':
      modificadores.anula_buffs = true;
      break;

    case 'anula_evasao':
      modificadores.anula_evasao = true;
      break;

    case 'ignora_defesa':
      modificadores.ignora_defesa = valor;
      break;

    case 'silencio_habilidades':
      modificadores.silencio_habilidades = true;
      break;

    case 'revive_ko':
      modificadores.revive_ko = valor;
      break;

    case 'energia_full':
    case 'energia_infinita':
      modificadores.energia_full = true;
      break;

    case 'imortalidade_temp':
      modificadores.imortalidade_temp = true;
      break;

    case 'remove_exaustao':
      modificadores.remove_exaustao = true;
      break;

    case 'restaura_energia':
    case 'restaura_tudo':
      modificadores.restaura = true;
      break;

    case 'distorce_realidade':
    case 'realidade_distorce':
      modificadores.distorce_realidade = true;
      break;

    // ========== BÔNUS DE RECURSOS ==========
    case 'hp_max':
      modificadores.hp_max_bonus = valor;
      break;

    case 'energia_max':
      modificadores.energia_max_bonus = valor;
      break;

    case 'energia_regen':
      modificadores.energia_regen_bonus = valor;
      break;

    case 'cura':
      modificadores.cura_bonus = valor;
      break;

    case 'regen_continua':
      modificadores.regen_continua = valor;
      break;

    // ========== EFEITOS DE STATUS ==========
    case 'slow_inimigo':
      modificadores.slow_inimigo = valor;
      break;

    case 'paralisia_chance':
      modificadores.paralisia_chance = valor;
      break;

    case 'confusao_inimiga':
    case 'cegueira_inimiga':
      modificadores.debuff_inimigo = { tipo, valor };
      break;

    case 'drena_vida':
      modificadores.drena_vida = valor;
      break;

    case 'drena_energia':
    case 'anula_energia':
      modificadores.drena_energia = valor;
      break;

    case 'dot_chance':
    case 'dot_dano':
      modificadores.dot = { tipo, valor };
      break;

    case 'reflecao_dano':
      modificadores.reflecao_dano = valor;
      break;

    case 'resistencia_status':
    case 'imune_debuffs':
      modificadores.resistencia_status = valor || 1.0;
      break;

    // ========== OUTROS ==========
    case 'furtividade':
      modificadores.furtividade = valor;
      break;

    case 'controle':
      modificadores.controle_bonus = valor;
      break;

    case 'bonus_luz':
      modificadores.bonus_elemental = valor;
      break;

    case 'area_perigo':
      modificadores.area_perigo = true;
      break;

    case 'efeitos_caoticos':
    case 'efeitos_aleatorios':
      modificadores.caotico = true;
      break;

    case 'instakill_chance':
      modificadores.instakill_chance = valor;
      break;

    default:
      // Tipo de bônus desconhecido - armazenar como está
      console.warn(`Tipo de bônus desconhecido: ${tipo}`);
      modificadores[tipo] = valor;
  }
}

/**
 * Aplica uma desvantagem específica
 */
function aplicarDesvantagem(stats, modificadores, tipo, valor) {
  switch (tipo) {
    // ========== PENALIDADES DE STATS ==========
    case 'forca':
      stats.forca = Math.floor(stats.forca * (1 + valor));
      modificadores.forca_penalidade = `${Math.floor(valor * 100)}%`;
      break;

    case 'agilidade':
      stats.agilidade = Math.floor(stats.agilidade * (1 + valor));
      modificadores.agilidade_penalidade = `${Math.floor(valor * 100)}%`;
      break;

    case 'resistencia':
      stats.resistencia = Math.floor(stats.resistencia * (1 + valor));
      modificadores.resistencia_penalidade = `${Math.floor(valor * 100)}%`;
      break;

    case 'foco':
      stats.foco = Math.floor(stats.foco * (1 + valor));
      modificadores.foco_penalidade = `${Math.floor(valor * 100)}%`;
      break;

    // ========== PENALIDADES DE COMBATE ==========
    case 'dano':
      modificadores.dano_penalidade = valor;
      break;

    case 'defesa':
      modificadores.defesa_penalidade = valor;
      break;

    case 'evasao':
      modificadores.evasao_penalidade = valor;
      break;

    case 'acuracia':
      modificadores.acuracia_penalidade = valor;
      break;

    case 'controle':
      modificadores.controle_penalidade = valor;
      break;

    // ========== PENALIDADES DE RECURSOS ==========
    case 'hp_max':
      modificadores.hp_max_penalidade = valor;
      break;

    case 'energia_max':
      modificadores.energia_max_penalidade = valor;
      break;

    case 'energia_regen':
      modificadores.energia_regen_penalidade = valor;
      break;

    case 'custo_energia':
      modificadores.custo_energia_aumento = valor;
      break;

    case 'cura':
      if (valor === -100 || valor === -1) {
        modificadores.cura_bloqueada = true;
      } else {
        modificadores.cura_penalidade = valor;
      }
      break;

    case 'recebe_dano':
      modificadores.recebe_dano_aumento = valor;
      break;

    case 'hp_por_turno':
      modificadores.hp_por_turno_perda = Math.abs(valor);
      break;

    // ========== OUTROS ==========
    case 'furtividade':
      if (valor === -100) {
        modificadores.revelado = true;
      } else {
        modificadores.furtividade_penalidade = valor;
      }
      break;

    default:
      // Tipo de desvantagem desconhecido - armazenar como está
      console.warn(`Tipo de desvantagem desconhecido: ${tipo}`);
      modificadores[`${tipo}_penalidade`] = valor;
  }
}

/**
 * Calcula preview dos modificadores para exibição na UI
 * @param {string} elementoPrincipal
 * @param {string} elementoSuporte
 * @returns {object} Preview da sinergia
 */
export function previewSinergia(elementoPrincipal, elementoSuporte) {
  if (!elementoPrincipal || !elementoSuporte) return null;

  const sinergia = getSynergy(elementoPrincipal, elementoSuporte);
  if (!sinergia) return null;

  return {
    nome: sinergia.nome,
    descricao: sinergia.descricao,
    bonus: sinergia.bonus,
    desvantagem: sinergia.desvantagem,
    isSpecial: isSpecialSynergy(elementoPrincipal, elementoSuporte)
  };
}

/**
 * Formata modificadores para exibição amigável
 * @param {object} modificadores
 * @returns {array} Lista de strings formatadas
 */
export function formatarModificadores(modificadores) {
  const lista = [];

  // Stats
  if (modificadores.forca) lista.push(`💪 Força: ${modificadores.forca}`);
  if (modificadores.agilidade) lista.push(`⚡ Agilidade: ${modificadores.agilidade}`);
  if (modificadores.resistencia) lista.push(`🛡️ Resistência: ${modificadores.resistencia}`);
  if (modificadores.foco) lista.push(`🎯 Foco: ${modificadores.foco}`);

  // Combate
  if (modificadores.dano_bonus) lista.push(`⚔️ Dano: +${Math.floor(modificadores.dano_bonus * 100)}%`);
  if (modificadores.defesa_bonus) lista.push(`🛡️ Defesa: +${Math.floor(modificadores.defesa_bonus * 100)}%`);
  if (modificadores.evasao_bonus) lista.push(`💨 Evasão: +${Math.floor(modificadores.evasao_bonus * 100)}%`);
  if (modificadores.critico_chance_bonus) lista.push(`💥 Crítico: +${Math.floor(modificadores.critico_chance_bonus * 100)}%`);

  // Penalidades
  if (modificadores.dano_penalidade) lista.push(`⚔️ Dano: ${Math.floor(modificadores.dano_penalidade * 100)}%`);
  if (modificadores.defesa_penalidade) lista.push(`🛡️ Defesa: ${Math.floor(modificadores.defesa_penalidade * 100)}%`);
  if (modificadores.cura_bloqueada) lista.push(`❌ Cura bloqueada`);
  if (modificadores.agilidade_penalidade) lista.push(`⚡ Agilidade: ${modificadores.agilidade_penalidade}`);

  // Especiais
  if (modificadores.first_strike) lista.push(`⚡ Ataque primeiro`);
  if (modificadores.purifica) lista.push(`✨ Purifica debuffs`);
  if (modificadores.anula_buffs) lista.push(`🚫 Anula buffs`);
  if (modificadores.drena_vida) lista.push(`🩸 Drena ${Math.floor(modificadores.drena_vida * 100)}% vida`);
  if (modificadores.caotico) lista.push(`🌀 Efeitos caóticos`);

  return lista;
}

export default {
  aplicarSinergia,
  previewSinergia,
  formatarModificadores
};
