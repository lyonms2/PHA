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
  // ========== COLEÇÕES DE ELEMENTO + RARIDADE ==========
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
      aplicaEm: 'principal', // aplica apenas quando avatar deste elemento é principal
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
 */
export function aplicarBonusColecao(avatar, colecoesAtivas, isPrincipal = false) {
  let bonusAtaque = 0;
  let bonusDefesa = 0;
  let bonusVelocidade = 0;

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

    // Aplicar bônus baseado no tipo
    switch (bonus.tipo) {
      case TIPOS_BONUS.ATAQUE_PERCENTUAL:
        bonusAtaque += bonus.valor;
        break;
      case TIPOS_BONUS.DEFESA_PERCENTUAL:
        bonusDefesa += bonus.valor;
        break;
      case TIPOS_BONUS.VELOCIDADE_PERCENTUAL:
        bonusVelocidade += bonus.valor;
        break;
    }
  });

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
