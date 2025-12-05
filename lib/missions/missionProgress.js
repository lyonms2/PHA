// ==================== SISTEMA DE PROGRESSO DE MISSÕES ====================

import { TIPOS_OBJETIVO } from './missionDefinitions';

/**
 * Verifica se uma missão está concluída
 */
export function verificarMissaoConcluida(missao, progresso) {
  const objetivo = missao.objetivo;

  switch (objetivo.tipo) {
    // Missões de quantidade
    case TIPOS_OBJETIVO.VITORIAS_TREINO:
    case TIPOS_OBJETIVO.VITORIAS_TREINO_NORMAL:
    case TIPOS_OBJETIVO.VITORIAS_TREINO_DIFICIL:
    case TIPOS_OBJETIVO.PARTICIPAR_PVP:
    case TIPOS_OBJETIVO.VITORIAS_PVP:
    case TIPOS_OBJETIVO.VITORIAS_PVP_SEQUENCIAIS:
    case TIPOS_OBJETIVO.GANHAR_VINCULO:
    case TIPOS_OBJETIVO.INVOCAR_AVATARES:
    case TIPOS_OBJETIVO.INVOCAR_RARO_OU_LENDARIO:
    case TIPOS_OBJETIVO.VENDER_AVATAR:
    case TIPOS_OBJETIVO.COMPRAR_AVATAR:
    case TIPOS_OBJETIVO.GANHAR_NIVEIS:
      return progresso >= objetivo.quantidade;

    // Missões de valor mínimo
    case TIPOS_OBJETIVO.VINCULO_MINIMO:
    case TIPOS_OBJETIVO.NIVEL_MINIMO:
      return progresso >= objetivo.valor;

    default:
      return false;
  }
}

/**
 * Retorna a meta da missão
 */
export function getMeta(missao) {
  const objetivo = missao.objetivo;

  if (objetivo.quantidade !== undefined) {
    return objetivo.quantidade;
  }

  if (objetivo.valor !== undefined) {
    return objetivo.valor;
  }

  return 1;
}

/**
 * Incrementa o progresso de uma missão
 */
export function incrementarProgresso(missao, progressoAtual, incremento = 1) {
  const novoProgresso = progressoAtual + incremento;
  const meta = getMeta(missao);

  return {
    progresso: Math.min(novoProgresso, meta),
    concluida: verificarMissaoConcluida(missao, novoProgresso),
    percentual: Math.min(100, Math.floor((novoProgresso / meta) * 100))
  };
}

/**
 * Verifica se tipo de evento corresponde à missão
 */
export function eventoCorrespondeAMissao(missao, tipoEvento) {
  const mapa = {
    [TIPOS_OBJETIVO.VITORIAS_TREINO]: ['VITORIA_TREINO'],
    [TIPOS_OBJETIVO.VITORIAS_TREINO_NORMAL]: ['VITORIA_TREINO_NORMAL', 'VITORIA_TREINO_DIFICIL'], // Normal ou superior
    [TIPOS_OBJETIVO.VITORIAS_TREINO_DIFICIL]: ['VITORIA_TREINO_DIFICIL'],
    [TIPOS_OBJETIVO.PARTICIPAR_PVP]: ['PARTICIPAR_PVP'],
    [TIPOS_OBJETIVO.VITORIAS_PVP]: ['VITORIA_PVP'],
    [TIPOS_OBJETIVO.VITORIAS_PVP_SEQUENCIAIS]: ['VITORIA_PVP_SEQUENCIAL'],
    [TIPOS_OBJETIVO.GANHAR_VINCULO]: ['GANHAR_VINCULO'],
    [TIPOS_OBJETIVO.VINCULO_MINIMO]: ['VINCULO_ATINGIDO'],
    [TIPOS_OBJETIVO.INVOCAR_AVATARES]: ['INVOCAR_AVATAR'],
    [TIPOS_OBJETIVO.INVOCAR_RARO_OU_LENDARIO]: ['INVOCAR_RARO', 'INVOCAR_LENDARIO'],
    [TIPOS_OBJETIVO.VENDER_AVATAR]: ['VENDER_AVATAR'],
    [TIPOS_OBJETIVO.COMPRAR_AVATAR]: ['COMPRAR_AVATAR'],
    [TIPOS_OBJETIVO.GANHAR_NIVEIS]: ['GANHAR_NIVEL'],
    [TIPOS_OBJETIVO.NIVEL_MINIMO]: ['NIVEL_ATINGIDO']
  };

  const eventosAceitos = mapa[missao.objetivo.tipo] || [];
  return eventosAceitos.includes(tipoEvento);
}

/**
 * Aplica bônus de Hunter Rank nas recompensas
 */
export function aplicarBonusHunterRank(recompensas, hunterRank) {
  const multiplicadores = {
    'F': 1.0,
    'E': 1.05,
    'D': 1.10,
    'C': 1.15,
    'B': 1.20,
    'A': 1.25,
    'S': 1.30,
    'SS': 1.40
  };

  const mult = multiplicadores[hunterRank] || 1.0;

  return {
    moedas: Math.floor(recompensas.moedas * mult),
    fragmentos: Math.floor(recompensas.fragmentos * mult),
    xpCacador: Math.floor(recompensas.xpCacador * mult),
    bonus_aplicado: mult > 1.0,
    percentual_bonus: Math.floor((mult - 1.0) * 100)
  };
}

/**
 * Calcula recompensas de streak (dias consecutivos)
 */
export function calcularRecompensasStreak(diasConsecutivos) {
  if (diasConsecutivos >= 30) {
    return {
      moedas: 500,
      fragmentos: 25,
      especial: 'Avatar Lendário garantido',
      mensagem: '🎊 30 DIAS! Avatar Lendário desbloqueado!'
    };
  }

  if (diasConsecutivos >= 14) {
    return {
      moedas: 200,
      fragmentos: 10,
      especial: '1 Invocação Grátis',
      mensagem: '🎉 14 DIAS! Invocação grátis desbloqueada!'
    };
  }

  if (diasConsecutivos >= 7) {
    return {
      moedas: 100,
      fragmentos: 5,
      mensagem: '🔥 7 DIAS SEGUIDOS! Bônus especial!'
    };
  }

  if (diasConsecutivos >= 3) {
    return {
      moedas: 50,
      fragmentos: 0,
      mensagem: '⚡ 3 DIAS! Continue assim!'
    };
  }

  return null;
}

export default {
  verificarMissaoConcluida,
  getMeta,
  incrementarProgresso,
  eventoCorrespondeAMissao,
  aplicarBonusHunterRank,
  calcularRecompensasStreak
};
