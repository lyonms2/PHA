// ==================== HABILIDADES DE SOMBRA - SIMPLIFICADO ====================
// Arquivo: /app/avatares/sistemas/abilities/sombra.js
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

export const HABILIDADES_SOMBRA = {
  // ==================== 1. ATAQUE FRACO ====================
  TOQUE_SOMBRIO: criarHabilidade({
    nome: 'Toque Sombrio',
    descricao: 'Drena vida do inimigo (dano médio + cura 15% do dano causado)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    elemento: ELEMENTOS.SOMBRA,
    dano_base: 45,
    multiplicador_stat: 1.3,
    stat_primario: 'foco',
    efeitos_status: ['roubo_vida'],
    custo_energia: 20,
    cooldown: 0,
    nivel_minimo: 1
  }),

  // ==================== 2. ATAQUE FORTE ====================
  ABRACO_DAS_TREVAS: criarHabilidade({
    nome: 'Abraço das Trevas',
    descricao: 'Drena vida intensamente (dano alto + cura 30% do dano) e 75% de chance de atordoar',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.SOMBRA,
    dano_base: 110,
    multiplicador_stat: 2.0,
    stat_primario: 'foco',
    efeitos_status: ['roubo_vida_intenso', 'atordoado'],
    chance_efeito: 75,
    duracao_efeito: 1,
    custo_energia: 50,
    cooldown: 2,
    nivel_minimo: 5
  }),

  // ==================== 3. SUPORTE ====================
  MANTO_DA_NOITE: criarHabilidade({
    nome: 'Manto da Noite',
    descricao: 'Torna-se invisível (100% evasão neste turno)',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.SOMBRA,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'foco',
    efeitos_status: ['invisivel'],
    alvo: 'self',
    custo_energia: 30,
    cooldown: 4,
    nivel_minimo: 3
  }),

  // ==================== 4. ULTIMATE ====================
  APOCALIPSE_SOMBRIO: criarHabilidade({
    nome: 'Apocalipse Sombrio',
    descricao: 'Trevas consomem vida massivamente (dano massivo + cura 40% do dano) e aterrorizam (-40% stats)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.ULTIMATE,
    elemento: ELEMENTOS.SOMBRA,
    dano_base: 200,
    multiplicador_stat: 2.6,
    stat_primario: 'foco',
    efeitos_status: ['roubo_vida_massivo', 'terror'],
    duracao_efeito: 1,
    custo_energia: 80,
    cooldown: 4,
    nivel_minimo: 1, // TESTE
    vinculo_minimo: 0 // TESTE
  })
};

/**
 * ESTRUTURA FINAL - 4 HABILIDADES:
 *
 * 1️⃣ TOQUE SOMBRIO (Ataque Fraco)
 *    - 45 dano base
 *    - Roubo de vida (15% do dano vira cura)
 *    - 20 energia, sem cooldown
 *
 * 2️⃣ ABRAÇO DAS TREVAS (Ataque Forte)
 *    - 110 dano base
 *    - Roubo de vida intenso (30% do dano vira cura)
 *    - 75% chance de atordoar (pula 1 turno)
 *    - 50 energia, cooldown 2
 *
 * 3️⃣ MANTO DA NOITE (Suporte)
 *    - Invisibilidade (100% evasão neste turno)
 *    - 30 energia, cooldown 4
 *
 * 4️⃣ APOCALIPSE SOMBRIO (Ultimate)
 *    - 200 dano base MASSIVO
 *    - Roubo de vida massivo (40% do dano vira cura)
 *    - Terror (-40% em todos os stats no próximo turno)
 *    - 80 energia, cooldown 4
 *
 * ❌ SEM DoTs/HoTs
 * ❌ SEM efeitos que duram múltiplos turnos
 * ✅ TUDO instantâneo e previsível
 */
