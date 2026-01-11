// ==================== SISTEMA DE COLEÇÕES DE AVATARES ====================
// Coleções que concedem bônus passivos permanentes

/**
 * Tipos de bônus de coleção
 */
export const TIPOS_BONUS = {
  GOLD_BONUS: 'GOLD_BONUS',           // +X% de gold em batalhas
  XP_BONUS: 'XP_BONUS',               // +X% de XP para avatares do elemento
  ATAQUE_PERCENTUAL: 'ATAQUE_PERCENTUAL',     // +X% de ataque (LEGADO - não usado)
  DEFESA_PERCENTUAL: 'DEFESA_PERCENTUAL',     // +X% de defesa (LEGADO - não usado)
  VELOCIDADE_PERCENTUAL: 'VELOCIDADE_PERCENTUAL', // +X% de velocidade (LEGADO - não usado)
  CRITICO_CHANCE: 'CRITICO_CHANCE',           // +X% chance de crítico (LEGADO - não usado)
  ESQUIVA_CHANCE: 'ESQUIVA_CHANCE'            // +X% chance de esquiva (LEGADO - não usado)
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
      tipo: TIPOS_BONUS.GOLD_BONUS,
      valor: 15,
      descricao: '+15% Gold em batalhas'
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
      tipo: TIPOS_BONUS.GOLD_BONUS,
      valor: 15,
      descricao: '+15% Gold em batalhas'
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
      tipo: TIPOS_BONUS.GOLD_BONUS,
      valor: 15,
      descricao: '+15% Gold em batalhas'
    },
    raridade: 'Raro'
  },
  {
    id: 'colecao_raros_ar',
    nome: '💨 Domínio do Vento',
    descricao: 'Possua 5 avatares Raros de Vento',
    icone: '💨',
    criterio: {
      elemento: 'Vento',
      raridade: 'Raro',
      quantidade: 5
    },
    bonus: {
      tipo: TIPOS_BONUS.GOLD_BONUS,
      valor: 15,
      descricao: '+15% Gold em batalhas'
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
    bonus: [
      {
        tipo: TIPOS_BONUS.GOLD_BONUS,
        valor: 30,
        descricao: '+30% Gold em batalhas'
      },
      {
        tipo: TIPOS_BONUS.XP_BONUS,
        valor: 25,
        elementoRequerido: 'Fogo',
        descricao: '+25% XP para avatares de Fogo'
      }
    ],
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
    bonus: [
      {
        tipo: TIPOS_BONUS.GOLD_BONUS,
        valor: 30,
        descricao: '+30% Gold em batalhas'
      },
      {
        tipo: TIPOS_BONUS.XP_BONUS,
        valor: 25,
        elementoRequerido: 'Água',
        descricao: '+25% XP para avatares de Água'
      }
    ],
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
    bonus: [
      {
        tipo: TIPOS_BONUS.GOLD_BONUS,
        valor: 30,
        descricao: '+30% Gold em batalhas'
      },
      {
        tipo: TIPOS_BONUS.XP_BONUS,
        valor: 25,
        elementoRequerido: 'Terra',
        descricao: '+25% XP para avatares de Terra'
      }
    ],
    raridade: 'Lendário'
  },
  {
    id: 'colecao_lendarios_ar',
    nome: '💨👑 Supremacia do Vento',
    descricao: 'Possua 3 avatares Lendários de Vento',
    icone: '💨',
    criterio: {
      elemento: 'Vento',
      raridade: 'Lendário',
      quantidade: 3
    },
    bonus: [
      {
        tipo: TIPOS_BONUS.GOLD_BONUS,
        valor: 30,
        descricao: '+30% Gold em batalhas'
      },
      {
        tipo: TIPOS_BONUS.XP_BONUS,
        valor: 25,
        elementoRequerido: 'Vento',
        descricao: '+25% XP para avatares de Vento'
      }
    ],
    raridade: 'Lendário'
  },
  {
    id: 'colecao_raros_eletrico',
    nome: '⚡ Domínio da Eletricidade',
    descricao: 'Possua 5 avatares Raros de Eletricidade',
    icone: '⚡',
    criterio: {
      elemento: 'Eletricidade',
      raridade: 'Raro',
      quantidade: 5
    },
    bonus: {
      tipo: TIPOS_BONUS.GOLD_BONUS,
      valor: 15,
      descricao: '+15% Gold em batalhas'
    },
    raridade: 'Raro'
  },
  {
    id: 'colecao_lendarios_eletrico',
    nome: '⚡👑 Supremacia da Eletricidade',
    descricao: 'Possua 3 avatares Lendários de Eletricidade',
    icone: '⚡',
    criterio: {
      elemento: 'Eletricidade',
      raridade: 'Lendário',
      quantidade: 3
    },
    bonus: [
      {
        tipo: TIPOS_BONUS.GOLD_BONUS,
        valor: 30,
        descricao: '+30% Gold em batalhas'
      },
      {
        tipo: TIPOS_BONUS.XP_BONUS,
        valor: 25,
        elementoRequerido: 'Eletricidade',
        descricao: '+25% XP para avatares de Eletricidade'
      }
    ],
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
      tipo: TIPOS_BONUS.GOLD_BONUS,
      valor: 15,
      descricao: '+15% Gold em batalhas'
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
    bonus: [
      {
        tipo: TIPOS_BONUS.GOLD_BONUS,
        valor: 30,
        descricao: '+30% Gold em batalhas'
      },
      {
        tipo: TIPOS_BONUS.XP_BONUS,
        valor: 25,
        elementoRequerido: 'Sombra',
        descricao: '+25% XP para avatares de Sombra'
      }
    ],
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
      tipo: TIPOS_BONUS.GOLD_BONUS,
      valor: 15,
      descricao: '+15% Gold em batalhas'
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
    bonus: [
      {
        tipo: TIPOS_BONUS.GOLD_BONUS,
        valor: 30,
        descricao: '+30% Gold em batalhas'
      },
      {
        tipo: TIPOS_BONUS.XP_BONUS,
        valor: 25,
        elementoRequerido: 'Luz',
        descricao: '+25% XP para avatares de Luz'
      }
    ],
    raridade: 'Lendário'
  },

  // ========== COLEÇÕES ESPECIAIS (Vazio e Éter) ==========
  {
    id: 'colecao_raros_vazio',
    nome: '🕳️ Domínio do Void',
    descricao: 'Possua 3 avatares Raros de Void',
    icone: '🕳️',
    criterio: {
      elemento: 'Void',
      raridade: 'Raro',
      quantidade: 3
    },
    bonus: {
      tipo: TIPOS_BONUS.GOLD_BONUS,
      valor: 15,
      descricao: '+15% Gold em batalhas'
    },
    raridade: 'Raro'
  },
  {
    id: 'colecao_lendarios_vazio',
    nome: '🕳️👑 Supremacia do Void',
    descricao: 'Possua 2 avatares Lendários de Void',
    icone: '🕳️',
    criterio: {
      elemento: 'Void',
      raridade: 'Lendário',
      quantidade: 2
    },
    bonus: [
      {
        tipo: TIPOS_BONUS.GOLD_BONUS,
        valor: 30,
        descricao: '+30% Gold em batalhas'
      },
      {
        tipo: TIPOS_BONUS.XP_BONUS,
        valor: 25,
        elementoRequerido: 'Void',
        descricao: '+25% XP para avatares de Void'
      }
    ],
    raridade: 'Lendário'
  },
  {
    id: 'colecao_raros_eter',
    nome: '🌌 Domínio do Aether',
    descricao: 'Possua 3 avatares Raros de Aether',
    icone: '🌌',
    criterio: {
      elemento: 'Aether',
      raridade: 'Raro',
      quantidade: 3
    },
    bonus: {
      tipo: TIPOS_BONUS.GOLD_BONUS,
      valor: 15,
      descricao: '+15% Gold em batalhas'
    },
    raridade: 'Raro'
  },
  {
    id: 'colecao_lendarios_eter',
    nome: '🌌👑 Supremacia do Aether',
    descricao: 'Possua 2 avatares Lendários de Aether',
    icone: '🌌',
    criterio: {
      elemento: 'Aether',
      raridade: 'Lendário',
      quantidade: 2
    },
    bonus: [
      {
        tipo: TIPOS_BONUS.GOLD_BONUS,
        valor: 30,
        descricao: '+30% Gold em batalhas'
      },
      {
        tipo: TIPOS_BONUS.XP_BONUS,
        valor: 25,
        elementoRequerido: 'Aether',
        descricao: '+25% XP para avatares de Aether'
      }
    ],
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
 * Calcula bônus de gold de todas as coleções ativas
 * Coleções de GOLD são CUMULATIVAS (somam)
 */
export function calcularBonusGold(colecoesAtivas) {
  let bonusGold = 0;

  colecoesAtivas.forEach(colecao => {
    const bonusArray = Array.isArray(colecao.bonus) ? colecao.bonus : [colecao.bonus];

    bonusArray.forEach(bonus => {
      if (bonus.tipo === TIPOS_BONUS.GOLD_BONUS) {
        bonusGold += bonus.valor;
      }
    });
  });

  return bonusGold;
}

/**
 * Calcula bônus de XP para um avatar específico
 * IMPORTANTE: Apenas o MAIOR bônus de XP para o elemento é aplicado (não cumulativo)
 */
export function calcularBonusXP(avatar, colecoesAtivas) {
  let bonusXP = 0;

  colecoesAtivas.forEach(colecao => {
    const bonusArray = Array.isArray(colecao.bonus) ? colecao.bonus : [colecao.bonus];

    bonusArray.forEach(bonus => {
      if (bonus.tipo === TIPOS_BONUS.XP_BONUS) {
        // Verificar se o elemento corresponde
        if (!bonus.elementoRequerido || bonus.elementoRequerido === avatar.elemento) {
          bonusXP = Math.max(bonusXP, bonus.valor);
        }
      }
    });
  });

  return bonusXP;
}

/**
 * LEGADO: Função antiga mantida para compatibilidade
 * Não faz nada no novo sistema
 */
export function aplicarBonusColecao(avatar, colecoesAtivas, isPrincipal = false) {
  return {
    bonusAtaque: 0,
    bonusDefesa: 0,
    bonusVelocidade: 0
  };
}

export default {
  TIPOS_BONUS,
  COLECOES,
  getCorRaridadeColecao,
  getBgRaridadeColecao,
  calcularBonusGold,
  calcularBonusXP,
  aplicarBonusColecao // LEGADO - mantido para compatibilidade
};
