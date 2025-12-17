// ==================== HABILIDADES DE ELETRICIDADE - SIMPLIFICADO ====================
// Arquivo: /app/avatares/sistemas/abilities/eletricidade.js
//
// NOVA ESTRUTURA: 4 habilidades por elemento
// 1. Ataque Fraco (dano médio, mais forte que ataque básico, SEM efeitos)
// 2. Ataque Forte (dano alto + efeito INSTANTÂNEO)
// 3. Suporte (efeito de buff INSTANTÂNEO)
// 4. Ultimate (dano massivo + efeito devastador INSTANTÂNEO)
//
// IMPORTANTE: NENHUM efeito dura turnos - tudo é INSTANTÂNEO

import { TIPO_HABILIDADE, RARIDADE_HABILIDADE, criarHabilidade } from '../constants/abilityTypes';
import { ELEMENTOS } from '../elementalSystem';

export const HABILIDADES_ELETRICIDADE = {
  // ==================== 1. ATAQUE FRACO ====================
  CHOQUE: criarHabilidade({
    nome: 'Choque',
    descricao: 'Descarga elétrica rápida no inimigo (dano médio)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    elemento: ELEMENTOS.ELETRICIDADE,
    dano_base: 45,
    multiplicador_stat: 1.3,
    stat_primario: 'foco',
    custo_energia: 20,
    cooldown: 0,
    nivel_minimo: 1
  }),

  // ==================== 2. ATAQUE FORTE ====================
  RELAMPAGO: criarHabilidade({
    nome: 'Relâmpago',
    descricao: 'Raio devastador com 70% de chance de paralisar o inimigo (30% chance de falhar ações)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.ELETRICIDADE,
    dano_base: 115,
    multiplicador_stat: 2.1,
    stat_primario: 'foco',
    efeitos_status: ['paralisia'],
    chance_efeito: 70,
    duracao_efeito: 1,
    custo_energia: 50,
    cooldown: 2,
    nivel_minimo: 5
  }),

  // ==================== 3. SUPORTE ====================
  SOBRECARGA: criarHabilidade({
    nome: 'Sobrecarga',
    descricao: 'Aumenta drasticamente o foco (+60% foco neste turno, mas -20% resistência)',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.ELETRICIDADE,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'foco',
    efeitos_status: ['sobrecarga'],
    alvo: 'self',
    custo_energia: 30,
    cooldown: 3,
    nivel_minimo: 3
  }),

  // ==================== 4. ULTIMATE ====================
  TEMPESTADE_ELETRICA: criarHabilidade({
    nome: 'Tempestade Elétrica',
    descricao: 'Invoca raios apocalípticos causando dano massivo e paralisando intensamente (60% chance de falhar ações)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.ULTIMATE,
    elemento: ELEMENTOS.ELETRICIDADE,
    dano_base: 195,
    multiplicador_stat: 2.5,
    stat_primario: 'foco',
    efeitos_status: ['paralisia_intensa'],
    chance_efeito: 80,
    duracao_efeito: 1,
    custo_energia: 75,
    cooldown: 4,
    nivel_minimo: 1, // TESTE
    vinculo_minimo: 0 // TESTE
  })
};

/**
 * ESTRUTURA FINAL - 4 HABILIDADES:
 *
 * 1️⃣ CHOQUE (Ataque Fraco)
 *    - 45 dano base
 *    - Sem efeitos, apenas dano puro
 *    - 20 energia, sem cooldown
 *
 * 2️⃣ RELÂMPAGO (Ataque Forte)
 *    - 115 dano base
 *    - 70% chance de paralisar (30% chance de falhar ações)
 *    - 50 energia, cooldown 2
 *
 * 3️⃣ SOBRECARGA (Suporte)
 *    - +60% foco, -20% resistência (trade-off)
 *    - 30 energia, cooldown 3
 *
 * 4️⃣ TEMPESTADE ELÉTRICA (Ultimate)
 *    - 195 dano base MASSIVO
 *    - 80% chance de paralisia intensa (60% chance de falhar ações)
 *    - 75 energia, cooldown 4
 *
 * ❌ SEM DoTs/HoTs
 * ❌ SEM efeitos que duram múltiplos turnos
 * ✅ TUDO instantâneo e previsível
 */
