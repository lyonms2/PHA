// ==================== HABILIDADES DE AETHER - SIMPLIFICADO ====================
// Arquivo: /app/avatares/sistemas/abilities/aether.js
//
// NOVA ESTRUTURA: 4 habilidades por elemento
// 1. Ataque Fraco (dano médio, mais forte que ataque básico, SEM efeitos)
// 2. Ataque Forte (dano alto + efeito INSTANTÂNEO)
// 3. Suporte (buff/cura INSTANTÂNEA)
// 4. Ultimate (dano massivo + efeito devastador INSTANTÂNEO)
//
// IMPORTANTE: NENHUM efeito dura turnos - tudo é INSTANTÂNEO
// ESPECIALIDADE: Transcendência, mega buffs, dano verdadeiro

import { TIPO_HABILIDADE, RARIDADE_HABILIDADE, criarHabilidade } from '../constants/abilityTypes';
import { ELEMENTOS } from '../elementalSystem';

export const HABILIDADES_AETHER = {
  // ==================== 1. ATAQUE FRACO ====================
  TOQUE_PRIMORDIAL: criarHabilidade({
    nome: 'Toque Primordial',
    descricao: 'Energia pura da criação causa dano médio',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    elemento: ELEMENTOS.AETHER,
    dano_base: 45,
    multiplicador_stat: 1.3,
    stat_primario: 'foco',
    custo_energia: 20,
    cooldown: 0,
    nivel_minimo: 1
  }),

  // ==================== 2. ATAQUE FORTE ====================
  RAIO_PRIMORDIAL: criarHabilidade({
    nome: 'Raio Primordial',
    descricao: 'Descarga de energia pura que penetra 50% da defesa e purifica debuffs',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.AETHER,
    dano_base: 110,
    multiplicador_stat: 2.0,
    stat_primario: 'foco',
    ignora_defesa: 0.50, // Penetra 50% da defesa
    efeitos_status: ['limpar_debuffs'], // Remove debuffs próprios
    custo_energia: 50,
    cooldown: 2,
    nivel_minimo: 5
  }),

  // ==================== 3. SUPORTE ====================
  CAMPO_DE_TRANSCENDENCIA: criarHabilidade({
    nome: 'Campo de Transcendência',
    descricao: 'Eleva o corpo a estado superior (+30% em TODOS os stats neste turno)',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.AETHER,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'foco',
    efeitos_status: ['transcendencia'], // +30% todos os stats
    alvo: 'self',
    custo_energia: 35,
    cooldown: 3,
    nivel_minimo: 3
  }),

  // ==================== 4. ULTIMATE ====================
  GENESE_COSMICA: criarHabilidade({
    nome: 'Gênese Cósmica',
    descricao: 'Libera poder da criação causando dano verdadeiro massivo (ignora 100% defesa)',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.ULTIMATE,
    elemento: ELEMENTOS.AETHER,
    dano_base: 200,
    multiplicador_stat: 2.6,
    stat_primario: 'foco',
    ignora_defesa: 1.0, // Dano verdadeiro - ignora 100% da defesa
    efeitos_status: ['limpar_debuffs'], // Remove todos os debuffs
    custo_energia: 80,
    cooldown: 4,
    nivel_minimo: 1, // TESTE
    vinculo_minimo: 0 // TESTE
  })
};

/**
 * ESTRUTURA FINAL - 4 HABILIDADES:
 *
 * 1️⃣ TOQUE PRIMORDIAL (Ataque Fraco)
 *    - 45 dano base
 *    - Sem efeitos, apenas dano puro
 *    - 20 energia, sem cooldown
 *
 * 2️⃣ RAIO PRIMORDIAL (Ataque Forte)
 *    - 110 dano base
 *    - Ignora 50% da defesa
 *    - Remove debuffs próprios
 *    - 50 energia, cooldown 2
 *
 * 3️⃣ CAMPO DE TRANSCENDÊNCIA (Suporte)
 *    - +30% em TODOS os stats (neste turno)
 *    - Mega buff transcendental
 *    - 35 energia, cooldown 3
 *
 * 4️⃣ GÊNESE CÓSMICA (Ultimate)
 *    - 200 dano base MASSIVO
 *    - DANO VERDADEIRO (ignora 100% da defesa)
 *    - Remove todos os debuffs
 *    - 80 energia, cooldown 4
 *
 * ❌ SEM DoTs/HoTs
 * ❌ SEM efeitos que duram múltiplos turnos
 * ✅ TUDO instantâneo e previsível
 * ✅ ESPECIALIDADE: Dano verdadeiro, mega buffs, transcendência
 */
