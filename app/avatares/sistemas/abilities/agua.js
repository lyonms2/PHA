// ==================== HABILIDADES DE ÁGUA - SIMPLIFICADO ====================
// Arquivo: /app/avatares/sistemas/abilities/agua.js
//
// NOVA ESTRUTURA: 4 habilidades por elemento
// 1. Ataque Fraco (dano médio, mais forte que ataque básico, SEM efeitos)
// 2. Ataque Forte (dano alto + efeito INSTANTÂNEO)
// 3. Defesa/Suporte (efeito defensivo/suporte INSTANTÂNEO)
// 4. Ultimate (dano massivo + efeito devastador INSTANTÂNEO)
//
// IMPORTANTE: NENHUM efeito dura turnos - tudo é INSTANTÂNEO

import { TIPO_HABILIDADE, RARIDADE_HABILIDADE, criarHabilidade } from '../constants/abilityTypes';
import { ELEMENTOS } from '../elementalSystem';

export const HABILIDADES_AGUA = {
  // ==================== 1. ATAQUE FRACO ====================
  CORRENTE_AQUATICA: criarHabilidade({
    nome: 'Corrente Aquática',
    descricao: 'Dispara um jato de água no inimigo (dano médio)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    elemento: ELEMENTOS.AGUA,
    dano_base: 45,
    multiplicador_stat: 1.3,
    stat_primario: 'foco',
    custo_energia: 20,
    cooldown: 0,
    nivel_minimo: 1
  }),

  // ==================== 2. ATAQUE FORTE ====================
  MAREMOTO: criarHabilidade({
    nome: 'Maremoto',
    descricao: 'Onda gigante com 70% de chance de congelar o inimigo (pula próximo turno)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.AGUA,
    dano_base: 110,
    multiplicador_stat: 2.0,
    stat_primario: 'foco',
    efeitos_status: ['congelado'],
    chance_efeito: 70,
    duracao_efeito: 1,
    custo_energia: 50,
    cooldown: 2,
    nivel_minimo: 5
  }),

  // ==================== 3. SUPORTE ====================
  CURA_AQUATICA: criarHabilidade({
    nome: 'Cura Aquática',
    descricao: 'Água purificadora restaura 30% do HP máximo instantaneamente',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.AGUA,
    dano_base: -30, // Negativo = cura (30% do HP máximo)
    multiplicador_stat: 0,
    stat_primario: 'foco',
    efeitos_status: ['cura_instantanea'],
    alvo: 'self',
    custo_energia: 30,
    cooldown: 3,
    nivel_minimo: 3
  }),

  // ==================== 4. ULTIMATE ====================
  DILUVIO_PRIMORDIAL: criarHabilidade({
    nome: 'Dilúvio Primordial',
    descricao: 'Invoca águas ancestrais causando dano massivo e curando 20% do dano causado',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.ULTIMATE,
    elemento: ELEMENTOS.AGUA,
    dano_base: 190,
    multiplicador_stat: 2.5,
    stat_primario: 'foco',
    efeitos_status: ['auto_cura'], // Cura 20% do dano causado
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
 * 1️⃣ CORRENTE AQUÁTICA (Ataque Fraco)
 *    - 45 dano base
 *    - Sem efeitos, apenas dano puro
 *    - 20 energia, sem cooldown
 *
 * 2️⃣ MAREMOTO (Ataque Forte)
 *    - 110 dano base
 *    - 70% chance de congelar (pula 1 turno)
 *    - 50 energia, cooldown 2
 *
 * 3️⃣ CURA AQUÁTICA (Suporte)
 *    - Restaura 30% HP instantaneamente
 *    - 30 energia, cooldown 3
 *
 * 4️⃣ DILÚVIO PRIMORDIAL (Ultimate)
 *    - 190 dano base MASSIVO
 *    - Cura 20% do dano causado (roubo de vida)
 *    - 75 energia, cooldown 4
 *
 * ❌ SEM DoTs/HoTs
 * ❌ SEM efeitos que duram múltiplos turnos
 * ✅ TUDO instantâneo e previsível
 */
