// ==================== VALIDADOR DE HABILIDADES ====================
// Arquivo: /app/avatares/sistemas/utils/abilityValidator.js
// Validações relacionadas ao uso de habilidades

/**
 * Valida se avatar pode usar uma habilidade
 * Verifica requisitos de nível, vínculo e energia
 *
 * @param {Object} avatar - Avatar que tentará usar a habilidade
 * @param {Object} habilidade - Habilidade a ser usada
 * @param {number} energiaAtual - Energia atual do avatar
 * @returns {Object} { pode_usar: boolean, motivo: string|null }
 *
 * @example
 * const resultado = podeUsarHabilidade(avatar, habilidade, 50);
 * if (resultado.pode_usar) {
 *   // Usar habilidade
 * } else {
 *   console.log(resultado.motivo); // "Requer nível 15"
 * }
 */
export function podeUsarHabilidade(avatar, habilidade, energiaAtual) {
  // Verificar nível
  if (avatar.nivel < habilidade.nivel_minimo) {
    return {
      pode_usar: false,
      motivo: `Requer nível ${habilidade.nivel_minimo}`
    };
  }

  // Verificar vínculo
  if ((avatar.vinculo || 0) < habilidade.vinculo_minimo) {
    return {
      pode_usar: false,
      motivo: `Requer vínculo ${habilidade.vinculo_minimo}`
    };
  }

  // Verificar energia
  if (energiaAtual < habilidade.custo_energia) {
    return {
      pode_usar: false,
      motivo: `Energia insuficiente (${energiaAtual}/${habilidade.custo_energia})`
    };
  }

  return { pode_usar: true, motivo: null };
}

/**
 * Valida se o avatar tem energia suficiente para usar uma habilidade
 *
 * @param {number} energiaAtual - Energia atual do avatar
 * @param {number} custEnergiaHabilidade - Custo de energia da habilidade
 * @returns {Object} { valido: boolean, deficit: number, mensagem: string }
 */
export function validarCustoEnergia(energiaAtual, custEnergiaHabilidade) {
  const valido = energiaAtual >= custEnergiaHabilidade;
  const deficit = Math.max(0, custEnergiaHabilidade - energiaAtual);

  return {
    valido: valido,
    deficit: deficit,
    mensagem: valido
      ? `Energia suficiente: ${energiaAtual}/${custEnergiaHabilidade}`
      : `Energia insuficiente. Faltam ${deficit} de energia`
  };
}

/**
 * Valida cooldown de uma habilidade
 * Retorna o tempo restante para poder usar novamente
 *
 * @param {number} cooldownRestante - Turnos restantes de cooldown
 * @returns {Object} { pode_usar: boolean, turnos_restantes: number, mensagem: string }
 */
export function validarCooldown(cooldownRestante = 0) {
  const pode_usar = cooldownRestante <= 0;

  return {
    pode_usar: pode_usar,
    turnos_restantes: Math.max(0, cooldownRestante),
    mensagem: pode_usar
      ? 'Habilidade disponível!'
      : `Cooldown ativo por mais ${Math.ceil(cooldownRestante)} turno(s)`
  };
}

/**
 * Valida se um alvo é válido para uma habilidade
 *
 * @param {Object} habilidade - Habilidade
 * @param {Object} alvoAtual - Alvo selecionado
 * @param {Object} usuario - Usuário da habilidade
 * @param {Array<Object>} aliados - Lista de aliados disponíveis
 * @param {Array<Object>} inimigos - Lista de inimigos disponíveis
 * @returns {Object} { valido: boolean, motivo: string }
 */
export function validarAlvoHabilidade(habilidade, alvoAtual, usuario, aliados = [], inimigos = []) {
  const tipoAlvo = habilidade.alvo;

  // Habilidades de self sempre válidas
  if (tipoAlvo === 'self') {
    return { valido: true, motivo: null };
  }

  // Habilidades em inimigo único
  if (tipoAlvo === 'inimigo_unico') {
    if (!alvoAtual || !inimigos.includes(alvoAtual)) {
      return { valido: false, motivo: 'Alvo deve ser um inimigo' };
    }
  }

  // Habilidades em área de inimigos
  if (tipoAlvo === 'inimigos_area') {
    if (inimigos.length === 0) {
      return { valido: false, motivo: 'Nenhum inimigo disponível' };
    }
  }

  // Habilidades em aliado
  if (tipoAlvo === 'aliado') {
    if (!alvoAtual || !aliados.includes(alvoAtual)) {
      return { valido: false, motivo: 'Alvo deve ser um aliado' };
    }
  }

  // Habilidades em área de aliados
  if (tipoAlvo === 'aliados_area') {
    if (aliados.length === 0) {
      return { valido: false, motivo: 'Nenhum aliado disponível' };
    }
  }

  return { valido: true, motivo: null };
}

/**
 * Valida múltiplas condições de uso de habilidade de uma vez
 * Útil para validação completa antes de usar habilidade
 *
 * @param {Object} avatar - Avatar
 * @param {Object} habilidade - Habilidade
 * @param {number} energiaAtual - Energia atual
 * @param {number} cooldownRestante - Cooldown restante
 * @param {Object} alvoAtual - Alvo selecionado
 * @param {Array<Object>} aliados - Lista de aliados
 * @param {Array<Object>} inimigos - Lista de inimigos
 * @returns {Object} { pode_usar: boolean, erros: Array<string> }
 */
export function validacaoCompleta(
  avatar,
  habilidade,
  energiaAtual,
  cooldownRestante = 0,
  alvoAtual = null,
  aliados = [],
  inimigos = []
) {
  const erros = [];

  // Validar nível
  if (avatar.nivel < habilidade.nivel_minimo) {
    erros.push(`Requer nível ${habilidade.nivel_minimo}`);
  }

  // Validar vínculo
  if ((avatar.vinculo || 0) < habilidade.vinculo_minimo) {
    erros.push(`Requer vínculo ${habilidade.vinculo_minimo}`);
  }

  // Validar energia
  const validacaoEnergia = validarCustoEnergia(energiaAtual, habilidade.custo_energia);
  if (!validacaoEnergia.valido) {
    erros.push(validacaoEnergia.mensagem);
  }

  // Validar cooldown
  const validacaoCooldown = validarCooldown(cooldownRestante);
  if (!validacaoCooldown.pode_usar) {
    erros.push(validacaoCooldown.mensagem);
  }

  // Validar alvo
  const validacaoAlvo = validarAlvoHabilidade(
    habilidade,
    alvoAtual,
    avatar,
    aliados,
    inimigos
  );
  if (!validacaoAlvo.valido) {
    erros.push(validacaoAlvo.motivo);
  }

  return {
    pode_usar: erros.length === 0,
    erros: erros
  };
}

/**
 * Retorna todas as validações detalhadas de uma habilidade
 * Útil para mostrar ao usuário por que não pode usar
 *
 * @param {Object} avatar - Avatar
 * @param {Object} habilidade - Habilidade
 * @param {number} energiaAtual - Energia atual
 * @param {number} cooldownRestante - Cooldown restante
 * @returns {Object} Detalhes de todas as validações
 */
export function obterDetalhesValidacao(avatar, habilidade, energiaAtual, cooldownRestante = 0) {
  return {
    nivel: {
      requerido: habilidade.nivel_minimo,
      atual: avatar.nivel,
      valido: avatar.nivel >= habilidade.nivel_minimo
    },
    vinculo: {
      requerido: habilidade.vinculo_minimo,
      atual: avatar.vinculo || 0,
      valido: (avatar.vinculo || 0) >= habilidade.vinculo_minimo
    },
    energia: {
      ...validarCustoEnergia(energiaAtual, habilidade.custo_energia),
      requerido: habilidade.custo_energia,
      atual: energiaAtual
    },
    cooldown: {
      ...validarCooldown(cooldownRestante),
      cooldownTotal: habilidade.cooldown
    }
  };
}

// Exportação default
export default {
  podeUsarHabilidade,
  validarCustoEnergia,
  validarCooldown,
  validarAlvoHabilidade,
  validacaoCompleta,
  obterDetalhesValidacao
};
