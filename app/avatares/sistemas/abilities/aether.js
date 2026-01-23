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
    descricao: 'Descarga devastadora de energia primordial que enfraquece força e foco do inimigo em 30% por 2 turnos',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.AETHER,
    dano_base: COMBAT_BALANCE.DANO_BASE_HABILIDADE_FORTE, // 10 base
    multiplicador_stat: COMBAT_BALANCE.MULTIPLICADOR_HABILIDADE_FORTE, // Foco × 4.5
    stat_primario: 'foco',
    efeitos_status: ['enfraquecimento_primordial'], // -30% força e foco por 2 turnos
    custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_FORTE, // 35
    cooldown: COOLDOWN_BALANCE.COOLDOWN_DANO_FORTE, // 3 turnos
    nivel_minimo: 1
  }),

  // ==================== 2️⃣ ESCUDO ENERGÉTICO ====================
  ESCUDO_ENERGETICO: criarHabilidade({
    nome: 'Escudo Energético',
    descricao: 'Cria um escudo de energia primordial que reduz 50% do dano recebido e drena 10 de energia do atacante por 2 turnos',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.AETHER,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'foco',
    efeitos_status: ['escudo_energetico'], // 50% redução + drena 10 energia do atacante
    duracao_efeito: COOLDOWN_BALANCE.DURACAO_BUFF_SELF_MEDIO, // 3 → 2 turnos ativos
    alvo: 'self',
    custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_MEDIA + 5, // 30
    cooldown: COOLDOWN_BALANCE.COOLDOWN_SUPORTE_ESPECIAL, // 4 turnos
    nivel_minimo: 1
  })
};

/**
 * ========================================
 * RESUMO DAS 2 HABILIDADES DE AETHER
 * ========================================
 *
 * 1️⃣ RAIO PRIMORDIAL (Ataque) ⚡ ENFRAQUECEDOR
 *    Dano: 10 base + Foco × 4.5 (MULTIPLICADOR_HABILIDADE_FORTE)
 *    Efeitos: Reduz força e foco do inimigo em 30% por 2 turnos
 *    Energia: 35 (FORTE) | Cooldown: 3 (FORTE)
 *
 * 2️⃣ ESCUDO ENERGÉTICO (Suporte) 🛡️✨ DRENADOR
 *    Dano: 0 (não ataca)
 *    Efeitos: Reduz 50% dano recebido + Drena 10 energia do atacante por 2 turnos
 *    Energia: 30 (MEDIA + 5) | Cooldown: 4 (SUPORTE_ESPECIAL)
 *
 * ✅ SISTEMA BALANCEADO CENTRALIZADO
 * ✅ Usa valores de combatBalance, cooldownBalance, effectBalance
 * ✅ Efeitos claros e diretos
 * ✅ Fácil de balancear e entender
 * ✅ ESPECIALIDADE: Enfraquecimento ofensivo + Drenagem defensiva
 */
