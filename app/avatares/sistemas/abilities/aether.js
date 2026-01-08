// ==================== HABILIDADES DE AETHER - SIMPLIFICADO ====================
// Arquivo: /app/avatares/sistemas/abilities/aether.js
//
// ESTRUTURA SIMPLIFICADA: 2 habilidades por elemento
// 1. Ataque Forte - Dano + efeito temático do elemento
// 2. Defesa/Suporte - Proteção/buff temático
//
// Sistema de combate: Ataque Básico + Defender + 2 Habilidades
// ESPECIALIDADE: Transcendência, penetração de defesa, mega buffs

import { TIPO_HABILIDADE, RARIDADE_HABILIDADE, criarHabilidade } from '../constants/abilityTypes';
import { ELEMENTOS } from '../elementalSystem';

export const HABILIDADES_AETHER = {
  // ==================== 1️⃣ RAIO PRIMORDIAL ====================
  RAIO_PRIMORDIAL: criarHabilidade({
    nome: 'Raio Primordial',
    descricao: 'Descarga de energia pura que penetra 50% da defesa e purifica debuffs próprios',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.AETHER,
    dano_base: 100,
    multiplicador_stat: 2.0,
    stat_primario: 'foco',
    ignora_defesa: 0.50, // Penetra 50% da defesa
    efeitos_status: ['limpar_debuffs'], // Remove debuffs próprios
    custo_energia: 40,
    cooldown: 2,
    nivel_minimo: 1
  }),

  // ==================== 2️⃣ CAMPO DE TRANSCENDÊNCIA ====================
  CAMPO_DE_TRANSCENDENCIA: criarHabilidade({
    nome: 'Campo de Transcendência',
    descricao: 'Eleva o corpo a estado superior (+30% em TODOS os stats por 1 turno)',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.AETHER,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'foco',
    efeitos_status: ['transcendencia'], // +30% todos os stats
    alvo: 'self',
    custo_energia: 30,
    cooldown: 3,
    nivel_minimo: 1
  })
};

/**
 * ========================================
 * RESUMO DAS 2 HABILIDADES DE AETHER
 * ========================================
 *
 * 1️⃣ RAIO PRIMORDIAL (Ataque)
 *    Dano: 100 base + Foco×2.0
 *    Efeitos: Penetra 50% defesa + Remove debuffs próprios
 *    Energia: 40 | Cooldown: 2
 *
 * 2️⃣ CAMPO DE TRANSCENDÊNCIA (Suporte)
 *    Dano: 0 (não ataca)
 *    Efeitos: +30% em TODOS os stats por 1 turno
 *    Energia: 30 | Cooldown: 3
 *
 * ✅ SISTEMA SIMPLIFICADO
 * ✅ Efeitos claros e diretos
 * ✅ Fácil de balancear e entender
 * ✅ ESPECIALIDADE: Penetração de defesa, mega buffs, transcendência
 */
