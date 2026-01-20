// ==================== HABILIDADES DE FOGO - SIMPLIFICADO ====================
// Arquivo: /app/avatares/sistemas/abilities/fogo.js
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

export const HABILIDADES_FOGO = {
  // ==================== 1️⃣ EXPLOSÃO DE CHAMAS ====================
  EXPLOSAO_DE_CHAMAS: criarHabilidade({
    nome: 'Explosão de Chamas',
    descricao: 'Ataque explosivo de fogo com 70% chance de queimar o inimigo (5% HP de dano por turno durante 2 turnos)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.FOGO,
    dano_base: 0, // Sem dano base fixo - 100% baseado em stats
    multiplicador_stat: COMBAT_BALANCE.MULTIPLICADOR_HABILIDADE_MEDIA, // Força × 3.5
    stat_primario: 'forca',
    efeitos_status: ['queimadura'],
    chance_efeito: EFFECT_BALANCE.CHANCE_CONTROLE_ALTA * 100, // 70%
    duracao_efeito: COOLDOWN_BALANCE.DURACAO_DOT_FRACO, // 2 turnos
    custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_FORTE, // 35
    cooldown: COOLDOWN_BALANCE.COOLDOWN_DANO_MEDIO, // 2 turnos
    nivel_minimo: 1
  }),

  // ==================== 2️⃣ ESCUDO DE CHAMAS ====================
  ESCUDO_DE_CHAMAS: criarHabilidade({
    nome: 'Escudo de Chamas',
    descricao: 'Cria um escudo flamejante que aumenta +50% resistência por 2 turnos e queima atacantes (20% do dano recebido)',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.FOGO,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'resistencia',
    efeitos_status: ['defesa_aumentada_instantanea', 'escudo_flamejante'],
    duracao_efeito: COOLDOWN_BALANCE.DURACAO_BUFF_SELF_MEDIO, // 3 → 2 turnos ativos
    alvo: 'self',
    custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_MEDIA, // 25
    cooldown: COOLDOWN_BALANCE.COOLDOWN_BUFF_MEDIO, // 3 turnos
    nivel_minimo: 1
  })
};

/**
 * ========================================
 * RESUMO DAS 2 HABILIDADES DE FOGO
 * ========================================
 *
 * 1️⃣ EXPLOSÃO DE CHAMAS (Ataque) 🔥💥
 *    Dano: Força × 3.5 (MULTIPLICADOR_HABILIDADE_MEDIA)
 *    Efeitos: 70% chance de QUEIMAR (DoT: 5% HP por turno durante 2 turnos)
 *    Energia: 35 (FORTE) | Cooldown: 2 (MEDIO)
 *    ⚠️ QUEIMADURA = DANO CONTÍNUO (não é reflect!)
 *
 * 2️⃣ ESCUDO DE CHAMAS (Defesa) 🔥🛡️
 *    Dano: 0 (não ataca)
 *    Efeitos: +50% resistência por 2 turnos + REFLECT instantâneo (20% do dano recebido)
 *    Energia: 25 (MEDIA) | Cooldown: 3 (BUFF_MEDIO)
 *    ⚠️ MELHOR QUE DEFENDER: +50% resistência e reflete dano na hora!
 *    ⚠️ REFLECT ≠ DoT (dano é instantâneo, não por turno)
 *
 * ✅ SISTEMA BALANCEADO CENTRALIZADO
 * ✅ Usa valores de combatBalance, cooldownBalance, effectBalance
 * ✅ Efeitos claros e diretos
 * ✅ Fácil de balancear e entender
 */
