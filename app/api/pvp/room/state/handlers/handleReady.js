import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';
import { calcularEnergiaComSinergia } from '@/lib/combat/synergyApplicator';

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
    // Calcular energia máxima baseada nas sinergias
    const hostModificadores = updatedRoom.host_sinergia?.modificadores || {};
    const guestModificadores = updatedRoom.guest_sinergia?.modificadores || {};

    // Aplicar modificadores de sinergia e redução do oponente
    let hostEnergyMax = calcularEnergiaComSinergia(100, hostModificadores);
    let guestEnergyMax = calcularEnergiaComSinergia(100, guestModificadores);

    // Aplicar redução de energia causada pelo oponente
    if (guestModificadores.energia_inimigo_reducao) {
      hostEnergyMax = Math.floor(hostEnergyMax * (1 - guestModificadores.energia_inimigo_reducao));
    }
    if (hostModificadores.energia_inimigo_reducao) {
      guestEnergyMax = Math.floor(guestEnergyMax * (1 - hostModificadores.energia_inimigo_reducao));
    }

    // Determinar quem começa baseado na agilidade
    const hostAvatar = updatedRoom.host_avatar;
    const guestAvatar = updatedRoom.guest_avatar;

    // Calcular agilidade efetiva com sinergias
    const hostAgilidade = Math.floor(hostAvatar.agilidade * (1 + (hostModificadores.agilidade || 0)));
    const guestAgilidade = Math.floor(guestAvatar.agilidade * (1 + (guestModificadores.agilidade || 0)));

    // Quem tem maior agilidade começa (em caso de empate, host tem vantagem)
    const firstTurn = guestAgilidade > hostAgilidade ? 'guest' : 'host';

    await updateDocument('pvp_duel_rooms', roomId, {
      status: 'active',
      current_turn: firstTurn, // Avatar com maior agilidade começa
      host_energy: hostEnergyMax,
      host_energy_max: hostEnergyMax,
      guest_energy: guestEnergyMax,
      guest_energy_max: guestEnergyMax
    });
  }

  return NextResponse.json({ success: true, message: 'Pronto!' });
}
