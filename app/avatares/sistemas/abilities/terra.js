// ==================== HABILIDADES DE TERRA - SIMPLIFICADO ====================
// Arquivo: /app/avatares/sistemas/abilities/terra.js
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

export const HABILIDADES_TERRA = {
  // ==================== 1️⃣ TERREMOTO ====================
  TERREMOTO: criarHabilidade({
    nome: 'Terremoto',
    descricao: 'Fissura devastadora com 70% chance de atordoar o inimigo (pula próximo turno)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.TERRA,
    dano_base: 0, // Sem dano base fixo - 100% baseado em stats
    multiplicador_stat: COMBAT_BALANCE.MULTIPLICADOR_HABILIDADE_MEDIA, // Força × 3.5
    stat_primario: 'forca',
    efeitos_status: ['atordoado'],
    chance_efeito: EFFECT_BALANCE.CHANCE_CONTROLE_ALTA * 100, // 70%
    duracao_efeito: COOLDOWN_BALANCE.DURACAO_CONTROLE_FRACO, // 1 turno
    custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_FORTE, // 35
    cooldown: COOLDOWN_BALANCE.COOLDOWN_DANO_MEDIO, // 2 turnos
    nivel_minimo: 1
  }),

  // ==================== 2️⃣ MURALHA DE PEDRA ====================
  MURALHA_DE_PEDRA: criarHabilidade({
    nome: 'Muralha de Pedra',
    descricao: 'Ergue uma barreira rochosa que aumenta +50% resistência por 2 turnos',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.TERRA,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'resistencia',
    efeitos_status: ['defesa_aumentada'],
    duracao_efeito: COOLDOWN_BALANCE.DURACAO_BUFF_SELF_MEDIO, // 3 → 2 turnos ativos
    alvo: 'self',
    custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_MEDIA, // 25
    cooldown: COOLDOWN_BALANCE.COOLDOWN_BUFF_MEDIO, // 3 turnos
    nivel_minimo: 1
  })
};

/**
 * ========================================
 * RESUMO DAS 2 HABILIDADES DE TERRA
 * ========================================
 *
 * 1️⃣ TERREMOTO (Ataque)
 *    Dano: Força × 3.5 (MULTIPLICADOR_HABILIDADE_MEDIA)
 *    Efeitos: 70% chance de atordoar (pula 1 turno)
 *    Energia: 35 (FORTE) | Cooldown: 2 (MEDIO)
 *
 * 2️⃣ MURALHA DE PEDRA (Defesa)
 *    Dano: 0 (não ataca)
 *    Efeitos: +50% resistência por 2 turnos
 *    Energia: 25 (MEDIA) | Cooldown: 3 (BUFF_MEDIO)
 *
 * ✅ SISTEMA BALANCEADO CENTRALIZADO
 * ✅ Usa valores de combatBalance, cooldownBalance, effectBalance
 * ✅ Efeitos claros e diretos
 * ✅ Fácil de balancear e entender
 */
