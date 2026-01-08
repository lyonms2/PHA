// ==================== MOTOR DE BATALHA ====================
// Arquivo: /lib/arena/batalhaEngine.js

import { calcularVantagemElemental } from '../../app/avatares/sistemas/elementalSystem';
import { calcularDanoHabilidade } from '../../app/avatares/sistemas/abilitiesSystem';
import { calcularHPMaximoCompleto } from '../combat/statsCalculator';
import { getNivelExaustao, aplicarPenalidadesExaustao } from '../../app/avatares/sistemas/exhaustionSystem';
import { aplicarBonusVinculo, getNivelVinculo } from '../../app/avatares/sistemas/bondSystem';

/**
 * Configurações da batalha
 */
export const CONFIG_BATALHA = {
  ENERGIA_INICIAL: 100,
  ENERGIA_MAXIMA: 100,
  ENERGIA_POR_DEFENDER: 20,        // Apenas defender recupera energia
  CUSTO_ATAQUE_BASICO: 10,         // Ataque básico consome energia
  RODADAS_MAXIMAS: 20,
  CHANCE_CRITICO_BASE: 0.05, // 5%
  MULTIPLICADOR_CRITICO: 2.0,
  TEMPO_TURNO: 30000, // 30 segundos
};

/**
 * Calcula HP máximo do avatar
 * @deprecated Use calcularHPMaximoCompleto de statsCalculator.js
 */
export function calcularHPMaximo(avatar) {
  return calcularHPMaximoCompleto(avatar);
}

/**
 * Calcula dano de uma habilidade
 */
export function calcularDano(atacante, habilidade, defensor, critico = false) {
  // Dano base da habilidade
  let dano = habilidade.dano_base || 30;
  
  // Aplica multiplicador do stat primário
  const statValue = atacante[habilidade.stat_primario] || atacante.forca;
  dano += statValue * (habilidade.multiplicador_stat || 1.0);
  
  // Bônus de nível
  dano += atacante.nivel * 2;
  
  // Vantagem elemental
  const vantagemElemental = calcularVantagemElemental(atacante.elemento, defensor.elemento);
  dano *= vantagemElemental;
  
  // Crítico
  if (critico) {
    dano *= CONFIG_BATALHA.MULTIPLICADOR_CRITICO;
  }
  
  // Defesa do oponente (reduz até 50% do dano)
  let reducao = Math.min(defensor.resistencia * 0.5, dano * 0.5);

  // Verificar se defensor tem buff de defesa
  if (defensor.buffs && defensor.buffs.length > 0) {
    const buffDefesa = defensor.buffs.find(b => b.tipo === 'defesa');
    if (buffDefesa) {
      reducao *= (1 + buffDefesa.valor / 100); // Aumenta a redução
    }
  }

  dano -= reducao;
  
  // Bônus de vínculo (se avatar do jogador)
  if (atacante.vinculo >= 80) {
    dano *= 1.2; // +20% com vínculo alto
  } else if (atacante.vinculo >= 60) {
    dano *= 1.1; // +10%
  }
  
  // Penalidade de exaustão
  if (atacante.exaustao >= 80) {
    dano *= 0.5; // -50% se exausto
  } else if (atacante.exaustao >= 60) {
    dano *= 0.75; // -25%
  }
  
  return Math.max(1, Math.floor(dano));
}

/**
 * Calcula chance de crítico COMPLETA para combate
 * IMPORTANTE: Esta é a versão completa usada em batalhas.
 * Considera foco, vínculo, exaustão e outros modificadores de combate.
 * Para stats base (exibição), use calcularChanceCritico() de statsSystem.js
 *
 * @param {Object} avatar - Avatar completo com stats e estados
 * @returns {number} Chance de crítico (0-0.5, ou 0-50%)
 *
 * Fórmula:
 * - Base: 5% (CONFIG_BATALHA.CHANCE_CRITICO_BASE)
 * - +0.3% por ponto de foco
 * - +10% se vínculo >= 80 (Alma Gêmea)
 * - ×0.5 (50% de redução) se exaustão >= 60
 * - Cap máximo: 50%
 *
 * @see {@link ../../app/avatares/sistemas/statsSystem.js#calcularChanceCritico} Para versão base/simplificada
 */
export function calcularChanceCritico(avatar) {
  let chance = CONFIG_BATALHA.CHANCE_CRITICO_BASE;

  // Foco aumenta crítico
  chance += avatar.foco * 0.003; // +0.3% por ponto de foco

  // Vínculo alto aumenta
  if (avatar.vinculo >= 80) {
    chance += 0.10; // +10%
  }

  // Exaustão reduz
  if (avatar.exaustao >= 60) {
    chance *= 0.5;
  }

  return Math.min(chance, 0.5); // Cap de 50%
}

/**
 * Verifica se o ataque foi crítico
 */
export function isCritico(avatar) {
  const chance = calcularChanceCritico(avatar);
  return Math.random() < chance;
}

/**
 * Aplica efeitos de status de uma habilidade
 * @param {Object} habilidade - Habilidade usada
 * @param {Object} alvo - Alvo que receberá os efeitos
 * @param {Object} atacante - Quem usou a habilidade (para efeitos em self)
 * @returns {Array} Lista de efeitos aplicados
 */
export function aplicarEfeitosStatus(habilidade, alvo, atacante) {
  const efeitosAplicados = [];

  if (!habilidade.efeitos_status || habilidade.efeitos_status.length === 0) {
    return efeitosAplicados;
  }

  console.group('✨ Aplicando Efeitos de Status');
  console.log(`🎯 Habilidade: ${habilidade.nome}`);
  console.log(`📝 Efeitos a aplicar: ${habilidade.efeitos_status.join(', ')}`);

  // Importar efeitos de status do sistema de habilidades
  const EFEITOS_STATUS = {
    // Dano contínuo
    queimadura: { nome: 'Queimadura', tipo: 'dano_continuo', dano_por_turno: 0.05, icone: '🔥' },
    queimadura_intensa: { nome: 'Queimadura Intensa', tipo: 'dano_continuo', dano_por_turno: 0.10, icone: '🔥🔥' },
    afogamento: { nome: 'Afogamento', tipo: 'dano_continuo', dano_por_turno: 0.08, icone: '💧' },
    maldito: { nome: 'Maldito', tipo: 'dano_continuo', dano_por_turno: 0.07, impede_cura: true, icone: '💀' },
    vendaval_cortante: { nome: 'Vendaval Cortante', tipo: 'dano_continuo', dano_por_turno: 0.06, icone: '🌪️' },
    fissuras_explosivas: { nome: 'Fissuras Explosivas', tipo: 'dano_continuo', dano_por_turno: 0.06, icone: '💥' },
    eletrocucao: { nome: 'Eletrocução', tipo: 'dano_continuo', dano_por_turno: 0.06, icone: '⚡💀' },

    // Cura contínua
    regeneracao: { nome: 'Regeneração', tipo: 'cura_continua', cura_por_turno: 0.05, icone: '💚' },
    auto_cura: { nome: 'Auto-Cura', tipo: 'cura_continua', cura_por_turno: 0.08, icone: '💚✨' },
    cura_massiva_aliados: { nome: 'Cura Massiva', tipo: 'cura_continua', cura_por_turno: 0.10, icone: '💚💫' },

    // Buffs
    defesa_aumentada: { nome: 'Defesa Aumentada', tipo: 'buff', bonus_resistencia: 0.50, icone: '🛡️' },
    evasao_aumentada: { nome: 'Evasão Aumentada', tipo: 'buff', bonus_evasao: 0.30, icone: '💨' },
    velocidade_aumentada: { nome: 'Velocidade Aumentada', tipo: 'buff', bonus_agilidade: 0.40, icone: '⚡' },
    bencao: { nome: 'Benção', tipo: 'buff', bonus_todos_stats: 0.20, icone: '✨' },
    sobrecarga: { nome: 'Sobrecarga', tipo: 'buff_risco', bonus_foco: 0.60, reducao_resistencia: 0.30, icone: '⚡🔴' },
    precisao_aumentada: { nome: 'Precisão Aumentada', tipo: 'buff', bonus_acerto: 0.30, icone: '🎯' },

    // Debuffs
    lentidao: { nome: 'Lentidão', tipo: 'debuff', reducao_agilidade: 0.40, icone: '🐌' },
    enfraquecido: { nome: 'Enfraquecido', tipo: 'debuff', reducao_stats: 0.25, icone: '⬇️' },
    desorientado: { nome: 'Desorientado', tipo: 'debuff', reducao_acerto: 0.30, icone: '🌀' },
    stats_reduzidos: { nome: 'Stats Reduzidos', tipo: 'debuff', reducao_stats: 0.30, icone: '📉' },
    terror: { nome: 'Terror', tipo: 'debuff', reducao_stats: 0.35, icone: '😱' },
    empurrao: { nome: 'Empurrão', tipo: 'debuff', reducao_acerto: 0.20, icone: '🌊' },

    // Controle
    congelado: { nome: 'Congelado', tipo: 'controle', efeito: 'impede_acao', icone: '❄️' },
    atordoado: { nome: 'Atordoado', tipo: 'controle', efeito: 'pula_turno', icone: '💫' },
    paralisia: { nome: 'Paralisia', tipo: 'controle', chance_falha: 0.30, icone: '⚡' },
    paralisia_intensa: { nome: 'Paralisia Intensa', tipo: 'controle', chance_falha: 0.60, icone: '⚡⚡' },

    // Especiais
    invisivel: { nome: 'Invisível', tipo: 'defensivo', evasao_total: true, icone: '👻' },
    queimadura_contra_ataque: { nome: 'Escudo Flamejante', tipo: 'especial', contra_ataque_queimadura: true, icone: '🔥🛡️' },
    roubo_vida: { nome: 'Roubo de Vida', tipo: 'especial', percentual_roubo: 0.15, icone: '🩸' },
    roubo_vida_intenso: { nome: 'Roubo de Vida Intenso', tipo: 'especial', percentual_roubo: 0.30, icone: '🩸🩸' },
    roubo_vida_massivo: { nome: 'Roubo de Vida Massivo', tipo: 'especial', percentual_roubo: 0.50, icone: '🩸💀' },
    perfuracao: { nome: 'Perfuração', tipo: 'especial', ignora_defesa: 0.40, icone: '🗡️' },
    execucao: { nome: 'Execução', tipo: 'especial', bonus_baixo_hp: 0.50, limite_hp: 0.30, icone: '💀' },
    dano_massivo_inimigos: { nome: 'Dano Massivo', tipo: 'especial', multiplicador_dano: 1.5, icone: '💥💥' },
    campo_eletrico: { nome: 'Campo Elétrico', tipo: 'zona', dano_entrada: 20, icone: '⚡🔷' },
    limpar_debuffs: { nome: 'Purificação', tipo: 'utility', limpa_debuffs: true, icone: '✨🔆' }
  };

  habilidade.efeitos_status.forEach(efeitoNome => {
    const efeitoInfo = EFEITOS_STATUS[efeitoNome];

    if (!efeitoInfo) {
      console.warn(`⚠️ Efeito desconhecido: ${efeitoNome}`);
      return;
    }

    // Determinar duração
    const duracao = habilidade.duracao_efeito || 3;

    // Criar o efeito
    const efeito = {
      nome: efeitoInfo.nome,
      tipo: efeitoInfo.tipo,
      turnos: duracao,
      icone: efeitoInfo.icone,
      ...efeitoInfo
    };

    // Processar efeito de utility (limpar debuffs)
    if (efeitoInfo.tipo === 'utility' && efeitoInfo.limpa_debuffs) {
      if (atacante.debuffs) {
        const debuffsRemovidos = atacante.debuffs.length;
        atacante.debuffs = [];
        console.log(`🧹 ${debuffsRemovidos} debuffs removidos de ${atacante.nome}`);
        efeitosAplicados.push({ alvo: 'atacante', efeito: 'Debuffs Removidos', icone: efeitoInfo.icone });
      }
    }
    // Aplicar no alvo correto (self vs inimigo)
    else if (habilidade.alvo === 'self' || efeitoInfo.tipo === 'buff' || efeitoInfo.tipo === 'defensivo' || efeitoInfo.tipo === 'cura_continua') {
      // Efeitos positivos vão para o atacante
      if (!atacante.buffs) atacante.buffs = [];
      atacante.buffs.push(efeito);
      console.log(`💪 ${efeitoInfo.icone} ${efeitoInfo.nome} aplicado em ${atacante.nome} por ${duracao} turno(s)`);
      efeitosAplicados.push({ alvo: 'atacante', efeito: efeitoInfo.nome, icone: efeitoInfo.icone });
    } else {
      // Efeitos negativos vão para o alvo
      if (!alvo.debuffs) alvo.debuffs = [];
      alvo.debuffs.push(efeito);
      console.log(`💀 ${efeitoInfo.icone} ${efeitoInfo.nome} aplicado em ${alvo.nome} por ${duracao} turno(s)`);
      efeitosAplicados.push({ alvo: 'defensor', efeito: efeitoInfo.nome, icone: efeitoInfo.icone });
    }
  });

  // Log final com resumo
  console.log('%c✅ Efeitos Aplicados com Sucesso', 'color: #00ff00; font-weight: bold');
  console.table(efeitosAplicados.map(e => ({
    'Alvo': e.alvo === 'atacante' ? atacante.nome : alvo.nome,
    'Efeito': e.icone + ' ' + e.efeito
  })));
  console.groupEnd();

  return efeitosAplicados;
}

/**
 * Calcula modificadores de stats baseados em buffs/debuffs
 * @param {Object} avatar - Avatar com buffs/debuffs
 * @returns {Object} Modificadores aplicados
 */
export function calcularModificadoresStats(avatar) {
  const mods = {
    forca: 1.0,
    agilidade: 1.0,
    resistencia: 1.0,
    foco: 1.0,
    evasao: 0,
    acerto: 1.0
  };

  // Processar buffs
  if (avatar.buffs && avatar.buffs.length > 0) {
    avatar.buffs.forEach(buff => {
      if (buff.bonus_todos_stats) {
        mods.forca += buff.bonus_todos_stats;
        mods.agilidade += buff.bonus_todos_stats;
        mods.resistencia += buff.bonus_todos_stats;
        mods.foco += buff.bonus_todos_stats;
      }
      if (buff.bonus_resistencia) mods.resistencia += buff.bonus_resistencia;
      if (buff.bonus_agilidade) mods.agilidade += buff.bonus_agilidade;
      if (buff.bonus_foco) mods.foco += buff.bonus_foco;
      if (buff.bonus_evasao) mods.evasao += buff.bonus_evasao;
      if (buff.bonus_acerto) mods.acerto += buff.bonus_acerto;
      if (buff.evasao_total) mods.evasao = 1.0; // 100% evasão
    });
  }

  // Processar debuffs
  if (avatar.debuffs && avatar.debuffs.length > 0) {
    avatar.debuffs.forEach(debuff => {
      if (debuff.reducao_stats) {
        mods.forca -= debuff.reducao_stats;
        mods.agilidade -= debuff.reducao_stats;
        mods.resistencia -= debuff.reducao_stats;
        mods.foco -= debuff.reducao_stats;
      }
      if (debuff.reducao_agilidade) mods.agilidade -= debuff.reducao_agilidade;
      if (debuff.reducao_resistencia) mods.resistencia -= debuff.reducao_resistencia;
      if (debuff.reducao_acerto) mods.acerto -= debuff.reducao_acerto;
    });
  }

  return mods;
}

/**
 * Processa o uso de uma habilidade
 */
export function usarHabilidade(atacante, habilidade, defensor, estado) {
  console.log('%c═══════════════════════════════════════════════════════', 'color: #00ff00; font-weight: bold');
  console.log('%c⚔️ HABILIDADE USADA: ' + habilidade.nome, 'color: #ffaa00; font-size: 14px; font-weight: bold');
  console.log('%c═══════════════════════════════════════════════════════', 'color: #00ff00; font-weight: bold');

  const resultado = {
    sucesso: false,
    mensagem: '',
    dano: 0,
    cura: 0,
    critico: false,
    energiaGasta: 0,
    energiaRecuperada: 0,
    efeitosAplicados: [],
    novoHP: defensor.hp_atual,
    novoHPAtacante: atacante.hp_atual,
    novaEnergia: atacante.energia_atual,
  };

  // Log da habilidade
  console.group('📋 Informações da Habilidade');
  console.table({
    'Nome': habilidade.nome,
    'Tipo': habilidade.tipo,
    'Dano Base': habilidade.dano_base,
    'Multiplicador': habilidade.multiplicador_stat + 'x ' + habilidade.stat_primario,
    'Custo Energia': habilidade.custo_energia,
    'Cooldown': habilidade.cooldown,
    'Efeitos': habilidade.efeitos_status?.join(', ') || 'Nenhum'
  });
  console.groupEnd();

  // Verificar energia suficiente
  const custoEnergia = habilidade.custo_energia || 20;
  console.log(`⚡ Energia: ${atacante.energia_atual}/${CONFIG_BATALHA.ENERGIA_MAXIMA} (Custo: ${custoEnergia})`);

  if (atacante.energia_atual < custoEnergia) {
    console.log('%c❌ ENERGIA INSUFICIENTE!', 'color: red; font-weight: bold');
    console.log('%c═══════════════════════════════════════════════════════', 'color: #00ff00; font-weight: bold');
    resultado.mensagem = `${atacante.nome} não tem energia suficiente!`;
    return resultado;
  }

  // Chance de falhar se vínculo baixo
  if (atacante.vinculo < 20 && Math.random() < 0.05) {
    resultado.mensagem = `${atacante.nome} hesitou e não obedeceu o comando!`;
    resultado.energiaGasta = Math.floor(custoEnergia / 2);
    resultado.novaEnergia = atacante.energia_atual - resultado.energiaGasta;
    return resultado;
  }

  // Calcular modificadores de stats
  const modsAtacante = calcularModificadoresStats(atacante);
  const modsDefensor = calcularModificadoresStats(defensor);

  // Log dos modificadores de stats
  console.group('📊 Modificadores de Stats');
  console.log(`🎯 ${atacante.nome} (Atacante):`, {
    'Buffs Ativos': atacante.buffs?.length || 0,
    'Debuffs Ativos': atacante.debuffs?.length || 0,
    'Modificadores': modsAtacante
  });
  if (atacante.buffs?.length > 0) {
    console.table(atacante.buffs.map(b => ({
      Nome: b.nome,
      Tipo: b.tipo,
      Turnos: b.turnos,
      Icone: b.icone
    })));
  }

  console.log(`🛡️ ${defensor.nome} (Defensor):`, {
    'Buffs Ativos': defensor.buffs?.length || 0,
    'Debuffs Ativos': defensor.debuffs?.length || 0,
    'Modificadores': modsDefensor
  });
  if (defensor.buffs?.length > 0) {
    console.table(defensor.buffs.map(b => ({
      Nome: b.nome,
      Tipo: b.tipo,
      Turnos: b.turnos,
      Icone: b.icone
    })));
  }
  console.groupEnd();

  // Habilidades defensivas/suporte não precisam de acerto
  const ehHabilidadeOfensiva = habilidade.tipo === 'Ofensiva' && habilidade.dano_base > 0;

  if (ehHabilidadeOfensiva) {
    // Sistema de acerto: 1d20 + Foco vs Dificuldade
    const d20 = Math.floor(Math.random() * 20) + 1; // 1-20
    const bonusFoco = Math.floor((atacante.foco * modsAtacante.foco) / 5); // +1 por cada 5 de foco
    const bonusAcerto = Math.floor(modsAtacante.acerto * 5); // Bônus de precisão
    const rolagemTotal = d20 + bonusFoco + bonusAcerto;

    // Dificuldade baseada na agilidade do defensor
    const dificuldadeBase = 10;
    const bonusEvasao = Math.floor((defensor.agilidade * modsDefensor.agilidade) / 4);
    const evasaoExtra = Math.floor(modsDefensor.evasao * 10);
    const dificuldadeTotal = dificuldadeBase + bonusEvasao + evasaoExtra;

    // Habilidades com chance_acerto: 100 sempre acertam
    const sempreAcerta = habilidade.chance_acerto === 100;

    if (!sempreAcerta && rolagemTotal < dificuldadeTotal) {
      resultado.mensagem = `🎲 ${atacante.nome} rolou ${d20}+${bonusFoco} = ${rolagemTotal} vs ${dificuldadeTotal}. ${defensor.nome} esquivou! 💨`;
      resultado.energiaGasta = habilidade.custo_energia;
      resultado.novaEnergia = atacante.energia_atual - resultado.energiaGasta;
      return resultado;
    }

    resultado.rolagem = { d20, bonusFoco, total: rolagemTotal, dificuldade: dificuldadeTotal };
  }

  // Processar habilidade baseado no tipo
  let dano = 0;
  let cura = 0;

  if (habilidade.tipo === 'Defensiva' && habilidade.dano_base === 0) {
    // Habilidade puramente defensiva (ex: Armadura de Pedra)
    resultado.sucesso = true;
    resultado.mensagem = `${atacante.nome} usou ${habilidade.nome}!`;
  } else if (habilidade.tipo === 'Suporte') {
    // Habilidade de suporte (cura, buffs, etc)
    if (habilidade.dano_base < 0) {
      // Dano negativo = cura
      cura = Math.abs(habilidade.dano_base);
      const statValue = atacante[habilidade.stat_primario] || atacante.foco;
      cura += statValue * (habilidade.multiplicador_stat || 1.0);
      cura = Math.floor(cura);

      resultado.cura = cura;
      resultado.novoHPAtacante = Math.min(atacante.hp_maximo, atacante.hp_atual + cura);
      resultado.sucesso = true;
      resultado.mensagem = `${atacante.nome} usou ${habilidade.nome}! Recuperou ${cura} HP!`;
    } else {
      resultado.sucesso = true;
      resultado.mensagem = `${atacante.nome} usou ${habilidade.nome}!`;
    }

    // Algumas habilidades de suporte recuperam energia
    if (habilidade.nome === 'Regeneração Aquática' || habilidade.efeitos_status.includes('regeneracao')) {
      resultado.energiaRecuperada = 10;
      resultado.novaEnergia = Math.min(CONFIG_BATALHA.ENERGIA_MAXIMA, atacante.energia_atual - habilidade.custo_energia + resultado.energiaRecuperada);
    }
  } else if (ehHabilidadeOfensiva) {
    // Habilidade ofensiva - calcular dano
    console.group('⚔️ Cálculo de Dano');

    const critico = isCritico(atacante);
    console.log(`💥 Crítico: ${critico ? 'SIM (x' + CONFIG_BATALHA.MULTIPLICADOR_CRITICO + ')' : 'Não'}`);

    // Aplicar modificadores aos stats do atacante
    const atacanteModificado = {
      ...atacante,
      forca: atacante.forca * modsAtacante.forca,
      agilidade: atacante.agilidade * modsAtacante.agilidade,
      resistencia: atacante.resistencia * modsAtacante.resistencia,
      foco: atacante.foco * modsAtacante.foco
    };

    // Aplicar modificadores aos stats do defensor
    let defensorModificado = {
      ...defensor,
      resistencia: defensor.resistencia * modsDefensor.resistencia
    };

    console.table({
      'Stat': {
        'Força Base': Math.floor(atacante.forca),
        'Força Modificada': Math.floor(atacanteModificado.forca),
        'Foco Base': Math.floor(atacante.foco),
        'Foco Modificado': Math.floor(atacanteModificado.foco),
        'Resistência Defensor Base': Math.floor(defensor.resistencia),
        'Resistência Defensor Modificada': Math.floor(defensorModificado.resistencia)
      }
    });

    // Verificar efeitos especiais que afetam o cálculo de dano
    let multiplicadorEspecial = 1.0;

    // Perfuração: ignora parte da defesa
    if (habilidade.efeitos_status && habilidade.efeitos_status.includes('perfuracao')) {
      defensorModificado.resistencia *= 0.6; // Ignora 40% da defesa
    }

    // Execução: mais dano em alvos com HP baixo
    if (habilidade.efeitos_status && habilidade.efeitos_status.includes('execucao')) {
      const hpPercent = defensor.hp_atual / defensor.hp_maximo;
      if (hpPercent <= 0.30) {
        multiplicadorEspecial *= 1.5; // +50% de dano
      }
    }

    // Dano massivo
    if (habilidade.efeitos_status && habilidade.efeitos_status.includes('dano_massivo_inimigos')) {
      multiplicadorEspecial *= 1.5;
    }

    dano = calcularDano(atacanteModificado, habilidade, defensorModificado, critico);
    const danoBase = dano;
    dano = Math.floor(dano * multiplicadorEspecial);

    console.log('📐 Fórmula de Dano:', {
      'Dano Base Habilidade': habilidade.dano_base,
      'Stat Primário': `${habilidade.stat_primario} (${Math.floor(atacanteModificado[habilidade.stat_primario])})`,
      'Multiplicador': habilidade.multiplicador_stat,
      'Vantagem Elemental': calcularVantagemElemental(atacante.elemento, defensor.elemento) + 'x',
      'Crítico': critico ? 'x' + CONFIG_BATALHA.MULTIPLICADOR_CRITICO : 'Não',
      'Redução Defesa': Math.floor(defensorModificado.resistencia * 0.5),
      'Dano Antes Modificadores': danoBase,
      'Modificador Especial': multiplicadorEspecial === 1.0 ? 'Nenhum' : 'x' + multiplicadorEspecial,
      'DANO FINAL': dano
    });

    // Processar múltiplos golpes
    const numGolpes = habilidade.num_golpes || 1;
    if (numGolpes > 1) {
      dano = dano * numGolpes;
      resultado.numGolpes = numGolpes;
      console.log(`🔁 Múltiplos Golpes: ${numGolpes}x = ${dano} dano total`);
    }

    // Processar roubo de vida
    let curaRouboVida = 0;
    if (habilidade.efeitos_status) {
      if (habilidade.efeitos_status.includes('roubo_vida')) {
        curaRouboVida = Math.floor(dano * 0.15);
        console.log(`🩸 Roubo de Vida: 15% de ${dano} = ${curaRouboVida} HP`);
      } else if (habilidade.efeitos_status.includes('roubo_vida_intenso')) {
        curaRouboVida = Math.floor(dano * 0.30);
        console.log(`🩸🩸 Roubo de Vida Intenso: 30% de ${dano} = ${curaRouboVida} HP`);
      } else if (habilidade.efeitos_status.includes('roubo_vida_massivo')) {
        curaRouboVida = Math.floor(dano * 0.50);
        console.log(`🩸💀 Roubo de Vida Massivo: 50% de ${dano} = ${curaRouboVida} HP`);
      }

      if (curaRouboVida > 0) {
        resultado.cura = curaRouboVida;
        resultado.novoHPAtacante = Math.min(atacante.hp_maximo, atacante.hp_atual + curaRouboVida);
      }
    }

    console.groupEnd(); // Fim do grupo Cálculo de Dano

    // Aplicar dano
    resultado.dano = dano;
    resultado.critico = critico;
    resultado.novoHP = Math.max(0, defensor.hp_atual - dano);
    resultado.sucesso = true;

    // Mensagem
    const vantagemTexto = calcularVantagemElemental(atacante.elemento, defensor.elemento);
    let vantagemMsg = '';
    if (vantagemTexto >= 1.5) vantagemMsg = ' (SUPER EFETIVO!)';
    else if (vantagemTexto <= 0.75) vantagemMsg = ' (Pouco efetivo...)';

    let golpesMsg = numGolpes > 1 ? ` (${numGolpes} golpes!)` : '';
    let rolagemMsg = resultado.rolagem ? `🎲 ${resultado.rolagem.d20}+${resultado.rolagem.bonusFoco} = ${resultado.rolagem.total} | ` : '';
    let criticoMsg = critico ? ' 💥 CRÍTICO!' : '';
    let mensagem = `${rolagemMsg}${atacante.nome} usou ${habilidade.nome}! ⚔️ ${dano} de dano${criticoMsg}${golpesMsg}${vantagemMsg}`;
    if (curaRouboVida > 0) {
      mensagem += ` 🩸 Roubou ${curaRouboVida} HP!`;
    }
    resultado.mensagem = mensagem;
  }

  // Gastar energia
  resultado.energiaGasta = habilidade.custo_energia;
  if (!resultado.energiaRecuperada) {
    resultado.novaEnergia = atacante.energia_atual - resultado.energiaGasta;
  }

  // Aplicar efeitos de status
  if (habilidade.efeitos_status && habilidade.efeitos_status.length > 0) {
    const efeitosAplicados = aplicarEfeitosStatus(habilidade, defensor, atacante);
    resultado.efeitosAplicados = efeitosAplicados;

    // Adicionar à mensagem com descrição dos efeitos
    if (efeitosAplicados.length > 0) {
      const efeitosTexto = efeitosAplicados.map(e => `${e.icone} ${e.efeito}`).join(', ');
      resultado.mensagem += ` | Efeitos: ${efeitosTexto}`;
    }
  }

  // Log final consolidado
  console.group('📋 Resultado Final');
  console.log(resultado.sucesso ? '%c✅ Habilidade executada com sucesso!' : '%c❌ Habilidade falhou', resultado.sucesso ? 'color: #00ff00; font-weight: bold' : 'color: red; font-weight: bold');
  console.table({
    'Dano Causado': resultado.dano || 0,
    'Cura Recebida': resultado.cura || 0,
    'Energia Gasta': resultado.energiaGasta,
    'HP Defensor': `${resultado.novoHP}/${defensor.hp_maximo}`,
    'HP Atacante': `${resultado.novoHPAtacante || atacante.hp_atual}/${atacante.hp_maximo}`,
    'Energia Atacante': `${resultado.novaEnergia}/${CONFIG_BATALHA.ENERGIA_MAXIMA}`,
    'Efeitos Aplicados': resultado.efeitosAplicados?.length || 0
  });
  console.groupEnd();
  console.log('%c═══════════════════════════════════════════════════════', 'color: #00ff00; font-weight: bold');

  return resultado;
}

/**
 * Ataque básico (comum)
 * Consome 10 de energia e causa menos dano que habilidades
 */
export function ataqueBasico(atacante, defensor, estado) {
  const resultado = {
    sucesso: false,
    mensagem: '',
    dano: 0,
    critico: false,
    energiaGasta: CONFIG_BATALHA.CUSTO_ATAQUE_BASICO,
    efeitosAplicados: [],
    novoHP: defensor.hp_atual,
    novaEnergia: atacante.energia_atual,
  };

  // Calcular modificadores de stats
  const modsAtacante = calcularModificadoresStats(atacante);
  const modsDefensor = calcularModificadoresStats(defensor);

  // Sistema de acerto: 1d20 + Foco vs Dificuldade
  const d20 = Math.floor(Math.random() * 20) + 1;
  const bonusFoco = Math.floor((atacante.foco * modsAtacante.foco) / 6); // Menor bônus para ataque básico
  const rolagemTotal = d20 + bonusFoco;

  const dificuldadeBase = 8; // Mais fácil que habilidades
  const bonusEvasao = Math.floor((defensor.agilidade * modsDefensor.agilidade) / 4);
  const evasaoExtra = Math.floor(modsDefensor.evasao * 10);
  const dificuldadeTotal = dificuldadeBase + bonusEvasao + evasaoExtra;

  if (rolagemTotal < dificuldadeTotal) {
    resultado.mensagem = `🎲 ${atacante.nome} rolou ${d20}+${bonusFoco} = ${rolagemTotal} vs ${dificuldadeTotal}. ${defensor.nome} esquivou! 💨`;
    return resultado;
  }

  // Calcular dano básico
  const critico = isCritico(atacante);

  // Aplicar modificadores aos stats
  const atacanteModificado = {
    ...atacante,
    forca: atacante.forca * modsAtacante.forca,
    agilidade: atacante.agilidade * modsAtacante.agilidade,
    resistencia: atacante.resistencia * modsAtacante.resistencia,
    foco: atacante.foco * modsAtacante.foco
  };

  const defensorModificado = {
    ...defensor,
    resistencia: defensor.resistencia * modsDefensor.resistencia
  };

  // Criar habilidade fictícia para cálculo de dano
  const ataqueBasicoHabilidade = {
    dano_base: 20,
    multiplicador_stat: 0.8,
    stat_primario: 'forca',
    custo_energia: 0
  };

  let dano = calcularDano(atacanteModificado, ataqueBasicoHabilidade, defensorModificado, critico);

  // Aplicar dano
  resultado.dano = dano;
  resultado.critico = critico;
  resultado.novoHP = Math.max(0, defensor.hp_atual - dano);
  resultado.sucesso = true;

  // Mensagem
  const vantagemTexto = calcularVantagemElemental(atacante.elemento, defensor.elemento);
  let vantagemMsg = '';
  if (vantagemTexto >= 1.5) vantagemMsg = ' (SUPER EFETIVO!)';
  else if (vantagemTexto <= 0.75) vantagemMsg = ' (Pouco efetivo...)';

  let criticoMsg = critico ? ' 💥 CRÍTICO!' : '';

  // Ataque básico consome 10 de energia
  resultado.novaEnergia = Math.max(0, atacante.energia_atual - CONFIG_BATALHA.CUSTO_ATAQUE_BASICO);

  resultado.mensagem = `🎲 ${d20}+${bonusFoco} = ${rolagemTotal} | ${atacante.nome} usou Ataque Básico! ⚔️ ${dano} de dano${criticoMsg}${vantagemMsg} ⚡-${CONFIG_BATALHA.CUSTO_ATAQUE_BASICO}`;

  return resultado;
}

/**
 * Ação de Defender - reduz dano recebido e recupera energia
 */
export function defender(avatar) {
  const energiaRecuperada = CONFIG_BATALHA.ENERGIA_POR_DEFENDER;
  const novaEnergia = Math.min(CONFIG_BATALHA.ENERGIA_MAXIMA, avatar.energia_atual + energiaRecuperada);
  const energiaReal = novaEnergia - avatar.energia_atual;

  // Aplica buff de defesa temporário (1 turno)
  if (!avatar.buffs) avatar.buffs = [];
  avatar.buffs.push({
    nome: 'Postura Defensiva',
    tipo: 'buff',
    bonus_resistencia: 0.50,
    turnos: 1,
    icone: '🛡️'
  });

  return {
    sucesso: true,
    mensagem: `🛡️ ${avatar.nome} está em postura defensiva! +50% Resistência e ⚡+${energiaReal} energia`,
    energiaRecuperada: energiaReal,
    novaEnergia: novaEnergia,
    dano: 0,
    efeitosAplicados: [{ alvo: 'atacante', efeito: 'Postura Defensiva', icone: '🛡️' }]
  };
}

/**
 * Processa início do turno
 * IMPORTANTE: Energia NÃO é mais regenerada automaticamente.
 * Energia só é recuperada ao usar as ações "Esperar" ou "Defender".
 */
export function iniciarTurno(avatar, estado) {
  const resultado = {
    energia: avatar.energia_atual,
    mensagem: `Turno de ${avatar.nome}!`,
    efeitosProcessados: []
  };

  // Processar buffs (incluindo cura contínua)
  if (avatar.buffs && avatar.buffs.length > 0) {
    // CORREÇÃO: Processar efeitos de cura contínua dos buffs
    avatar.buffs.forEach(buff => {
      if (buff.tipo === 'cura_continua' && buff.cura_por_turno) {
        const cura = Math.floor(avatar.hp_maximo * buff.cura_por_turno);
        avatar.hp_atual = Math.min(avatar.hp_maximo, avatar.hp_atual + cura);
        resultado.efeitosProcessados.push({
          tipo: 'cura_continua',
          nome: buff.nome,
          cura: cura
        });
      }
    });

    // Reduzir duração e remover buffs expirados
    avatar.buffs = avatar.buffs.map(buff => ({
      ...buff,
      turnos: buff.turnos - 1
    })).filter(buff => buff.turnos > 0);
  }

  // Processar debuffs (dano contínuo e outros efeitos negativos)
  if (avatar.debuffs && avatar.debuffs.length > 0) {
    // Processar efeitos de dano contínuo
    avatar.debuffs.forEach(debuff => {
      if (debuff.tipo === 'dano_continuo' && debuff.dano_por_turno) {
        const dano = Math.floor(avatar.hp_maximo * debuff.dano_por_turno);
        avatar.hp_atual = Math.max(0, avatar.hp_atual - dano);
        resultado.efeitosProcessados.push({
          tipo: 'dano_continuo',
          nome: debuff.nome,
          dano: dano
        });
      }
    });

    // Reduzir duração dos debuffs
    avatar.debuffs = avatar.debuffs.map(debuff => ({
      ...debuff,
      turnos: debuff.turnos - 1
    })).filter(debuff => debuff.turnos > 0);
  }

  return resultado;
}

/**
 * Verifica condição de vitória
 */
export function verificarVitoria(estado) {
  // CORREÇÃO: Verificar morte ANTES de modificar o HP
  const jogadorMorto = estado.jogador.hp_atual <= 0;
  const inimigoMorto = estado.inimigo.hp_atual <= 0;
  const maxRodadas = estado.rodada >= CONFIG_BATALHA.RODADAS_MAXIMAS;

  // Garantir HP mínimo de 1 após verificar vitória
  if (estado.jogador.hp_atual < 1) {
    estado.jogador.hp_atual = 1;
  }
  if (estado.inimigo.hp_atual < 1) {
    estado.inimigo.hp_atual = 1;
  }

  if (jogadorMorto && inimigoMorto) {
    return { fim: true, vencedor: 'empate', razao: 'Ambos caíram!' };
  }

  if (jogadorMorto) {
    return { fim: true, vencedor: 'inimigo', razao: 'Seu avatar foi derrotado!' };
  }

  if (inimigoMorto) {
    return { fim: true, vencedor: 'jogador', razao: 'Vitória!' };
  }

  if (maxRodadas) {
    // Empate por tempo - vence quem tem mais HP %
    const hpJogadorPercent = estado.jogador.hp_atual / estado.jogador.hp_maximo;
    const hpInimigoPercent = estado.inimigo.hp_atual / estado.inimigo.hp_maximo;

    if (hpJogadorPercent > hpInimigoPercent) {
      return { fim: true, vencedor: 'jogador', razao: 'Vitória por pontos!' };
    } else if (hpInimigoPercent > hpJogadorPercent) {
      return { fim: true, vencedor: 'inimigo', razao: 'Derrota por pontos!' };
    } else {
      return { fim: true, vencedor: 'empate', razao: 'Empate técnico!' };
    }
  }

  return { fim: false };
}

/**
 * Inicializa estado da batalha
 */
export function inicializarBatalha(avatarJogador, avatarInimigo, dificuldade = 'normal') {
  // === CALCULAR STATS DO JOGADOR COM MODIFICADORES ===

  // 1. Aplicar bônus de vínculo aos stats base
  const vinculoJogador = avatarJogador.vinculo || 0;
  const nivelVinculo = getNivelVinculo(vinculoJogador);
  const statsComVinculo = aplicarBonusVinculo({
    forca: avatarJogador.forca,
    agilidade: avatarJogador.agilidade,
    resistencia: avatarJogador.resistencia,
    foco: avatarJogador.foco
  }, vinculoJogador);

  console.log('Vínculo do jogador:', {
    vinculo: vinculoJogador,
    nivel: nivelVinculo.nome,
    bonus: nivelVinculo.bonus || nivelVinculo.penalidade || 0,
    statsOriginais: { forca: avatarJogador.forca, agilidade: avatarJogador.agilidade, resistencia: avatarJogador.resistencia, foco: avatarJogador.foco },
    statsComVinculo: statsComVinculo
  });

  // 2. Aplicar penalidades de exaustão sobre os stats com vínculo
  const exaustaoJogador = avatarJogador.exaustao || 0;
  const nivelExaustao = getNivelExaustao(exaustaoJogador);
  const statsJogadorFinal = aplicarPenalidadesExaustao(statsComVinculo, exaustaoJogador);

  console.log('Exaustão do jogador:', {
    exaustao: exaustaoJogador,
    nivel: nivelExaustao.nome,
    statsComVinculo: statsComVinculo,
    statsFinais: statsJogadorFinal,
    penalidades: nivelExaustao.penalidades
  });

  // Calcular stats do inimigo baseado na dificuldade
  let multiplicador = 1.0;
  switch (dificuldade) {
    case 'facil': multiplicador = 0.7; break;
    case 'normal': multiplicador = 1.0; break;
    case 'dificil': multiplicador = 1.3; break;
    case 'mestre': multiplicador = 1.5; break;
  }

  // Stats do inimigo
  const inimigoAjustado = {
    ...avatarInimigo,
    forca: Math.floor(avatarInimigo.forca * multiplicador),
    agilidade: Math.floor(avatarInimigo.agilidade * multiplicador),
    resistencia: Math.floor(avatarInimigo.resistencia * multiplicador),
    foco: Math.floor(avatarInimigo.foco * multiplicador),
  };

  // Usar stats finais (com vínculo e exaustão) para o jogador
  const jogadorFinal = {
    ...avatarJogador,
    ...statsJogadorFinal
  };

  const hpJogador = calcularHPMaximo(jogadorFinal);
  const hpInimigo = calcularHPMaximo(inimigoAjustado);

  // Energia máxima é sempre 100 (sem penalidades)

  console.log('Stats finais aplicados:', {
    statsFinais: statsJogadorFinal,
    hpMaximo: hpJogador,
    energiaMaxima: CONFIG_BATALHA.ENERGIA_MAXIMA
  });

  // Determinar quem começa baseado na agilidade
  // Quem tem maior agilidade ataca primeiro (em caso de empate, jogador tem vantagem)
  const primeiroTurno = inimigoAjustado.agilidade > jogadorFinal.agilidade ? 'inimigo' : 'jogador';

  return {
    id: `battle_${Date.now()}`,
    tipo: 'treino',
    dificuldade,
    rodada: 1,
    turno_atual: primeiroTurno, // Avatar com maior agilidade começa

    jogador: {
      ...jogadorFinal,
      hp_maximo: hpJogador,
      hp_atual: hpJogador,
      energia_atual: CONFIG_BATALHA.ENERGIA_INICIAL,
      energia_maxima: CONFIG_BATALHA.ENERGIA_MAXIMA,
      vinculo: vinculoJogador,
      nivel_vinculo: nivelVinculo.nome,
      exaustao: exaustaoJogador,
      nivel_exaustao: nivelExaustao.nome,
      buffs: [],
      debuffs: [],
    },
    
    inimigo: {
      ...inimigoAjustado,
      hp_maximo: hpInimigo,
      hp_atual: hpInimigo,
      energia_atual: CONFIG_BATALHA.ENERGIA_INICIAL,
      buffs: [],
      debuffs: [],
    },
    
    historico: [],
    iniciado_em: new Date().toISOString(),
  };
}

/**
 * Processa ação do jogador
 */
export function processarAcaoJogador(estado, acao) {
  const { tipo, habilidadeIndex } = acao;

  let resultado;

  switch (tipo) {
    case 'ataque_basico':
      resultado = ataqueBasico(estado.jogador, estado.inimigo, estado);

      // Atualizar estado
      if (resultado.sucesso) {
        estado.inimigo.hp_atual = resultado.novoHP;
        estado.jogador.energia_atual = resultado.novaEnergia;
      }
      break;

    case 'habilidade':
      const habilidade = estado.jogador.habilidades[habilidadeIndex];

      if (!habilidade) {
        console.error('Habilidade não encontrada!', {
          habilidadeIndex,
          totalHabilidades: estado.jogador.habilidades?.length,
          habilidades: estado.jogador.habilidades
        });
        resultado = { sucesso: false, mensagem: 'Habilidade não encontrada!' };
        break;
      }

      console.log('Usando habilidade:', {
        nome: habilidade.nome,
        custo: habilidade.custo_energia,
        energiaAtual: estado.jogador.energia_atual,
        tipo: habilidade.tipo,
        efeitos: habilidade.efeitos_status
      });

      resultado = usarHabilidade(estado.jogador, habilidade, estado.inimigo, estado);

      console.log('Resultado habilidade:', {
        sucesso: resultado.sucesso,
        mensagem: resultado.mensagem,
        dano: resultado.dano,
        efeitosAplicados: resultado.efeitosAplicados
      });

      // Atualizar estado
      if (resultado.sucesso) {
        estado.inimigo.hp_atual = resultado.novoHP;
        estado.jogador.energia_atual = resultado.novaEnergia;

        // Atualizar HP do atacante se houver cura
        if (resultado.novoHPAtacante !== undefined && resultado.novoHPAtacante !== estado.jogador.hp_atual) {
          estado.jogador.hp_atual = resultado.novoHPAtacante;
        }
      } else {
        // Mesmo se falhou, pode ter gastado energia
        if (resultado.energiaGasta > 0) {
          estado.jogador.energia_atual = resultado.novaEnergia;
        }
      }
      break;

    case 'defender':
      resultado = defender(estado.jogador, estado);
      estado.jogador.energia_atual = resultado.novaEnergia;
      if (!estado.jogador.buffs) estado.jogador.buffs = [];
      estado.jogador.buffs.push(...(resultado.buffs || []));
      console.log('Defender aplicado:', {
        buffsAplicados: resultado.buffs,
        buffsAtuais: estado.jogador.buffs,
        energiaAtual: estado.jogador.energia_atual
      });
      break;

    case 'esperar':
      resultado = esperar(estado.jogador, estado);
      estado.jogador.energia_atual = resultado.novaEnergia;
      break;

    default:
      resultado = { sucesso: false, mensagem: 'Ação inválida!' };
  }

  // Adicionar ao histórico
  estado.historico.push({
    rodada: estado.rodada,
    turno: 'jogador',
    acao: tipo,
    resultado,
    timestamp: new Date().toISOString()
  });

  return resultado;
}

/**
 * Exportações
 */
export default {
  CONFIG_BATALHA,
  calcularHPMaximo,
  calcularDano,
  calcularChanceCritico,
  isCritico,
  aplicarEfeitosStatus,
  calcularModificadoresStats,
  ataqueBasico,
  usarHabilidade,
  defender,
  recarregar,
  iniciarTurno,
  verificarVitoria,
  inicializarBatalha,
  processarAcaoJogador,
};
