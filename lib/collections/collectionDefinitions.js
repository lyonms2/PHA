// ==================== SISTEMA DE COLEÇÕES DE AVATARES ====================
// Coleções que concedem bônus passivos permanentes

/**
 * Tipos de bônus de coleção
 */
export const TIPOS_BONUS = {
  ATAQUE_PERCENTUAL: 'ATAQUE_PERCENTUAL',     // +X% de ataque
  DEFESA_PERCENTUAL: 'DEFESA_PERCENTUAL',     // +X% de defesa
  VELOCIDADE_PERCENTUAL: 'VELOCIDADE_PERCENTUAL', // +X% de velocidade
  CRITICO_CHANCE: 'CRITICO_CHANCE',           // +X% chance de crítico
  ESQUIVA_CHANCE: 'ESQUIVA_CHANCE'            // +X% chance de esquiva
};

/**
 * Definições de todas as coleções disponíveis
 * Cada coleção concede um bônus passivo quando os critérios são atendidos
 */
export const COLECOES = [
  // ========== COLEÇÕES DE RAROS ==========
  {
    id: 'colecao_raros_fogo',
    nome: '🔥 Domínio do Fogo',
    descricao: 'Possua 5 avatares Raros de Fogo',
    icone: '🔥',
    criterio: {
      elemento: 'Fogo',
      raridade: 'Raro',
      quantidade: 5
    },
    bonus: {
      tipo: TIPOS_BONUS.ATAQUE_PERCENTUAL,
      valor: 10,
      aplicaEm: 'principal',
      elementoRequerido: 'Fogo'
    },
    raridade: 'Raro'
  },
  {
    id: 'colecao_raros_agua',
    nome: '💧 Domínio da Água',
    descricao: 'Possua 5 avatares Raros de Água',
    icone: '💧',
    criterio: {
      elemento: 'Água',
      raridade: 'Raro',
      quantidade: 5
    },
    bonus: {
      tipo: TIPOS_BONUS.ATAQUE_PERCENTUAL,
      valor: 10,
      aplicaEm: 'principal',
      elementoRequerido: 'Água'
    },
    raridade: 'Raro'
  },
  {
    id: 'colecao_raros_terra',
    nome: '🪨 Domínio da Terra',
    descricao: 'Possua 5 avatares Raros de Terra',
    icone: '🪨',
    criterio: {
      elemento: 'Terra',
      raridade: 'Raro',
      quantidade: 5
    },
    bonus: {
      tipo: TIPOS_BONUS.ATAQUE_PERCENTUAL,
      valor: 10,
      aplicaEm: 'principal',
      elementoRequerido: 'Terra'
    },
    raridade: 'Raro'
  },
  {
    id: 'colecao_raros_ar',
    nome: '💨 Domínio do Ar',
    descricao: 'Possua 5 avatares Raros de Ar',
    icone: '💨',
    criterio: {
      elemento: 'Ar',
      raridade: 'Raro',
      quantidade: 5
    },
    bonus: {
      tipo: TIPOS_BONUS.ATAQUE_PERCENTUAL,
      valor: 10,
      aplicaEm: 'principal',
      elementoRequerido: 'Ar'
    },
    raridade: 'Raro'
  },

  // ========== COLEÇÕES DE LENDÁRIOS ==========
  {
    id: 'colecao_lendarios_fogo',
    nome: '🔥👑 Supremacia do Fogo',
    descricao: 'Possua 3 avatares Lendários de Fogo',
    icone: '🔥',
    criterio: {
      elemento: 'Fogo',
      raridade: 'Lendário',
      quantidade: 3
    },
    bonus: {
      tipo: TIPOS_BONUS.ATAQUE_PERCENTUAL,
      valor: 20,
      aplicaEm: 'principal',
      elementoRequerido: 'Fogo'
    },
    raridade: 'Lendário'
  },
  {
    id: 'colecao_lendarios_agua',
    nome: '💧👑 Supremacia da Água',
    descricao: 'Possua 3 avatares Lendários de Água',
    icone: '💧',
    criterio: {
      elemento: 'Água',
      raridade: 'Lendário',
      quantidade: 3
    },
    bonus: {
      tipo: TIPOS_BONUS.ATAQUE_PERCENTUAL,
      valor: 20,
      aplicaEm: 'principal',
      elementoRequerido: 'Água'
    },
    raridade: 'Lendário'
  },
  {
    id: 'colecao_lendarios_terra',
    nome: '🪨👑 Supremacia da Terra',
    descricao: 'Possua 3 avatares Lendários de Terra',
    icone: '🪨',
    criterio: {
      elemento: 'Terra',
      raridade: 'Lendário',
      quantidade: 3
    },
    bonus: {
      tipo: TIPOS_BONUS.ATAQUE_PERCENTUAL,
      valor: 20,
      aplicaEm: 'principal',
      elementoRequerido: 'Terra'
    },
    raridade: 'Lendário'
  },
  {
    id: 'colecao_lendarios_ar',
    nome: '💨👑 Supremacia do Ar',
    descricao: 'Possua 3 avatares Lendários de Ar',
    icone: '💨',
    criterio: {
      elemento: 'Ar',
      raridade: 'Lendário',
      quantidade: 3
    },
    bonus: {
      tipo: TIPOS_BONUS.ATAQUE_PERCENTUAL,
      valor: 20,
      aplicaEm: 'principal',
      elementoRequerido: 'Ar'
    },
    raridade: 'Lendário'
  },
  {
    id: 'colecao_raros_eletrico',
    nome: '⚡ Domínio Elétrico',
    descricao: 'Possua 5 avatares Raros de Elétrico',
    icone: '⚡',
    criterio: {
      elemento: 'Elétrico',
      raridade: 'Raro',
      quantidade: 5
    },
    bonus: {
      tipo: TIPOS_BONUS.ATAQUE_PERCENTUAL,
      valor: 10,
      aplicaEm: 'principal',
      elementoRequerido: 'Elétrico'
    },
    raridade: 'Raro'
  },
  {
    id: 'colecao_lendarios_eletrico',
    nome: '⚡👑 Supremacia Elétrica',
    descricao: 'Possua 3 avatares Lendários de Elétrico',
    icone: '⚡',
    criterio: {
      elemento: 'Elétrico',
      raridade: 'Lendário',
      quantidade: 3
    },
    bonus: {
      tipo: TIPOS_BONUS.ATAQUE_PERCENTUAL,
      valor: 20,
      aplicaEm: 'principal',
      elementoRequerido: 'Elétrico'
    },
    raridade: 'Lendário'
  },
  {
    id: 'colecao_raros_sombra',
    nome: '🌑 Domínio da Sombra',
    descricao: 'Possua 5 avatares Raros de Sombra',
    icone: '🌑',
    criterio: {
      elemento: 'Sombra',
      raridade: 'Raro',
      quantidade: 5
    },
    bonus: {
      tipo: TIPOS_BONUS.ATAQUE_PERCENTUAL,
      valor: 10,
      aplicaEm: 'principal',
      elementoRequerido: 'Sombra'
    },
    raridade: 'Raro'
  },
  {
    id: 'colecao_lendarios_sombra',
    nome: '🌑👑 Supremacia das Sombras',
    descricao: 'Possua 3 avatares Lendários de Sombra',
    icone: '🌑',
    criterio: {
      elemento: 'Sombra',
      raridade: 'Lendário',
      quantidade: 3
    },
    bonus: {
      tipo: TIPOS_BONUS.ATAQUE_PERCENTUAL,
      valor: 20,
      aplicaEm: 'principal',
      elementoRequerido: 'Sombra'
    },
    raridade: 'Lendário'
  },
  {
    id: 'colecao_raros_luz',
    nome: '✨ Domínio da Luz',
    descricao: 'Possua 5 avatares Raros de Luz',
    icone: '✨',
    criterio: {
      elemento: 'Luz',
      raridade: 'Raro',
      quantidade: 5
    },
    bonus: {
      tipo: TIPOS_BONUS.ATAQUE_PERCENTUAL,
      valor: 10,
      aplicaEm: 'principal',
      elementoRequerido: 'Luz'
    },
    raridade: 'Raro'
  },
  {
    id: 'colecao_lendarios_luz',
    nome: '✨👑 Supremacia da Luz',
    descricao: 'Possua 3 avatares Lendários de Luz',
    icone: '✨',
    criterio: {
      elemento: 'Luz',
      raridade: 'Lendário',
      quantidade: 3
    },
    bonus: {
      tipo: TIPOS_BONUS.ATAQUE_PERCENTUAL,
      valor: 20,
      aplicaEm: 'principal',
      elementoRequerido: 'Luz'
    },
    raridade: 'Lendário'
  },

  // ========== COLEÇÕES ESPECIAIS (Vazio e Éter) ==========
  {
    id: 'colecao_raros_vazio',
    nome: '🕳️ Domínio do Vazio',
    descricao: 'Possua 3 avatares Raros de Vazio',
    icone: '🕳️',
    criterio: {
      elemento: 'Vazio',
      raridade: 'Raro',
      quantidade: 3
    },
    bonus: {
      tipo: TIPOS_BONUS.ATAQUE_PERCENTUAL,
      valor: 10,
      aplicaEm: 'principal',
      elementoRequerido: 'Vazio'
    },
    raridade: 'Raro'
  },
  {
    id: 'colecao_lendarios_vazio',
    nome: '🕳️👑 Supremacia do Vazio',
    descricao: 'Possua 2 avatares Lendários de Vazio',
    icone: '🕳️',
    criterio: {
      elemento: 'Vazio',
      raridade: 'Lendário',
      quantidade: 2
    },
    bonus: {
      tipo: TIPOS_BONUS.ATAQUE_PERCENTUAL,
      valor: 20,
      aplicaEm: 'principal',
      elementoRequerido: 'Vazio'
    },
    raridade: 'Lendário'
  },
  {
    id: 'colecao_raros_eter',
    nome: '🌌 Domínio do Éter',
    descricao: 'Possua 3 avatares Raros de Éter',
    icone: '🌌',
    criterio: {
      elemento: 'Éter',
      raridade: 'Raro',
      quantidade: 3
    },
    bonus: {
      tipo: TIPOS_BONUS.ATAQUE_PERCENTUAL,
      valor: 10,
      aplicaEm: 'principal',
      elementoRequerido: 'Éter'
    },
    raridade: 'Raro'
  },
  {
    id: 'colecao_lendarios_eter',
    nome: '🌌👑 Supremacia do Éter',
    descricao: 'Possua 2 avatares Lendários de Éter',
    icone: '🌌',
    criterio: {
      elemento: 'Éter',
      raridade: 'Lendário',
      quantidade: 2
    },
    bonus: {
      tipo: TIPOS_BONUS.ATAQUE_PERCENTUAL,
      valor: 20,
      aplicaEm: 'principal',
      elementoRequerido: 'Éter'
    },
    raridade: 'Lendário'
  }
];

/**
 * Retorna cor da raridade da coleção
 */
export function getCorRaridadeColecao(raridade) {
  const cores = {
    'Comum': 'text-gray-400',
    'Raro': 'text-blue-400',
    'Épico': 'text-purple-400',
    'Lendário': 'text-orange-400'
  };
  return cores[raridade] || 'text-gray-400';
}

/**
 * Retorna cor de fundo da raridade da coleção
 */
export function getBgRaridadeColecao(raridade) {
  const cores = {
    'Comum': 'from-gray-600 to-gray-700',
    'Raro': 'from-blue-600 to-blue-700',
    'Épico': 'from-purple-600 to-purple-700',
    'Lendário': 'from-orange-600 to-red-600'
  };
  return cores[raridade] || 'from-gray-600 to-gray-700';
}

/**
 * Aplica bônus de coleção em um avatar
 * IMPORTANTE: Bônus do mesmo tipo e elemento NÃO são cumulativos - usa apenas o MAIOR
 */
export function aplicarBonusColecao(avatar, colecoesAtivas, isPrincipal = false) {
  // Agrupar bônus por tipo + elemento para pegar apenas o maior
  const bonusPorTipoElemento = {
    ataque: {},    // { 'Fogo': 20, 'Água': 10 }
    defesa: {},
    velocidade: {}
  };

  colecoesAtivas.forEach(colecao => {
    const { bonus } = colecao;

    // Verificar se o bônus se aplica
    if (bonus.aplicaEm === 'principal' && !isPrincipal) {
      return; // Bônus só para principal, e este não é principal
    }

    // Verificar se o elemento é o requerido
    if (bonus.elementoRequerido && avatar.elemento !== bonus.elementoRequerido) {
      return; // Elemento não corresponde
    }

    const elemento = bonus.elementoRequerido || 'global';

    // Guardar apenas o MAIOR bônus de cada tipo/elemento
    switch (bonus.tipo) {
      case TIPOS_BONUS.ATAQUE_PERCENTUAL:
        bonusPorTipoElemento.ataque[elemento] = Math.max(
          bonusPorTipoElemento.ataque[elemento] || 0,
          bonus.valor
        );
        break;
      case TIPOS_BONUS.DEFESA_PERCENTUAL:
        bonusPorTipoElemento.defesa[elemento] = Math.max(
          bonusPorTipoElemento.defesa[elemento] || 0,
          bonus.valor
        );
        break;
      case TIPOS_BONUS.VELOCIDADE_PERCENTUAL:
        bonusPorTipoElemento.velocidade[elemento] = Math.max(
          bonusPorTipoElemento.velocidade[elemento] || 0,
          bonus.valor
        );
        break;
    }
  });

  // Somar apenas os valores máximos de cada elemento
  const bonusAtaque = Object.values(bonusPorTipoElemento.ataque).reduce((sum, val) => sum + val, 0);
  const bonusDefesa = Object.values(bonusPorTipoElemento.defesa).reduce((sum, val) => sum + val, 0);
  const bonusVelocidade = Object.values(bonusPorTipoElemento.velocidade).reduce((sum, val) => sum + val, 0);

  return {
    bonusAtaque,
    bonusDefesa,
    bonusVelocidade
  };
}

export default {
  TIPOS_BONUS,
  COLECOES,
  getCorRaridadeColecao,
  getBgRaridadeColecao,
  aplicarBonusColecao
};
