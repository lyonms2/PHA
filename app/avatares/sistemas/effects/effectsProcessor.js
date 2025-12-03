// ==================== PROCESSADOR DE EFEITOS DE STATUS ====================
// Arquivo: /app/avatares/sistemas/effects/effectsProcessor.js
// Extraído de: abilitiesSystem.js

import { EFEITOS_STATUS, obterEfeito, efeitoExiste } from './statusEffects.js';

/**
 * Processa um efeito de status básico
 * Verifica se o efeito existe e aplica os modificadores básicos
 *
 * @param {string} efeitoNome - Nome do efeito (chave em EFEITOS_STATUS)
 * @param {Object} alvo - Alvo do efeito (deve ter propriedade 'nome')
 * @returns {Object} Resultado do processamento
 *   {
 *     sucesso: boolean,
 *     efeito: Object|null,
 *     mensagem: string,
 *     duracao: number
 *   }
 */
export function processarEfeitoStatus(efeitoNome, alvo) {
  const efeito = EFEITOS_STATUS[efeitoNome];

  if (!efeito) {
    return {
      sucesso: false,
      efeito: null,
      mensagem: 'Efeito inválido',
      duracao: 0
    };
  }

  return {
    sucesso: true,
    efeito: efeito,
    mensagem: `${alvo.nome} está ${efeito.nome}! ${efeito.icone}`,
    duracao: efeito.duracao_base
  };
}

/**
 * Aplica um efeito de dano contínuo
 * Calcula e retorna o dano que será aplicado por turno
 *
 * @param {string} efeitoNome - Nome do efeito
 * @param {number} hpMaximo - HP máximo do alvo
 * @returns {Object}
 *   {
 *     sucesso: boolean,
 *     dano: number,
 *     danoMensagem: string
 *   }
 */
export function aplicarDanoContinuo(efeitoNome, hpMaximo) {
  const efeito = obterEfeito(efeitoNome);

  if (!efeito || efeito.tipo !== 'dano_continuo') {
    return {
      sucesso: false,
      dano: 0,
      danoMensagem: ''
    };
  }

  const dano = Math.ceil(hpMaximo * efeito.dano_por_turno);

  return {
    sucesso: true,
    dano: dano,
    danoMensagem: `${efeito.nome} causa ${dano} de dano!`
  };
}

/**
 * Aplica um efeito de cura contínua
 * Calcula e retorna a cura que será aplicada por turno
 *
 * @param {string} efeitoNome - Nome do efeito
 * @param {number} hpMaximo - HP máximo do alvo
 * @returns {Object}
 *   {
 *     sucesso: boolean,
 *     cura: number,
 *     curaMensagem: string
 *   }
 */
export function aplicarCuraContinua(efeitoNome, hpMaximo) {
  const efeito = obterEfeito(efeitoNome);

  if (!efeito || efeito.tipo !== 'cura_continua') {
    return {
      sucesso: false,
      cura: 0,
      curaMensagem: ''
    };
  }

  const cura = Math.ceil(hpMaximo * efeito.cura_por_turno);

  return {
    sucesso: true,
    cura: cura,
    curaMensagem: `${efeito.nome} cura ${cura} HP!`
  };
}

/**
 * Processa um efeito de dano especial (roubo de vida, etc)
 * Aplica cálculos especiais baseados no dano causado
 *
 * @param {string} efeitoNome - Nome do efeito
 * @param {number} dano - Dano causado pela habilidade
 * @returns {Object}
 *   {
 *     sucesso: boolean,
 *     valorEspecial: number,
 *     mensagem: string
 *   }
 */
export function processarEfeitoEspecial(efeitoNome, dano) {
  const efeito = obterEfeito(efeitoNome);

  if (!efeito || efeito.tipo !== 'especial') {
    return {
      sucesso: false,
      valorEspecial: 0,
      mensagem: 'Efeito especial inválido'
    };
  }

  // Roubo de vida
  if (efeito.percentual_roubo !== undefined) {
    const cura = Math.ceil(dano * efeito.percentual_roubo);
    return {
      sucesso: true,
      valorEspecial: cura,
      mensagem: `${efeito.nome}: Drena ${cura} HP! ${efeito.icone}`
    };
  }

  // Perfuração
  if (efeito.ignora_defesa !== undefined) {
    return {
      sucesso: true,
      valorEspecial: efeito.ignora_defesa,
      mensagem: `${efeito.nome}: Ignora ${(efeito.ignora_defesa * 100)}% da defesa! ${efeito.icone}`
    };
  }

  // Execução
  if (efeito.bonus_baixo_hp !== undefined) {
    return {
      sucesso: true,
      valorEspecial: efeito.bonus_baixo_hp,
      mensagem: `${efeito.nome}: +${(efeito.bonus_baixo_hp * 100)}% dano em alvos feridos! ${efeito.icone}`
    };
  }

  // Dano massivo
  if (efeito.multiplicador_dano_extra !== undefined) {
    return {
      sucesso: true,
      valorEspecial: efeito.multiplicador_dano_extra,
      mensagem: `${efeito.nome}: +${((efeito.multiplicador_dano_extra - 1) * 100)}% de dano! ${efeito.icone}`
    };
  }

  return {
    sucesso: true,
    valorEspecial: 0,
    mensagem: `${efeito.nome} foi aplicado! ${efeito.icone}`
  };
}

/**
 * Processa modificadores de stats de um efeito
 * Retorna objetos com reductions/bonuses aplicadas
 *
 * @param {string} efeitoNome - Nome do efeito
 * @returns {Object}
 *   {
 *     sucesso: boolean,
 *     modificadores: { nome_stat: number },
 *     mensagem: string
 *   }
 */
export function obterModificadoresEfeito(efeitoNome) {
  const efeito = obterEfeito(efeitoNome);

  if (!efeito) {
    return {
      sucesso: false,
      modificadores: {},
      mensagem: 'Efeito não encontrado'
    };
  }

  const modificadores = {};
  const descricoes = [];

  // Buffs de resistência
  if (efeito.bonus_resistencia !== undefined) {
    modificadores.resistencia = efeito.bonus_resistencia;
    descricoes.push(`+${(efeito.bonus_resistencia * 100)}% Resistência`);
  }

  // Buffs de evasão
  if (efeito.bonus_evasao !== undefined) {
    modificadores.evasao = efeito.bonus_evasao;
    descricoes.push(`+${(efeito.bonus_evasao * 100)}% Evasão`);
  }

  // Buffs de agilidade
  if (efeito.bonus_agilidade !== undefined) {
    modificadores.agilidade = efeito.bonus_agilidade;
    descricoes.push(`+${(efeito.bonus_agilidade * 100)}% Agilidade`);
  }

  // Buffs de foco
  if (efeito.bonus_foco !== undefined) {
    modificadores.foco = efeito.bonus_foco;
    descricoes.push(`+${(efeito.bonus_foco * 100)}% Foco`);
  }

  // Buffs de acerto
  if (efeito.bonus_acerto !== undefined) {
    modificadores.acerto = efeito.bonus_acerto;
    descricoes.push(`+${(efeito.bonus_acerto * 100)}% Acerto`);
  }

  // Buffs de todos os stats
  if (efeito.bonus_todos_stats !== undefined) {
    modificadores.todos_stats = efeito.bonus_todos_stats;
    descricoes.push(`+${(efeito.bonus_todos_stats * 100)}% Todos os Stats`);
  }

  // Reductions
  if (efeito.reducao_stats !== undefined) {
    modificadores.reducao_stats = efeito.reducao_stats;
    descricoes.push(`-${(efeito.reducao_stats * 100)}% Todos os Stats`);
  }

  if (efeito.reducao_agilidade !== undefined) {
    modificadores.agilidade = -efeito.reducao_agilidade;
    descricoes.push(`-${(efeito.reducao_agilidade * 100)}% Agilidade`);
  }

  if (efeito.reducao_acerto !== undefined) {
    modificadores.acerto = -efeito.reducao_acerto;
    descricoes.push(`-${(efeito.reducao_acerto * 100)}% Acerto`);
  }

  if (efeito.reducao_resistencia !== undefined) {
    modificadores.resistencia = -efeito.reducao_resistencia;
    descricoes.push(`-${(efeito.reducao_resistencia * 100)}% Resistência`);
  }

  return {
    sucesso: true,
    modificadores: modificadores,
    mensagem: `${efeito.nome}: ${descricoes.join(', ')}`
  };
}

/**
 * Processa efeitos de controle (paralisia, congelamento, atordoamento)
 * Retorna informações sobre como o efeito impacta o alvo
 *
 * @param {string} efeitoNome - Nome do efeito
 * @returns {Object}
 *   {
 *     sucesso: boolean,
 *     tipoControle: string,
 *     valor: number,
 *     descricao: string
 *   }
 */
export function processarEfeitoControle(efeitoNome) {
  const efeito = obterEfeito(efeitoNome);

  if (!efeito || efeito.tipo !== 'controle') {
    return {
      sucesso: false,
      tipoControle: null,
      valor: 0,
      descricao: 'Efeito de controle inválido'
    };
  }

  // Impede ação (congelado)
  if (efeito.efeito === 'impede_acao') {
    return {
      sucesso: true,
      tipoControle: 'impede_acao',
      valor: 100,
      descricao: `${efeito.nome}: O alvo não pode agir! ${efeito.icone}`
    };
  }

  // Pula turno (atordoado)
  if (efeito.efeito === 'pula_turno') {
    return {
      sucesso: true,
      tipoControle: 'pula_turno',
      valor: 100,
      descricao: `${efeito.nome}: O alvo perde um turno! ${efeito.icone}`
    };
  }

  // Chance de falha (paralisia)
  if (efeito.chance_falha !== undefined) {
    return {
      sucesso: true,
      tipoControle: 'chance_falha',
      valor: efeito.chance_falha * 100,
      descricao: `${efeito.nome}: ${(efeito.chance_falha * 100)}% de chance de falhar ação! ${efeito.icone}`
    };
  }

  return {
    sucesso: false,
    tipoControle: null,
    valor: 0,
    descricao: 'Tipo de controle não identificado'
  };
}

/**
 * Processa efeitos de zona (dano de entrada, dano contínuo de zona)
 *
 * @param {string} efeitoNome - Nome do efeito
 * @param {number} hpMaximo - HP máximo para cálculos percentuais
 * @returns {Object}
 *   {
 *     sucesso: boolean,
 *     danoEntrada: number,
 *     danoContinuo: number,
 *     mensagem: string
 *   }
 */
export function processarEfeitoZona(efeitoNome, hpMaximo = null) {
  const efeito = obterEfeito(efeitoNome);

  if (!efeito || efeito.tipo !== 'zona') {
    return {
      sucesso: false,
      danoEntrada: 0,
      danoContinuo: 0,
      mensagem: 'Efeito de zona inválido'
    };
  }

  const danoEntrada = efeito.dano_entrada || 0;
  let danoContinuo = 0;

  if (efeito.dano_continuo !== undefined && hpMaximo) {
    danoContinuo = Math.ceil(hpMaximo * efeito.dano_continuo);
  }

  return {
    sucesso: true,
    danoEntrada: danoEntrada,
    danoContinuo: danoContinuo,
    mensagem: `${efeito.nome} criada! ${efeito.icone}`
  };
}

/**
 * Verifica se um efeito é debuff
 *
 * @param {string} efeitoNome - Nome do efeito
 * @returns {boolean}
 */
export function ehDebuff(efeitoNome) {
  const efeito = obterEfeito(efeitoNome);
  if (!efeito) return false;

  const tiposDebuff = ['dano_continuo', 'controle', 'debuff', 'buff_risco'];
  return tiposDebuff.includes(efeito.tipo);
}

/**
 * Verifica se um efeito é buff
 *
 * @param {string} efeitoNome - Nome do efeito
 * @returns {boolean}
 */
export function ehBuff(efeitoNome) {
  const efeito = obterEfeito(efeitoNome);
  if (!efeito) return false;

  const tiposBuff = ['buff', 'cura_continua', 'defensivo'];
  return tiposBuff.includes(efeito.tipo);
}

/**
 * Verifica se um efeito impede cura
 *
 * @param {string} efeitoNome - Nome do efeito
 * @returns {boolean}
 */
export function impedeCura(efeitoNome) {
  const efeito = obterEfeito(efeitoNome);
  return efeito && efeito.impede_cura === true;
}

/**
 * Verifica se um efeito é de limpeza
 *
 * @param {string} efeitoNome - Nome do efeito
 * @returns {boolean}
 */
export function ehEfeitoLimpeza(efeitoNome) {
  const efeito = obterEfeito(efeitoNome);
  return efeito && efeito.remove_debuffs === true;
}

/**
 * Processa aplicação de múltiplos efeitos em sequência
 *
 * @param {Array} efeitosNomes - Array de nomes de efeitos
 * @param {Object} alvo - Alvo dos efeitos
 * @returns {Object}
 *   {
 *     sucesso: boolean,
 *     efeitos_aplicados: Array,
 *     efeitos_falhados: Array,
 *     mensagens: Array
 *   }
 */
export function processarMultiplosEfeitos(efeitosNomes, alvo) {
  const resultado = {
    sucesso: true,
    efeitos_aplicados: [],
    efeitos_falhados: [],
    mensagens: []
  };

  if (!Array.isArray(efeitosNomes) || efeitosNomes.length === 0) {
    resultado.sucesso = false;
    resultado.mensagens.push('Nenhum efeito para processar');
    return resultado;
  }

  efeitosNomes.forEach(nomEfeito => {
    const resultadoEfeito = processarEfeitoStatus(nomEfeito, alvo);

    if (resultadoEfeito.sucesso) {
      resultado.efeitos_aplicados.push(nomEfeito);
      resultado.mensagens.push(resultadoEfeito.mensagem);
    } else {
      resultado.efeitos_falhados.push(nomEfeito);
    }
  });

  return resultado;
}

/**
 * Gera um resumo detalhado de um efeito para exibição
 *
 * @param {string} efeitoNome - Nome do efeito
 * @returns {string} Descrição formatada do efeito
 */
export function gerarDescricaoEfeito(efeitoNome) {
  const efeito = obterEfeito(efeitoNome);

  if (!efeito) {
    return 'Efeito não encontrado';
  }

  let descricao = `${efeito.icone} ${efeito.nome}\n`;
  descricao += `Tipo: ${efeito.tipo}\n`;
  descricao += `Duração: ${efeito.duracao_base} turno(s)\n\n`;

  // Dano contínuo
  if (efeito.dano_por_turno !== undefined) {
    descricao += `Dano por turno: ${(efeito.dano_por_turno * 100)}% do HP máximo\n`;
  }

  // Cura contínua
  if (efeito.cura_por_turno !== undefined) {
    descricao += `Cura por turno: ${(efeito.cura_por_turno * 100)}% do HP máximo\n`;
  }

  // Modificadores de stats
  const modificadores = obterModificadoresEfeito(efeitoNome);
  if (modificadores.sucesso && Object.keys(modificadores.modificadores).length > 0) {
    descricao += `Modificadores: ${modificadores.mensagem}\n`;
  }

  // Efeitos especiais
  if (efeito.efeito) {
    descricao += `Efeito especial: ${efeito.efeito}\n`;
  }

  if (efeito.chance_falha !== undefined) {
    descricao += `Chance de falha: ${(efeito.chance_falha * 100)}%\n`;
  }

  if (efeito.impede_cura === true) {
    descricao += `Impede cura: Sim\n`;
  }

  if (efeito.evasao_total === true) {
    descricao += `Evasão total: Sim (100%)\n`;
  }

  return descricao;
}

/**
 * Verifica compatibilidade entre efeitos
 * Alguns efeitos podem não funcionar bem juntos
 *
 * @param {Array} efeitosAtivos - Array de nomes de efeitos ativos
 * @param {string} novoEfeito - Nome do novo efeito a aplicar
 * @returns {Object}
 *   {
 *     compativel: boolean,
 *     mensagem: string,
 *     conflitos: Array
 *   }
 */
export function verificarCompatibilidadeEfeitos(efeitosAtivos, novoEfeito) {
  const resultado = {
    compativel: true,
    mensagem: 'Efeito compatível',
    conflitos: []
  };

  if (!Array.isArray(efeitosAtivos)) {
    return resultado;
  }

  if (!efeitoExiste(novoEfeito)) {
    resultado.compativel = false;
    resultado.mensagem = 'Efeito não existe';
    return resultado;
  }

  const novoEfeitoObj = obterEfeito(novoEfeito);

  // Verificar conflitos de tipo
  const tiposConfliantes = {
    'invisivel': ['desorientado', 'atordoado'],
    'congelado': ['paralisia', 'paralisia_intensa', 'atordoado'],
    'paralisia': ['congelado', 'paralisia_intensa'],
    'paralisia_intensa': ['congelado', 'paralisia']
  };

  if (novoEfeito in tiposConfliantes) {
    const conflitosEncontrados = efeitosAtivos.filter(ef =>
      tiposConfliantes[novoEfeito].includes(ef)
    );

    if (conflitosEncontrados.length > 0) {
      resultado.compativel = false;
      resultado.conflitos = conflitosEncontrados;
      resultado.mensagem = `${novoEfeitoObj.nome} conflita com: ${conflitosEncontrados.join(', ')}`;
    }
  }

  return resultado;
}

// Exportação default
export default {
  processarEfeitoStatus,
  aplicarDanoContinuo,
  aplicarCuraContinua,
  processarEfeitoEspecial,
  obterModificadoresEfeito,
  processarEfeitoControle,
  processarEfeitoZona,
  ehDebuff,
  ehBuff,
  impedeCura,
  ehEfeitoLimpeza,
  processarMultiplosEfeitos,
  gerarDescricaoEfeito,
  verificarCompatibilidadeEfeitos
};
