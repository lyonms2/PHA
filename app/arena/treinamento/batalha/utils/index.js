/**
 * Utilitários para batalha de treinamento
 */

// Reutilizar função do PVP (mesma implementação)
export { atualizarBalanceamentoHabilidade } from '@/app/api/pvp/room/state/utils/balanceUpdater';

// Funções de efeitos visuais (centralizadas em /lib/arena)
export {
  getElementoEmoji,
  getElementoCor,
  getEfeitoEmoji,
  ehBuff,
  normalizarEfeito
} from '@/lib/arena/battleEffects';
