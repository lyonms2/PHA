/**
 * Utilitário para gerenciar logs de batalha
 * Mantém histórico das ações da batalha (últimas 20 ações)
 */

/**
 * Adiciona log de ação ao histórico da batalha
 * Remove campos undefined (Firestore não aceita)
 * Mantém apenas as últimas 20 ações para não sobrecarregar
 *
 * @param {Array} battleLog - Histórico atual de logs
 * @param {Object} novoLog - Novo log a adicionar
 * @returns {Array} Histórico atualizado
 */
export function adicionarLogBatalha(battleLog = [], novoLog) {
  // Remover campos undefined (Firestore não aceita)
  const logLimpo = {};
  for (const [key, value] of Object.entries(novoLog)) {
    if (value !== undefined) {
      logLimpo[key] = value;
    }
  }

  const logComId = {
    ...logLimpo,
    id: Date.now() + Math.random(), // ID único
    timestamp: new Date().toISOString()
  };

  const logsAtualizados = [...battleLog, logComId];

  // Manter apenas últimas 20 ações
  return logsAtualizados.slice(-20);
}
