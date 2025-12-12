// ==================== HABILIDADES DE VOID ====================
// Arquivo: /app/avatares/sistemas/abilities/void.js

import { TIPO_HABILIDADE, RARIDADE_HABILIDADE, criarHabilidade } from '../constants/abilityTypes';
import { ELEMENTOS } from '../elementalSystem';

export const HABILIDADES_VOID = {
  // Básicas
  TOQUE_DO_VAZIO: criarHabilidade({
    nome: 'Toque do Vazio',
    descricao: 'Drena a essência vital do inimigo, ignorando parte de suas defesas',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    elemento: ELEMENTOS.VOID,
    dano_base: 25,
    multiplicador_stat: 1.1,
    stat_primario: 'foco',
    efeitos_status: ['enfraquecimento'],
    duracao_efeito: 2,
    ignora_defesa: 0.25, // Ignora 25% da defesa
    custo_energia: 20,
    cooldown: 0,
    evolui_para: 'RUPTURA_DIMENSIONAL',
    nivel_evolucao: 10
  }),

  CAMPO_DE_ANULACAO: criarHabilidade({
    nome: 'Campo de Anulação',
    descricao: 'Cria uma zona que anula buffs inimigos e reduz dano recebido',
    tipo: TIPO_HABILIDADE.DEFENSIVA,
    elemento: ELEMENTOS.VOID,
    dano_base: 0,
    multiplicador_stat: 0,
    stat_primario: 'foco',
    efeitos_status: ['anula_buffs_inimigos', 'reducao_dano'],
    alvo: 'self',
    custo_energia: 30,
    cooldown: 3,
    duracao_efeito: 2,
    nivel_minimo: 5,
    efeito_especial: 'remove_buffs_inimigos'
  }),

  // Avançadas
  RUPTURA_DIMENSIONAL: criarHabilidade({
    nome: 'Ruptura Dimensional',
    descricao: 'Rasga o tecido da realidade, causando dano que ignora defesas e anula buffs',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.VOID,
    dano_base: 85,
    multiplicador_stat: 1.6,
    stat_primario: 'foco',
    efeitos_status: ['enfraquecimento', 'anula_buffs'],
    duracao_efeito: 3,
    ignora_defesa: 0.40, // Ignora 40% da defesa
    custo_energia: 45,
    cooldown: 2,
    nivel_minimo: 10,
    evolui_para: 'COLAPSO_DO_VAZIO',
    nivel_evolucao: 25
  }),

  CONSUMO_DE_ENERGIA: criarHabilidade({
    nome: 'Consumo de Energia',
    descricao: 'Drena a energia do oponente e a converte em poder',
    tipo: TIPO_HABILIDADE.CONTROLE,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.VOID,
    dano_base: 35,
    multiplicador_stat: 1.0,
    stat_primario: 'foco',
    efeitos_status: ['dreno_energia', 'ganho_energia'],
    duracao_efeito: 2,
    custo_energia: 35,
    cooldown: 3,
    nivel_minimo: 15,
    efeito_especial: 'drena_30_energia_inimigo'
  }),

  DISTORCAO_TEMPORAL: criarHabilidade({
    nome: 'Distorção Temporal',
    descricao: 'Manipula o vazio para criar uma bolha temporal que reduz velocidade inimiga',
    tipo: TIPO_HABILIDADE.CONTROLE,
    raridade: RARIDADE_HABILIDADE.AVANCADA,
    elemento: ELEMENTOS.VOID,
    dano_base: 30,
    multiplicador_stat: 0.8,
    stat_primario: 'foco',
    efeitos_status: ['lentidao', 'confusao'],
    chance_efeito: 75,
    duracao_efeito: 2,
    custo_energia: 40,
    cooldown: 4,
    nivel_minimo: 18
  }),

  // Ultimate
  COLAPSO_DO_VAZIO: criarHabilidade({
    nome: 'Colapso do Vazio',
    descricao: 'Invoca um colapso dimensional devastador que anula tudo ao redor',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.ULTIMATE,
    elemento: ELEMENTOS.VOID,
    dano_base: 180,
    multiplicador_stat: 2.2,
    stat_primario: 'foco',
    efeitos_status: ['anula_buffs', 'enfraquecimento', 'dreno_energia'],
    duracao_efeito: 4,
    ignora_defesa: 0.60, // Ignora 60% da defesa
    custo_energia: 80,
    cooldown: 5,
    nivel_minimo: 25,
    efeito_especial: 'remove_todos_buffs_inimigos'
  }),

  SINGULARIDADE_NEGRA: criarHabilidade({
    nome: 'Singularidade Negra',
    descricao: 'Cria um buraco negro que consome tudo, causando dano contínuo massivo',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.ULTIMATE,
    elemento: ELEMENTOS.VOID,
    dano_base: 150,
    multiplicador_stat: 1.9,
    stat_primario: 'foco',
    efeitos_status: ['dot_void', 'aprisionamento'],
    duracao_efeito: 3,
    ignora_defesa: 0.50,
    custo_energia: 75,
    cooldown: 6,
    nivel_minimo: 30,
    efeito_especial: 'impede_cura_por_3_turnos'
  }),

  // Lendária
  ANIQUILACAO_TOTAL: criarHabilidade({
    nome: 'Aniquilação Total',
    descricao: 'Erradica a existência do alvo, ignorando todas as defesas e imortalidade',
    tipo: TIPO_HABILIDADE.OFENSIVA,
    raridade: RARIDADE_HABILIDADE.LENDARIA,
    elemento: ELEMENTOS.VOID,
    dano_base: 300,
    multiplicador_stat: 3.0,
    stat_primario: 'foco',
    efeitos_status: ['anula_tudo', 'enfraquecimento_extremo'],
    duracao_efeito: 5,
    ignora_defesa: 1.0, // Ignora 100% da defesa
    custo_energia: 100,
    cooldown: 8,
    nivel_minimo: 40,
    efeito_especial: 'ignora_imortalidade_e_revive'
  })
};
