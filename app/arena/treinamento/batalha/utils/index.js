/**
 * Utilitários para batalha de treinamento
 */

// Reutilizar função do PVP (mesma implementação)
export { atualizarBalanceamentoHabilidade } from '@/app/api/pvp/room/state/utils/balanceUpdater';

// Funções específicas de batalha
export { getElementoEmoji, getElementoCor, ehBuff, getEfeitoEmoji } from './battleEffects';
