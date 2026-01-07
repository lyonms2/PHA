// ==================== HABILIDADES DE LUZ - SIMPLIFICADO ====================
// Arquivo: /app/avatares/sistemas/abilities/luz.js
//
// ESTRUTURA SIMPLIFICADA: 2 habilidades por elemento
// 1. Ataque Forte - Dano + efeito temático do elemento
// 2. Defesa/Suporte - Proteção/buff temático
//
// Sistema de combate: Ataque Básico + Defender + 2 Habilidades

import { TIPO_HABILIDADE, RARIDADE_HABILIDADE, criarHabilidade } from '../constants/abilityTypes';
import { ELEMENTOS } from '../elementalSystem';

export const HABILIDADES_LUZ = {
  // ==================== 1️⃣ JULGAMENTO DIVINO ====================
  JULGAMENTO_DIVINO: criarHabilidade({
    nome: 'Julgamento Divino',
    descricao: 'Ataque sagrado com roubo de vida (dano alto + cura 30% do dano causado)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.LUZ,
    dano_base: 100,
    multiplicador_stat: 2.0,
    stat_primario: 'foco',
    efeitos_status: ['roubo_vida_intenso'], // 30% do dano vira cura
    custo_energia: 40,
    cooldown: 2,
    nivel_minimo: 1
  }),

  // ==================== 2️⃣ BENÇÃO ====================
  BENCAO: criarHabilidade({
    nome: 'Benção',
    descricao: 'Aumenta todos os stats em +20% por 1 turno',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.LUZ,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'foco',
    efeitos_status: ['bencao'],
    alvo: 'self',
    custo_energia: 30,
    cooldown: 3,
    nivel_minimo: 1
  })
};

/**
 * ========================================
 * RESUMO DAS 2 HABILIDADES DE LUZ
 * ========================================
 *
 * 1️⃣ JULGAMENTO DIVINO (Ataque)
 *    Dano: 100 base + Foco×2.0
 *    Efeitos: Roubo de vida (cura 30% do dano causado)
 *    Energia: 40 | Cooldown: 2
 *
 * 2️⃣ BENÇÃO (Suporte)
 *    Dano: 0 (não ataca)
 *    Efeitos: +20% em TODOS os stats por 1 turno
 *    Energia: 30 | Cooldown: 3
 *
 * ✅ SISTEMA SIMPLIFICADO
 * ✅ Efeitos claros e diretos
 * ✅ Fácil de balancear e entender
 */
