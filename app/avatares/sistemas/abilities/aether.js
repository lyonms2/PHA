// ==================== HABILIDADES DE AETHER ====================
// Arquivo: /app/avatares/sistemas/abilities/aether.js

import { TIPO_HABILIDADE, RARIDADE_HABILIDADE, criarHabilidade } from '../constants/abilityTypes';
import { ELEMENTOS } from '../elementalSystem';

export const HABILIDADES_AETHER = {
  // Básicas
  TOQUE_PRIMORDIAL: criarHabilidade({
    nome: 'Toque Primordial',
    descricao: 'Energia pura da criação que causa dano e cura simultaneamente',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    elemento: ELEMENTOS.AETHER,
    dano_base: 28,
    multiplicador_stat: 1.1,
    stat_primario: 'foco',
    efeitos_status: ['cura_pequena'],
    duracao_efeito: 1,
    custo_energia: 18,
    cooldown: 0,
    efeito_especial: 'cura_15_percent_dano_causado',
    evolui_para: 'RAIO_PRIMORDIAL',
    nivel_evolucao: 10
  }),

  PURIFICACAO: criarHabilidade({
    nome: 'Purificação',
    descricao: 'Remove todos os debuffs aliados e fornece regeneração contínua',
    tipo: TIPO_HABILIDADE.SUPORTE,
    elemento: ELEMENTOS.AETHER,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'foco',
    efeitos_status: ['remove_debuffs', 'regeneracao'],
    alvo: 'self',
    custo_energia: 25,
    cooldown: 3,
    duracao_efeito: 3,
    nivel_minimo: 5,
    efeito_especial: 'remove_todos_debuffs'
  }),

  // Avançadas
  RAIO_PRIMORDIAL: criarHabilidade({
    nome: 'Raio Primordial',
    descricao: 'Descarga de energia pura que penetra defesas e purifica debuffs',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.AETHER,
    dano_base: 90,
    multiplicador_stat: 1.7,
    stat_primario: 'foco',
    efeitos_status: ['remove_debuffs', 'cura_moderada'],
    duracao_efeito: 2,
    penetracao_defesa: 0.50, // Penetra 50% da defesa
    custo_energia: 40,
    cooldown: 2,
    nivel_minimo: 10,
    evolui_para: 'GENESE_COSMICA',
    nivel_evolucao: 25
  }),

  ESCUDO_PRIMORDIAL: criarHabilidade({
    nome: 'Escudo Primordial',
    descricao: 'Barreira de essência pura que absorve dano e reflete ataques',
    tipo: TIPO_HABILIDADE.DEFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.AETHER,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'foco',
    efeitos_status: ['escudo_absorve', 'reflexao_dano'],
    alvo: 'self',
    custo_energia: 45,
    cooldown: 4,
    duracao_efeito: 2,
    nivel_minimo: 12,
    efeito_especial: 'absorve_50_dano_reflete_25'
  }),

  RESTAURACAO_VITAL: criarHabilidade({
    nome: 'Restauração Vital',
    descricao: 'Canaliza energia primordial para curar e regenerar energia',
    tipo: TIPO_HABILIDADE.SUPORTE,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.AETHER,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'foco',
    efeitos_status: ['cura_forte', 'regeneracao_energia'],
    alvo: 'self',
    custo_energia: 30,
    cooldown: 3,
    duracao_efeito: 3,
    nivel_minimo: 15,
    efeito_especial: 'cura_40_hp_regenera_20_energia'
  }),

  CAMPO_DE_TRANSCENDENCIA: criarHabilidade({
    nome: 'Campo de Transcendência',
    descricao: 'Eleva o corpo a um estado superior, aumentando todos os stats temporariamente',
    tipo: TIPO_HABILIDADE.SUPORTE,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.AETHER,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'foco',
    efeitos_status: ['buff_todos_stats', 'remove_debuffs'],
    alvo: 'self',
    custo_energia: 50,
    cooldown: 5,
    duracao_efeito: 3,
    nivel_minimo: 18,
    efeito_especial: 'aumenta_25_todos_stats'
  }),

  // Ultimate
  GENESE_COSMICA: criarHabilidade({
    nome: 'Gênese Cósmica',
    descricao: 'Libera o poder da criação, causando dano massivo e curando aliados',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.ULTIMATE,
    elemento: ELEMENTOS.AETHER,
    dano_base: 170,
    multiplicador_stat: 2.0,
    stat_primario: 'foco',
    efeitos_status: ['cura_forte', 'buff_poder'],
    duracao_efeito: 3,
    penetracao_defesa: 0.70, // Penetra 70% da defesa
    custo_energia: 70,
    cooldown: 5,
    nivel_minimo: 25,
    efeito_especial: 'cura_30_hp_aumenta_20_dano'
  }),

  RENASCIMENTO_PRIMORDIAL: criarHabilidade({
    nome: 'Renascimento Primordial',
    descricao: 'Reverte o tempo, removendo todos os debuffs e restaurando vida massivamente',
    tipo: TIPO_HABILIDADE.SUPORTE,
    raridade: RARIDADE_HABILIDADE.ULTIMATE,
    elemento: ELEMENTOS.AETHER,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'foco',
    efeitos_status: ['cura_extrema', 'remove_todos_debuffs', 'buff_defesa'],
    alvo: 'self',
    custo_energia: 80,
    cooldown: 6,
    duracao_efeito: 4,
    nivel_minimo: 28,
    efeito_especial: 'cura_60_hp_remove_debuffs_buff_30_defesa'
  }),

  JULGAMENTO_DIVINO: criarHabilidade({
    nome: 'Julgamento Divino',
    descricao: 'Invoca a ira dos céus, causando dano verdadeiro que ignora todas as defesas',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.ULTIMATE,
    elemento: ELEMENTOS.AETHER,
    dano_base: 200,
    multiplicador_stat: 2.3,
    stat_primario: 'foco',
    efeitos_status: ['purificacao', 'queima_energia'],
    duracao_efeito: 2,
    penetracao_defesa: 1.0, // Penetra 100% da defesa (dano verdadeiro)
    custo_energia: 85,
    cooldown: 7,
    nivel_minimo: 32,
    efeito_especial: 'dano_verdadeiro_ignora_tudo'
  }),

  // Lendária
  CRIACAO_E_DESTRUICAO: criarHabilidade({
    nome: 'Criação e Destruição',
    descricao: 'O poder primordial absoluto: destrói tudo e recria o campo de batalha',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.LENDARIA,
    elemento: ELEMENTOS.AETHER,
    dano_base: 280,
    multiplicador_stat: 2.8,
    stat_primario: 'foco',
    efeitos_status: ['cura_extrema', 'remove_tudo', 'buff_supremo'],
    duracao_efeito: 5,
    penetracao_defesa: 1.0,
    custo_energia: 100,
    cooldown: 8,
    nivel_minimo: 40,
    efeito_especial: 'dano_verdadeiro_cura_50_hp_remove_todos_efeitos_buff_50_stats'
  })
};
