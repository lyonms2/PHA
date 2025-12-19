// ==================== HABILIDADES DE LUZ - SIMPLIFICADO ====================
// Arquivo: /app/avatares/sistemas/abilities/luz.js
//
// NOVA ESTRUTURA: 4 habilidades por elemento
// 1. Ataque Fraco (dano médio, mais forte que ataque básico, SEM efeitos)
// 2. Ataque Forte (dano alto + efeito INSTANTÂNEO)
// 3. Suporte (buff/cura INSTANTÂNEA)
// 4. Ultimate (dano massivo + efeito devastador INSTANTÂNEO)
//
// IMPORTANTE: NENHUM efeito dura turnos - tudo é INSTANTÂNEO

import { TIPO_HABILIDADE, RARIDADE_HABILIDADE, criarHabilidade } from '../constants/abilityTypes';
import { ELEMENTOS } from '../elementalSystem';

export const HABILIDADES_LUZ = {
  // ==================== 1. ATAQUE FRACO ====================
  RAIO_DE_LUZ: criarHabilidade({
    nome: 'Raio de Luz',
    descricao: 'Projétil de luz pura no inimigo (dano médio)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    elemento: ELEMENTOS.LUZ,
    dano_base: 45,
    multiplicador_stat: 1.3,
    stat_primario: 'foco',
    custo_energia: 20,
    cooldown: 0,
    nivel_minimo: 1
  }),

  // ==================== 2. ATAQUE FORTE ====================
  JULGAMENTO_DIVINO: criarHabilidade({
    nome: 'Julgamento Divino',
    descricao: 'Dano massivo com +50% de dano em inimigos com <30% HP',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.LUZ,
    dano_base: 110,
    multiplicador_stat: 2.0,
    stat_primario: 'foco',
    efeitos_status: ['execucao'], // +50% dano em alvos com baixo HP
    custo_energia: 50,
    cooldown: 2,
    nivel_minimo: 5
  }),

  // ==================== 3. SUPORTE ====================
  BENCAO: criarHabilidade({
    nome: 'Benção',
    descricao: 'Aumenta todos os stats em +20% neste turno',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.LUZ,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'foco',
    efeitos_status: ['bencao'],
    alvo: 'self',
    custo_energia: 30,
    cooldown: 3,
    nivel_minimo: 3
  }),

  // ==================== 4. ULTIMATE ====================
  ASCENSAO_CELESTIAL: criarHabilidade({
    nome: 'Ascensão Celestial',
    descricao: 'Invoca poder divino causando dano massivo e purificando debuffs',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.ULTIMATE,
    elemento: ELEMENTOS.LUZ,
    dano_base: 190,
    multiplicador_stat: 2.5,
    stat_primario: 'foco',
    efeitos_status: ['limpar_debuffs'], // Remove todos os debuffs
    custo_energia: 75,
    cooldown: 4,
    nivel_minimo: 1, // TESTE
    vinculo_minimo: 0 // TESTE
  })
};

/**
 * ESTRUTURA FINAL - 4 HABILIDADES:
 *
 * 1️⃣ RAIO DE LUZ (Ataque Fraco)
 *    - 45 dano base
 *    - Sem efeitos, apenas dano puro
 *    - 20 energia, sem cooldown
 *
 * 2️⃣ JULGAMENTO DIVINO (Ataque Forte)
 *    - 110 dano base
 *    - Execução: +50% dano em inimigos com <30% HP
 *    - 50 energia, cooldown 2
 *
 * 3️⃣ BENÇÃO (Suporte)
 *    - +20% em TODOS os stats (neste turno)
 *    - 30 energia, cooldown 3
 *
 * 4️⃣ ASCENSÃO CELESTIAL (Ultimate)
 *    - 190 dano base MASSIVO
 *    - Remove todos os debuffs
 *    - 75 energia, cooldown 4
 *
 * ❌ SEM DoTs/HoTs
 * ❌ SEM efeitos que duram múltiplos turnos
 * ✅ TUDO instantâneo e previsível
 */
