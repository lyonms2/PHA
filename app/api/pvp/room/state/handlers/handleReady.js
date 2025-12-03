import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';

/**
 * Handler para ação 'ready'
 * Marca jogador como pronto. Quando ambos estão prontos, inicia a batalha.
 */
export async function handleReady({ roomId, isHost }) {
  const field = isHost ? 'host_ready' : 'guest_ready';
  await updateDocument('pvp_duel_rooms', roomId, {
    [field]: true
  });

  // Verificar se ambos estão prontos
  const updatedRoom = await getDocument('pvp_duel_rooms', roomId);
  if (updatedRoom.host_ready && updatedRoom.guest_ready) {
    await updateDocument('pvp_duel_rooms', roomId, {
      status: 'active',
      current_turn: 'host' // Host começa
    });
  }

  return NextResponse.json({ success: true, message: 'Pronto!' });
}
