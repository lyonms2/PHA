/**
 * Processador de logs de batalha para duelo PvP
 * Extrai e formata logs de combate para exibição
 */

/**
 * Processa novos logs da batalha e gera mensagens formatadas
 * @param {Array} battleLog - Array de logs da batalha
 * @param {string} opponentNomeAtual - Nome do oponente
 * @param {Object} lastProcessedLogIdRef - Ref do último log processado
 * @param {Function} addLog - Callback para adicionar log
 * @param {Function} showDamageEffect - Callback para mostrar efeito visual
 * @returns {void}
 */
export function processarNovosLogs(battleLog, opponentNomeAtual, lastProcessedLogIdRef, addLog, showDamageEffect) {
  if (!battleLog || battleLog.length === 0) return;

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

  // Processar cada novo log
  for (const logEntry of novosLogs) {
    const { acao, jogador, alvo, dano, cura, critico, errou, esquivou, invisivel, bloqueado, habilidade, efeitos, numGolpes, contraAtaque, vencedor, energiaRecuperada, elemental } = logEntry;

    // Comparação confiável usando opponentNome do servidor (não do state React)
    // Se jogador === opponentNome, então é ação do oponente
    // Caso contrário, é minha própria ação
    const ehAcaoOponente = jogador === opponentNomeAtual;

    // PULAR minhas próprias ações - já foram processadas quando executei
    // Apenas processar ações do OPONENTE para ver o que ele fez
    if (!ehAcaoOponente) continue;

    // ATAQUE
    if (acao === 'attack') {
      if (errou) {
        if (invisivel) {
          addLog(`👻 ${jogador} ERROU! ${alvo} está INVISÍVEL!`);
          showDamageEffect('me', '', 'dodge');
        } else if (esquivou) {
          addLog(`💨 ${jogador} ERROU! ${alvo} esquivou!`);
          showDamageEffect('me', '', 'dodge');
        } else {
          addLog(`💨 ${jogador} ERROU! ${alvo} esquivou!`);
          showDamageEffect('me', '', 'miss');
        }
      } else {
        let emoji = '⚔️';
        let tipo = 'ATAQUE';
        if (critico) { emoji = '💥'; tipo = 'CRÍTICO'; }
        if (bloqueado) { emoji = '🛡️'; tipo = 'BLOQUEADO'; }

        addLog(`${emoji} ${jogador} → ${alvo}: ${tipo}! Dano: ${dano}`);

        if (elemental === 'vantagem') {
          addLog('🔥 Super efetivo!');
        } else if (elemental === 'desvantagem') {
          addLog('💨 Pouco efetivo...');
        }

        if (contraAtaque) {
          addLog(`🔥🛡️ CONTRA-ATAQUE! ${jogador} foi queimado!`);
        }

        showDamageEffect('me', dano, critico ? 'critical' : 'damage');

        if (contraAtaque) {
          // Contra-ataque sempre aparece no atacante (oponente neste caso)
          setTimeout(() => showDamageEffect('opponent', '🔥', 'burn'), 500);
        }
      }
    }

    // HABILIDADE
    if (acao === 'ability') {
      if (errou) {
        if (invisivel) {
          addLog(`👻 ${jogador} usou ${habilidade} mas ERROU! ${alvo} está INVISÍVEL!`);
          showDamageEffect('me', '', 'dodge');
        } else if (esquivou) {
          addLog(`💨 ${jogador} usou ${habilidade} mas ERROU! ${alvo} esquivou!`);
          showDamageEffect('me', '', 'dodge');
        } else {
          addLog(`💨 ${jogador} usou ${habilidade} mas ERROU!`);
          showDamageEffect('me', '', 'miss');
        }
      } else {
        let emoji = '✨';
        let msg = `${emoji} ${jogador} usou ${habilidade}!`;

        if (dano > 0) {
          msg += ` Dano: ${dano}`;
          if (numGolpes && numGolpes > 1) {
            msg += ` (${numGolpes}× golpes)`;
          }
        }

        if (cura > 0) {
          msg += ` ❤️ Curou: ${cura}`;
        }

        addLog(msg);

        if (elemental === 'vantagem') {
          addLog('🔥 Super efetivo!');
        } else if (elemental === 'desvantagem') {
          addLog('💨 Pouco efetivo...');
        }

        if (contraAtaque) {
          addLog(`🔥🛡️ CONTRA-ATAQUE! ${jogador} foi queimado!`);
        }

        if (efeitos && efeitos.length > 0) {
          addLog(`✨ Efeitos: ${efeitos.join(', ')}`);
        }

        // Efeitos visuais
        if (dano > 0) {
          if (numGolpes && numGolpes > 1) {
            showDamageEffect('me', `${dano} ×${numGolpes}`, 'multihit');
          } else {
            showDamageEffect('me', dano, critico ? 'critical' : 'damage');
          }
        }

        if (cura > 0) {
          // Cura sempre aparece no atacante (oponente neste caso)
          showDamageEffect('opponent', cura, 'heal');
        }

        if (contraAtaque) {
          // Contra-ataque sempre aparece no atacante (oponente neste caso)
          setTimeout(() => showDamageEffect('opponent', '🔥', 'burn'), 500);
        }
      }
    }

    // DEFESA
    if (acao === 'defend') {
      addLog(`🛡️ ${jogador} defendeu! +${energiaRecuperada || 20} ⚡`);
    }

    // RENDIÇÃO
    if (acao === 'surrender') {
      addLog(`🏳️ ${jogador} se rendeu! ${vencedor} venceu!`);
    }
  }

  // Atualizar último log processado
  if (novosLogs.length > 0) {
    lastProcessedLogIdRef.current = novosLogs[novosLogs.length - 1].id;
  }
}
