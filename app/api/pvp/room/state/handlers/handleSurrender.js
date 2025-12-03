import { NextResponse } from 'next/server';
import { updateDocument } from '@/lib/firebase/firestore';
import { adicionarLogBatalha } from '../utils';

/**
 * Handler para ação 'surrender'
 * Jogador se rende, oponente vence automaticamente
 */
export async function handleSurrender({ room, isHost }) {
  // Verificar se sala está ativa
  if (room.status !== 'active') {
    return NextResponse.json(
      { error: 'Batalha não está ativa' },
      { status: 400 }
    );
  }

  // Log de rendição
  const meuNome = isHost ? room.host_nome : room.guest_nome;
  const oponenteNome = isHost ? room.guest_nome : room.host_nome;
  const battleLog = adicionarLogBatalha(room.battle_log || [], {
    acao: 'surrender',
    jogador: meuNome,
    vencedor: oponenteNome
  });

  // Marcar como finalizada e o oponente como vencedor
  const opponentRole = isHost ? 'guest' : 'host';
  await updateDocument('pvp_duel_rooms', room.id, {
    status: 'finished',
    winner: opponentRole,
    battle_log: battleLog
  });

  return NextResponse.json({
    success: true,
    message: 'Você se rendeu. O oponente venceu!',
    winner: opponentRole
  });
}
