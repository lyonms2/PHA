/**
 * Centraliza exports de funções de lógica do jogo
 * Re-exporta de diferentes módulos para facilitar imports
 */

// Stats e HP
export {
  calcularHPMaximoCompleto
} from './combat/statsCalculator';

/**
 * Calcula poder total de um avatar
 * Fórmula: (stats_totais + bonus_nivel) × multiplicador_raridade
 *
 * @param {Object} avatar - Avatar com stats, nivel e raridade
 * @returns {number} Poder total calculado
 */
export function calcularPoderTotal(avatar) {
  if (!avatar) return 0;

  // Stats base
  const forca = avatar.forca || 0;
  const agilidade = avatar.agilidade || 0;
  const resistencia = avatar.resistencia || 0;
  const foco = avatar.foco || 0;
  const statTotal = forca + agilidade + resistencia + foco;

  // Bônus de nível (cada nível adiciona 2 de poder)
  const nivel = avatar.nivel || 1;
  const bonusNivel = nivel * 2;

  // Multiplicador de raridade
  const multiplicadoresRaridade = {
    'Comum': 1.0,      // Base
    'Raro': 1.1,       // +10%
    'Lendário': 1.2    // +20%
  };
  const raridade = avatar.raridade || 'Comum';
  const multiplicador = multiplicadoresRaridade[raridade] || 1.0;

  // Cálculo final
  const poder = Math.floor((statTotal + bonusNivel) * multiplicador);

  return poder;
}

// Exaustão
export {
  getNivelExaustao,
  aplicarPenalidadesExaustao
} from '../app/avatares/sistemas/exhaustionSystem';

// Vínculo
export {
  getNivelVinculo,
  aplicarBonusVinculo
} from '../app/avatares/sistemas/bondSystem';

// Habilidades e Dano
export {
  calcularDanoHabilidade
} from '../app/avatares/sistemas/abilitiesSystem';

/**
 * Calcula chance de acerto baseado em stats
 */
export function calcularChanceAcerto(atacante, defensor) {
  const agilidadeAtacante = atacante?.agilidade || 0;
  const agilidadeDefensor = defensor?.agilidade || 0;

  let chance = 85; // Base de 85%
  chance += (agilidadeAtacante - agilidadeDefensor) * 0.5;

  return Math.max(30, Math.min(95, chance));
}

/**
 * Calcula dano crítico
 */
export function calcularDanoCritico(danoBase, stats) {
  const multiplicador = 1.5 + ((stats?.foco || 0) / 100);
  return Math.floor(danoBase * multiplicador);
}

// Batalha
export {
  calcularDano
} from './arena/batalhaEngine';

// Elementos
export {
  calcularVantagemElemental
} from '../app/avatares/sistemas/elementalSystem';
