// ==================== HABILIDADES DE VOID - SIMPLIFICADO ====================
// Arquivo: /app/avatares/sistemas/abilities/void.js
//
// ESTRUTURA SIMPLIFICADA: 2 habilidades por elemento
// 1. Ataque Forte - Dano + efeito temático do elemento
// 2. Defesa/Suporte - Proteção/buff temático
//
// Sistema de combate: Ataque Básico + Defender + 2 Habilidades
// ESPECIALIDADE: Ignora defesa, remove buffs

import { TIPO_HABILIDADE, RARIDADE_HABILIDADE, criarHabilidade } from '../constants/abilityTypes';
import { ELEMENTOS } from '../elementalSystem';
import { COMBAT_BALANCE } from '../balance/combatBalance.js';
import { COOLDOWN_BALANCE } from '../balance/cooldownBalance.js';
import { EFFECT_BALANCE } from '../balance/effectBalance.js';

export const HABILIDADES_VOID = {
  // ==================== 1️⃣ RUPTURA DIMENSIONAL ====================
  RUPTURA_DIMENSIONAL: criarHabilidade({
    nome: 'Ruptura Dimensional',
    descricao: 'Rasga a realidade causando dano massivo, ignorando 80% da defesa e removendo TODOS os buffs do inimigo',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.VOID,
    dano_base: COMBAT_BALANCE.DANO_BASE_HABILIDADE_FORTE, // 10 base
    multiplicador_stat: COMBAT_BALANCE.MULTIPLICADOR_HABILIDADE_FORTE, // Foco × 4.5 (VOID - mais forte!)
    stat_primario: 'foco',
    ignora_defesa: 0.80, // ESPECIAL VOID: Ignora 80% defesa
    efeitos_status: ['anula_buffs'], // Remove buffs do inimigo
    custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_FORTE, // 35 (supremo dominante)
    cooldown: COOLDOWN_BALANCE.COOLDOWN_DANO_FORTE, // 3 turnos
    nivel_minimo: 1
  }),

  // ==================== 2️⃣ CAMPO DE ANULAÇÃO ====================
  CAMPO_DE_ANULACAO: criarHabilidade({
    nome: 'Campo de Anulação',
    descricao: 'Cria um vácuo protetor que reduz 40% do dano recebido por 2 turnos',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.VOID,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'foco',
    efeitos_status: ['reducao_dano'], // Efeito especial: 40% redução por 2 turnos
    duracao_efeito: COOLDOWN_BALANCE.DURACAO_BUFF_SELF_MEDIO, // 3 → 2 turnos ativos
    alvo: 'self',
    custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_MEDIA + 5, // 30 (um pouco mais caro)
    cooldown: COOLDOWN_BALANCE.COOLDOWN_SUPORTE_ESPECIAL, // 4 turnos
    nivel_minimo: 1
  })
};

/**
 * ========================================
 * RESUMO DAS 2 HABILIDADES DE VOID
 * ========================================
 *
 * 1️⃣ RUPTURA DIMENSIONAL (Ataque) ⚠️ PODEROSO
 *    Dano: 10 base + Foco × 4.5 (MULTIPLICADOR_HABILIDADE_FORTE - MAIS FORTE!)
 *    Efeitos: Ignora 80% defesa + Remove TODOS buffs do inimigo
 *    Energia: 35 (FORTE - supremo dominante) | Cooldown: 3 (FORTE)
 *
 * 2️⃣ CAMPO DE ANULAÇÃO (Defesa) 🛡️ TANQUE
 *    Dano: 0 (não ataca)
 *    Efeitos: Reduz 40% dano recebido por 2 turnos
 *    Energia: 30 (MEDIA + 5) | Cooldown: 4 (SUPORTE_ESPECIAL)
 *
 * ✅ SISTEMA BALANCEADO CENTRALIZADO
 * ✅ Usa valores de combatBalance, cooldownBalance, effectBalance
 * ✅ Efeitos claros e diretos
 * ✅ Fácil de balancear e entender
 * ✅ ESPECIALIDADE: Penetração de defesa e remoção de buffs
 */
