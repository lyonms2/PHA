/**
 * Motor de IA para batalhas PVP
 * Simula comportamento humano realista
 */

/**
 * Personalidades de IA com diferentes estratégias
 */
const PERSONALIDADES = {
  AGRESSIVO: {
    nome: 'Agressivo',
    prioridades: {
      ataque: 0.7,
      habilidade: 0.2,
      defesa: 0.05,
      cura: 0.05
    },
    limiar_hp_critico: 20, // Só defende/cura se HP < 20%
    usa_habilidade_sempre_que_possivel: true
  },
  DEFENSIVO: {
    nome: 'Defensivo',
    prioridades: {
      ataque: 0.3,
      habilidade: 0.2,
      defesa: 0.3,
      cura: 0.2
    },
    limiar_hp_critico: 60, // Começa a defender cedo
    economiza_energia: true
  },
  TATICO: {
    nome: 'Tático',
    prioridades: {
      ataque: 0.4,
      habilidade: 0.4,
      defesa: 0.15,
      cura: 0.05
    },
    limiar_hp_critico: 40,
    analisa_fraquezas: true,
    usa_contra_elemento: true
  },
  EQUILIBRADO: {
    nome: 'Equilibrado',
    prioridades: {
      ataque: 0.45,
      habilidade: 0.25,
      defesa: 0.2,
      cura: 0.1
    },
    limiar_hp_critico: 35,
    varia_estrategia: true
  },
  IMPREVISIVEL: {
    nome: 'Imprevisível',
    prioridades: {
      ataque: 0.35,
      habilidade: 0.35,
      defesa: 0.15,
      cura: 0.15
    },
    limiar_hp_critico: 30,
    randomiza_tudo: true
  }
};

/**
 * Tabela de vantagem de elementos
 */
const VANTAGEM_ELEMENTO = {
  'Fogo': { forte_contra: 'Vento', fraco_contra: 'Água' },
  'Água': { forte_contra: 'Fogo', fraco_contra: 'Terra' },
  'Terra': { forte_contra: 'Água', fraco_contra: 'Vento' },
  'Vento': { forte_contra: 'Terra', fraco_contra: 'Fogo' },
  'Luz': { forte_contra: 'Trevas', fraco_contra: 'Trevas' },
  'Trevas': { forte_contra: 'Luz', fraco_contra: 'Luz' }
};

/**
 * Escolhe personalidade aleatória para a IA
 */
export function escolherPersonalidade() {
  const tipos = Object.keys(PERSONALIDADES);
  const tipo = tipos[Math.floor(Math.random() * tipos.length)];
  return { tipo, config: PERSONALIDADES[tipo] };
}

/**
 * Calcula HP percentual
 */
function calcularHpPercent(hpAtual, hpMaximo) {
  return (hpAtual / hpMaximo) * 100;
}

/**
 * Verifica se tem vantagem de elemento
 */
function temVantagemElemento(meuElemento, elementoInimigo) {
  const vantagem = VANTAGEM_ELEMENTO[meuElemento];
  if (!vantagem) return false;
  return vantagem.forte_contra === elementoInimigo;
}

/**
 * Verifica se está em desvantagem de elemento
 */
function temDesvantagemElemento(meuElemento, elementoInimigo) {
  const vantagem = VANTAGEM_ELEMENTO[meuElemento];
  if (!vantagem) return false;
  return vantagem.fraco_contra === elementoInimigo;
}

/**
 * Filtra habilidades disponíveis (energia suficiente, cooldown pronto)
 */
function filtrarHabilidadesDisponiveis(habilidades, energiaAtual, cooldowns = {}) {
  return habilidades.filter(hab => {
    const custoEnergia = hab.custo_energia || 0;
    const cooldownAtivo = cooldowns[hab.nome] || 0;
    return energiaAtual >= custoEnergia && cooldownAtivo === 0;
  });
}

/**
 * Escolhe melhor habilidade baseado na situação
 */
function escolherMelhorHabilidade(habilidades, situacao, personalidade) {
  const { hpPercent, elementoInimigo, energiaAtual } = situacao;

  let melhorHabilidade = null;
  let melhorPontuacao = -1;

  habilidades.forEach(hab => {
    let pontuacao = 0;

    // Priorizar cura se HP baixo
    if (hab.tipo === 'Cura' && hpPercent < personalidade.limiar_hp_critico) {
      pontuacao += 100;
    }

    // Priorizar ofensiva se HP alto
    if (hab.tipo === 'Ofensiva' && hpPercent > 60) {
      pontuacao += 50;
    }

    // Bonus por contra-elemento
    if (personalidade.analisa_fraquezas && hab.elemento) {
      if (temVantagemElemento(hab.elemento, elementoInimigo)) {
        pontuacao += 30;
      }
    }

    // Bonus por dano alto
    if (hab.dano_base) {
      pontuacao += hab.dano_base / 10;
    }

    // Penalidade por custo alto de energia (se economiza)
    if (personalidade.economiza_energia) {
      const custoRelativo = (hab.custo_energia || 0) / energiaAtual;
      if (custoRelativo > 0.5) {
        pontuacao -= 20;
      }
    }

    // Adicionar aleatoriedade
    if (personalidade.randomiza_tudo) {
      pontuacao += Math.random() * 50 - 25;
    } else {
      pontuacao += Math.random() * 10 - 5;
    }

    if (pontuacao > melhorPontuacao) {
      melhorPontuacao = pontuacao;
      melhorHabilidade = hab;
    }
  });

  return melhorHabilidade;
}

/**
 * Decide próxima ação da IA
 *
 * @param {Object} estadoBatalha - Estado atual da batalha
 * @param {Object} avatarIA - Avatar da IA
 * @param {Object} avatarOponente - Avatar do oponente
 * @param {Object} personalidade - Personalidade da IA
 * @param {Object} cooldowns - Cooldowns ativos
 * @returns {Object} Ação decidida { tipo, habilidade?, razao }
 */
export function decidirProximaAcao(estadoBatalha, avatarIA, avatarOponente, personalidade, cooldowns = {}) {
  const { hpAtual, hpMaximo, energia } = estadoBatalha.ia;
  const hpPercent = calcularHpPercent(hpAtual, hpMaximo);

  const situacao = {
    hpPercent,
    hpOponentePercent: calcularHpPercent(estadoBatalha.jogador.hpAtual, estadoBatalha.jogador.hpMaximo),
    energiaAtual: energia,
    elementoIA: avatarIA.elemento,
    elementoInimigo: avatarOponente.elemento,
    turno: estadoBatalha.turnoAtual
  };

  // 1. SITUAÇÃO CRÍTICA - HP muito baixo
  if (hpPercent < personalidade.limiar_hp_critico) {
    // Tentar habilidade de cura
    const habilidadesCura = avatarIA.habilidades.filter(h =>
      h.tipo === 'Cura' || h.efeitos_status?.some(e => e.tipo === 'cura')
    );
    const curasDisponiveis = filtrarHabilidadesDisponiveis(habilidadesCura, energia, cooldowns);

    if (curasDisponiveis.length > 0) {
      return {
        tipo: 'habilidade',
        habilidade: curasDisponiveis[0],
        razao: 'HP crítico - usando cura'
      };
    }

    // Se não tem cura, defender
    if (Math.random() < 0.7) {
      return {
        tipo: 'defender',
        razao: 'HP crítico - defendendo'
      };
    }
  }

  // 2. OPONENTE QUASE MORTO - Tentar finalizar
  if (situacao.hpOponentePercent < 25 && hpPercent > 30) {
    const habilidadesOfensivas = avatarIA.habilidades.filter(h =>
      h.tipo === 'Ofensiva' && h.dano_base > 0
    );
    const ofensivasDisponiveis = filtrarHabilidadesDisponiveis(habilidadesOfensivas, energia, cooldowns);

    if (ofensivasDisponiveis.length > 0) {
      // Escolher a mais forte
      const maisForte = ofensivasDisponiveis.reduce((prev, current) =>
        (current.dano_base > prev.dano_base) ? current : prev
      );
      return {
        tipo: 'habilidade',
        habilidade: maisForte,
        razao: 'Oponente quase morto - finalizando'
      };
    }

    return {
      tipo: 'ataque',
      razao: 'Oponente quase morto - atacando'
    };
  }

  // 3. DECISÃO BASEADA EM PERSONALIDADE
  const habilidadesDisponiveis = filtrarHabilidadesDisponiveis(avatarIA.habilidades, energia, cooldowns);

  // Ajustar prioridades baseado na situação
  let prioridades = { ...personalidade.prioridades };

  // Se energia baixa, reduzir uso de habilidades
  if (energia < 30) {
    prioridades.habilidade *= 0.3;
    prioridades.ataque *= 1.5;
  }

  // Se imprevisível, randomizar prioridades
  if (personalidade.randomiza_tudo && Math.random() < 0.3) {
    const acoes = ['ataque', 'habilidade', 'defesa'];
    const acaoAleatoria = acoes[Math.floor(Math.random() * acoes.length)];

    if (acaoAleatoria === 'habilidade' && habilidadesDisponiveis.length > 0) {
      const habAleatoria = habilidadesDisponiveis[Math.floor(Math.random() * habilidadesDisponiveis.length)];
      return {
        tipo: 'habilidade',
        habilidade: habAleatoria,
        razao: 'Ação imprevisível'
      };
    }

    return {
      tipo: acaoAleatoria === 'defesa' ? 'defender' : 'ataque',
      razao: 'Ação imprevisível'
    };
  }

  // Escolher ação baseado em pesos
  const rand = Math.random();
  let acumulado = 0;

  if (rand < (acumulado += prioridades.ataque)) {
    return {
      tipo: 'ataque',
      razao: 'Estratégia: ataque básico'
    };
  }

  if (rand < (acumulado += prioridades.habilidade)) {
    if (habilidadesDisponiveis.length > 0) {
      const habilidade = escolherMelhorHabilidade(habilidadesDisponiveis, situacao, personalidade);
      return {
        tipo: 'habilidade',
        habilidade,
        razao: 'Estratégia: usando habilidade'
      };
    }
    // Fallback para ataque se não tem habilidade
    return {
      tipo: 'ataque',
      razao: 'Sem habilidades disponíveis - atacando'
    };
  }

  if (rand < (acumulado += prioridades.defesa)) {
    return {
      tipo: 'defender',
      razao: 'Estratégia: defesa'
    };
  }

  // Fallback
  return {
    tipo: 'ataque',
    razao: 'Ação padrão'
  };
}

/**
 * Simula "tempo de pensamento" humano (delay aleatório)
 */
export function calcularTempoDecisao(personalidade) {
  const base = 1000; // 1 segundo base
  const variacao = Math.random() * 1000; // 0-1 segundo extra

  if (personalidade.randomiza_tudo) {
    return base + variacao * 2; // Imprevisível demora mais
  }

  return base + variacao;
}

/**
 * Decide se IA deve fugir
 */
export function deveIAFugir(estadoBatalha, personalidade) {
  const { hpAtual, hpMaximo } = estadoBatalha.ia;
  const hpPercent = calcularHpPercent(hpAtual, hpMaximo);

  // Só considera fugir se HP muito baixo
  if (hpPercent > 15) return false;

  // Personalidades diferentes têm diferentes chances de fugir
  if (personalidade.tipo === 'AGRESSIVO') {
    return Math.random() < 0.1; // 10% chance (nunca desiste)
  }

  if (personalidade.tipo === 'DEFENSIVO') {
    return Math.random() < 0.6; // 60% chance (foge fácil)
  }

  // Outros: 30% chance
  return Math.random() < 0.3;
}

/**
 * Decide se IA deve se render
 */
export function deveIARender(estadoBatalha, personalidade) {
  const { hpAtual, hpMaximo } = estadoBatalha.ia;
  const hpPercent = calcularHpPercent(hpAtual, hpMaximo);

  // Só considera render se HP baixíssimo
  if (hpPercent > 10) return false;

  // IA prefere render a fugir (mais seguro)
  if (personalidade.tipo === 'DEFENSIVO') {
    return Math.random() < 0.8; // 80% chance
  }

  if (personalidade.tipo === 'AGRESSIVO') {
    return Math.random() < 0.05; // 5% chance (quase nunca)
  }

  return Math.random() < 0.5; // 50% chance
}

/**
 * Versão simplificada para escolher ação da IA
 * Usado em batalhas contra IA e bosses
 *
 * @param {Object} avatarIA - Avatar da IA
 * @param {Object} avatarOponente - Avatar do oponente (jogador)
 * @param {Object} personalidade - Personalidade da IA
 * @param {Object} cooldowns - Cooldowns ativos { nomeHabilidade: turnos }
 * @returns {Object} { acao: 'attack'|'defend'|'ability', habilidadeIndex?: number }
 */
export function escolherAcaoIA(avatarIA, avatarOponente, personalidade, cooldowns = {}) {
  const hpPercent = (avatarIA.hp / avatarIA.hp_max) * 100;
  const hpOponentePercent = (avatarOponente.hp / avatarOponente.hp_max) * 100;
  const energia = avatarIA.energy || 100;

  const config = typeof personalidade === 'object' && personalidade.config
    ? personalidade.config
    : PERSONALIDADES.EQUILIBRADO;

  console.log('🤖 [IA] Decisão:', {
    hp: Math.floor(hpPercent) + '%',
    energia,
    hpOponente: Math.floor(hpOponentePercent) + '%'
  });

  // 1. ENERGIA CRÍTICA - SEMPRE DEFENDER PARA RECUPERAR
  // Ataque básico custa 10, então se < 30 precisa defender
  if (energia < 30) {
    console.log('⚡ [IA] Energia baixa (<30) - DEFENDENDO para recuperar');
    return { acao: 'defend' };
  }

  // 2. HP CRÍTICO - priorizar defesa/cura
  if (hpPercent < config.limiar_hp_critico) {
    // Tentar usar habilidade de cura
    if (avatarIA.habilidades && avatarIA.habilidades.length > 0) {
      for (let i = 0; i < avatarIA.habilidades.length; i++) {
        const hab = avatarIA.habilidades[i];
        const custo = hab.custo_energia || 20;
        const emCooldown = cooldowns[hab.nome] > 0;

        if (hab.tipo === 'Suporte' && energia >= custo && !emCooldown) {
          console.log('💚 [IA] HP crítico - usando cura:', hab.nome);
          return { acao: 'ability', habilidadeIndex: i };
        }
      }
    }

    // Se não tem cura, 80% chance de defender
    if (Math.random() < 0.8) {
      console.log('🛡️ [IA] HP crítico - defendendo');
      return { acao: 'defend' };
    }
  }

  // 3. ENERGIA MODERADA - recuperar ocasionalmente para não ficar sem
  // Entre 30-50 de energia, chance de defender preventivamente
  if (energia < 50 && Math.random() < 0.3) {
    console.log('⚡ [IA] Energia moderada (30-50) - defendendo preventivamente');
    return { acao: 'defend' };
  }

  // 4. OPONENTE QUASE MORTO - tentar finalizar
  if (hpOponentePercent < 25 && hpPercent > 30) {
    // Procurar habilidade ofensiva mais forte
    if (avatarIA.habilidades && avatarIA.habilidades.length > 0) {
      let melhorHab = -1;
      let maiorDano = 0;

      for (let i = 0; i < avatarIA.habilidades.length; i++) {
        const hab = avatarIA.habilidades[i];
        const custo = hab.custo_energia || 20;
        const dano = hab.dano_base || 0;
        const emCooldown = cooldowns[hab.nome] > 0;

        if (hab.tipo === 'Ofensiva' && energia >= custo && !emCooldown && dano > maiorDano) {
          melhorHab = i;
          maiorDano = dano;
        }
      }

      if (melhorHab >= 0) {
        console.log('💀 [IA] Oponente quase morto - finalizando com habilidade');
        return { acao: 'ability', habilidadeIndex: melhorHab };
      }
    }

    console.log('⚔️ [IA] Oponente quase morto - atacando');
    return { acao: 'attack' };
  }

  // 5. DECISÃO BASEADA EM PERSONALIDADE
  const rand = Math.random();
  let acumulado = 0;

  // Chance de ataque (só se tem energia >= 10)
  if (rand < (acumulado += config.prioridades.ataque)) {
    if (energia >= 10) {
      console.log('⚔️ [IA] Ataque básico');
      return { acao: 'attack' };
    } else {
      console.log('⚠️ [IA] Queria atacar mas sem energia - defendendo');
      return { acao: 'defend' };
    }
  }

  // Chance de habilidade
  if (rand < (acumulado += config.prioridades.habilidade)) {
    if (avatarIA.habilidades && avatarIA.habilidades.length > 0) {
      // Escolher habilidade disponível aleatória (verificando energia E cooldown)
      const habilidadesDisponiveis = [];

      for (let i = 0; i < avatarIA.habilidades.length; i++) {
        const hab = avatarIA.habilidades[i];
        const custo = hab.custo_energia || 20;
        const emCooldown = cooldowns[hab.nome] > 0;

        if (energia >= custo && !emCooldown) {
          habilidadesDisponiveis.push(i);
        }
      }

      if (habilidadesDisponiveis.length > 0) {
        const indiceEscolhido = habilidadesDisponiveis[
          Math.floor(Math.random() * habilidadesDisponiveis.length)
        ];
        console.log('✨ [IA] Usando habilidade:', avatarIA.habilidades[indiceEscolhido].nome);
        return { acao: 'ability', habilidadeIndex: indiceEscolhido };
      }
    }

    // Sem habilidades disponíveis, defender para recuperar
    console.log('⚠️ [IA] Queria usar habilidade mas nenhuma disponível - defendendo');
    return { acao: 'defend' };
  }

  // Chance de defesa
  if (rand < (acumulado += config.prioridades.defesa)) {
    console.log('🛡️ [IA] Defesa estratégica');
    return { acao: 'defend' };
  }

  // Fallback: atacar (se tem energia) ou defender
  if (energia >= 10) {
    console.log('⚔️ [IA] Fallback - atacando');
    return { acao: 'attack' };
  } else {
    console.log('🛡️ [IA] Fallback - sem energia para atacar, defendendo');
    return { acao: 'defend' };
  }
}
