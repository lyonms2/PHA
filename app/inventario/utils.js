/**
 * Formata a exibição do efeito de um item
 */
export function formatarEfeitoItem(item) {
  if (item.efeito === 'cura_hp' || item.efeito === 'hp') {
    return `+${item.valor_efeito} HP`;
  }

  if (item.efeito === 'exaustao' || item.efeito === 'cura_exaustao') {
    return `${item.valor_efeito} Exaustão`;
  }

  if (item.efeito === 'ambos') {
    return `+${item.valor_hp || item.valor_efeito} HP / ${item.valor_exaustao} Exaustão`;
  }

  return item.efeito;
}

/**
 * Retorna a cor apropriada baseada no nível de exaustão
 */
export function getCorExaustao(exaustao) {
  const valor = exaustao || 0;

  if (valor >= 60) return 'text-red-400';
  if (valor >= 40) return 'text-orange-400';
  if (valor >= 20) return 'text-yellow-400';
  return 'text-green-400';
}

/**
 * Retorna o HP atual do avatar, considerando null/undefined
 */
export function getHPAtual(avatar, hpMaximo) {
  if (avatar.hp_atual !== null && avatar.hp_atual !== undefined) {
    return avatar.hp_atual;
  }
  return hpMaximo;
}
