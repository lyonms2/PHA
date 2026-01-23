// ==================== HABILIDADES DE ELETRICIDADE - SIMPLIFICADO ====================
// Arquivo: /app/avatares/sistemas/abilities/eletricidade.js
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

export const HABILIDADES_ELETRICIDADE = {
  // ==================== 1️⃣ RELÂMPAGO ====================
  RELAMPAGO: criarHabilidade({
    nome: 'Relâmpago',
    descricao: 'Raio devastador com 70% chance de paralisar o inimigo (30% chance de falhar ações por 1 turno)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.ELETRICIDADE,
    dano_base: 0, // Sem dano base fixo - 100% baseado em stats
    multiplicador_stat: COMBAT_BALANCE.MULTIPLICADOR_HABILIDADE_MEDIA, // Foco × 3.5
    stat_primario: 'foco',
    efeitos_status: ['paralisia'],
    chance_efeito: EFFECT_BALANCE.CHANCE_CONTROLE_ALTA * 100, // 70%
    duracao_efeito: COOLDOWN_BALANCE.DURACAO_CONTROLE_FRACO, // 1 turno
    custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_FORTE, // 40
    cooldown: COOLDOWN_BALANCE.COOLDOWN_DANO_MEDIO, // 2 turnos
    nivel_minimo: 1
  }),

  // ==================== 2️⃣ SOBRECARGA ====================
  SOBRECARGA: criarHabilidade({
    nome: 'Sobrecarga',
    descricao: 'Aumenta drasticamente o foco (+35% foco por 2 turnos, mas reduz resistência em 30%)',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.ELETRICIDADE,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'foco',
    efeitos_status: ['sobrecarga'],
    duracao_efeito: COOLDOWN_BALANCE.DURACAO_BUFF_SELF_MEDIO, // 3 → 2 turnos ativos
    alvo: 'self',
    custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_MEDIA, // 30
    cooldown: 4, // 4 turnos - previne 100% uptime (antes: 3)
    nivel_minimo: 1
  })
};

/**
 * ========================================
 * RESUMO DAS 2 HABILIDADES DE ELETRICIDADE
 * ========================================
 *
 * 1️⃣ RELÂMPAGO (Ataque)
 *    Dano: Foco × 3.5 (MULTIPLICADOR_HABILIDADE_MEDIA)
 *    Efeitos: 70% chance de paralisar (30% chance de falhar ações)
 *    Energia: 40 (FORTE) | Cooldown: 2 (MEDIO)
 *
 * 2️⃣ SOBRECARGA (Suporte)
 *    Dano: 0 (não ataca)
 *    Efeitos: +35% foco por 2 turnos (BUFF_STAT_MEDIO), -30% resistência
 *    Energia: 30 (MEDIA) | Cooldown: 3 (BUFF_MEDIO)
 *
 * ✅ SISTEMA BALANCEADO CENTRALIZADO
 * ✅ Usa valores de combatBalance, cooldownBalance, effectBalance
 * ✅ Efeitos claros e diretos
 * ✅ Fácil de balancear e entender
 */
