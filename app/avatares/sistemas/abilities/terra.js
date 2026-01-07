// ==================== HABILIDADES DE TERRA - SIMPLIFICADO ====================
// Arquivo: /app/avatares/sistemas/abilities/terra.js
//
// ESTRUTURA SIMPLIFICADA: 2 habilidades por elemento
// 1. Ataque Forte - Dano + efeito temático do elemento
// 2. Defesa/Suporte - Proteção/buff temático
//
// Sistema de combate: Ataque Básico + Defender + 2 Habilidades

import { TIPO_HABILIDADE, RARIDADE_HABILIDADE, criarHabilidade } from '../constants/abilityTypes';
import { ELEMENTOS } from '../elementalSystem';

export const HABILIDADES_TERRA = {
  // ==================== 1️⃣ TERREMOTO ====================
  TERREMOTO: criarHabilidade({
    nome: 'Terremoto',
    descricao: 'Fissura devastadora com 75% chance de atordoar o inimigo (pula próximo turno)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.TERRA,
    dano_base: 100,
    multiplicador_stat: 2.0,
    stat_primario: 'forca',
    efeitos_status: ['atordoado'],
    chance_efeito: 75,
    duracao_efeito: 1,
    custo_energia: 40,
    cooldown: 2,
    nivel_minimo: 1
  }),

  // ==================== 2️⃣ MURALHA DE PEDRA ====================
  MURALHA_DE_PEDRA: criarHabilidade({
    nome: 'Muralha de Pedra',
    descricao: 'Ergue uma barreira rochosa que aumenta +70% resistência por 1 turno',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.TERRA,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'resistencia',
    efeitos_status: ['defesa_aumentada'],
    alvo: 'self',
    custo_energia: 30,
    cooldown: 3,
    nivel_minimo: 1
  })
};

/**
 * ========================================
 * RESUMO DAS 2 HABILIDADES DE TERRA
 * ========================================
 *
 * 1️⃣ TERREMOTO (Ataque)
 *    Dano: 100 base + Força×2.0
 *    Efeitos: 75% chance de atordoar (pula 1 turno)
 *    Energia: 40 | Cooldown: 2
 *
 * 2️⃣ MURALHA DE PEDRA (Defesa)
 *    Dano: 0 (não ataca)
 *    Efeitos: +70% resistência por 1 turno
 *    Energia: 30 | Cooldown: 3
 *
 * ✅ SISTEMA SIMPLIFICADO
 * ✅ Efeitos claros e diretos
 * ✅ Fácil de balancear e entender
 */
