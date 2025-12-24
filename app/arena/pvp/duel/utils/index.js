/**
 * Utilitários para duelo PvP
 * Reutiliza funções já extraídas em outras partes do sistema
 */

// Reutilizar função de balanceamento do PVP
export { atualizarBalanceamentoHabilidade } from '@/app/api/pvp/room/state/utils/balanceUpdater';

// Funções de efeitos visuais (centralizadas em /lib/arena)
export {
  getElementoEmoji,
  getElementoCor,
  getEfeitoEmoji,
  ehBuff,
  getNomeSala,
  normalizarEfeito
} from '@/lib/arena/battleEffects';

// Processador de logs de batalha
export { processarNovosLogs } from './logProcessor';
