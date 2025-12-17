// ==================== HABILIDADES DE TERRA - SIMPLIFICADO ====================
// Arquivo: /app/avatares/sistemas/abilities/terra.js
//
// NOVA ESTRUTURA: 4 habilidades por elemento
// 1. Ataque Fraco (dano médio, mais forte que ataque básico, SEM efeitos)
// 2. Ataque Forte (dano alto + efeito INSTANTÂNEO)
// 3. Defesa (efeito defensivo INSTANTÂNEO)
// 4. Ultimate (dano massivo + efeito devastador INSTANTÂNEO)
//
// IMPORTANTE: NENHUM efeito dura turnos - tudo é INSTANTÂNEO

import { TIPO_HABILIDADE, RARIDADE_HABILIDADE, criarHabilidade } from '../constants/abilityTypes';
import { ELEMENTOS } from '../elementalSystem';

export const HABILIDADES_TERRA = {
  // ==================== 1. ATAQUE FRACO ====================
  PEDRADA: criarHabilidade({
    nome: 'Pedrada',
    descricao: 'Lança uma rocha sólida no inimigo (dano médio)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    elemento: ELEMENTOS.TERRA,
    dano_base: 45,
    multiplicador_stat: 1.3,
    stat_primario: 'forca',
    custo_energia: 20,
    cooldown: 0,
    nivel_minimo: 1
  }),

  // ==================== 2. ATAQUE FORTE ====================
  TERREMOTO: criarHabilidade({
    nome: 'Terremoto',
    descricao: 'Fissura devastadora com 75% de chance de atordoar o inimigo (pula próximo turno)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.TERRA,
    dano_base: 110,
    multiplicador_stat: 2.0,
    stat_primario: 'forca',
    efeitos_status: ['atordoado'],
    chance_efeito: 75,
    duracao_efeito: 1,
    custo_energia: 50,
    cooldown: 2,
    nivel_minimo: 5
  }),

  // ==================== 3. DEFESA ====================
  MURALHA_DE_PEDRA: criarHabilidade({
    nome: 'Muralha de Pedra',
    descricao: 'Ergue uma barreira rochosa (+70% resistência neste turno)',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.TERRA,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'resistencia',
    efeitos_status: ['defesa_aumentada_instantanea'],
    alvo: 'self',
    custo_energia: 30,
    cooldown: 3,
    nivel_minimo: 3
  }),

  // ==================== 4. ULTIMATE ====================
  FURIA_TECTONICA: criarHabilidade({
    nome: 'Fúria Tectônica',
    descricao: 'Libera o poder das placas terrestres causando dano massivo e reduzindo defesa do inimigo (-40% resistência)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.ULTIMATE,
    elemento: ELEMENTOS.TERRA,
    dano_base: 200,
    multiplicador_stat: 2.6,
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
 * ESTRUTURA FINAL - 4 HABILIDADES:
 *
 * 1️⃣ PEDRADA (Ataque Fraco)
 *    - 45 dano base
 *    - Sem efeitos, apenas dano puro
 *    - 20 energia, sem cooldown
 *
 * 2️⃣ TERREMOTO (Ataque Forte)
 *    - 110 dano base
 *    - 75% chance de atordoar (pula 1 turno)
 *    - 50 energia, cooldown 2
 *
 * 3️⃣ MURALHA DE PEDRA (Defesa)
 *    - +70% resistência INSTANTÂNEA (só neste turno)
 *    - 30 energia, cooldown 3
 *
 * 4️⃣ FÚRIA TECTÔNICA (Ultimate)
 *    - 200 dano base MASSIVO
 *    - Enfraquece inimigo (-40% resistência no próximo turno)
 *    - 75 energia, cooldown 4
 *
 * ❌ SEM DoTs/HoTs
 * ❌ SEM efeitos que duram múltiplos turnos
 * ✅ TUDO instantâneo e previsível
 */
