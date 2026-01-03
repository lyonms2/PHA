/**
 * Armazenamento global de sessões de batalha
 * Singleton TRUE usando globalThis para garantir persistência entre requisições
 */

// Usar globalThis para garantir singleton verdadeiro entre todos os workers/processos
if (!globalThis.__battleSessions) {
  console.log('🔧 [STORAGE] Inicializando battleSessions no globalThis');
  globalThis.__battleSessions = new Map();
  globalThis.__battleSessionsLogEnabled = true; // Sempre habilitado
}

const battleSessions = globalThis.__battleSessions;

export function enableSessionLogs() {
  globalThis.__battleSessionsLogEnabled = true;
  console.log('🔧 [STORAGE] Logs habilitados');
}

function isLogEnabled() {
  return globalThis.__battleSessionsLogEnabled === true;
}

export function setBattle(battleId, battleData) {
  if (isLogEnabled()) {
    console.log(`[SESSION STORAGE] SET: ${battleId}`, {
      status: battleData.status,
      player: battleData.player?.nome,
      ia: battleData.ia?.nome
    });
  }
  battleSessions.set(battleId, battleData);
  if (isLogEnabled()) {
    console.log(`[SESSION STORAGE] Total de batalhas ativas: ${battleSessions.size}`);
    console.log(`[SESSION STORAGE] Todas as chaves:`, Array.from(battleSessions.keys()));
  }
}

export function getBattle(battleId) {
  const battle = battleSessions.get(battleId);
  if (isLogEnabled()) {
    console.log(`[SESSION STORAGE] GET: ${battleId}`, {
      found: !!battle,
      totalSessions: battleSessions.size,
      allKeys: Array.from(battleSessions.keys())
    });
  }
  return battle;
}

export function deleteBattle(battleId) {
  const deleted = battleSessions.delete(battleId);
  if (isLogEnabled()) {
    console.log(`[SESSION STORAGE] DELETE: ${battleId}`, {
      deleted,
      remainingSessions: battleSessions.size
    });
  }
  return deleted;
}

export function getAllBattles() {
  return Array.from(battleSessions.values());
}

export function getBattleCount() {
  return battleSessions.size;
}

export function clearAllBattles() {
  const count = battleSessions.size;
  battleSessions.clear();
  if (isLogEnabled()) {
    console.log(`[SESSION STORAGE] CLEAR ALL: ${count} batalhas removidas`);
  }
  return count;
}

// Limpeza automática de batalhas antigas (opcional)
export function cleanupOldBattles(maxAgeMinutes = 30) {
  const now = Date.now();
  const maxAge = maxAgeMinutes * 60 * 1000;
  let cleaned = 0;

  for (const [battleId, battle] of battleSessions.entries()) {
    // Extrair timestamp do battleId (formato: treino_TIMESTAMP_random)
    const timestamp = parseInt(battleId.split('_')[1]);
    if (!isNaN(timestamp) && (now - timestamp) > maxAge) {
      battleSessions.delete(battleId);
      cleaned++;
    }
  }

  if (isLogEnabled() && cleaned > 0) {
    console.log(`[SESSION STORAGE] CLEANUP: ${cleaned} batalhas antigas removidas`);
  }

  return cleaned;
}

export default {
  setBattle,
  getBattle,
  deleteBattle,
  getAllBattles,
  getBattleCount,
  clearAllBattles,
  cleanupOldBattles,
  enableSessionLogs
};
