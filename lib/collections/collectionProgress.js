// ==================== SISTEMA DE PROGRESSO DE COLEÇÕES ====================

import { COLECOES, TIPOS_COLECAO } from './collectionDefinitions';
import { calcularPoderTotal } from '../gameLogic';

/**
 * Verifica se uma coleção está completa baseado nos avatares do jogador
 */
export function verificarColecaoCompleta(colecao, avatares) {
  const { tipo, criterio } = colecao;

  switch (tipo) {
    case TIPOS_COLECAO.ELEMENTO:
      return verificarColecaoElemento(criterio, avatares);

    case TIPOS_COLECAO.RARIDADE:
      return verificarColecaoRaridade(criterio, avatares);

    case TIPOS_COLECAO.CARACTERISTICA:
      return verificarColecaoCaracteristica(criterio, avatares);

    case TIPOS_COLECAO.PODER:
      return verificarColecaoPoder(criterio, avatares);

    case TIPOS_COLECAO.COMPLETA:
      return verificarColecaoCompleta(criterio, avatares);

    default:
      return { completa: false, progresso: 0, meta: 1 };
  }
}

/**
 * Verifica coleção de elemento
 */
function verificarColecaoElemento(criterio, avatares) {
  const { elemento, quantidade } = criterio;

  const avataresDoElemento = avatares.filter(av =>
    av.elemento === elemento && av.status !== 'vendendo' && !av.caido
  );

  return {
    completa: avataresDoElemento.length >= quantidade,
    progresso: avataresDoElemento.length,
    meta: quantidade
  };
}

/**
 * Verifica coleção de raridade
 */
function verificarColecaoRaridade(criterio, avatares) {
  const { raridade, quantidade } = criterio;

  const avataresDaRaridade = avatares.filter(av =>
    av.raridade === raridade && av.status !== 'vendendo' && !av.caido
  );

  return {
    completa: avataresDaRaridade.length >= quantidade,
    progresso: avataresDaRaridade.length,
    meta: quantidade
  };
}

/**
 * Verifica coleção de característica
 */
function verificarColecaoCaracteristica(criterio, avatares) {
  const { caracteristica, valor, quantidade } = criterio;

  let avataresComCaracteristica = [];

  switch (caracteristica) {
    case 'olhos':
      avataresComCaracteristica = avatares.filter(av =>
        av.olhos === valor && av.status !== 'vendendo' && !av.caido
      );
      break;

    case 'temAsas':
      avataresComCaracteristica = avatares.filter(av =>
        av.temAsas === valor && av.status !== 'vendendo' && !av.caido
      );
      break;

    case 'temChifres':
      avataresComCaracteristica = avatares.filter(av =>
        av.temChifres === valor && av.status !== 'vendendo' && !av.caido
      );
      break;

    default:
      avataresComCaracteristica = [];
  }

  return {
    completa: avataresComCaracteristica.length >= quantidade,
    progresso: avataresComCaracteristica.length,
    meta: quantidade
  };
}

/**
 * Verifica coleção de poder
 */
function verificarColecaoPoder(criterio, avatares) {
  const { poderMinimo, quantidade } = criterio;

  const avataresComPoder = avatares.filter(av => {
    if (av.status === 'vendendo' || av.caido) return false;
    const poder = calcularPoderTotal(av);
    return poder >= poderMinimo;
  });

  return {
    completa: avataresComPoder.length >= quantidade,
    progresso: avataresComPoder.length,
    meta: quantidade
  };
}

/**
 * Verifica coleção completa (critérios especiais)
 */
function verificarColecaoCompleta(criterio, avatares) {
  // Filtrar avatares válidos
  const avataresValidos = avatares.filter(av =>
    av.status !== 'vendendo' && !av.caido
  );

  // Mestre dos Elementos (1 de cada elemento)
  if (criterio.elementos) {
    const elementosUnicos = new Set(avataresValidos.map(av => av.elemento));
    const elementosCompletos = criterio.elementos.filter(el => elementosUnicos.has(el));

    return {
      completa: elementosCompletos.length >= criterio.elementos.length,
      progresso: elementosCompletos.length,
      meta: criterio.elementos.length
    };
  }

  // Colecionador Diverso (total de avatares)
  if (criterio.totalAvatares) {
    return {
      completa: avataresValidos.length >= criterio.totalAvatares,
      progresso: avataresValidos.length,
      meta: criterio.totalAvatares
    };
  }

  return { completa: false, progresso: 0, meta: 1 };
}

/**
 * Calcula progresso de todas as coleções
 */
export function calcularProgressoColecoes(avatares, colecoesCompletadas = []) {
  return COLECOES.map(colecao => {
    const foiCompletada = colecoesCompletadas.includes(colecao.id);
    const { completa, progresso, meta } = verificarColecaoCompleta(colecao, avatares);

    return {
      ...colecao,
      completa: foiCompletada || completa,
      progresso,
      meta,
      percentual: Math.floor((progresso / meta) * 100),
      podeResgatar: completa && !foiCompletada
    };
  });
}

/**
 * Filtra coleções que podem ser resgatadas
 */
export function getColecoesResgataveit(progressoColecoes) {
  return progressoColecoes.filter(c => c.podeResgatar);
}

export default {
  verificarColecaoCompleta,
  calcularProgressoColecoes,
  getColecoesResgataveit
};
