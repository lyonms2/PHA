// ==================== HABILIDADES DE FOGO - SIMPLIFICADO ====================
// Arquivo: /app/avatares/sistemas/abilities/fogo.js
//
// ESTRUTURA SIMPLIFICADA: 2 habilidades por elemento
// 1. Ataque Forte - Dano + efeito temático do elemento
// 2. Defesa/Suporte - Proteção/buff temático
//
// Sistema de combate: Ataque Básico + Defender + 2 Habilidades

import { TIPO_HABILIDADE, RARIDADE_HABILIDADE, criarHabilidade } from '../constants/abilityTypes';
import { ELEMENTOS } from '../elementalSystem';

export const HABILIDADES_FOGO = {
  // ==================== 1️⃣ EXPLOSÃO DE CHAMAS ====================
  EXPLOSAO_DE_CHAMAS: criarHabilidade({
    nome: 'Explosão de Chamas',
    descricao: 'Ataque explosivo de fogo com 70% chance de queimar o inimigo (reduz -30% defesa por 1 turno)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.FOGO,
    dano_base: 0, // Sem dano base fixo - 100% baseado em stats
    multiplicador_stat: 3.5, // Força × 3.5
    stat_primario: 'forca',
    efeitos_status: ['queimadura'],
    chance_efeito: 70,
    duracao_efeito: 1,
    custo_energia: 40,
    cooldown: 2,
    nivel_minimo: 1
  }),

  // ==================== 2️⃣ ESCUDO DE CHAMAS ====================
  ESCUDO_DE_CHAMAS: criarHabilidade({
    nome: 'Escudo de Chamas',
    descricao: 'Cria um escudo flamejante que aumenta +60% defesa por 2 turnos e queima atacantes (20% do dano recebido)',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.FOGO,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'resistencia',
    efeitos_status: ['defesa_aumentada_instantanea', 'escudo_flamejante'],
    duracao_efeito: 2,
    alvo: 'self',
    custo_energia: 30,
    cooldown: 3,
    nivel_minimo: 1
  })
};

/**
 * ========================================
 * RESUMO DAS 2 HABILIDADES DE FOGO
 * ========================================
 *
 * 1️⃣ EXPLOSÃO DE CHAMAS (Ataque)
 *    Dano: Força × 3.5
 *    Efeitos: 70% chance de queimar (-30% defesa por 1 turno)
 *    Energia: 40 | Cooldown: 2
 *
 * 2️⃣ ESCUDO DE CHAMAS (Defesa) 🔥🛡️
 *    Dano: 0 (não ataca)
 *    Efeitos: +60% defesa por 2 turnos + contra-ataque queimadura (20% do dano)
 *    Energia: 30 | Cooldown: 3
 *    ⚠️ MELHOR QUE DEFENDER: +10% defesa e queima atacantes!
 *
 * ✅ SISTEMA SIMPLIFICADO
 * ✅ Efeitos claros e diretos
 * ✅ Fácil de balancear e entender
 */
