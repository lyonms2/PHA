// ==================== INDEX - TODAS AS HABILIDADES ====================
// Arquivo: /home/user/PHA/app/avatares/sistemas/abilities/index.js

import { HABILIDADES_FOGO } from './fogo';
import { HABILIDADES_AGUA } from './agua';
import { HABILIDADES_TERRA } from './terra';
import { HABILIDADES_VENTO } from './vento';
import { HABILIDADES_ELETRICIDADE } from './eletricidade';
import { HABILIDADES_SOMBRA } from './sombra';
import { HABILIDADES_LUZ } from './luz';
import { HABILIDADES_VOID } from './void';
import { HABILIDADES_AETHER } from './aether';

/**
 * Todas as habilidades organizadas por elemento (9 elementos completos)
 */
export const HABILIDADES_POR_ELEMENTO = {
  Fogo: HABILIDADES_FOGO,
  Água: HABILIDADES_AGUA,
  Terra: HABILIDADES_TERRA,
  Vento: HABILIDADES_VENTO,
  Eletricidade: HABILIDADES_ELETRICIDADE,
  Sombra: HABILIDADES_SOMBRA,
  Luz: HABILIDADES_LUZ,
  Void: HABILIDADES_VOID,
  Aether: HABILIDADES_AETHER
};

/**
 * Lista de todos os elementos disponíveis
 */
export const ELEMENTOS_DISPONIVEIS = Object.keys(HABILIDADES_POR_ELEMENTO);

/**
 * Obter habilidades de um elemento específico
 */
export const getHabilidadesElemento = (elemento) => {
  return HABILIDADES_POR_ELEMENTO[elemento] || null;
};

/**
 * Obter todas as habilidades (array plano)
 */
export const getAllHabilidades = () => {
  return Object.values(HABILIDADES_POR_ELEMENTO).flatMap(elemento =>
    Object.values(elemento)
  );
};
