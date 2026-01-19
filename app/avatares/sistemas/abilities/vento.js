// ==================== HABILIDADES DE VENTO - SIMPLIFICADO ====================
// Arquivo: /app/avatares/sistemas/abilities/vento.js
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

export const HABILIDADES_VENTO = {
  // ==================== 1️⃣ TORNADO ====================
  TORNADO: criarHabilidade({
    nome: 'Tornado',
    descricao: 'Ciclone devastador com 50% chance de desorientar o inimigo (-30% acerto por 1 turno)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.VENTO,
    dano_base: 0, // Sem dano base fixo - 100% baseado em stats
    multiplicador_stat: COMBAT_BALANCE.MULTIPLICADOR_HABILIDADE_MEDIA, // Agilidade × 3.5
    stat_primario: 'agilidade',
    efeitos_status: ['desorientado'],
    chance_efeito: EFFECT_BALANCE.CHANCE_CONTROLE_MEDIA * 100, // 50%
    duracao_efeito: COOLDOWN_BALANCE.DURACAO_CONTROLE_FRACO, // 1 turno
    custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_FORTE, // 35
    cooldown: COOLDOWN_BALANCE.COOLDOWN_DANO_MEDIO, // 2 turnos
    nivel_minimo: 1
  }),

  // ==================== 2️⃣ VELOCIDADE DO VENTO ====================
  VELOCIDADE_DO_VENTO: criarHabilidade({
    nome: 'Velocidade do Vento',
    descricao: 'Aumenta drasticamente a agilidade (+35% agilidade por 2 turnos)',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.VENTO,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'agilidade',
    efeitos_status: ['evasao_aumentada'],
    duracao_efeito: COOLDOWN_BALANCE.DURACAO_BUFF_SELF_MEDIO, // 3 → 2 turnos ativos
    alvo: 'self',
    custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_MEDIA, // 25
    cooldown: COOLDOWN_BALANCE.COOLDOWN_BUFF_MEDIO, // 3 turnos
    nivel_minimo: 1
  })
};

/**
 * ========================================
 * RESUMO DAS 2 HABILIDADES DE VENTO
 * ========================================
 *
 * 1️⃣ TORNADO (Ataque)
 *    Dano: Agilidade × 3.5 (MULTIPLICADOR_HABILIDADE_MEDIA)
 *    Efeitos: 50% chance de desorientar (-30% acerto por 1 turno)
 *    Energia: 35 (FORTE) | Cooldown: 2 (MEDIO)
 *
 * 2️⃣ VELOCIDADE DO VENTO (Suporte)
 *    Dano: 0 (não ataca)
 *    Efeitos: +35% agilidade por 2 turnos
 *    Energia: 25 (MEDIA) | Cooldown: 3 (BUFF_MEDIO)
 *
 * ✅ SISTEMA BALANCEADO CENTRALIZADO
 * ✅ Usa valores de combatBalance, cooldownBalance, effectBalance
 * ✅ Efeitos claros e diretos
 * ✅ Fácil de balancear e entender
 */
