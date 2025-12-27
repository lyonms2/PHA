// ==================== SISTEMA DE PROGRESSO DE COLEÇÕES ====================

import { COLECOES } from './collectionDefinitions';

/**
 * Verifica se uma coleção está completa
 */
export function verificarColecaoCompleta(colecao, avatares) {
  const { criterio } = colecao;

  // Filtrar avatares válidos
  const avataresValidos = avatares.filter(av =>
    av.status !== 'vendendo' && !av.caido && av.vivo !== false
  );

  // Verificar critério: elemento + raridade + quantidade
  if (criterio.elemento && criterio.raridade && criterio.quantidade) {
    const avataresQueAtendem = avataresValidos.filter(av =>
      av.elemento === criterio.elemento && av.raridade === criterio.raridade
    );

    console.log(`[COLECAO] ${colecao.nome}: ${avataresQueAtendem.length}/${criterio.quantidade}`, {
      avatares: avataresQueAtendem.map(av => ({ nome: av.nome, elemento: av.elemento, raridade: av.raridade }))
    });

    return {
      completa: avataresQueAtendem.length >= criterio.quantidade,
      progresso: avataresQueAtendem.length,
      meta: criterio.quantidade
    };
  }

  return { completa: false, progresso: 0, meta: 1 };
}

/**
 * Calcula progresso de todas as coleções e retorna quais estão ativas
 */
export function calcularProgressoColecoes(avatares) {
  return COLECOES.map(colecao => {
    const { completa, progresso, meta } = verificarColecaoCompleta(colecao, avatares);

    return {
      ...colecao,
      completa,
      progresso,
      meta,
      percentual: Math.floor((progresso / meta) * 100),
      ativa: completa // Coleção ativa = dá bônus
    };
  });
}

/**
 * Retorna apenas coleções ativas (que dão bônus)
 */
export function getColecoesAtivas(avatares) {
  const todasColecoes = calcularProgressoColecoes(avatares);
  return todasColecoes.filter(c => c.ativa);
}

export default {
  verificarColecaoCompleta,
  calcularProgressoColecoes,
  getColecoesAtivas
};
