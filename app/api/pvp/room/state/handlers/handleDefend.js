import { NextResponse } from 'next/server';
import { updateDocument } from '@/lib/firebase/firestore';
import { adicionarLogBatalha } from '../utils';

/**
 * Handler para ação 'defend'
 * Ativa defesa (reduz dano em 50%) e recupera energia (+20)
 */
export async function handleDefend({ room, role, isHost }) {
  // Verificar se é seu turno
  if (room.current_turn !== role) {
    return NextResponse.json(
      { error: 'Não é seu turno!' },
      { status: 400 }
    );
  }

  // Verificar se sala está ativa
  if (room.status !== 'active') {
    return NextResponse.json(
      { error: 'Batalha não está ativa' },
      { status: 400 }
    );
  }

  const myEnergyField = isHost ? 'host_energy' : 'guest_energy';
  const myDefendingField = isHost ? 'host_defending' : 'guest_defending';
  const currentEnergy = room[myEnergyField] ?? 100;

  // Recuperar energia (+20, max 100)
  const newEnergy = Math.min(100, currentEnergy + 20);
  const energyGained = newEnergy - currentEnergy;

  // Log de defesa
  const meuNome = isHost ? room.host_nome : room.guest_nome;
  const battleLog = adicionarLogBatalha(room.battle_log || [], {
    acao: 'defend',
    jogador: meuNome,
    energiaRecuperada: energyGained
  });

  const updates = {
    [myEnergyField]: newEnergy,
    [myDefendingField]: true, // Ativa defesa
    current_turn: isHost ? 'guest' : 'host', // Passa o turno
    battle_log: battleLog
  };

  await updateDocument('pvp_duel_rooms', room.id, updates);

  return NextResponse.json({
    success: true,
    newEnergy,
    energyGained
  });
}
