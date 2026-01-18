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
import { COMBAT_BALANCE } from '../balance/combatBalance.js';
import { COOLDOWN_BALANCE } from '../balance/cooldownBalance.js';
import { EFFECT_BALANCE } from '../balance/effectBalance.js';

export const HABILIDADES_SOMBRA = {
  // ==================== 1️⃣ ABRAÇO DAS TREVAS ====================
  ABRACO_DAS_TREVAS: criarHabilidade({
    nome: 'Abraço das Trevas',
    descricao: 'Drena vida intensamente (dano alto + cura 25% do dano causado)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.SOMBRA,
    dano_base: 0, // Sem dano base fixo - 100% baseado em stats
    multiplicador_stat: COMBAT_BALANCE.MULTIPLICADOR_HABILIDADE_MEDIA, // Foco × 3.5
    stat_primario: 'foco',
    efeitos_status: ['roubo_vida_intenso'],
    custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_FORTE, // 35
    cooldown: COOLDOWN_BALANCE.COOLDOWN_DANO_MEDIO, // 2 turnos
    nivel_minimo: 1
  }),

  // ==================== 2️⃣ MANTO DA NOITE ====================
  MANTO_DA_NOITE: criarHabilidade({
    nome: 'Manto da Noite',
    descricao: 'Torna-se invisível (aumenta muito a evasão por 2 turnos)',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.SOMBRA,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'foco',
    efeitos_status: ['invisivel'],
    duracao_efeito: COOLDOWN_BALANCE.DURACAO_BUFF_SELF_MEDIO, // 3 → 2 turnos ativos
    alvo: 'self',
    custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_MEDIA, // 25
    cooldown: COOLDOWN_BALANCE.COOLDOWN_SUPORTE_ESPECIAL, // 4 turnos
    nivel_minimo: 1
  })
};

/**
 * ========================================
 * RESUMO DAS 2 HABILIDADES DE SOMBRA
 * ========================================
 *
 * 1️⃣ ABRAÇO DAS TREVAS (Ataque)
 *    Dano: Foco × 3.5 (MULTIPLICADOR_HABILIDADE_MEDIA)
 *    Efeitos: Roubo de vida (cura 25% do dano causado)
 *    Energia: 35 (FORTE) | Cooldown: 2 (MEDIO)
 *
 * 2️⃣ MANTO DA NOITE (Suporte)
 *    Dano: 0 (não ataca)
 *    Efeitos: Invisibilidade (alta evasão por 2 turnos)
 *    Energia: 25 (MEDIA) | Cooldown: 4 (SUPORTE_ESPECIAL)
 *
 * ✅ SISTEMA BALANCEADO CENTRALIZADO
 * ✅ Usa valores de combatBalance, cooldownBalance, effectBalance
 * ✅ Efeitos claros e diretos
 * ✅ Fácil de balancear e entender
 */
