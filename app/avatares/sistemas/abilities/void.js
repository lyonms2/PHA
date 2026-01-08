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
    descricao: 'Rasga a realidade causando dano e ignorando 50% da defesa, removendo buffs do inimigo',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.VOID,
    dano_base: 100,
    multiplicador_stat: 2.0,
    stat_primario: 'foco',
    ignora_defesa: 0.50, // Ignora 50% da defesa
    efeitos_status: ['anula_buffs'], // Remove buffs do inimigo
    custo_energia: 40,
    cooldown: 2,
    nivel_minimo: 1
  }),

  // ==================== 2️⃣ CAMPO DE ANULAÇÃO ====================
  CAMPO_DE_ANULACAO: criarHabilidade({
    nome: 'Campo de Anulação',
    descricao: 'Reduz dano recebido em 40% por 1 turno',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.VOID,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'foco',
    efeitos_status: ['reducao_dano'],
    alvo: 'self',
    custo_energia: 30,
    cooldown: 3,
    nivel_minimo: 1
  })
};

/**
 * ========================================
 * RESUMO DAS 2 HABILIDADES DE VOID
 * ========================================
 *
 * 1️⃣ RUPTURA DIMENSIONAL (Ataque)
 *    Dano: 100 base + Foco×2.0
 *    Efeitos: Ignora 50% defesa + Remove buffs do inimigo
 *    Energia: 40 | Cooldown: 2
 *
 * 2️⃣ CAMPO DE ANULAÇÃO (Defesa)
 *    Dano: 0 (não ataca)
 *    Efeitos: Reduz dano recebido em 40% por 1 turno
 *    Energia: 30 | Cooldown: 3
 *
 * ✅ SISTEMA SIMPLIFICADO
 * ✅ Efeitos claros e diretos
 * ✅ Fácil de balancear e entender
 * ✅ ESPECIALIDADE: Penetração de defesa e remoção de buffs
 */
