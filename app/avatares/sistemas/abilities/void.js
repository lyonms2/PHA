// ==================== HABILIDADES DE VOID - SIMPLIFICADO ====================
// Arquivo: /app/avatares/sistemas/abilities/void.js
//
// NOVA ESTRUTURA: 4 habilidades por elemento
// 1. Ataque Fraco (dano médio, mais forte que ataque básico, SEM efeitos)
// 2. Ataque Forte (dano alto + efeito INSTANTÂNEO)
// 3. Defesa/Suporte (efeito defensivo INSTANTÂNEO)
// 4. Ultimate (dano massivo + efeito devastador INSTANTÂNEO)
//
// IMPORTANTE: NENHUM efeito dura turnos - tudo é INSTANTÂNEO
// ESPECIALIDADE: Ignora defesa, remove buffs, drena energia

import { TIPO_HABILIDADE, RARIDADE_HABILIDADE, criarHabilidade } from '../constants/abilityTypes';
import { ELEMENTOS } from '../elementalSystem';

export const HABILIDADES_VOID = {
  // ==================== 1. ATAQUE FRACO ====================
  TOQUE_DO_VAZIO: criarHabilidade({
    nome: 'Toque do Vazio',
    descricao: 'Drena essência vital ignorando 25% da defesa (dano médio)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    elemento: ELEMENTOS.VOID,
    dano_base: 45,
    multiplicador_stat: 1.3,
    stat_primario: 'foco',
    ignora_defesa: 0.25, // Ignora 25% da defesa
    custo_energia: 20,
    cooldown: 0,
    nivel_minimo: 1
  }),

  // ==================== 2. ATAQUE FORTE ====================
  RUPTURA_DIMENSIONAL: criarHabilidade({
    nome: 'Ruptura Dimensional',
    descricao: 'Rasga a realidade causando dano alto e ignorando 50% da defesa',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.VOID,
    dano_base: 115,
    multiplicador_stat: 2.1,
    stat_primario: 'foco',
    ignora_defesa: 0.50, // Ignora 50% da defesa
    efeitos_status: ['anula_buffs'], // Remove buffs do inimigo
    custo_energia: 50,
    cooldown: 2,
    nivel_minimo: 5
  }),

  // ==================== 3. SUPORTE ====================
  CAMPO_DE_ANULACAO: criarHabilidade({
    nome: 'Campo de Anulação',
    descricao: 'Reduz dano recebido em 40% neste turno e remove buffs do inimigo',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.VOID,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'foco',
    efeitos_status: ['reducao_dano', 'anula_buffs'],
    alvo: 'self',
    custo_energia: 30,
    cooldown: 3,
    nivel_minimo: 3
  }),

  // ==================== 4. ULTIMATE ====================
  COLAPSO_DO_VAZIO: criarHabilidade({
    nome: 'Colapso do Vazio',
    descricao: 'Invoca colapso dimensional devastador ignorando 70% da defesa e drenando energia',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.ULTIMATE,
    elemento: ELEMENTOS.VOID,
    dano_base: 195,
    multiplicador_stat: 2.5,
    stat_primario: 'foco',
    ignora_defesa: 0.70, // Ignora 70% da defesa
    efeitos_status: ['anula_buffs', 'dreno_energia'], // Remove buffs e drena 30 energia
    custo_energia: 75,
    cooldown: 4,
    nivel_minimo: 1, // TESTE
    vinculo_minimo: 0 // TESTE
  })
};

/**
 * ESTRUTURA FINAL - 4 HABILIDADES:
 *
 * 1️⃣ TOQUE DO VAZIO (Ataque Fraco)
 *    - 45 dano base
 *    - Ignora 25% da defesa
 *    - 20 energia, sem cooldown
 *
 * 2️⃣ RUPTURA DIMENSIONAL (Ataque Forte)
 *    - 115 dano base
 *    - Ignora 50% da defesa
 *    - Remove buffs do inimigo
 *    - 50 energia, cooldown 2
 *
 * 3️⃣ CAMPO DE ANULAÇÃO (Suporte)
 *    - Reduz dano recebido em 40% (neste turno)
 *    - Remove buffs do inimigo
 *    - 30 energia, cooldown 3
 *
 * 4️⃣ COLAPSO DO VAZIO (Ultimate)
 *    - 195 dano base MASSIVO
 *    - Ignora 70% da defesa
 *    - Remove buffs + drena 30 energia
 *    - 75 energia, cooldown 4
 *
 * ❌ SEM DoTs/HoTs
 * ❌ SEM efeitos que duram múltiplos turnos
 * ✅ TUDO instantâneo e previsível
 * ✅ ESPECIALIDADE: Penetração de defesa e remoção de buffs
 */
