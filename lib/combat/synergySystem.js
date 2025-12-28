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
    tipo: 'Híbrido',
    descricao: 'Elemento versátil com capacidades ofensivas e defensivas',

    // Modificadores baseados no elemento do INIMIGO
    contrainimigo: {
      [ELEMENTOS.FOGO]: {
        nome: 'Torrente Apagadora',
        modificadores: {
          dano_habilidades: 0.15 // +15% dano de habilidades ofensivas
        },
        descricao: 'Água apaga o fogo'
      },

      [ELEMENTOS.ELETRICIDADE]: {
        nome: 'Condução Vulnerável',
        modificadores: {
          resistencia: -0.15 // -15% resistência/defesa
        },
        descricao: 'Água conduz eletricidade'
      },

      // Todos os outros elementos (Água, Terra, Vento, Luz, Sombra, Void, Aether)
      default: {
        nome: 'Fluidez Adaptativa',
        modificadores: {
          resistencia: 0.03 // +3% resistência/defesa
        },
        descricao: 'Água se adapta e protege'
      }
    }
  },

  // ========== TERRA (RESISTÊNCIA) ==========
  [ELEMENTOS.TERRA]: {
    tipo: 'Resistência',
    descricao: 'Elemento focado em defesa e resistência',

    // Modificadores baseados no elemento do INIMIGO
    contrainimigo: {
      [ELEMENTOS.ELETRICIDADE]: {
        nome: 'Isolamento Terrestre',
        modificadores: {
          resistencia: 0.15 // +15% resistência/defesa
        },
        descricao: 'Terra isola a eletricidade'
      },

      [ELEMENTOS.VENTO]: {
        nome: 'Erosão Rochosa',
        modificadores: {
          resistencia: -0.15 // -15% resistência/defesa
        },
        descricao: 'Ventos corroem a rocha'
      },

      // Todos os outros elementos (Fogo, Água, Terra, Luz, Sombra, Void, Aether)
      default: {
        nome: 'Firmeza Rochosa',
        modificadores: {
          resistencia: 0.05 // +5% resistência/defesa
        },
        descricao: 'Terra sempre resiste'
      }
    }
  },

  // ========== VENTO (VELOCIDADE/EVASÃO) ==========
  [ELEMENTOS.VENTO]: {
    tipo: 'Velocidade/Evasão',
    descricao: 'Elemento focado em mobilidade e esquiva',

    // Modificadores baseados no elemento do INIMIGO
    contrainimigo: {
      [ELEMENTOS.TERRA]: {
        nome: 'Rajada Erosiva',
        modificadores: {
          dano_habilidades: 0.10, // +10% dano de habilidades ofensivas
          evasao: 0.10 // +10% evasão (maior chance de esquiva)
        },
        descricao: 'Vento corrói terra e dificulta acertos'
      },

      [ELEMENTOS.FOGO]: {
        nome: 'Corrente Vulnerável',
        modificadores: {
          resistencia: -0.15 // -15% resistência/defesa
        },
        descricao: 'Vento alimenta o fogo contra si'
      },

      // Todos os outros elementos (Água, Vento, Eletricidade, Luz, Sombra, Void, Aether)
      default: {
        nome: 'Brisa Evasiva',
        modificadores: {
          dano_habilidades: 0.03, // +3% dano de habilidades ofensivas
          evasao: 0.05 // +5% evasão (maior esquiva)
        },
        descricao: 'Vento ágil e difícil de acertar'
      }
    }
  },

  // ========== ELETRICIDADE (OFENSIVO/CRÍTICO) ==========
  [ELEMENTOS.ELETRICIDADE]: {
    tipo: 'Ofensivo/Crítico',
    descricao: 'Elemento focado em dano explosivo e críticos',

    // Modificadores baseados no elemento do INIMIGO
    contrainimigo: {
      [ELEMENTOS.AGUA]: {
        nome: 'Condução Letal',
        modificadores: {
          dano_habilidades: 0.15 // +15% dano de habilidades ofensivas
        },
        descricao: 'Eletricidade conduz através da água'
      },

      [ELEMENTOS.TERRA]: {
        nome: 'Isolamento Terrestre',
        modificadores: {
          dano_habilidades: -0.15 // -15% dano de habilidades ofensivas
        },
        descricao: 'Terra isola eletricidade'
      },

      // Todos os outros elementos (Fogo, Vento, Eletricidade, Luz, Sombra, Void, Aether)
      default: {
        nome: 'Descarga Crítica',
        modificadores: {
          dano_habilidades: 0.03, // +3% dano de habilidades ofensivas
          critico: 0.05 // +5% chance de crítico
        },
        descricao: 'Raios precisos e letais'
      }
    }
  },

  // ========== LUZ (PURIFICADOR/ANTI-SOMBRA) ==========
  [ELEMENTOS.LUZ]: {
    tipo: 'Purificador',
    descricao: 'Elemento focado em purificação e combate às trevas',

    // Modificadores baseados no elemento do INIMIGO
    contrainimigo: {
      [ELEMENTOS.SOMBRA]: {
        nome: 'Radiância Purificadora',
        modificadores: {
          dano_habilidades: 0.20 // +20% dano de habilidades ofensivas
        },
        descricao: 'Luz destrói as sombras'
      },

      // Todos os outros elementos (Fogo, Água, Terra, Vento, Eletricidade, Luz, Void, Aether)
      default: {
        nome: 'Escudo Luminoso',
        modificadores: {
          resistencia: 0.05 // +5% resistência/defesa
        },
        descricao: 'Luz protege contra tudo'
      }
    }
  },

  // ========== SOMBRA (OFENSIVO/ANTI-LUZ) ==========
  [ELEMENTOS.SOMBRA]: {
    tipo: 'Ofensivo/Anti-Luz',
    descricao: 'Elemento focado em dano através das trevas',

    // Modificadores baseados no elemento do INIMIGO
    contrainimigo: {
      [ELEMENTOS.LUZ]: {
        nome: 'Trevas Consumidoras',
        modificadores: {
          dano_habilidades: 0.20 // +20% dano de habilidades ofensivas
        },
        descricao: 'Sombras devoram a luz'
      },

      // Todos os outros elementos (Fogo, Água, Terra, Vento, Eletricidade, Sombra, Void, Aether)
      default: {
        nome: 'Manto das Trevas',
        modificadores: {
          dano_habilidades: 0.05 // +5% dano de habilidades ofensivas
        },
        descricao: 'Sombras corroem silenciosamente'
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
      critico: 'Chance Crítico',
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
      critico: 'Chance de Crítico',
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
