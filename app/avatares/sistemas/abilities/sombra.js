// ==================== HABILIDADES DE SOMBRA - SIMPLIFICADO ====================
// Arquivo: /app/avatares/sistemas/abilities/sombra.js
//
// ESTRUTURA SIMPLIFICADA: 2 habilidades por elemento
// 1. Ataque Forte - Dano + efeito temático do elemento
// 2. Defesa/Suporte - Proteção/buff temático
//
// Sistema de combate: Ataque Básico + Defender + 2 Habilidades

import { TIPO_HABILIDADE, RARIDADE_HABILIDADE, criarHabilidade } from '../constants/abilityTypes';
import { ELEMENTOS } from '../elementalSystem';

export const HABILIDADES_SOMBRA = {
  // ==================== 1️⃣ ABRAÇO DAS TREVAS ====================
  ABRACO_DAS_TREVAS: criarHabilidade({
    nome: 'Abraço das Trevas',
    descricao: 'Drena vida intensamente (dano alto + cura 30% do dano causado)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.SOMBRA,
    dano_base: 100,
    multiplicador_stat: 2.0,
    stat_primario: 'foco',
    efeitos_status: ['roubo_vida_intenso'],
    custo_energia: 40,
    cooldown: 2,
    nivel_minimo: 1
  }),

  // ==================== 2️⃣ MANTO DA NOITE ====================
  MANTO_DA_NOITE: criarHabilidade({
    nome: 'Manto da Noite',
    descricao: 'Torna-se invisível (100% evasão por 1 turno)',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.SOMBRA,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'foco',
    efeitos_status: ['invisivel'],
    alvo: 'self',
    custo_energia: 30,
    cooldown: 4,
    nivel_minimo: 1
  })
};

/**
 * ========================================
 * RESUMO DAS 2 HABILIDADES DE SOMBRA
 * ========================================
 *
 * 1️⃣ ABRAÇO DAS TREVAS (Ataque)
 *    Dano: 100 base + Foco×2.0
 *    Efeitos: Roubo de vida (cura 30% do dano causado)
 *    Energia: 40 | Cooldown: 2
 *
 * 2️⃣ MANTO DA NOITE (Suporte)
 *    Dano: 0 (não ataca)
 *    Efeitos: Invisibilidade (100% evasão por 1 turno)
 *    Energia: 30 | Cooldown: 4
 *
 * ✅ SISTEMA SIMPLIFICADO
 * ✅ Efeitos claros e diretos
 * ✅ Fácil de balancear e entender
 */
