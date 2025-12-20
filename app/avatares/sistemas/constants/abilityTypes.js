// ==================== TIPOS E RARIDADES DE HABILIDADES ====================
// Arquivo: /app/avatares/sistemas/constants/abilityTypes.js

/**
 * Tipos de habilidades
 */
export const TIPO_HABILIDADE = {
  OFENSIVA: 'Ofensiva',
  DEFENSIVA: 'Defensiva',
  SUPORTE: 'Suporte',
  CONTROLE: 'Controle',
  PASSIVA: 'Passiva'
};

/**
 * Raridade das habilidades (diferente da raridade do avatar)
 */
export const RARIDADE_HABILIDADE = {
  BASICA: 'Básica',
  AVANCADA: 'Avançada',
  ULTIMATE: 'Ultimate'
};

/**
 * Estrutura base de uma habilidade
 */
export const criarHabilidade = (config) => ({
  nome: config.nome,
  descricao: config.descricao,
  tipo: config.tipo,
  raridade: config.raridade || RARIDADE_HABILIDADE.BASICA,
  elemento: config.elemento,

  // Custos e cooldowns
  custo_energia: config.custo_energia || 20,
  cooldown: config.cooldown || 1, // turnos

  // Efeitos numéricos
  dano_base: config.dano_base ?? 0,
  multiplicador_stat: config.multiplicador_stat ?? 1.0,
  stat_primario: config.stat_primario || 'forca', // qual stat usa

  // Efeitos especiais
  efeitos_status: config.efeitos_status || [],
  alvo: config.alvo || 'inimigo_unico', // inimigo_unico, inimigos_area, aliado, self
  area: config.area || false,
  num_alvos: config.num_alvos || 1,

  // Chances e durações
  chance_acerto: config.chance_acerto || 100,
  chance_efeito: config.chance_efeito || 100,
  duracao_efeito: config.duracao_efeito, // Não setar default - deixar undefined para usar duracao_base do dicionário

  // Requisitos
  nivel_minimo: config.nivel_minimo || 1,
  vinculo_minimo: config.vinculo_minimo || 0,

  // Evolução
  evolui_para: config.evolui_para || null,
  nivel_evolucao: config.nivel_evolucao || null
});
