/**
 * Sistema de vantagens/desvantagens elementais
 * Determina multiplicador de dano baseado em elementos
 */

/**
 * Calcula multiplicador elemental entre atacante e defensor
 *
 * Ciclo principal: Fogo > Vento > Terra > Eletricidade > Água > Fogo
 * Ciclo especial: Luz <-> Sombra
 *
 * @param {string} atacante - Elemento do atacante
 * @param {string} defensor - Elemento do defensor
 * @returns {Object} { mult: number, tipo: string }
 *   - mult: 1.5 (vantagem), 0.75 (desvantagem), 1.0 (neutro)
 *   - tipo: 'vantagem', 'desvantagem', 'neutro'
 */
export function calcularMultiplicadorElemental(atacante, defensor) {
  // Ciclo: Fogo > Vento > Terra > Eletricidade > Água > Fogo
  const vantagens = {
    'Fogo': 'Vento',
    'Vento': 'Terra',
    'Terra': 'Eletricidade',
    'Eletricidade': 'Água',
    'Água': 'Fogo',
    'Luz': 'Sombra',
    'Sombra': 'Luz'
  };

  if (vantagens[atacante] === defensor) {
    return { mult: 1.5, tipo: 'vantagem' };
  }
  if (vantagens[defensor] === atacante) {
    return { mult: 0.75, tipo: 'desvantagem' };
  }
  return { mult: 1.0, tipo: 'neutro' };
}
