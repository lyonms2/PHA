// ==================== SISTEMA DE EXAUSTÃO ====================
// Arquivo: /app/avatares/sistemas/exhaustionSystem.js

/**
 * Sistema de exaustão para avatares
 * Avatares ficam cansados após combates e precisam descansar
 */

import {
  calcularProgressoNivel as calcularProgressoNivelGenerico,
  getProximoNivel as getProximoNivelGenerico
} from '../../../lib/utils/progressUtils';

/**
 * Configurações do sistema de exaustão
 * NOTA: Valores de recuperação estão documentados aqui mas a lógica real
 * está implementada em /app/api/meus-avatares/route.js
 */
export const CONFIG_EXAUSTAO = {
  MINIMO: 0,
  MAXIMO: 100,
  INICIAL: 0,

  // Taxa de ganho de exaustão (REDUZIDAS EM 50%)
  POR_COMBATE_COMUM: 7.5,
  POR_COMBATE_DIFICIL: 12.5,
  POR_COMBATE_BOSS: 20,
  POR_MISSAO_CURTA: 5,
  POR_MISSAO_LONGA: 10,
  POR_TREINO: 2.5,
  POR_HABILIDADE_ULTIMATE: 5,

  // Taxa de recuperação (DOCUMENTAÇÃO)
  // Sistema real: 5 pontos/hora (calculado em /app/api/meus-avatares/route.js)
  // Poções: valor_efeito do item (geralmente 50 pontos)
  RECUPERACAO_POR_HORA: 5, // Valor REAL usado

  // Limites críticos
  NIVEL_ALERTA: 60, // Começa a sentir cansaço
  NIVEL_CRITICO: 80, // Penalidades severas
  NIVEL_COLAPSO: 100 // Avatar desmaia
};

/**
 * Níveis de exaustão e seus efeitos
 */
export const NIVEIS_EXAUSTAO = {
  DESCANSADO: {
    min: 0,
    max: 19,
    nome: 'Descansado',
    emoji: '💚',
    cor: 'text-green-400',
    descricao: 'Avatar está em condições ideais de combate',
    penalidades: {},
    bonus: {},
    mensagem_status: 'Seu avatar está revigorado e pronto para qualquer desafio!'
  },

  ALERTA: {
    min: 20,
    max: 39,
    nome: 'Alerta',
    emoji: '💛',
    cor: 'text-yellow-400',
    descricao: 'Avatar está em boas condições, mas pode precisar descansar em breve',
    penalidades: {},
    bonus: {},
    mensagem_status: 'Seu avatar está em boa forma, mas não ignore os sinais de cansaço.'
  },

  CANSADO: {
    min: 40,
    max: 59,
    nome: 'Cansado',
    emoji: '🟠',
    cor: 'text-orange-400',
    descricao: 'Avatar começa a sentir cansaço, mas ainda pode lutar',
    penalidades: {},
    bonus: {},
    efeitos_visuais: ['respiracao_pesada'],
    mensagem_status: 'Seu avatar está começando a ficar cansado. Considere um descanso em breve.',
    avisos: []
  },

  EXAUSTO: {
    min: 60,
    max: 79,
    nome: 'Exausto',
    emoji: '🔴',
    cor: 'text-red-400',
    descricao: 'Avatar está visivelmente cansado, mas ainda pode lutar',
    penalidades: {},
    bonus: {},
    efeitos_visuais: ['tremendo', 'respiracao_pesada'],
    mensagem_status: '⚠️ ATENÇÃO: Seu avatar está exausto! Descanso recomendado!',
    avisos: []
  },

  COLAPSO_IMINENTE: {
    min: 80,
    max: 99,
    nome: 'Colapso Iminente',
    emoji: '💀',
    cor: 'text-red-600',
    descricao: 'Avatar está muito cansado, próximo do limite',
    penalidades: {},
    bonus: {},
    efeitos_visuais: ['tremendo_intenso', 'respiracao_pesada'],
    mensagem_status: '🚨 CRÍTICO: Seu avatar está muito exausto! Descanso urgente!',
    avisos: [
      'Próximo do limite de exaustão',
      'Descanse logo para evitar bloqueio'
    ]
  },

  COLAPSADO: {
    min: 100,
    max: 100,
    nome: 'Colapsado',
    emoji: '💀💀',
    cor: 'text-gray-400',
    descricao: 'Avatar atingiu exaustão máxima e não pode lutar',
    penalidades: {
      pode_lutar: false
    },
    bonus: {},
    efeitos_visuais: ['exausto_completo'],
    mensagem_status: '💀 EXAUSTÃO MÁXIMA: Seu avatar não pode lutar! Descanse antes de batalhar!',
    avisos: [
      'Avatar completamente exausto',
      'Não pode ser usado em combate',
      'Descanse para poder batalhar novamente'
    ]
  }
};

/**
 * Fontes de exaustão
 */
export const FONTES_EXAUSTAO = {
  COMBATE_FACIL: {
    nome: 'Combate Fácil',
    ganho: 2.5,
    descricao: 'Inimigos fracos, vitória rápida'
  },
  COMBATE_NORMAL: {
    nome: 'Combate Normal',
    ganho: 7.5,
    descricao: 'Batalha equilibrada'
  },
  COMBATE_DIFICIL: {
    nome: 'Combate Difícil',
    ganho: 12.5,
    descricao: 'Batalha intensa e prolongada'
  },
  COMBATE_BOSS: {
    nome: 'Combate contra Boss',
    ganho: 20,
    descricao: 'Luta épica contra inimigo poderoso'
  },
  MISSAO_CURTA: {
    nome: 'Missão Curta',
    ganho: 5,
    descricao: 'Missão rápida com poucos combates'
  },
  MISSAO_MEDIA: {
    nome: 'Missão Média',
    ganho: 10,
    descricao: 'Missão de duração média'
  },
  MISSAO_LONGA: {
    nome: 'Missão Longa',
    ganho: 17.5,
    descricao: 'Missão extensa com múltiplos combates'
  },
  TREINO_LEVE: {
    nome: 'Treino Leve',
    ganho: 2.5,
    descricao: 'Sessão de treinamento básico'
  },
  TREINO_INTENSO: {
    nome: 'Treino Intenso',
    ganho: 7.5,
    descricao: 'Treinamento pesado e exigente'
  },
  HABILIDADE_ULTIMATE: {
    nome: 'Uso de Ultimate',
    ganho: 5,
    descricao: 'Habilidades supremas drenam energia vital'
  },
  CRITICO_RECEBIDO: {
    nome: 'Acerto Crítico Recebido',
    ganho: 4,
    descricao: 'Golpes devastadores causam exaustão'
  },
  QUASE_MORTE: {
    nome: 'Quase Morreu',
    ganho: 15,
    descricao: 'Sobreviver com HP crítico é mentalmente desgastante'
  }
};

/**
 * Retorna o nível de exaustão atual
 * @param {number} exaustao - Valor de exaustão (0-100)
 * @returns {Object} Informações do nível
 */
export function getNivelExaustao(exaustao) {
  const valor = Math.max(CONFIG_EXAUSTAO.MINIMO, Math.min(CONFIG_EXAUSTAO.MAXIMO, exaustao));

  for (const nivel of Object.values(NIVEIS_EXAUSTAO)) {
    if (valor >= nivel.min && valor <= nivel.max) {
      return {
        ...nivel,
        valor_atual: valor,
        progresso_nivel: calcularProgressoNivel(valor, nivel),
        proximo_nivel: getProximoNivel(valor)
      };
    }
  }

  return null;
}

/**
 * Calcula progresso dentro do nível (0-100%)
 */
function calcularProgressoNivel(exaustao, nivelAtual) {
  return calcularProgressoNivelGenerico(exaustao, nivelAtual);
}

/**
 * Retorna próximo nível de exaustão
 */
function getProximoNivel(exaustao) {
  return getProximoNivelGenerico(exaustao, NIVEIS_EXAUSTAO, 'pontos_ate');
}

/**
 * Aplica buffs de efeitos aos stats
 * NOTA: Exaustão não afeta stats, apenas bloqueia combate aos 100%
 * @param {Object} stats - Stats base
 * @param {number} exaustao - Nível de exaustão (não usado, mantido por compatibilidade)
 * @param {Array} effects - Efeitos ativos (opcional)
 * @returns {Object} Stats com buffs aplicados
 */
export function aplicarPenalidadesExaustao(stats, exaustao, effects = []) {
  // Exaustão não afeta stats - apenas bloqueia combate aos 100%
  let multiplicador = 1.0;

  // Aplicar buffs de efeitos (bencao, velocidade_aumentada, etc.)
  for (const efeito of effects) {
    // Benção: +20% em TODOS os stats
    if (efeito.bonusTodosStats) {
      multiplicador += efeito.bonusTodosStats;
    }
  }

  // Calcular stats base com multiplicador geral
  let finalStats = {
    forca: Math.floor(stats.forca * multiplicador),
    agilidade: Math.floor(stats.agilidade * multiplicador),
    resistencia: Math.floor(stats.resistencia * multiplicador),
    foco: Math.floor(stats.foco * multiplicador)
  };

  // Aplicar buffs específicos de cada stat
  for (const efeito of effects) {
    // Velocidade Aumentada: +40% agilidade
    if (efeito.tipo === 'velocidade_aumentada' && efeito.bonusAgilidade) {
      finalStats.agilidade = Math.floor(finalStats.agilidade * (1 + efeito.bonusAgilidade));
    }
  }

  return finalStats;
}

// ==================== TABELA DE REFERÊNCIA ====================

export const TABELA_EXAUSTAO = `
╔═══════════════════════════════════════════════════════════════╗
║              🌟 SISTEMA DE EXAUSTÃO - PHA 🌟                 ║
╠═══════════════════════════════════════════════════════════════╣
║ 💚 DESCANSADO (0-19)                                         ║
║    Sem penalidades                                            ║
║    Avatar em condições ideais                                 ║
╠═══════════════════════════════════════════════════════════════╣
║ 💛 ALERTA (20-39)                                            ║
║    Sem penalidades                                            ║
║    Começa a sentir leve cansaço                               ║
╠═══════════════════════════════════════════════════════════════╣
║ 🟠 CANSADO (40-59)                                           ║
║    Sem penalidades de combate                                 ║
║    Cansaço visível mas controlado                             ║
╠═══════════════════════════════════════════════════════════════╣
║ 🔴 EXAUSTO (60-79)                                           ║
║    Sem penalidades de combate                                 ║
║    Muito cansado - descanse logo                              ║
╠═══════════════════════════════════════════════════════════════╣
║ 💀 COLAPSO IMINENTE (80-99)                                   ║
║    Sem penalidades de combate                                 ║
║    Próximo do limite - descanse urgente                       ║
╠═══════════════════════════════════════════════════════════════╣
║ 💀💀 COLAPSADO (100)                                          ║
║    ❌ NÃO PODE LUTAR                                          ║
║    Descanse para poder batalhar novamente                     ║
╠═══════════════════════════════════════════════════════════════╣
║ RECUPERAÇÃO:                                                   ║
║   Passiva: 5 pontos/hora (offline)                            ║
║   Poção de Energia: Variável por item (~50 pts)               ║
║                                                                ║
║ GANHO DE EXAUSTÃO:                                            ║
║   Combate Fácil: 2.5 pts                                      ║
║   Combate Normal: 7.5 pts                                     ║
║   Combate Difícil: 12.5 pts                                   ║
║   Combate Boss: 20 pts                                        ║
╚═══════════════════════════════════════════════════════════════╝
`;

// Exportação default
export default {
  CONFIG_EXAUSTAO,
  NIVEIS_EXAUSTAO,
  FONTES_EXAUSTAO,
  getNivelExaustao,
  aplicarPenalidadesExaustao,
  TABELA_EXAUSTAO
};
