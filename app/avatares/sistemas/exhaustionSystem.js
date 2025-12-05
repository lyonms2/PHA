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
  
  // Taxa de recuperação
  RECUPERACAO_POR_HORA_INATIVO: 8,
  RECUPERACAO_POR_HORA_DESCANSANDO: 15, // Totalmente desativado
  RECUPERACAO_INSTANTANEA_ITEM: 50, // Usando item especial
  
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
 * Processa ganho de exaustão
 * @param {Object} avatar - Avatar atual
 * @param {string} fonte - Fonte de exaustão
 * @param {Object} modificadores - Modificadores opcionais
 * @returns {Object} Resultado
 */
export function processarGanhoExaustao(avatar, fonte, modificadores = {}) {
  const fonteInfo = FONTES_EXAUSTAO[fonte];
  
  if (!fonteInfo) {
    return {
      sucesso: false,
      erro: 'Fonte de exaustão inválida'
    };
  }
  
  const exaustaoAtual = avatar.exaustao || 0;
  const nivelAnterior = getNivelExaustao(exaustaoAtual);
  
  // Calcular ganho base
  let ganho = fonteInfo.ganho;
  
  // Modificadores
  if (modificadores.raridade === 'Lendário') {
    ganho *= 0.7; // Lendários cansam 30% menos
  } else if (modificadores.raridade === 'Comum') {
    ganho *= 1.3; // Comuns cansam 30% mais
  }
  
  if (modificadores.vinculo >= 80) {
    ganho *= 0.8; // Vínculo alto reduz exaustão em 20%
  }
  
  if (modificadores.vitoria === false) {
    ganho *= 1.5; // Derrotas cansam 50% mais (frustração)
  }
  
  // Aplicar ganho
  let novaExaustao = Math.min(CONFIG_EXAUSTAO.MAXIMO, exaustaoAtual + ganho);
  const nivelNovo = getNivelExaustao(novaExaustao);
  const mudouNivel = nivelAnterior.nome !== nivelNovo.nome;
  
  // Penalidade de vínculo se atingir níveis críticos
  let penalidade_vinculo = 0;
  if (nivelNovo.nome === 'COLAPSO_IMINENTE' && nivelAnterior.nome !== 'COLAPSO_IMINENTE') {
    penalidade_vinculo = -10;
  } else if (nivelNovo.nome === 'COLAPSADO') {
    penalidade_vinculo = nivelNovo.penalidade_vinculo;
  }
  
  return {
    sucesso: true,
    fonte: fonteInfo.nome,
    ganho: Math.floor(ganho),
    exaustao_anterior: exaustaoAtual,
    exaustao_nova: novaExaustao,
    nivel_anterior: nivelAnterior,
    nivel_novo: nivelNovo,
    mudou_nivel: mudouNivel,
    penalidade_vinculo: penalidade_vinculo,
    aviso: mudouNivel ? nivelNovo.mensagem_status : null,
    pode_continuar: nivelNovo.nome !== 'COLAPSADO'
  };
}

/**
 * Processa recuperação de exaustão
 * @param {number} exaustaoAtual - Exaustão atual
 * @param {number} horasPassadas - Horas de descanso
 * @param {boolean} totalmenteInativo - Se está completamente desativado
 * @param {boolean} usouItem - Se usou item de recuperação
 * @returns {Object} Resultado
 */
export function processarRecuperacao(exaustaoAtual, horasPassadas, totalmenteInativo = false, usouItem = false) {
  const nivelAnterior = getNivelExaustao(exaustaoAtual);
  
  let recuperacao = 0;
  
  // Recuperação por item
  if (usouItem) {
    recuperacao += CONFIG_EXAUSTAO.RECUPERACAO_INSTANTANEA_ITEM;
  }
  
  // Recuperação por tempo
  const taxaPorHora = totalmenteInativo 
    ? CONFIG_EXAUSTAO.RECUPERACAO_POR_HORA_DESCANSANDO 
    : CONFIG_EXAUSTAO.RECUPERACAO_POR_HORA_INATIVO;
  
  recuperacao += taxaPorHora * horasPassadas;
  
  // Penalidade se estava colapsado
  if (nivelAnterior.tempo_recuperacao_aumentado) {
    recuperacao /= nivelAnterior.tempo_recuperacao_aumentado;
  }
  
  const novaExaustao = Math.max(CONFIG_EXAUSTAO.MINIMO, exaustaoAtual - recuperacao);
  const nivelNovo = getNivelExaustao(novaExaustao);
  const mudouNivel = nivelAnterior.nome !== nivelNovo.nome;
  
  return {
    exaustao_anterior: exaustaoAtual,
    exaustao_nova: novaExaustao,
    recuperacao: recuperacao,
    nivel_anterior: nivelAnterior,
    nivel_novo: nivelNovo,
    mudou_nivel: mudouNivel,
    horas_passadas: horasPassadas,
    totalmente_inativo: totalmenteInativo,
    mensagem: mudouNivel 
      ? `✅ Seu avatar se recuperou! Agora está ${nivelNovo.nome}` 
      : `Recuperando... ${Math.floor(recuperacao)} pontos de exaustão removidos`
  };
}

/**
 * Aplica penalidades de exaustão aos stats
 * @param {Object} stats - Stats base
 * @param {number} exaustao - Nível de exaustão
 * @returns {Object} Stats com penalidades aplicadas
 */
export function aplicarPenalidadesExaustao(stats, exaustao) {
  const nivel = getNivelExaustao(exaustao);
  
  if (!nivel.penalidades.stats) {
    return stats; // Sem penalidades
  }
  
  const multiplicador = 1 + nivel.penalidades.stats;
  
  return {
    forca: Math.floor(stats.forca * multiplicador),
    agilidade: Math.floor(stats.agilidade * multiplicador),
    resistencia: Math.floor(stats.resistencia * multiplicador),
    foco: Math.floor(stats.foco * multiplicador)
  };
}

/**
 * Verifica se avatar pode entrar em combate
 * @param {number} exaustao - Nível de exaustão
 * @returns {Object} { pode_lutar: boolean, motivo: string }
 */
export function podeEntrarEmCombate(exaustao) {
  const nivel = getNivelExaustao(exaustao);
  
  if (nivel.penalidades.pode_lutar === false) {
    return {
      pode_lutar: false,
      motivo: 'Avatar colapsado - requer descanso completo',
      horas_minimas: nivel.requer_descanso_minimo || 12
    };
  }
  
  if (nivel.nome === 'COLAPSO_IMINENTE') {
    return {
      pode_lutar: true,
      aviso_critico: true,
      motivo: '⚠️ RISCO EXTREMO: Avatar pode colapsar durante o combate!'
    };
  }
  
  if (nivel.nome === 'EXAUSTO') {
    return {
      pode_lutar: true,
      aviso: true,
      motivo: '⚠️ Avatar exausto - desempenho severamente reduzido'
    };
  }
  
  return { pode_lutar: true };
}

/**
 * Calcula tempo necessário para recuperação completa
 * @param {number} exaustaoAtual - Exaustão atual
 * @param {boolean} totalmenteInativo - Se ficará totalmente inativo
 * @returns {Object} Informações de tempo
 */
export function calcularTempoRecuperacao(exaustaoAtual, totalmenteInativo = true) {
  if (exaustaoAtual === 0) {
    return {
      horas: 0,
      minutos: 0,
      ja_descansado: true
    };
  }
  
  const nivel = getNivelExaustao(exaustaoAtual);
  const taxaPorHora = totalmenteInativo 
    ? CONFIG_EXAUSTAO.RECUPERACAO_POR_HORA_DESCANSANDO 
    : CONFIG_EXAUSTAO.RECUPERACAO_POR_HORA_INATIVO;
  
  let horasNecessarias = exaustaoAtual / taxaPorHora;
  
  // Penalidade de colapso
  if (nivel.tempo_recuperacao_aumentado) {
    horasNecessarias *= nivel.tempo_recuperacao_aumentado;
  }
  
  // Mínimo de descanso se colapsado
  if (nivel.requer_descanso_minimo) {
    horasNecessarias = Math.max(horasNecessarias, nivel.requer_descanso_minimo);
  }
  
  const horas = Math.floor(horasNecessarias);
  const minutos = Math.floor((horasNecessarias - horas) * 60);
  
  return {
    horas,
    minutos,
    total_horas: horasNecessarias,
    nivel_atual: nivel.nome,
    recomendacao: nivel.nome === 'COLAPSADO' 
      ? 'Descanso imediato obrigatório' 
      : nivel.nome === 'COLAPSO_IMINENTE'
        ? 'Descanso urgente recomendado'
        : 'Descanso recomendado quando possível'
  };
}

/**
 * Gera relatório completo de exaustão
 * @param {Object} avatar - Avatar completo
 * @returns {Object} Relatório detalhado
 */
export function gerarRelatorioExaustao(avatar) {
  const exaustao = avatar.exaustao || 0;
  const nivel = getNivelExaustao(exaustao);
  const combate = podeEntrarEmCombate(exaustao);
  const recuperacao = calcularTempoRecuperacao(exaustao, true);
  
  return {
    exaustao_atual: exaustao,
    nivel: nivel.nome,
    emoji: nivel.emoji,
    cor: nivel.cor,
    descricao: nivel.descricao,
    pode_lutar: combate.pode_lutar,
    aviso: combate.aviso_critico || combate.aviso,
    penalidades_ativas: nivel.penalidades,
    efeitos_visuais: nivel.efeitos_visuais || [],
    avisos_importantes: nivel.avisos || [],
    tempo_recuperacao: recuperacao,
    recomendacao: nivel.mensagem_status,
    stats_afetados: nivel.penalidades.stats ? 
      `${Math.abs(nivel.penalidades.stats * 100)}% de redução` : 'Nenhum'
  };
}

// ==================== TABELA DE REFERÊNCIA ====================

export const TABELA_EXAUSTAO = `
╔═══════════════════════════════════════════════════════════════╗
║                    SISTEMA DE EXAUSTÃO                        ║
╠═══════════════════════════════════════════════════════════════╣
║ 💚 DESCANSADO (0-19)                                          ║
║    Sem penalidades ou bônus                                   ║
║    Condições ideais de combate                                ║
╠═══════════════════════════════════════════════════════════════╣
║ 💛 ALERTA (20-39)                                             ║
║    Sem penalidades                                            ║
║    Avatar em boa forma                                        ║
╠═══════════════════════════════════════════════════════════════╣
║ 🟠 CANSADO (40-59)                                            ║
║    Sem penalidades de combate                                 ║
║    Avatar pode lutar normalmente                              ║
╠═══════════════════════════════════════════════════════════════╣
║ 🔴 EXAUSTO (60-79)                                            ║
║    Sem penalidades de combate                                 ║
║    Descanso recomendado                                       ║
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
║   Passiva: 10 pontos/hora (offline)                           ║
║   Botão Descansar: 50 pontos instantâneo                      ║
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
  processarGanhoExaustao,
  processarRecuperacao,
  aplicarPenalidadesExaustao,
  podeEntrarEmCombate,
  calcularTempoRecuperacao,
  gerarRelatorioExaustao,
  TABELA_EXAUSTAO
};
