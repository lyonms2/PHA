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

export const HABILIDADES_VOID = {
  // ==================== 1️⃣ RUPTURA DIMENSIONAL ====================
  RUPTURA_DIMENSIONAL: criarHabilidade({
    nome: 'Ruptura Dimensional',
    descricao: 'Rasga a realidade causando dano massivo, ignorando 80% da defesa e removendo TODOS os buffs do inimigo',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.VOID,
    dano_base: 0, // Sem dano base fixo - 100% baseado em stats
    multiplicador_stat: 4.0, // Foco × 4.0 (VOID - mais forte que elementos básicos)
    stat_primario: 'foco',
    ignora_defesa: 0.80, // Aumentado de 50% para 80%
    efeitos_status: ['anula_buffs'], // Remove buffs do inimigo
    custo_energia: 50, // Aumentado de 40 para 50 (mais poderoso = mais caro)
    cooldown: 3, // Aumentado de 2 para 3
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
    alvo: 'self',
    custo_energia: 35, // Aumentado de 30 para 35
    cooldown: 4, // Aumentado de 3 para 4
    nivel_minimo: 1
  })
};

/**
 * ========================================
 * RESUMO DAS 2 HABILIDADES DE VOID
 * ========================================
 *
 * 1️⃣ RUPTURA DIMENSIONAL (Ataque) ⚠️ PODEROSO
 *    Dano: 130 base + Foco×2.2 (MAIS FORTE!)
 *    Efeitos: Ignora 80% defesa + Remove TODOS buffs do inimigo
 *    Energia: 50 | Cooldown: 3
 *
 * 2️⃣ CAMPO DE ANULAÇÃO (Defesa) 🛡️ TANQUE
 *    Dano: 0 (não ataca)
 *    Efeitos: Reduz 40% dano recebido por 2 TURNOS
 *    Energia: 35 | Cooldown: 4
 *
 * ✅ SISTEMA SIMPLIFICADO
 * ✅ Efeitos claros e diretos
 * ✅ Fácil de balancear e entender
 * ✅ ESPECIALIDADE: Penetração de defesa e remoção de buffs
 */
