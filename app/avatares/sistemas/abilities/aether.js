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
    descricao: 'Descarga devastadora de energia primordial que penetra 75% da defesa e purifica TODOS os debuffs próprios',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.AETHER,
    dano_base: 125, // Aumentado de 100 para 125
    multiplicador_stat: 2.3, // Aumentado de 2.0 para 2.3
    stat_primario: 'foco',
    ignora_defesa: 0.75, // Aumentado de 50% para 75%
    efeitos_status: ['limpar_debuffs', 'sobrecarga'], // Remove debuffs + buff temporário
    custo_energia: 50, // Aumentado de 40 para 50
    cooldown: 3, // Aumentado de 2 para 3
    nivel_minimo: 1
  }),

  // ==================== 2️⃣ CAMPO DE TRANSCENDÊNCIA ====================
  CAMPO_DE_TRANSCENDENCIA: criarHabilidade({
    nome: 'Campo de Transcendência',
    descricao: 'Eleva o corpo a estado superior (+50% em TODOS os stats por 2 turnos)',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.AETHER,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'foco',
    efeitos_status: ['transcendencia'], // +50% todos os stats por 2 turnos
    alvo: 'self',
    custo_energia: 40, // Aumentado de 30 para 40
    cooldown: 4, // Aumentado de 3 para 4
    nivel_minimo: 1
  })
};

/**
 * ========================================
 * RESUMO DAS 2 HABILIDADES DE AETHER
 * ========================================
 *
 * 1️⃣ RAIO PRIMORDIAL (Ataque) ⚡ DEVASTADOR
 *    Dano: 125 base + Foco×2.3 (EXTREMAMENTE FORTE!)
 *    Efeitos: Penetra 75% defesa + Remove TODOS debuffs + Sobrecarga
 *    Energia: 50 | Cooldown: 3
 *
 * 2️⃣ CAMPO DE TRANSCENDÊNCIA (Suporte) 🌟 SUPREMO
 *    Dano: 0 (não ataca)
 *    Efeitos: +50% TODOS stats por 2 TURNOS (MEGA BUFF!)
 *    Energia: 40 | Cooldown: 4
 *
 * ✅ SISTEMA SIMPLIFICADO
 * ✅ Efeitos claros e diretos
 * ✅ Fácil de balancear e entender
 * ✅ ESPECIALIDADE: Penetração de defesa, mega buffs, transcendência
 */
