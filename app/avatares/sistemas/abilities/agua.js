// ==================== HABILIDADES DE ÁGUA - SIMPLIFICADO ====================
// Arquivo: /app/avatares/sistemas/abilities/agua.js
//
// ESTRUTURA SIMPLIFICADA: 2 habilidades por elemento
// 1. Ataque Forte - Dano + efeito temático do elemento
// 2. Defesa/Suporte - Proteção/buff temático
//
// Sistema de combate: Ataque Básico + Defender + 2 Habilidades

import { TIPO_HABILIDADE, RARIDADE_HABILIDADE, criarHabilidade } from '../constants/abilityTypes';
import { ELEMENTOS } from '../elementalSystem';

export const HABILIDADES_AGUA = {
  // ==================== 1️⃣ MAREMOTO ====================
  MAREMOTO: criarHabilidade({
    nome: 'Maremoto',
    descricao: 'Onda gigante com 70% chance de congelar o inimigo (pula próximo turno)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.AGUA,
    dano_base: 100,
    multiplicador_stat: 2.0,
    stat_primario: 'foco',
    efeitos_status: ['congelado'],
    chance_efeito: 70,
    duracao_efeito: 1,
    custo_energia: 40,
    cooldown: 2,
    nivel_minimo: 1
  }),

  // ==================== 2️⃣ CURA AQUÁTICA ====================
  CURA_AQUATICA: criarHabilidade({
    nome: 'Cura Aquática',
    descricao: 'Água purificadora restaura 30% do HP máximo instantaneamente',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.AGUA,
    dano_base: -30, // Negativo = cura (30% do HP máximo)
    multiplicador_stat: 0,
    stat_primario: 'foco',
    efeitos_status: ['cura_instantanea'],
    alvo: 'self',
    custo_energia: 30,
    cooldown: 3,
    nivel_minimo: 1
  })
};

/**
 * ========================================
 * RESUMO DAS 2 HABILIDADES DE ÁGUA
 * ========================================
 *
 * 1️⃣ MAREMOTO (Ataque)
 *    Dano: 100 base + Foco×2.0
 *    Efeitos: 70% chance de congelar (pula 1 turno)
 *    Energia: 40 | Cooldown: 2
 *
 * 2️⃣ CURA AQUÁTICA (Suporte)
 *    Dano: 0 (não ataca)
 *    Efeitos: Restaura 30% HP máximo instantaneamente
 *    Energia: 30 | Cooldown: 3
 *
 * ✅ SISTEMA SIMPLIFICADO
 * ✅ Efeitos claros e diretos
 * ✅ Fácil de balancear e entender
 */
