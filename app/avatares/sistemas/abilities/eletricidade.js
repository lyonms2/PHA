// ==================== HABILIDADES DE ELETRICIDADE - SIMPLIFICADO ====================
// Arquivo: /app/avatares/sistemas/abilities/eletricidade.js
//
// ESTRUTURA SIMPLIFICADA: 2 habilidades por elemento
// 1. Ataque Forte - Dano + efeito temático do elemento
// 2. Defesa/Suporte - Proteção/buff temático
//
// Sistema de combate: Ataque Básico + Defender + 2 Habilidades

import { TIPO_HABILIDADE, RARIDADE_HABILIDADE, criarHabilidade } from '../constants/abilityTypes';
import { ELEMENTOS } from '../elementalSystem';

export const HABILIDADES_ELETRICIDADE = {
  // ==================== 1️⃣ RELÂMPAGO ====================
  RELAMPAGO: criarHabilidade({
    nome: 'Relâmpago',
    descricao: 'Raio devastador com 70% chance de paralisar o inimigo (30% chance de falhar ações por 1 turno)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.ELETRICIDADE,
    dano_base: 0, // Sem dano base fixo - 100% baseado em stats
    multiplicador_stat: 3.5, // Foco × 3.5
    stat_primario: 'foco',
    efeitos_status: ['paralisia'],
    chance_efeito: 70,
    duracao_efeito: 1,
    custo_energia: 40,
    cooldown: 2,
    nivel_minimo: 1
  }),

  // ==================== 2️⃣ SOBRECARGA ====================
  SOBRECARGA: criarHabilidade({
    nome: 'Sobrecarga',
    descricao: 'Aumenta drasticamente o foco (+60% foco por 2 turnos)',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.ELETRICIDADE,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'foco',
    efeitos_status: ['sobrecarga'],
    duracao_efeito: 2,
    alvo: 'self',
    custo_energia: 30,
    cooldown: 3,
    nivel_minimo: 1
  })
};

/**
 * ========================================
 * RESUMO DAS 2 HABILIDADES DE ELETRICIDADE
 * ========================================
 *
 * 1️⃣ RELÂMPAGO (Ataque)
 *    Dano: 100 base + Foco×2.0
 *    Efeitos: 70% chance de paralisar (30% chance de falhar ações)
 *    Energia: 40 | Cooldown: 2
 *
 * 2️⃣ SOBRECARGA (Suporte)
 *    Dano: 0 (não ataca)
 *    Efeitos: +60% foco por 1 turno
 *    Energia: 30 | Cooldown: 3
 *
 * ✅ SISTEMA SIMPLIFICADO
 * ✅ Efeitos claros e diretos
 * ✅ Fácil de balancear e entender
 */
