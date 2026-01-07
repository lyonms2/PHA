// ==================== HABILIDADES DE VENTO - SIMPLIFICADO ====================
// Arquivo: /app/avatares/sistemas/abilities/vento.js
//
// ESTRUTURA SIMPLIFICADA: 2 habilidades por elemento
// 1. Ataque Forte - Dano + efeito temático do elemento
// 2. Defesa/Suporte - Proteção/buff temático
//
// Sistema de combate: Ataque Básico + Defender + 2 Habilidades

import { TIPO_HABILIDADE, RARIDADE_HABILIDADE, criarHabilidade } from '../constants/abilityTypes';
import { ELEMENTOS } from '../elementalSystem';

export const HABILIDADES_VENTO = {
  // ==================== 1️⃣ TORNADO ====================
  TORNADO: criarHabilidade({
    nome: 'Tornado',
    descricao: 'Ciclone devastador com 65% chance de desorientar o inimigo (-30% acerto por 1 turno)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.VENTO,
    dano_base: 100,
    multiplicador_stat: 2.0,
    stat_primario: 'agilidade',
    efeitos_status: ['desorientado'],
    chance_efeito: 65,
    duracao_efeito: 1,
    custo_energia: 40,
    cooldown: 2,
    nivel_minimo: 1
  }),

  // ==================== 2️⃣ VELOCIDADE DO VENTO ====================
  VELOCIDADE_DO_VENTO: criarHabilidade({
    nome: 'Velocidade do Vento',
    descricao: 'Aumenta drasticamente a evasão (+50% evasão por 1 turno)',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.VENTO,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'agilidade',
    efeitos_status: ['evasao_aumentada'],
    alvo: 'self',
    custo_energia: 30,
    cooldown: 3,
    nivel_minimo: 1
  })
};

/**
 * ========================================
 * RESUMO DAS 2 HABILIDADES DE VENTO
 * ========================================
 *
 * 1️⃣ TORNADO (Ataque)
 *    Dano: 100 base + Agilidade×2.0
 *    Efeitos: 65% chance de desorientar (-30% acerto por 1 turno)
 *    Energia: 40 | Cooldown: 2
 *
 * 2️⃣ VELOCIDADE DO VENTO (Suporte)
 *    Dano: 0 (não ataca)
 *    Efeitos: +50% evasão por 1 turno
 *    Energia: 30 | Cooldown: 3
 *
 * ✅ SISTEMA SIMPLIFICADO
 * ✅ Efeitos claros e diretos
 * ✅ Fácil de balancear e entender
 */
