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
import { COMBAT_BALANCE } from '../balance/combatBalance.js';
import { COOLDOWN_BALANCE } from '../balance/cooldownBalance.js';
import { EFFECT_BALANCE } from '../balance/effectBalance.js';

export const HABILIDADES_AETHER = {
  // ==================== 1️⃣ RAIO PRIMORDIAL ====================
  RAIO_PRIMORDIAL: criarHabilidade({
    nome: 'Raio Primordial',
    descricao: 'Descarga devastadora de energia primordial que penetra 75% da defesa e purifica TODOS os debuffs próprios',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.AETHER,
    dano_base: COMBAT_BALANCE.DANO_BASE_HABILIDADE_FORTE, // 10 base
    multiplicador_stat: COMBAT_BALANCE.MULTIPLICADOR_HABILIDADE_FORTE, // Foco × 4.5 (AETHER - supremo!)
    stat_primario: 'foco',
    ignora_defesa: 0.75, // ESPECIAL AETHER: Ignora 75% defesa
    efeitos_status: ['limpar_debuffs', 'sobrecarga'], // Remove debuffs + buff temporário
    custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_FORTE + 10, // 45 (mais caro)
    cooldown: COOLDOWN_BALANCE.COOLDOWN_DANO_FORTE, // 3 turnos
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
    duracao_efeito: COOLDOWN_BALANCE.DURACAO_BUFF_SELF_MEDIO, // 3 → 2 turnos ativos
    alvo: 'self',
    custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_MEDIA + 10, // 35 (muito caro)
    cooldown: COOLDOWN_BALANCE.COOLDOWN_SUPORTE_ESPECIAL, // 4 turnos
    nivel_minimo: 1
  })
};

/**
 * ========================================
 * RESUMO DAS 2 HABILIDADES DE AETHER
 * ========================================
 *
 * 1️⃣ RAIO PRIMORDIAL (Ataque) ⚡ DEVASTADOR
 *    Dano: 10 base + Foco × 4.5 (MULTIPLICADOR_HABILIDADE_FORTE - EXTREMAMENTE FORTE!)
 *    Efeitos: Penetra 75% defesa + Remove TODOS debuffs + Sobrecarga
 *    Energia: 45 (FORTE + 10) | Cooldown: 3 (FORTE)
 *
 * 2️⃣ CAMPO DE TRANSCENDÊNCIA (Suporte) 🌟 SUPREMO
 *    Dano: 0 (não ataca)
 *    Efeitos: +50% TODOS stats por 2 turnos (MEGA BUFF!)
 *    Energia: 35 (MEDIA + 10) | Cooldown: 4 (SUPORTE_ESPECIAL)
 *
 * ✅ SISTEMA BALANCEADO CENTRALIZADO
 * ✅ Usa valores de combatBalance, cooldownBalance, effectBalance
 * ✅ Efeitos claros e diretos
 * ✅ Fácil de balancear e entender
 * ✅ ESPECIALIDADE: Penetração de defesa, mega buffs, transcendência
 */
