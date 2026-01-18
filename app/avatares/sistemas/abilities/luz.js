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
import { COMBAT_BALANCE } from '../balance/combatBalance.js';
import { COOLDOWN_BALANCE } from '../balance/cooldownBalance.js';
import { EFFECT_BALANCE } from '../balance/effectBalance.js';

export const HABILIDADES_LUZ = {
  // ==================== 1️⃣ JULGAMENTO DIVINO ====================
  JULGAMENTO_DIVINO: criarHabilidade({
    nome: 'Julgamento Divino',
    descricao: 'Ataque sagrado com roubo de vida (dano alto + cura 25% do dano causado)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.LUZ,
    dano_base: 0, // Sem dano base fixo - 100% baseado em stats
    multiplicador_stat: COMBAT_BALANCE.MULTIPLICADOR_HABILIDADE_MEDIA, // Foco × 3.5
    stat_primario: 'foco',
    efeitos_status: ['roubo_vida_intenso'], // 25% do dano vira cura
    custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_FORTE, // 35
    cooldown: COOLDOWN_BALANCE.COOLDOWN_DANO_MEDIO, // 2 turnos
    nivel_minimo: 1
  }),

  // ==================== 2️⃣ BENÇÃO ====================
  BENCAO: criarHabilidade({
    nome: 'Benção',
    descricao: 'Restaura HP ao longo de 2 turnos (regeneração 5% HP por turno)',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.LUZ,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'foco',
    efeitos_status: ['regeneracao'],
    duracao_efeito: COOLDOWN_BALANCE.DURACAO_DOT_FRACO, // 2 turnos (HoT)
    alvo: 'self',
    custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_MEDIA, // 25
    cooldown: COOLDOWN_BALANCE.COOLDOWN_CURA_PEQUENA, // 3 turnos
    nivel_minimo: 1
  })
};

/**
 * ========================================
 * RESUMO DAS 2 HABILIDADES DE LUZ
 * ========================================
 *
 * 1️⃣ JULGAMENTO DIVINO (Ataque)
 *    Dano: Foco × 3.5 (MULTIPLICADOR_HABILIDADE_MEDIA)
 *    Efeitos: Roubo de vida (cura 25% do dano causado)
 *    Energia: 35 (FORTE) | Cooldown: 2 (MEDIO)
 *
 * 2️⃣ BENÇÃO (Suporte)
 *    Dano: 0 (não ataca)
 *    Efeitos: Regeneração 5% HP por turno durante 2 turnos
 *    Energia: 25 (MEDIA) | Cooldown: 3 (CURA_PEQUENA)
 *
 * ✅ SISTEMA BALANCEADO CENTRALIZADO
 * ✅ Usa valores de combatBalance, cooldownBalance, effectBalance
 * ✅ Efeitos claros e diretos
 * ✅ Fácil de balancear e entender
 */
