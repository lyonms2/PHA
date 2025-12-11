// ==================== SISTEMA DE SINERGIAS 9×9 ====================
// Sistema modular de sinergias entre Avatar Principal e Avatar Suporte
// Cada combinação de elementos gera bônus e desvantagens únicas

import { ELEMENTOS } from '@/app/avatares/sistemas/elementalSystem';

/**
 * ESTRUTURA DE SINERGIA:
 * {
 *   nome: string,           // Nome da sinergia
 *   bonus: object,          // Bônus fornecido
 *   desvantagem: object,    // Custo/desvantagem
 *   descricao: string       // Descrição temática
 * }
 */

// ==================== MATRIZ DE SINERGIAS 9×9 ====================
export const SYNERGIES = {

  // ========== FOGO (Principal) ==========
  [ELEMENTOS.FOGO]: {
    [ELEMENTOS.FOGO]: {
      nome: 'Combustão Intensa',
      bonus: { dano: 0.25, critico_chance: 0.10 },
      desvantagem: { custo_energia: 0.20, recebe_dano: 0.10 },
      descricao: 'Chamas se alimentam de chamas, aumentando poder destrutivo mas consumindo mais energia'
    },
    [ELEMENTOS.AGUA]: {
      nome: 'Névoa de Vapor',
      bonus: { evasao_inimiga: -0.15, dot_chance: 0.20 },
      desvantagem: { dano: -0.15 },
      descricao: 'Vapor escaldante reduz visão inimiga mas atenua o calor das chamas'
    },
    [ELEMENTOS.TERRA]: {
      nome: 'Lava Derretida',
      bonus: { dano: 0.15, dot_dano: 0.30 },
      desvantagem: { agilidade: -0.10 },
      descricao: 'Rocha derretida causa queimaduras devastadoras mas reduz mobilidade'
    },
    [ELEMENTOS.VENTO]: {
      nome: 'Tempestade Flamejante',
      bonus: { dano: 0.20, alcance: 'area', dot_spread: true },
      desvantagem: { controle: -0.15 },
      descricao: 'Ventos espalham fogo descontroladamente por toda área de batalha'
    },
    [ELEMENTOS.ELETRICIDADE]: {
      nome: 'Plasma Incandescente',
      bonus: { dano: 0.18, paralisia_chance: 0.25 },
      desvantagem: { custo_energia: 0.15 },
      descricao: 'Calor extremo ioniza o ar, criando descargas elétricas paralisantes'
    },
    [ELEMENTOS.LUZ]: {
      nome: 'Chama Solar',
      bonus: { dano: 0.22, cura_aliado: 0.10 },
      desvantagem: {},
      descricao: 'Fogo purificador que queima inimigos e restaura aliados'
    },
    [ELEMENTOS.SOMBRA]: {
      nome: 'Fogo Fantasma',
      bonus: { dano: 0.15, ignora_defesa: 0.25, furtividade: 0.20 },
      desvantagem: { acuracia: -0.10 },
      descricao: 'Chamas negras que queimam a alma, ignorando armaduras físicas'
    },
    [ELEMENTOS.VOID]: {
      nome: 'Incineração do Vazio',
      bonus: { dano: 0.30, anula_buffs: true },
      desvantagem: { hp_max: -0.15 },
      descricao: 'Fogo que consome tudo, inclusive a vitalidade do usuário'
    },
    [ELEMENTOS.AETHER]: {
      nome: 'Chama Primordial',
      bonus: { dano: 0.28, purifica_debuffs: true, energia_regen: 0.15 },
      desvantagem: {},
      descricao: 'Fogo da criação, purificador e restaurador de energia vital'
    }
  },

  // ========== ÁGUA (Principal) ==========
  [ELEMENTOS.AGUA]: {
    [ELEMENTOS.FOGO]: {
      nome: 'Neblina Quente',
      bonus: { evasao: 0.15, confusao_inimiga: 0.20 },
      desvantagem: { dano: -0.10 },
      descricao: 'Vapor denso confunde inimigos mas reduz impacto dos ataques'
    },
    [ELEMENTOS.AGUA]: {
      nome: 'Maremoto',
      bonus: { dano: 0.20, empurra_inimigo: true, cura: 0.15 },
      desvantagem: { agilidade: -0.15 },
      descricao: 'Ondas massivas que curam e repelem, mas dificultam movimento'
    },
    [ELEMENTOS.TERRA]: {
      nome: 'Pântano Espesso',
      bonus: { slow_inimigo: 0.40, resistencia: 0.15 },
      desvantagem: { agilidade: -0.20 },
      descricao: 'Lama viscosa prende todos no campo de batalha'
    },
    [ELEMENTOS.VENTO]: {
      nome: 'Tempestade Gélida',
      bonus: { dano: 0.18, slow_inimigo: 0.25, evasao: 0.10 },
      desvantagem: {},
      descricao: 'Chuva congelante que reduz velocidade e aumenta mobilidade aliada'
    },
    [ELEMENTOS.ELETRICIDADE]: {
      nome: 'Condução Elétrica',
      bonus: { dano: 0.25, atordoa: true, alcance: 'corrente' },
      desvantagem: { recebe_dano: 0.15 },
      descricao: 'Água conduz eletricidade para múltiplos alvos, mas também afeta o usuário'
    },
    [ELEMENTOS.LUZ]: {
      nome: 'Chuva Abençoada',
      bonus: { cura: 0.25, purifica_debuffs: true, resistencia: 0.10 },
      desvantagem: { dano: -0.20 },
      descricao: 'Água sagrada que purifica e cura, mas perde poder ofensivo'
    },
    [ELEMENTOS.SOMBRA]: {
      nome: 'Marés Sombrias',
      bonus: { dano: 0.15, drena_vida: 0.20, furtividade: 0.25 },
      desvantagem: { cura: -100 },
      descricao: 'Águas corrompidas que drenam vida mas não podem curar'
    },
    [ELEMENTOS.VOID]: {
      nome: 'Abismo Líquido',
      bonus: { dano: 0.22, anula_energia: 0.30, slow_inimigo: 0.50 },
      desvantagem: { energia_regen: -0.30 },
      descricao: 'Água do vazio que drena energia de todos'
    },
    [ELEMENTOS.AETHER]: {
      nome: 'Fonte da Vida',
      bonus: { cura: 0.35, regen_continua: 0.10, remove_exaustao: true },
      desvantagem: { dano: -0.25 },
      descricao: 'Água primordial com poder restaurador supremo, mas sem letalidade'
    }
  },

  // ========== TERRA (Principal) ==========
  [ELEMENTOS.TERRA]: {
    [ELEMENTOS.FOGO]: {
      nome: 'Magma Vulcânico',
      bonus: { dano: 0.20, dot_dano: 0.35, area_perigo: true },
      desvantagem: { agilidade: -0.15 },
      descricao: 'Rocha derretida cria zona de perigo contínuo mas reduz mobilidade'
    },
    [ELEMENTOS.AGUA]: {
      nome: 'Lodaçal',
      bonus: { slow_inimigo: 0.35, resistencia: 0.20 },
      desvantagem: { agilidade: -0.25, evasao: -0.15 },
      descricao: 'Lama pesada que prende a todos, dificultando movimento'
    },
    [ELEMENTOS.TERRA]: {
      nome: 'Fortaleza Rochosa',
      bonus: { defesa: 0.30, resistencia: 0.25, reflecao_dano: 0.15 },
      desvantagem: { agilidade: -0.30, evasao: -0.20 },
      descricao: 'Defesa impenetrável que sacrifica completamente a mobilidade'
    },
    [ELEMENTOS.VENTO]: {
      nome: 'Tempestade de Areia',
      bonus: { evasao: 0.20, cegueira_inimiga: 0.30, dano_dot: 0.15 },
      desvantagem: { acuracia: -0.15 },
      descricao: 'Areia em turbilhão cega inimigos mas também dificulta visão aliada'
    },
    [ELEMENTOS.ELETRICIDADE]: {
      nome: 'Campo Magnético',
      bonus: { defesa: 0.20, paralisia_chance: 0.20, reflecao_dano: 0.20 },
      desvantagem: { custo_energia: 0.20 },
      descricao: 'Minerais magnetizados repelem ataques e paralisam ao contato'
    },
    [ELEMENTOS.LUZ]: {
      nome: 'Cristais Brilhantes',
      bonus: { defesa: 0.18, reflete_luz: true, bonus_luz: 0.15 },
      desvantagem: { furtividade: -100 },
      descricao: 'Cristais refletem luz intensamente, revelando posição aliada'
    },
    [ELEMENTOS.SOMBRA]: {
      nome: 'Tumba de Pedra',
      bonus: { defesa: 0.25, drena_vida: 0.15, slow_inimigo: 0.20 },
      desvantagem: { cura: -0.50 },
      descricao: 'Rocha corrompida que aprisiona e drena, mas dificulta cura'
    },
    [ELEMENTOS.VOID]: {
      nome: 'Gravidade Esmagadora',
      bonus: { dano: 0.25, stun: true, anula_evasao: true },
      desvantagem: { agilidade: -0.40, custo_energia: 0.25 },
      descricao: 'Gravidade distorcida esmaga inimigos mas também afeta o usuário'
    },
    [ELEMENTOS.AETHER]: {
      nome: 'Rocha Eterna',
      bonus: { defesa: 0.28, hp_max: 0.20, resistencia_status: 0.50 },
      desvantagem: { agilidade: -0.20 },
      descricao: 'Pedra indestrutível da criação, imune a debuffs mas lenta'
    }
  },

  // ========== VENTO (Principal) ==========
  [ELEMENTOS.VENTO]: {
    [ELEMENTOS.FOGO]: {
      nome: 'Inferno Ventoso',
      bonus: { dano: 0.22, alcance: 'area', dot_spread: true },
      desvantagem: { controle: -0.20 },
      descricao: 'Ventos espalham fogo incontrolavelmente por toda área'
    },
    [ELEMENTOS.AGUA]: {
      nome: 'Ciclone Úmido',
      bonus: { dano: 0.18, evasao: 0.15, slow_inimigo: 0.20 },
      desvantagem: {},
      descricao: 'Tempestade aquática que aumenta mobilidade e reduz velocidade inimiga'
    },
    [ELEMENTOS.TERRA]: {
      nome: 'Ventania Abrasiva',
      bonus: { dano: 0.20, cegueira_inimiga: 0.25, evasao: 0.10 },
      desvantagem: { acuracia: -0.10 },
      descricao: 'Areia e detritos cegam inimigos mas também reduzem precisão'
    },
    [ELEMENTOS.VENTO]: {
      nome: 'Furacão Supremo',
      bonus: { dano: 0.25, evasao: 0.25, agilidade: 0.20, empurra_inimigo: true },
      desvantagem: { defesa: -0.15 },
      descricao: 'Ventos devastadores que aumentam mobilidade mas reduzem defesas'
    },
    [ELEMENTOS.ELETRICIDADE]: {
      nome: 'Relâmpago Veloz',
      bonus: { dano: 0.28, agilidade: 0.25, critico_chance: 0.15, first_strike: true },
      desvantagem: { custo_energia: 0.20 },
      descricao: 'Velocidade do raio que ataca primeiro, mas consome muita energia'
    },
    [ELEMENTOS.LUZ]: {
      nome: 'Brisa Celestial',
      bonus: { evasao: 0.20, cura: 0.15, remove_debuffs: true },
      desvantagem: { dano: -0.15 },
      descricao: 'Vento purificador que cura e liberta, mas reduz letalidade'
    },
    [ELEMENTOS.SOMBRA]: {
      nome: 'Sussurro das Trevas',
      bonus: { furtividade: 0.40, critico_chance: 0.20, confusao_inimiga: 0.25 },
      desvantagem: { defesa: -0.20 },
      descricao: 'Ventos silenciosos que ocultam e confundem, mas deixam vulnerável'
    },
    [ELEMENTOS.VOID]: {
      nome: 'Vácuo Absoluto',
      bonus: { dano: 0.30, silencio_habilidades: true, anula_evasao: true },
      desvantagem: { hp_max: -0.20, energia_regen: -0.25 },
      descricao: 'Vazio que anula tudo, inclusive recursos do usuário'
    },
    [ELEMENTOS.AETHER]: {
      nome: 'Sopro Primordial',
      bonus: { agilidade: 0.30, energia_regen: 0.25, purifica_tudo: true },
      desvantagem: {},
      descricao: 'Vento da criação que acelera e purifica sem desvantagens'
    }
  },

  // ========== ELETRICIDADE (Principal) ==========
  [ELEMENTOS.ELETRICIDADE]: {
    [ELEMENTOS.FOGO]: {
      nome: 'Descarga Flamejante',
      bonus: { dano: 0.22, paralisia_chance: 0.20, dot_chance: 0.25 },
      desvantagem: { custo_energia: 0.18 },
      descricao: 'Raios incandescentes que queimam e paralisam, consumindo energia'
    },
    [ELEMENTOS.AGUA]: {
      nome: 'Choque Condutor',
      bonus: { dano: 0.30, alcance: 'corrente', atordoa: true },
      desvantagem: { recebe_dano: 0.20 },
      descricao: 'Eletricidade conduzida pela água atinge múltiplos alvos mas também o usuário'
    },
    [ELEMENTOS.TERRA]: {
      nome: 'Pulso Magnético',
      bonus: { paralisia_chance: 0.25, defesa: 0.15, reflecao_dano: 0.20 },
      desvantagem: { agilidade: -0.15 },
      descricao: 'Campo eletromagnético que defende e paralisa, mas reduz mobilidade'
    },
    [ELEMENTOS.VENTO]: {
      nome: 'Tempestade Elétrica',
      bonus: { dano: 0.28, agilidade: 0.20, first_strike: true, alcance: 'area' },
      desvantagem: { controle: -0.15, custo_energia: 0.20 },
      descricao: 'Raios velozes em área, difíceis de controlar'
    },
    [ELEMENTOS.ELETRICIDADE]: {
      nome: 'Sobrecarga',
      bonus: { dano: 0.35, paralisia_chance: 0.30, energia_max: 0.20 },
      desvantagem: { custo_energia: 0.30, hp_max: -0.10 },
      descricao: 'Poder elétrico extremo que aumenta capacidade mas danifica o corpo'
    },
    [ELEMENTOS.LUZ]: {
      nome: 'Raio Divino',
      bonus: { dano: 0.25, acuracia: 0.20, paralisia_chance: 0.20, purifica: true },
      desvantagem: {},
      descricao: 'Raio celestial preciso que paralisa e purifica sem desvantagens'
    },
    [ELEMENTOS.SOMBRA]: {
      nome: 'Descarga Sombria',
      bonus: { dano: 0.22, drena_energia: 0.30, paralisia_chance: 0.25 },
      desvantagem: { cura: -0.50 },
      descricao: 'Eletricidade corrompida que drena energia mas impede cura'
    },
    [ELEMENTOS.VOID]: {
      nome: 'Colapso Elétrico',
      bonus: { dano: 0.32, anula_energia: 0.50, silencio_habilidades: true },
      desvantagem: { energia_max: -0.30, hp_max: -0.15 },
      descricao: 'Sobrecarga que anula energia inimiga mas esgota recursos próprios'
    },
    [ELEMENTOS.AETHER]: {
      nome: 'Corrente Primordial',
      bonus: { dano: 0.26, energia_regen: 0.30, paralisia_chance: 0.20, restaura_energia: true },
      desvantagem: {},
      descricao: 'Eletricidade da criação que energiza enquanto ataca'
    }
  },

  // ========== LUZ (Principal) ==========
  [ELEMENTOS.LUZ]: {
    [ELEMENTOS.FOGO]: {
      nome: 'Chama Sagrada',
      bonus: { dano: 0.24, cura: 0.15, dot_purificador: true },
      desvantagem: {},
      descricao: 'Fogo purificador que queima inimigos e cura aliados simultaneamente'
    },
    [ELEMENTOS.AGUA]: {
      nome: 'Bênção Aquática',
      bonus: { cura: 0.30, purifica_debuffs: true, resistencia: 0.15 },
      desvantagem: { dano: -0.25 },
      descricao: 'Água sagrada com poder curativo supremo mas pouca letalidade'
    },
    [ELEMENTOS.TERRA]: {
      nome: 'Bastião Luminoso',
      bonus: { defesa: 0.25, cura: 0.15, resistencia_status: 0.30 },
      desvantagem: { agilidade: -0.15, furtividade: -100 },
      descricao: 'Fortaleza brilhante que protege e cura mas revela posição'
    },
    [ELEMENTOS.VENTO]: {
      nome: 'Aurora Celestial',
      bonus: { evasao: 0.22, cura: 0.20, purifica_area: true },
      desvantagem: { dano: -0.10 },
      descricao: 'Vento luminoso que purifica toda área, mas com menor poder ofensivo'
    },
    [ELEMENTOS.ELETRICIDADE]: {
      nome: 'Julgamento Divino',
      bonus: { dano: 0.28, acuracia: 0.25, paralisia_chance: 0.20 },
      desvantagem: {},
      descricao: 'Raio celestial devastador e preciso sem desvantagens'
    },
    [ELEMENTOS.LUZ]: {
      nome: 'Radiância Suprema',
      bonus: { dano: 0.20, cura: 0.25, purifica_tudo: true, resistencia_status: 0.40 },
      desvantagem: { furtividade: -100 },
      descricao: 'Luz absoluta que purifica tudo mas revela completamente a posição'
    },
    [ELEMENTOS.SOMBRA]: {
      nome: 'Eclipse Total',
      bonus: { dano: 0.50, anula_todos_buffs: true, caos: true },
      desvantagem: { controle: -0.40, efeitos_aleatorios: true },
      descricao: 'CASO ESPECIAL: Opostos em conflito causam efeitos caóticos devastadores'
    },
    [ELEMENTOS.VOID]: {
      nome: 'Purificação do Vazio',
      bonus: { dano: 0.30, anula_debuffs: true, anula_buffs_inimigos: true },
      desvantagem: { cura: -0.30 },
      descricao: 'Luz que expõe o vazio, anulando todos efeitos mas reduzindo cura'
    },
    [ELEMENTOS.AETHER]: {
      nome: 'Luz da Criação',
      bonus: { dano: 0.25, cura: 0.30, revive_ko: 0.30, energia_full: true },
      desvantagem: {},
      descricao: 'SINERGIA PERFEITA: Luz primordial com poder máximo de restauração'
    }
  },

  // ========== SOMBRA (Principal) ==========
  [ELEMENTOS.SOMBRA]: {
    [ELEMENTOS.FOGO]: {
      nome: 'Chamas Amaldiçoadas',
      bonus: { dano: 0.20, dot_dano: 0.30, drena_vida: 0.15 },
      desvantagem: { cura: -0.50 },
      descricao: 'Fogo sombrio que drena vida mas impede cura'
    },
    [ELEMENTOS.AGUA]: {
      nome: 'Pântano Maldito',
      bonus: { dano: 0.15, slow_inimigo: 0.30, drena_vida: 0.20 },
      desvantagem: { cura: -100, agilidade: -0.15 },
      descricao: 'Águas corrompidas que drenam vida mas impedem completamente a cura'
    },
    [ELEMENTOS.TERRA]: {
      nome: 'Cripta Sombria',
      bonus: { defesa: 0.20, drena_vida: 0.20, slow_inimigo: 0.25 },
      desvantagem: { cura: -0.70, agilidade: -0.20 },
      descricao: 'Fortaleza morta-viva que drena vida mas quase impede cura'
    },
    [ELEMENTOS.VENTO]: {
      nome: 'Vento Fantasma',
      bonus: { furtividade: 0.45, evasao: 0.25, critico_chance: 0.25 },
      desvantagem: { defesa: -0.25, hp_max: -0.10 },
      descricao: 'Invisibilidade suprema que aumenta letalidade mas reduz defesas'
    },
    [ELEMENTOS.ELETRICIDADE]: {
      nome: 'Pulso Sombrio',
      bonus: { dano: 0.24, drena_energia: 0.35, paralisia_chance: 0.20 },
      desvantagem: { energia_regen: -0.25 },
      descricao: 'Eletricidade corrompida que drena energia inimiga mas também a própria'
    },
    [ELEMENTOS.LUZ]: {
      nome: 'Crepúsculo Caótico',
      bonus: { dano: 0.50, anula_tudo: true, efeitos_caoticos: true },
      desvantagem: { controle: -0.50, efeitos_aleatorios: true, hp_max: -0.20 },
      descricao: 'CASO ESPECIAL: Opostos em conflito geram poder caótico incontrolável'
    },
    [ELEMENTOS.SOMBRA]: {
      nome: 'Escuridão Absoluta',
      bonus: { furtividade: 0.50, drena_vida: 0.30, critico_chance: 0.30, ignora_defesa: 0.30 },
      desvantagem: { cura: -100, acuracia: -0.15 },
      descricao: 'Trevas totais que drenam vida mas impedem completamente qualquer cura'
    },
    [ELEMENTOS.VOID]: {
      nome: 'Abismo das Almas',
      bonus: { dano: 0.35, drena_vida: 0.40, drena_energia: 0.40, anula_tudo: true },
      desvantagem: { hp_max: -0.25, cura: -100, energia_regen: -0.40 },
      descricao: 'Vazio sombrio que consome tudo, inclusive recursos do usuário'
    },
    [ELEMENTOS.AETHER]: {
      nome: 'Dualidade Primordial',
      bonus: { dano: 0.28, drena_vida: 0.25, remove_debuffs: true },
      desvantagem: { cura: -0.30 },
      descricao: 'Sombra primordial que drena mas também purifica debuffs'
    }
  },

  // ========== VOID (Principal) ==========
  [ELEMENTOS.VOID]: {
    [ELEMENTOS.FOGO]: {
      nome: 'Incineração Existencial',
      bonus: { dano: 0.32, anula_buffs: true, dot_ignora_defesa: true },
      desvantagem: { hp_max: -0.20, custo_energia: 0.20 },
      descricao: 'Fogo que consome existência, anulando proteções mas esgotando o usuário'
    },
    [ELEMENTOS.AGUA]: {
      nome: 'Mar do Esquecimento',
      bonus: { dano: 0.25, anula_energia: 0.35, slow_inimigo: 0.40 },
      desvantagem: { energia_regen: -0.35, cura: -0.50 },
      descricao: 'Águas do vazio que drenam energia de todos'
    },
    [ELEMENTOS.TERRA]: {
      nome: 'Singularidade Gravitacional',
      bonus: { dano: 0.30, stun: true, anula_evasao: true, puxa_inimigos: true },
      desvantagem: { agilidade: -0.45, custo_energia: 0.30 },
      descricao: 'Gravidade do vazio que aprisiona tudo, inclusive o usuário'
    },
    [ELEMENTOS.VENTO]: {
      nome: 'Vácuo Perfeito',
      bonus: { dano: 0.35, silencio_habilidades: true, anula_evasao: true, sufoca: true },
      desvantagem: { hp_max: -0.25, energia_regen: -0.30 },
      descricao: 'Ausência total que anula tudo, consumindo recursos vitais'
    },
    [ELEMENTOS.ELETRICIDADE]: {
      nome: 'Entropia Elétrica',
      bonus: { dano: 0.34, anula_energia: 0.50, desintegra_defesa: 0.40 },
      desvantagem: { energia_max: -0.35, hp_max: -0.20 },
      descricao: 'Colapso energético que destrói recursos de todos'
    },
    [ELEMENTOS.LUZ]: {
      nome: 'Horizonte de Eventos',
      bonus: { dano: 0.35, anula_tudo: true, ignora_defesa: 0.50 },
      desvantagem: { cura: -0.40, controle: -0.20 },
      descricao: 'Luz sendo absorvida pelo vazio, anulando tudo em seu caminho'
    },
    [ELEMENTOS.SOMBRA]: {
      nome: 'Fim da Existência',
      bonus: { dano: 0.40, drena_vida: 0.45, drena_energia: 0.45, anula_tudo: true },
      desvantagem: { hp_max: -0.30, cura: -100, energia_regen: -0.50 },
      descricao: 'Vazio absoluto que consome tudo, deixando apenas destruição'
    },
    [ELEMENTOS.VOID]: {
      nome: 'Colapso do Vazio',
      bonus: { dano: 0.45, anula_tudo: true, ignora_tudo: true, instakill_chance: 0.05 },
      desvantagem: { hp_max: -0.40, energia_max: -0.40, cura: -100, hp_por_turno: -0.10 },
      descricao: 'EXTREMO: Vazio consumindo vazio, poder devastador mas autodestruição'
    },
    [ELEMENTOS.AETHER]: {
      nome: 'Paradoxo Dimensional',
      bonus: { dano: 0.70, ignora_tudo: true, anula_tudo: true, realidade_distorce: true },
      desvantagem: { controle: -0.60, efeitos_caoticos: true, hp_max: -0.30 },
      descricao: 'CASO ESPECIAL: Opostos dimensionais criam paradoxo devastador e caótico'
    }
  },

  // ========== AETHER (Principal) ==========
  [ELEMENTOS.AETHER]: {
    [ELEMENTOS.FOGO]: {
      nome: 'Chama da Criação',
      bonus: { dano: 0.30, cura: 0.20, purifica_tudo: true, energia_regen: 0.20 },
      desvantagem: {},
      descricao: 'Fogo primordial que destrói e cria simultaneamente'
    },
    [ELEMENTOS.AGUA]: {
      nome: 'Nascente Eterna',
      bonus: { cura: 0.40, regen_continua: 0.15, remove_exaustao: true, energia_full: true },
      desvantagem: { dano: -0.30 },
      descricao: 'Água da criação com poder restaurador supremo mas pouca letalidade'
    },
    [ELEMENTOS.TERRA]: {
      nome: 'Fundação Primordial',
      bonus: { defesa: 0.35, hp_max: 0.25, resistencia_status: 0.60, imune_debuffs: true },
      desvantagem: { agilidade: -0.25 },
      descricao: 'Rocha da criação, indestrutível e imune a debuffs mas lenta'
    },
    [ELEMENTOS.VENTO]: {
      nome: 'Sopro da Vida',
      bonus: { agilidade: 0.35, energia_regen: 0.30, purifica_tudo: true, revive_ko: 0.50 },
      desvantagem: {},
      descricao: 'Vento primordial que acelera, energiza e revive sem desvantagens'
    },
    [ELEMENTOS.ELETRICIDADE]: {
      nome: 'Faísca Divina',
      bonus: { dano: 0.28, energia_regen: 0.35, energia_max: 0.30, restaura_tudo: true },
      desvantagem: {},
      descricao: 'Eletricidade da criação que energiza completamente'
    },
    [ELEMENTOS.LUZ]: {
      nome: 'Gênese Radiante',
      bonus: { dano: 0.28, cura: 0.35, revive_ko: 0.40, purifica_tudo: true, energia_full: true },
      desvantagem: {},
      descricao: 'SINERGIA PERFEITA: Luz e essência primordial em harmonia suprema'
    },
    [ELEMENTOS.SOMBRA]: {
      nome: 'Equilíbrio Primordial',
      bonus: { dano: 0.30, drena_vida: 0.25, remove_debuffs: true, energia_regen: 0.20 },
      desvantagem: { cura: -0.20 },
      descricao: 'Balanço entre luz e sombra primordial'
    },
    [ELEMENTOS.VOID]: {
      nome: 'Ruptura Dimensional',
      bonus: { dano: 0.70, ignora_tudo: true, anula_tudo: true, distorce_realidade: true },
      desvantagem: { controle: -0.70, efeitos_caoticos: true, hp_max: -0.25 },
      descricao: 'CASO ESPECIAL: Criação vs Destruição gera instabilidade dimensional'
    },
    [ELEMENTOS.AETHER]: {
      nome: 'Transcendência',
      bonus: { dano: 0.25, cura: 0.30, energia_infinita: true, imortalidade_temp: true, todos_stats: 0.20 },
      desvantagem: { custo_energia: 0.50 },
      descricao: 'EXTREMO: Essência pura da criação, poder divino com custo energético imenso'
    }
  }
};

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Obtém a sinergia entre dois elementos
 * @param {string} principal - Elemento do avatar principal
 * @param {string} suporte - Elemento do avatar suporte
 * @returns {object} Objeto com informações da sinergia
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
 * Verifica se uma sinergia é especial (casos extremos)
 * @param {string} principal - Elemento do avatar principal
 * @param {string} suporte - Elemento do avatar suporte
 * @returns {boolean}
 */
export function isSpecialSynergy(principal, suporte) {
  const especialCases = [
    // Opostos
    { p: ELEMENTOS.LUZ, s: ELEMENTOS.SOMBRA },
    { p: ELEMENTOS.SOMBRA, s: ELEMENTOS.LUZ },
    // Dimensionais
    { p: ELEMENTOS.VOID, s: ELEMENTOS.AETHER },
    { p: ELEMENTOS.AETHER, s: ELEMENTOS.VOID },
    // Extremos
    { p: ELEMENTOS.VOID, s: ELEMENTOS.VOID },
    { p: ELEMENTOS.AETHER, s: ELEMENTOS.AETHER }
  ];

  return especialCases.some(c => c.p === principal && c.s === suporte);
}

/**
 * Obtém todas as sinergias possíveis para um elemento
 * @param {string} elemento - Elemento a verificar
 * @returns {array} Array com todas as sinergias deste elemento como principal
 */
export function getAllSynergiesFor(elemento) {
  if (!SYNERGIES[elemento]) return [];

  return Object.keys(SYNERGIES[elemento]).map(suporte => ({
    suporte,
    ...SYNERGIES[elemento][suporte]
  }));
}

/**
 * Calcula bônus total de uma sinergia
 * @param {object} synergy - Objeto de sinergia
 * @returns {object} Bônus processados
 */
export function calculateSynergyBonus(synergy) {
  if (!synergy || !synergy.bonus) return {};

  // Retorna cópia dos bônus para aplicação
  return { ...synergy.bonus };
}

/**
 * Calcula desvantagens de uma sinergia
 * @param {object} synergy - Objeto de sinergia
 * @returns {object} Desvantagens processadas
 */
export function calculateSynergyPenalties(synergy) {
  if (!synergy || !synergy.desvantagem) return {};

  // Retorna cópia das desvantagens para aplicação
  return { ...synergy.desvantagem };
}

export default {
  SYNERGIES,
  getSynergy,
  isSpecialSynergy,
  getAllSynergiesFor,
  calculateSynergyBonus,
  calculateSynergyPenalties
};
