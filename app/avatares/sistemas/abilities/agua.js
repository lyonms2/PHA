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
import { COMBAT_BALANCE } from '../balance/combatBalance.js';
import { COOLDOWN_BALANCE } from '../balance/cooldownBalance.js';
import { EFFECT_BALANCE } from '../balance/effectBalance.js';

export const HABILIDADES_AGUA = {
  // ==================== 1️⃣ MAREMOTO ====================
  MAREMOTO: criarHabilidade({
    nome: 'Maremoto',
    descricao: 'Onda gigante com 70% chance de congelar o inimigo (pula próximo turno)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.AGUA,
    dano_base: 0, // Sem dano base fixo - 100% baseado em stats
    multiplicador_stat: COMBAT_BALANCE.MULTIPLICADOR_HABILIDADE_MEDIA, // Foco × 3.5
    stat_primario: 'foco',
    efeitos_status: ['congelado'],
    chance_efeito: EFFECT_BALANCE.CHANCE_CONTROLE_ALTA * 100, // 70%
    duracao_efeito: COOLDOWN_BALANCE.DURACAO_CONTROLE_FRACO, // 1 turno
    custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_FORTE, // 35
    cooldown: COOLDOWN_BALANCE.COOLDOWN_DANO_MEDIO, // 2 turnos
    nivel_minimo: 1
  }),

  // ==================== 2️⃣ CURA AQUÁTICA ====================
  CURA_AQUATICA: criarHabilidade({
    nome: 'Cura Aquática',
    descricao: 'Água purificadora restaura 20% do HP máximo instantaneamente',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.AGUA,
    dano_base: -20, // Negativo = cura (20% do HP máximo)
    multiplicador_stat: 0,
    stat_primario: 'foco',
    efeitos_status: ['cura_instantanea'],
    alvo: 'self',
    custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_MEDIA, // 25
    cooldown: COOLDOWN_BALANCE.COOLDOWN_CURA_PEQUENA, // 3 turnos
    nivel_minimo: 1
  })
};

/**
 * ========================================
 * RESUMO DAS 2 HABILIDADES DE ÁGUA
 * ========================================
 *
 * 1️⃣ MAREMOTO (Ataque)
 *    Dano: Foco × 3.5 (MULTIPLICADOR_HABILIDADE_MEDIA)
 *    Efeitos: 70% chance de congelar (pula 1 turno)
 *    Energia: 35 (FORTE) | Cooldown: 2 (MEDIO)
 *
 * 2️⃣ CURA AQUÁTICA (Suporte)
 *    Dano: 0 (não ataca)
 *    Efeitos: Restaura 20% HP máximo instantaneamente
 *    Energia: 25 (MEDIA) | Cooldown: 3 (CURA_PEQUENA)
 *
 * ✅ SISTEMA BALANCEADO CENTRALIZADO
 * ✅ Usa valores de combatBalance, cooldownBalance, effectBalance
 * ✅ Efeitos claros e diretos
 * ✅ Fácil de balancear e entender
 */
