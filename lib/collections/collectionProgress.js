// ==================== SISTEMA DE PROGRESSO DE COLEÇÕES ====================

import { COLECOES } from './collectionDefinitions';

/**
 * Verifica se uma coleção está completa
 */
export function verificarColecaoCompleta(colecao, avatares) {
  const { criterio } = colecao;

  console.log(`\n[COLECAO DEBUG] Verificando: ${colecao.nome}`);
  console.log(`Total de avatares recebidos: ${avatares.length}`);

  // Filtrar avatares válidos
  const avataresValidos = avatares.filter(av =>
    av.status !== 'vendendo' && !av.caido && av.vivo !== false
  );

  console.log(`Avatares válidos após filtro: ${avataresValidos.length}`);

  // Log de TODOS os avatares e seus valores
  if (criterio.elemento === 'Fogo') {
    console.log(`\n[FOGO DEBUG] Todos os avatares:`);
    avatares.forEach((av, i) => {
      console.log(`  ${i + 1}. "${av.nome}" - Elemento: "${av.elemento}" | Raridade: "${av.raridade}" | Status: "${av.status}" | Caido: ${av.caido} | Vivo: ${av.vivo}`);
    });
  }

  // Verificar critério: elemento + raridade + quantidade
  if (criterio.elemento && criterio.raridade && criterio.quantidade) {
    const avataresQueAtendem = avataresValidos.filter(av =>
      av.elemento === criterio.elemento && av.raridade === criterio.raridade
    );

    console.log(`[COLECAO] ${colecao.nome}: ${avataresQueAtendem.length}/${criterio.quantidade}`);
    console.log(`Critério: elemento="${criterio.elemento}" raridade="${criterio.raridade}"`);
    console.log(`Avatares que atendem:`, avataresQueAtendem.map(av => ({ nome: av.nome, elemento: av.elemento, raridade: av.raridade })));

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
