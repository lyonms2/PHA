/**
 * Armazenamento global de sessões de batalha
 * Singleton para garantir persistência entre requisições
 */

// Singleton - apenas uma instância para todo o servidor
const battleSessions = new Map();

// Log de debug
let logEnabled = false;

export function enableSessionLogs() {
  logEnabled = true;
}

export function setBattle(battleId, battleData) {
  if (logEnabled) {
    console.log(`[SESSION STORAGE] SET: ${battleId}`, {
      status: battleData.status,
      player: battleData.player?.nome,
      ia: battleData.ia?.nome
    });
  }
  battleSessions.set(battleId, battleData);
  if (logEnabled) {
    console.log(`[SESSION STORAGE] Total de batalhas ativas: ${battleSessions.size}`);
  }
}

export function getBattle(battleId) {
  const battle = battleSessions.get(battleId);
  if (logEnabled) {
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
  if (logEnabled) {
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
  if (logEnabled) {
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

  if (logEnabled && cleaned > 0) {
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
