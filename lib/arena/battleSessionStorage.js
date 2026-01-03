/**
 * Armazenamento de sessões de batalha usando Firestore
 * Para ambientes serverless (Vercel)
 */

import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

const COLLECTION = 'battle_sessions';

console.log('🚀 [STORAGE] Módulo battleSessionStorage (Firestore) carregado');

export async function setBattle(battleId, battleData) {
  console.log(`🔵 [SESSION STORAGE] SET CHAMADO: ${battleId}`);

  try {
    const docRef = doc(db, COLLECTION, battleId);
    await setDoc(docRef, {
      ...battleData,
      _createdAt: Date.now(),
      _lastUpdated: Date.now()
    });

    console.log(`✅ [SESSION STORAGE] Batalha salva no Firestore: ${battleId}`);
  } catch (error) {
    console.error(`❌ [SESSION STORAGE] Erro ao salvar batalha:`, error);
    throw error;
  }
}

export async function getBattle(battleId) {
  console.log(`🔍 [SESSION STORAGE] GET CHAMADO: ${battleId}`);

  try {
    const docRef = doc(db, COLLECTION, battleId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log(`✅ [SESSION STORAGE] Batalha encontrada: ${battleId}`);
      const data = docSnap.data();

      // Remover campos internos
      delete data._createdAt;
      delete data._lastUpdated;

      return data;
    } else {
      console.log(`❌ [SESSION STORAGE] Batalha NÃO encontrada: ${battleId}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ [SESSION STORAGE] Erro ao buscar batalha:`, error);
    return null;
  }
}

export async function deleteBattle(battleId) {
  console.log(`🗑️ [SESSION STORAGE] DELETE CHAMADO: ${battleId}`);

  try {
    const docRef = doc(db, COLLECTION, battleId);
    await deleteDoc(docRef);
    console.log(`✅ [SESSION STORAGE] Batalha deletada: ${battleId}`);
    return true;
  } catch (error) {
    console.error(`❌ [SESSION STORAGE] Erro ao deletar batalha:`, error);
    return false;
  }
}

export function enableSessionLogs() {
  console.log('🔧 [STORAGE] Logs sempre habilitados (Firestore)');
}

export function getBattleCount() {
  // Não implementado para Firestore (requer query)
  return 0;
}

export function getAllBattles() {
  // Não implementado para Firestore (requer query)
  return [];
}

export function clearAllBattles() {
  // Não implementado para Firestore (requer query)
  console.warn('clearAllBattles não implementado para Firestore');
  return 0;
}

export function cleanupOldBattles(maxAgeMinutes = 30) {
  // Implementar cleanup via Cloud Function ou manual
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
