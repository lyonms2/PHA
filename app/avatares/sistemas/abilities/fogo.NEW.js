// ==================== HABILIDADES DE FOGO - SIMPLIFICADO ====================
// Arquivo: /app/avatares/sistemas/abilities/fogo.js
//
// NOVA ESTRUTURA: 3 habilidades por elemento
// 1. Ataque Fraco (baixo custo, sem cooldown)
// 2. Ataque Forte (custo médio/alto, cooldown, alto dano)
// 3. Defesa/Suporte (custo médio, cooldown, efeito defensivo)
//
// REMOVIDO: DoTs, HoTs, evoluções, ultimates, habilidades lendárias

import { TIPO_HABILIDADE, RARIDADE_HABILIDADE, criarHabilidade } from '../constants/abilityTypes';
import { ELEMENTOS } from '../elementalSystem';

export const HABILIDADES_FOGO = {
  // ==================== 1. ATAQUE FRACO ====================
  LABAREDA: criarHabilidade({
    nome: 'Labareda',
    descricao: 'Lança uma rajada de fogo no inimigo',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    elemento: ELEMENTOS.FOGO,
    dano_base: 30,
    multiplicador_stat: 1.2,
    stat_primario: 'forca',
    custo_energia: 15,
    cooldown: 0,
    nivel_minimo: 1
  }),

  // ==================== 2. ATAQUE FORTE ====================
  EXPLOSAO_IGNEA: criarHabilidade({
    nome: 'Explosão Ígnea',
    descricao: 'Explosão massiva de chamas com 60% de chance de atordoar por 1 turno',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.FOGO,
    dano_base: 100,
    multiplicador_stat: 1.8,
    stat_primario: 'forca',
    efeitos_status: ['atordoado'], // Efeito de controle instantâneo (pula 1 turno)
    chance_efeito: 60,
    duracao_efeito: 1,
    custo_energia: 45,
    cooldown: 2,
    nivel_minimo: 5
  }),

  // ==================== 3. DEFESA/SUPORTE ====================
  ESCUDO_DE_CHAMAS: criarHabilidade({
    nome: 'Escudo de Chamas',
    descricao: 'Cria uma barreira de fogo que aumenta defesa em 50% por 3 turnos',
    tipo: TIPO_HABILIDADE.DEFENSIVA,
    elemento: ELEMENTOS.FOGO,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'resistencia',
    efeitos_status: ['defesa_aumentada'], // +50% resistência por 3 turnos
    alvo: 'self',
    duracao_efeito: 3,
    custo_energia: 30,
    cooldown: 3,
    nivel_minimo: 3
  })
};

/**
 * MUDANÇAS PRINCIPAIS:
 *
 * ❌ REMOVIDO:
 * - CHAMAS_BASICAS (duplicada com Labareda)
 * - ONDA_DE_CALOR (controle extra desnecessário)
 * - INFERNO_ETERNO (ultimate removido)
 * - Todos os efeitos de queimadura (DoT)
 * - Sistema de evolução de habilidades
 *
 * ✅ MANTIDO:
 * - 1 ataque básico sem cooldown (Labareda)
 * - 1 ataque forte com cooldown (Explosão Ígnea)
 * - 1 habilidade defensiva (Escudo de Chamas)
 * - Efeito de controle instantâneo (atordoado - pula turno)
 * - Efeito de buff (defesa aumentada)
 *
 * 💡 BENEFÍCIOS:
 * - Mais simples de balancear
 * - Sem bugs de DoT
 * - Mais fácil de entender para jogadores
 * - Combate mais previsível e estratégico
 * - Menos código para manter
 */
