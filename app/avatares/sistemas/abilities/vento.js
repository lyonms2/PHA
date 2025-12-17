// ==================== HABILIDADES DE VENTO - SIMPLIFICADO ====================
// Arquivo: /app/avatares/sistemas/abilities/vento.js
//
// NOVA ESTRUTURA: 4 habilidades por elemento
// 1. Ataque Fraco (dano médio, mais forte que ataque básico, SEM efeitos)
// 2. Ataque Forte (dano alto + efeito INSTANTÂNEO)
// 3. Defesa/Suporte (efeito defensivo INSTANTÂNEO)
// 4. Ultimate (dano massivo + efeito devastador INSTANTÂNEO)
//
// IMPORTANTE: NENHUM efeito dura turnos - tudo é INSTANTÂNEO

import { TIPO_HABILIDADE, RARIDADE_HABILIDADE, criarHabilidade } from '../constants/abilityTypes';
import { ELEMENTOS } from '../elementalSystem';

export const HABILIDADES_VENTO = {
  // ==================== 1. ATAQUE FRACO ====================
  RAJADA: criarHabilidade({
    nome: 'Rajada',
    descricao: 'Lança uma rajada de vento cortante no inimigo (dano médio)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    elemento: ELEMENTOS.VENTO,
    dano_base: 45,
    multiplicador_stat: 1.3,
    stat_primario: 'agilidade',
    custo_energia: 20,
    cooldown: 0,
    nivel_minimo: 1
  }),

  // ==================== 2. ATAQUE FORTE ====================
  TORNADO: criarHabilidade({
    nome: 'Tornado',
    descricao: 'Ciclone devastador com 65% de chance de desorientar o inimigo (-30% acerto)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.VENTO,
    dano_base: 110,
    multiplicador_stat: 2.0,
    stat_primario: 'agilidade',
    efeitos_status: ['desorientado'],
    chance_efeito: 65,
    duracao_efeito: 1,
    custo_energia: 50,
    cooldown: 2,
    nivel_minimo: 5
  }),

  // ==================== 3. SUPORTE ====================
  VELOCIDADE_DO_VENTO: criarHabilidade({
    nome: 'Velocidade do Vento',
    descricao: 'Aumenta drasticamente a evasão (+50% evasão neste turno)',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.VENTO,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'agilidade',
    efeitos_status: ['evasao_aumentada'],
    alvo: 'self',
    custo_energia: 30,
    cooldown: 3,
    nivel_minimo: 3
  }),

  // ==================== 4. ULTIMATE ====================
  TEMPESTADE_DEVASTADORA: criarHabilidade({
    nome: 'Tempestade Devastadora',
    descricao: 'Invoca uma tempestade apocalíptica causando dano massivo e aumentando velocidade (+40% agilidade)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.ULTIMATE,
    elemento: ELEMENTOS.VENTO,
    dano_base: 185,
    multiplicador_stat: 2.4,
    stat_primario: 'agilidade',
    efeitos_status: ['velocidade_aumentada'],
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
 * 1️⃣ RAJADA (Ataque Fraco)
 *    - 45 dano base
 *    - Sem efeitos, apenas dano puro
 *    - 20 energia, sem cooldown
 *
 * 2️⃣ TORNADO (Ataque Forte)
 *    - 110 dano base
 *    - 65% chance de desorientar (-30% acerto no próximo turno)
 *    - 50 energia, cooldown 2
 *
 * 3️⃣ VELOCIDADE DO VENTO (Suporte)
 *    - +50% evasão INSTANTÂNEA (só neste turno)
 *    - 30 energia, cooldown 3
 *
 * 4️⃣ TEMPESTADE DEVASTADORA (Ultimate)
 *    - 185 dano base MASSIVO
 *    - +40% agilidade no próximo turno
 *    - 75 energia, cooldown 4
 *
 * ❌ SEM DoTs/HoTs
 * ❌ SEM efeitos que duram múltiplos turnos
 * ✅ TUDO instantâneo e previsível
 */
