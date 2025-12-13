/**
 * Biblioteca de Combate Compartilhada
 * Sistema unificado de batalha usado por todos os modos do jogo
 *
 * Usado por:
 * - PVP Duelo (arena/pvp/duel)
 * - PVP Matchmaking (api/pvp/room/state)
 * - Treino contra IA (api/arena/treino-ia)
 * - Desafios contra Boss (api/arena/desafios)
 * - Batalha D20 (arena/batalha)
 */

// ===== BATTLE ENGINE =====
export {
  processAttack,
  processDefend,
  processAbility,
  processEffects
} from './engine';

// ===== COMBAT SYSTEMS =====
export {
  calcularDanoAtaque,
  calcularDanoHabilidade,
  calcularCuraHabilidade
} from '@/lib/combat/core/damageCalculator';

export {
  calcularMultiplicadorElemental
} from '@/lib/combat/core/elementalSystem';

export {
  testarAcertoAtaque
} from '@/lib/combat/core/hitChecker';

// ===== UTILITIES =====
export {
  atualizarBalanceamentoHabilidade
} from './utils/balanceUpdater';

export {
  adicionarLogBatalha
} from './utils/battleLogger';
