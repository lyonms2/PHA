/**
 * Processador de logs de batalha para duelo PvP
 * Extrai e formata logs de combate para exibição
 * USA BIBLIOTECA CENTRALIZADA de formatação (lib/combat/battle/logs/battleLogger.js)
 */

import { formatAttackLog, formatDefendLog, formatAbilityLog } from '@/lib/combat/battle/logs/battleLogger';

/**
 * Processa novos logs da batalha e gera mensagens formatadas
 * @param {Array} battleLog - Array de logs da batalha
 * @param {string} opponentNomeAtual - Nome do oponente
 * @param {Object} lastProcessedLogIdRef - Ref do último log processado
 * @param {Function} addLog - Callback para adicionar log
 * @param {Function} showDamageEffect - Callback para mostrar efeito visual
 * @param {Object} opponentAvatar - Avatar do oponente (para pegar elemento)
 * @returns {void}
 */
export function processarNovosLogs(battleLog, opponentNomeAtual, lastProcessedLogIdRef, addLog, showDamageEffect, opponentAvatar = null) {
  if (!battleLog || battleLog.length === 0) return;

  console.log('🔵 [logProcessor] INICIANDO processarNovosLogs:', {
    battleLogLength: battleLog.length,
    opponentNome: opponentNomeAtual,
    opponentAvatar: opponentAvatar?.nome
  });

  // Encontrar logs novos
  const novosLogs = [];
  let encontrouUltimo = lastProcessedLogIdRef.current === null;

  for (const logEntry of battleLog) {
    if (!encontrouUltimo) {
      if (logEntry.id === lastProcessedLogIdRef.current) {
        encontrouUltimo = true;
      }
      continue;
    }
    // Pular o log que já foi processado
    if (logEntry.id === lastProcessedLogIdRef.current) continue;
    novosLogs.push(logEntry);
  }

  console.log('🔵 [logProcessor] Novos logs encontrados:', novosLogs.length);

  // Processar cada novo log
  for (const logEntry of novosLogs) {
    const { acao, jogador, dano, cura, critico, errou, numGolpes, contraAtaque } = logEntry;

    console.log('🔵 [logProcessor] Processando log:', { acao, jogador, dano, errou, critico });

    // Comparação confiável usando opponentNome do servidor (não do state React)
    // Se jogador === opponentNome, então é ação do oponente
    // Caso contrário, é minha própria ação
    const ehAcaoOponente = jogador === opponentNomeAtual;

    console.log('🔵 [logProcessor] É ação do oponente?', ehAcaoOponente, { jogador, opponentNomeAtual });

    // PULAR minhas próprias ações - já foram processadas quando executei
    // Apenas processar ações do OPONENTE para ver o que ele fez
    if (!ehAcaoOponente) {
      console.log('🔵 [logProcessor] PULANDO - não é ação do oponente');
      continue;
    }

    console.log('🔵 [logProcessor] PROCESSANDO ação do oponente');

    // USAR BIBLIOTECA CENTRALIZADA
    // O backend já formata os logs usando battleLogger.js
    // Basta usar o campo 'detalhes' que já vem formatado!
    if (logEntry.detalhes) {
      addLog(logEntry.detalhes);
    }

    // Efeitos visuais baseados na ação
    if (acao === 'attack' || acao === 'ability') {
      console.log('🎯 [logProcessor] Processando ação da IA:', { acao, errou, dano, critico, cura });

      if (errou) {
        // Miss/dodge - sem número, sem elemento
        console.log('💨 [logProcessor] IA errou - chamando showDamageEffect(me, null, dodge, null)');
        showDamageEffect('me', null, 'dodge', null);
      } else if (dano > 0) {
        // Dano do oponente em mim - mostrar elemento do oponente
        const tipoEfeito = critico ? 'critical' : 'damage';
        const elemento = opponentAvatar?.elemento || null;
        console.log('💥 [logProcessor] IA causou dano - chamando showDamageEffect:', { target: 'me', dano, tipoEfeito, elemento });
        showDamageEffect('me', dano, tipoEfeito, elemento);

        // Contra-ataque visual
        if (contraAtaque) {
          setTimeout(() => showDamageEffect('opponent', null, 'block', null), 500);
        }
      }

      // Cura visual (habilidades de suporte do oponente)
      if (cura > 0) {
        console.log('💚 [logProcessor] IA curou - chamando showDamageEffect(opponent, cura, heal, null)');
        showDamageEffect('opponent', cura, 'heal', null);
      }
    }
  }

  // Atualizar último log processado
  if (novosLogs.length > 0) {
    lastProcessedLogIdRef.current = novosLogs[novosLogs.length - 1].id;
  }
}
