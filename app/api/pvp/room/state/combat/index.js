/**
 * Sistema de Combate PvP
 * Módulos para cálculo de dano, acerto e vantagens elementais
 */

export { calcularMultiplicadorElemental } from './elementalSystem';
export { testarAcertoAtaque, testarAcertoHabilidade } from './hitChecker';
export { calcularDanoAtaque, calcularDanoHabilidade, calcularCuraHabilidade } from './damageCalculator';
