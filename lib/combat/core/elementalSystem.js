/**
 * Sistema de vantagens/desvantagens elementais - 9 ELEMENTOS COMPLETOS
 * Determina multiplicador de dano baseado em elementos
 *
 * Integrado com /app/avatares/sistemas/elementalSystem.js
 */

import { calcularVantagemElemental, ELEMENTOS } from '@/app/avatares/sistemas/elementalSystem';

/**
 * Calcula multiplicador elemental entre atacante e defensor
 *
 * Sistema completo com 9 elementos:
 * - Ciclo básico: Fogo > Vento > Terra > Eletricidade > Água > Fogo
 * - Opostos: Luz <-> Sombra (2.0x)
 * - Raros: Void <-> Aether (1.4x)
 * - Void: Forte contra Luz e Sombra
 * - Aether: Forte contra Void
 *
 * @param {string} atacante - Elemento do atacante
 * @param {string} defensor - Elemento do defensor
 * @returns {Object} { mult: number, tipo: string }
 *   - mult: 2.0 (oposto), 1.5 (vantagem), 1.4 (void/aether), 1.0 (neutro), 0.85 (resistente), 0.75 (desvantagem)
 *   - tipo: 'oposto', 'vantagem', 'neutro', 'desvantagem', 'resistente'
 */
export function calcularMultiplicadorElemental(atacante, defensor) {
  // Usa o sistema completo de elementalSystem.js
  const multiplicador = calcularVantagemElemental(atacante, defensor);

  // Determinar o tipo baseado no multiplicador
  let tipo = 'neutro';

  if (multiplicador >= 2.0) {
    tipo = 'oposto'; // Luz vs Sombra
  } else if (multiplicador >= 1.5) {
    tipo = 'vantagem'; // Super efetivo
  } else if (multiplicador >= 1.4 && multiplicador < 1.5) {
    tipo = 'vantagem_especial'; // Void vs Aether
  } else if (multiplicador < 1.0 && multiplicador >= 0.85) {
    tipo = 'resistente'; // Pouco efetivo mas não muito
  } else if (multiplicador < 0.85) {
    tipo = 'desvantagem'; // Fraco contra
  }

  return { mult: multiplicador, tipo };
}

/**
 * Retorna descrição textual da matchup elemental
 * @param {string} atacante - Elemento atacante
 * @param {string} defensor - Elemento defensor
 * @returns {string} Descrição da vantagem
 */
export function getDescricaoVantagem(atacante, defensor) {
  const { mult, tipo } = calcularMultiplicadorElemental(atacante, defensor);

  switch (tipo) {
    case 'oposto':
      return `${atacante} é OPOSTO a ${defensor}! (${mult}x dano)`;
    case 'vantagem':
      return `${atacante} é SUPER EFETIVO contra ${defensor}! (${mult}x dano)`;
    case 'vantagem_especial':
      return `${atacante} tem vantagem especial contra ${defensor}! (${mult}x dano)`;
    case 'desvantagem':
      return `${atacante} é POUCO EFETIVO contra ${defensor}... (${mult}x dano)`;
    case 'resistente':
      return `${defensor} resiste a ${atacante}. (${mult}x dano)`;
    default:
      return `${atacante} é neutro contra ${defensor}. (${mult}x dano)`;
  }
}

/**
 * Verifica se um elemento tem vantagem sobre outro
 * @param {string} atacante - Elemento atacante
 * @param {string} defensor - Elemento defensor
 * @returns {boolean} True se tem vantagem
 */
export function temVantagem(atacante, defensor) {
  const { mult } = calcularMultiplicadorElemental(atacante, defensor);
  return mult > 1.0;
}

/**
 * Verifica se um elemento tem desvantagem contra outro
 * @param {string} atacante - Elemento atacante
 * @param {string} defensor - Elemento defensor
 * @returns {boolean} True se tem desvantagem
 */
export function temDesvantagem(atacante, defensor) {
  const { mult } = calcularMultiplicadorElemental(atacante, defensor);
  return mult < 1.0;
}

/**
 * Retorna lista de todos os elementos válidos
 * @returns {Array<string>} Array com os 9 elementos
 */
export function getTodosElementos() {
  return Object.values(ELEMENTOS);
}

/**
 * Valida se um elemento é válido
 * @param {string} elemento - Elemento a validar
 * @returns {boolean} True se válido
 */
export function isElementoValido(elemento) {
  return Object.values(ELEMENTOS).includes(elemento);
}
