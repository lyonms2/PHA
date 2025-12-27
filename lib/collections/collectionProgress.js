// ==================== SISTEMA DE PROGRESSO DE COLEÇÕES ====================

import { COLECOES, TIPOS_COLECAO, TIPOS_RESGATE } from './collectionDefinitions';
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
      return verificarColecaoEspecial(criterio, avatares);

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
    meta: quantidade,
    avataresDisponiveis: avataresDaRaridade // Para seleção na dedicação
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
    meta: quantidade,
    avataresDisponiveis: avataresComPoder // Para seleção na dedicação
  };
}

/**
 * Verifica coleção completa (critérios especiais)
 */
function verificarColecaoEspecial(criterio, avatares) {
  // Filtrar avatares válidos
  const avataresValidos = avatares.filter(av =>
    av.status !== 'vendendo' && !av.caido
  );

  // Hall dos Elementos Supremos (1 Lendário de cada elemento)
  if (criterio.elementosLendarios) {
    const elementos = criterio.elementosLendarios;
    const avataresLendariosPorElemento = {};
    const avataresLendarios = avataresValidos.filter(av =>
      av.raridade === 'Lendário' && elementos.includes(av.elemento)
    );

    // Contar lendários de cada elemento
    avataresLendarios.forEach(av => {
      if (!avataresLendariosPorElemento[av.elemento]) {
        avataresLendariosPorElemento[av.elemento] = [];
      }
      avataresLendariosPorElemento[av.elemento].push(av);
    });

    const elementosCompletos = Object.keys(avataresLendariosPorElemento).length;

    return {
      completa: elementosCompletos >= elementos.length,
      progresso: elementosCompletos,
      meta: elementos.length,
      avataresDisponiveis: avataresLendarios,
      avataresLendariosPorElemento // Para UI de seleção
    };
  }

  // Museu da Unicidade (1 de cada raridade)
  if (criterio.todasRaridades) {
    const raridades = criterio.todasRaridades;
    const avataresPorRaridade = {};

    // Agrupar avatares por raridade
    avataresValidos.forEach(av => {
      if (raridades.includes(av.raridade)) {
        if (!avataresPorRaridade[av.raridade]) {
          avataresPorRaridade[av.raridade] = [];
        }
        avataresPorRaridade[av.raridade].push(av);
      }
    });

    const raridadesCompletas = Object.keys(avataresPorRaridade);

    return {
      completa: raridadesCompletas.length >= raridades.length,
      progresso: raridadesCompletas.length,
      meta: raridades.length,
      avataresDisponiveis: avataresValidos.filter(av => raridades.includes(av.raridade)),
      avataresPorRaridade // Para UI de seleção
    };
  }

  // Mestre dos Elementos (1 de cada elemento) - Normal
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
