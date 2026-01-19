// ==================== BALANCEAMENTO DE SINERGIAS ====================
// Arquivo: /app/avatares/sistemas/balance/synergyBalance.js
//
// Define sistema de sinergias entre Avatar Principal e Avatar Suporte
// Usado por: Treino IA, PVP, Missões
//
// IMPORTANTE: Sinergias dão bonus pequenos mas significativos
// Recompensa escolher avatares que combinam bem
// ================================================================

/**
 * FILOSOFIA DE SINERGIAS:
 *
 * SINERGIA FORTE (mesmo elemento):
 * - Fogo + Fogo = "Inferno Devastador"
 * - Bonus: +10% dano, +10% HP, +15% stat principal
 * - Exemplo: Fogo principal tem +15% força
 *
 * SINERGIA MÉDIA (elementos complementares):
 * - Fogo + Terra = "Magma Instável"
 * - Bonus: +5% dano, +5% HP, +10% stat principal
 *
 * SINERGIA FRACA (elementos neutros/opostos):
 * - Fogo + Água = "Vapor Tático"
 * - Bonus: +3% dano, +3% HP, +5% stat principal
 *
 * RARIDADE DO SUPORTE:
 * - Comum: ×1.0 (sem bonus)
 * - Incomum: ×1.05 (+5%)
 * - Raro: ×1.10 (+10%)
 * - Épico: ×1.15 (+15%)
 * - Lendário: ×1.20 (+20%)
 * - Mítico: ×1.25 (+25%)
 */
export const SYNERGY_BALANCE = {

  // ==================== MULTIPLICADORES DE RARIDADE ====================

  /**
   * Multiplicador baseado na raridade do avatar SUPORTE
   * Quanto mais raro, maior o bonus da sinergia
   */
  RARIDADE_MULTIPLICADOR: {
    Comum: 1.00,        // Sem bonus
    Incomum: 1.05,      // +5%
    Raro: 1.10,         // +10%
    Épico: 1.15,        // +15%
    Lendário: 1.20,     // +20%
    Mítico: 1.25        // +25%
  },


  // ==================== BONUS POR TIPO DE SINERGIA ====================

  /**
   * SINERGIA FORTE: Mesmo elemento (Fogo + Fogo)
   * Bonus significativo mas balanceado
   */
  BONUS_SINERGIA: {
    FORTE: {
      bonus_dano_habilidades: 0.10,    // +10% dano de habilidades
      bonus_hp: 0.10,                  // +10% HP máximo
      bonus_stat_principal: 0.15,      // +15% no stat principal (forca para Fogo)
      bonus_resistencia: 0.05          // +5% resistência
    },

    /**
     * SINERGIA MÉDIA: Elementos complementares
     * Bonus moderado
     */
    MEDIA: {
      bonus_dano_habilidades: 0.05,    // +5% dano de habilidades
      bonus_hp: 0.05,                  // +5% HP máximo
      bonus_stat_principal: 0.10,      // +10% no stat principal
      bonus_resistencia: 0.03          // +3% resistência
    },

    /**
     * SINERGIA FRACA: Elementos neutros/opostos
     * Bonus pequeno (melhor que nada!)
     */
    FRACA: {
      bonus_dano_habilidades: 0.03,    // +3% dano de habilidades
      bonus_hp: 0.03,                  // +3% HP máximo
      bonus_stat_principal: 0.05,      // +5% no stat principal
      bonus_resistencia: 0.00          // Sem bonus resistência
    }
  },


  // ==================== TABELA DE SINERGIAS POR ELEMENTO ====================

  /**
   * Define tipo de sinergia entre cada par de elementos
   * Estrutura: { PRINCIPAL: { SUPORTE: 'TIPO' } }
   *
   * FORTE = Mesmo elemento ou elementos muito compatíveis
   * MEDIA = Elementos que combinam bem
   * FRACA = Elementos neutros ou opostos
   */
  SINERGIAS: {

    // ===== FOGO =====
    Fogo: {
      Fogo: 'FORTE',           // Inferno Devastador
      Terra: 'MEDIA',          // Magma Instável (lava)
      Vento: 'MEDIA',          // Tempestade de Fogo
      Eletricidade: 'MEDIA',   // Plasma Incandescente
      Água: 'FRACA',           // Vapor Tático (opostos)
      Gelo: 'FRACA',           // Contraste Térmico (opostos)
      Luz: 'MEDIA',            // Chama Sagrada
      Sombra: 'FRACA',         // Crepúsculo
      Void: 'FRACA',           // Fogo do Vazio
      Aether: 'MEDIA'          // Energia Ígnea
    },

    // ===== ÁGUA =====
    Água: {
      Água: 'FORTE',           // Tsunami Avassalador
      Gelo: 'MEDIA',           // Geada Profunda
      Vento: 'MEDIA',          // Tempestade Aquática
      Terra: 'MEDIA',          // Lama Viscosa
      Fogo: 'FRACA',           // Vapor (opostos)
      Eletricidade: 'FRACA',   // Condutividade Perigosa
      Luz: 'FRACA',            // Reflexo Cristalino
      Sombra: 'MEDIA',         // Névoa Sombria
      Void: 'FRACA',           // Abismo Aquático
      Aether: 'FRACA'          // Purificação
    },

    // ===== TERRA =====
    Terra: {
      Terra: 'FORTE',          // Fortaleza Inabalável
      Fogo: 'MEDIA',           // Magma
      Gelo: 'MEDIA',           // Permafrost
      Água: 'MEDIA',           // Lama
      Eletricidade: 'FRACA',   // Isolamento
      Vento: 'FRACA',          // Erosão (opostos)
      Luz: 'FRACA',            // Cristais Luminosos
      Sombra: 'MEDIA',         // Cavernas Profundas
      Void: 'FRACA',           // Terra Árida
      Aether: 'FRACA'          // Pedras Celestiais
    },

    // ===== VENTO =====
    Vento: {
      Vento: 'FORTE',          // Furacão Destruidor
      Eletricidade: 'MEDIA',   // Tempestade Elétrica
      Fogo: 'MEDIA',           // Inferno de Vento
      Gelo: 'MEDIA',           // Nevasca
      Terra: 'FRACA',          // Poeira (opostos)
      Água: 'FRACA',           // Névoa
      Luz: 'MEDIA',            // Brisa Celestial
      Sombra: 'FRACA',         // Vento Sombrio
      Void: 'FRACA',           // Vácuo
      Aether: 'MEDIA'          // Sopro Divino
    },

    // ===== ELETRICIDADE =====
    Eletricidade: {
      Eletricidade: 'FORTE',   // Sobrecarga Total
      Água: 'MEDIA',           // Eletrólise
      Vento: 'MEDIA',          // Raio Atmosférico
      Fogo: 'MEDIA',           // Plasma
      Terra: 'FRACA',          // Magnetismo
      Gelo: 'FRACA',           // Estática
      Luz: 'MEDIA',            // Raio de Luz
      Sombra: 'FRACA',         // Descarga Sombria
      Void: 'FRACA',           // Anti-energia
      Aether: 'MEDIA'          // Corrente Celestial
    },

    // ===== GELO =====
    Gelo: {
      Gelo: 'FORTE',           // Era Glacial
      Água: 'MEDIA',           // Congelamento
      Vento: 'MEDIA',          // Nevasca
      Terra: 'MEDIA',          // Permafrost
      Fogo: 'FRACA',           // Derretimento (opostos)
      Eletricidade: 'FRACA',   // Cristalização
      Luz: 'FRACA',            // Cristais de Gelo
      Sombra: 'MEDIA',         // Frio Eterno
      Void: 'MEDIA',           // Vazio Congelante
      Aether: 'FRACA'          // Gelo Celestial
    },

    // ===== LUZ =====
    Luz: {
      Luz: 'FORTE',            // Radiância Divina
      Aether: 'MEDIA',         // Pureza Celestial
      Fogo: 'MEDIA',           // Chama Sagrada
      Sombra: 'FRACA',         // Dualidade (opostos)
      Void: 'FRACA',           // Contraste Absoluto (opostos)
      Água: 'FRACA',           // Reflexo
      Terra: 'FRACA',          // Cristais
      Vento: 'MEDIA',          // Brisa Iluminada
      Eletricidade: 'MEDIA',   // Raio de Luz
      Gelo: 'FRACA'            // Brilho Gelado
    },

    // ===== SOMBRA =====
    Sombra: {
      Sombra: 'FORTE',         // Escuridão Absoluta
      Void: 'MEDIA',           // Abismo
      Água: 'MEDIA',           // Névoa Sombria
      Luz: 'FRACA',            // Penumbra (opostos)
      Aether: 'FRACA',         // Harmonia (opostos)
      Fogo: 'FRACA',           // Chamas Negras
      Terra: 'MEDIA',          // Cavernas
      Vento: 'FRACA',          // Vento Negro
      Eletricidade: 'FRACA',   // Descarga Sombria
      Gelo: 'MEDIA'            // Gelo Negro
    },

    // ===== VOID =====
    Void: {
      Void: 'FORTE',           // Aniquilação
      Sombra: 'MEDIA',         // Vazio Profundo
      Aether: 'MEDIA',         // Paradoxo (opostos mas interessante)
      Luz: 'FRACA',            // Antimatéria (opostos)
      Fogo: 'FRACA',           // Fogo do Vazio
      Água: 'FRACA',           // Abismo Aquático
      Terra: 'FRACA',          // Terra Árida
      Vento: 'FRACA',          // Vácuo
      Eletricidade: 'FRACA',   // Anti-energia
      Gelo: 'MEDIA'            // Vazio Congelante
    },

    // ===== AETHER =====
    Aether: {
      Aether: 'FORTE',         // Transcendência
      Luz: 'MEDIA',            // Energia Pura
      Void: 'MEDIA',           // Equilíbrio Cósmico
      Sombra: 'FRACA',         // Dualidade (opostos)
      Fogo: 'MEDIA',           // Energia Ígnea
      Água: 'FRACA',           // Purificação
      Terra: 'FRACA',          // Pedras Celestiais
      Vento: 'MEDIA',          // Sopro Divino
      Eletricidade: 'MEDIA',   // Corrente Celestial
      Gelo: 'FRACA'            // Gelo Celestial
    }
  }
};


/**
 * Calcula modificadores de sinergia entre principal e suporte
 * @param {string} elementoPrincipal - Elemento do avatar principal
 * @param {string} elementoSuporte - Elemento do avatar suporte
 * @param {string} raridadeSuporte - Raridade do suporte ('Comum', 'Raro', etc)
 * @returns {Object} Modificadores calculados
 */
export function calcularSinergia(elementoPrincipal, elementoSuporte, raridadeSuporte = 'Comum') {
  // Buscar tipo de sinergia
  const tipoSinergia = SYNERGY_BALANCE.SINERGIAS[elementoPrincipal]?.[elementoSuporte] || 'FRACA';
  const bonus = SYNERGY_BALANCE.BONUS_SINERGIA[tipoSinergia];

  // Multiplicador de raridade
  const multRaridade = SYNERGY_BALANCE.RARIDADE_MULTIPLICADOR[raridadeSuporte] || 1.0;

  // Aplicar multiplicador de raridade aos bonus
  const bonusFinal = {
    bonus_dano_habilidades: bonus.bonus_dano_habilidades * multRaridade,
    bonus_hp: bonus.bonus_hp * multRaridade,
    bonus_stat_principal: bonus.bonus_stat_principal * multRaridade,
    bonus_resistencia: bonus.bonus_resistencia * multRaridade
  };

  return {
    tipo: tipoSinergia,
    ...bonusFinal,
    multiplicador_raridade: multRaridade,
    nome_sinergia: getNomeSinergia(elementoPrincipal, elementoSuporte, tipoSinergia)
  };
}


/**
 * Gera nome da sinergia baseado nos elementos
 * @param {string} elem1 - Elemento principal
 * @param {string} elem2 - Elemento suporte
 * @param {string} tipo - Tipo de sinergia ('FORTE', 'MEDIA', 'FRACA')
 * @returns {string} Nome da sinergia
 */
function getNomeSinergia(elem1, elem2, tipo) {
  // Mesmo elemento (sempre FORTE)
  if (elem1 === elem2) {
    const nomes = {
      Fogo: 'Inferno Devastador',
      Água: 'Tsunami Avassalador',
      Terra: 'Fortaleza Inabalável',
      Vento: 'Furacão Destruidor',
      Eletricidade: 'Sobrecarga Total',
      Gelo: 'Era Glacial',
      Luz: 'Radiância Divina',
      Sombra: 'Escuridão Absoluta',
      Void: 'Aniquilação Total',
      Aether: 'Transcendência Pura'
    };
    return nomes[elem1] || 'Ressonância Elemental';
  }

  // Elementos diferentes - usar combinação
  const combos = {
    'Fogo+Terra': 'Magma Instável',
    'Fogo+Vento': 'Tempestade de Fogo',
    'Fogo+Eletricidade': 'Plasma Incandescente',
    'Água+Gelo': 'Geada Profunda',
    'Água+Vento': 'Tempestade Aquática',
    'Terra+Gelo': 'Permafrost',
    'Vento+Eletricidade': 'Tempestade Elétrica',
    'Luz+Aether': 'Pureza Celestial',
    'Sombra+Void': 'Abismo Profundo',
    'Void+Aether': 'Paradoxo Cósmico'
  };

  const key1 = `${elem1}+${elem2}`;
  const key2 = `${elem2}+${elem1}`;

  if (combos[key1]) return combos[key1];
  if (combos[key2]) return combos[key2];

  // Nome genérico baseado no tipo
  const prefixos = {
    FORTE: 'Poder',
    MEDIA: 'Harmonia',
    FRACA: 'Equilíbrio'
  };

  return `${prefixos[tipo]} de ${elem1} e ${elem2}`;
}


/**
 * Retorna descrição formatada da sinergia
 * @param {Object} sinergia - Resultado de calcularSinergia()
 * @returns {Array} Array de strings formatadas
 */
export function formatarSinergia(sinergia) {
  const modificadores = [];

  if (sinergia.bonus_dano_habilidades > 0) {
    modificadores.push(`+${(sinergia.bonus_dano_habilidades * 100).toFixed(0)}% Dano Habilidades`);
  }

  if (sinergia.bonus_hp > 0) {
    modificadores.push(`+${(sinergia.bonus_hp * 100).toFixed(0)}% HP`);
  }

  if (sinergia.bonus_stat_principal > 0) {
    modificadores.push(`+${(sinergia.bonus_stat_principal * 100).toFixed(0)}% Stat Principal`);
  }

  if (sinergia.bonus_resistencia > 0) {
    modificadores.push(`+${(sinergia.bonus_resistencia * 100).toFixed(0)}% Resistência`);
  }

  return modificadores;
}
