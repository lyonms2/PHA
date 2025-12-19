// ==================== HABILIDADES DE FOGO - REVISADO ====================
// Arquivo: /app/avatares/sistemas/abilities/fogo.js
//
// ESTRUTURA: 4 habilidades por elemento
// 1. Ataque Fraco - Dano médio, SEM efeitos
// 2. Ataque Forte - Dano alto + controle instantâneo
// 3. Defesa/Suporte - Buff/Defesa instantânea
// 4. Ultimate - Dano massivo + efeito devastador
//
// ✅ TODOS os efeitos são instantâneos (máximo 1 turno)

import { TIPO_HABILIDADE, RARIDADE_HABILIDADE, criarHabilidade } from '../constants/abilityTypes';
import { ELEMENTOS } from '../elementalSystem';

export const HABILIDADES_FOGO = {
  // ==================== 1️⃣ LABAREDA (Ataque Fraco) ====================
  LABAREDA: criarHabilidade({
    nome: 'Labareda',
    descricao: 'Lança uma rajada de fogo no inimigo causando dano médio',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    elemento: ELEMENTOS.FOGO,
    dano_base: 45,
    multiplicador_stat: 1.3,
    stat_primario: 'forca',
    custo_energia: 20,
    cooldown: 0,
    nivel_minimo: 1
  }),

  // ==================== 2️⃣ EXPLOSÃO ÍGNEA (Ataque Forte) ====================
  EXPLOSAO_IGNEA: criarHabilidade({
    nome: 'Explosão Ígnea',
    descricao: 'Explosão massiva de chamas com 70% chance de atordoar (pula próximo turno)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.FOGO,
    dano_base: 110,
    multiplicador_stat: 2.0,
    stat_primario: 'forca',
    efeitos_status: ['atordoado'],
    chance_efeito: 70,
    duracao_efeito: 1,
    custo_energia: 50,
    cooldown: 2,
    nivel_minimo: 5
  }),

  // ==================== 3️⃣ ESCUDO DE CHAMAS (Defesa) ====================
  ESCUDO_DE_CHAMAS: criarHabilidade({
    nome: 'Escudo de Chamas',
    descricao: 'Postura defensiva flamejante: +60% resistência neste turno. Quando atacado, queima o inimigo com 20% do dano recebido',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.FOGO,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'resistencia',
    efeitos_status: ['defesa_aumentada_instantanea', 'escudo_flamejante'],
    alvo: 'self',
    custo_energia: 30,
    cooldown: 3,
    nivel_minimo: 3
  }),

  // ==================== 4️⃣ INFERNO DEVASTADOR (Ultimate) ====================
  INFERNO_DEVASTADOR: criarHabilidade({
    nome: 'Inferno Devastador',
    descricao: 'Invoca chamas apocalípticas causando dano massivo e enfraquecendo o inimigo (-40% resistência no próximo turno)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.ULTIMATE,
    elemento: ELEMENTOS.FOGO,
    dano_base: 190,
    multiplicador_stat: 2.5,
    stat_primario: 'forca',
    efeitos_status: ['enfraquecido'],
    duracao_efeito: 1,
    custo_energia: 75,
    cooldown: 4,
    nivel_minimo: 1, // TESTE
    vinculo_minimo: 0 // TESTE
  })
};

/**
 * ========================================
 * RESUMO DAS 4 HABILIDADES DE FOGO
 * ========================================
 *
 * 1️⃣ LABAREDA (Ataque Fraco)
 *    Dano: 45 base + Força×1.3
 *    Efeitos: Nenhum (dano puro)
 *    Energia: 20 | Cooldown: 0
 *
 * 2️⃣ EXPLOSÃO ÍGNEA (Ataque Forte)
 *    Dano: 110 base + Força×2.0
 *    Efeitos: 70% atordoar (pula 1 turno)
 *    Energia: 50 | Cooldown: 2
 *
 * 3️⃣ ESCUDO DE CHAMAS (Defesa)
 *    Dano: 0 (não ataca)
 *    Efeitos:
 *      • +60% resistência (dobra redução de dano)
 *      • Escudo Flamejante (contra-ataque: 20% do dano recebido volta como queimadura)
 *    Energia: 30 | Cooldown: 3
 *    Duração: Apenas este turno
 *
 * 4️⃣ INFERNO DEVASTADOR (Ultimate)
 *    Dano: 190 base + Força×2.5
 *    Efeitos: Enfraquece (-40% resistência do inimigo por 1 turno)
 *    Energia: 75 | Cooldown: 4
 *
 * ✅ TESTADO: Todas as 4 habilidades funcionais
 * ✅ SEM DoTs/HoTs persistentes
 * ✅ Efeitos instantâneos (máx 1 turno)
 */
