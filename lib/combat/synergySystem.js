// ==================== SISTEMA DE SINERGIAS SIMPLIFICADO ====================
// Sistema baseado no elemento do Avatar Suporte VS elemento do Avatar Principal Inimigo
// Cada elemento tem seu papel (Ofensivo, Defensivo, Suporte, etc.)

import { ELEMENTOS } from '@/app/avatares/sistemas/elementalSystem';

/**
 * ESTRUTURA SIMPLIFICADA:
 * - Não importa o elemento do avatar principal próprio
 * - Importa: Elemento Suporte (próprio) VS Elemento Principal Inimigo
 * - Cada elemento tem modificadores específicos baseados no inimigo
 *
 * MULTIPLICADOR DE RARIDADE (Avatar Suporte):
 * - Comum: ×1.0 (100% dos valores base)
 * - Raro: ×1.2 (120% dos valores base)
 * - Lendário: ×1.4 (140% dos valores base)
 */

// ==================== SINERGIAS POR ELEMENTO DE SUPORTE ====================

export const SYNERGIES_SIMPLIFIED = {

  // ========== FOGO (OFENSIVO) ==========
  [ELEMENTOS.FOGO]: {
    tipo: 'Ofensivo',
    descricao: 'Elemento focado em causar dano máximo',

    // Modificadores baseados no elemento do INIMIGO
    contrainimigo: {
      [ELEMENTOS.VENTO]: {
        nome: 'Chamas Intensificadas',
        modificadores: {
          dano_habilidades: 0.15 // +15% dano de habilidades ofensivas
        },
        descricao: 'Ventos alimentam as chamas'
      },

      [ELEMENTOS.AGUA]: {
        nome: 'Chamas Enfraquecidas',
        modificadores: {
          dano_habilidades: -0.15 // -15% dano de habilidades ofensivas
        },
        descricao: 'Água apaga o fogo'
      },

      // Todos os outros elementos (Fogo, Terra, Eletricidade, Luz, Sombra, Void, Aether)
      default: {
        nome: 'Chamas Moderadas',
        modificadores: {
          dano_habilidades: 0.05 // +5% dano de habilidades ofensivas
        },
        descricao: 'Fogo queima tudo'
      }
    }
  },

  // ========== ÁGUA ==========
  [ELEMENTOS.AGUA]: {
    tipo: 'A definir',
    descricao: 'Aguardando definição',
    contrainimigo: {
      default: {
        nome: 'Sem Sinergia',
        modificadores: {},
        descricao: 'Aguardando configuração'
      }
    }
  },

  // ========== TERRA ==========
  [ELEMENTOS.TERRA]: {
    tipo: 'A definir',
    descricao: 'Aguardando definição',
    contrainimigo: {
      default: {
        nome: 'Sem Sinergia',
        modificadores: {},
        descricao: 'Aguardando configuração'
      }
    }
  },

  // ========== VENTO ==========
  [ELEMENTOS.VENTO]: {
    tipo: 'A definir',
    descricao: 'Aguardando definição',
    contrainimigo: {
      default: {
        nome: 'Sem Sinergia',
        modificadores: {},
        descricao: 'Aguardando configuração'
      }
    }
  },

  // ========== ELETRICIDADE ==========
  [ELEMENTOS.ELETRICIDADE]: {
    tipo: 'A definir',
    descricao: 'Aguardando definição',
    contrainimigo: {
      default: {
        nome: 'Sem Sinergia',
        modificadores: {},
        descricao: 'Aguardando configuração'
      }
    }
  },

  // ========== LUZ ==========
  [ELEMENTOS.LUZ]: {
    tipo: 'A definir',
    descricao: 'Aguardando definição',
    contrainimigo: {
      default: {
        nome: 'Sem Sinergia',
        modificadores: {},
        descricao: 'Aguardando configuração'
      }
    }
  },

  // ========== SOMBRA ==========
  [ELEMENTOS.SOMBRA]: {
    tipo: 'A definir',
    descricao: 'Aguardando definição',
    contrainimigo: {
      default: {
        nome: 'Sem Sinergia',
        modificadores: {},
        descricao: 'Aguardando configuração'
      }
    }
  },

  // ========== VOID ==========
  [ELEMENTOS.VOID]: {
    tipo: 'A definir',
    descricao: 'Aguardando definição',
    contrainimigo: {
      default: {
        nome: 'Sem Sinergia',
        modificadores: {},
        descricao: 'Aguardando configuração'
      }
    }
  },

  // ========== AETHER ==========
  [ELEMENTOS.AETHER]: {
    tipo: 'A definir',
    descricao: 'Aguardando definição',
    contrainimigo: {
      default: {
        nome: 'Sem Sinergia',
        modificadores: {},
        descricao: 'Aguardando configuração'
      }
    }
  }
};

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Obtém a sinergia do Avatar Suporte contra o Avatar Principal Inimigo
 * @param {string} elementoSuporte - Elemento do avatar suporte (próprio)
 * @param {string} elementoPrincipalInimigo - Elemento do avatar principal inimigo
 * @returns {object|null} Sinergia encontrada
 */
export function getSynergyContraInimigo(elementoSuporte, elementoPrincipalInimigo) {
  if (!SYNERGIES_SIMPLIFIED[elementoSuporte]) {
    console.warn(`Elemento suporte '${elementoSuporte}' não encontrado`);
    return null;
  }

  const sinergiaElemento = SYNERGIES_SIMPLIFIED[elementoSuporte];

  // Verificar se há sinergia específica contra esse elemento inimigo
  if (sinergiaElemento.contrainimigo[elementoPrincipalInimigo]) {
    return {
      ...sinergiaElemento.contrainimigo[elementoPrincipalInimigo],
      elementoSuporte,
      elementoInimigo: elementoPrincipalInimigo,
      tipoSuporte: sinergiaElemento.tipo
    };
  }

  // Usar sinergia padrão
  return {
    ...sinergiaElemento.contrainimigo.default,
    elementoSuporte,
    elementoInimigo: elementoPrincipalInimigo,
    tipoSuporte: sinergiaElemento.tipo
  };
}

/**
 * Formata sinergia para exibição nos logs
 * @param {object} sinergia - Sinergia a ser formatada
 * @param {number} multiplicadorRaridade - Multiplicador de raridade (1.0, 1.2, 1.4)
 * @returns {string} Texto formatado
 */
export function formatarSinergiaParaLog(sinergia, multiplicadorRaridade = 1.0) {
  if (!sinergia || !sinergia.modificadores) return '';

  const modificadores = [];

  for (const [tipo, valor] of Object.entries(sinergia.modificadores)) {
    const valorAjustado = valor * multiplicadorRaridade;
    const porcentagem = Math.floor(Math.abs(valorAjustado) * 100);
    const sinal = valorAjustado >= 0 ? '+' : '-';

    const nomes = {
      dano_habilidades: 'Dano Habilidades',
      dano: 'Dano',
      hp: 'HP Máximo',
      energia: 'Energia Máxima',
      resistencia: 'Resistência',
      evasao: 'Evasão',
      cura: 'Cura',
      roubo_vida: 'Roubo Vida'
    };

    modificadores.push(`${sinal}${porcentagem}% ${nomes[tipo] || tipo}`);
  }

  return `✨ ${sinergia.nome} (${modificadores.join(', ')})`;
}

/**
 * Retorna modificadores formatados da sinergia para UI
 */
export function formatarModificadores(sinergia, multiplicadorRaridade = 1.0) {
  if (!sinergia || !sinergia.modificadores) return [];

  const resultado = [];

  for (const [tipo, valor] of Object.entries(sinergia.modificadores)) {
    const valorAjustado = valor * multiplicadorRaridade;
    const porcentagem = Math.floor(Math.abs(valorAjustado) * 100);
    const sinal = valorAjustado >= 0 ? '+' : '-';

    const nomes = {
      dano_habilidades: 'Dano de Habilidades',
      dano: 'Dano',
      hp: 'HP Máximo',
      energia: 'Energia Máxima',
      resistencia: 'Resistência',
      evasao: 'Evasão',
      cura: 'Cura',
      roubo_vida: 'Roubo de Vida'
    };

    resultado.push({
      texto: `${sinal}${porcentagem}% ${nomes[tipo] || tipo}`,
      isPositive: valorAjustado >= 0,
      valor: valorAjustado
    });
  }

  return resultado;
}

export default {
  SYNERGIES_SIMPLIFIED,
  getSynergyContraInimigo,
  formatarSinergiaParaLog,
  formatarModificadores
};
