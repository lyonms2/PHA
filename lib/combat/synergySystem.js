// ==================== SISTEMA DE SINERGIAS 9×9 SIMPLIFICADO ====================
// Sistema modular de sinergias entre Avatar Principal e Avatar Suporte
// Cada combinação de elementos gera 2 VANTAGENS e 1 DESVANTAGEM

import { ELEMENTOS } from '@/app/avatares/sistemas/elementalSystem';

/**
 * ESTRUTURA DE SINERGIA SIMPLIFICADA:
 * {
 *   nome: string,
 *   vantagem1: { tipo, valor },
 *   vantagem2: { tipo, valor },
 *   desvantagem: { tipo, valor } | null,
 *   descricao: string
 * }
 *
 * TIPOS DE MODIFICADORES:
 * - dano: +/- % de dano
 * - energia: +/- % de energia máxima
 * - evasao: +/- % de evasão
 * - hp: +/- % de HP máximo
 * - resistencia: +/- % de resistência/defesa
 * - roubo_vida: +% de roubo de vida
 * - cura: +% de cura
 * - energia_inimigo: -% de energia do inimigo
 * - dano_inimigo: -% de dano do inimigo
 * - evasao_inimigo: -% de evasão do inimigo
 * - resistencia_inimigo: -% de resistência do inimigo
 */

// ==================== MATRIZ DE SINERGIAS 9×9 ====================
export const SYNERGIES = {

  // ========== FOGO (Principal) ==========
  [ELEMENTOS.FOGO]: {
    [ELEMENTOS.FOGO]: {
      nome: 'Combustão Intensa',
      vantagem1: { tipo: 'dano', valor: 0.25 },
      vantagem2: { tipo: 'resistencia', valor: 0.15 },
      desvantagem: { tipo: 'energia', valor: -0.20 },
      descricao: 'Chamas se alimentam de chamas, aumentando poder destrutivo'
    },
    [ELEMENTOS.AGUA]: {
      nome: 'Névoa de Vapor',
      vantagem1: { tipo: 'evasao_inimigo', valor: -0.15 },
      vantagem2: { tipo: 'evasao', valor: 0.10 },
      desvantagem: { tipo: 'dano', valor: -0.15 },
      descricao: 'Vapor escaldante reduz visão inimiga'
    },
    [ELEMENTOS.TERRA]: {
      nome: 'Lava Derretida',
      vantagem1: { tipo: 'dano', valor: 0.20 },
      vantagem2: { tipo: 'resistencia_inimigo', valor: -0.10 },
      desvantagem: { tipo: 'evasao', valor: -0.10 },
      descricao: 'Rocha derretida causa queimaduras devastadoras'
    },
    [ELEMENTOS.VENTO]: {
      nome: 'Tempestade Flamejante',
      vantagem1: { tipo: 'dano', valor: 0.20 },
      vantagem2: { tipo: 'evasao_inimigo', valor: -0.15 },
      desvantagem: { tipo: 'resistencia', valor: -0.15 },
      descricao: 'Ventos espalham fogo intensamente'
    },
    [ELEMENTOS.ELETRICIDADE]: {
      nome: 'Plasma Incandescente',
      vantagem1: { tipo: 'dano', valor: 0.22 },
      vantagem2: { tipo: 'energia_inimigo', valor: -0.20 },
      desvantagem: { tipo: 'energia', valor: 0.15 },
      descricao: 'Calor extremo ioniza o ar'
    },
    [ELEMENTOS.LUZ]: {
      nome: 'Chama Solar',
      vantagem1: { tipo: 'dano', valor: 0.20 },
      vantagem2: { tipo: 'cura', valor: 0.10 },
      desvantagem: null,
      descricao: 'Fogo purificador que queima e restaura'
    },
    [ELEMENTOS.SOMBRA]: {
      nome: 'Fogo Fantasma',
      vantagem1: { tipo: 'dano', valor: 0.18 },
      vantagem2: { tipo: 'roubo_vida', valor: 0.15 },
      desvantagem: { tipo: 'hp', valor: -0.10 },
      descricao: 'Chamas negras que queimam a alma'
    },
    [ELEMENTOS.VOID]: {
      nome: 'Incineração do Vazio',
      vantagem1: { tipo: 'dano', valor: 0.30 },
      vantagem2: { tipo: 'resistencia_inimigo', valor: -0.15 },
      desvantagem: { tipo: 'hp', valor: -0.15 },
      descricao: 'Fogo que consome tudo'
    },
    [ELEMENTOS.AETHER]: {
      nome: 'Chama Primordial',
      vantagem1: { tipo: 'dano', valor: 0.25 },
      vantagem2: { tipo: 'energia', valor: 0.15 },
      desvantagem: null,
      descricao: 'Fogo da criação, purificador de energia'
    }
  },

  // ========== ÁGUA (Principal) ==========
  [ELEMENTOS.AGUA]: {
    [ELEMENTOS.FOGO]: {
      nome: 'Neblina Quente',
      vantagem1: { tipo: 'evasao', valor: 0.15 },
      vantagem2: { tipo: 'dano_inimigo', valor: -0.10 },
      desvantagem: { tipo: 'dano', valor: -0.10 },
      descricao: 'Vapor denso confunde inimigos'
    },
    [ELEMENTOS.AGUA]: {
      nome: 'Maremoto',
      vantagem1: { tipo: 'dano', valor: 0.15 },
      vantagem2: { tipo: 'cura', valor: 0.20 },
      desvantagem: { tipo: 'evasao', valor: -0.10 },
      descricao: 'Ondas massivas que curam'
    },
    [ELEMENTOS.TERRA]: {
      nome: 'Pântano Espesso',
      vantagem1: { tipo: 'evasao_inimigo', valor: -0.20 },
      vantagem2: { tipo: 'resistencia', valor: 0.20 },
      desvantagem: { tipo: 'evasao', valor: -0.15 },
      descricao: 'Lama viscosa prende todos'
    },
    [ELEMENTOS.VENTO]: {
      nome: 'Tempestade Gélida',
      vantagem1: { tipo: 'dano', valor: 0.15 },
      vantagem2: { tipo: 'evasao', valor: 0.15 },
      desvantagem: null,
      descricao: 'Chuva congelante que aumenta mobilidade'
    },
    [ELEMENTOS.ELETRICIDADE]: {
      nome: 'Condução Elétrica',
      vantagem1: { tipo: 'dano', valor: 0.25 },
      vantagem2: { tipo: 'energia_inimigo', valor: -0.20 },
      desvantagem: { tipo: 'resistencia', valor: -0.10 },
      descricao: 'Água conduz eletricidade'
    },
    [ELEMENTOS.LUZ]: {
      nome: 'Chuva Abençoada',
      vantagem1: { tipo: 'cura', valor: 0.30 },
      vantagem2: { tipo: 'resistencia', valor: 0.15 },
      desvantagem: { tipo: 'dano', valor: -0.20 },
      descricao: 'Água sagrada que purifica'
    },
    [ELEMENTOS.SOMBRA]: {
      nome: 'Marés Sombrias',
      vantagem1: { tipo: 'dano', valor: 0.12 },
      vantagem2: { tipo: 'roubo_vida', valor: 0.20 },
      desvantagem: { tipo: 'resistencia', valor: -0.10 },
      descricao: 'Águas corrompidas que drenam vida'
    },
    [ELEMENTOS.VOID]: {
      nome: 'Abismo Líquido',
      vantagem1: { tipo: 'dano', valor: 0.20 },
      vantagem2: { tipo: 'energia_inimigo', valor: -0.30 },
      desvantagem: { tipo: 'energia', valor: -0.25 },
      descricao: 'Água do vazio que drena energia'
    },
    [ELEMENTOS.AETHER]: {
      nome: 'Fonte da Vida',
      vantagem1: { tipo: 'cura', valor: 0.35 },
      vantagem2: { tipo: 'hp', valor: 0.15 },
      desvantagem: { tipo: 'dano', valor: -0.20 },
      descricao: 'Água primordial restauradora'
    }
  },

  // ========== TERRA (Principal) ==========
  [ELEMENTOS.TERRA]: {
    [ELEMENTOS.FOGO]: {
      nome: 'Magma Vulcânico',
      vantagem1: { tipo: 'dano', valor: 0.22 },
      vantagem2: { tipo: 'resistencia_inimigo', valor: -0.15 },
      desvantagem: { tipo: 'evasao', valor: -0.15 },
      descricao: 'Rocha derretida cria zona de perigo'
    },
    [ELEMENTOS.AGUA]: {
      nome: 'Lodaçal',
      vantagem1: { tipo: 'evasao_inimigo', valor: -0.25 },
      vantagem2: { tipo: 'resistencia', valor: 0.20 },
      desvantagem: { tipo: 'evasao', valor: -0.20 },
      descricao: 'Lama pesada que prende'
    },
    [ELEMENTOS.TERRA]: {
      nome: 'Fortaleza Rochosa',
      vantagem1: { tipo: 'resistencia', valor: 0.30 },
      vantagem2: { tipo: 'hp', valor: 0.20 },
      desvantagem: { tipo: 'evasao', valor: -0.25 },
      descricao: 'Defesa impenetrável'
    },
    [ELEMENTOS.VENTO]: {
      nome: 'Tempestade de Areia',
      vantagem1: { tipo: 'evasao', valor: 0.15 },
      vantagem2: { tipo: 'evasao_inimigo', valor: -0.20 },
      desvantagem: { tipo: 'dano', valor: -0.10 },
      descricao: 'Areia em turbilhão cega inimigos'
    },
    [ELEMENTOS.ELETRICIDADE]: {
      nome: 'Campo Magnético',
      vantagem1: { tipo: 'resistencia', valor: 0.25 },
      vantagem2: { tipo: 'dano_inimigo', valor: -0.15 },
      desvantagem: { tipo: 'energia', valor: 0.15 },
      descricao: 'Minerais magnetizados repelem ataques'
    },
    [ELEMENTOS.LUZ]: {
      nome: 'Cristais Brilhantes',
      vantagem1: { tipo: 'resistencia', valor: 0.20 },
      vantagem2: { tipo: 'hp', valor: 0.15 },
      desvantagem: { tipo: 'evasao', valor: -0.15 },
      descricao: 'Cristais refletem luz intensamente'
    },
    [ELEMENTOS.SOMBRA]: {
      nome: 'Tumba de Pedra',
      vantagem1: { tipo: 'resistencia', valor: 0.25 },
      vantagem2: { tipo: 'roubo_vida', valor: 0.15 },
      desvantagem: { tipo: 'energia', valor: -0.15 },
      descricao: 'Rocha corrompida que drena'
    },
    [ELEMENTOS.VOID]: {
      nome: 'Gravidade Esmagadora',
      vantagem1: { tipo: 'dano', valor: 0.28 },
      vantagem2: { tipo: 'evasao_inimigo', valor: -0.30 },
      desvantagem: { tipo: 'evasao', valor: -0.30 },
      descricao: 'Gravidade distorcida esmaga'
    },
    [ELEMENTOS.AETHER]: {
      nome: 'Rocha Eterna',
      vantagem1: { tipo: 'resistencia', valor: 0.30 },
      vantagem2: { tipo: 'hp', valor: 0.25 },
      desvantagem: { tipo: 'evasao', valor: -0.15 },
      descricao: 'Pedra indestrutível da criação'
    }
  },

  // ========== VENTO (Principal) ==========
  [ELEMENTOS.VENTO]: {
    [ELEMENTOS.FOGO]: {
      nome: 'Inferno Ventoso',
      vantagem1: { tipo: 'dano', valor: 0.20 },
      vantagem2: { tipo: 'resistencia_inimigo', valor: -0.15 },
      desvantagem: { tipo: 'resistencia', valor: -0.15 },
      descricao: 'Ventos espalham fogo'
    },
    [ELEMENTOS.AGUA]: {
      nome: 'Ciclone Úmido',
      vantagem1: { tipo: 'dano', valor: 0.15 },
      vantagem2: { tipo: 'evasao', valor: 0.20 },
      desvantagem: null,
      descricao: 'Tempestade aquática ágil'
    },
    [ELEMENTOS.TERRA]: {
      nome: 'Ventania Abrasiva',
      vantagem1: { tipo: 'dano', valor: 0.15 },
      vantagem2: { tipo: 'evasao', valor: 0.15 },
      desvantagem: { tipo: 'resistencia', valor: -0.10 },
      descricao: 'Areia e detritos voam'
    },
    [ELEMENTOS.VENTO]: {
      nome: 'Furacão Supremo',
      vantagem1: { tipo: 'dano', valor: 0.20 },
      vantagem2: { tipo: 'evasao', valor: 0.30 },
      desvantagem: { tipo: 'resistencia', valor: -0.15 },
      descricao: 'Ventos devastadores'
    },
    [ELEMENTOS.ELETRICIDADE]: {
      nome: 'Relâmpago Veloz',
      vantagem1: { tipo: 'dano', valor: 0.25 },
      vantagem2: { tipo: 'evasao', valor: 0.20 },
      desvantagem: { tipo: 'energia', valor: 0.15 },
      descricao: 'Velocidade do raio'
    },
    [ELEMENTOS.LUZ]: {
      nome: 'Brisa Celestial',
      vantagem1: { tipo: 'evasao', valor: 0.25 },
      vantagem2: { tipo: 'cura', valor: 0.15 },
      desvantagem: { tipo: 'dano', valor: -0.10 },
      descricao: 'Vento purificador'
    },
    [ELEMENTOS.SOMBRA]: {
      nome: 'Sussurro das Trevas',
      vantagem1: { tipo: 'evasao', valor: 0.30 },
      vantagem2: { tipo: 'roubo_vida', valor: 0.15 },
      desvantagem: { tipo: 'resistencia', valor: -0.20 },
      descricao: 'Ventos silenciosos ocultam'
    },
    [ELEMENTOS.VOID]: {
      nome: 'Vácuo Absoluto',
      vantagem1: { tipo: 'dano', valor: 0.30 },
      vantagem2: { tipo: 'resistencia_inimigo', valor: -0.25 },
      desvantagem: { tipo: 'hp', valor: -0.20 },
      descricao: 'Vazio que anula tudo'
    },
    [ELEMENTOS.AETHER]: {
      nome: 'Sopro Primordial',
      vantagem1: { tipo: 'evasao', valor: 0.35 },
      vantagem2: { tipo: 'energia', valor: 0.20 },
      desvantagem: null,
      descricao: 'Vento da criação'
    }
  },

  // ========== ELETRICIDADE (Principal) ==========
  [ELEMENTOS.ELETRICIDADE]: {
    [ELEMENTOS.FOGO]: {
      nome: 'Descarga Flamejante',
      vantagem1: { tipo: 'dano', valor: 0.22 },
      vantagem2: { tipo: 'energia_inimigo', valor: -0.15 },
      desvantagem: { tipo: 'energia', valor: 0.15 },
      descricao: 'Raios incandescentes'
    },
    [ELEMENTOS.AGUA]: {
      nome: 'Choque Condutor',
      vantagem1: { tipo: 'dano', valor: 0.28 },
      vantagem2: { tipo: 'energia_inimigo', valor: -0.25 },
      desvantagem: { tipo: 'resistencia', valor: -0.15 },
      descricao: 'Eletricidade conduzida pela água'
    },
    [ELEMENTOS.TERRA]: {
      nome: 'Pulso Magnético',
      vantagem1: { tipo: 'resistencia', valor: 0.20 },
      vantagem2: { tipo: 'energia_inimigo', valor: -0.20 },
      desvantagem: { tipo: 'evasao', valor: -0.10 },
      descricao: 'Campo eletromagnético'
    },
    [ELEMENTOS.VENTO]: {
      nome: 'Tempestade Elétrica',
      vantagem1: { tipo: 'dano', valor: 0.25 },
      vantagem2: { tipo: 'evasao', valor: 0.15 },
      desvantagem: { tipo: 'energia', valor: 0.10 },
      descricao: 'Raios velozes'
    },
    [ELEMENTOS.ELETRICIDADE]: {
      nome: 'Sobrecarga',
      vantagem1: { tipo: 'dano', valor: 0.30 },
      vantagem2: { tipo: 'energia', valor: 0.25 },
      desvantagem: { tipo: 'hp', valor: -0.10 },
      descricao: 'Poder elétrico extremo'
    },
    [ELEMENTOS.LUZ]: {
      nome: 'Raio Divino',
      vantagem1: { tipo: 'dano', valor: 0.25 },
      vantagem2: { tipo: 'energia', valor: 0.15 },
      desvantagem: null,
      descricao: 'Raio celestial preciso'
    },
    [ELEMENTOS.SOMBRA]: {
      nome: 'Descarga Sombria',
      vantagem1: { tipo: 'dano', valor: 0.20 },
      vantagem2: { tipo: 'energia_inimigo', valor: -0.25 },
      desvantagem: { tipo: 'resistencia', valor: -0.10 },
      descricao: 'Eletricidade corrompida'
    },
    [ELEMENTOS.VOID]: {
      nome: 'Colapso Elétrico',
      vantagem1: { tipo: 'dano', valor: 0.32 },
      vantagem2: { tipo: 'energia_inimigo', valor: -0.35 },
      desvantagem: { tipo: 'energia', valor: -0.25 },
      descricao: 'Sobrecarga que anula energia'
    },
    [ELEMENTOS.AETHER]: {
      nome: 'Corrente Primordial',
      vantagem1: { tipo: 'dano', valor: 0.28 },
      vantagem2: { tipo: 'energia', valor: 0.30 },
      desvantagem: null,
      descricao: 'Eletricidade da criação'
    }
  },

  // ========== LUZ (Principal) ==========
  [ELEMENTOS.LUZ]: {
    [ELEMENTOS.FOGO]: {
      nome: 'Chama Sagrada',
      vantagem1: { tipo: 'dano', valor: 0.22 },
      vantagem2: { tipo: 'cura', valor: 0.15 },
      desvantagem: null,
      descricao: 'Fogo purificador'
    },
    [ELEMENTOS.AGUA]: {
      nome: 'Bênção Aquática',
      vantagem1: { tipo: 'cura', valor: 0.30 },
      vantagem2: { tipo: 'resistencia', valor: 0.20 },
      desvantagem: { tipo: 'dano', valor: -0.20 },
      descricao: 'Água sagrada curativa'
    },
    [ELEMENTOS.TERRA]: {
      nome: 'Bastião Luminoso',
      vantagem1: { tipo: 'resistencia', valor: 0.25 },
      vantagem2: { tipo: 'cura', valor: 0.20 },
      desvantagem: { tipo: 'evasao', valor: -0.15 },
      descricao: 'Fortaleza brilhante'
    },
    [ELEMENTOS.VENTO]: {
      nome: 'Aurora Celestial',
      vantagem1: { tipo: 'evasao', valor: 0.25 },
      vantagem2: { tipo: 'cura', valor: 0.20 },
      desvantagem: { tipo: 'dano', valor: -0.10 },
      descricao: 'Vento luminoso'
    },
    [ELEMENTOS.ELETRICIDADE]: {
      nome: 'Julgamento Divino',
      vantagem1: { tipo: 'dano', valor: 0.28 },
      vantagem2: { tipo: 'energia', valor: 0.15 },
      desvantagem: null,
      descricao: 'Raio celestial devastador'
    },
    [ELEMENTOS.LUZ]: {
      nome: 'Radiância Suprema',
      vantagem1: { tipo: 'dano', valor: 0.20 },
      vantagem2: { tipo: 'cura', valor: 0.30 },
      desvantagem: null,
      descricao: 'Luz absoluta purificadora'
    },
    [ELEMENTOS.SOMBRA]: {
      nome: 'Eclipse Total',
      vantagem1: { tipo: 'dano', valor: 0.40 },
      vantagem2: { tipo: 'resistencia_inimigo', valor: -0.30 },
      desvantagem: { tipo: 'resistencia', valor: -0.25 },
      descricao: 'Opostos em conflito caótico'
    },
    [ELEMENTOS.VOID]: {
      nome: 'Purificação do Vazio',
      vantagem1: { tipo: 'dano', valor: 0.30 },
      vantagem2: { tipo: 'resistencia_inimigo', valor: -0.25 },
      desvantagem: { tipo: 'energia', valor: -0.10 },
      descricao: 'Luz que expõe o vazio'
    },
    [ELEMENTOS.AETHER]: {
      nome: 'Luz da Criação',
      vantagem1: { tipo: 'dano', valor: 0.25 },
      vantagem2: { tipo: 'cura', valor: 0.30 },
      desvantagem: null,
      descricao: 'Luz primordial restauradora'
    }
  },

  // ========== SOMBRA (Principal) ==========
  [ELEMENTOS.SOMBRA]: {
    [ELEMENTOS.FOGO]: {
      nome: 'Chamas Amaldiçoadas',
      vantagem1: { tipo: 'dano', valor: 0.18 },
      vantagem2: { tipo: 'roubo_vida', valor: 0.20 },
      desvantagem: { tipo: 'hp', valor: -0.15 },
      descricao: 'Fogo sombrio que drena'
    },
    [ELEMENTOS.AGUA]: {
      nome: 'Pântano Maldito',
      vantagem1: { tipo: 'dano', valor: 0.12 },
      vantagem2: { tipo: 'roubo_vida', valor: 0.25 },
      desvantagem: { tipo: 'energia', valor: -0.15 },
      descricao: 'Águas corrompidas'
    },
    [ELEMENTOS.TERRA]: {
      nome: 'Cripta Sombria',
      vantagem1: { tipo: 'resistencia', valor: 0.20 },
      vantagem2: { tipo: 'roubo_vida', valor: 0.25 },
      desvantagem: { tipo: 'hp', valor: -0.20 },
      descricao: 'Fortaleza morta-viva'
    },
    [ELEMENTOS.VENTO]: {
      nome: 'Vento Fantasma',
      vantagem1: { tipo: 'evasao', valor: 0.30 },
      vantagem2: { tipo: 'roubo_vida', valor: 0.20 },
      desvantagem: { tipo: 'resistencia', valor: -0.20 },
      descricao: 'Invisibilidade suprema'
    },
    [ELEMENTOS.ELETRICIDADE]: {
      nome: 'Pulso Sombrio',
      vantagem1: { tipo: 'dano', valor: 0.20 },
      vantagem2: { tipo: 'energia_inimigo', valor: -0.30 },
      desvantagem: { tipo: 'energia', valor: -0.20 },
      descricao: 'Eletricidade corrompida'
    },
    [ELEMENTOS.LUZ]: {
      nome: 'Crepúsculo Caótico',
      vantagem1: { tipo: 'dano', valor: 0.45 },
      vantagem2: { tipo: 'resistencia_inimigo', valor: -0.30 },
      desvantagem: { tipo: 'resistencia', valor: -0.30 },
      descricao: 'Opostos geram caos'
    },
    [ELEMENTOS.SOMBRA]: {
      nome: 'Escuridão Absoluta',
      vantagem1: { tipo: 'dano', valor: 0.25 },
      vantagem2: { tipo: 'roubo_vida', valor: 0.35 },
      desvantagem: { tipo: 'hp', valor: -0.20 },
      descricao: 'Trevas totais que drenam'
    },
    [ELEMENTOS.VOID]: {
      nome: 'Abismo das Almas',
      vantagem1: { tipo: 'dano', valor: 0.35 },
      vantagem2: { tipo: 'roubo_vida', valor: 0.40 },
      desvantagem: { tipo: 'hp', valor: -0.25 },
      descricao: 'Vazio sombrio consumidor'
    },
    [ELEMENTOS.AETHER]: {
      nome: 'Dualidade Primordial',
      vantagem1: { tipo: 'dano', valor: 0.25 },
      vantagem2: { tipo: 'roubo_vida', valor: 0.25 },
      desvantagem: { tipo: 'evasao', valor: -0.10 },
      descricao: 'Balanço entre luz e sombra'
    }
  },

  // ========== VOID (Principal) ==========
  [ELEMENTOS.VOID]: {
    [ELEMENTOS.FOGO]: {
      nome: 'Incineração Existencial',
      vantagem1: { tipo: 'dano', valor: 0.32 },
      vantagem2: { tipo: 'resistencia_inimigo', valor: -0.20 },
      desvantagem: { tipo: 'hp', valor: -0.20 },
      descricao: 'Fogo que consome existência'
    },
    [ELEMENTOS.AGUA]: {
      nome: 'Mar do Esquecimento',
      vantagem1: { tipo: 'dano', valor: 0.25 },
      vantagem2: { tipo: 'energia_inimigo', valor: -0.35 },
      desvantagem: { tipo: 'energia', valor: -0.30 },
      descricao: 'Águas do vazio'
    },
    [ELEMENTOS.TERRA]: {
      nome: 'Singularidade Gravitacional',
      vantagem1: { tipo: 'dano', valor: 0.30 },
      vantagem2: { tipo: 'evasao_inimigo', valor: -0.35 },
      desvantagem: { tipo: 'evasao', valor: -0.35 },
      descricao: 'Gravidade do vazio'
    },
    [ELEMENTOS.VENTO]: {
      nome: 'Vácuo Perfeito',
      vantagem1: { tipo: 'dano', valor: 0.35 },
      vantagem2: { tipo: 'resistencia_inimigo', valor: -0.30 },
      desvantagem: { tipo: 'hp', valor: -0.25 },
      descricao: 'Ausência total'
    },
    [ELEMENTOS.ELETRICIDADE]: {
      nome: 'Entropia Elétrica',
      vantagem1: { tipo: 'dano', valor: 0.34 },
      vantagem2: { tipo: 'energia_inimigo', valor: -0.40 },
      desvantagem: { tipo: 'energia', valor: -0.30 },
      descricao: 'Colapso energético'
    },
    [ELEMENTOS.LUZ]: {
      nome: 'Horizonte de Eventos',
      vantagem1: { tipo: 'dano', valor: 0.35 },
      vantagem2: { tipo: 'resistencia_inimigo', valor: -0.35 },
      desvantagem: { tipo: 'resistencia', valor: -0.12 },
      descricao: 'Luz sendo absorvida'
    },
    [ELEMENTOS.SOMBRA]: {
      nome: 'Fim da Existência',
      vantagem1: { tipo: 'dano', valor: 0.38 },
      vantagem2: { tipo: 'roubo_vida', valor: 0.35 },
      desvantagem: { tipo: 'hp', valor: -0.30 },
      descricao: 'Vazio absoluto'
    },
    [ELEMENTOS.VOID]: {
      nome: 'Colapso do Vazio',
      vantagem1: { tipo: 'dano', valor: 0.45 },
      vantagem2: { tipo: 'resistencia_inimigo', valor: -0.40 },
      desvantagem: { tipo: 'hp', valor: -0.35 },
      descricao: 'Vazio consumindo vazio'
    },
    [ELEMENTOS.AETHER]: {
      nome: 'Paradoxo Dimensional',
      vantagem1: { tipo: 'dano', valor: 0.50 },
      vantagem2: { tipo: 'resistencia_inimigo', valor: -0.40 },
      desvantagem: { tipo: 'hp', valor: -0.40 },
      descricao: 'Opostos dimensionais'
    }
  },

  // ========== AETHER (Principal) ==========
  [ELEMENTOS.AETHER]: {
    [ELEMENTOS.FOGO]: {
      nome: 'Chama da Criação',
      vantagem1: { tipo: 'dano', valor: 0.28 },
      vantagem2: { tipo: 'cura', valor: 0.20 },
      desvantagem: null,
      descricao: 'Fogo primordial'
    },
    [ELEMENTOS.AGUA]: {
      nome: 'Nascente Eterna',
      vantagem1: { tipo: 'cura', valor: 0.35 },
      vantagem2: { tipo: 'hp', valor: 0.20 },
      desvantagem: { tipo: 'dano', valor: -0.25 },
      descricao: 'Água da criação'
    },
    [ELEMENTOS.TERRA]: {
      nome: 'Fundação Primordial',
      vantagem1: { tipo: 'resistencia', valor: 0.30 },
      vantagem2: { tipo: 'hp', valor: 0.30 },
      desvantagem: { tipo: 'evasao', valor: -0.20 },
      descricao: 'Rocha indestrutível'
    },
    [ELEMENTOS.VENTO]: {
      nome: 'Sopro da Vida',
      vantagem1: { tipo: 'evasao', valor: 0.35 },
      vantagem2: { tipo: 'energia', valor: 0.25 },
      desvantagem: null,
      descricao: 'Vento primordial'
    },
    [ELEMENTOS.ELETRICIDADE]: {
      nome: 'Faísca Divina',
      vantagem1: { tipo: 'dano', valor: 0.25 },
      vantagem2: { tipo: 'energia', valor: 0.30 },
      desvantagem: null,
      descricao: 'Eletricidade da criação'
    },
    [ELEMENTOS.LUZ]: {
      nome: 'Gênese Radiante',
      vantagem1: { tipo: 'dano', valor: 0.28 },
      vantagem2: { tipo: 'cura', valor: 0.35 },
      desvantagem: null,
      descricao: 'Luz e essência primordial'
    },
    [ELEMENTOS.SOMBRA]: {
      nome: 'Equilíbrio Primordial',
      vantagem1: { tipo: 'dano', valor: 0.28 },
      vantagem2: { tipo: 'roubo_vida', valor: 0.25 },
      desvantagem: { tipo: 'resistencia', valor: -0.10 },
      descricao: 'Balanço primordial'
    },
    [ELEMENTOS.VOID]: {
      nome: 'Ruptura Dimensional',
      vantagem1: { tipo: 'dano', valor: 0.50 },
      vantagem2: { tipo: 'resistencia_inimigo', valor: -0.40 },
      desvantagem: { tipo: 'hp', valor: -0.35 },
      descricao: 'Criação vs Destruição'
    },
    [ELEMENTOS.AETHER]: {
      nome: 'Transcendência',
      vantagem1: { tipo: 'dano', valor: 0.25 },
      vantagem2: { tipo: 'cura', valor: 0.30 },
      desvantagem: null,
      descricao: 'Essência pura da criação'
    }
  }
};

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Obtém a sinergia entre dois elementos
 */
export function getSynergy(principal, suporte) {
  if (!SYNERGIES[principal]) {
    console.warn(`Elemento principal '${principal}' não encontrado`);
    return null;
  }

  if (!SYNERGIES[principal][suporte]) {
    console.warn(`Sinergia entre '${principal}' e '${suporte}' não encontrada`);
    return null;
  }

  return {
    ...SYNERGIES[principal][suporte],
    elementos: { principal, suporte }
  };
}

/**
 * Verifica se uma sinergia é perfeita (sem desvantagem)
 */
export function isSinergiaPerfeita(principal, suporte) {
  const sinergia = getSynergy(principal, suporte);
  return sinergia && !sinergia.desvantagem;
}

/**
 * Obtém todas as sinergias possíveis para um elemento
 */
export function getAllSynergiesFor(elemento) {
  if (!SYNERGIES[elemento]) return [];

  return Object.keys(SYNERGIES[elemento]).map(suporte => ({
    suporte,
    ...SYNERGIES[elemento][suporte]
  }));
}

/**
 * Formata sinergia para exibição nos logs
 * @returns {string} Texto formatado: "✨ Nome (+X% Dano, +Y% HP | -Z% Energia)"
 */
export function formatarSinergiaParaLog(sinergia) {
  if (!sinergia) return '';

  const vantagens = [];
  const desvantagens = [];

  // Formatar vantagem 1
  if (sinergia.vantagem1) {
    vantagens.push(formatarModificador(sinergia.vantagem1.tipo, sinergia.vantagem1.valor));
  }

  // Formatar vantagem 2
  if (sinergia.vantagem2) {
    vantagens.push(formatarModificador(sinergia.vantagem2.tipo, sinergia.vantagem2.valor));
  }

  // Formatar desvantagem
  if (sinergia.desvantagem) {
    desvantagens.push(formatarModificador(sinergia.desvantagem.tipo, sinergia.desvantagem.valor));
  }

  const vantagensTexto = vantagens.join(', ');
  const desvantagensTexto = desvantagens.length > 0 ? ` | ${desvantagens.join(', ')}` : '';

  return `✨ ${sinergia.nome} (${vantagensTexto}${desvantagensTexto})`;
}

/**
 * Formata um modificador individual
 */
function formatarModificador(tipo, valor) {
  const porcentagem = Math.floor(Math.abs(valor) * 100);
  const sinal = valor >= 0 ? '+' : '';

  const nomes = {
    dano: 'Dano',
    energia: 'Energia Max',
    evasao: 'Evasão',
    hp: 'HP Max',
    resistencia: 'Resistência',
    roubo_vida: 'Roubo Vida',
    cura: 'Cura',
    energia_inimigo: 'Energia Inimiga',
    dano_inimigo: 'Dano Inimigo',
    evasao_inimigo: 'Evasão Inimiga',
    resistencia_inimigo: 'Resist. Inimiga',
    energia: 'Custo Energia'
  };

  return `${sinal}${porcentagem}% ${nomes[tipo] || tipo}`;
}

/**
 * Retorna vantagens e desvantagens formatadas da sinergia
 * Para exibição amigável na UI
 */
export function formatarVantagensDesvantagens(sinergia) {
  if (!sinergia) return { vantagens: [], desvantagens: [] };

  const vantagens = [];
  const desvantagens = [];

  if (sinergia.vantagem1) {
    const porcentagem = Math.floor(Math.abs(sinergia.vantagem1.valor) * 100);
    const sinal = sinergia.vantagem1.valor >= 0 ? '+' : '';
    const nomes = {
      dano: 'Dano',
      energia: 'Energia Máxima',
      evasao: 'Evasão',
      hp: 'HP Máximo',
      resistencia: 'Resistência',
      roubo_vida: 'Roubo de Vida',
      cura: 'Cura',
      energia_inimigo: 'Energia do Inimigo',
      dano_inimigo: 'Dano do Inimigo',
      evasao_inimigo: 'Evasão do Inimigo',
      resistencia_inimigo: 'Resistência do Inimigo'
    };
    vantagens.push({
      texto: `${sinal}${porcentagem}% ${nomes[sinergia.vantagem1.tipo] || sinergia.vantagem1.tipo}`,
      isPositive: sinergia.vantagem1.valor >= 0
    });
  }

  if (sinergia.vantagem2) {
    const porcentagem = Math.floor(Math.abs(sinergia.vantagem2.valor) * 100);
    const sinal = sinergia.vantagem2.valor >= 0 ? '+' : '';
    const nomes = {
      dano: 'Dano',
      energia: 'Energia Máxima',
      evasao: 'Evasão',
      hp: 'HP Máximo',
      resistencia: 'Resistência',
      roubo_vida: 'Roubo de Vida',
      cura: 'Cura',
      energia_inimigo: 'Energia do Inimigo',
      dano_inimigo: 'Dano do Inimigo',
      evasao_inimigo: 'Evasão do Inimigo',
      resistencia_inimigo: 'Resistência do Inimigo'
    };
    vantagens.push({
      texto: `${sinal}${porcentagem}% ${nomes[sinergia.vantagem2.tipo] || sinergia.vantagem2.tipo}`,
      isPositive: sinergia.vantagem2.valor >= 0
    });
  }

  if (sinergia.desvantagem) {
    const porcentagem = Math.floor(Math.abs(sinergia.desvantagem.valor) * 100);
    const sinal = sinergia.desvantagem.valor >= 0 ? '+' : '';
    const nomes = {
      dano: 'Dano',
      energia: 'Energia Máxima',
      evasao: 'Evasão',
      hp: 'HP Máximo',
      resistencia: 'Resistência',
      roubo_vida: 'Roubo de Vida',
      cura: 'Cura',
      energia_inimigo: 'Energia do Inimigo',
      dano_inimigo: 'Dano do Inimigo',
      evasao_inimigo: 'Evasão do Inimigo',
      resistencia_inimigo: 'Resistência do Inimigo'
    };
    desvantagens.push({
      texto: `${sinal}${porcentagem}% ${nomes[sinergia.desvantagem.tipo] || sinergia.desvantagem.tipo}`,
      isPositive: sinergia.desvantagem.valor >= 0
    });
  }

  return { vantagens, desvantagens };
}

export default {
  SYNERGIES,
  getSynergy,
  isSinergiaPerfeita,
  getAllSynergiesFor,
  formatarSinergiaParaLog
};
