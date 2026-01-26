/**
 * Utilitários centralizados para efeitos visuais de batalha
 * Usado por: PVP, Treinamento IA, e outras batalhas
 *
 * IMPORTANTE: Todos os efeitos usam lowercase para consistência
 */

/**
 * Retorna emoji correspondente ao elemento
 * @param {string} elemento - Elemento do avatar
 * @returns {string} Emoji do elemento
 */
export function getElementoEmoji(elemento) {
  // Normalizar para lowercase para garantir match
  const el = elemento?.toLowerCase() || '';

  const emojis = {
    'fogo': '🔥',
    'água': '💧',
    'agua': '💧', // Versão sem acento
    'terra': '🌍',
    'vento': '💨',
    'eletricidade': '⚡',
    'luz': '✨',
    'sombra': '🌑',
    'void': '🕳️',
    'aether': '✨'
  };

  return emojis[el] || '⚪';
}

/**
 * Retorna cor Tailwind correspondente ao elemento
 * @param {string} elemento - Elemento do avatar
 * @returns {string} Classe Tailwind de cor
 */
export function getElementoCor(elemento) {
  const el = elemento?.toLowerCase() || '';

  const cores = {
    'fogo': 'text-red-400',
    'água': 'text-blue-400',
    'agua': 'text-blue-400',
    'terra': 'text-amber-600',
    'vento': 'text-cyan-300',
    'eletricidade': 'text-yellow-400',
    'luz': 'text-yellow-300',
    'sombra': 'text-purple-400',
    'void': 'text-purple-900',
    'aether': 'text-cyan-200'
  };

  return cores[el] || 'text-gray-400';
}

/**
 * Retorna emoji correspondente ao efeito de status
 * @param {string} tipo - Tipo do efeito (lowercase normalizado)
 * @returns {string} Emoji do efeito
 */
export function getEfeitoEmoji(tipo) {
  // Normalizar para lowercase
  const t = tipo?.toLowerCase() || '';

  const emojis = {
    // Dano contínuo
    'queimadura': '🔥',
    'queimadura_intensa': '🔥🔥',
    'veneno': '💀',
    'envenenado': '☠️',
    'sangramento': '🩸',
    'eletrocutado': '⚡',
    'eletrocucao': '⚡',
    'afogamento': '💧',
    'erosão': '🌪️',
    'erosao': '🌪️',
    'maldito': '💀',
    'maldição': '💀',
    'maldicao': '💀',

    // Buffs positivos
    'defesa_aumentada': '🛡️',
    'velocidade': '💨',
    'velocidade_aumentada': '⚡💨',
    'evasao_aumentada': '👻',
    'evasão_aumentada': '👻',
    'foco_aumentado': '🎯',
    'forca_aumentada': '💪',
    'força_aumentada': '💪',
    'aumento de força': '💪',
    'aumento de agilidade': '⚡',
    'regeneração': '💚',
    'regeneracao': '💚',
    'escudo': '🛡️',
    'bencao': '✨',
    'benção': '✨',
    'sobrecarga': '⚡🔴',
    'precisao_aumentada': '🎯',
    'precisão_aumentada': '🎯',
    'invisivel': '👻',
    'invisível': '👻',
    'auto_cura': '💚',
    'fortificado': '🗿',

    // Debuffs negativos
    'lentidão': '🐌',
    'lentidao': '🐌',
    'fraqueza': '⬇️',
    'confusão': '🌀',
    'confusao': '🌀',
    'medo': '😱',
    'cegueira': '🌑',
    'silêncio': '🔇',
    'silencio': '🔇',
    'enfraquecido': '⬇️',
    'terror': '😱💀',
    'desorientado': '🌀',

    // Controle de multidão
    'congelado': '❄️',
    'atordoado': '💫',
    'paralisado': '⚡⚡',
    'paralisia': '⚡⚡',
    'paralisia_intensa': '⚡⚡⚡',
    'imobilizado': '🔒',
    'sono': '😴',

    // Efeitos especiais
    'fantasma': '👻',
    'drenar': '🗡️',
    'queimadura_contra_ataque': '🔥🛡️',
    'roubo_vida': '🩸',
    'roubo_vida_intenso': '🩸🩸',
    'roubo_vida_massivo': '🩸🩸🩸',
    'perfuracao': '🗡️',
    'perfuração': '🗡️',
    'execucao': '💀⚔️',
    'execução': '💀⚔️',
    'fissuras_explosivas': '💥🌍',
    'vendaval_cortante': '💨⚔️',
    'limpar_debuffs': '✨🧹',
    'dano_massivo_inimigos': '💥'
  };

  return emojis[t] || '✨';
}

/**
 * Verifica se um efeito é um buff (positivo) ou debuff (negativo)
 * @param {string} tipo - Tipo do efeito
 * @returns {boolean} true se for buff, false se for debuff
 */
export function ehBuff(tipo) {
  // Normalizar para lowercase
  const t = tipo?.toLowerCase() || '';

  const buffsPositivos = [
    'defesa_aumentada',
    'velocidade',
    'velocidade_aumentada',
    'foco_aumentado',
    'forca_aumentada',
    'força_aumentada',
    'aumento de força',
    'aumento de agilidade',
    'regeneração',
    'regeneracao',
    'escudo',
    'evasao_aumentada',
    'evasão_aumentada',
    'invisivel',
    'invisível',
    'sobrecarga',
    'benção',
    'bencao',
    'queimadura_contra_ataque',
    'precisao_aumentada',
    'precisão_aumentada',
    'auto_cura',
    'limpar_debuffs',
    'fortificado'
  ];

  return buffsPositivos.includes(t);
}

/**
 * Retorna nome da sala PVP baseado no poder máximo permitido
 * @param {number} maxPower - Poder máximo da sala
 * @returns {string} Nome da sala com emoji
 */
export function getNomeSala(maxPower) {
  if (maxPower <= 39) return '🌱 Sala Iniciante';
  if (maxPower <= 60) return '⚡ Sala Intermediário';
  if (maxPower <= 90) return '🔥 Sala Avançado';
  return '👑 Sala Elite';
}

/**
 * Normaliza o nome de um efeito para lowercase
 * Útil para garantir consistência ao processar efeitos do backend
 * @param {string} efeito - Nome do efeito
 * @returns {string} Nome normalizado
 */
export function normalizarEfeito(efeito) {
  return efeito?.toLowerCase()?.trim() || '';
}

/**
 * Retorna informações detalhadas do efeito para display
 * @param {Object} efeito - Objeto do efeito com propriedades
 * @returns {Object} {nome: string, efeitos: string[]}
 */
export function getEfeitoDetalhado(efeito) {
  const nomes = {
    'sobrecarga': 'Sobrecarga',
    'defesa_aumentada': 'Defesa Aumentada',
    'defesa_aumentada_instantanea': 'Defesa Aumentada',
    'evasao_aumentada': 'Evasão Aumentada',
    'evasao_aumentada_instantanea': 'Evasão Aumentada',
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
  if (efeito.reducaoDanoRecebido) efeitosDescricao.push(`Reduz ${Math.floor(efeito.reducaoDanoRecebido * 100)}% dano`);
  if (efeito.acertoGarantido) efeitosDescricao.push(`Acerto 100%`);
  if (efeito.evasaoTotal) efeitosDescricao.push(`Evasão total`);
  if (efeito.danoPorTurno) efeitosDescricao.push(`${Math.floor(efeito.danoPorTurno * 100)}% HP/turno`);
  if (efeito.curaPorTurno) efeitosDescricao.push(`+${Math.floor(efeito.curaPorTurno * 100)}% HP/turno`);

  return {
    nome: nomes[efeito.tipo] || efeito.tipo,
    efeitos: efeitosDescricao
  };
}
