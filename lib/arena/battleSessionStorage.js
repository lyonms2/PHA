/**
 * Armazenamento de sessões de batalha usando Firestore
 * Para ambientes serverless (Vercel)
 */

import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

const COLLECTION = 'battle_sessions';

/**
 * Serializa o objeto de batalha para Firestore
 * Remove funções e converte para JSON puro
 */
function serializeBattle(battleData) {
  try {
    const serialized = JSON.parse(JSON.stringify(battleData));
    return serialized;
  } catch (error) {
    console.error('❌ [STORAGE] Erro ao serializar batalha:', error);
    throw error;
  }
}

export async function setBattle(battleId, battleData) {
  try {
    const serialized = serializeBattle(battleData);
    const docRef = doc(db, COLLECTION, battleId);
    await setDoc(docRef, {
      ...serialized,
      _createdAt: Date.now(),
      _lastUpdated: Date.now()
    });
  } catch (error) {
    console.error(`❌ [STORAGE] Erro ao salvar batalha ${battleId}:`, error);
    throw error;
  }
}

export async function getBattle(battleId) {
  try {
    const docRef = doc(db, COLLECTION, battleId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      delete data._createdAt;
      delete data._lastUpdated;
      return data;
    } else {
      console.error(`❌ Batalha ${battleId} não encontrada`);
      return null;
    }
  } catch (error) {
    console.error(`❌ [STORAGE] Erro ao buscar batalha:`, error);
    return null;
  }
}

export async function deleteBattle(battleId) {
  try {
    const docRef = doc(db, COLLECTION, battleId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error(`❌ [STORAGE] Erro ao deletar batalha:`, error);
    return false;
  }
}

export function enableSessionLogs() {
  // Logs removidos - use console do navegador
}

export function getBattleCount() {
  return 0;
}

export function getAllBattles() {
  return [];
}

export function clearAllBattles() {
  console.warn('clearAllBattles não implementado para Firestore');
  return 0;
}

export function cleanupOldBattles(maxAgeMinutes = 30) {
  console.warn('cleanupOldBattles deve ser executado via Cloud Function');
  return 0;
}

export default {
  setBattle,
  getBattle,
  deleteBattle,
  enableSessionLogs,
  getBattleCount,
  getAllBattles,
  clearAllBattles,
  cleanupOldBattles
};
