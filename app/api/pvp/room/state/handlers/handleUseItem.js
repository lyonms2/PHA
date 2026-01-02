import { NextResponse } from 'next/server';
import { updateDocument, deleteDocument, getDocument } from '@/lib/firebase/firestore';
import { adicionarLogBatalha } from '../utils';

/**
 * Handler para ação 'useItem'
 * Usa poção de HP durante a batalha: restaura HP e passa o turno
 */
export async function handleUseItem({ room, role, isHost, inventoryItemId, itemId }) {
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

  // Buscar item do inventário
  const inventoryItem = await getDocument('player_inventory', inventoryItemId);
  if (!inventoryItem) {
    return NextResponse.json(
      { error: 'Item não encontrado no inventário' },
      { status: 404 }
    );
  }

  // Buscar detalhes do item
  const item = await getDocument('items', itemId);
  if (!item) {
    return NextResponse.json(
      { error: 'Item não encontrado' },
      { status: 404 }
    );
  }

  // Verificar se é poção de HP
  const efeito = item.efeito;
  if (efeito !== 'hp' && efeito !== 'cura_hp') {
    return NextResponse.json(
      { error: 'Apenas poções de HP podem ser usadas em batalha' },
      { status: 400 }
    );
  }

  // Verificar limite de 2 itens por batalha
  const itemsUsedField = isHost ? 'host_items_used' : 'guest_items_used';
  const itemsUsed = room[itemsUsedField] ?? 0;
  if (itemsUsed >= 2) {
    return NextResponse.json(
      { error: 'Você já usou o máximo de 2 itens nesta batalha!' },
      { status: 400 }
    );
  }

  // Pegar HP atual
  const myHpField = isHost ? 'host_hp' : 'guest_hp';
  const myHpMaxField = isHost ? 'host_hp_max' : 'guest_hp_max';
  const currentHp = room[myHpField] ?? 100;
  const maxHp = room[myHpMaxField] ?? 100;

  // Verificar se já está com HP cheio
  if (currentHp >= maxHp) {
    return NextResponse.json(
      { error: 'HP já está no máximo!' },
      { status: 400 }
    );
  }

  // Calcular HP curado
  const hpCurado = Math.min(item.valor_efeito, maxHp - currentHp);
  const newHp = currentHp + hpCurado;

  // Consumir item do inventário
  if (inventoryItem.quantidade > 1) {
    // Reduzir quantidade
    await updateDocument('player_inventory', inventoryItemId, {
      quantidade: inventoryItem.quantidade - 1,
      updated_at: new Date().toISOString()
    });
  } else {
    // Remover item do inventário
    await deleteDocument('player_inventory', inventoryItemId);
  }

  // Adicionar log
  const meuNome = isHost ? room.host_nome : room.guest_nome;
  const battleLog = adicionarLogBatalha(room.battle_log || [], {
    acao: 'useItem',
    jogador: meuNome,
    item: item.nome,
    hpCurado,
    hpAnterior: currentHp,
    hpNovo: newHp
  });

  // Incrementar contador de itens usados
  const newItemsUsed = itemsUsed + 1;

  // Atualizar sala
  await updateDocument('pvp_duel_rooms', room.id, {
    [myHpField]: newHp,
    [itemsUsedField]: newItemsUsed,
    current_turn: isHost ? 'guest' : 'host',
    battle_log: battleLog
  });

  return NextResponse.json({
    success: true,
    hpCurado,
    hpAnterior: currentHp,
    hpNovo: newHp,
    hpMaximo: maxHp,
    itemsUsed: newItemsUsed,
    itemsMax: 2
  });
}
