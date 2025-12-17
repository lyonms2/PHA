// ==================== HABILIDADES DE FOGO - SIMPLIFICADO ====================
// Arquivo: /app/avatares/sistemas/abilities/fogo.js
//
// NOVA ESTRUTURA: 3 habilidades por elemento
// 1. Ataque Fraco (dano médio, mais forte que ataque básico, SEM efeitos)
// 2. Ataque Forte (dano alto + efeito INSTANTÂNEO)
// 3. Defesa (efeito defensivo INSTANTÂNEO, tipo "Defender" + contra-ataque)
//
// IMPORTANTE: NENHUM efeito dura turnos - tudo é INSTANTÂNEO

import { TIPO_HABILIDADE, RARIDADE_HABILIDADE, criarHabilidade } from '../constants/abilityTypes';
import { ELEMENTOS } from '../elementalSystem';

export const HABILIDADES_FOGO = {
  // ==================== 1. ATAQUE FRACO ====================
  // Mais forte que ataque básico, sem efeitos, apenas dano puro
  LABAREDA: criarHabilidade({
    nome: 'Labareda',
    descricao: 'Lança uma rajada de fogo no inimigo (dano médio)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    elemento: ELEMENTOS.FOGO,
    dano_base: 45, // Mais forte que ataque básico (~25-30)
    multiplicador_stat: 1.3,
    stat_primario: 'forca',
    custo_energia: 20,
    cooldown: 0,
    nivel_minimo: 1
  }),

  // ==================== 2. ATAQUE FORTE ====================
  // Dano alto + efeito instantâneo (ex: atordoa por 1 turno)
  EXPLOSAO_IGNEA: criarHabilidade({
    nome: 'Explosão Ígnea',
    descricao: 'Explosão massiva de chamas com 70% de chance de atordoar o inimigo (pula próximo turno)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.FOGO,
    dano_base: 110,
    multiplicador_stat: 2.0,
    stat_primario: 'forca',
    efeitos_status: ['atordoado'], // Atordoa = pula 1 turno (efeito instantâneo)
    chance_efeito: 70,
    duracao_efeito: 1, // Pula apenas o próximo turno
    custo_energia: 50,
    cooldown: 2,
    nivel_minimo: 5
  }),

  // ==================== 3. DEFESA/CONTRA-ATAQUE ====================
  // Efeito defensivo instantâneo (tipo "Defender") + dano de contra-ataque
  ESCUDO_DE_CHAMAS: criarHabilidade({
    nome: 'Escudo de Chamas',
    descricao: 'Assume postura defensiva (+60% resistência neste turno) e queima o atacante',
    tipo: TIPO_HABILIDADE.DEFENSIVA,
    elemento: ELEMENTOS.FOGO,
    dano_base: 25, // Dano de queimadura contra-ataque
    multiplicador_stat: 0.8,
    stat_primario: 'resistencia',
    efeitos_status: ['defesa_aumentada_instantanea'], // +60% resist APENAS neste turno (como Defender)
    bonus_resistencia_turno: 0.60, // +60% resistência instantânea
    contra_ataque: true, // Causa dano quando é atacado
    alvo: 'self',
    custo_energia: 30,
    cooldown: 3,
    nivel_minimo: 3
  })
};

/**
 * ESTRUTURA FINAL:
 *
 * 1️⃣ LABAREDA (Ataque Fraco)
 *    - 45 dano base (maior que ataque normal ~25-30)
 *    - Sem efeitos, apenas dano puro
 *    - 20 energia, sem cooldown
 *
 * 2️⃣ EXPLOSÃO ÍGNEA (Ataque Forte)
 *    - 110 dano base
 *    - 70% chance de atordoar (pula 1 turno)
 *    - 50 energia, cooldown 2
 *
 * 3️⃣ ESCUDO DE CHAMAS (Defesa)
 *    - +60% resistência INSTANTÂNEA (só neste turno, como Defender)
 *    - 25 dano de contra-ataque (queima quem ataca)
 *    - 30 energia, cooldown 3
 *
 * ❌ SEM DoTs/HoTs
 * ❌ SEM efeitos que duram múltiplos turnos
 * ✅ TUDO instantâneo e previsível
 */
