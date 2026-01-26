import { HABILIDADES_POR_ELEMENTO } from '@/app/avatares/sistemas/abilitiesSystem';

/**
 * Retorna o emoji do elemento
 */
export function getElementoEmoji(elemento) {
  const emojis = {
    'fogo': '🔥',
    'agua': '💧',
    'terra': '🪨',
    'vento': '💨',
    'eletricidade': '⚡',
    'luz': '✨',
    'sombra': '🌑',
    'void': '🕳️',
    'aether': '✨',
  };
  return emojis[elemento?.toLowerCase()] || '⚪';
}

/**
 * Retorna o emoji do efeito
 */
export function getEfeitoEmoji(tipo) {
  const emojis = {
    'queimadura': '🔥',
    'queimadura_intensa': '🔥🔥',
    'afogamento': '💧',
    'eletrocucao': '⚡',
    'congelado': '❄️',
    'paralisia': '⚡',
    'paralisia_intensa': '⚡⚡',
    'atordoado': '💫',
    'desorientado': '🌀',
    'enfraquecido': '⬇️',
    'lentidao': '🐌',
    'terror': '😱',
    'maldito': '💀',
    'defesa_aumentada': '🛡️',
    'defesa_aumentada_instantanea': '🛡️🔥',
    'evasao_aumentada': '💨',
    'evasao_aumentada_instantanea': '💨⚡',
    'velocidade_aumentada': '⚡',
    'sobrecarga': '⚡🔴',
    'bencao': '✨',
    'transcendencia': '✨🌟',
    'precisao_aumentada': '🎯',
    'regeneracao': '💚',
    'invisivel': '👻',
    'aegis_sagrado': '🛡️✨',
    'corrente_temporal': '🌊⏰',
    'escudo_flamejante': '🔥🛡️',
    'reducao_dano': '🛡️💜',
    'escudo_energetico': '✨🛡️',
    'enfraquecimento_primordial': '🕳️⬇️',
  };
  return emojis[tipo] || '⚪';
}

/**
 * Verifica se um efeito é buff
 */
export function ehBuff(tipo) {
  const buffs = [
    'defesa_aumentada',
    'defesa_aumentada_instantanea',
    'evasao_aumentada',
    'evasao_aumentada_instantanea',
    'velocidade_aumentada',
    'sobrecarga',
    'bencao',
    'transcendencia',
    'precisao_aumentada',
    'regeneracao',
    'invisivel',
    'aegis_sagrado',
    'corrente_temporal',
    'escudo_flamejante',
    'reducao_dano',
    'escudo_energetico',
  ];
  return buffs.includes(tipo);
}

/**
 * Atualiza balanceamento de habilidade
 */
export function atualizarBalanceamentoHabilidade(habilidadeAvatar, elemento) {
  // Buscar habilidade do sistema por elemento
  const habilidadesSistema = HABILIDADES_POR_ELEMENTO[elemento?.toUpperCase()] || [];
  const habilidadeSistema = habilidadesSistema.find(h => h.nome === habilidadeAvatar.nome);

  if (!habilidadeSistema) {
    return habilidadeAvatar;
  }

  // Retornar habilidade com valores atualizados do sistema
  return {
    ...habilidadeAvatar,
    tipo: habilidadeSistema.tipo,
    custo_energia: habilidadeSistema.custo_energia,
    chance_efeito: habilidadeSistema.chance_efeito,
    duracao_efeito: habilidadeSistema.duracao_efeito,
    dano_base: habilidadeSistema.dano_base,
    multiplicador_stat: habilidadeSistema.multiplicador_stat,
    stat_primario: habilidadeSistema.stat_primario,
    num_golpes: habilidadeSistema.num_golpes,
    efeitos_status: habilidadeSistema.efeitos_status,
    efeitos: habilidadeSistema.efeitos,
    cooldown: habilidadeSistema.cooldown,
    chance_acerto: habilidadeSistema.chance_acerto,
    ignora_defesa: habilidadeSistema.ignora_defesa
  };
}

/**
 * Retorna informações detalhadas do efeito para display
 */
export function getEfeitoDetalhado(efeito) {
  const nomes = {
    'sobrecarga': 'Sobrecarga',
    'defesa_aumentada': 'Defesa Aumentada',
    'evasao_aumentada': 'Evasão Aumentada',
    'velocidade_aumentada': 'Velocidade Aumentada',
    'bencao': 'Benção',
    'transcendencia': 'Transcendência',
    'precisao_aumentada': 'Precisão Aumentada',
    'regeneracao': 'Regeneração',
    'invisivel': 'Invisível',
    'aegis_sagrado': 'Aegis Sagrado',
    'corrente_temporal': 'Corrente Temporal',
    'escudo_flamejante': 'Escudo Flamejante',
    'reducao_dano': 'Campo de Anulação',
    'escudo_energetico': 'Escudo Energético',
    'queimadura': 'Queimadura',
    'queimadura_intensa': 'Queimadura Intensa',
    'afogamento': 'Afogamento',
    'eletrocucao': 'Eletrocução',
    'congelado': 'Congelado',
    'paralisia': 'Paralisia',
    'paralisia_intensa': 'Paralisia Intensa',
    'atordoado': 'Atordoado',
    'desorientado': 'Desorientado',
    'enfraquecido': 'Enfraquecido',
    'lentidao': 'Lentidão',
    'terror': 'Terror',
    'maldito': 'Maldito',
    'enfraquecimento_primordial': 'Ruptura Dimensional',
  };

  const efeitosDescricao = [];

  // Buffs de stat
  if (efeito.bonusFoco) efeitosDescricao.push(`Foco +${Math.floor(efeito.bonusFoco * 100)}%`);
  if (efeito.bonusForca) efeitosDescricao.push(`Força +${Math.floor(efeito.bonusForca * 100)}%`);
  if (efeito.bonusResistencia) efeitosDescricao.push(`Resistência +${Math.floor(efeito.bonusResistencia * 100)}%`);
  if (efeito.bonusAgilidade) efeitosDescricao.push(`Agilidade +${Math.floor(efeito.bonusAgilidade * 100)}%`);
  if (efeito.bonusTodosStats) efeitosDescricao.push(`Todos Stats +${Math.floor(efeito.bonusTodosStats * 100)}%`);
  if (efeito.bonusEvasao) efeitosDescricao.push(`Evasão +${Math.floor(efeito.bonusEvasao * 100)}%`);
  if (efeito.bonusAcerto) efeitosDescricao.push(`Precisão +${Math.floor(efeito.bonusAcerto * 100)}%`);

  // Debuffs de stat
  if (efeito.reducaoFoco) efeitosDescricao.push(`Foco -${Math.floor(efeito.reducaoFoco * 100)}%`);
  if (efeito.reducaoForca) efeitosDescricao.push(`Força -${Math.floor(efeito.reducaoForca * 100)}%`);
  if (efeito.reducaoResistencia) efeitosDescricao.push(`Resistência -${Math.floor(efeito.reducaoResistencia * 100)}%`);
  if (efeito.reducaoAgilidade) efeitosDescricao.push(`Agilidade -${Math.floor(efeito.reducaoAgilidade * 100)}%`);
  if (efeito.reducaoStats) efeitosDescricao.push(`Todos Stats -${Math.floor(efeito.reducaoStats * 100)}%`);

  // Efeitos especiais
  if (efeito.reducaoDanoRecebido) efeitosDescricao.push(`Reduz ${Math.floor(efeito.reducaoDanoRecebido * 100)}% dano recebido`);
  if (efeito.acertoGarantido) efeitosDescricao.push(`Acerto garantido 100%`);
  if (efeito.evasaoTotal) efeitosDescricao.push(`Evasão total`);
  if (efeito.danoPorTurno) efeitosDescricao.push(`${Math.floor(efeito.danoPorTurno * 100)}% HP/turno`);
  if (efeito.curaPorTurno) efeitosDescricao.push(`+${Math.floor(efeito.curaPorTurno * 100)}% HP/turno`);

  return {
    nome: nomes[efeito.tipo] || efeito.tipo,
    efeitos: efeitosDescricao
  };
}
